"use client"
import { useState, useEffect } from "react"
import EditableText from "@/components/editable-text"
import { getAeratorDescription, formatNote } from "@/lib/utils/aerator-helpers"
import { useReportContext } from "@/lib/report-context"

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
  isEditable?: boolean
}

// Create a new interface for storing edited notes
interface EditedNote {
  unit: string
  note: string
}

export default function ReportDetailPage({
  installationData,
  isPreview = true,
  isEditable = true,
}: ReportDetailPageProps) {
  const { setHasUnsavedChanges, sectionTitles, setSectionTitles } = useReportContext()

  // State to store edited notes
  const [editedNotes, setEditedNotes] = useState<Record<string, string>>({})

  // Update the state to track edited values for all columns
  // Add after the editedNotes state declaration
  const [editedInstallations, setEditedInstallations] = useState<Record<string, Record<string, string>>>({})

  // Add state for column headers
  const [columnHeaders, setColumnHeaders] = useState({
    unit: "Unit",
    kitchen: "Kitchen",
    bathroom: "Bathroom",
    shower: "Shower",
    toilet: "Toilet",
    notes: "Notes",
  })

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

  // Function to handle note edits
  const handleNoteEdit = (unit: string, value: string) => {
    if (isEditable) {
      setEditedNotes((prev) => {
        const updated = { ...prev, [unit]: value }
        console.log(`Updated note for unit ${unit} to "${value}"`, updated)
        return updated
      })
      setHasUnsavedChanges(true)

      // Save to localStorage immediately to persist changes
      const storedNotes = localStorage.getItem("detailNotes")
      const parsedNotes = storedNotes ? JSON.parse(storedNotes) : {}
      const updatedNotes = { ...parsedNotes, [unit]: value }
      localStorage.setItem("detailNotes", JSON.stringify(updatedNotes))
    }
  }

  // Add a function to handle installation edits
  // Add after the handleNoteEdit function
  const handleInstallationEdit = (unit: string, column: string, value: string) => {
    if (isEditable) {
      setEditedInstallations((prev) => {
        // Create unit entry if it doesn't exist
        const unitData = prev[unit] || {}
        const updated = {
          ...prev,
          [unit]: {
            ...unitData,
            [column]: value,
          },
        }
        console.log(`Updated ${column} for unit ${unit} to "${value}"`, updated)

        // Save to localStorage immediately
        localStorage.setItem("detailInstallations", JSON.stringify(updated))

        return updated
      })
      setHasUnsavedChanges(true)
    }
  }

  // Handle section title change
  const handleSectionTitleChange = (value: string) => {
    if (isEditable) {
      setSectionTitles((prev) => {
        const updated = { ...prev, detailsTitle: value }
        console.log(`Updated details section title to "${value}"`, updated)

        // Save to localStorage immediately
        localStorage.setItem("sectionTitles", JSON.stringify(updated))

        return updated
      })
      setHasUnsavedChanges(true)
    }
  }

  // Handle column header change
  const handleColumnHeaderChange = (column: string, value: string) => {
    if (isEditable) {
      setColumnHeaders((prev) => {
        const updated = { ...prev, [column]: value }
        console.log(`Updated ${column} column header to "${value}"`, updated)

        // Save to localStorage immediately
        localStorage.setItem("columnHeaders", JSON.stringify(updated))

        return updated
      })
      setHasUnsavedChanges(true)
    }
  }

  // Load edited notes from localStorage on component mount
  useEffect(() => {
    const storedNotes = localStorage.getItem("detailNotes")
    if (storedNotes) {
      try {
        const parsedNotes = JSON.parse(storedNotes)
        setEditedNotes(parsedNotes)
        console.log("Loaded edited notes from localStorage:", parsedNotes)
      } catch (error) {
        console.error("Error parsing stored notes:", error)
      }
    }
  }, [])

  // Add useEffect to load edited installations from localStorage
  // Add after the useEffect for loading edited notes
  useEffect(() => {
    const storedInstallations = localStorage.getItem("detailInstallations")
    if (storedInstallations) {
      try {
        const parsedInstallations = JSON.parse(storedInstallations)
        setEditedInstallations(parsedInstallations)
        console.log("Loaded edited installations from localStorage:", parsedInstallations)
      } catch (error) {
        console.error("Error parsing stored installations:", error)
      }
    }
  }, [])

  // Load column headers from localStorage
  useEffect(() => {
    const storedHeaders = localStorage.getItem("columnHeaders")
    if (storedHeaders) {
      try {
        const parsedHeaders = JSON.parse(storedHeaders)
        setColumnHeaders(parsedHeaders)
        console.log("Loaded column headers from localStorage:", parsedHeaders)
      } catch (error) {
        console.error("Error parsing stored column headers:", error)
      }
    }
  }, [])

  // Get the section title from context or use default
  const detailsTitle = sectionTitles.detailsTitle || "Detailed Unit Information"

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
        <h2 className="text-xl font-bold mb-6">
          {isEditable ? (
            <EditableText
              value={detailsTitle}
              onChange={handleSectionTitleChange}
              placeholder="Section Title"
              className="text-xl font-bold"
            />
          ) : (
            detailsTitle
          )}
        </h2>

        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 px-2 border-b">
                {isEditable ? (
                  <EditableText
                    value={columnHeaders.unit}
                    onChange={(value) => handleColumnHeaderChange("unit", value)}
                    placeholder="Unit"
                  />
                ) : (
                  columnHeaders.unit
                )}
              </th>
              {hasKitchenAerators && (
                <th className="text-left py-2 px-2 border-b">
                  {isEditable ? (
                    <EditableText
                      value={columnHeaders.kitchen}
                      onChange={(value) => handleColumnHeaderChange("kitchen", value)}
                      placeholder="Kitchen"
                    />
                  ) : (
                    columnHeaders.kitchen
                  )}
                </th>
              )}
              {hasBathroomAerators && (
                <th className="text-left py-2 px-2 border-b">
                  {isEditable ? (
                    <EditableText
                      value={columnHeaders.bathroom}
                      onChange={(value) => handleColumnHeaderChange("bathroom", value)}
                      placeholder="Bathroom"
                    />
                  ) : (
                    columnHeaders.bathroom
                  )}
                </th>
              )}
              {hasShowers && (
                <th className="text-left py-2 px-2 border-b">
                  {isEditable ? (
                    <EditableText
                      value={columnHeaders.shower}
                      onChange={(value) => handleColumnHeaderChange("shower", value)}
                      placeholder="Shower"
                    />
                  ) : (
                    columnHeaders.shower
                  )}
                </th>
              )}
              {hasToilets && (
                <th className="text-left py-2 px-2 border-b">
                  {isEditable ? (
                    <EditableText
                      value={columnHeaders.toilet}
                      onChange={(value) => handleColumnHeaderChange("toilet", value)}
                      placeholder="Toilet"
                    />
                  ) : (
                    columnHeaders.toilet
                  )}
                </th>
              )}
              {hasNotes && (
                <th className="text-left py-2 px-2 border-b">
                  {isEditable ? (
                    <EditableText
                      value={columnHeaders.notes}
                      onChange={(value) => handleColumnHeaderChange("notes", value)}
                      placeholder="Notes"
                    />
                  ) : (
                    columnHeaders.notes
                  )}
                </th>
              )}
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

              // Use edited note if available
              const finalNote = editedNotes[item.Unit] !== undefined ? editedNotes[item.Unit] : notes.trim()

              return (
                <tr key={index}>
                  <td className="py-2 px-2 border-b">
                    {isEditable ? (
                      <EditableText
                        value={item.Unit}
                        onChange={(value) => {
                          // This would require updating the installation data
                          // which is more complex and would need to be handled in a parent component
                        }}
                        placeholder="Unit"
                      />
                    ) : (
                      item.Unit
                    )}
                  </td>
                  {hasKitchenAerators && (
                    <td className="py-2 px-2 border-b text-center">
                      {isEditable ? (
                        <EditableText
                          value={
                            editedInstallations[item.Unit]?.kitchen !== undefined
                              ? editedInstallations[item.Unit].kitchen
                              : kitchenAerator === "No Touch."
                                ? ""
                                : kitchenAerator
                          }
                          onChange={(value) => handleInstallationEdit(item.Unit, "kitchen", value)}
                          placeholder="Kitchen"
                          className="text-center"
                        />
                      ) : kitchenAerator === "No Touch." ? (
                        "—"
                      ) : (
                        kitchenAerator
                      )}
                    </td>
                  )}
                  {hasBathroomAerators && (
                    <td className="py-2 px-2 border-b text-center">
                      {isEditable ? (
                        <EditableText
                          value={
                            editedInstallations[item.Unit]?.bathroom !== undefined
                              ? editedInstallations[item.Unit].bathroom
                              : bathroomAerator === "No Touch."
                                ? ""
                                : bathroomAerator
                          }
                          onChange={(value) => handleInstallationEdit(item.Unit, "bathroom", value)}
                          placeholder="Bathroom"
                          className="text-center"
                        />
                      ) : bathroomAerator === "No Touch." ? (
                        "—"
                      ) : (
                        bathroomAerator
                      )}
                    </td>
                  )}
                  {hasShowers && (
                    <td className="py-2 px-2 border-b text-center">
                      {isEditable ? (
                        <EditableText
                          value={
                            editedInstallations[item.Unit]?.shower !== undefined
                              ? editedInstallations[item.Unit].shower
                              : shower === "No Touch."
                                ? ""
                                : shower
                          }
                          onChange={(value) => handleInstallationEdit(item.Unit, "shower", value)}
                          placeholder="Shower"
                          className="text-center"
                        />
                      ) : shower === "No Touch." ? (
                        "—"
                      ) : (
                        shower
                      )}
                    </td>
                  )}
                  {hasToilets && (
                    <td className="py-2 px-2 border-b text-center">
                      {isEditable ? (
                        <EditableText
                          value={
                            editedInstallations[item.Unit]?.toilet !== undefined
                              ? editedInstallations[item.Unit].toilet
                              : toilet || ""
                          }
                          onChange={(value) => handleInstallationEdit(item.Unit, "toilet", value)}
                          placeholder="Toilet"
                          className="text-center"
                        />
                      ) : (
                        toilet || "—"
                      )}
                    </td>
                  )}
                  {hasNotes && (
                    <td className="py-2 px-2 border-b">
                      {isEditable ? (
                        <EditableText
                          value={finalNote}
                          onChange={(value) => handleNoteEdit(item.Unit, value)}
                          placeholder="Notes"
                          multiline={true}
                        />
                      ) : (
                        finalNote
                      )}
                    </td>
                  )}
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
            <h2 className="text-xl font-bold mb-6">{detailsTitle}</h2>

            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2 border-b">{columnHeaders.unit}</th>
                  {hasKitchenAerators && <th className="text-left py-2 px-2 border-b">{columnHeaders.kitchen}</th>}
                  {hasBathroomAerators && <th className="text-left py-2 px-2 border-b">{columnHeaders.bathroom}</th>}
                  {hasShowers && <th className="text-left py-2 px-2 border-b">{columnHeaders.shower}</th>}
                  {hasToilets && <th className="text-left py-2 px-2 border-b">{columnHeaders.toilet}</th>}
                  {hasNotes && <th className="text-left py-2 px-2 border-b">{columnHeaders.notes}</th>}
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

                  // Use edited note if available
                  const finalNote = editedNotes[item.Unit] !== undefined ? editedNotes[item.Unit] : notes.trim()

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
                      {hasNotes && <td className="py-2 px-2 border-b">{finalNote}</td>}
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
