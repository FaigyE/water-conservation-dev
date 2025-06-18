"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import ReportCoverPage from "@/components/report-cover-page"
import ReportLetterPage from "@/components/report-letter-page"
import ReportNotesPage from "@/components/report-notes-page"
import ReportDetailPage from "@/components/report-detail-page"
import EnhancedPdfButton from "@/components/enhanced-pdf-button"
import { ReportProvider, useReportContext } from "@/lib/report-context"
import type { CustomerInfo, InstallationData, Note } from "@/lib/types"

// Loading component - separate component for loading state
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
}

// No data component - separate component for no data state
function NoDataState({ onBack }: { onBack: () => void }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4">No Data Found</h2>
          <p className="mb-4">
            No installation data or customer information found. Please go back and submit the form.
          </p>
          <Button onClick={onBack}>Back to Form</Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Report view component - separate component for the actual report
function ReportView({
  customerInfo,
  installationData,
  toiletCount,
  notes,
  onBack,
}: {
  customerInfo: CustomerInfo
  installationData: InstallationData[]
  toiletCount: number
  notes: Note[]
  onBack: () => void
}) {
  const [currentPage, setCurrentPage] = useState("cover")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Form
        </Button>
        <div className="flex flex-wrap gap-2">
          <EnhancedPdfButton
            customerInfo={customerInfo}
            installationData={installationData}
            toiletCount={toiletCount}
            notes={notes}
          />
        </div>
      </div>

      <div className="print:hidden">
        <Tabs value={currentPage} onValueChange={setCurrentPage}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="cover">Cover Page</TabsTrigger>
            <TabsTrigger value="letter">Letter Page</TabsTrigger>
            <TabsTrigger value="notes">Notes Pages</TabsTrigger>
            <TabsTrigger value="details">Detail Pages</TabsTrigger>
          </TabsList>

          <TabsContent value="cover">
            <ReportCoverPage customerInfo={customerInfo} isEditable={true} />
          </TabsContent>

          <TabsContent value="letter">
            <ReportLetterPage customerInfo={customerInfo} toiletCount={toiletCount} isEditable={true} />
          </TabsContent>

          <TabsContent value="notes">
            <ReportNotesPage notes={notes} isPreview={true} isEditable={true} />
          </TabsContent>

          <TabsContent value="details">
            <ReportDetailPage installationData={installationData} isPreview={true} isEditable={true} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Hidden content for printing - using the same components as the preview but with editing disabled */}
      <div className="hidden print-content">
        <div className="report-page">
          <ReportCoverPage customerInfo={customerInfo} isEditable={false} />
        </div>
        <div className="page-break"></div>
        <div className="report-page">
          <ReportLetterPage customerInfo={customerInfo} toiletCount={toiletCount} isEditable={false} />
        </div>
        <div className="page-break"></div>
        <ReportNotesPage notes={notes} isPreview={false} isEditable={false} />
        <div className="page-break"></div>
        <ReportDetailPage installationData={installationData} isPreview={false} isEditable={false} />
      </div>
    </div>
  )
}

