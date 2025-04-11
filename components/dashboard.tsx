"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Activity, Network, BarChart3, Clock, Settings } from "lucide-react"
import NetworkTrafficChart from "@/components/network-traffic-chart"
import AnomalyTable from "@/components/anomaly-table"
import StatusIndicator from "@/components/status-indicator"
import { useToast } from "@/hooks/use-toast"
import { useDataSource } from "@/hooks/use-data-source"
import DataSourceManager from "@/components/data-source-manager"
import ThemeToggle from "@/components/theme-toggle"
import TechnologyStack from "@/components/technology-stack"

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("1h")
  const [anomalyType, setAnomalyType] = useState("all")
  const [activeTab, setActiveTab] = useState("traffic")
  const { toast } = useToast()

  const {
    isConnected,
    connectionStatus,
    networkData,
    anomalies,
    dataSources,
    activeSourceId,
    connect,
    disconnect,
    setActiveSource,
    addDataSource,
    removeDataSource,
  } = useDataSource()

  useEffect(() => {
    // Auto-connect when component mounts
    connect()

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Show toast notification when new anomaly is detected
  useEffect(() => {
    if (anomalies.length > 0) {
      const latestAnomaly = anomalies[0]
      if (latestAnomaly.isNew) {
        toast({
          title: "Anomaly Detected",
          description: `${latestAnomaly.type} anomaly detected at ${new Date(latestAnomaly.timestamp).toLocaleTimeString()}`,
          variant: "destructive",
        })
      }
    }
  }, [anomalies, toast])

  // Filter anomalies based on selected type
  const filteredAnomalies = anomalies.filter((anomaly) => anomalyType === "all" || anomaly.type === anomalyType)

  // Handle adding a data source
  const handleAddDataSource = async (id, type, config) => {
    try {
      const result = await addDataSource(id, type, config)
      if (result) {
        toast({
          title: "Data Source Added",
          description: `Data source "${id}" has been added successfully.`,
          variant: "default",
        })
      }
      return result
    } catch (error) {
      toast({
        title: "Error Adding Data Source",
        description: error.message || "Failed to add data source",
        variant: "destructive",
      })
      return false
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Anomaly Detection</h1>
          <p className="text-muted-foreground">Monitor and detect unusual network behavior in real-time</p>
        </div>
        <StatusIndicator status={connectionStatus} isConnected={isConnected} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-primary" />
              Traffic Status
            </CardTitle>
            <CardDescription>Current network traffic overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Packets/sec</span>
                <span className="text-2xl font-bold">{networkData.packetsPerSecond || 0}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Bandwidth</span>
                <span className="text-2xl font-bold">
                  {networkData.bandwidth ? `${networkData.bandwidth} Mbps` : "0 Mbps"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Active Connections</span>
                <span className="text-2xl font-bold">{networkData.activeConnections || 0}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Error Rate</span>
                <span className="text-2xl font-bold">{networkData.errorRate ? `${networkData.errorRate}%` : "0%"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
              Anomaly Summary
            </CardTitle>
            <CardDescription>Recent detected anomalies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Total Anomalies</span>
                <span className="text-2xl font-bold">{anomalies.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Critical</span>
                <span className="text-2xl font-bold text-destructive">
                  {anomalies.filter((a) => a.severity === "critical").length}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Last Detected</span>
                <span className="text-lg font-medium">
                  {anomalies.length > 0 ? new Date(anomalies[0].timestamp).toLocaleTimeString() : "N/A"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Most Common</span>
                <span className="text-lg font-medium">
                  {anomalies.length > 0 ? getMostCommonAnomalyType(anomalies) : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Network className="mr-2 h-5 w-5 text-primary" />
              Network Health
            </CardTitle>
            <CardDescription>Overall system status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">System Status</span>
                <Badge variant={getSystemStatusVariant(networkData, anomalies)}>
                  {getSystemStatus(networkData, anomalies)}
                </Badge>
              </div>

              <div className="space-y-2">
                {anomalies.length > 0 && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Active Anomalies</AlertTitle>
                    <AlertDescription>
                      {anomalies.filter((a) => a.severity === "critical").length} critical issues detected
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => connect()} disabled={isConnected}>
                    Reconnect
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Refresh Data
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="traffic" className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Traffic Analysis
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              Anomaly Log
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <div className="flex space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px]">
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="6h">Last 6 Hours</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={anomalyType} onValueChange={setAnomalyType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Anomaly Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="traffic_spike">Traffic Spike</SelectItem>
                <SelectItem value="connection_flood">Connection Flood</SelectItem>
                <SelectItem value="packet_drop">Packet Drop</SelectItem>
                <SelectItem value="latency_spike">Latency Spike</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="traffic" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Network Traffic</CardTitle>
              <CardDescription>
                Real-time network traffic visualization for the {getTimeRangeText(timeRange)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NetworkTrafficChart data={networkData.trafficHistory || []} anomalies={anomalies} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Detected Anomalies</CardTitle>
              <CardDescription>
                {filteredAnomalies.length} anomalies detected in the {getTimeRangeText(timeRange)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnomalyTable anomalies={filteredAnomalies} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <div className="grid grid-cols-1 gap-6">
            <DataSourceManager
              dataSources={dataSources}
              activeSourceId={activeSourceId}
              onAddDataSource={handleAddDataSource}
              onRemoveDataSource={removeDataSource}
              onSetActiveSource={setActiveSource}
            />

            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>Customize your application experience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Theme</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Application Theme</span>
                      <ThemeToggle />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-2">About</h3>
                    <TechnologyStack />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper functions
function getMostCommonAnomalyType(anomalies) {
  const typeCounts = anomalies.reduce((acc, anomaly) => {
    acc[anomaly.type] = (acc[anomaly.type] || 0) + 1
    return acc
  }, {})

  return Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])[0][0]
    .replace("_", " ")
}

function getSystemStatus(networkData, anomalies) {
  const criticalAnomalies = anomalies.filter((a) => a.severity === "critical").length

  if (criticalAnomalies > 0) {
    return "Critical"
  } else if (anomalies.length > 0) {
    return "Warning"
  } else if (!networkData.packetsPerSecond) {
    return "No Data"
  } else {
    return "Healthy"
  }
}

function getSystemStatusVariant(networkData, anomalies) {
  const status = getSystemStatus(networkData, anomalies)

  switch (status) {
    case "Critical":
      return "destructive"
    case "Warning":
      return "warning"
    case "No Data":
      return "outline"
    case "Healthy":
      return "success"
    default:
      return "outline"
  }
}

function getTimeRangeText(timeRange) {
  switch (timeRange) {
    case "1h":
      return "last hour"
    case "6h":
      return "last 6 hours"
    case "24h":
      return "last 24 hours"
    case "7d":
      return "last 7 days"
    default:
      return "selected time period"
  }
}
