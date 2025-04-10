"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

export default function NetworkTrafficChart({ data, anomalies }) {
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    if (data && data.length > 0) {
      // Format data for the chart
      setChartData(
        data.map((item) => ({
          time: new Date(item.timestamp).toLocaleTimeString(),
          packets: item.packetsPerSecond,
          bandwidth: item.bandwidth,
          connections: item.activeConnections,
          errors: item.errorRate * 10, // Scale up for visibility
        })),
      )
    }
  }, [data])

  // Get anomaly timestamps for reference lines
  const anomalyTimestamps = anomalies.map((anomaly) => {
    return {
      time: new Date(anomaly.timestamp).toLocaleTimeString(),
      type: anomaly.type,
      severity: anomaly.severity,
    }
  })

  if (chartData.length === 0) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">No data available</p>
      </Card>
    )
  }

  // Since we're using mock chart components, let's render a simplified version
  return (
    <div className="space-y-8">
      <div className="h-[300px] w-full border border-border rounded-md p-4 bg-card/50">
        <div className="mb-4">
          <h3 className="text-sm font-medium">Network Traffic</h3>
          <p className="text-xs text-muted-foreground">Packets/sec and Bandwidth</p>
        </div>

        <div className="h-[200px] w-full relative">
          {/* Simplified chart visualization */}
          <div className="absolute inset-0 flex items-end">
            {chartData.slice(-20).map((point, index) => (
              <div key={index} className="flex-1 flex flex-col justify-end items-center" style={{ height: "100%" }}>
                <div
                  className="w-[80%] bg-primary"
                  style={{
                    height: `${(point.packets / 1000) * 100}%`,
                    maxHeight: "100%",
                    minHeight: "1px",
                  }}
                ></div>
                {index % 5 === 0 && (
                  <span className="text-[8px] text-muted-foreground mt-1 rotate-45 origin-left">{point.time}</span>
                )}
              </div>
            ))}
          </div>

          {/* Anomaly markers */}
          {anomalyTimestamps.slice(-5).map((anomaly, index) => (
            <div
              key={index}
              className={`absolute top-0 w-1 h-full ${anomaly.severity === "critical" ? "bg-destructive/50" : "bg-warning/50"}`}
              style={{
                left: `${(chartData.findIndex((d) => d.time === anomaly.time) / chartData.length) * 100}%`,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <span
                className={`text-xs font-bold ${anomaly.severity === "critical" ? "text-destructive" : "text-warning"}`}
              >
                !
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[200px] w-full border border-border rounded-md p-4 bg-card/50">
        <div className="mb-4">
          <h3 className="text-sm font-medium">Connection Activity</h3>
          <p className="text-xs text-muted-foreground">Active Connections and Error Rate</p>
        </div>

        <div className="h-[120px] w-full relative">
          {/* Simplified chart visualization */}
          <div className="absolute inset-0 flex items-end">
            {chartData.slice(-20).map((point, index) => (
              <div key={index} className="flex-1 flex flex-col justify-end items-center" style={{ height: "100%" }}>
                <div
                  className="w-[80%] bg-indigo-500/70"
                  style={{
                    height: `${(point.connections / 200) * 100}%`,
                    maxHeight: "100%",
                    minHeight: "1px",
                  }}
                ></div>
                {index % 5 === 0 && (
                  <span className="text-[8px] text-muted-foreground mt-1 rotate-45 origin-left">{point.time}</span>
                )}
              </div>
            ))}
          </div>

          {/* Error rate line */}
          <div className="absolute inset-0 flex items-end pointer-events-none">
            {chartData.slice(-20).map((point, index, arr) => {
              if (index === 0) return null
              const prevPoint = arr[index - 1]
              return (
                <div key={`error-${index}`} className="flex-1 relative" style={{ height: "100%" }}>
                  {index > 0 && (
                    <div
                      className="absolute h-[2px] bg-destructive/70"
                      style={{
                        width: "100%",
                        top: `${100 - (point.errors / 20) * 100}%`,
                        transform: "translateY(-50%)",
                      }}
                    ></div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex justify-between mt-2 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-indigo-500/70 mr-1"></div>
            <span>Connections</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-destructive/70 mr-1"></div>
            <span>Error Rate</span>
          </div>
        </div>
      </div>
    </div>
  )
}
