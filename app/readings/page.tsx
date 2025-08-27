import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ReadingsList from "@/components/readings/readings-list"

export default async function ReadingsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile to determine permissions
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  const canEdit = ["doctor", "nurse", "admin"].includes(profile.role)
  const canAdd = ["patient", "doctor", "nurse", "admin"].includes(profile.role)
  const showPatientInfo = ["doctor", "nurse", "admin"].includes(profile.role)
  const patientId = profile.role === "patient" ? data.user.id : undefined

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Blood Pressure Readings</h1>
          <p className="text-muted-foreground">
            {profile.role === "patient"
              ? "View and manage your blood pressure readings"
              : "Monitor and manage patient blood pressure readings"}
          </p>
        </div>

        <ReadingsList
          patientId={patientId}
          showPatientInfo={showPatientInfo}
          canEdit={canEdit}
          canAdd={canAdd}
          title="All Readings"
          description={
            profile.role === "patient"
              ? "Your complete blood pressure history"
              : "Complete blood pressure readings from all patients"
          }
        />
      </div>
    </div>
  )
}
