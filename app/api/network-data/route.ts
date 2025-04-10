import { NextResponse } from "next/server"
import { z } from "zod"
import { dataManager } from "@/lib/data-manager"

// Define schema for network data
const NetworkDataSchema = z.object({
  timestamp: z.number(),
  packetsPerSecond: z.number(),
  bandwidth: z.number(),
  activeConnections: z.number(),
  errorRate: z.number(),
})

// Define schema for anomaly detection
const AnomalySchema = z.object({
  timestamp: z.number(),
  type: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
  source: z.string(),
  description: z.string(),
  metrics: z
    .object({
      threshold: z.number(),
      actualValue: z.number(),
      deviation: z.number(),
    })
    .optional(),
})

// Simple in-memory storage for demo purposes
let networkDataHistory: z.infer<typeof NetworkDataSchema>[] = []
let detectedAnomalies: z.infer<typeof AnomalySchema>[] = []

// Z-score threshold for anomaly detection
const ZSCORE_THRESHOLD = 3.0

/**
 * GET handler to retrieve network data and anomalies
 */
export async function GET() {
  const dataHistory = dataManager.getDataHistory()
  const anomalyHistory = dataManager.getAnomalyHistory()

  // Get the latest data point
  const currentData = dataHistory.length > 0 ? dataHistory[dataHistory.length - 1] : null

  return NextResponse.json({
    networkData: {
      current: currentData,
      history: dataHistory.slice(-60), // Last 60 data points
    },
    anomalies: anomalyHistory,
  })
}

/**
 * POST handler to receive new network data and detect anomalies
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate the incoming data
    const validatedData = NetworkDataSchema.parse(body)

    // Add to history
    networkDataHistory.push(validatedData)

    // Keep only the last 1000 data points
    if (networkDataHistory.length > 1000) {
      networkDataHistory = networkDataHistory.slice(-1000)
    }

    // Detect anomalies using z-score method
    const anomalies = detectAnomalies(validatedData)

    // Add any new anomalies to the list
    if (anomalies.length > 0) {
      detectedAnomalies = [...detectedAnomalies, ...anomalies]

      // Keep only the last 100 anomalies
      if (detectedAnomalies.length > 100) {
        detectedAnomalies = detectedAnomalies.slice(-100)
      }
    }

    return NextResponse.json({
      success: true,
      anomaliesDetected: anomalies.length,
    })
  } catch (error) {
    console.error("Error processing network data:", error)
    return NextResponse.json({ error: "Invalid network data format" }, { status: 400 })
  }
}

/**
 * Detect anomalies in network data using z-score method
 */
function detectAnomalies(currentData: z.infer<typeof NetworkDataSchema>) {
  const anomalies: z.infer<typeof AnomalySchema>[] = []

  // Need at least 10 data points for meaningful anomaly detection
  if (networkDataHistory.length < 10) {
    return anomalies
  }

  // Calculate mean and standard deviation for each metric
  const metrics = ["packetsPerSecond", "bandwidth", "activeConnections", "errorRate"] as const

  for (const metric of metrics) {
    const values = networkDataHistory.slice(-30).map((data) => data[metric])
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length)

    // Skip if standard deviation is too small (avoid division by zero)
    if (stdDev < 0.1) continue

    // Calculate z-score
    const zScore = Math.abs((currentData[metric] - mean) / stdDev)

    // If z-score exceeds threshold, it's an anomaly
    if (zScore > ZSCORE_THRESHOLD) {
      const deviation = Math.round(((currentData[metric] - mean) / mean) * 100)

      // Determine severity based on z-score
      let severity: "info" | "warning" | "critical" = "info"
      if (zScore > ZSCORE_THRESHOLD * 2) {
        severity = "critical"
      } else if (zScore > ZSCORE_THRESHOLD * 1.5) {
        severity = "warning"
      }

      // Determine anomaly type based on metric
      let type = ""
      let description = ""

      switch (metric) {
        case "packetsPerSecond":
          type = "traffic_spike"
          description = `Unusual packet rate detected. Current: ${currentData[metric]}, Normal: ~${Math.round(mean)}`
          break
        case "bandwidth":
          type = "bandwidth_anomaly"
          description = `Unusual bandwidth usage detected. Current: ${currentData[metric]} Mbps, Normal: ~${Math.round(mean)} Mbps`
          break
        case "activeConnections":
          type = "connection_flood"
          description = `Unusual number of connections detected. Current: ${currentData[metric]}, Normal: ~${Math.round(mean)}`
          break
        case "errorRate":
          type = "packet_drop"
          description = `Unusual error rate detected. Current: ${currentData[metric]}%, Normal: ~${mean.toFixed(2)}%`
          break
      }

      anomalies.push({
        timestamp: currentData.timestamp,
        type,
        severity,
        source: "Anomaly Detection Engine",
        description,
        metrics: {
          threshold: Math.round(mean),
          actualValue: currentData[metric],
          deviation: Math.abs(deviation),
        },
      })
    }
  }

  return anomalies
}
