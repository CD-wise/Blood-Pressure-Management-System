"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Activity } from "lucide-react"

interface BPInsightsProps {
  patientId?: string
  title?: string
  description?: string
}

export default function BPInsights({
  patientId,
  title = "Health Insights",
  description = "AI-powered analysis of blood pressure patterns",
}: BPInsightsProps) {
  const [insights, setInsights] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    generateInsights()
  }, [patientId])

  const generateInsights = async () => {
    setIsLoading(true)
    try {
      // Get recent readings (last 90 days)
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      let query = supabase
        .from("blood_pressure_readings")
        .select("*")
        .gte("recorded_at", ninetyDaysAgo.toISOString())
        .order("recorded_at", { ascending: true })

      if (patientId) {
        query = query.eq("patient_id", patientId)
      }

      const { data: readings } = await query

      if (readings && readings.length > 0) {
        const analysis = analyzeReadings(readings)
        setInsights(analysis)
      }
    } catch (error) {
      console.error("Error generating insights:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeReadings = (readings: any[]) => {
    const totalReadings = readings.length
    const recentReadings = readings.slice(-10) // Last 10 readings
    const olderReadings = readings.slice(0, -10)

    // Calculate averages
    const avgSystolic = Math.round(readings.reduce((sum, r) => sum + r.systolic, 0) / totalReadings)
    const avgDiastolic = Math.round(readings.reduce((sum, r) => sum + r.diastolic, 0) / totalReadings)

    // Calculate trends
    const recentAvgSystolic =
      recentReadings.length > 0
        ? Math.round(recentReadings.reduce((sum, r) => sum + r.systolic, 0) / recentReadings.length)
        : avgSystolic
    const recentAvgDiastolic =
      recentReadings.length > 0
        ? Math.round(recentReadings.reduce((sum, r) => sum + r.diastolic, 0) / recentReadings.length)
        : avgDiastolic

    const olderAvgSystolic =
      olderReadings.length > 0
        ? Math.round(olderReadings.reduce((sum, r) => sum + r.systolic, 0) / olderReadings.length)
        : avgSystolic
    const olderAvgDiastolic =
      olderReadings.length > 0
        ? Math.round(olderReadings.reduce((sum, r) => sum + r.diastolic, 0) / olderReadings.length)
        : avgDiastolic

    const systolicTrend = recentAvgSystolic - olderAvgSystolic
    const diastolicTrend = recentAvgDiastolic - olderAvgDiastolic

    // Categorize readings
    const categories = readings.reduce(
      (acc, reading) => {
        const category = getBPCategory(reading.systolic, reading.diastolic)
        acc[category] = (acc[category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Calculate risk level
    const highRiskReadings = (categories["Stage 1"] || 0) + (categories["Stage 2"] || 0)
    const riskPercentage = Math.round((highRiskReadings / totalReadings) * 100)

    // Generate recommendations
    const recommendations = generateRecommendations(
      avgSystolic,
      avgDiastolic,
      systolicTrend,
      diastolicTrend,
      riskPercentage,
    )

    return {
      totalReadings,
      avgSystolic,
      avgDiastolic,
      systolicTrend,
      diastolicTrend,
      categories,
      riskPercentage,
      recommendations,
      overallCategory: getBPCategory(avgSystolic, avgDiastolic),
    }
  }

  const getBPCategory = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) return "Normal"
    if (systolic < 130 && diastolic < 80) return "Elevated"
    if (systolic < 140 || diastolic < 90) return "Stage 1"
    return "Stage 2"
  }

  const generateRecommendations = (
    avgSys: number,
    avgDia: number,
    sysTrend: number,
    diaTrend: number,
    riskPct: number,
  ) => {
    const recommendations = []

    if (avgSys >= 140 || avgDia >= 90) {
      recommendations.push({
        type: "warning",
        title: "High Blood Pressure Detected",
        message: "Your average readings indicate Stage 2 hypertension. Consult your healthcare provider immediately.",
        icon: AlertTriangle,
      })
    } else if (avgSys >= 130 || avgDia >= 80) {
      recommendations.push({
        type: "caution",
        title: "Elevated Blood Pressure",
        message: "Your readings show Stage 1 hypertension. Consider lifestyle modifications and regular monitoring.",
        icon: TrendingUp,
      })
    } else if (avgSys >= 120) {
      recommendations.push({
        type: "info",
        title: "Elevated Systolic Pressure",
        message: "Your systolic pressure is elevated. Focus on heart-healthy lifestyle choices.",
        icon: Activity,
      })
    } else {
      recommendations.push({
        type: "success",
        title: "Normal Blood Pressure",
        message: "Your average blood pressure is within the normal range. Keep up the good work!",
        icon: CheckCircle,
      })
    }

    if (sysTrend > 5) {
      recommendations.push({
        type: "warning",
        title: "Rising Systolic Trend",
        message: `Your systolic pressure has increased by ${sysTrend} mmHg recently. Monitor closely.`,
        icon: TrendingUp,
      })
    } else if (sysTrend < -5) {
      recommendations.push({
        type: "success",
        title: "Improving Systolic Trend",
        message: `Your systolic pressure has decreased by ${Math.abs(sysTrend)} mmHg recently. Great progress!`,
        icon: TrendingDown,
      })
    }

    if (diaTrend > 3) {
      recommendations.push({
        type: "warning",
        title: "Rising Diastolic Trend",
        message: `Your diastolic pressure has increased by ${diaTrend} mmHg recently. Consider lifestyle changes.`,
        icon: TrendingUp,
      })
    } else if (diaTrend < -3) {
      recommendations.push({
        type: "success",
        title: "Improving Diastolic Trend",
        message: `Your diastolic pressure has decreased by ${Math.abs(diaTrend)} mmHg recently. Excellent!`,
        icon: TrendingDown,
      })
    }

    return recommendations
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Normal":
        return "bg-green-100 text-green-800"
      case "Elevated":
        return "bg-yellow-100 text-yellow-800"
      case "Stage 1":
        return "bg-orange-100 text-orange-800"
      case "Stage 2":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRecommendationStyle = (type: string) => {
    switch (type) {
      case "success":
        return "border-green-200 bg-green-50"
      case "warning":
        return "border-red-200 bg-red-50"
      case "caution":
        return "border-orange-200 bg-orange-50"
      case "info":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        ) : insights ? (
          <div className="space-y-6">
            {/* Overall Status */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {insights.avgSystolic}/{insights.avgDiastolic}
                </div>
                <div className="text-sm text-muted-foreground">Average BP</div>
                <Badge className={getCategoryColor(insights.overallCategory)}>{insights.overallCategory}</Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{insights.totalReadings}</div>
                <div className="text-sm text-muted-foreground">Total Readings</div>
                <div className="text-xs text-muted-foreground">Last 90 days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{insights.riskPercentage}%</div>
                <div className="text-sm text-muted-foreground">High Risk</div>
                <Progress value={insights.riskPercentage} className="mt-2" />
              </div>
            </div>

            {/* Trends */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                {insights.systolicTrend > 0 ? (
                  <TrendingUp className="h-5 w-5 text-red-500" />
                ) : insights.systolicTrend < 0 ? (
                  <TrendingDown className="h-5 w-5 text-green-500" />
                ) : (
                  <Activity className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <div className="font-medium">Systolic Trend</div>
                  <div className="text-sm text-muted-foreground">
                    {insights.systolicTrend > 0 ? "+" : ""}
                    {insights.systolicTrend} mmHg
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                {insights.diastolicTrend > 0 ? (
                  <TrendingUp className="h-5 w-5 text-red-500" />
                ) : insights.diastolicTrend < 0 ? (
                  <TrendingDown className="h-5 w-5 text-green-500" />
                ) : (
                  <Activity className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <div className="font-medium">Diastolic Trend</div>
                  <div className="text-sm text-muted-foreground">
                    {insights.diastolicTrend > 0 ? "+" : ""}
                    {insights.diastolicTrend} mmHg
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <h3 className="font-medium">Recommendations</h3>
              {insights.recommendations.map((rec: any, index: number) => (
                <div key={index} className={`p-4 border rounded-lg ${getRecommendationStyle(rec.type)}`}>
                  <div className="flex items-start gap-3">
                    <rec.icon className="h-5 w-5 mt-0.5" />
                    <div>
                      <div className="font-medium">{rec.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">{rec.message}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No data available</h3>
            <p className="text-muted-foreground">Need at least 5 readings to generate insights</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
