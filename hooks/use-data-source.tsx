"use client"

import { useState, useCallback, useEffect } from "react"
import { dataManager } from "@/lib/data-manager"
import type { NetworkDataPoint, AnomalyEvent, DataSourceStatus, DataSourceType } from "@/lib/data-sources"

// Hook for accessing and managing data sources
export function useDataSource() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("disconnected")
  const [networkData, setNetworkData] = useState<{
    packetsPerSecond: number
    bandwidth: number
    activeConnections: number
    errorRate: number
    trafficHistory: NetworkDataPoint[]
  }>({
    packetsPerSecond: 0,
    bandwidth: 0,
    activeConnections: 0,
    errorRate: 0,
    trafficHistory: [],
  })
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([])
  const [dataSources, setDataSources] = useState<{ id: string; name: string; status: string; active: boolean }[]>([])
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Connect to data source
  const connect = useCallback(async (sourceId?: string) => {
    setConnectionStatus("connecting")
    setError(null)

    try {
      // Get all data sources
      const sources = dataManager.getDataSources()

      // If no sources, add the simulated source
      if (sources.length === 0) {
        await dataManager.addDataSource("simulated", "simulated")
      }

      // If sourceId is provided, set it as active
      if (sourceId) {
        await dataManager.setActiveDataSource(sourceId)
      } else {
        // Otherwise, use the first source
        const firstSource = dataManager.getDataSources()[0]
        if (firstSource) {
          await dataManager.setActiveDataSource(firstSource.id)
        }
      }

      // Start the active source
      const activeSources = dataManager.getDataSources().filter((s) => s.active)
      if (activeSources.length > 0) {
        await dataManager.startDataSource(activeSources[0].id)
        setActiveSourceId(activeSources[0].id)
      }

      setIsConnected(true)
      setConnectionStatus("connected")

      // Update data sources list
      updateDataSourcesList()
    } catch (error) {
      console.error("Error connecting to data source:", error)
      setConnectionStatus("error")
      setError(error instanceof Error ? error.message : "Failed to connect to data source")
    }
  }, [])

  // Disconnect from data source
  const disconnect = useCallback(async () => {
    try {
      // Stop all running data sources
      const sources = dataManager.getDataSources()
      for (const source of sources) {
        if (source.source.isRunning()) {
          await dataManager.stopDataSource(source.id)
        }
      }

      setIsConnected(false)
      setConnectionStatus("disconnected")
    } catch (error) {
      console.error("Error disconnecting from data source:", error)
      setError(error instanceof Error ? error.message : "Failed to disconnect from data source")
    }
  }, [])

  // Switch to a different data source
  const setActiveSource = useCallback(async (sourceId: string) => {
    try {
      await dataManager.setActiveDataSource(sourceId)
      setActiveSourceId(sourceId)
      updateDataSourcesList()
      return true
    } catch (error) {
      console.error("Error switching data source:", error)
      setError(error instanceof Error ? error.message : "Failed to switch data source")
      return false
    }
  }, [])

  // Add a new data source
  const addDataSource = useCallback(async (id: string, type: string, config?: any) => {
    try {
      const result = await dataManager.addDataSource(id, type as DataSourceType, config)
      updateDataSourcesList()
      return result
    } catch (error) {
      console.error("Error adding data source:", error)
      setError(error instanceof Error ? error.message : "Failed to add data source")
      return false
    }
  }, [])

  // Remove a data source
  const removeDataSource = useCallback(async (id: string) => {
    try {
      await dataManager.removeDataSource(id)
      updateDataSourcesList()
      return true
    } catch (error) {
      console.error("Error removing data source:", error)
      setError(error instanceof Error ? error.message : "Failed to remove data source")
      return false
    }
  }, [])

  // Update data sources list
  const updateDataSourcesList = useCallback(() => {
    const sources = dataManager.getDataSources()
    setDataSources(
      sources.map((s) => ({
        id: s.id,
        name: s.source.name,
        status: s.source.isRunning() ? "running" : "stopped",
        active: s.active,
      })),
    )
  }, [])

  // Set up event handlers
  useEffect(() => {
    // Handle data updates
    const handleData = (data: NetworkDataPoint) => {
      setNetworkData((prev) => {
        // Add to history
        const updatedHistory = [...prev.trafficHistory, data]
        if (updatedHistory.length > 60) {
          updatedHistory.shift()
        }

        return {
          packetsPerSecond: data.packetsPerSecond,
          bandwidth: data.bandwidth,
          activeConnections: data.activeConnections,
          errorRate: data.errorRate,
          trafficHistory: updatedHistory,
        }
      })
    }

    // Handle anomaly detection
    const handleAnomaly = (anomaly: AnomalyEvent) => {
      setAnomalies((prev) => {
        // Mark the new anomaly
        const newAnomaly = { ...anomaly, isNew: true }

        // Add to the beginning of the array (newest first)
        const updatedAnomalies = [newAnomaly, ...prev]

        // Remove the "isNew" flag after 5 seconds
        setTimeout(() => {
          setAnomalies((current) => current.map((a) => (a.id === newAnomaly.id ? { ...a, isNew: false } : a)))
        }, 5000)

        return updatedAnomalies
      })
    }

    // Handle status changes
    const handleStatus = (sourceId: string, status: DataSourceStatus) => {
      updateDataSourcesList()

      if (sourceId === activeSourceId) {
        setConnectionStatus(status.status)
      }
    }

    // Handle errors
    const handleError = (sourceId: string, error: Error) => {
      console.error(`Error from data source ${sourceId}:`, error)
      setError(error.message)

      if (sourceId === activeSourceId) {
        setConnectionStatus("error")
      }
    }

    // Register event handlers
    dataManager.onData(handleData)
    dataManager.onAnomaly(handleAnomaly)
    dataManager.onStatus(handleStatus)
    dataManager.onError(handleError)

    // Initialize with existing data
    setNetworkData((prev) => ({
      ...prev,
      trafficHistory: dataManager.getDataHistory(),
    }))

    setAnomalies(dataManager.getAnomalyHistory())
    updateDataSourcesList()

    // Clean up on unmount
    return () => {
      // We can't unregister callbacks from dataManager, but we can disconnect
      if (isConnected) {
        disconnect()
      }
    }
  }, [disconnect, isConnected, activeSourceId, updateDataSourcesList])

  return {
    isConnected,
    connectionStatus,
    networkData,
    anomalies,
    dataSources,
    activeSourceId,
    error,
    connect,
    disconnect,
    setActiveSource,
    addDataSource,
    removeDataSource,
  }
}
