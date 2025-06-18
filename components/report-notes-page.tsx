"use client"

import { useReportContext } from "@/lib/report-context"
import EditableText from "@/components/editable-text"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { formatNote } from "@/lib/utils/aerator-helpers"

interface Note {
  unit: string
  note: string
  [key: string]: any // Allow dynamic properties
}

interface ReportNotesPageProps {
  notes: Note[]
  isPreview?: boolean
  isEditable?: boolean
}

export default function ReportNotesPage({ notes, isPreview = true, isEditable = true }: ReportNotesPageProps) {
  const { setNotes, sectionTitles, setSectionTitles } = useReportContext()
  // Add state to track edited notes
  const [editedNotes, setEditedNotes] = useState<Note[]>([])

  // Get installation data from localStorage directly (same as details page)
  const [installationData, setInstallationData] = useState<any[]>([])

  // Load installation data from localStorage
  useEffect(() => {
    try {
      const storedInstallationData = localStorage.getItem("installationData")
      if (storedInstallationData) {
        const parsedData = JSON.parse(storedInstallationData)
        setInstallationData(parsedData)
        console.log("Notes: Loaded installation data from localStorage:", parsedData.length, "items")
      } else {
        console.log("Notes: No installation data found in localStorage")
      }
    } catch (error) {
      console.error("Notes: Error loading installation data:", error)
    }
  }, [])

  // Function to find the unit property in notes
  const getUnitProperty = (note: Note): string => {
    // If the note has a property that looks like a unit identifier, use that
    for (const key of Object.keys(note)) {
      const keyLower = key.toLowerCase()
      if (
        keyLower === "unit" ||
        keyLower === "bldg/unit" ||
        keyLower.includes("unit") ||
        keyLower.includes("apt") ||
        keyLower.includes("room")
      ) {
        return key
      }
    }
    // Default to "unit"
    return "unit"
  }

  const findUnitColumn = (data: any[]): string | null => {
    if (!data || data.length === 0) return null

    const item = data[0]
    console.log("Notes: All column names for unit detection:", Object.keys(item))

    for (const key of Object.keys(item)) {
      if (key.toLowerCase().includes("unit")) {
        console.log("Notes: Found unit column:", key)
        return key
      }
    }

    const unitKeywords = ["unit", "apt", "apartment", "room", "number"]
    for (const key of Object.keys(item)) {
      const keyLower = key.toLowerCase()
      for (const keyword of unitKeywords) {
        if (keyLower.includes(keyword)) {
          console.log(`Notes: Found column containing ${keyword}: ${key}`)
          return key
        }
      }
    }

    const firstKey = Object.keys(item)[0]
    console.log(`Notes: No unit column found, using first column as fallback: ${firstKey}`)
    return firstKey
  }

  const getToiletColumnInfo = (item: any): { installed: boolean; columnName: string | null } => {
    const toiletColumn = Object.keys(item).find((key) => key.startsWith("Toilets Installed:"))
    if (toiletColumn && item[toiletColumn] && item[toiletColumn] !== "") {
      return { installed: true, columnName: toiletColumn }
    }
    return { installed: false, columnName: null }
  }

  const hasToiletInstalled = (item: any): boolean => {
    return getToiletColumnInfo(item).installed
  }

  const findColumnName = (possibleNames: string[]): string | null => {
    if (!installationData || installationData.length === 0) return null
    const item = installationData[0]

    for (const key of Object.keys(item)) {
      if (possibleNames.includes(key)) {
        return key
      }
    }

    for (const key of Object.keys(item)) {
      for (const possibleName of possibleNames) {
        if (key.toLowerCase() === possibleName.toLowerCase()) {
          return key
        }
      }
    }

    return null
  }

  const compileNotesForUnit = (item: any, unitColumn: string | null, includeNotAccessed = false): string => {
    // Compile notes from leak issues only
    let notes = ""
    if (item["Leak Issue Kitchen Faucet"]) {
      notes += "Dripping from kitchen faucet. "
    }
    if (item["Leak Issue Bath Faucet"]) {
      notes += "Dripping from bathroom faucet. "
    }
    if (item["Tub Spout/Diverter Leak Issue"]) {
      const leakValue = item["Tub Spout/Diverter Leak Issue"]
      if (leakValue === "Light") {
        notes += "Light leak from tub spout/diverter. "
      } else if (leakValue === "Moderate") {
        notes += "Moderate leak from tub spout/diverter. "
      } else if (leakValue === "Heavy") {
        notes += "Heavy leak from tub spout/diverter. "
      } else {
        // For any other value, just write "leak from tub spout/diverter"
        notes += "Leak from tub spout/diverter. "
      }
    }

    // For notes section, do NOT include "not accessed" messages
    // Only return leak-related notes
    return formatNote(notes.trim())
  }

  // Initialize editedNotes using installation data (same as details page)
  useEffect(() => {
    console.log("Notes: Processing installation data, length:", installationData.length)

    if (!installationData || installationData.length === 0) {
      console.log("Notes: No installation data available")
      return
    }

    const unitColumn = findUnitColumn(installationData)
    console.log("Notes: Using unit column:", unitColumn)

    // Always regenerate notes from installation data - don't use stored notes
    console.log("Notes: Regenerating notes from installation data...")

    // Process installation data to create notes
    const processedNotes = installationData
      .map((item, index) => {
        const unitValue = unitColumn ? item[unitColumn] : item.Unit
        console.log(`Notes: Processing item ${index + 1}, unit: ${unitValue}`)

        // For notes section, do NOT include "not accessed" messages (includeNotAccessed = false)
        const compiledNote = compileNotesForUnit(item, unitColumn, false)

        const noteObj = {
          unit: unitValue,
          note: compiledNote,
          ...item, // Include all original data
        }

        console.log(`Notes: Created note for unit ${unitValue}:`, noteObj)
        return noteObj
      })
      .filter((note) => {
        // Only include notes that have actual leak content (no "not accessed" messages)
        const hasContent = note.note && note.note.trim() !== ""
        console.log(`Notes: Filtering note for unit ${note.unit}, has content: ${hasContent}, note: "${note.note}"`)
        return hasContent
      })

    console.log("Notes: Final processed notes:", processedNotes.length, "notes")

    // Always use the freshly processed notes
    setEditedNotes(processedNotes)

    // Update localStorage with fresh data
    localStorage.setItem("reportNotes", JSON.stringify(processedNotes))
  }, [installationData])

  // Filter out notes without valid unit numbers
  const filteredNotes = editedNotes.filter((note) => {
    if (!note.unit || note.unit.trim() === "") {
      return false
    }

    const lowerUnit = note.unit.toLowerCase()
    const invalidValues = ["total", "sum", "average", "avg", "count", "header", "n/a", "na"]
    if (invalidValues.some((val) => lowerUnit.includes(val))) {
      return false
    }

    // Only include notes that have actual content (leak issues only)
    if (!note.note || note.note.trim() === "") {
      return false
    }

    return true
  })

  // Split notes into pages of 15 items each
  const notesPerPage = 15
  const notePages = []

  for (let i = 0; i < filteredNotes.length; i += notesPerPage) {
    notePages.push(filteredNotes.slice(i, i + notesPerPage))
  }

  // Add function to sort notes by unit number
  const sortNotesByUnit = (notesToSort: Note[]) => {
    return [...notesToSort].sort((a, b) => {
      const unitA = a.unit || ""
      const unitB = b.unit || ""

      // Try to parse as numbers first
      const numA = Number.parseInt(unitA)
      const numB = Number.parseInt(unitB)

      // If both are valid numbers, sort numerically
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB
      }

      // Otherwise, sort alphabetically
      return unitA.localeCompare(unitB, undefined, { numeric: true, sensitivity: "base" })
    })
  }

  const handleNoteChange = (index: number, field: keyof Note, value: string) => {
    if (isEditable) {
      // Create a deep copy of the edited notes array
      const updatedNotes = JSON.parse(JSON.stringify(editedNotes))
      updatedNotes[index] = { ...updatedNotes[index], [field]: value }

      console.log(`Updating note ${index}, field ${field} to "${value}"`, updatedNotes[index])

      // If we're changing a unit number, resort the entire array
      if (field === "unit" || field === getUnitProperty(updatedNotes[index])) {
        const sortedNotes = sortNotesByUnit(updatedNotes)
        setEditedNotes(sortedNotes)
        setNotes(sortedNotes)
        localStorage.setItem("reportNotes", JSON.stringify(sortedNotes))
        console.log("Notes resorted after unit change:", sortedNotes)
      } else {
        // Update the local state
        setEditedNotes(updatedNotes)
        setNotes(updatedNotes)
        localStorage.setItem("reportNotes", JSON.stringify(updatedNotes))
      }
    }
  }

  // Add function to add a new note
  const handleAddNote = () => {
    if (isEditable) {
      const newNote: Note = {
        unit: "",
        note: "",
      }

      const updatedNotes = [...editedNotes, newNote]
      setEditedNotes(updatedNotes)
      setNotes(updatedNotes)
      localStorage.setItem("reportNotes", JSON.stringify(updatedNotes))
      console.log("Added new note:", newNote)
    }
  }

  // Add function to delete a note
  const handleDeleteNote = (index: number) => {
    if (isEditable) {
      const updatedNotes = editedNotes.filter((_, i) => i !== index)
      setEditedNotes(updatedNotes)
      setNotes(updatedNotes)
      localStorage.setItem("reportNotes", JSON.stringify(updatedNotes))
      console.log(`Deleted note at index ${index}`)
    }
  }

  // Add useEffect to resort notes when loaded
  useEffect(() => {
    if (editedNotes.length > 0) {
      const sortedNotes = sortNotesByUnit(editedNotes)
      // Only update if the order actually changed
      if (JSON.stringify(sortedNotes) !== JSON.stringify(editedNotes)) {
        setEditedNotes(sortedNotes)
        setNotes(sortedNotes)
        localStorage.setItem("reportNotes", JSON.stringify(sortedNotes))
        console.log("Notes resorted on load:", sortedNotes)
      }
    }
  }, []) // Only run once when component mounts

  // Handle section title change
  const handleSectionTitleChange = (value: string) => {
    if (isEditable) {
      setSectionTitles((prev) => {
        const updated = { ...prev, notes: value }
        console.log(`Updated notes section title to "${value}"`, updated)

        // Save to localStorage immediately
        localStorage.setItem("sectionTitles", JSON.stringify(updated))

        return updated
      })
    }
  }

  // Get the section title from context or use default
  const notesTitle = sectionTitles.notes || "Notes"

  return isPreview ? (
    // Preview mode - show all notes in one continuous list
    <div className="report-page min-h-[1056px] relative">
      {/* Header with logo - made bigger and higher up */}
      <div className="mb-8">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115501-BD1uw5tVq9PtVYW6Z6FKM1i8in6GeV.png"
          alt="GreenLight Logo"
          className="h-24" // Increased from h-16
          crossOrigin="anonymous"
        />
      </div>

      {/* Notes content */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {isEditable ? (
              <EditableText
                value={notesTitle}
                onChange={handleSectionTitleChange}
                placeholder="Section Title"
                className="text-xl font-bold"
              />
            ) : (
              notesTitle
            )}
          </h2>
          {isEditable && (
            <Button onClick={handleAddNote} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Note
            </Button>
          )}
        </div>

        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-2 px-4 border-b">Unit</th>
              <th className="text-left py-2 px-4 border-b">Notes</th>
              {isEditable && <th className="text-left py-2 px-4 border-b w-16">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredNotes.length === 0 ? (
              <tr>
                <td colSpan={isEditable ? 3 : 2} className="py-4 px-4 text-center text-gray-500">
                  No notes with leak issues found
                </td>
              </tr>
            ) : (
              filteredNotes.map((note, index) => {
                const unitProp = getUnitProperty(note)
                return (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b">
                      {isEditable ? (
                        <EditableText
                          value={note[unitProp]}
                          onChange={(value) => handleNoteChange(index, unitProp, value)}
                          placeholder="Unit"
                        />
                      ) : (
                        note[unitProp]
                      )}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {isEditable ? (
                        <EditableText
                          value={note.note}
                          onChange={(value) => handleNoteChange(index, "note", value)}
                          placeholder="Note"
                          multiline={true}
                        />
                      ) : (
                        note.note
                      )}
                    </td>
                    {isEditable && (
                      <td className="py-2 px-4 border-b">
                        <Button
                          onClick={() => handleDeleteNote(index)}
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
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
    // PDF/Print mode - paginate the notes
    <>
      {notePages.map((pageNotes, pageIndex) => (
        <div key={pageIndex} className="report-page min-h-[1056px] relative">
          {/* Header with logo - made bigger and higher up */}
          <div className="mb-8">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115501-BD1uw5tVq9PtVYW6Z6FKM1i8in6GeV.png"
              alt="GreenLight Logo"
              className="h-24" // Increased from h-16
              crossOrigin="anonymous"
            />
          </div>

          {/* Notes content */}
          <div className="mb-16">
            <h2 className="text-xl font-bold mb-6">{notesTitle}</h2>

            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-2 px-4 border-b">Unit</th>
                  <th className="text-left py-2 px-4 border-b">Notes</th>
                </tr>
              </thead>
              <tbody>
                {pageNotes.map((note, index) => {
                  // Calculate the actual index in the full notes array
                  const actualIndex = pageIndex * notesPerPage + index
                  const unitProp = getUnitProperty(note)

                  return (
                    <tr key={index}>
                      <td className="py-2 px-4 border-b">
                        {isEditable ? (
                          <EditableText
                            value={note[unitProp]}
                            onChange={(value) => handleNoteChange(actualIndex, unitProp, value)}
                            placeholder="Unit"
                          />
                        ) : (
                          note[unitProp]
                        )}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {isEditable ? (
                          <EditableText
                            value={note.note}
                            onChange={(value) => handleNoteChange(actualIndex, "note", value)}
                            placeholder="Note"
                            multiline={true}
                          />
                        ) : (
                          note.note
                        )}
                      </td>
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
          <div className="absolute top-4 right-4 text-sm">Page {3 + pageIndex} of 21</div>
        </div>
      ))}
    </>
  )
}
