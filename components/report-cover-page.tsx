"use client"
import { useReportContext } from "@/lib/report-context"
import { EditableText } from "./editable-text"
import { ImageUploader } from "./image-uploader"
import Image from "next/image"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

export function ReportCoverPage() {
  const { reportData, updateReportData, updateSectionTitle } = useReportContext()

  return (
    <div className="print-section flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="mb-12">
        <Image src="/images/greenlight-logo.png" alt="Greenlight Logo" width={200} height={200} />
      </div>

      <EditableText
        as="h1"
        className="mb-4 text-5xl font-bold text-[#28a745]"
        value={reportData.sections.coverPage.title}
        onChange={(value) => updateSectionTitle("coverPage", value)}
      />

      <EditableText
        as="h2"
        className="mb-12 text-3xl font-semibold text-gray-700"
        value={reportData.clientName}
        onChange={(value) => updateReportData("clientName", value)}
      />

      {reportData.images.length > 0 && (
        <div className="mb-8 w-full max-w-xl">
          <Image
            src={reportData.images[0].src || "/placeholder.svg"}
            alt={reportData.images[0].alt}
            width={800}
            height={600}
            layout="responsive"
            objectFit="contain"
            className="rounded-lg shadow-lg"
          />
        </div>
      )}

      <div className="no-print mb-8 w-full max-w-md">
        <ImageUploader />
        {reportData.images.length > 0 && (
          <div className="mt-4">
            <Label htmlFor="image-size" className="mb-2 block text-left text-sm font-medium">
              Cover Image Size ({reportData.images[0].src ? "100%" : "0%"})
            </Label>
            <Slider
              id="image-size"
              min={10}
              max={100}
              step={5}
              value={[reportData.images[0].src ? 100 : 0]} // Placeholder for actual image size control
              onValueChange={(value) => {
                // This is a placeholder. In a real scenario, you'd adjust image styling based on this value.
                console.log("Image size changed to:", value[0])
              }}
              className="w-full"
            />
          </div>
        )}
      </div>

      <div className="mt-auto text-gray-600">
        <EditableText
          as="p"
          className="text-lg"
          value={`Prepared By: ${reportData.preparedBy}`}
          onChange={(value) => updateReportData("preparedBy", value.replace("Prepared By: ", ""))}
        />
        <EditableText
          as="p"
          className="text-lg"
          value={`Date: ${reportData.reportDate}`}
          onChange={(value) => updateReportData("reportDate", value.replace("Date: ", ""))}
        />
      </div>
    </div>
  )
}

// Add default export
export default ReportCoverPage