// Main content component
function ReportContent() {
  const router = useRouter()
  const { customerInfo, toiletCount, setToiletCount, notes, setNotes } = useReportContext()

  const [installationData, setInstallationData] = useState<InstallationData[]>([])
  const [loading, setLoading] = useState(true)
  const [csvSchema, setCsvSchema] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<InstallationData[]>([])
  const [reportNotes, setReportNotes] = useState<Note[]>([])

  const handleBack = () => {
    router.push("/")
  }

  // Load data from localStorage
  const loadData = useCallback(() => {
    try {
      const storedInstallationData = localStorage.getItem("installationData")

      if (storedInstallationData) {
        const parsedInstallationData = JSON.parse(storedInstallationData)
        setInstallationData(parsedInstallationData)

        // Log the schema of the CSV data
        if (parsedInstallationData && parsedInstallationData.length > 0) {
          const firstItem = parsedInstallationData[0]
          const schema = Object.keys(firstItem).map((key) => ({
            name: key,
            type: typeof firstItem[key],
            exampleValue: firstItem[key],
          }))
          setCsvSchema(schema)
        }

        // Helper function to find the toilet column and extract the count
        const getToiletInfo = () => {
          if (!parsedInstallationData || parsedInstallationData.length === 0) return { count: 0, totalCount: 0 }

          // Get the first item to check column names
          const firstItem = parsedInstallationData[0]

          // Find the toilet column by looking for keys that start with "Toilets Installed:"
          const toiletColumn = Object.keys(firstItem).find((key) => key.startsWith("Toilets Installed:"))

          if (!toiletColumn) return { count: 0, totalCount: 0 }

          // Extract the total count from the column name (e.g., "Toilets Installed: 53" -> 53)
          const totalCountMatch = toiletColumn.match(/Toilets Installed:\s*(\d+)/)
          const totalCount = totalCountMatch ? Number.parseInt(totalCountMatch[1]) : 0

          // Count installed toilets
          let count = 0
          parsedInstallationData.forEach((item) => {
            if (item[toiletColumn] && item[toiletColumn] !== "") {
              count++
            }
          })

          return { count, totalCount }
        }

        // Replace the toilet counting code in useEffect with this
        const { count, totalCount } = getToiletInfo()
        setToiletCount(totalCount) // Use the total count from the column name

        // Filter out rows without valid unit/apartment numbers and stop at first empty unit
        const filtered = (() => {
          const result = []

          console.log("Starting to process installation data...")
          console.log("Total rows to process:", parsedInstallationData.length)

          for (let i = 0; i < parsedInstallationData.length; i++) {
            const item = parsedInstallationData[i]

            // Get the unit value - be very explicit about this
            const unitValue = item.Unit

            // Log each row for debugging
            console.log(
              `Row ${i + 1}: Unit="${unitValue}" (type: ${typeof unitValue}, length: ${unitValue ? unitValue.length : "null"})`,
            )

            // Check if unit is truly empty - be very strict about this
            if (
              unitValue === undefined ||
              unitValue === null ||
              unitValue === "" ||
              (typeof unitValue === "string" && unitValue.trim() === "")
            ) {
              console.log(
                `STOPPING: Found empty unit at row ${i + 1}. Unit value: "${unitValue}". Processed ${result.length} valid rows.`,
              )
              break // Stop processing immediately when we find an empty unit
            }

            // Convert to string and trim for further checks
            const trimmedUnit = String(unitValue).trim()

            // If after trimming it's empty, stop
            if (trimmedUnit === "") {
              console.log(
                `STOPPING: Found empty unit after trimming at row ${i + 1}. Original: "${unitValue}". Processed ${result.length} valid rows.`,
              )
              break
            }

            // Filter out rows with non-apartment values (often headers, totals, etc.) but continue processing
            const lowerUnit = trimmedUnit.toLowerCase()
            const invalidValues = ["total", "sum", "average", "avg", "count", "header", "n/a", "na"]
            if (invalidValues.some((val) => lowerUnit.includes(val))) {
              console.log(
                `Skipping invalid unit "${trimmedUnit}" at row ${i + 1} (contains: ${invalidValues.find((val) => lowerUnit.includes(val))})`,
              )
              continue // Skip this row but continue processing
            }

            console.log(`Adding valid unit: "${trimmedUnit}"`)
            result.push(item)
          }

          console.log(`Final result: ${result.length} valid units processed`)

          // Sort the results by unit number in ascending order
          return result.sort((a, b) => {
            const unitA = a.Unit
            const unitB = b.Unit

            // Try to parse as numbers first
            const numA = Number.parseInt(unitA)
            const numB = Number.parseInt(unitB)

            // If both are valid numbers, sort numerically
            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB
            }

            // Otherwise, sort alphabetically
            return unitA.localeCompare(unitB, undefined, { numeric: true, sensitivity: "base" })
          })
        })()

        setFilteredData(filtered)

        // Group notes for the notes pages - only include leak issues
        const notes = filtered
          .filter(
            (item: InstallationData) =>
              item["Leak Issue Kitchen Faucet"] ||
              item["Leak Issue Bath Faucet"] ||
              item["Tub Spout/Diverter Leak Issue"],
          )
          .map((item: InstallationData) => {
            let noteText = ""
            if (item["Leak Issue Kitchen Faucet"]) noteText += "Driping from kitchen faucet. "
            if (item["Leak Issue Bath Faucet"]) noteText += "Dripping from bathroom faucet. "
            if (item["Tub Spout/Diverter Leak Issue"] === "Light") noteText += "Light leak from tub spout/ diverter. "
            if (item["Tub Spout/Diverter Leak Issue"] === "Moderate")
              noteText += "Moderate leak from tub spout/diverter. "
            if (item["Tub Spout/Diverter Leak Issue"] === "Heavy") noteText += "Heavy leak from tub spout/ diverter. "

            return {
              unit: item.Unit,
              note: noteText.trim(),
            }
          })
          .filter((note: Note) => note.note !== "") // Remove notes that are empty after filtering

        setReportNotes(notes)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }, [setToiletCount])

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [loadData])

  // Update notes in context if they've changed
  useEffect(() => {
    if (JSON.stringify(reportNotes) !== JSON.stringify(notes)) {
      setNotes(reportNotes)
    }
  }, [reportNotes, notes, setNotes])

  // Render appropriate component based on state
  if (loading) {
    return <LoadingState />
  }

  if (!customerInfo || installationData.length === 0) {
    return <NoDataState onBack={handleBack} />
  }

  return (
    <ReportView
      customerInfo={customerInfo}
      installationData={filteredData}
      toiletCount={toiletCount}
      notes={notes}
      onBack={handleBack}
    />
  )
}

export default function ReportPage() {
  return (
    <ReportProvider>
      <ReportContent />
    </ReportProvider>
  )
}
