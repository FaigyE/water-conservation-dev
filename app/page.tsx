"use client"

import type React from "react"
import { useState } from "react"
import { parseExcel } from "@/lib/excel-parser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
      setError(null)
      setSuccess(null)
    } else {
      setFile(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an Excel file to upload.")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      console.log("Starting to parse Excel file:", file.name)
      const data = await parseExcel(file)
      console.log("Parsed data:", data.length, "rows")
      
      // Save to localStorage
      localStorage.setItem("installationData", JSON.stringify(data))
      console.log("Data saved to localStorage")
      
      setSuccess(`File uploaded successfully! Found ${data.length} rows of data.`)
      
      // Navigate to preview page
      setTimeout(() => {
        router.push("/csv-preview")
      }, 1500)
    } catch (error) {
      console.error("Error uploading file:", error)
      setError(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Water Conservation Report Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
          
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
              {success}
            </div>
          )}
          
          <Button onClick={handleUpload} className="w-full" disabled={!file || loading}>
            {loading ? "Processing..." : "Upload and Continue"}
          </Button>
          
          {file && (
            <p className="text-sm text-gray-600 text-center">
              Selected: {file.name}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
