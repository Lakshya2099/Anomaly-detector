"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, AlertTriangle, Info, ArrowUpDown, Eye, Download } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { generateAnomalyPDF } from "@/lib/pdf-generator"

export default function AnomalyTable({ anomalies }) {
  const [sortField, setSortField] = useState("timestamp")
  const [sortDirection, setSortDirection] = useState("desc")
  const [selectedAnomaly, setSelectedAnomaly] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Handle sort
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Sort anomalies
  const sortedAnomalies = [...anomalies].sort((a, b) => {
    if (sortField === "timestamp") {
      return sortDirection === "asc"
        ? new Date(a.timestamp) - new Date(b.timestamp)
        : new Date(b.timestamp) - new Date(a.timestamp)
    } else {
      return sortDirection === "asc"
        ? a[sortField].localeCompare(b[sortField])
        : b[sortField].localeCompare(a[sortField])
    }
  })

  // View anomaly details
  const viewAnomalyDetails = (anomaly) => {
    setSelectedAnomaly(anomaly)
    setDialogOpen(true)
  }

  // Download anomaly report as PDF
  const downloadAnomalyReport = () => {
    generateAnomalyPDF(sortedAnomalies)
  }

  if (anomalies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Info className="h-10 w-10 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">No Anomalies Detected</h3>
        <p className="text-muted-foreground">Network traffic is currently normal with no detected anomalies.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={downloadAnomalyReport} className="flex items-center gap-1">
          <Download className="h-4 w-4" />
          Download PDF Report
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">
              <Button
                variant="ghost"
                onClick={() => handleSort("timestamp")}
                className="flex items-center p-0 h-auto font-medium"
              >
                Timestamp
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("type")}
                className="flex items-center p-0 h-auto font-medium"
              >
                Type
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("severity")}
                className="flex items-center p-0 h-auto font-medium"
              >
                Severity
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAnomalies.map((anomaly, index) => (
            <TableRow key={index} className={anomaly.isNew ? "bg-muted/50" : ""}>
              <TableCell className="font-medium">{new Date(anomaly.timestamp).toLocaleString()}</TableCell>
              <TableCell>{formatAnomalyType(anomaly.type)}</TableCell>
              <TableCell>
                <Badge variant={getSeverityVariant(anomaly.severity)}>
                  {anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>{anomaly.source}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => viewAnomalyDetails(anomaly)} className="h-8 w-8 p-0">
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View details</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Anomaly Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          {selectedAnomaly && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  {getSeverityIcon(selectedAnomaly.severity)}
                  <span className="ml-2">Anomaly Details</span>
                </DialogTitle>
                <DialogDescription>
                  Detected at {new Date(selectedAnomaly.timestamp).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                    <p>{formatAnomalyType(selectedAnomaly.type)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Severity</h4>
                    <Badge variant={getSeverityVariant(selectedAnomaly.severity)}>
                      {selectedAnomaly.severity.charAt(0).toUpperCase() + selectedAnomaly.severity.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Source</h4>
                    <p>{selectedAnomaly.source}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
                    <p>{selectedAnomaly.duration || "Ongoing"}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                  <p className="text-sm">{selectedAnomaly.description}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Metrics</h4>
                  <div className="bg-muted p-3 rounded-md text-sm font-mono">
                    <div>Threshold: {selectedAnomaly.metrics?.threshold}</div>
                    <div>Actual Value: {selectedAnomaly.metrics?.actualValue}</div>
                    <div>Deviation: {selectedAnomaly.metrics?.deviation}%</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Recommended Action</h4>
                  <p className="text-sm">{selectedAnomaly.recommendedAction}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper functions
function formatAnomalyType(type) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function getSeverityVariant(severity) {
  switch (severity) {
    case "critical":
      return "destructive"
    case "warning":
      return "warning"
    case "info":
      return "secondary"
    default:
      return "outline"
  }
}

function getSeverityIcon(severity) {
  switch (severity) {
    case "critical":
      return <AlertCircle className="h-5 w-5 text-destructive" />
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-warning" />
    case "info":
      return <Info className="h-5 w-5 text-secondary" />
    default:
      return <Info className="h-5 w-5" />
  }
}
