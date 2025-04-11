import { jsPDF } from "jspdf"

export function generateAnomalyPDF(anomalies: any[], applicationName = "Network Anomaly Detection") {
  // Create a new PDF document
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  let yPosition = margin

  // Add title
  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text(applicationName, pageWidth / 2, yPosition, { align: "center" })
  yPosition += 10

  // Add subtitle
  doc.setFontSize(12)
  doc.setTextColor(80, 80, 80)
  doc.text("Anomaly Detection Report", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 8

  // Add timestamp
  const now = new Date()
  doc.setFontSize(10)
  doc.text(`Generated on: ${now.toLocaleString()}`, pageWidth / 2, yPosition, { align: "center" })
  yPosition += 12

  // Add summary
  doc.setFontSize(12)
  doc.setTextColor(40, 40, 40)
  doc.text(`Total Anomalies: ${anomalies.length}`, margin, yPosition)
  yPosition += 6

  const criticalCount = anomalies.filter((a) => a.severity === "critical").length
  const warningCount = anomalies.filter((a) => a.severity === "warning").length
  const infoCount = anomalies.filter((a) => a.severity === "info").length

  doc.text(`Critical: ${criticalCount}`, margin, yPosition)
  yPosition += 6
  doc.text(`Warning: ${warningCount}`, margin, yPosition)
  yPosition += 6
  doc.text(`Info: ${infoCount}`, margin, yPosition)
  yPosition += 12

  // Add table header
  const colWidths = [50, 40, 30, 40, 70]
  const colPositions = [margin]
  for (let i = 1; i < colWidths.length; i++) {
    colPositions[i] = colPositions[i - 1] + colWidths[i - 1]
  }

  // Draw table header
  doc.setFillColor(66, 139, 202)
  doc.setDrawColor(66, 139, 202)
  doc.rect(margin, yPosition, pageWidth - margin * 2, 8, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)

  doc.text("Timestamp", colPositions[0] + 2, yPosition + 5.5)
  doc.text("Type", colPositions[1] + 2, yPosition + 5.5)
  doc.text("Severity", colPositions[2] + 2, yPosition + 5.5)
  doc.text("Source", colPositions[3] + 2, yPosition + 5.5)
  doc.text("Description", colPositions[4] + 2, yPosition + 5.5)

  yPosition += 8

  // Draw table rows
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(8)

  for (let i = 0; i < anomalies.length; i++) {
    const anomaly = anomalies[i]
    const rowHeight = 8

    // Set background color based on severity
    if (anomaly.severity === "critical") {
      doc.setFillColor(255, 200, 200)
      doc.setDrawColor(255, 200, 200)
      doc.rect(margin, yPosition, pageWidth - margin * 2, rowHeight, "F")
    } else if (anomaly.severity === "warning") {
      doc.setFillColor(255, 235, 200)
      doc.setDrawColor(255, 235, 200)
      doc.rect(margin, yPosition, pageWidth - margin * 2, rowHeight, "F")
    } else if (i % 2 === 0) {
      doc.setFillColor(240, 240, 240)
      doc.setDrawColor(240, 240, 240)
      doc.rect(margin, yPosition, pageWidth - margin * 2, rowHeight, "F")
    }

    // Add row data
    doc.text(new Date(anomaly.timestamp).toLocaleString(), colPositions[0] + 2, yPosition + 5)
    doc.text(formatAnomalyType(anomaly.type), colPositions[1] + 2, yPosition + 5)
    doc.text(anomaly.severity, colPositions[2] + 2, yPosition + 5)
    doc.text(anomaly.source, colPositions[3] + 2, yPosition + 5)

    // Truncate description if too long
    const description = anomaly.description.substring(0, 30) + (anomaly.description.length > 30 ? "..." : "")
    doc.text(description, colPositions[4] + 2, yPosition + 5)

    yPosition += rowHeight

    // Add new page if needed
    if (yPosition > pageHeight - 20) {
      doc.addPage()
      yPosition = margin
    }
  }

  // Add footer to all pages
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Page ${i} of ${pageCount} - ${applicationName}`, pageWidth / 2, pageHeight - 10, { align: "center" })
  }

  // Save the PDF
  doc.save("anomaly-report.pdf")
}

// Helper function to format anomaly type
function formatAnomalyType(type: string) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
