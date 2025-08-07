"use client"
import { useReportContext } from "@/lib/report-context"
import { EditableText } from "./editable-text"
import Image from "next/image"

export function ReportLetterPage() {
  const { reportData, updateReportData, updateSectionTitle } = useReportContext()

  return (
    <div className="print-section p-8">
      <div className="mb-8 flex items-center justify-between">
        <Image src="/images/greenlight-logo.png" alt="Greenlight Logo" width={150} height={150} />
        <div className="text-right">
          <p className="text-sm text-gray-600">Greenlight Water Solutions</p>
          <p className="text-sm text-gray-600">123 Water St, Hydro City</p>
          <p className="text-sm text-gray-600">info@greenlight.com</p>
        </div>
      </div>

      <EditableText
        as="p"
        className="mb-2 text-gray-700"
        value={reportData.reportDate}
        onChange={(value) => updateReportData("reportDate", value)}
      />
      <EditableText
        as="p"
        className="mb-6 text-gray-700"
        value={reportData.clientName}
        onChange={(value) => updateReportData("clientName", value)}
      />

      <EditableText
        as="h1"
        className="mb-6 text-3xl font-bold text-[#28a745]"
        value={reportData.sections.letterPage.title}
        onChange={(value) => updateSectionTitle("letterPage", value)}
      />

      <EditableText
        as="p"
        className="mb-4 leading-relaxed text-gray-800"
        value={reportData.introduction}
        onChange={(value) => updateReportData("introduction", value)}
      />

      <EditableText
        as="p"
        className="mb-8 leading-relaxed text-gray-800"
        value={reportData.conclusion}
        onChange={(value) => updateReportData("conclusion", value)}
      />

      <p className="mb-2 text-gray-800">Sincerely,</p>
      <EditableText
        as="p"
        className="mb-2 text-gray-800"
        value={reportData.preparedBy}
        onChange={(value) => updateReportData("preparedBy", value)}
      />
      <Image src="/images/signature.png" alt="Signature" width={150} height={75} className="mb-4" />
      <p className="text-gray-800">Greenlight Water Solutions</p>
    </div>
  )
}

// Add default export
export default ReportLetterPage
