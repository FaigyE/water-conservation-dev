import type { CustomerInfo } from "@/lib/types"

interface ReportCoverPageProps {
  customerInfo: CustomerInfo
}

export default function ReportCoverPage({ customerInfo }: ReportCoverPageProps) {
  return (
    <div className="report-page min-h-[1056px] relative">
      {/* Header with logo */}
      <div className="mb-8">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115501-BD1uw5tVq9PtVYW6Z6FKM1i8in6GeV.png"
          alt="GreenLight Logo"
          className="h-16"
          crossOrigin="anonymous"
        />
      </div>

      {/* Cover page content */}
      <div className="flex flex-col items-center justify-center h-[800px]">
        <div className="text-center mb-16">
          <p className="text-lg mb-4">ATTN:</p>
          <p className="text-xl font-bold mb-1">{customerInfo.customerName}</p>
          <p className="text-xl font-bold mb-1">{customerInfo.propertyName}</p>
          <p className="text-xl font-bold mb-1">
            {customerInfo.address} {customerInfo.city}, {customerInfo.state} {customerInfo.zip}
          </p>
        </div>

        <h1 className="text-3xl font-bold mb-8">Water Conservation Installation Report</h1>

        <p className="text-xl font-bold">
          {customerInfo.address} {customerInfo.city}, {customerInfo.state} {customerInfo.zip}
        </p>
      </div>

      {/* Footer */}
      <div className="footer-container">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115454-uWCS2yWrowegSqw9c2SIVcLdedTk82.png"
          alt="GreenLight Footer"
          className="w-full h-auto"
          crossOrigin="anonymous"
        />
      </div>

      {/* Page number */}
      <div className="absolute top-4 right-4 text-sm">Page 1 of 21</div>
    </div>
  )
}
