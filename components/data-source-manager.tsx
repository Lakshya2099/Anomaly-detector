"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertCircle, Check, Database, Loader2, Network, Plus, Server, Settings, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import DataSourceConfig from "@/components/data-source-config"

export default function DataSourceManager({
  dataSources = [],
  activeSourceId = null,
  onAddDataSource,
  onRemoveDataSource,
  onSetActiveSource,
}) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Get icon for data source type
  const getDataSourceIcon = (type) => {
    if (!type) return <Database className="h-5 w-5" />

    const typeStr = String(type).toLowerCase()

    if (typeStr.includes("pcap")) {
      return <Network className="h-5 w-5" />
    } else if (typeStr.includes("snmp")) {
      return <Server className="h-5 w-5" />
    } else if (typeStr.includes("netflow")) {
      return <Database className="h-5 w-5" />
    } else if (typeStr.includes("syslog")) {
      return <Server className="h-5 w-5" />
    } else if (typeStr.includes("simulated")) {
      return <Settings className="h-5 w-5" />
    } else {
      return <Database className="h-5 w-5" />
    }
  }

  // Get status badge variant
  const getStatusVariant = (status) => {
    if (!status) return "outline"

    switch (status.status) {
      case "running":
        return "success"
      case "initializing":
        return "outline"
      case "stopped":
        return "secondary"
      case "error":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Handle setting active source
  const handleSetActive = async (id) => {
    setIsLoading(true)
    setError("")

    try {
      const result = await onSetActiveSource(id)
      if (!result) {
        setError("Failed to set active data source")
      }
    } catch (err) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle removing a data source
  const handleRemove = async (id) => {
    setIsLoading(true)
    setError("")

    try {
      const result = await onRemoveDataSource(id)
      if (!result) {
        setError("Failed to remove data source")
      }
      setConfirmDelete(null)
    } catch (err) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Data Sources</CardTitle>
            <CardDescription>Manage network data sources for anomaly detection</CardDescription>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Source
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {dataSources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Database className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No Data Sources</h3>
              <p className="text-muted-foreground">Add a data source to start monitoring network traffic</p>
              <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Data Source
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {dataSources.map((source) => (
                <div
                  key={source.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${source.id === activeSourceId ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${source.id === activeSourceId ? "bg-primary/10" : "bg-muted"}`}>
                      {getDataSourceIcon(source.id)}
                    </div>
                    <div>
                      <h4 className="font-medium">{source.source?.name || source.id}</h4>
                      <p className="text-sm text-muted-foreground">
                        {source.source?.description || "Network data source"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusVariant(source.source?.getStatus())}>
                      {source.source?.getStatus()?.status || "Unknown"}
                    </Badge>

                    {source.id !== activeSourceId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(source.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set Active"}
                      </Button>
                    )}

                    {source.id === activeSourceId && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}

                    <Dialog open={confirmDelete === source.id} onOpenChange={(open) => !open && setConfirmDelete(null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(source.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Remove Data Source</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to remove the data source "{source.id}"? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={() => handleRemove(source.id)}>
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Remove
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl">
          <DataSourceConfig
            onAddDataSource={onAddDataSource}
            onCancel={() => setShowAddDialog(false)}
            dataSources={dataSources}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
