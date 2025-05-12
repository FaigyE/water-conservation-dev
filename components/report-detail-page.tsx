import { getAeratorDescription, formatNote } from "@/lib/utils/aerator-helpers"

interface InstallationData {
  Unit: string
  "Shower Head"?: string
  "Bathroom aerator"?: string
  "Kitchen Aerator"?: string
  "Leak Issue Kitchen Faucet"?: string
  "Leak Issue Bath Faucet"?: string
  "Tub Spout/Diverter Leak Issue"?: string
  Notes?: string
  [key: string]: string | undefined
}

interface ReportDetailPageProps {
  installationData: InstallationData[]
  isPreview?: boolean
}

export default function ReportDetailPage({ installationData, isPreview = true }: ReportDetailPageProps) {
  // Filter out rows without valid unit/apartment numbers
  const filteredData = installationData.filter((item) => {
    // Check if Unit exists and is not empty
    if (!item.Unit || item.Unit.trim() === "") return false

    // Filter out rows with non-apartment values (often headers, totals, etc.)
    const lowerUnit = item.Unit.toLowerCase()
    const invalidValues = ["total", "sum", "average", "avg", "count", "header", "n/a", "na"]
    if (invalidValues.some((val) => lowerUnit.includes(val))) return false

    return true
  })

  console.log(`Filtered ${installationData.length - filteredData.length} rows without valid unit numbers`)

  // Split data into pages of 10 items each
  const itemsPerPage = 10
  const dataPages = []

  for (let i = 0; i < filteredData.length; i += itemsPerPage) {
    dataPages.push(filteredData.slice(i, i + itemsPerPage))
  }

  // Helper function to check for toilet installation and get the column name
  const getToiletColumnInfo = (item: InstallationData): { installed: boolean; columnName: string | null } => {
    // Find the toilet column by looking for keys that start with "Toilets Installed:"
    const toiletColumn = Object.keys(item).find((key) => key.startsWith("Toilets Installed:"))

    if (toiletColumn && item[toiletColumn] && item[toiletColumn] !== "") {
      return { installed: true, columnName: toiletColumn }
    }

    return { installed: false, columnName: null }
  }

  // Replace the hasToiletInstalled function with this
  const hasToiletInstalled = (item: InstallationData): boolean => {
    return getToiletColumnInfo(item).installed
  }

  // Update the findColumnName function to be more robust and add more debugging

  // Update the findColumnName function to be more robust for both CSV and Excel files

  // Replace the findColumnName function with this improved version
  const findColumnName = (possibleNames: string[]): string | null => {
    if (!filteredData || filteredData.length === 0) return null

    // Debug all column names in the data
    console.log("All column names in data:", Object.keys(filteredData[0]))

    const item = filteredData[0]

    // First try exact match
    for (const key of Object.keys(item)) {
      if (possibleNames.includes(key)) {
        console.log(`Found exact match for column: ${key}`)
        return key
      }
    }

    // Then try case-insensitive match
    for (const key of Object.keys(item)) {
      for (const possibleName of possibleNames) {
        if (key.toLowerCase() === possibleName.toLowerCase()) {
          console.log(`Found case-insensitive match for column: ${key} (searched for: ${possibleName})`)
          return key
        }
      }
    }

    // Then try partial match with both key and possibleName variations
    for (const key of Object.keys(item)) {
      for (const possibleName of possibleNames) {
        // Check if key contains possibleName or possibleName contains key
        if (
          key.toLowerCase().includes(possibleName.toLowerCase()) ||
          possibleName.toLowerCase().includes(key.toLowerCase())
        ) {
          console.log(`Found partial match for column: ${key} (searched for: ${possibleName})`)
          return key
        }
      }
    }

    // Try to find by common patterns
    const keywordMap = {
      kitchen: ["kitchen", "kitch", "kit"],
      bathroom: ["bathroom", "bath", "lav", "lavatory"],
      shower: ["shower", "shwr"],
    }

    for (const key of Object.keys(item)) {
      const keyLower = key.toLowerCase()

      // Check for kitchen aerator
      if (possibleNames.some((name) => name.toLowerCase().includes("kitchen"))) {
        if (
          keywordMap.kitchen.some((keyword) => keyLower.includes(keyword)) &&
          (keyLower.includes("aer") || keyLower.includes("faucet"))
        ) {
          console.log(`Found keyword match for kitchen column: ${key}`)
          return key
        }
      }

      // Check for bathroom aerator
      if (possibleNames.some((name) => name.toLowerCase().includes("bathroom"))) {
        if (
          keywordMap.bathroom.some((keyword) => keyLower.includes(keyword)) &&
          (keyLower.includes("aer") || keyLower.includes("faucet"))
        ) {
          console.log(`Found keyword match for bathroom column: ${key}`)
          return key
        }
      }

      // Check for shower head
      if (possibleNames.some((name) => name.toLowerCase().includes("shower"))) {
        if (
          keywordMap.shower.some((keyword) => keyLower.includes(keyword)) &&
          (keyLower.includes("head") || keyLower.includes("hd"))
        ) {
          console.log(`Found keyword match for shower column: ${key}`)
          return key
        }
      }
    }

    console.log(`No match found for columns: ${possibleNames.join(", ")}`)
    return null
  }

  // Update the column name search to include the exact names from the CSV
  const kitchenAeratorColumn = findColumnName(["Kitchen Aerator", "kitchen aerator", "kitchen", "kitchen aerators"])
  const bathroomAeratorColumn = findColumnName([
    "Bathroom aerator",
    "bathroom aerator",
    "bathroom",
    "bathroom aerators",
    "bath aerator",
  ])
  const showerHeadColumn = findColumnName(["Shower Head", "shower head", "shower", "shower heads"])

  // Add more debugging
  console.log("Raw data sample:", filteredData.slice(0, 2))

  console.log("Found column names:", {
    kitchenAeratorColumn,
    bathroomAeratorColumn,
    showerHeadColumn,
  })

  // Debug the data to see what's in the aerator columns
  console.log(
    "First 5 items in installation data:",
    filteredData.slice(0, 5).map((item) => ({
      Unit: item.Unit,
      KitchenAerator: kitchenAeratorColumn ? item[kitchenAeratorColumn] : undefined,
      BathroomAerator: bathroomAeratorColumn ? item[bathroomAeratorColumn] : undefined,
      ShowerHead: showerHeadColumn ? item[showerHeadColumn] : undefined,
    })),
  )

  // Check if any unit has data in these columns
  const hasKitchenAeratorData =
    kitchenAeratorColumn && filteredData.some((item) => item[kitchenAeratorColumn] && item[kitchenAeratorColumn] !== "")
  const hasBathroomAeratorData =
    bathroomAeratorColumn &&
    filteredData.some((item) => item[bathroomAeratorColumn] && item[bathroomAeratorColumn] !== "")
  const hasShowerData =
    showerHeadColumn && filteredData.some((item) => item[showerHeadColumn] && item[showerHeadColumn] !== "")

  // Determine which columns to show based on data
  const hasKitchenAerators = Boolean(hasKitchenAeratorData)
  const hasBathroomAerators = Boolean(hasBathroomAeratorData)
  const hasShowers = Boolean(hasShowerData)

  // Update the toilet check logic to check both possible column names
  const hasToilets = filteredData.some((item) => hasToiletInstalled(item))

  // Check if any unit has notes
  const hasNotes = filteredData.some((item) => {
    let hasNote = false
    if (item["Leak Issue Kitchen Faucet"]) hasNote = true
    if (item["Leak Issue Bath Faucet"]) hasNote = true
    if (item["Tub Spout/Diverter Leak Issue"]) hasNote = true
    if (item.Notes) hasNote = true
    return hasNote
  })

  // Debug information
  console.log("Column visibility:", {
    kitchenAeratorColumn,
    hasKitchenAeratorData,
    hasKitchenAerators,
    bathroomAeratorColumn,
    hasBathroomAeratorData,
    hasBathroomAerators,
    showerHeadColumn,
    hasShowerData,
    hasShowers,
    hasToilets,
    hasNotes,
  })

  return isPreview ? (
    // Preview mode - show all data in one continuous list
    <div className="report-page min-h-[1056px] relative">
      {/* Header with logo - made bigger */}
      <div className="mb-8">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115501-BD1uw5tVq9PtVYW6Z6FKM1i8in6GeV.png"
          alt="GreenLight Logo"
          className="h-24" // Increased from h-16
          crossOrigin="anonymous"
        />
      </div>

      {/* Detail content */}
      <div className="mb-16">
        <h2 className="text-xl font-bold mb-6">Detailed Unit Information</h2>

        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 px-2 border-b">Unit</th>
              {hasKitchenAerators && <th className="text-left py-2 px-2 border-b">Kitchen</th>}
              {hasBathroomAerators && <th className="text-left py-2 px-2 border-b">Bathroom</th>}
              {hasShowers && <th className="text-left py-2 px-2 border-b">Shower</th>}
              {hasToilets && <th className="text-left py-2 px-2 border-b">Toilet</th>}
              {hasNotes && <th className="text-left py-2 px-2 border-b">Notes</th>}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => {
              // Check if this is a special unit (shower room, office, etc.)
              const isSpecialUnit =
                item.Unit.toLowerCase().includes("shower") ||
                item.Unit.toLowerCase().includes("office") ||
                item.Unit.toLowerCase().includes("laundry")

              // Get aerator descriptions using the found column names
              const kitchenAerator =
                isSpecialUnit || !kitchenAeratorColumn
                  ? ""
                  : getAeratorDescription(item[kitchenAeratorColumn], "kitchen")

              const bathroomAerator = !bathroomAeratorColumn
                ? ""
                : getAeratorDescription(item[bathroomAeratorColumn], "bathroom")

              const shower = !showerHeadColumn ? "" : getAeratorDescription(item[showerHeadColumn], "shower")

              // Check both possible column names for toilet installation
              const toilet = hasToiletInstalled(item) ? "0.8 GPF" : ""

              // Update the notes compilation section in the table row rendering
              // Compile notes with proper sentence case - only include leak issues
              let notes = ""
              if (item["Leak Issue Kitchen Faucet"]) notes += "Dripping from kitchen faucet. "
              if (item["Leak Issue Bath Faucet"]) notes += "Dripping from bathroom faucet. "
              if (item["Tub Spout/Diverter Leak Issue"] === "Light") notes += "Light leak from tub spout/diverter. "
              if (item["Tub Spout/Diverter Leak Issue"] === "Moderate")
                notes += "Moderate leak from tub spout/diverter. "
              if (item["Tub Spout/Diverter Leak Issue"] === "Heavy") notes += "Heavy leak from tub spout/diverter. "

              // Check if all installation columns are blank
              const isUnitNotAccessed =
                (!kitchenAeratorColumn ||
                  item[kitchenAeratorColumn] === "" ||
                  item[kitchenAeratorColumn] === undefined) &&
                (!bathroomAeratorColumn ||
                  item[bathroomAeratorColumn] === "" ||
                  item[bathroomAeratorColumn] === undefined) &&
                (!showerHeadColumn || item[showerHeadColumn] === "" || item[showerHeadColumn] === undefined) &&
                !hasToiletInstalled(item)

              // If unit not accessed and no other notes, add that information
              if (isUnitNotAccessed && !notes) {
                notes = "Unit not accessed."
              }

              // Format the notes with proper sentence case
              notes = formatNote(notes)

              return (
                <tr key={index}>
                  <td className="py-2 px-2 border-b">{item.Unit}</td>
                  {hasKitchenAerators && (
                    <td className="py-2 px-2 border-b text-center">
                      {kitchenAerator === "No Touch." ? "—" : kitchenAerator}
                    </td>
                  )}
                  {hasBathroomAerators && (
                    <td className="py-2 px-2 border-b text-center">
                      {bathroomAerator === "No Touch." ? "—" : bathroomAerator}
                    </td>
                  )}
                  {hasShowers && (
                    <td className="py-2 px-2 border-b text-center">{shower === "No Touch." ? "—" : shower}</td>
                  )}
                  {hasToilets && <td className="py-2 px-2 border-b text-center">{toilet || "—"}</td>}
                  {hasNotes && <td className="py-2 px-2 border-b">{notes.trim()}</td>}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer - full width */}
      <div className="footer-container">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115454-uWCS2yWrowegSqw9c2SIVcLdedTk82.png"
          alt="GreenLight Footer"
          className="w-full h-auto"
          crossOrigin="anonymous"
        />
      </div>
    </div>
  ) : (
    // PDF/Print mode - paginate the data
    <>
      {dataPages.map((pageData, pageIndex) => (
        <div key={pageIndex} className="report-page min-h-[1056px] relative">
          {/* Header with logo - made bigger */}
          <div className="mb-8">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115501-BD1uw5tVq9PtVYW6Z6FKM1i8in6GeV.png"
              alt="GreenLight Logo"
              className="h-24" // Increased from h-16
              crossOrigin="anonymous"
            />
          </div>

          {/* Detail content */}
          <div className="mb-16">
            <h2 className="text-xl font-bold mb-6">Detailed Unit Information</h2>

            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2 border-b">Unit</th>
                  {hasKitchenAerators && <th className="text-left py-2 px-2 border-b">Kitchen</th>}
                  {hasBathroomAerators && <th className="text-left py-2 px-2 border-b">Bathroom</th>}
                  {hasShowers && <th className="text-left py-2 px-2 border-b">Shower</th>}
                  {hasToilets && <th className="text-left py-2 px-2 border-b">Toilet</th>}
                  {hasNotes && <th className="text-left py-2 px-2 border-b">Notes</th>}
                </tr>
              </thead>
              <tbody>
                {pageData.map((item, index) => {
                  // Check if this is a special unit (shower room, office, etc.)
                  const isSpecialUnit =
                    item.Unit.toLowerCase().includes("shower") ||
                    item.Unit.toLowerCase().includes("office") ||
                    item.Unit.toLowerCase().includes("laundry")

                  // Get aerator descriptions using the found column names
                  const kitchenAerator =
                    isSpecialUnit || !kitchenAeratorColumn
                      ? ""
                      : getAeratorDescription(item[kitchenAeratorColumn], "kitchen")

                  const bathroomAerator = !bathroomAeratorColumn
                    ? ""
                    : getAeratorDescription(item[bathroomAeratorColumn], "bathroom")

                  const shower = !showerHeadColumn ? "" : getAeratorDescription(item[showerHeadColumn], "shower")

                  // Check both possible column names for toilet installation
                  const toilet = hasToiletInstalled(item) ? "0.8 GPF" : ""

                  // Update the notes compilation section in the table row rendering
                  // Compile notes with proper sentence case - only include leak issues
                  let notes = ""
                  if (item["Leak Issue Kitchen Faucet"]) notes += "Dripping from kitchen faucet. "
                  if (item["Leak Issue Bath Faucet"]) notes += "Dripping from bathroom faucet. "
                  if (item["Tub Spout/Diverter Leak Issue"] === "Light") notes += "Light leak from tub spout/diverter. "
                  if (item["Tub Spout/Diverter Leak Issue"] === "Moderate")
                    notes += "Moderate leak from tub spout/diverter. "
                  if (item["Tub Spout/Diverter Leak Issue"] === "Heavy") notes += "Heavy leak from tub spout/diverter. "

                  // Check if all installation columns are blank
                  const isUnitNotAccessed =
                    (!kitchenAeratorColumn ||
                      item[kitchenAeratorColumn] === "" ||
                      item[kitchenAeratorColumn] === undefined) &&
                    (!bathroomAeratorColumn ||
                      item[bathroomAeratorColumn] === "" ||
                      item[bathroomAeratorColumn] === undefined) &&
                    (!showerHeadColumn || item[showerHeadColumn] === "" || item[showerHeadColumn] === undefined) &&
                    !hasToiletInstalled(item)

                  // If unit not accessed and no other notes, add that information
                  if (isUnitNotAccessed && !notes) {
                    notes = "Unit not accessed."
                  }

                  // Format the notes with proper sentence case
                  notes = formatNote(notes)

                  return (
                    <tr key={index}>
                      <td className="py-2 px-2 border-b">{item.Unit}</td>
                      {hasKitchenAerators && (
                        <td className="py-2 px-2 border-b text-center">
                          {kitchenAerator === "No Touch." ? "—" : kitchenAerator}
                        </td>
                      )}
                      {hasBathroomAerators && (
                        <td className="py-2 px-2 border-b text-center">
                          {bathroomAerator === "No Touch." ? "—" : bathroomAerator}
                        </td>
                      )}
                      {hasShowers && (
                        <td className="py-2 px-2 border-b text-center">{shower === "No Touch." ? "—" : shower}</td>
                      )}
                      {hasToilets && <td className="py-2 px-2 border-b text-center">{toilet || "—"}</td>}
                      {hasNotes && <td className="py-2 px-2 border-b">{notes.trim()}</td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer - full width */}
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
