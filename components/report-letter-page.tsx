import type { CustomerInfo } from "@/lib/types"

interface ReportLetterPageProps {
  customerInfo: CustomerInfo
  toiletCount: number
}

export default function ReportLetterPage({ customerInfo, toiletCount }: ReportLetterPageProps) {
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

      {/* Letter content */}
      <div className="mb-16">
        <p className="mb-4">{customerInfo.date}</p>
        <p className="mb-1">{customerInfo.propertyName}</p>
        <p className="mb-1">{customerInfo.customerName}</p>
        <p className="mb-1">RE: {customerInfo.address}</p>
        <p className="mb-8">
          {customerInfo.city}, {customerInfo.state} {customerInfo.zip}
        </p>

        <p className="mb-2">Dear {customerInfo.customerName.split(" ")[0]},</p>

        <p className="mb-4">
          Please find the attached Installation Report. As you can see, we clearly indicated the installed items in each
          area. You will see the repairs that we made noted as well.
        </p>

        <p className="mb-4">We successfully installed {toiletCount} toilets at the property.</p>

        <p className="mb-8">
          Please send us copies of the actual water bills following our installation, so we can analyze them to pinpoint
          the anticipated water reduction and savings. We urge you to fix any constant water issues ASAP, as not to
          compromise potential savings as a result of our installation.
        </p>

        <p className="mb-4">
          Thank you for choosing Green Light Water Conservation. We look forward to working with you in the near future.
        </p>

        <p className="mb-1">Very truly yours,</p>
        <p className="mb-1 mt-8">Zev Stern, CWEP</p>
        <p>Chief Operating Officer</p>
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
      <div className="absolute top-4 right-4 text-sm">Page 2 of 21</div>
    </div>
  )
}
