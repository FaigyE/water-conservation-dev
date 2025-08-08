"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Image from "next/image"

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

  // Split data into pages for proper report formatting
  const itemsPerPage = 15
  const dataPages = []
  for (let i = 0; i < installationData.length; i += itemsPerPage) {
    dataPages.push(installationData.slice(i, i + itemsPerPage))
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4">
      {/* Control buttons */}
      <div className="no-print mb-4 flex w-full max-w-4xl justify-end space-x-2">
        <Button onClick={() => window.print()}>Print Report</Button>
        <Button onClick={() => router.push("/data-form")} variant="outline">Edit Info</Button>
      </div>

      <div className="report-container w-full max-w-4xl bg-white shadow-lg print:shadow-none">
        
        {/* Cover Page */}
        <div className="print-section flex min-h-screen flex-col items-center justify-center p-8 text-center">
          <div className="mb-12">
            <Image src="/images/greenlight-logo.png" alt="Greenlight Logo" width={200} height={200} />
          </div>

          <h1 className="mb-4 text-5xl font-bold text-[#28a745]">
            Water Conservation Report
          </h1>

          <h2 className="mb-12 text-3xl font-semibold text-gray-700">
            {formData.clientName}
          </h2>

          <div className="mt-auto text-gray-600">
            <p className="text-lg">Prepared By: {formData.preparedBy}</p>
            <p className="text-lg">Date: {formData.reportDate}</p>
          </div>
        </div>

        {/* Letter Page */}
        <div className="print-section p-8">
          <div className="mb-8 flex items-center justify-between">
            <Image src="/images/greenlight-logo.png" alt="Greenlight Logo" width={150} height={150} />
            <div className="text-right">
              <p className="text-sm text-gray-600">Greenlight Water Solutions</p>
              <p className="text-sm text-gray-600">123 Water St, Hydro City</p>
              <p className="text-sm text-gray-600">info@greenlight.com</p>
            </div>
          </div>

          <p className="mb-2 text-gray-700">{formData.reportDate}</p>
          <p className="mb-6 text-gray-700">{formData.clientName}</p>

          <h1 className="mb-6 text-3xl font-bold text-[#28a745]">
            Water Conservation Installation Report
          </h1>

          <p className="mb-4 leading-relaxed text-gray-800">
            {formData.introduction}
          </p>

          <p className="mb-8 leading-relaxed text-gray-800">
            {formData.conclusion}
          </p>

          <p className="mb-2 text-gray-800">Sincerely,</p>
          <p className="mb-2 text-gray-800">{formData.preparedBy}</p>
          <Image src="/images/signature.png" alt="Signature" width={150} height={75} className="mb-4" />
          <p className="text-gray-800">Greenlight Water Solutions</p>
        </div>

        {/* Detail Pages */}
        {dataPages.map((pageData, pageIndex) => (
          <div key={pageIndex} className="print-section report-page min-h-[1056px] relative">
            <div className="mb-8">
              <Image src="/images/greenlight-logo.png" alt="GreenLight Logo" width={150} height={96} />
            </div>

            <div className="mb-16">
              <h2 className="text-xl font-bold mb-6">Installation Details</h2>

              <div className="mb-6 overflow-hidden rounded-md border">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {installationData.length > 0 && Object.keys(installationData[0]).slice(0, 6).map((key) => (
                        <th key={key} className="border-b px-4 py-2 text-left text-sm font-medium">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b hover:bg-gray-50">
                        {Object.keys(installationData[0]).slice(0, 6).map((key) => (
                          <td key={key} className="px-4 py-2 text-sm">{row[key] || ""}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-gray-600">
                Page {pageIndex + 1} of {dataPages.length} - 
                Showing {pageData.length} units (Total: {installationData.length} units)
              </p>
            </div>

            <div className="footer-container">
              <Image
                src="/images/greenlight-footer.png"
                alt="GreenLight Footer"
                width={800}
                height={100}
                className="w-full h-auto"
              />
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}
