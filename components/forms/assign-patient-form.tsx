"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"

interface AssignPatientFormProps {
  onClose: () => void
  onSuccess: () => void
  currentUserId: string
}

export default function AssignPatientForm({ onClose, onSuccess, currentUserId }: AssignPatientFormProps) {
  const [patients, setPatients] = useState<any[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState("")
  const [selectedProvider, setSelectedProvider] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Get unassigned patients
      const { data: allPatients } = await supabase.from("profiles").select("*").eq("role", "patient")

      // Get assigned patient IDs
      const { data: assignments } = await supabase
        .from("doctor_patient_relationships")
        .select("patient_id")
        .eq("is_active", true)

      const assignedPatientIds = assignments?.map((a) => a.patient_id) || []
      const unassignedPatients = allPatients?.filter((p) => !assignedPatientIds.includes(p.id)) || []

      // Get healthcare providers
      const { data: healthcareProviders } = await supabase
        .from("profiles")
        .select("*")
        .in("role", ["doctor", "nurse"])
        .eq("status", "active")

      setPatients(unassignedPatients)
      setProviders(healthcareProviders || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient || !selectedProvider) return

    setIsLoading(true)
    setError("")

    try {
      const { data, error: assignError } = await supabase.rpc("assign_patient_to_provider", {
        patient_user_id: selectedPatient,
        provider_user_id: selectedProvider,
        assigned_by_user_id: currentUserId,
      })

      if (assignError) throw assignError

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Error assigning patient:", error)
      setError(error.message || "An error occurred while assigning the patient")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Assign Patient to Provider</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>}

            <div>
              <Label htmlFor="patient">Select Patient *</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="provider">Select Healthcare Provider *</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.first_name} {provider.last_name} ({provider.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !selectedPatient || !selectedProvider}>
                {isLoading ? "Assigning..." : "Assign Patient"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
