"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function ReportPage() {
  const [installationData, setInstallationData] = useState<any[]>([])
  const [formData, setFormData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    try {
      const storedInstallationData = localStorage.getItem("installationData")
      const storedFormData = localStorage.getItem("reportFormData")
      
      if (!storedInstallationData || !storedFormData) {
        console.log("Missing data, redirecting to home")
        router.push("/")
        return
      }

      setInstallationData(JSON.parse(storedInstallationData))
      setFormData(JSON.parse(storedFormData))
    } catch (error) {
      console.error("Error loading data:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p>Loading report...</p></div>
  }

  if (!formData || installationData.length === 0) {
    return <div className="flex min-h-screen items-center justify-center"><p>No data found. Redirecting...</p></div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 no-print">
        <Button onClick={() => window.print()}>Print Report</Button>
        <Button onClick={() => router.push("/data-form")} variant="outline" className="ml-2">Edit Info</Button>
      </div>

      <div className="bg-white p-8 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600 mb-2">Water Conservation Report</h1>
          <h2 className="text-xl text-gray-700">{formData.clientName}</h2>
        </div>

        <div className="mb-8">
          <p><strong>Date:</strong> {formData.reportDate}</p>
          <p><strong>Prepared By:</strong> {formData.preparedBy}</p>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Introduction</h3>
          <p>{formData.introduction}</p>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Installation Data</h3>
          <div className="overflow-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  {installationData.length > 0 && Object.keys(installationData[0]).slice(0, 6).map((key) => (
                    <th key={key} className="border border-gray-300 p-2 text-left">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {installationData.slice(0, 20).map((row, index) => (
                  <tr key={index}>
                    {Object.keys(installationData[0]).slice(0, 6).map((key) => (
                      <td key={key} className="border border-gray-300 p-2">{row[key] || ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Showing {Math.min(20, installationData.length)} of {installationData.length} total units
          </p>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Conclusion</h3>
          <p>{formData.conclusion}</p>
        </div>

        <div className="text-center mt-8">
          <p>Prepared by: {formData.preparedBy}</p>
          <p>Date: {formData.reportDate}</p>
        </div>
      </div>
    </div>
  )
}
