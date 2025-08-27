"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { BarChart3 } from "lucide-react"

interface BPDistributionChartProps {
  patientId?: string
  title?: string
  description?: string
}

export default function BPDistributionChart({
  patientId,
  title = "Blood Pressure Distribution",
  description = "Breakdown of readings by category",
}: BPDistributionChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState("90")
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const COLORS = {
    Normal: "hsl(var(--chart-2))",
    Elevated: "hsl(var(--chart-3))",
    "Stage 1": "hsl(var(--chart-4))",
    "Stage 2": "hsl(var(--chart-5))",
  }

  useEffect(() => {
    fetchChartData()
  }, [patientId, timeRange])

  const getBPCategory = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) return "Normal"
    if (systolic < 130 && diastolic < 80) return "Elevated"
    if (systolic < 140 || diastolic < 90) return "Stage 1"
    return "Stage 2"
  }

  const fetchChartData = async () => {
    setIsLoading(true)
    try {
      const days = Number.parseInt(timeRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      let query = supabase
        .from("blood_pressure_readings")
        .select("systolic, diastolic")
        .gte("recorded_at", startDate.toISOString())

      if (patientId) {
        query = query.eq("patient_id", patientId)
      }

      const { data } = await query

      if (data) {
        // Categorize readings
        const categories = data.reduce((acc: any, reading: any) => {
          const category = getBPCategory(reading.systolic, reading.diastolic)
          acc[category] = (acc[category] || 0) + 1
          return acc
        }, {})

        // Format for chart
        const formattedData = Object.entries(categories).map(([name, value]) => ({
          name,
          value: value as number,
          percentage: Math.round(((value as number) / data.length) * 100),
        }))

        setChartData(formattedData)
      }
    } catch (error) {
      console.error("Error fetching distribution data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">Count: {data.value}</p>
          <p className="text-sm">Percentage: {data.percentage}%</p>
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (percentage < 5) return null // Don't show labels for small slices

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${percentage}%`}
      </text>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No data available</h3>
            <p className="text-muted-foreground">No blood pressure readings found for the selected time period</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
