"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, TrendingUp, Calendar, Plus, LogOut, User, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import AddReadingForm from "@/components/forms/add-reading-form"
import EditReadingForm from "@/components/forms/edit-reading-form"
import BPTrendChart from "@/components/charts/bp-trend-chart"

interface PatientDashboardProps {
  user: any
  profile: any
}

export default function PatientDashboard({ user, profile }: PatientDashboardProps) {
  const [readings, setReadings] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, avgSystolic: 0, avgDiastolic: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchReadings()
  }, [])

  const fetchReadings = async () => {
    try {
      const { data: readingsData } = await supabase
        .from("blood_pressure_readings")
        .select("*")
        .eq("patient_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(10)

      if (readingsData) {
        setReadings(readingsData)

        // Calculate stats
        const total = readingsData.length
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

        const thisWeek = readingsData.filter((r) => new Date(r.recorded_at) > oneWeekAgo).length
        const avgSystolic =
          readingsData.length > 0
            ? Math.round(readingsData.reduce((sum, r) => sum + r.systolic, 0) / readingsData.length)
            : 0
        const avgDiastolic =
          readingsData.length > 0
            ? Math.round(readingsData.reduce((sum, r) => sum + r.diastolic, 0) / readingsData.length)
            : 0

        setStats({ total, thisWeek, avgSystolic, avgDiastolic })
      }
    } catch (error) {
      console.error("Error fetching readings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const getBPCategory = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) return { label: "Normal", color: "bg-green-100 text-green-800" }
    if (systolic < 130 && diastolic < 80) return { label: "Elevated", color: "bg-yellow-100 text-yellow-800" }
    if (systolic < 140 || diastolic < 90) return { label: "Stage 1", color: "bg-orange-100 text-orange-800" }
    return { label: "Stage 2", color: "bg-red-100 text-red-800" }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/[0.01] to-accent/[0.01]">
      {/* Header */}
      <header className="medical-header sticky top-0 z-50 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Patient Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {profile.first_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/analytics">
                <Button variant="outline" size="sm" className="bg-card/50 hover:bg-card border-border/50">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="bg-card/50 hover:bg-card border-border/50">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="bg-card/50 hover:bg-card border-border/50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="medical-card hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Readings</CardTitle>
              <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <Heart className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card className="medical-card hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">This Week</CardTitle>
              <div className="p-2 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20">
                <Calendar className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.thisWeek}</div>
              <p className="text-xs text-muted-foreground">New readings</p>
            </CardContent>
          </Card>

          <Card className="medical-card hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Avg Systolic</CardTitle>
              <div className="p-2 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.avgSystolic}</div>
              <p className="text-xs text-muted-foreground">mmHg</p>
            </CardContent>
          </Card>

          <Card className="medical-card hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Avg Diastolic</CardTitle>
              <div className="p-2 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-lg border border-orange-500/20">
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.avgDiastolic}</div>
              <p className="text-xs text-muted-foreground">mmHg</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Readings */}
          <div className="lg:col-span-2 space-y-8">
            {/* Chart */}
            <BPTrendChart
              patientId={user.id}
              title="Your Blood Pressure Trends"
              description="Track your blood pressure changes over time"
            />

            {/* Recent Readings List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Blood Pressure Readings</CardTitle>
                    <CardDescription>Your latest measurements and trends</CardDescription>
                  </div>
                  <AddReadingForm patientId={user.id} onSuccess={fetchReadings} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
                    ))}
                  </div>
                ) : readings.length > 0 ? (
                  <div className="space-y-4">
                    {readings.map((reading) => {
                      const category = getBPCategory(reading.systolic, reading.diastolic)
                      return (
                        <div key={reading.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold">
                                {reading.systolic}/{reading.diastolic}
                              </div>
                              <div className="text-sm text-muted-foreground">mmHg</div>
                            </div>
                            <div>
                              <Badge className={category.color}>{category.label}</Badge>
                              {reading.pulse && (
                                <p className="text-sm text-muted-foreground mt-1">Pulse: {reading.pulse} bpm</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="text-sm font-medium">
                                  {new Date(reading.recorded_at).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(reading.recorded_at).toLocaleTimeString()}
                                </p>
                              </div>
                              <EditReadingForm reading={reading} onSuccess={fetchReadings} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No readings yet</h3>
                    <p className="text-muted-foreground mb-4">Start tracking your blood pressure today</p>
                    <AddReadingForm patientId={user.id} onSuccess={fetchReadings} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AddReadingForm
                  patientId={user.id}
                  onSuccess={fetchReadings}
                  trigger={
                    <Button className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      Record New Reading
                    </Button>
                  }
                />
                <Link href="/analytics">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Blood Pressure Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Normal</span>
                  <Badge className="bg-green-100 text-green-800">&lt;120/80</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Elevated</span>
                  <Badge className="bg-yellow-100 text-yellow-800">120-129/&lt;80</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Stage 1</span>
                  <Badge className="bg-orange-100 text-orange-800">130-139/80-89</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Stage 2</span>
                  <Badge className="bg-red-100 text-red-800">≥140/90</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
