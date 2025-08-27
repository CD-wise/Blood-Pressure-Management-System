"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Heart, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface AddReadingFormProps {
  patientId?: string
  recordedBy?: string
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export default function AddReadingForm({ patientId, recordedBy, onSuccess, trigger }: AddReadingFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    systolic: "",
    diastolic: "",
    pulse: "",
    location: "",
    notes: "",
    selectedPatientId: patientId || "",
  })
  const [patients, setPatients] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPatients, setIsLoadingPatients] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const fetchPatients = async () => {
    if (patientId) return // Don't fetch if patient is already specified

    setIsLoadingPatients(true)
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("role", "patient")
        .order("first_name")

      if (data) {
        setPatients(data)
      }
    } catch (error) {
      console.error("Error fetching patients:", error)
    } finally {
      setIsLoadingPatients(false)
    }
  }

  const validateForm = () => {
    const systolic = Number.parseInt(formData.systolic)
    const diastolic = Number.parseInt(formData.diastolic)
    const pulse = formData.pulse ? Number.parseInt(formData.pulse) : null

    if (!systolic || !diastolic) {
      setError("Systolic and diastolic readings are required")
      return false
    }

    if (systolic < 70 || systolic > 250) {
      setError("Systolic reading must be between 70 and 250 mmHg")
      return false
    }

    if (diastolic < 40 || diastolic > 150) {
      setError("Diastolic reading must be between 40 and 150 mmHg")
      return false
    }

    if (systolic <= diastolic) {
      setError("Systolic reading must be higher than diastolic reading")
      return false
    }

    if (pulse && (pulse < 40 || pulse > 200)) {
      setError("Pulse must be between 40 and 200 bpm")
      return false
    }

    if (!patientId && !formData.selectedPatientId) {
      setError("Please select a patient")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setError(null)

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Not authenticated")

      const readingData = {
        patient_id: patientId || formData.selectedPatientId,
        systolic: Number.parseInt(formData.systolic),
        diastolic: Number.parseInt(formData.diastolic),
        pulse: formData.pulse ? Number.parseInt(formData.pulse) : null,
        location: formData.location || null,
        notes: formData.notes || null,
        recorded_by: recordedBy || user.user.id,
      }

      const { error } = await supabase.from("blood_pressure_readings").insert([readingData])

      if (error) throw error

      // Reset form
      setFormData({
        systolic: "",
        diastolic: "",
        pulse: "",
        location: "",
        notes: "",
        selectedPatientId: patientId || "",
      })

      setIsOpen(false)
      if (onSuccess) onSuccess()
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && !patientId) {
      fetchPatients()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Reading
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Record Blood Pressure Reading
          </DialogTitle>
          <DialogDescription>Enter the blood pressure measurement details below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!patientId && (
            <div className="grid gap-2">
              <Label htmlFor="patient">Patient</Label>
              <Select
                value={formData.selectedPatientId}
                onValueChange={(value) => handleInputChange("selectedPatientId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingPatients ? "Loading patients..." : "Select a patient"} />
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
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="systolic">Systolic (mmHg)</Label>
              <Input
                id="systolic"
                type="number"
                placeholder="120"
                min="70"
                max="250"
                required
                value={formData.systolic}
                onChange={(e) => handleInputChange("systolic", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="diastolic">Diastolic (mmHg)</Label>
              <Input
                id="diastolic"
                type="number"
                placeholder="80"
                min="40"
                max="150"
                required
                value={formData.diastolic}
                onChange={(e) => handleInputChange("diastolic", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pulse">Pulse (bpm) - Optional</Label>
            <Input
              id="pulse"
              type="number"
              placeholder="72"
              min="40"
              max="200"
              value={formData.pulse}
              onChange={(e) => handleInputChange("pulse", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Where was this reading taken?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clinic">Clinic</SelectItem>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="hospital">Hospital</SelectItem>
                <SelectItem value="pharmacy">Pharmacy</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes - Optional</Label>
            <Textarea
              id="notes"
              placeholder="Any additional observations or notes..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Recording..." : "Record Reading"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="bg-transparent">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
