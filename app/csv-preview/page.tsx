"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function CsvPreviewPage() {
  const [installationData, setInstallationData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { addToast } = useToast()

  useEffect(() => {
    try {
      const storedData = localStorage.getItem("installationData")
      if (storedData) {
        const parsedData = JSON.parse(storedData)
        console.log("Loaded data:", parsedData.length, "rows")
        setInstallationData(parsedData)
      } else {
        addToast("No installation data found. Please upload an Excel file first.", "info")
        router.push("/")
      }
    } catch (error) {
      console.error("Error loading installation data from localStorage:", error)
      addToast("Failed to load data. Please re-upload the Excel file.", "destructive")
      router.push("/")
    } finally {
      setLoading(false)
    }
  }, [router, addToast])

  const handleGenerateReport = () => {
    console.log("Generate Report clicked!")
    addToast("Report generation feature coming soon!", "info")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading data...</p>
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
        <pre className="text-xs overflow-auto">
          {JSON.stringify(installationData.slice(0, 5), null, 2)}
        </pre>
      </div>
    </div>
  )
}
