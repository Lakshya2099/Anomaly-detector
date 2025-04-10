import { NextResponse } from "next/server"

// Simulation parameters
const BASE_PACKETS_PER_SECOND = 500
const BASE_BANDWIDTH = 50
const BASE_ACTIVE_CONNECTIONS = 100
const BASE_ERROR_RATE = 1

// Variance parameters (as percentage of base)
const PACKETS_VARIANCE = 0.2
const BANDWIDTH_VARIANCE = 0.2
const CONNECTIONS_VARIANCE = 0.3
const ERROR_RATE_VARIANCE = 0.5

// Anomaly simulation
const ANOMALY_PROBABILITY = 0.05 // 5% chance of anomaly per request

/**
 * GET handler to generate simulated network data
 */
export async function GET() {
  const timestamp = Date.now()

  // Generate normal network data with random variations
  const normalData = {
    timestamp,
    packetsPerSecond: generateValue(BASE_PACKETS_PER_SECOND, PACKETS_VARIANCE),
    bandwidth: generateValue(BASE_BANDWIDTH, BANDWIDTH_VARIANCE),
    activeConnections: generateValue(BASE_ACTIVE_CONNECTIONS, CONNECTIONS_VARIANCE),
    errorRate: generateValue(BASE_ERROR_RATE, ERROR_RATE_VARIANCE, 2),
  }

  // Determine if we should inject an anomaly
  const shouldInjectAnomaly = Math.random() < ANOMALY_PROBABILITY

  if (shouldInjectAnomaly) {
    // Choose a random metric to make anomalous
    const metrics = ["packetsPerSecond", "bandwidth", "activeConnections", "errorRate"]
    const anomalousMetric = metrics[Math.floor(Math.random() * metrics.length)]

    // Increase the chosen metric by 200-500%
    const anomalyFactor = 2 + Math.random() * 3
    normalData[anomalousMetric] *= anomalyFactor

    // For error rate, cap at 100%
    if (anomalousMetric === "errorRate" && normalData.errorRate > 100) {
      normalData.errorRate = 100
    }
  }

  return NextResponse.json({
    data: normalData,
    anomaly: shouldInjectAnomaly,
  })
}

/**
 * Helper function to generate a value with random variation
 */
function generateValue(baseValue: number, varianceFactor: number, decimals = 0): number {
  // Generate a value between (1-variance) and (1+variance) of the base value
  const randomFactor = 1 - varianceFactor + Math.random() * varianceFactor * 2
  const value = baseValue * randomFactor

  // Round to specified decimal places
  return Number(value.toFixed(decimals))
}
