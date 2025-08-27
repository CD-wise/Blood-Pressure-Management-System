import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import PatientDashboard from "@/components/dashboards/patient-dashboard"
import DoctorDashboard from "@/components/dashboards/doctor-dashboard"
import NurseDashboard from "@/components/dashboards/nurse-dashboard"
import AdminDashboard from "@/components/dashboards/admin-dashboard"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    console.log("[v0] Dashboard: No user found, redirecting to login", { error, user: data?.user })
    redirect("/auth/login")
  }

  let profile = null
  let retryCount = 0
  const maxRetries = 3

  while (!profile && retryCount < maxRetries) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (profileError) {
      console.log("[v0] Dashboard: Profile fetch error", {
        error: profileError,
        userId: data.user.id,
        retry: retryCount,
      })

      // If profile doesn't exist, create it with default patient role
      if (profileError.code === "PGRST116") {
        // No rows returned
        console.log("[v0] Dashboard: Creating missing profile for user", data.user.id)
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User",
            role: "patient", // Default role
          })
          .select()
          .single()

        if (createError) {
          console.log("[v0] Dashboard: Failed to create profile", createError)
          retryCount++
          continue
        }
        profile = newProfile
      } else {
        retryCount++
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    } else {
      profile = profileData
    }
  }

  if (!profile) {
    console.log("[v0] Dashboard: No profile found after retries, redirecting to login")
    redirect("/auth/login")
  }

  console.log("[v0] Dashboard: Successfully loaded profile", { userId: data.user.id, role: profile.role })

  // Render appropriate dashboard based on role
  switch (profile.role) {
    case "patient":
      return <PatientDashboard user={data.user} profile={profile} />
    case "doctor":
      return <DoctorDashboard user={data.user} profile={profile} />
    case "nurse":
      return <NurseDashboard user={data.user} profile={profile} />
    case "admin":
      return <AdminDashboard user={data.user} profile={profile} />
    default:
      console.log("[v0] Dashboard: Invalid role, redirecting to login", { role: profile.role })
      redirect("/auth/login")
  }
}
