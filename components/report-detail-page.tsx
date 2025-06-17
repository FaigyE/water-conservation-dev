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

  // Add state for edited unit numbers
  const [editedUnits, setEditedUnits] = useState<Record<string, string>>({})

  // Add state for column headers
  const [columnHeaders, setColumnHeaders] = useState({
    unit: "Unit",
    kitchen: "Kitchen",
    bathroom: "Bathroom",
    shower: "Shower",
    toilet: "Toilet",
    notes: "Notes",
  })

  // Update the findUnitColumn function to better detect "BLDG/Unit" and other variations
  // Replace the existing findUnitColumn function with this improved version:

  const findUnitColumn = (data: InstallationData[]): string | null => {
    if (!data || data.length === 0) return null

    const item = data[0]

    // Log all column names for debugging
    console.log("All column names for unit detection:", Object.keys(item))

    // First, look specifically for "BLDG/Unit" (case-insensitive)
    for (const key of Object.keys(item)) {
      if (key.toLowerCase().includes("unit")) {
        return key
      }
    }

    // Then look for columns containing both "bldg" and "unit"
    for (const key of Object.keys(item)) {
      const keyLower = key.toLowerCase()
      if (keyLower.includes("bldg") && keyLower.includes("unit")) {
        console.log(`Found column containing both BLDG and Unit: ${key}`)
        return key
      }
    }

    // Then look for any column containing "unit" or "apt" or "apartment"
    const unitKeywords = ["unit", "apt", "apartment", "room", "number"]
    for (const key of Object.keys(item)) {
      const keyLower = key.toLowerCase()
      for (const keyword of unitKeywords) {
        if (keyLower.includes(keyword)) {
          console.log(`Found column containing ${keyword}: ${key}`)
          return key
        }
      }
    }

    // If no suitable column found, use the first column as a fallback
    // This assumes the first column is likely to be the unit identifier
    const firstKey = Object.keys(item)[0]
    console.log(`No unit column found, using first column as fallback: ${firstKey}`)
    return firstKey
  }

  // Get the unit column name
  const unitColumn = findUnitColumn(installationData)

  // Filter out rows without valid unit/apartment numbers and deleted units
  const filteredData = (() => {
    const result = []

    console.log("Detail page: Starting to process installation data...")
    console.log("Detail page: Total rows to process:", installationData.length)

    for (let i = 0; i < installationData.length; i++) {
      const item = installationData[i]

      // Get the unit value using the detected unit column
      const unitValue = unitColumn ? item[unitColumn] : item.Unit

      // Log each row for debugging
      console.log(
        `Detail page Row ${i + 1}: Unit="${unitValue}" (type: ${typeof unitValue}, length: ${unitValue ? unitValue.length : "null"})`,
      )

      // Check if unit is truly empty - be very strict about this
      if (
        unitValue === undefined ||
        unitValue === null ||
        unitValue === "" ||
        (typeof unitValue === "string" && unitValue.trim() === "")
      ) {
        console.log(
          `Detail page STOPPING: Found empty unit at row ${i + 1}. Unit value: "${unitValue}". Processed ${result.length} valid rows.`,
        )
        break // Stop processing immediately when we find an empty unit
      }

      // Convert to string and trim for further checks
      const trimmedUnit = String(unitValue).trim()

      // If after trimming it's empty, stop
      if (trimmedUnit === "") {
        console.log(
          `Detail page STOPPING: Found empty unit after trimming at row ${i + 1}. Original: "${unitValue}". Processed ${result.length} valid rows.`,
        )
        break
      }

      // Check if this unit has been marked for deletion (only if completely blank)
      if (editedUnits[trimmedUnit] === "") {
        console.log(`Detail page: Skipping deleted unit "${trimmedUnit}" (marked as blank)`)
        continue
      }

      // Filter out rows with non-apartment values (often headers, totals, etc.) but continue processing
      const lowerUnit = trimmedUnit.toLowerCase()
      const invalidValues = ["total", "sum", "average", "avg", "count", "header", "n/a", "na"]
      if (invalidValues.some((val) => lowerUnit.includes(val))) {
        console.log(
          `Detail page: Skipping invalid unit "${trimmedUnit}" at row ${i + 1} (contains: ${invalidValues.find((val) => lowerUnit.includes(val))})`,
        )
        continue // Skip this row but continue processing
      }

      console.log(`Detail page: Adding valid unit: "${trimmedUnit}"`)
      result.push(item)
    }

    console.log(`Detail page: Final result: ${result.length} valid units processed`)

    // Sort the results by unit number in ascending order
    return result.sort((a, b) => {
      const unitA = a[unitColumn] || a.Unit
      const unitB = b[unitColumn] || b.Unit

      // Get edited unit numbers if they exist
      const finalUnitA = editedUnits[unitA] !== undefined ? editedUnits[unitA] : unitA
      const finalUnitB = editedUnits[unitB] !== undefined ? editedUnits[unitB] : unitB

      // Try to parse as numbers first
      const numA = Number.parseInt(finalUnitA)
      const numB = Number.parseInt(finalUnitB)

      // If both are valid numbers, sort numerically
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB
      }

      // Otherwise, sort alphabetically
      return finalUnitA.localeCompare(finalUnitB, undefined, { numeric: true, sensitivity: "base" })
    })
  })()

  console.log(`Processed ${filteredData.length} valid units (stopped at first empty unit, sorted ascending)`)

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
    unitColumn,
    kitchenAeratorColumn,
    bathroomAeratorColumn,
    showerHeadColumn,
  })

  // Debug the data to see what's in the aerator columns
  console.log(
    "First 5 items in installation data:",
    filteredData.slice(0, 5).map((item) => ({
      Unit: unitColumn ? item[unitColumn] : undefined,
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

  // Add function to handle unit edits - UPDATED to only delete when completely blank
  const handleUnitEdit = (originalUnit: string, newUnit: string) => {
    if (isEditable) {
      // Only mark for deletion if the new unit is completely empty (no whitespace)
      if (newUnit === "") {
        // If unit is completely empty, mark for deletion
        setEditedUnits((prev) => {
          const updated = { ...prev, [originalUnit]: "" }
          console.log(`Marking unit ${originalUnit} for deletion (completely blank)`)

          // Save to localStorage immediately
          localStorage.setItem("editedUnits", JSON.stringify(updated))

          return updated
        })
      } else {
        // Update unit number (even if it's just whitespace or any other text)
        setEditedUnits((prev) => {
          const updated = { ...prev, [originalUnit]: newUnit }
          console.log(`Updated unit ${originalUnit} to "${newUnit}"`)

          // Save to localStorage immediately
          localStorage.setItem("editedUnits", JSON.stringify(updated))

          return updated
        })
      }
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

  // Load edited units from localStorage
  useEffect(() => {
    const storedUnits = localStorage.getItem("editedUnits")
    if (storedUnits) {
      try {
        const parsedUnits = JSON.parse(storedUnits)
        setEditedUnits(parsedUnits)
        console.log("Loaded edited units from localStorage:", parsedUnits)
      } catch (error) {
        console.error("Error parsing stored units:", error)
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
                (unitColumn && item[unitColumn] && item[unitColumn].toLowerCase().includes("shower")) ||
                (unitColumn && item[unitColumn] && item[unitColumn].toLowerCase().includes("office")) ||
                (unitColumn && item[unitColumn] && item[unitColumn].toLowerCase().includes("laundry"))

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
              const finalNote =
                editedNotes[item[unitColumn]] !== undefined ? editedNotes[item[unitColumn]] : notes.trim()

              return (
                <tr key={index}>
                  <td className="py-2 px-2 border-b">
                    {isEditable ? (
                      <EditableText
                        value={
                          editedUnits[item[unitColumn]] !== undefined ? editedUnits[item[unitColumn]] : item[unitColumn]
                        }
                        onChange={(value) => handleUnitEdit(item[unitColumn], value)}
                        placeholder="Unit (clear completely to delete row)"
                      />
                    ) : editedUnits[item[unitColumn]] !== undefined ? (
                      editedUnits[item[unitColumn]]
                    ) : (
                      item[unitColumn]
                    )}
                  </td>
                  {hasKitchenAerators && (
                    <td className="py-2 px-2 border-b text-center">
                      {isEditable ? (
                        <EditableText
                          value={
                            editedInstallations[item[unitColumn]]?.kitchen !== undefined
                              ? editedInstallations[item[unitColumn]].kitchen
                              : kitchenAerator === "No Touch."
                                ? ""
                                : kitchenAerator
                          }
                          onChange={(value) => handleInstallationEdit(item[unitColumn], "kitchen", value)}
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
                            editedInstallations[item[unitColumn]]?.bathroom !== undefined
                              ? editedInstallations[item[unitColumn]].bathroom
                              : bathroomAerator === "No Touch."
                                ? ""
                                : bathroomAerator
                          }
                          onChange={(value) => handleInstallationEdit(item[unitColumn], "bathroom", value)}
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
                            editedInstallations[item[unitColumn]]?.shower !== undefined
                              ? editedInstallations[item[unitColumn]].shower
                              : shower === "No Touch."
                                ? ""
                                : shower
                          }
                          onChange={(value) => handleInstallationEdit(item[unitColumn], "shower", value)}
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
                            editedInstallations[item[unitColumn]]?.toilet !== undefined
                              ? editedInstallations[item[unitColumn]].toilet
                              : toilet || ""
                          }
                          onChange={(value) => handleInstallationEdit(item[unitColumn], "toilet", value)}
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
                          onChange={(value) => handleNoteEdit(item[unitColumn], value)}
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
                    (unitColumn && item[unitColumn] && item[unitColumn].toLowerCase().includes("shower")) ||
                    (unitColumn && item[unitColumn] && item[unitColumn].toLowerCase().includes("office")) ||
                    (unitColumn && item[unitColumn] && item[unitColumn].toLowerCase().includes("laundry"))

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
                  const finalNote =
                    editedNotes[item[unitColumn]] !== undefined ? editedNotes[item[unitColumn]] : notes.trim()

                  return (
                    <tr key={index}>
                      <td className="py-2 px-2 border-b">
                        {editedUnits[item[unitColumn]] !== undefined ? editedUnits[item[unitColumn]] : item[unitColumn]}
                      </td>
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
