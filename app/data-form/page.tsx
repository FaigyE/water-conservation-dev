"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function DataFormPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    clientName: "",
    reportDate: new Date().toISOString().split('T')[0],
    preparedBy: "",
    introduction: "This report outlines the findings and recommendations for water conservation efforts at the client's property.",
    conclusion: "Implementing the recommended changes will significantly reduce water consumption and lead to substantial savings.",
  })

  useEffect(() => {
    // Check if we have installation data
    const storedData = localStorage.getItem("installationData")
    if (!storedData) {
      router.push("/")
    }
  }, [router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGenerateReport = () => {
    // Save form data to localStorage
    localStorage.setItem("reportFormData", JSON.stringify(formData))
    router.push("/report")
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Report Information</CardTitle>
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

          <div>
            <Label htmlFor="introduction">Introduction</Label>
            <Textarea
              id="introduction"
              value={formData.introduction}
              onChange={(e) => handleInputChange("introduction", e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="conclusion">Conclusion</Label>
            <Textarea
              id="conclusion"
              value={formData.conclusion}
              onChange={(e) => handleInputChange("conclusion", e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              onClick={handleGenerateReport} 
              className="flex-1"
              disabled={!formData.clientName || !formData.preparedBy}
            >
              Generate Report
            </Button>
            <Button onClick={() => router.push("/csv-preview")} variant="outline">
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
