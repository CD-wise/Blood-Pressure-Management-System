"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Stethoscope, Users, TrendingUp, AlertTriangle, Search, LogOut, User, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface DoctorDashboardProps {
  user: any
  profile: any
}

export default function DoctorDashboard({ user, profile }: DoctorDashboardProps) {
  const [patients, setPatients] = useState<any[]>([])
  const [stats, setStats] = useState({ totalPatients: 0, highRisk: 0, recentReadings: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchDoctorData()
  }, [])

  const fetchDoctorData = async () => {
    try {
      // Get doctor's patients
      const { data: relationships } = await supabase
        .from("doctor_patient_relationships")
        .select(`
          patient_id,
          profiles!doctor_patient_relationships_patient_id_fkey (
            id, first_name, last_name, phone
          )
        `)
        .eq("doctor_id", user.id)
        .eq("is_active", true)

      if (relationships) {
        const patientIds = relationships.map((r) => r.patient_id)

        // Get recent readings for these patients
        const { data: readings } = await supabase
          .from("blood_pressure_readings")
          .select("*")
          .in("patient_id", patientIds)
          .order("recorded_at", { ascending: false })

        // Process patient data with latest readings
        const patientsWithReadings = relationships.map((rel) => {
          const patientReadings = readings?.filter((r) => r.patient_id === rel.patient_id) || []
          const latestReading = patientReadings[0]

          return {
            ...rel.profiles,
            latestReading,
            readingsCount: patientReadings.length,
            isHighRisk: latestReading && (latestReading.systolic >= 140 || latestReading.diastolic >= 90),
          }
        })

        setPatients(patientsWithReadings)

        // Calculate stats
        const totalPatients = patientsWithReadings.length
        const highRisk = patientsWithReadings.filter((p) => p.isHighRisk).length
        const recentReadings =
          readings?.filter((r) => {
            const readingDate = new Date(r.recorded_at)
            const oneDayAgo = new Date()
            oneDayAgo.setDate(oneDayAgo.getDate() - 1)
            return readingDate > oneDayAgo
          }).length || 0

        setStats({ totalPatients, highRisk, recentReadings })
      }
    } catch (error) {
      console.error("Error fetching doctor data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const filteredPatients = patients.filter((patient) =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getBPCategory = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) return { label: "Normal", color: "bg-green-100 text-green-800" }
    if (systolic < 130 && diastolic < 80) return { label: "Elevated", color: "bg-yellow-100 text-yellow-800" }
    if (systolic < 140 || diastolic < 90) return { label: "Stage 1", color: "bg-orange-100 text-orange-800" }
    return { label: "Stage 2", color: "bg-red-100 text-red-800" }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Doctor Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Dr. {profile.first_name} {profile.last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/analytics">
                <Button variant="outline" size="sm" className="bg-transparent">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground">Under your care</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Patients</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.highRisk}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Readings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentReadings}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Patient List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Patient Overview</CardTitle>
                <CardDescription>Monitor your patients' blood pressure status</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted/50 rounded animate-pulse" />
                ))}
              </div>
            ) : filteredPatients.length > 0 ? (
              <div className="space-y-4">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {patient.first_name} {patient.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{patient.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {patient.latestReading ? (
                        <div className="text-center">
                          <div className="font-medium">
                            {patient.latestReading.systolic}/{patient.latestReading.diastolic}
                          </div>
                          <Badge
                            className={
                              getBPCategory(patient.latestReading.systolic, patient.latestReading.diastolic).color
                            }
                          >
                            {getBPCategory(patient.latestReading.systolic, patient.latestReading.diastolic).label}
                          </Badge>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">No readings</div>
                        </div>
                      )}

                      <div className="text-right">
                        <p className="text-sm font-medium">{patient.readingsCount} readings</p>
                        {patient.latestReading && (
                          <p className="text-sm text-muted-foreground">
                            {new Date(patient.latestReading.recorded_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <Button variant="outline" size="sm" className="bg-transparent">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No patients found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Try adjusting your search terms" : "No patients assigned to you yet"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
