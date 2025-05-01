interface Note {
  unit: string
  note: string
}

interface ReportNotesPageProps {
  notes: Note[]
}

export default function ReportNotesPage({ notes }: ReportNotesPageProps) {
  // Split notes into pages of 15 items each
  const notesPerPage = 15
  const notePages = []

  for (let i = 0; i < notes.length; i += notesPerPage) {
    notePages.push(notes.slice(i, i + notesPerPage))
  }

  return (
    <>
      {notePages.map((pageNotes, pageIndex) => (
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

          {/* Notes content */}
          <div className="mb-16">
            <h2 className="text-xl font-bold mb-6">Notes</h2>

            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-2 px-4 border-b">Apt</th>
                  <th className="text-left py-2 px-4 border-b">Notes</th>
                </tr>
              </thead>
              <tbody>
                {pageNotes.map((note, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b">{note.unit}</td>
                    <td className="py-2 px-4 border-b">{note.note}</td>
                  </tr>
                ))}
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
          <div className="absolute top-4 right-4 text-sm">Page {3 + pageIndex} of 21</div>
        </div>
      ))}
    </>
  )
}
