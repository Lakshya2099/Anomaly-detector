import type { NetworkDataSource, DataSourceStatus, NetworkDataPoint, AnomalyEvent } from "./index"

export class SimulatedDataSource implements NetworkDataSource {
  private running = false
  private status: DataSourceStatus = { status: "stopped" }
  private dataCallbacks: ((data: NetworkDataPoint) => void)[] = []
  private anomalyCallbacks: ((anomaly: AnomalyEvent) => void)[] = []
  private errorCallbacks: ((error: Error) => void)[] = []
  private statusCallbacks: ((status: DataSourceStatus) => void)[] = []
  private config: SimulatedConfig = {
    updateInterval: 1000, // ms
    anomalyProbability: 0.05, // 5% chance per update
    simulateNetworkPatterns: true,
    simulateTimeOfDayPatterns: true,
  }
  private metrics = {
    dataPointsProcessed: 0,
    anomaliesDetected: 0,
    errorCount: 0,
    uptime: 0,
  }
  private startTime = 0
  private updateInterval: NodeJS.Timeout | null = null
  private trafficHistory: NetworkDataPoint[] = []

  name = "Simulated Data"
  description = "Generate simulated network data for testing and development"

  async initialize(config: SimulatedConfig): Promise<boolean> {
    try {
      this.updateStatus("initializing", "Initializing simulated data source...")

      this.config = { ...this.config, ...config }

      // Simulate initialization delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      console.log(`[Simulated] Initialized with update interval: ${this.config.updateInterval}ms`)

      this.updateStatus("stopped", "Simulated data source initialized and ready")
      return true
    } catch (error) {
      this.handleError(error as Error)
      return false
    }
  }

