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
import SimplePdfButton from "@/components/simple-pdf-button"
import EnhancedPdfButton from "@/components/enhanced-pdf-button"
import PrintButton from "@/components/print-button"
import type { CustomerInfo, InstallationData } from "@/lib/types"

export default function ReportPage() {
  const router = useRouter()
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [installationData, setInstallationData] = useState<InstallationData[]>([])
  const [toiletCount, setToiletCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState("cover")

  useEffect(() => {
    // Load data from localStorage
    const storedCustomerInfo = localStorage.getItem("customerInfo")
    const storedInstallationData = localStorage.getItem("installationData")

    if (storedCustomerInfo && storedInstallationData) {
      const parsedCustomerInfo = JSON.parse(storedCustomerInfo)
      const parsedInstallationData = JSON.parse(storedInstallationData)

      setCustomerInfo(parsedCustomerInfo)
      setInstallationData(parsedInstallationData)

      // Count toilets installed
      let count = 0
      parsedInstallationData.forEach((item: InstallationData) => {
        if (item["Toilets Installed:  113"] === "1") {
          count++
        }
      })
      setToiletCount(count)
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

  // Group notes for the notes pages
  const notes = installationData
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
                installationData={installationData}
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
            <ReportDetailPage installationData={installationData} />
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
          <ReportDetailPage installationData={installationData} />
        </div>
      </div>
    </div>
  )
}
