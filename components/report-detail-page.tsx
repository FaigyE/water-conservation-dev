interface InstallationData {
  Unit: string
  "Toilets Installed:  113": string
  "Shower Head": string
  "Bathroom aerator": string
  "Kitchen Aerator": string
  "Leak Issue Kitchen Faucet": string
  "Leak Issue Bath Faucet": string
  "Tub Spout/Diverter Leak Issue": string
  Notes: string
  [key: string]: string
}

interface ReportDetailPageProps {
  installationData: InstallationData[]
}

export default function ReportDetailPage({ installationData }: ReportDetailPageProps) {
  // Split data into pages of 7 items each
  const itemsPerPage = 7
  const dataPages = []

  for (let i = 0; i < installationData.length; i += itemsPerPage) {
    dataPages.push(installationData.slice(i, i + itemsPerPage))
  }

  return (
    <>
      {dataPages.map((pageData, pageIndex) => (
        <div key={pageIndex} className="report-page min-h-[1056px] relative">
          {/* Header with logo */}
          <div className="mb-8">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115501-BD1uw5tVq9PtVYW6Z6FKM1i8in6GeV.png"
              alt="GreenLight Logo"
              className="h-16"
              crossOrigin="anonymous"
            />
          </div>

          {/* Detail content */}
          <div className="mb-16">
            <h2 className="text-xl font-bold mb-6">Detailed Apartment Information</h2>

            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2 border-b">Apt</th>
                  <th className="text-left py-2 px-2 border-b">Existing Kitchen Aerator</th>
                  <th className="text-left py-2 px-2 border-b">Installed Kitchen Aerator</th>
                  <th className="text-left py-2 px-2 border-b">Existing Bathroom Aerator</th>
                  <th className="text-left py-2 px-2 border-b">Installed Bathroom Aerator</th>
                  <th className="text-left py-2 px-2 border-b">Existing Shower</th>
                  <th className="text-left py-2 px-2 border-b">Installed Shower</th>
                  <th className="text-left py-2 px-2 border-b">Notes</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((item, index) => {
                  // Helper function to check if a value indicates an aerator was installed
                  const isAeratorInstalled = (value: string) => {
                    if (!value) return false
                    if (value === "1" || value === "2") return true

                    // Check for text values that indicate installation
                    const lowerValue = value.toLowerCase()
                    return (
                      lowerValue.includes("male") ||
                      lowerValue.includes("female") ||
                      lowerValue.includes("insert") ||
                      lowerValue.includes("gpm") ||
                      lowerValue.includes("aerator")
                    )
                  }

                  // Helper function to get aerator description
                  const getAeratorDescription = (value: string, type: string) => {
                    if (!value) return "No Touch."

                    if (value === "1") return type === "shower" ? "1.75 GPM" : "1.0 GPM"
                    if (value === "2") return type === "shower" ? "1.75 GPM (2)" : "1.0 GPM (2)"

                    // If it's a text value that indicates installation
                    if (isAeratorInstalled(value)) {
                      // If the text already includes GPM, use it as is
                      if (value.toLowerCase().includes("gpm")) return value

                      // Otherwise, add the standard GPM value
                      return type === "shower" ? `1.75 GPM (${value})` : `1.0 GPM (${value})`
                    }

                    return "No Touch."
                  }

                  const existingKitchenAerator = getAeratorDescription(item["Kitchen Aerator"], "kitchen")
                  const installedKitchenAerator = getAeratorDescription(item["Kitchen Aerator"], "kitchen")

                  const existingBathroomAerator = getAeratorDescription(item["Bathroom aerator"], "bathroom")
                  const installedBathroomAerator = getAeratorDescription(item["Bathroom aerator"], "bathroom")

                  const existingShower = getAeratorDescription(item["Shower Head"], "shower")
                  const installedShower = getAeratorDescription(item["Shower Head"], "shower")

                  // Compile notes
                  let notes = ""
                  if (item["Toilets Installed:  113"] === "1") notes += "We replaced toilet. "
                  if (item["Leak Issue Kitchen Faucet"]) notes += "Driping from kitchen faucet. "
                  if (item["Leak Issue Bath Faucet"]) notes += "Dripping from bathroom faucet. "
                  if (item["Tub Spout/Diverter Leak Issue"] === "Light")
                    notes += "Light leak from tub spout/ diverter. "
                  if (item["Tub Spout/Diverter Leak Issue"] === "Moderate")
                    notes += "Moderate leak from tub spout/diverter. "
                  if (item["Tub Spout/Diverter Leak Issue"] === "Heavy")
                    notes += "Heavy leak from tub spout/ diverter. "
                  if (item.Notes) notes += item.Notes

                  return (
                    <tr key={index}>
                      <td className="py-2 px-2 border-b">{item.Unit}</td>
                      <td className="py-2 px-2 border-b">{existingKitchenAerator}</td>
                      <td className="py-2 px-2 border-b">{installedKitchenAerator}</td>
                      <td className="py-2 px-2 border-b">{existingBathroomAerator}</td>
                      <td className="py-2 px-2 border-b">{installedBathroomAerator}</td>
                      <td className="py-2 px-2 border-b">{existingShower}</td>
                      <td className="py-2 px-2 border-b">{installedShower}</td>
                      <td className="py-2 px-2 border-b">{notes.trim()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
          <div className="absolute top-4 right-4 text-sm">Page {7 + pageIndex} of 21</div>
        </div>
      ))}
    </>
  )
}
