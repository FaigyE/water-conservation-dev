"use client"

import { useState, useEffect } from "react"
import { useReportContext } from "@/lib/report-context"
import { EditableText } from "./editable-text"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, XCircle } from 'lucide-react'
import type { Note } from "@/lib/types"
import { loadNotesFromLocalStorage, saveNotesToLocalStorage } from "@/lib/notes"
import { useToast } from "@/hooks/use-toast"

export function ReportNotesPage() {
  const { reportData, updateSectionTitle } = useReportContext()
  const [notes, setNotes] = useState<Note[]>([])
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [newNoteContent, setNewNoteContent] = useState("")
  const { addToast } = useToast()

  useEffect(() => {
    // Load notes from the unified local storage system on mount
    setNotes(loadNotesFromLocalStorage())
  }, [])

  useEffect(() => {
    // Update the report context's notes when local notes change
    // This also triggers a save to local storage via the context's useEffect
    // Dispatch a custom event to notify other components/context of the change
    const event = new CustomEvent("notesUpdated", { detail: notes })
    window.dispatchEvent(event)
  }, [notes])

  const handleAddNote = () => {
    if (newNoteTitle.trim() === "" || newNoteContent.trim() === "") {
      addToast("Note title and content cannot be empty.", "error")
      return
    }
    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle,
      content: newNoteContent,
    }
    setNotes((prev) => {
      const updatedNotes = [...prev, newNote]
      saveNotesToLocalStorage(updatedNotes) // Save to unified local storage
      return updatedNotes
    })
    setNewNoteTitle("")
    setNewNoteContent("")
    addToast("Note added successfully!", "success")
  }

  const handleUpdateNote = (id: string, field: "title" | "content", value: string) => {
    setNotes((prev) => {
      const updatedNotes = prev.map((note) => (note.id === id ? { ...note, [field]: value } : note))
      saveNotesToLocalStorage(updatedNotes) // Save to unified local storage
      return updatedNotes
    })
  }

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => {
      const updatedNotes = prev.filter((note) => note.id !== id)
      saveNotesToLocalStorage(updatedNotes) // Save to unified local storage
      addToast("Note deleted.", "info")
      return updatedNotes
    })
  }

  return (
    <div className="print-section p-8">
      <EditableText
        as="h1"
        className="mb-6 text-3xl font-bold text-[#28a745]"
        value={reportData.sections.notesPage.title}
        onChange={(value) => updateSectionTitle("notesPage", value)}
      />

      <div className="mb-8 rounded-md border p-4">
        <h3 className="mb-4 text-lg font-semibold">Add New Note</h3>
        <div className="mb-4 space-y-2">
          <Input placeholder="Note Title" value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} />
          <Textarea
            placeholder="Note Content"
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
          />
        </div>
        <Button onClick={handleAddNote} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Note
        </Button>
      </div>

      <h2 className="mb-4 text-2xl font-semibold">Existing Notes</h2>
      {notes.length === 0 ? (
        <p className="text-gray-600">No additional notes yet.</p>
      ) : (
        <div className="space-y-6">
          {notes.map((note) => (
            <div key={note.id} className="relative rounded-md border p-4">
              <Button
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6 rounded-full"
                onClick={() => handleDeleteNote(note.id)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
              <EditableText
                as="h3"
                className="mb-2 text-xl font-semibold"
                value={note.title}
                onChange={(value) => handleUpdateNote(note.id, "title", value)}
              />
              <EditableText
                as="p"
                className="text-gray-700"
                value={note.content}
                onChange={(value) => handleUpdateNote(note.id, "content", value)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Add default export
export default ReportNotesPage
