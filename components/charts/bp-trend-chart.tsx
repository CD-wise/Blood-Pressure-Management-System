"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { TrendingUp, Calendar } from "lucide-react"

interface BPTrendChartProps {
  patientId?: string
  title?: string
  description?: string
}

export default function BPTrendChart({
  patientId,
  title = "Blood Pressure Trends",
  description = "Track blood pressure changes over time",
}: BPTrendChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState("30")
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchChartData()
  }, [patientId, timeRange])

  const fetchChartData = async () => {
    setIsLoading(true)
    try {
      const days = Number.parseInt(timeRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      let query = supabase
        .from("blood_pressure_readings")
        .select("*")
        .gte("recorded_at", startDate.toISOString())
        .order("recorded_at", { ascending: true })

      if (patientId) {
        query = query.eq("patient_id", patientId)
      }

      const { data } = await query

      if (data) {
        // Group readings by date and calculate averages
        const groupedData = data.reduce((acc: any, reading: any) => {
          const date = new Date(reading.recorded_at).toLocaleDateString()

          if (!acc[date]) {
            acc[date] = {
              date,
              readings: [],
              systolic: 0,
              diastolic: 0,
              pulse: 0,
              count: 0,
            }
          }

          acc[date].readings.push(reading)
          acc[date].systolic += reading.systolic
          acc[date].diastolic += reading.diastolic
          acc[date].pulse += reading.pulse || 0
          acc[date].count += 1

          return acc
        }, {})

        // Calculate averages and format for chart
        const formattedData = Object.values(groupedData).map((group: any) => ({
          date: group.date,
          systolic: Math.round(group.systolic / group.count),
          diastolic: Math.round(group.diastolic / group.count),
          pulse: group.pulse > 0 ? Math.round(group.pulse / group.count) : null,
          count: group.count,
        }))

        setChartData(formattedData)
      }
    } catch (error) {
      console.error("Error fetching chart data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-chart-1">Systolic:</span> {payload[0]?.value} mmHg
            </p>
            <p className="text-sm">
              <span className="text-chart-2">Diastolic:</span> {payload[1]?.value} mmHg
            </p>
            {payload[2]?.value && (
              <p className="text-sm">
                <span className="text-chart-3">Pulse:</span> {payload[2].value} bpm
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {payload[0]?.payload?.count} reading{payload[0]?.payload?.count !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                <YAxis
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                  domain={["dataMin - 10", "dataMax + 10"]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="systolic"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                  name="Systolic"
                />
                <Line
                  type="monotone"
                  dataKey="diastolic"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 4 }}
                  name="Diastolic"
                />
                {chartData.some((d) => d.pulse) && (
                  <Line
                    type="monotone"
                    dataKey="pulse"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2, r: 4 }}
                    name="Pulse"
                    connectNulls={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex flex-col items-center justify-center text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No data available</h3>
            <p className="text-muted-foreground">No blood pressure readings found for the selected time period</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
