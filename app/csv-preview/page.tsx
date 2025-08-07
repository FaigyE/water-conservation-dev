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
    try {
      const storedData = localStorage.getItem("installationData")
      if (storedData) {
        const parsedData = JSON.parse(storedData)
        console.log("Loaded data:", parsedData.length, "rows")
        setInstallationData(parsedData)
      } else {
        setError("No installation data found. Please upload an Excel file first.")
        setTimeout(() => router.push("/"), 2000)
      }
    } catch (error) {
      console.error("Error loading installation data from localStorage:", error)
      setError("Failed to load data. Please re-upload the Excel file.")
      setTimeout(() => router.push("/"), 2000)
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleGenerateReport = () => {
    console.log("Generate Report clicked!")
    alert("Report generation feature coming soon!")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to home page...</p>
        </div>
      </div>
    )
  }

  if (installationData.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>No data available. Please upload an Excel file.</p>
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
          <Button onClick={handleGenerateReport} className="mb-4 w-full">
            Generate Report (Coming Soon)
          </Button>
        </CardContent>
      </Card>

      <div className="mb-4 rounded-md border p-4">
        <h3 className="mb-2 font-semibold">Data Sample (First 5 rows):</h3>
        <div className="overflow-auto max-h-96">
          <pre className="text-xs">
            {JSON.stringify(installationData.slice(0, 5), null, 2)}
          </pre>
        </div>
      </div>

      <div className="mb-4 rounded-md border p-4">
        <h3 className="mb-2 font-semibold">Column Headers:</h3>
        <div className="flex flex-wrap gap-2">
          {installationData.length > 0 && Object.keys(installationData[0]).map((key, index) => (
            <span key={index} className="bg-gray-100 px-2 py-1 rounded text-sm">
              {key}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
