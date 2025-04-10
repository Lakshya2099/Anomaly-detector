import {
  type NetworkDataSource,
  type NetworkDataPoint,
  type AnomalyEvent,
  type DataSourceStatus,
  type DataSourceType,
  createDataSource,
} from "./"

// Data manager to handle multiple data sources and provide a unified interface
export class DataManager {
  private dataSources: Map<string, NetworkDataSource> = new Map()
  private activeSource: string | null = null
  private dataCallbacks: ((data: NetworkDataPoint) => void)[] = []
  private anomalyCallbacks: ((anomaly: AnomalyEvent) => void)[] = []
  private statusCallbacks: ((sourceId: string, status: DataSourceStatus) => void)[] = []
  private errorCallbacks: ((sourceId: string, error: Error) => void)[] = []

  // Network data history
  private dataHistory: NetworkDataPoint[] = []
  private anomalyHistory: AnomalyEvent[] = []

  // Maximum history size
  private maxDataHistorySize = 3600 // 1 hour at 1 second intervals
  private maxAnomalyHistorySize = 1000

  constructor() {
    // Initialize with simulated data source by default
    this.addDataSource("simulated", "simulated")
  }

  // Add a new data source
  async addDataSource(id: string, type: DataSourceType, config?: any): Promise<boolean> {
    try {
      if (this.dataSources.has(id)) {
        throw new Error(`Data source with ID ${id} already exists`)
      }

      const dataSource = createDataSource(type)

      // Initialize the data source
      const initialized = await dataSource.initialize(config)
      if (!initialized) {
        throw new Error(`Failed to initialize data source ${id}`)
      }

      // Set up event handlers
      dataSource.onData((data) => this.handleData(id, data))
      dataSource.onAnomaly((anomaly) => this.handleAnomaly(id, anomaly))
      dataSource.onError((error) => this.handleError(id, error))
      dataSource.onStatusChange((status) => this.handleStatusChange(id, status))

      // Add to the map
      this.dataSources.set(id, dataSource)

      // If this is the first data source, make it active
      if (this.dataSources.size === 1) {
        this.activeSource = id
      }

      return true
    } catch (error) {
      console.error(`Error adding data source ${id}:`, error)
      this.handleError(id, error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  // Remove a data source
  async removeDataSource(id: string): Promise<boolean> {
    try {
      const dataSource = this.dataSources.get(id)
      if (!dataSource) {
        return false
      }

      // Stop the data source if it's running
      if (dataSource.isRunning()) {
        await dataSource.stop()
      }

      // Remove from the map
      this.dataSources.delete(id)

      // If this was the active source, set a new active source
      if (this.activeSource === id) {
        this.activeSource = this.dataSources.size > 0 ? Array.from(this.dataSources.keys())[0] : null
      }

      return true
    } catch (error) {
      console.error(`Error removing data source ${id}:`, error)
      this.handleError(id, error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  // Get all data sources
  getDataSources(): { id: string; source: NetworkDataSource; active: boolean }[] {
    return Array.from(this.dataSources.entries()).map(([id, source]) => ({
      id,
      source,
      active: id === this.activeSource,
    }))
  }

  // Get a specific data source
  getDataSource(id: string): NetworkDataSource | null {
    return this.dataSources.get(id) || null
  }

  // Set the active data source
  async setActiveDataSource(id: string): Promise<boolean> {
    try {
      if (!this.dataSources.has(id)) {
        throw new Error(`Data source with ID ${id} does not exist`)
      }

      // Stop the current active source if it's running
      if (this.activeSource) {
        const currentActive = this.dataSources.get(this.activeSource)
        if (currentActive && currentActive.isRunning()) {
          await currentActive.stop()
        }
      }

      // Set the new active source
      this.activeSource = id

      // Start the new active source if it's not running
      const newActive = this.dataSources.get(id)
      if (newActive && !newActive.isRunning()) {
        await newActive.start()
      }

      return true
    } catch (error) {
      console.error(`Error setting active data source ${id}:`, error)
      this.handleError(id, error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  // Start a data source
  async startDataSource(id: string): Promise<boolean> {
    try {
      const dataSource = this.dataSources.get(id)
      if (!dataSource) {
        throw new Error(`Data source with ID ${id} does not exist`)
      }

      if (!dataSource.isRunning()) {
        await dataSource.start()
      }

      return true
    } catch (error) {
      console.error(`Error starting data source ${id}:`, error)
      this.handleError(id, error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  // Stop a data source
  async stopDataSource(id: string): Promise<boolean> {
    try {
      const dataSource = this.dataSources.get(id)
      if (!dataSource) {
        throw new Error(`Data source with ID ${id} does not exist`)
      }

      if (dataSource.isRunning()) {
        await dataSource.stop()
      }

      return true
    } catch (error) {
      console.error(`Error stopping data source ${id}:`, error)
      this.handleError(id, error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  // Update data source configuration
  async updateDataSourceConfig(id: string, config: any): Promise<boolean> {
    try {
      const dataSource = this.dataSources.get(id)
      if (!dataSource) {
        throw new Error(`Data source with ID ${id} does not exist`)
      }

      return await dataSource.updateConfiguration(config)
    } catch (error) {
      console.error(`Error updating data source ${id} configuration:`, error)
      this.handleError(id, error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  // Get data history
  getDataHistory(): NetworkDataPoint[] {
    return [...this.dataHistory]
  }

  // Get anomaly history
  getAnomalyHistory(): AnomalyEvent[] {
    return [...this.anomalyHistory]
  }

  // Register callbacks
  onData(callback: (data: NetworkDataPoint) => void): void {
    this.dataCallbacks.push(callback)
  }

  onAnomaly(callback: (anomaly: AnomalyEvent) => void): void {
    this.anomalyCallbacks.push(callback)
  }

  onStatus(callback: (sourceId: string, status: DataSourceStatus) => void): void {
    this.statusCallbacks.push(callback)
  }

  onError(callback: (sourceId: string, error: Error) => void): void {
    this.errorCallbacks.push(callback)
  }

  // Handle data from a data source
  private handleData(sourceId: string, data: NetworkDataPoint): void {
    // Only process data from the active source
    if (sourceId === this.activeSource) {
      // Add to history
      this.dataHistory.push(data)

      // Limit history size
      if (this.dataHistory.length > this.maxDataHistorySize) {
        this.dataHistory.shift()
      }

      // Notify callbacks
      this.dataCallbacks.forEach((callback) => callback(data))
    }
  }

  // Handle anomaly from a data source
  private handleAnomaly(sourceId: string, anomaly: AnomalyEvent): void {
    // Only process anomalies from the active source
    if (sourceId === this.activeSource) {
      // Add to history
      this.anomalyHistory.push(anomaly)

      // Limit history size
      if (this.anomalyHistory.length > this.maxAnomalyHistorySize) {
        this.anomalyHistory.shift()
      }

      // Notify callbacks
      this.anomalyCallbacks.forEach((callback) => callback(anomaly))
    }
  }

  // Handle status change from a data source
  private handleStatusChange(sourceId: string, status: DataSourceStatus): void {
    this.statusCallbacks.forEach((callback) => callback(sourceId, status))
  }

  // Handle error from a data source
  private handleError(sourceId: string, error: Error): void {
    this.errorCallbacks.forEach((callback) => callback(sourceId, error))
  }
}

// Create a singleton instance
export const dataManager = new DataManager()
