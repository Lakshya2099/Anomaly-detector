import { PcapDataSource } from "./pcap-source"
import { SnmpDataSource } from "./snmp-source"
import { NetflowDataSource } from "./netflow-source"
import { SyslogDataSource } from "./syslog-source"
import { SimulatedDataSource } from "./simulated-source"

// Common interface for all data sources
export interface NetworkDataSource {
  name: string
  description: string
  initialize: (config: any) => Promise<boolean>
  start: () => Promise<void>
  stop: () => Promise<void>
  isRunning: () => boolean
  getStatus: () => DataSourceStatus
  onData: (callback: (data: NetworkDataPoint) => void) => void
  onAnomaly: (callback: (anomaly: AnomalyEvent) => void) => void
  onError: (callback: (error: Error) => void) => void
  onStatusChange: (callback: (status: DataSourceStatus) => void) => void
  getConfiguration: () => any
  updateConfiguration: (config: any) => Promise<boolean>
}

// Status of a data source
export type DataSourceStatus = {
  status: "initializing" | "running" | "stopped" | "error"
  message?: string
  lastUpdated?: Date
  metrics?: {
    dataPointsProcessed: number
    anomaliesDetected: number
    errorCount: number
    uptime: number // in seconds
  }
}

// Network data point structure
export interface NetworkDataPoint {
  timestamp: number
  packetsPerSecond: number
  bandwidth: number // in Mbps
  activeConnections: number
  errorRate: number // percentage
  source?: string
  additionalMetrics?: Record<string, number | string>
}

// Anomaly event structure
export interface AnomalyEvent {
  id: string
  timestamp: number
  type: string
  severity: "info" | "warning" | "critical"
  source: string
  description: string
  duration?: string
  metrics?: {
    threshold: number
    actualValue: number
    deviation: number
  }
  recommendedAction: string
}

// Available data source types
export type DataSourceType = "pcap" | "snmp" | "netflow" | "syslog" | "simulated"

// Factory function to create data sources
export function createDataSource(type: DataSourceType): NetworkDataSource {
  switch (type) {
    case "pcap":
      return new PcapDataSource()
    case "snmp":
      return new SnmpDataSource()
    case "netflow":
      return new NetflowDataSource()
    case "syslog":
      return new SyslogDataSource()
    case "simulated":
      return new SimulatedDataSource()
    default:
      throw new Error(`Unsupported data source type: ${type}`)
  }
}

// Helper function to get available data sources
export function getAvailableDataSources(): { type: DataSourceType; name: string; description: string }[] {
  return [
    {
      type: "pcap",
      name: "Packet Capture",
      description: "Capture and analyze network packets directly from network interfaces",
    },
    {
      type: "snmp",
      name: "SNMP Monitoring",
      description: "Collect network statistics via SNMP from routers, switches, and other devices",
    },
    {
      type: "netflow",
      name: "NetFlow/IPFIX",
      description: "Process NetFlow or IPFIX data from network devices",
    },
    {
      type: "syslog",
      name: "System Logs",
      description: "Analyze network-related system logs from servers and devices",
    },
    {
      type: "simulated",
      name: "Simulated Data",
      description: "Generate simulated network data for testing and development",
    },
  ]
}
