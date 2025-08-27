"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Search, Calendar, MapPin, User } from "lucide-react"
import AddReadingForm from "@/components/forms/add-reading-form"
import EditReadingForm from "@/components/forms/edit-reading-form"

interface ReadingsListProps {
  patientId?: string
  showPatientInfo?: boolean
  canEdit?: boolean
  canAdd?: boolean
  title?: string
  description?: string
}

export default function ReadingsList({
  patientId,
  showPatientInfo = false,
  canEdit = false,
  canAdd = false,
  title = "Blood Pressure Readings",
  description = "View and manage blood pressure measurements",
}: ReadingsListProps) {
  const [readings, setReadings] = useState<any[]>([])
  const [filteredReadings, setFilteredReadings] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchReadings()
  }, [patientId])

  useEffect(() => {
    filterReadings()
  }, [readings, searchTerm, dateFilter, categoryFilter])

  const fetchReadings = async () => {
    try {
      let query = supabase
        .from("blood_pressure_readings")
        .select(`
          *,
          profiles!blood_pressure_readings_patient_id_fkey (
            first_name, last_name
          )
        `)
        .order("recorded_at", { ascending: false })

      if (patientId) {
        query = query.eq("patient_id", patientId)
      }

      const { data } = await query

      if (data) {
        setReadings(data)
      }
    } catch (error) {
      console.error("Error fetching readings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterReadings = () => {
    let filtered = [...readings]

    // Search filter
    if (searchTerm && showPatientInfo) {
      filtered = filtered.filter((reading) =>
        `${reading.profiles?.first_name} ${reading.profiles?.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      )
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const cutoffDate = new Date()

      switch (dateFilter) {
        case "today":
          cutoffDate.setHours(0, 0, 0, 0)
          break
        case "week":
          cutoffDate.setDate(now.getDate() - 7)
          break
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1)
          break
        case "3months":
          cutoffDate.setMonth(now.getMonth() - 3)
          break
      }

      filtered = filtered.filter((reading) => new Date(reading.recorded_at) >= cutoffDate)
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((reading) => {
        const category = getBPCategory(reading.systolic, reading.diastolic)
        return category.label.toLowerCase().replace(" ", "") === categoryFilter
      })
    }

    setFilteredReadings(filtered)
  }

  const getBPCategory = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) return { label: "Normal", color: "bg-green-100 text-green-800" }
    if (systolic < 130 && diastolic < 80) return { label: "Elevated", color: "bg-yellow-100 text-yellow-800" }
    if (systolic < 140 || diastolic < 90) return { label: "Stage 1", color: "bg-orange-100 text-orange-800" }
    return { label: "Stage 2", color: "bg-red-100 text-red-800" }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {canAdd && <AddReadingForm patientId={patientId} onSuccess={fetchReadings} />}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          {showPatientInfo && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="elevated">Elevated</SelectItem>
              <SelectItem value="stage1">Stage 1</SelectItem>
              <SelectItem value="stage2">Stage 2</SelectItem>
            </SelectContent>
          </Select>
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
                    {showPatientInfo && (
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      {showPatientInfo && (
                        <h3 className="font-medium">
                          {reading.profiles?.first_name} {reading.profiles?.last_name}
                        </h3>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(reading.recorded_at).toLocaleDateString()}{" "}
                        {new Date(reading.recorded_at).toLocaleTimeString()}
                        {reading.location && (
                          <>
                            <MapPin className="h-4 w-4 ml-2" />
                            {reading.location}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {reading.systolic}/{reading.diastolic}
                      </div>
                      <div className="text-sm text-muted-foreground">mmHg</div>
                    </div>

                    <div className="text-center">
                      <Badge className={category.color}>{category.label}</Badge>
                      {reading.pulse && <p className="text-sm text-muted-foreground mt-1">{reading.pulse} bpm</p>}
                    </div>

                    {canEdit && <EditReadingForm reading={reading} onSuccess={fetchReadings} />}
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
              {searchTerm || dateFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your filters"
                : "No blood pressure readings recorded yet"}
            </p>
            {canAdd && <AddReadingForm patientId={patientId} onSuccess={fetchReadings} />}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
