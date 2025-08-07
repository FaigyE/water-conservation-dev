"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import type { InstallationData } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { getUnifiedNotes, saveNotesToLocalStorage } from "@/lib/notes"
import { useReportContext } from "@/lib/report-context"

export default function CsvPreviewPage() {
  const [installationData, setInstallationData] = useState<InstallationData[]>([])
  const [selectedCells, setSelectedCells] = useState<Record<string, string[]>>({}) // { "Unit X": ["Note 1", "Note 2"] }
  const [selectedNotesColumns, setSelectedNotesColumns] = useState<string[]>([])
  const [unitColumn, setUnitColumn] = useState<string | null>(null)
  const router = useRouter()
  const { addToast } = useToast()
  const { setReportData } = useReportContext()

  useEffect(() => {
    try {
      const storedData = localStorage.getItem("installationData")
      if (storedData) {
        const parsedData: InstallationData[] = JSON.parse(storedData)
        setInstallationData(parsedData)

        // Attempt to find the unit column dynamically
        const firstItem = parsedData[0]
        if (firstItem) {
          const potentialUnitColumns = Object.keys(firstItem).filter(
            (key) =>
              key.toLowerCase().includes("unit") ||
              key.toLowerCase().includes("bldg/unit") ||
              key.toLowerCase().includes("apt") ||
              key.toLowerCase().includes("room"),
          )
          setUnitColumn(potentialUnitColumns.length > 0 ? potentialUnitColumns[0] : Object.keys(firstItem)[0])
        }
      } else {
        addToast("No installation data found. Please upload an Excel file first.", "info")
        router.push("/")
      }
    } catch (error) {
      console.error("Error loading installation data from localStorage:", error)
      addToast("Failed to load data. Please re-upload the Excel file.", "destructive")
      router.push("/")
    }
  }, [router, addToast])

  // Load previously selected cells/columns from localStorage
  useEffect(() => {
    try {
      const storedSelectedCells = localStorage.getItem("selectedCells")
      if (storedSelectedCells) {
        setSelectedCells(JSON.parse(storedSelectedCells))
      }
      const storedSelectedNotesColumns = localStorage.getItem("selectedNotesColumns")
      if (storedSelectedNotesColumns) {
        setSelectedNotesColumns(JSON.parse(storedSelectedNotesColumns))
      }
    } catch (error) {
      console.error("Error loading previous selections:", error)
    }
  }, [])

  const headers = useMemo(() => {
    if (installationData.length === 0) return []
    return Object.keys(installationData[0])
  }, [installationData])

  const handleCellSelect = useCallback((unitIdentifier: string, cellContent: string) => {
    setSelectedCells((prev) => {
      const newSelectedCells = { ...prev }
      if (!newSelectedCells[unitIdentifier]) {
        newSelectedCells[unitIdentifier] = []
      }

      const index = newSelectedCells[unitIdentifier].indexOf(cellContent)
      if (index > -1) {
        newSelectedCells[unitIdentifier].splice(index, 1)
        if (newSelectedCells[unitIdentifier].length === 0) {
          delete newSelectedCells[unitIdentifier]
        }
      } else {
        newSelectedCells[unitIdentifier].push(cellContent)
      }
      localStorage.setItem("selectedCells", JSON.stringify(newSelectedCells))
      return newSelectedCells
    })
  }, [])

  const handleColumnSelect = useCallback((columnName: string) => {
    setSelectedNotesColumns((prev) => {
      const newSelectedColumns = prev.includes(columnName)
        ? prev.filter((col) => col !== columnName)
        : [...prev, columnName]
      localStorage.setItem("selectedNotesColumns", JSON.stringify(newSelectedColumns))
      return newSelectedColumns
    })
  }, [])

  const isCellSelected = useCallback(
    (unitIdentifier: string, cellContent: string) => {
      return selectedCells[unitIdentifier]?.includes(cellContent) || false
    },
    [selectedCells],
  )

  const isColumnSelected = useCallback(
    (columnName: string) => {
      return selectedNotesColumns.includes(columnName)
    },
    [selectedNotesColumns],
  )

  const handleGenerateReport = () => {
    console.log("Generate Report clicked!")
    console.log("Installation data length:", installationData.length)
    console.log("Unit column:", unitColumn)
    console.log("Selected cells:", selectedCells)
    console.log("Selected notes columns:", selectedNotesColumns)

    if (!unitColumn) {
      addToast("Cannot generate report: Unit column not identified.", "destructive")
      return
    }

    if (installationData.length === 0) {
      addToast("Cannot generate report: No installation data found.", "destructive")
      return
    }

    try {
      // Compile notes using the unified system
      const notes = getUnifiedNotes({
        installationData,
        unitColumn,
        selectedCells,
        selectedNotesColumns,
      })

      console.log("Compiled notes:", notes)

      // Create aerator data from installation data
      const aeratorData = installationData.map((item, index) => ({
        "Aerator Type": "Standard",
        "Location": item[unitColumn] || `Unit ${index + 1}`,
        "Current GPM": "2.2",
        "New GPM": "1.0", 
        "Quantity": "1",
        "Water Savings (GPM)": 1.2,
        ...item
      }))

      console.log("Aerator data sample:", aeratorData.slice(0, 3))

      // Create the complete report data object
      const reportData = {
        clientName: "Client Name",
        reportDate: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long", 
          day: "numeric",
        }),
        preparedBy: "Your Name",
        introduction: "This report outlines the findings and recommendations for water conservation efforts at the client's property.",
        conclusion: "Implementing the recommended changes will significantly reduce water consumption and lead to substantial savings.",
        aeratorData: aeratorData,
        notes: notes,
        images: [],
        sections: {
          coverPage: { title: "Water Conservation Report", enabled: true },
          letterPage: { title: "Introduction Letter", enabled: true },
          detailPage: { title: "Aerator Details", enabled: true },
          notesPage: { title: "Additional Notes", enabled: true },
        },
      }

      console.log("Complete report data:", reportData)

      // Update the report context with the compiled data
      setReportData(reportData)

      // Also save to localStorage as backup
      localStorage.setItem("reportData", JSON.stringify(reportData))

      // Save the notes to local storage using the unified system
      saveNotesToLocalStorage(notes)

      console.log("Report data saved successfully!")
      addToast("Report data compiled successfully!", "success")
      
      // Navigate to report page
      router.push("/report")
    } catch (error) {
      console.error("Error generating report:", error)
      addToast("Failed to generate report. Please try again.", "destructive")
    }
  }

  if (installationData.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading data or no data available...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>CSV Data Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-sm text-gray-600">
            Click on individual cells to include their content in the notes section of the report.
          </p>
          <p className="mb-4 text-sm text-gray-600">
            Check column headers to include all non-empty values from that column in the notes section.
          </p>
          <Button onClick={handleGenerateReport} className="mb-4 w-full">
            Generate Report
          </Button>
        </CardContent>
      </Card>

      <ScrollArea className="h-[calc(100vh-250px)] w-full rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-white">
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="p-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`col-${header}`}
                      checked={isColumnSelected(header)}
                      onCheckedChange={() => handleColumnSelect(header)}
                    />
                    <label
                      htmlFor={`col-${header}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {header}
                    </label>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {installationData.map((row, rowIndex) => {
              const unitIdentifier = unitColumn ? row[unitColumn] || `Row ${rowIndex + 1}` : `Row ${rowIndex + 1}`
              return (
                <TableRow key={rowIndex}>
                  {headers.map((header) => (
                    <TableCell
                      key={`${rowIndex}-${header}`}
                      className={`cursor-pointer p-2 ${
                        isCellSelected(unitIdentifier, row[header] || "") ? "bg-blue-100" : ""
                      }`}
                      onClick={() => handleCellSelect(unitIdentifier, row[header] || "")}
                    >
                      {row[header]}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
