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
import { Heart, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface EditReadingFormProps {
  reading: any
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export default function EditReadingForm({ reading, onSuccess, trigger }: EditReadingFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    systolic: reading.systolic.toString(),
    diastolic: reading.diastolic.toString(),
    pulse: reading.pulse?.toString() || "",
    location: reading.location || "",
    notes: reading.notes || "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
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

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setError(null)

    try {
      const updateData = {
        systolic: Number.parseInt(formData.systolic),
        diastolic: Number.parseInt(formData.diastolic),
        pulse: formData.pulse ? Number.parseInt(formData.pulse) : null,
        location: formData.location || null,
        notes: formData.notes || null,
      }

      const { error } = await supabase.from("blood_pressure_readings").update(updateData).eq("id", reading.id)

      if (error) throw error

      setIsOpen(false)
      if (onSuccess) onSuccess()
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this reading? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const { error } = await supabase.from("blood_pressure_readings").delete().eq("id", reading.id)

      if (error) throw error

      setIsOpen(false)
      if (onSuccess) onSuccess()
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="bg-transparent">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Edit Blood Pressure Reading
          </DialogTitle>
          <DialogDescription>
            Modify the blood pressure measurement details. Recorded on{" "}
            {new Date(reading.recorded_at).toLocaleDateString()}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="systolic">Systolic (mmHg)</Label>
              <Input
                id="systolic"
                type="number"
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
              {isLoading ? "Updating..." : "Update Reading"}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting} className="px-3">
              {isDeleting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
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
