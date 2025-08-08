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
        setInstallationData(parsedData)
      } else {
        setError("No installation data found. Please upload an Excel file first.")
        setTimeout(() => router.push("/"), 3000)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Failed to load data. Please re-upload the Excel file.")
      setTimeout(() => router.push("/"), 3000)
    } finally {
      setLoading(false)
    }
  }, [router])

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>
  if (error) return <div className="flex min-h-screen items-center justify-center"><p className="text-red-600">{error}</p></div>

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Successfully loaded {installationData.length} rows of data.</p>
          <div className="flex gap-2 mb-4">
            <Button onClick={() => router.push("/data-form")} className="flex-1">
              Continue to Report Form
            </Button>
            <Button onClick={() => router.push("/")} variant="outline">
              Upload New File
            </Button>
          </div>
        </CardContent>
      </Card>

      {installationData.length > 0 && (
        <div className="overflow-auto max-h-96 border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {Object.keys(installationData[0]).slice(0, 6).map((key) => (
                  <th key={key} className="p-2 text-left border-b">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {installationData.slice(0, 10).map((row, index) => (
                <tr key={index} className="border-b">
                  {Object.keys(installationData[0]).slice(0, 6).map((key) => (
                    <td key={key} className="p-2">{row[key] || ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
