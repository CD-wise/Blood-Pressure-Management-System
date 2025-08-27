import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import BPTrendChart from "@/components/charts/bp-trend-chart"
import BPDistributionChart from "@/components/charts/bp-distribution-chart"
import BPInsights from "@/components/analytics/bp-insights"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile to determine what data to show
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  const patientId = profile.role === "patient" ? data.user.id : undefined
  const showPatientData = profile.role === "patient"

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="gap-2 text-medical-primary hover:text-medical-primary/80 hover:bg-medical-primary/5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Blood Pressure Analytics</h1>
          <p className="text-muted-foreground">
            {showPatientData
              ? "Comprehensive analysis of your blood pressure trends and patterns"
              : "System-wide blood pressure analytics and insights"}
          </p>
        </div>

        <div className="space-y-8">
          {/* Insights */}
          <BPInsights
            patientId={patientId}
            title={showPatientData ? "Your Health Insights" : "System Health Overview"}
            description={
              showPatientData
                ? "Personalized analysis of your blood pressure patterns"
                : "Overall health trends across all patients"
            }
          />

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-8">
            <BPTrendChart
              patientId={patientId}
              title={showPatientData ? "Your BP Trends" : "System BP Trends"}
              description={
                showPatientData
                  ? "Track your blood pressure changes over time"
                  : "Overall blood pressure trends across all patients"
              }
            />
            <BPDistributionChart
              patientId={patientId}
              title={showPatientData ? "Your BP Categories" : "System BP Distribution"}
              description={
                showPatientData
                  ? "Breakdown of your readings by category"
                  : "Distribution of readings across all patients"
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
