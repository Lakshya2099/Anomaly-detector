import type { NetworkDataSource, NetworkDataPoint, AnomalyEvent, DataSourceStatus } from "./index"

export class SimulatedDataSource implements NetworkDataSource {
  name = "Simulated Data"
  description = "Generate simulated network data for testing and development"

  private running = false
  private interval: NodeJS.Timeout | null = null
  private config = {
    updateInterval: 1000,
    anomalyProbability: 0.05,
    simulateNetworkPatterns: true,
    simulateTimeOfDayPatterns: true,
  }

  private dataCallbacks: ((data: NetworkDataPoint) => void)[] = []
  private anomalyCallbacks: ((anomaly: AnomalyEvent) => void)[] = []
  private errorCallbacks: ((error: Error) => void)[] = []
  private statusCallbacks: ((status: DataSourceStatus) => void)[] = []

  private status: DataSourceStatus = {
    status: "stopped",
    metrics: {
      dataPointsProcessed: 0,
      anomaliesDetected: 0,
      errorCount: 0,
      uptime: 0,
    },
  }

  private startTime = 0
  private lastUpdate = 0

  // Base values for simulation
  private basePacketsPerSecond = 500
  private baseBandwidth = 50
  private baseActiveConnections = 100
  private baseErrorRate = 1

  // Variance parameters (as percentage of base)
  private packetsVariance = 0.2
  private bandwidthVariance = 0.2
  private connectionsVariance = 0.3
  private errorRateVariance = 0.5

  async initialize(config?: any): Promise<boolean> {
    if (config) {
      this.config = { ...this.config, ...config }
    }

    this.updateStatus("initializing")

    // Simulate initialization delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    this.updateStatus("stopped")
    return true
  }

  async start(): Promise<void> {
    if (this.running) return

    this.running = true
    this.startTime = Date.now()
    this.lastUpdate = Date.now()
    this.updateStatus("running")

    // Start generating data
    this.interval = setInterval(() => {
      this.generateData()
    }, this.config.updateInterval)
  }

  async stop(): Promise<void> {
    if (!this.running) return

    this.running = false
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }

    this.updateStatus("stopped")
  }

  isRunning(): boolean {
    return this.running
  }

  getStatus(): DataSourceStatus {
    // Update uptime if running
    if (this.running) {
      this.status.metrics!.uptime = Math.floor((Date.now() - this.startTime) / 1000)
    }

    return this.status
  }

  onData(callback: (data: NetworkDataPoint) => void): void {
    this.dataCallbacks.push(callback)
  }

  onAnomaly(callback: (anomaly: AnomalyEvent) => void): void {
    this.anomalyCallbacks.push(callback)
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.push(callback)
  }

  onStatusChange(callback: (status: DataSourceStatus) => void): void {
    this.statusCallbacks.push(callback)
  }

  getConfiguration(): any {
    return { ...this.config }
  }

  async updateConfiguration(config: any): Promise<boolean> {
    const wasRunning = this.running

    // Stop if running
    if (wasRunning) {
      await this.stop()
    }

    // Update config
    this.config = { ...this.config, ...config }

    // Restart if it was running
    if (wasRunning) {
      await this.start()
    }

    return true
  }

  private generateData(): void {
    try {
      const timestamp = Date.now()

      // Generate normal network data with random variations
      const data: NetworkDataPoint = {
        timestamp,
        packetsPerSecond: this.generateValue(this.basePacketsPerSecond, this.packetsVariance),
        bandwidth: this.generateValue(this.baseBandwidth, this.bandwidthVariance),
        activeConnections: this.generateValue(this.baseActiveConnections, this.connectionsVariance),
        errorRate: this.generateValue(this.baseErrorRate, this.errorRateVariance, 2),
      }

      // Update metrics
      this.status.metrics!.dataPointsProcessed++
      this.lastUpdate = timestamp

      // Notify data callbacks
      this.dataCallbacks.forEach((callback) => callback(data))

      // Determine if we should generate an anomaly
      if (Math.random() < this.config.anomalyProbability) {
        const anomaly = this.generateAnomaly()
        this.status.metrics!.anomaliesDetected++
        this.anomalyCallbacks.forEach((callback) => callback(anomaly))
      }
    } catch (error) {
      this.status.metrics!.errorCount++
      this.errorCallbacks.forEach((callback) => callback(error instanceof Error ? error : new Error(String(error))))
    }
  }

  private generateValue(baseValue: number, varianceFactor: number, decimals = 0): number {
    // Generate a value between (1-variance) and (1+variance) of the base value
    const randomFactor = 1 - varianceFactor + Math.random() * varianceFactor * 2
    const value = baseValue * randomFactor

    // Round to specified decimal places
    return Number(value.toFixed(decimals))
  }

  private generateAnomaly(): AnomalyEvent {
    const anomalyTypes = ["traffic_spike", "connection_flood", "packet_drop", "latency_spike"]
    const severities = ["info", "warning", "critical"] as const
    const severityWeights = [0.5, 0.3, 0.2] // 50% info, 30% warning, 20% critical
    const sources = ["192.168.1.100", "10.0.0.25", "172.16.0.5", "External Gateway", "Internal Router"]

    // Weighted random selection for severity
    const randomSeverity = () => {
      const rand = Math.random()
      let sum = 0
      for (let i = 0; i < severityWeights.length; i++) {
        sum += severityWeights[i]
        if (rand < sum) return severities[i]
      }
      return severities[0]
    }

    const type = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)]
    const severity = randomSeverity()
    const source = sources[Math.floor(Math.random() * sources.length)]

    // Generate description and recommended action based on type and severity
    let description = ""
    let recommendedAction = ""
    const threshold = Math.floor(Math.random() * 100) + 100
    const actualValue = threshold * (1 + (Math.random() * 0.5 + 0.5))
    const deviation = Math.floor((actualValue / threshold - 1) * 100)

    switch (type) {
      case "traffic_spike":
        description = `Sudden increase in network traffic detected. Traffic volume exceeded normal threshold by ${deviation}%.`
        recommendedAction =
          severity === "critical"
            ? "Implement rate limiting and investigate potential DDoS attack."
            : "Monitor traffic patterns and check for scheduled data transfers."
        break
      case "connection_flood":
        description = `Unusual number of connection attempts detected from ${source}. Connection rate exceeded threshold by ${deviation}%.`
        recommendedAction =
          severity === "critical"
            ? "Block source IP and investigate for potential security breach."
            : "Monitor connection patterns and verify legitimate application behavior."
        break
      case "packet_drop":
        description = `Elevated packet loss detected on network segment. Packet drop rate is ${deviation}% above normal threshold.`
        recommendedAction =
          severity === "critical"
            ? "Check network equipment for hardware failures and verify link capacity."
            : "Monitor network performance and check for congestion issues."
        break
      case "latency_spike":
        description = `Network latency has increased significantly. Current latency is ${deviation}% above normal threshold.`
        recommendedAction =
          severity === "critical"
            ? "Investigate network path for bottlenecks and equipment issues."
            : "Monitor application performance and check for bandwidth-intensive processes."
        break
    }

    return {
      id: `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      type,
      severity,
      source,
      description,
      metrics: {
        threshold,
        actualValue: Math.floor(actualValue),
        deviation,
      },
      recommendedAction,
    }
  }

  private updateStatus(status: "initializing" | "running" | "stopped" | "error", message?: string): void {
    this.status = {
      ...this.status,
      status,
      message,
      lastUpdated: new Date(),
    }

    this.statusCallbacks.forEach((callback) => callback(this.status))
  }
}