  async start(): Promise<void> {
    if (this.running) return

    try {
      this.updateStatus("initializing", "Starting simulated data source...")

      this.startTime = Date.now()
      this.running = true

      // Initialize with some historical data
      this.trafficHistory = this.generateInitialData()

      // Start generating data
      this.updateInterval = setInterval(() => {
        this.generateData()
      }, this.config.updateInterval)

      this.updateStatus("running", "Simulated data source running")
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  async stop(): Promise<void> {
    if (!this.running) return

    try {
      if (this.updateInterval) {
        clearInterval(this.updateInterval)
        this.updateInterval = null
      }

      this.running = false
      this.updateStatus("stopped", "Simulated data source stopped")
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  isRunning(): boolean {
    return this.running
  }

  getStatus(): DataSourceStatus {
    // Update uptime if running
    if (this.running) {
      this.metrics.uptime = Math.floor((Date.now() - this.startTime) / 1000)
    }

    return {
      ...this.status,
      lastUpdated: new Date(),
      metrics: { ...this.metrics },
    }
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

  getConfiguration(): SimulatedConfig {
    return { ...this.config }
  }

  async updateConfiguration(config: Partial<SimulatedConfig>): Promise<boolean> {
    const wasRunning = this.running

    if (wasRunning) {
      await this.stop()
    }

    this.config = { ...this.config, ...config }

    if (wasRunning) {
      await this.start()
    }

    return true
  }

  private updateStatus(status: "initializing" | "running" | "stopped" | "error", message?: string): void {
    this.status = {
      status,
      message,
      lastUpdated: new Date(),
      metrics: { ...this.metrics },
    }

    this.statusCallbacks.forEach((callback) => callback(this.status))
  }

  private handleError(error: Error): void {
    this.metrics.errorCount++
    this.updateStatus("error", error.message)
    this.errorCallbacks.forEach((callback) => callback(error))
  }

  private generateInitialData(): NetworkDataPoint[] {
    const history: NetworkDataPoint[] = []
    const now = Date.now()

    // Generate 60 data points (1 minute of history)
    for (let i = 0; i < 60; i++) {
      history.push(this.generateDataPoint(now - (60 - i) * 1000))
    }

    return history
  }

  private generateData(): void {
    if (!this.running) return

    try {
      const now = Date.now()

      // Generate a new data point
      const dataPoint = this.generateDataPoint(now)

      // Add to history and limit size
      this.trafficHistory.push(dataPoint)
      if (this.trafficHistory.length > 300) {
        // Keep 5 minutes of history
        this.trafficHistory.shift()
      }

      this.metrics.dataPointsProcessed++
      this.dataCallbacks.forEach((callback) => callback(dataPoint))

      // Randomly detect anomalies
      if (Math.random() < this.config.anomalyProbability) {
        this.generateAnomaly(dataPoint)
      }
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  private generateDataPoint(timestamp: number): NetworkDataPoint {
    // Base values
    let packetsPerSecond = 500
    let bandwidth = 50
    let activeConnections = 100
    let errorRate = 1

    // Add time-of-day pattern if enabled
    if (this.config.simulateTimeOfDayPatterns) {
      const date = new Date(timestamp)
      const hour = date.getHours()

      // Simulate higher traffic during business hours
      if (hour >= 9 && hour <= 17) {
        packetsPerSecond += 200
        bandwidth += 20
        activeConnections += 50
      }

      // Simulate peak at lunch time
      if (hour >= 12 && hour <= 13) {
        packetsPerSecond += 100
        bandwidth += 10
        activeConnections += 25
      }

      // Simulate low traffic at night
      if (hour >= 0 && hour <= 5) {
        packetsPerSecond -= 200
        bandwidth -= 20
        activeConnections -= 50
      }
    }

    // Add network patterns if enabled
    if (this.config.simulateNetworkPatterns) {
      // Use sine waves to simulate cyclical patterns
      const timeFactor = timestamp / 1000 / 60 // minutes
      packetsPerSecond += Math.sin(timeFactor * 0.1) * 100
      bandwidth += Math.sin(timeFactor * 0.05) * 10
      activeConnections += Math.sin(timeFactor * 0.2) * 20
      errorRate += Math.sin(timeFactor * 0.3) * 0.5
    }

    // Add random variation
    packetsPerSecond += (Math.random() - 0.5) * 100
    bandwidth += (Math.random() - 0.5) * 10
    activeConnections += (Math.random() - 0.5) * 20
    errorRate += (Math.random() - 0.5) * 0.5

    // Ensure values are reasonable
    packetsPerSecond = Math.max(50, packetsPerSecond)
    bandwidth = Math.max(5, bandwidth)
    activeConnections = Math.max(10, activeConnections)
    errorRate = Math.max(0.1, errorRate)

    return {
      timestamp,
      packetsPerSecond: Math.floor(packetsPerSecond),
      bandwidth: Number(bandwidth.toFixed(2)),
      activeConnections: Math.floor(activeConnections),
      errorRate: Number(errorRate.toFixed(2)),
      source: "simulated",
      additionalMetrics: {
        tcpConnections: Math.floor(activeConnections * 0.7),
        udpConnections: Math.floor(activeConnections * 0.3),
        avgPacketSize: Math.floor(800 + Math.random() * 400), // bytes
      },
    }
  }

  private generateAnomaly(dataPoint: NetworkDataPoint): void {
    const anomalyTypes = ["traffic_spike", "connection_flood", "packet_drop", "latency_spike"]
    const type = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)]

    const severities: ("info" | "warning" | "critical")[] = ["info", "warning", "critical"]
    const severityWeights = [0.5, 0.3, 0.2] // 50% info, 30% warning, 20% critical

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

    const severity = randomSeverity()

    const threshold = Math.floor(Math.random() * 100) + 100
    const actualValue = threshold * (1 + (Math.random() * 0.5 + 0.5))
    const deviation = Math.floor((actualValue / threshold - 1) * 100)

    let description = ""
    let recommendedAction = ""

    switch (type) {
      case "traffic_spike":
        description = `Sudden increase in network traffic detected. Traffic volume exceeded normal threshold by ${deviation}%.`
        recommendedAction =
          severity === "critical"
            ? "Implement rate limiting and investigate potential DDoS attack."
            : "Monitor traffic patterns and check for scheduled data transfers."
        break
      case "connection_flood":
        description = `Unusual number of connection attempts detected. Connection rate exceeded threshold by ${deviation}%.`
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

    const anomaly: AnomalyEvent = {
      id: `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      type,
      severity,
      source: "simulated",
      description,
      metrics: {
        threshold,
        actualValue: Math.floor(actualValue),
        deviation,
      },
      recommendedAction,
    }

    this.metrics.anomaliesDetected++
    this.anomalyCallbacks.forEach((callback) => callback(anomaly))
  }
}

export interface SimulatedConfig {
  updateInterval: number
  anomalyProbability: number
  simulateNetworkPatterns: boolean
  simulateTimeOfDayPatterns: boolean
}
