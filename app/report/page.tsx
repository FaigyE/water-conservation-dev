"use client"

import { useEffect, useState } from "react"
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
import type { CustomerInfo, InstallationData } from "@/lib/types"

export default function ReportPage() {
  const router = useRouter()
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [installationData, setInstallationData] = useState<InstallationData[]>([])
  const [toiletCount, setToiletCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState("cover")
  const [csvSchema, setCsvSchema] = useState<any[]>([])

  useEffect(() => {
    // Load data from localStorage
    const storedCustomerInfo = localStorage.getItem("customerInfo")
    const storedInstallationData = localStorage.getItem("installationData")

    if (storedCustomerInfo && storedInstallationData) {
      const parsedCustomerInfo = JSON.parse(storedCustomerInfo)
      const parsedInstallationData = JSON.parse(storedInstallationData)

      setCustomerInfo(parsedCustomerInfo)
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
        console.log("CSV Schema:", JSON.stringify(schema))
        console.log("First few rows:", parsedInstallationData.slice(0, 3))
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
    }

    setLoading(false)
  }, [])

  const handleBack = () => {
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!customerInfo || installationData.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">No Data Found</h2>
            <p className="mb-4">
              No installation data or customer information found. Please go back and submit the form.
            </p>
            <Button onClick={handleBack}>Back to Form</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filter out rows without valid unit/apartment numbers
  const filteredData = installationData.filter((item) => {
    // Check if Unit exists and is not empty
    if (!item.Unit || item.Unit.trim() === "") return false

    // Filter out rows with non-apartment values (often headers, totals, etc.)
    const lowerUnit = item.Unit.toLowerCase()
    const invalidValues = ["total", "sum", "average", "avg", "count", "header", "n/a", "na"]
    if (invalidValues.some((val) => lowerUnit.includes(val))) return false

    return true
  })

  console.log(`Filtered ${installationData.length - filteredData.length} rows without valid unit numbers`)

  // Helper function to check for toilet installation
  const hasToiletInstalled = (item: InstallationData): boolean => {
    // Check both possible column names for toilet installation
    return (
      (item["Toilets Installed:  53"] && item["Toilets Installed:  53"] !== "") ||
      (item["Toilets Installed:  113"] && item["Toilets Installed:  113"] !== "")
    )
  }

  // Group notes for the notes pages
  const notes = filteredData
    .filter(
      (item) =>
        item["Leak Issue Kitchen Faucet"] || item["Leak Issue Bath Faucet"] || item["Tub Spout/Diverter Leak Issue"],
    )
    .map((item) => {
      let noteText = ""
      if (item["Leak Issue Kitchen Faucet"]) noteText += "Driping from kitchen faucet. "
      if (item["Leak Issue Bath Faucet"]) noteText += "Dripping from bathroom faucet. "
      if (item["Tub Spout/Diverter Leak Issue"] === "Light") noteText += "Light leak from tub spout/ diverter. "
      if (item["Tub Spout/Diverter Leak Issue"] === "Moderate") noteText += "Moderate leak from tub spout/diverter. "
      if (item["Tub Spout/Diverter Leak Issue"] === "Heavy") noteText += "Heavy leak from tub spout/ diverter. "

      return {
        unit: item.Unit,
        note: noteText.trim(),
      }
    })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Button variant="outline" onClick={handleBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Form
        </Button>
        <div className="flex flex-wrap gap-2">
          {customerInfo && (
            <>
              <EnhancedPdfButton
                customerInfo={customerInfo}
                installationData={filteredData}
                toiletCount={toiletCount}
                notes={notes}
              />
            </>
          )}
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
            <ReportCoverPage customerInfo={customerInfo} />
          </TabsContent>

          <TabsContent value="letter">
            <ReportLetterPage customerInfo={customerInfo} toiletCount={toiletCount} />
          </TabsContent>

          <TabsContent value="notes">
            <ReportNotesPage notes={notes} />
          </TabsContent>

          <TabsContent value="details">
            <ReportDetailPage installationData={filteredData} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Hidden content for printing */}
      <div className="hidden print-content">
        <div className="report-page">
          <ReportCoverPage customerInfo={customerInfo} />
        </div>
        <div className="page-break"></div>
        <div className="report-page">
          <ReportLetterPage customerInfo={customerInfo} toiletCount={toiletCount} />
        </div>
        <div className="page-break"></div>
        <div className="report-page">
          <ReportNotesPage notes={notes} />
        </div>
        <div className="page-break"></div>
        <div className="report-page">
          <ReportDetailPage installationData={filteredData} />
        </div>
      </div>
    </div>
  )
}
