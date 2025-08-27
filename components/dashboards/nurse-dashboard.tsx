"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Heart, Users, Search, LogOut, User, Clock, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import AddReadingForm from "@/components/forms/add-reading-form"

interface NurseDashboardProps {
  user: any
  profile: any
}

export default function NurseDashboard({ user, profile }: NurseDashboardProps) {
  const [recentReadings, setRecentReadings] = useState<any[]>([])
  const [stats, setStats] = useState({ todayReadings: 0, totalPatients: 0, avgReadings: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchNurseData()
  }, [])

  const fetchNurseData = async () => {
    try {
      // Get all readings recorded by this nurse
      const { data: readings } = await supabase
        .from("blood_pressure_readings")
        .select(`
          *,
          profiles!blood_pressure_readings_patient_id_fkey (
            first_name, last_name
          )
        `)
        .eq("recorded_by", user.id)
        .order("recorded_at", { ascending: false })
        .limit(20)

      if (readings) {
        setRecentReadings(readings)

        // Calculate stats
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const todayReadings = readings.filter((r) => new Date(r.recorded_at) >= today).length
        const uniquePatients = new Set(readings.map((r) => r.patient_id)).size
        const avgReadings = readings.length > 0 ? Math.round(readings.length / 7) : 0 // Weekly average

        setStats({ todayReadings, totalPatients: uniquePatients, avgReadings })
      }
    } catch (error) {
      console.error("Error fetching nurse data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const filteredReadings = recentReadings.filter((reading) =>
    `${reading.profiles?.first_name} ${reading.profiles?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()),
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
              <Heart className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Nurse Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Nurse {profile.first_name} {profile.last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <AddReadingForm onSuccess={fetchNurseData} />
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
              <CardTitle className="text-sm font-medium">Today's Readings</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayReadings}</div>
              <p className="text-xs text-muted-foreground">Recorded today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patients Served</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground">Unique patients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Average</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgReadings}</div>
              <p className="text-xs text-muted-foreground">Readings per week</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Readings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Blood Pressure Readings</CardTitle>
                <CardDescription>Readings you've recorded for patients</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by patient name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <AddReadingForm onSuccess={fetchNurseData} />
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
            ) : filteredReadings.length > 0 ? (
              <div className="space-y-4">
                {filteredReadings.map((reading) => {
                  const category = getBPCategory(reading.systolic, reading.diastolic)
                  return (
                    <div key={reading.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {reading.profiles?.first_name} {reading.profiles?.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {reading.location && `Recorded at ${reading.location}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-xl font-bold">
                            {reading.systolic}/{reading.diastolic}
                          </div>
                          <div className="text-sm text-muted-foreground">mmHg</div>
                        </div>

                        <div className="text-center">
                          <Badge className={category.color}>{category.label}</Badge>
                          {reading.pulse && <p className="text-sm text-muted-foreground mt-1">{reading.pulse} bpm</p>}
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-medium">{new Date(reading.recorded_at).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(reading.recorded_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No readings found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Try adjusting your search terms" : "Start recording patient readings"}
                </p>
                <AddReadingForm onSuccess={fetchNurseData} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
