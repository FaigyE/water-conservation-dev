"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useReportContext } from "@/lib/report-context"

export default function DataFormPage() {
  const router = useRouter()
  const { reportData, updateReportData } = useReportContext()
  
  const [formData, setFormData] = useState({
    clientName: "",
    reportDate: "",
    preparedBy: "",
    introduction: "",
    conclusion: "",
  })

  const [installationData, setInstallationData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if we have installation data
    const storedData = localStorage.getItem("installationData")
    if (!storedData) {
      router.push("/")
      return
    }

    try {
      const parsedData = JSON.parse(storedData)
      setInstallationData(parsedData)
      
      // Load existing form data from context
      setFormData({
        clientName: reportData.clientName,
        reportDate: reportData.reportDate,
        preparedBy: reportData.preparedBy,
        introduction: reportData.introduction,
        conclusion: reportData.conclusion,
      })
    } catch (error) {
      console.error("Error loading data:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }, [router, reportData])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Update the report context immediately
    updateReportData(field as keyof typeof reportData, value)
  }

  const handleGenerateReport = () => {
    // Save all form data to report context
    Object.entries(formData).forEach(([key, value]) => {
      updateReportData(key as keyof typeof reportData, value)
    })
    
    // Navigate to report page
    router.push("/report")
  }

  const handleBackToUpload = () => {
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Excel data loaded: {installationData.length} rows
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Please fill out the information below to generate your water conservation report.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => handleInputChange("clientName", e.target.value)}
                placeholder="Enter client name"
                required
              />
            </div>

            <div>
              <Label htmlFor="reportDate">Report Date *</Label>
              <Input
                id="reportDate"
                type="date"
                value={formData.reportDate}
                onChange={(e) => handleInputChange("reportDate", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="preparedBy">Prepared By *</Label>
              <Input
                id="preparedBy"
                value={formData.preparedBy}
                onChange={(e) => handleInputChange("preparedBy", e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        <Card>
          <CardHeader>
            <CardTitle>Report Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="introduction">Introduction</Label>
              <Textarea
                id="introduction"
                value={formData.introduction}
                onChange={(e) => handleInputChange("introduction", e.target.value)}
                placeholder="Brief introduction about the water conservation project..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="conclusion">Conclusion</Label>
              <Textarea
                id="conclusion"
                value={formData.conclusion}
                onChange={(e) => handleInputChange("conclusion", e.target.value)}
                placeholder="Summary and recommendations..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Preview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Installation Data Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <strong>Total Units:</strong> {installationData.length}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Columns:</strong> {installationData.length > 0 ? Object.keys(installationData[0]).length : 0}
            </p>
          </div>
          
          {installationData.length > 0 && (
            <div className="overflow-auto max-h-64 border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(installationData[0]).slice(0, 6).map((key) => (
                      <th key={key} className="p-2 text-left border-b">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {installationData.slice(0, 5).map((row, index) => (
                    <tr key={index} className="border-b">
                      {Object.keys(installationData[0]).slice(0, 6).map((key) => (
                        <td key={key} className="p-2">
                          {row[key] || ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-2">
            Showing first 5 rows and 6 columns
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <Button 
          onClick={handleGenerateReport} 
          className="flex-1"
          disabled={!formData.clientName || !formData.reportDate || !formData.preparedBy}
        >
          Generate Report
        </Button>
        <Button onClick={handleBackToUpload} variant="outline">
          Upload New File
        </Button>
      </div>
    </div>
  )
}
