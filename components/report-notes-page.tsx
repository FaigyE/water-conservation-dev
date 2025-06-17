"use client"

import { useReportContext } from "@/lib/report-context"
import EditableText from "@/components/editable-text"
import { useEffect, useState } from "react"

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
  const { setNotes, setHasUnsavedChanges, sectionTitles, setSectionTitles } = useReportContext()
  // Add state to track edited notes
  const [editedNotes, setEditedNotes] = useState<Note[]>([])

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

  // Initialize editedNotes with the provided notes on mount and when notes change
  useEffect(() => {
    // Try to load notes from localStorage first
    const storedNotes = localStorage.getItem("reportNotes")
    if (storedNotes) {
      try {
        const parsedNotes = JSON.parse(storedNotes)
        setEditedNotes(parsedNotes)
        console.log("Loaded notes from localStorage:", parsedNotes)
      } catch (error) {
        console.error("Error parsing stored notes:", error)
        setEditedNotes([...notes]) // Fallback to props
      }
    } else {
      setEditedNotes([...notes]) // Use props if nothing in localStorage
    }
  }, [notes])

  // Filter out notes without valid unit numbers
  const filteredNotes = editedNotes.filter((note) => {
    if (!note.unit || note.unit.trim() === "") return false

    const lowerUnit = note.unit.toLowerCase()
    const invalidValues = ["total", "sum", "average", "avg", "count", "header", "n/a", "na"]
    if (invalidValues.some((val) => lowerUnit.includes(val))) return false

    return true
  })

  // Split notes into pages of 15 items each
  const notesPerPage = 15
  const notePages = []

  for (let i = 0; i < filteredNotes.length; i += notesPerPage) {
    notePages.push(filteredNotes.slice(i, i + notesPerPage))
  }

  const handleNoteChange = (index: number, field: keyof Note, value: string) => {
    if (isEditable) {
      // Create a deep copy of the edited notes array
      const updatedNotes = JSON.parse(JSON.stringify(editedNotes))
      updatedNotes[index] = { ...updatedNotes[index], [field]: value }

      console.log(`Updating note ${index}, field ${field} to "${value}"`, updatedNotes[index])

      // Update the local state
      setEditedNotes(updatedNotes)

      // Update the context
      setNotes(updatedNotes)

      // Save to localStorage immediately
      localStorage.setItem("reportNotes", JSON.stringify(updatedNotes))

      // Mark as having unsaved changes
      setHasUnsavedChanges(true)
    }
  }

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
      setHasUnsavedChanges(true)
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
        <h2 className="text-xl font-bold mb-6">
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

        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-2 px-4 border-b">Unit</th>
              <th className="text-left py-2 px-4 border-b">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotes.map((note, index) => {
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
