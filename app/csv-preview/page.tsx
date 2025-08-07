"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function CsvPreviewPage() {
  const [installationData, setInstallationData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    console.log("CsvPreviewPage: Component mounted, checking localStorage...")
    
    try {
      const storedData = localStorage.getItem("installationData")
      console.log("CsvPreviewPage: Raw stored data:", storedData ? `${storedData.length} characters` : "null")
      
      if (storedData) {
        const parsedData = JSON.parse(storedData)
        console.log("CsvPreviewPage: Parsed data:", parsedData.length, "rows")
        console.log("CsvPreviewPage: Sample row:", parsedData[0])
        setInstallationData(parsedData)
      } else {
        console.log("CsvPreviewPage: No data found in localStorage")
        setError("No installation data found. Please upload an Excel file first.")
        setTimeout(() => {
          console.log("CsvPreviewPage: Redirecting to home page...")
          router.push("/")
        }, 3000)
      }
    } catch (error) {
      console.error("CsvPreviewPage: Error loading installation data from localStorage:", error)
      setError("Failed to load data. Please re-upload the Excel file.")
      setTimeout(() => {
        router.push("/")
      }, 3000)
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleGenerateReport = () => {
    console.log("Generate Report clicked!")
    router.push("/report")
  }

  const handleBackToUpload = () => {
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading data...</p>
          <p className="text-sm text-gray-500 mt-2">Checking localStorage for installation data</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4 text-lg">{error}</p>
          <p className="text-sm text-gray-500 mb-4">Redirecting to home page in a few seconds...</p>
          <Button onClick={handleBackToUpload} variant="outline">
            Go Back Now
          </Button>
        </div>
      </div>
    )
  }

  if (installationData.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">No data available. Please upload an Excel file.</p>
          <Button onClick={handleBackToUpload}>
            Back to Upload
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>CSV Data Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-gray-600">
            Successfully loaded {installationData.length} rows of data.
          </p>
          <div className="flex gap-2 mb-4">
            <Button onClick={handleGenerateReport} className="flex-1">
              Generate Report
            </Button>
            <Button onClick={handleBackToUpload} variant="outline">
              Upload New File
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 rounded-md border p-4">
        <h3 className="mb-2 font-semibold">Data Sample (First 3 rows):</h3>
        <div className="overflow-auto max-h-96">
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(installationData.slice(0, 3), null, 2)}
          </pre>
        </div>
      </div>

      <div className="mb-4 rounded-md border p-4">
        <h3 className="mb-2 font-semibold">Column Headers ({installationData.length > 0 ? Object.keys(installationData[0]).length : 0} columns):</h3>
        <div className="flex flex-wrap gap-2">
          {installationData.length > 0 && Object.keys(installationData[0]).map((key, index) => (
            <span key={index} className="bg-gray-100 px-2 py-1 rounded text-sm">
              {key}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4 rounded-md border p-4">
        <h3 className="mb-2 font-semibold">Data Statistics:</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Total Rows:</strong> {installationData.length}
          </div>
          <div>
            <strong>Total Columns:</strong> {installationData.length > 0 ? Object.keys(installationData[0]).length : 0}
          </div>
          <div>
            <strong>Units with Data:</strong> {installationData.filter(row => row.Unit && row.Unit.trim() !== '').length}
          </div>
          <div>
            <strong>Empty Rows:</strong> {installationData.filter(row => !row.Unit || row.Unit.trim() === '').length}
          </div>
        </div>
      </div>
    </div>
  )
}
