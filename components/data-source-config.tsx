"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { getAvailableDataSources } from "@/lib/data-sources"
import { AlertCircle, Check, Database, Loader2, Network, Server, Settings } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DataSourceConfig({ onAddDataSource, onCancel, dataSources = [] }) {
  const [selectedType, setSelectedType] = useState("simulated")
  const [dataSourceId, setDataSourceId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Configuration state for each data source type
  const [pcapConfig, setPcapConfig] = useState({
    interface: "eth0",
    promiscuous: true,
    captureFilter: "ip",
    sampleInterval: 1000,
  })

  const [snmpConfig, setSnmpConfig] = useState({
    host: "192.168.1.1",
    port: 161,
    community: "public",
    version: 2,
    pollInterval: 5000,
  })

  const [netflowConfig, setNetflowConfig] = useState({
    listenPort: 9996,
    listenAddress: "0.0.0.0",
    exporters: "192.168.1.1",
    aggregationInterval: 5000,
  })

  const [syslogConfig, setSyslogConfig] = useState({
    listenPort: 514,
    listenAddress: "0.0.0.0",
    protocol: "udp",
    facilities: "kern,daemon,local0,local1,local2",
    severities: "emerg,alert,crit,err,warning,notice,info",
    aggregationInterval: 5000,
  })

  const [simulatedConfig, setSimulatedConfig] = useState({
    updateInterval: 1000,
    anomalyProbability: 0.05,
    simulateNetworkPatterns: true,
    simulateTimeOfDayPatterns: true,
  })

  // Get available data sources
  const availableDataSources = getAvailableDataSources()

  // Generate a unique ID for the data source
  const generateId = () => {
    const type = selectedType
    const existingIds = dataSources.map((ds) => ds.id)
    let id = type
    let counter = 1

    while (existingIds.includes(id)) {
      id = `${type}${counter}`
      counter++
    }

    return id
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Generate ID if not provided
      const id = dataSourceId.trim() || generateId()

      // Get configuration based on selected type
      let config
      switch (selectedType) {
        case "pcap":
          config = {
            ...pcapConfig,
            sampleInterval: Number(pcapConfig.sampleInterval),
          }
          break
        case "snmp":
          config = {
            ...snmpConfig,
            port: Number(snmpConfig.port),
            version: Number(snmpConfig.version),
            pollInterval: Number(snmpConfig.pollInterval),
          }
          break
        case "netflow":
          config = {
            ...netflowConfig,
            listenPort: Number(netflowConfig.listenPort),
            exporters: netflowConfig.exporters.split(",").map((e) => e.trim()),
            aggregationInterval: Number(netflowConfig.aggregationInterval),
          }
          break
        case "syslog":
          config = {
            ...syslogConfig,
            listenPort: Number(syslogConfig.listenPort),
            facilities: syslogConfig.facilities.split(",").map((f) => f.trim()),
            severities: syslogConfig.severities.split(",").map((s) => s.trim()),
            aggregationInterval: Number(syslogConfig.aggregationInterval),
          }
          break
        case "simulated":
          config = {
            ...simulatedConfig,
            updateInterval: Number(simulatedConfig.updateInterval),
            anomalyProbability: Number(simulatedConfig.anomalyProbability),
          }
          break
      }

      // Add data source
      const result = await onAddDataSource(id, selectedType, config)

      if (result) {
        setSuccess(`Data source "${id}" added successfully`)
        setTimeout(() => {
          onCancel()
        }, 1500)
      } else {
        setError("Failed to add data source")
      }
    } catch (error) {
      setError(error.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Get icon for data source type
  const getDataSourceIcon = (type) => {
    switch (type) {
      case "pcap":
        return <Network className="h-5 w-5" />
      case "snmp":
        return <Server className="h-5 w-5" />
      case "netflow":
        return <Database className="h-5 w-5" />
      case "syslog":
        return <Server className="h-5 w-5" />
      case "simulated":
        return <Settings className="h-5 w-5" />
      default:
        return <Database className="h-5 w-5" />
    }
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Add Data Source</CardTitle>
        <CardDescription>Configure a new network data source for anomaly detection</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="add-data-source-form" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataSourceType">Data Source Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger id="dataSourceType">
                    <SelectValue placeholder="Select data source type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDataSources.map((ds) => (
                      <SelectItem key={ds.type} value={ds.type}>
                        <div className="flex items-center">
                          {getDataSourceIcon(ds.type)}
                          <span className="ml-2">{ds.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataSourceId">Data Source ID (optional)</Label>
                <Input
                  id="dataSourceId"
                  placeholder={generateId()}
                  value={dataSourceId}
                  onChange={(e) => setDataSourceId(e.target.value)}
                />
              </div>
            </div>

            <Tabs value={selectedType} onValueChange={setSelectedType} className="mt-6">
              <TabsList className="grid grid-cols-5">
                <TabsTrigger value="pcap">Packet Capture</TabsTrigger>
                <TabsTrigger value="snmp">SNMP</TabsTrigger>
                <TabsTrigger value="netflow">NetFlow</TabsTrigger>
                <TabsTrigger value="syslog">Syslog</TabsTrigger>
                <TabsTrigger value="simulated">Simulated</TabsTrigger>
              </TabsList>

              <TabsContent value="pcap" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pcapInterface">Network Interface</Label>
                    <Input
                      id="pcapInterface"
                      value={pcapConfig.interface}
                      onChange={(e) => setPcapConfig({ ...pcapConfig, interface: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pcapFilter">Capture Filter</Label>
                    <Input
                      id="pcapFilter"
                      value={pcapConfig.captureFilter}
                      onChange={(e) => setPcapConfig({ ...pcapConfig, captureFilter: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pcapInterval">Sample Interval (ms)</Label>
                    <Input
                      id="pcapInterval"
                      type="number"
                      value={pcapConfig.sampleInterval}
                      onChange={(e) => setPcapConfig({ ...pcapConfig, sampleInterval: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="pcapPromiscuous"
                      checked={pcapConfig.promiscuous}
                      onCheckedChange={(checked) => setPcapConfig({ ...pcapConfig, promiscuous: checked })}
                    />
                    <Label htmlFor="pcapPromiscuous">Promiscuous Mode</Label>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Permissions Required</AlertTitle>
                  <AlertDescription>
                    Packet capture requires administrator privileges or appropriate capabilities.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="snmp" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="snmpHost">Host</Label>
                    <Input
                      id="snmpHost"
                      value={snmpConfig.host}
                      onChange={(e) => setSnmpConfig({ ...snmpConfig, host: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="snmpPort">Port</Label>
                    <Input
                      id="snmpPort"
                      type="number"
                      value={snmpConfig.port}
                      onChange={(e) => setSnmpConfig({ ...snmpConfig, port: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="snmpCommunity">Community</Label>
                    <Input
                      id="snmpCommunity"
                      value={snmpConfig.community}
                      onChange={(e) => setSnmpConfig({ ...snmpConfig, community: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="snmpVersion">SNMP Version</Label>
                    <Select
                      value={String(snmpConfig.version)}
                      onValueChange={(value) => setSnmpConfig({ ...snmpConfig, version: Number(value) })}
                    >
                      <SelectTrigger id="snmpVersion">
                        <SelectValue placeholder="Select SNMP version" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">v1</SelectItem>
                        <SelectItem value="2">v2c</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="snmpInterval">Poll Interval (ms)</Label>
                    <Input
                      id="snmpInterval"
                      type="number"
                      value={snmpConfig.pollInterval}
                      onChange={(e) => setSnmpConfig({ ...snmpConfig, pollInterval: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="netflow" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="netflowPort">Listen Port</Label>
                    <Input
                      id="netflowPort"
                      type="number"
                      value={netflowConfig.listenPort}
                      onChange={(e) => setNetflowConfig({ ...netflowConfig, listenPort: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="netflowAddress">Listen Address</Label>
                    <Input
                      id="netflowAddress"
                      value={netflowConfig.listenAddress}
                      onChange={(e) => setNetflowConfig({ ...netflowConfig, listenAddress: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="netflowExporters">Exporters (comma-separated)</Label>
                    <Input
                      id="netflowExporters"
                      value={netflowConfig.exporters}
                      onChange={(e) => setNetflowConfig({ ...netflowConfig, exporters: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="netflowInterval">Aggregation Interval (ms)</Label>
                    <Input
                      id="netflowInterval"
                      type="number"
                      value={netflowConfig.aggregationInterval}
                      onChange={(e) => setNetflowConfig({ ...netflowConfig, aggregationInterval: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="syslog" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="syslogPort">Listen Port</Label>
                    <Input
                      id="syslogPort"
                      type="number"
                      value={syslogConfig.listenPort}
                      onChange={(e) => setSyslogConfig({ ...syslogConfig, listenPort: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="syslogAddress">Listen Address</Label>
                    <Input
                      id="syslogAddress"
                      value={syslogConfig.listenAddress}
                      onChange={(e) => setSyslogConfig({ ...syslogConfig, listenAddress: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="syslogFacilities">Facilities (comma-separated)</Label>
                    <Input
                      id="syslogFacilities"
                      value={syslogConfig.facilities}
                      onChange={(e) => setSyslogConfig({ ...syslogConfig, facilities: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="syslogSeverities">Severities (comma-separated)</Label>
                    <Input
                      id="syslogSeverities"
                      value={syslogConfig.severities}
                      onChange={(e) => setSyslogConfig({ ...syslogConfig, severities: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="syslogInterval">Aggregation Interval (ms)</Label>
                    <Input
                      id="syslogInterval"
                      type="number"
                      value={syslogConfig.aggregationInterval}
                      onChange={(e) => setSyslogConfig({ ...syslogConfig, aggregationInterval: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="simulated" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="simulatedInterval">Update Interval (ms)</Label>
                    <Input
                      id="simulatedInterval"
                      type="number"
                      value={simulatedConfig.updateInterval}
                      onChange={(e) => setSimulatedConfig({ ...simulatedConfig, updateInterval: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="simulatedProbability">Anomaly Probability</Label>
                    <Input
                      id="simulatedProbability"
                      type="number"
                      step="0.01"
                      value={simulatedConfig.anomalyProbability}
                      onChange={(e) => setSimulatedConfig({ ...simulatedConfig, anomalyProbability: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="simulatedNetworkPatterns"
                      checked={simulatedConfig.simulateNetworkPatterns}
                      onCheckedChange={(checked) =>
                        setSimulatedConfig({ ...simulatedConfig, simulateNetworkPatterns: checked })
                      }
                    />
                    <Label htmlFor="simulatedNetworkPatterns">Simulate Network Patterns</Label>
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="simulatedTimeOfDayPatterns"
                      checked={simulatedConfig.simulateTimeOfDayPatterns}
                      onCheckedChange={(checked) =>
                        setSimulatedConfig({ ...simulatedConfig, simulateTimeOfDayPatterns: checked })
                      }
                    />
                    <Label htmlFor="simulatedTimeOfDayPatterns">Simulate Time-of-Day Patterns</Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" form="add-data-source-form" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Data Source
        </Button>
      </CardFooter>

      {error && (
        <Alert variant="destructive" className="mt-4 mx-6 mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mt-4 mx-6 mb-2">
          <Check className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </Card>
  )
}
