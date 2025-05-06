"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import type { CustomerInfo, InstallationData, Note } from "@/lib/types"
// Import the formatNote function
import { getAeratorDescription, formatNote } from "@/lib/utils/aerator-helpers"

interface EnhancedPdfButtonProps {
  customerInfo: CustomerInfo
  installationData: InstallationData[]
  toiletCount: number
  notes: Note[]
}

export default function EnhancedPdfButton({
  customerInfo,
  installationData,
  toiletCount,
  notes,
}: EnhancedPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [jsPDFLoaded, setJsPDFLoaded] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)
  const [footerLoaded, setFooterLoaded] = useState(false)
  const [logoImage, setLogoImage] = useState<string | null>(null)
  const [footerImage, setFooterImage] = useState<{ dataUrl: string; width: number; height: number } | null>(null)

  useEffect(() => {
    // Load jsPDF dynamically
    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    script.async = true
    script.onload = () => setJsPDFLoaded(true)
    document.body.appendChild(script)

    // Load logo image
    const logoImg = new Image()
    logoImg.crossOrigin = "anonymous"
    logoImg.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = logoImg.width
      canvas.height = logoImg.height
      const ctx = canvas.getContext("2d")
      ctx?.drawImage(logoImg, 0, 0)
      setLogoImage(canvas.toDataURL("image/png"))
      setLogoLoaded(true)
    }
    logoImg.src =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115501-BD1uw5tVq9PtVYW6Z6FKM1i8in6GeV.png"

    // Load footer image
    const footerImg = new Image()
    footerImg.crossOrigin = "anonymous"
    footerImg.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = footerImg.width
      canvas.height = footerImg.height
      const ctx = canvas.getContext("2d")
      ctx?.drawImage(footerImg, 0, 0)
      setFooterImage({
        dataUrl: canvas.toDataURL("image/png"),
        width: footerImg.width,
        height: footerImg.height,
      })
      setFooterLoaded(true)
    }
    footerImg.src =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115454-uWCS2yWrowegSqw9c2SIVcLdedTk82.png"

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

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

  console.log(`PDF: Filtered ${installationData.length - filteredData.length} rows without valid unit numbers`)

  // Add this helper function inside the component
  // Helper function to find the toilet column and check if installed
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

  // Find the actual column names in the data
  // Replace the findColumnName function with this improved version
  const findColumnName = (possibleNames: string[]): string | null => {
    if (!filteredData || filteredData.length === 0) return null

    // Debug all column names in the data
    console.log("PDF: All column names in data:", Object.keys(filteredData[0]))

    const item = filteredData[0]

    // First try exact match
    for (const key of Object.keys(item)) {
      if (possibleNames.includes(key)) {
        console.log(`PDF: Found exact match for column: ${key}`)
        return key
      }
    }

    // Then try case-insensitive match
    for (const key of Object.keys(item)) {
      for (const possibleName of possibleNames) {
        if (key.toLowerCase() === possibleName.toLowerCase()) {
          console.log(`PDF: Found case-insensitive match for column: ${key} (searched for: ${possibleName})`)
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
          console.log(`PDF: Found partial match for column: ${key} (searched for: ${possibleName})`)
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
          console.log(`PDF: Found keyword match for kitchen column: ${key}`)
          return key
        }
      }

      // Check for bathroom aerator
      if (possibleNames.some((name) => name.toLowerCase().includes("bathroom"))) {
        if (
          keywordMap.bathroom.some((keyword) => keyLower.includes(keyword)) &&
          (keyLower.includes("aer") || keyLower.includes("faucet"))
        ) {
          console.log(`PDF: Found keyword match for bathroom column: ${key}`)
          return key
        }
      }

      // Check for shower head
      if (possibleNames.some((name) => name.toLowerCase().includes("shower"))) {
        if (
          keywordMap.shower.some((keyword) => keyLower.includes(keyword)) &&
          (keyLower.includes("head") || keyLower.includes("hd"))
        ) {
          console.log(`PDF: Found keyword match for shower column: ${key}`)
          return key
        }
      }
    }

    console.log(`PDF: No match found for columns: ${possibleNames.join(", ")}`)
    return null
  }

  const handleGeneratePdf = async () => {
    if (!jsPDFLoaded || !logoLoaded || !footerLoaded) {
      alert("PDF generator or images are still loading. Please try again in a moment.")
      return
    }

    try {
      setIsGenerating(true)
      console.log("Starting enhanced PDF generation...")

      // Create a new jsPDF instance
      const { jsPDF } = window.jspdf
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
      })

      // Set font
      doc.setFont("helvetica", "normal")

      // Get page dimensions
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Calculate logo and footer dimensions
      // Make logo bigger and higher up, and move it more to the left
      const logoWidth = 90 // Increased from 70
      const logoHeight = 27 // Increased proportionally
      const logoX = 5 // Moved more to the left (from 15)
      const logoY = 5 // Moved higher up from 10

      // Calculate the position where content should start (below the logo with some margin)
      const contentStartY = logoY + logoHeight + 15 // Increased from 10 to 15mm margin below the logo

      // Calculate footer dimensions to fill the entire page width
      const footerWidth = pageWidth
      let footerHeight = 20 // Default height if we can't calculate
      let footerAspectRatio = 180 / 20 // Default aspect ratio if we can't calculate

      // Get the actual aspect ratio from the loaded image
      if (footerImage) {
        const tempImg = new Image()
        tempImg.src = footerImage.dataUrl
        if (tempImg.width && tempImg.height) {
          footerAspectRatio = tempImg.width / tempImg.height
        }
      }

      // Calculate height based on actual aspect ratio
      footerHeight = footerWidth / footerAspectRatio
      const footerX = 0
      const footerY = pageHeight - footerHeight

      // Calculate the available space for content on each page
      const safeBottomMargin = 15 // Safety margin at the bottom of the page
      const availableHeight = pageHeight - contentStartY - footerHeight - safeBottomMargin

      // Helper function to add header and footer to each page
      const addHeaderFooter = (pageNum: number, totalPages: number) => {
        // Add logo
        if (logoImage) {
          doc.addImage(logoImage, "PNG", logoX, logoY, logoWidth, logoHeight)
        }

        // Add footer - full width of the page with correct aspect ratio
        if (footerImage) {
          const footerWidth = pageWidth
          const footerHeight = pageWidth * (footerImage.height / footerImage.width)
          const footerX = 0
          const footerY = pageHeight - footerHeight
          doc.addImage(footerImage.dataUrl, "PNG", footerX, footerY, footerWidth, footerHeight)
        }

        // Add page number - aligned with the logo vertically
        doc.setFontSize(10)
        doc.text(`Page ${pageNum} of ${totalPages}`, 190, logoY + 10, { align: "right" }) // Aligned with logo
      }

      // Calculate total pages based on data
      // This is an estimate and will be updated as we generate the PDF
      let totalPages = 2 // Cover page + letter page

      // Estimate notes pages
      const filteredNotes = notes.filter((note) => {
        if (!note.unit || note.unit.trim() === "") return false
        const lowerUnit = note.unit.toLowerCase()
        const invalidValues = ["total", "sum", "average", "avg", "count", "header", "n/a", "na"]
        if (invalidValues.some((val) => lowerUnit.includes(val))) return false
        return true
      })

      // Estimate how many notes can fit on a page
      const estimatedNotesPerPage = Math.floor(availableHeight / 10) // Assuming 10mm per note
      const estimatedNotesPages = filteredNotes.length > 0 ? Math.ceil(filteredNotes.length / estimatedNotesPerPage) : 0
      totalPages += estimatedNotesPages

      // Estimate detail pages
      const estimatedRowsPerPage = Math.floor(availableHeight / 10) // Assuming 10mm per row
      const estimatedDetailPages = Math.ceil(filteredData.length / estimatedRowsPerPage)
      totalPages += estimatedDetailPages

      // Cover Page
      addHeaderFooter(1, totalPages)

      doc.setFontSize(24)
      doc.text("Water Conservation", 105, 80, { align: "center" })
      doc.text("Installation Report", 105, 90, { align: "center" })

      doc.setFontSize(14)
      doc.text("ATTN:", 105, 120, { align: "center" })
      doc.setFontSize(16)
      doc.text(customerInfo.customerName, 105, 130, { align: "center" })
      doc.text(customerInfo.propertyName, 105, 140, { align: "center" })
      doc.text(`${customerInfo.address}`, 105, 150, { align: "center" })
      doc.text(`${customerInfo.city}, ${customerInfo.state} ${customerInfo.zip}`, 105, 160, { align: "center" })

      // Letter Page
      doc.addPage()
      addHeaderFooter(2, totalPages)

      doc.setFontSize(12)
      let yPos = contentStartY // Use the dynamic content start position instead of fixed 40

      doc.text(customerInfo.date, 15, yPos)
      yPos += 10
      doc.text(customerInfo.propertyName, 15, yPos)
      yPos += 7
      doc.text(customerInfo.customerName, 15, yPos)
      yPos += 7
      doc.text(`RE: ${customerInfo.address}`, 15, yPos)
      yPos += 7
      doc.text(`${customerInfo.city}, ${customerInfo.state} ${customerInfo.zip}`, 15, yPos)
      yPos += 20

      doc.text(`Dear ${customerInfo.customerName.split(" ")[0]},`, 15, yPos)
      yPos += 10

      const letterText = [
        "Please find the attached Installation Report. As you can see, we clearly indicated the installed items in each area. You will see the repairs that we made noted as well.",
        `We successfully installed ${toiletCount} toilets at the property.`,
        "Please send us copies of the actual water bills following our installation, so we can analyze them to pinpoint the anticipated water reduction and savings. We urge you to fix any constant water issues ASAP, as not to compromise potential savings as a result of our installation.",
        "Thank you for choosing Green Light Water Conservation. We look forward to working with you in the near future.",
      ]

      letterText.forEach((paragraph) => {
        const lines = doc.splitTextToSize(paragraph, 180)
        lines.forEach((line) => {
          doc.text(line, 15, yPos)
          yPos += 7
        })
        yPos += 5
      })

      yPos += 10
      doc.text("Very truly yours,", 15, yPos)
      yPos += 20
      doc.text("Zev Stern, CWEP", 15, yPos)
      yPos += 7
      doc.text("Chief Operating Officer", 15, yPos)

      // Notes Pages
      if (filteredNotes.length > 0) {
        let currentPage = 3
        let currentNoteIndex = 0

        while (currentNoteIndex < filteredNotes.length) {
          doc.addPage()
          addHeaderFooter(currentPage, totalPages)
          currentPage++

          doc.setFontSize(18)
          doc.text("Notes", 105, contentStartY, { align: "center" })

          doc.setFontSize(12)

          // Create table header - add more space after the title
          yPos = contentStartY + 10 // Add 10mm after the title
          doc.setFillColor(240, 240, 240)
          doc.rect(15, yPos - 5, 180, 10, "F")
          doc.setFont("helvetica", "bold")
          doc.setFontSize(10) // Set consistent font size for notes
          doc.text("Unit", 20, yPos) // Changed from "Apt" to "Unit"
          doc.text("Notes", 50, yPos)
          doc.setFont("helvetica", "normal")
          yPos += 10

          // Calculate the maximum Y position for content on this page
          const maxYPos = pageHeight - footerHeight - safeBottomMargin

          // Add as many notes as will fit on this page
          let rowCount = 0
          while (currentNoteIndex < filteredNotes.length) {
            const note = filteredNotes[currentNoteIndex]

            // Draw alternating row background
            if (rowCount % 2 === 0) {
              doc.setFillColor(250, 250, 250)
              doc.rect(15, yPos - 5, 180, 10, "F")
            }

            doc.text(note.unit, 20, yPos)

            // Handle long notes with wrapping
            const noteLines = doc.splitTextToSize(note.note, 140)
            doc.setFontSize(10) // Ensure consistent font size

            // Calculate the height this note will take
            const noteHeight = noteLines.length * 7 // 7mm per line

            // Check if this note will fit on the current page
            if (yPos + noteHeight > maxYPos && rowCount > 0) {
              // This note won't fit, so we'll start a new page
              break
            }

            // Add the note text
            noteLines.forEach((line, lineIndex) => {
              if (lineIndex === 0) {
                doc.text(line, 50, yPos)
              } else {
                yPos += 7
                doc.text(line, 50, yPos)
              }
            })

            yPos += 10
            currentNoteIndex++
            rowCount++

            // Check if we're near the bottom of the page
            if (yPos + 10 > maxYPos) {
              break
            }
          }
        }
      }

      // Detail Pages
      let currentPage = 3 + (filteredNotes.length > 0 ? Math.ceil(filteredNotes.length / estimatedNotesPerPage) : 0)

      // Get the actual column names from the data
      const kitchenAeratorColumn = findColumnName(["Kitchen Aerator", "kitchen aerator", "kitchen", "kitchen aerators"])
      const bathroomAeratorColumn = findColumnName([
        "Bathroom aerator",
        "bathroom aerator",
        "bathroom",
        "bathroom aerators",
        "bath aerator",
      ])
      const showerHeadColumn = findColumnName(["Shower Head", "shower head", "shower", "shower heads"])

      console.log("PDF: Found column names:", {
        kitchenAeratorColumn,
        bathroomAeratorColumn,
        showerHeadColumn,
      })

      // Debug the data to see what's in the aerator columns
      console.log(
        "PDF: First 5 items in installation data:",
        filteredData.slice(0, 5).map((item) => ({
          Unit: item.Unit,
          KitchenAerator: kitchenAeratorColumn ? item[kitchenAeratorColumn] : undefined,
          BathroomAerator: bathroomAeratorColumn ? item[bathroomAeratorColumn] : undefined,
          ShowerHead: showerHeadColumn ? item[showerHeadColumn] : undefined,
        })),
      )

      // Check if any unit has data in these columns
      const hasKitchenAeratorData =
        kitchenAeratorColumn &&
        filteredData.some((item) => item[kitchenAeratorColumn] && item[kitchenAeratorColumn] !== "")
      const hasBathroomAeratorData =
        bathroomAeratorColumn &&
        filteredData.some((item) => item[bathroomAeratorColumn] && item[bathroomAeratorColumn] !== "")
      const hasShowerData =
        showerHeadColumn && filteredData.some((item) => item[showerHeadColumn] && item[showerHeadColumn] !== "")

      // Determine which columns to show based on data
      const hasKitchenAerators = Boolean(hasKitchenAeratorData)
      const hasBathroomAerators = Boolean(hasBathroomAeratorData)
      const hasShowers = Boolean(hasShowerData)

      // Update the hasToilets check to look for any non-blank value in either column
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
      console.log("PDF Column visibility:", {
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

      // Calculate column positions based on which columns are shown
      const columnPositions = [17] // Unit column is always shown

      // Determine how many columns we're showing
      const visibleColumns = [hasKitchenAerators, hasBathroomAerators, hasShowers, hasToilets, hasNotes].filter(
        Boolean,
      ).length

      // Calculate width for each column
      const availableWidth = 180 // Total width
      const unitColumnWidth = 25 // Fixed width for unit column
      const remainingWidth = availableWidth - unitColumnWidth

      // Adjust column widths based on content
      const columnWidths = [unitColumnWidth]

      // Define minimum widths for each column type
      const minColumnWidths = {
        kitchen: 25,
        bathroom: 25,
        shower: 25,
        toilet: 20,
        notes: 60, // Increased width for notes column
      }

      // Calculate total minimum width needed
      let totalMinWidth = 0
      if (hasKitchenAerators) totalMinWidth += minColumnWidths.kitchen
      if (hasBathroomAerators) totalMinWidth += minColumnWidths.bathroom
      if (hasShowers) totalMinWidth += minColumnWidths.shower
      if (hasToilets) totalMinWidth += minColumnWidths.toilet
      if (hasNotes) totalMinWidth += minColumnWidths.notes

      // Adjust if minimum widths exceed available space
      const scaleFactor = totalMinWidth > remainingWidth ? remainingWidth / totalMinWidth : 1

      // Assign widths based on minimum requirements and available space
      if (hasKitchenAerators) columnWidths.push(Math.floor(minColumnWidths.kitchen * scaleFactor))
      if (hasBathroomAerators) columnWidths.push(Math.floor(minColumnWidths.bathroom * scaleFactor))
      if (hasShowers) columnWidths.push(Math.floor(minColumnWidths.shower * scaleFactor))
      if (hasToilets) columnWidths.push(Math.floor(minColumnWidths.toilet * scaleFactor))
      if (hasNotes) columnWidths.push(Math.floor(minColumnWidths.notes * scaleFactor))

      // Calculate positions based on widths
      let currentPos = 17
      columnPositions[0] = currentPos
      for (let i = 1; i < columnWidths.length; i++) {
        currentPos += columnWidths[i - 1]
        columnPositions.push(currentPos)
      }

      // Process installation data in batches that fit on each page
      let currentDataIndex = 0

      while (currentDataIndex < filteredData.length) {
        doc.addPage()
        addHeaderFooter(currentPage, totalPages)
        currentPage++

        doc.setFontSize(18)
        doc.text("Detailed Apartment Information", 105, contentStartY, { align: "center" })

        // Create table header - add more space after the title
        yPos = contentStartY + 10 // Add 10mm after the title
        doc.setFillColor(240, 240, 240)
        doc.rect(15, yPos - 5, 180, 10, "F")
        doc.setFont("helvetica", "bold")
        doc.setFontSize(9)

        let colIndex = 0
        doc.text("Unit", columnPositions[colIndex++], yPos) // Changed from "Apt" to "Unit"

        // Use shorter header text to avoid overlap
        if (hasKitchenAerators) {
          doc.text("Kitchen", columnPositions[colIndex++], yPos)
        }
        if (hasBathroomAerators) {
          doc.text("Bathroom", columnPositions[colIndex++], yPos)
        }
        if (hasShowers) {
          doc.text("Shower", columnPositions[colIndex++], yPos)
        }
        if (hasToilets) {
          doc.text("Toilet", columnPositions[colIndex++], yPos)
        }
        if (hasNotes) {
          doc.text("Notes", columnPositions[colIndex++], yPos)
        }

        doc.setFont("helvetica", "normal")
        yPos += 10

        // Calculate the maximum Y position for content on this page
        const maxYPos = pageHeight - footerHeight - safeBottomMargin

        // Add as many rows as will fit on this page
        let rowCount = 0
        while (currentDataIndex < filteredData.length) {
          const item = filteredData[currentDataIndex]

          // Store the initial y position for this row
          const rowStartY = yPos - 5

          // Check if this is a special unit (shower room, office, etc.)
          const isSpecialUnit =
            item.Unit.toLowerCase().includes("shower") ||
            item.Unit.toLowerCase().includes("office") ||
            item.Unit.toLowerCase().includes("laundry")

          // Get values for each cell using the found column names
          const kitchenAerator =
            isSpecialUnit || !kitchenAeratorColumn ? "" : getAeratorDescription(item[kitchenAeratorColumn], "kitchen")

          const bathroomAerator = !bathroomAeratorColumn
            ? ""
            : getAeratorDescription(item[bathroomAeratorColumn], "bathroom")

          const showerHead = !showerHeadColumn ? "" : getAeratorDescription(item[showerHeadColumn], "shower")

          // Check both possible column names for toilet installation
          const toilet = hasToiletInstalled(item) ? "Yes" : ""

          // Update the notes compilation in the PDF generation
          // Compile notes with proper sentence case
          let noteText = ""
          if (item["Leak Issue Kitchen Faucet"]) noteText += "Dripping from kitchen faucet. "
          if (item["Leak Issue Bath Faucet"]) noteText += "Dripping from bathroom faucet. "
          if (item["Tub Spout/Diverter Leak Issue"] === "Light") noteText += "Light leak from tub spout/diverter. "
          if (item["Tub Spout/Diverter Leak Issue"] === "Moderate")
            noteText += "Moderate leak from tub spout/diverter. "
          if (item["Tub Spout/Diverter Leak Issue"] === "Heavy") noteText += "Heavy leak from tub spout/diverter. "
          if (item.Notes) noteText += item.Notes

          // Format the notes with proper sentence case
          noteText = formatNote(noteText)

          // Calculate how many lines the note will take
          let noteLines: string[] = []
          if (hasNotes && noteText) {
            // Calculate the maximum width for notes based on the column width
            const maxWidth = columnWidths[columnWidths.length - 1] - 5
            noteLines = doc.splitTextToSize(noteText, maxWidth)
          }

          // Calculate the height this row will take
          const rowHeight = Math.max(10, noteLines.length * 5 + 5) // Minimum 10mm, or more if needed for notes

          // Check if this row will fit on the current page
          if (yPos + rowHeight > maxYPos && rowCount > 0) {
            // This row won't fit, so we'll start a new page
            break
          }

          // Draw alternating row background
          if (rowCount % 2 === 0) {
            doc.setFillColor(250, 250, 250)
            doc.rect(15, rowStartY, 180, rowHeight, "F")
          }

          // Write data to PDF
          doc.setFontSize(9)

          colIndex = 0
          doc.text(item.Unit, columnPositions[colIndex++], yPos)

          if (hasKitchenAerators) {
            doc.text(kitchenAerator === "No Touch." ? "" : kitchenAerator, columnPositions[colIndex++], yPos)
          }
          if (hasBathroomAerators) {
            doc.text(bathroomAerator === "No Touch." ? "" : bathroomAerator, columnPositions[colIndex++], yPos)
          }
          if (hasShowers) {
            doc.text(showerHead === "No Touch." ? "" : showerHead, columnPositions[colIndex++], yPos)
          }
          if (hasToilets) {
            doc.text(toilet, columnPositions[colIndex++], yPos)
          }

          // Handle notes with wrapping if needed
          if (hasNotes) {
            doc.setFontSize(10) // Ensure consistent font size for notes
            // Write each line, incrementing the y-position for each additional line
            noteLines.forEach((line, lineIndex) => {
              if (lineIndex === 0) {
                doc.text(line, columnPositions[colIndex], yPos)
              } else {
                yPos += 5
                doc.text(line, columnPositions[colIndex], yPos)
              }
            })
          }

          // Increment y position based on the row height
          yPos = rowStartY + rowHeight + 5
          currentDataIndex++
          rowCount++

          // Check if we're near the bottom of the page
          if (yPos + 10 > maxYPos) {
            break
          }
        }
      }

      // Update the total pages count based on the actual number of pages generated
      totalPages = currentPage - 1

      // Save the PDF
      const filename = `${customerInfo.propertyName.replace(/\s+/g, "-")}_Water_Conservation_Report.pdf`
      console.log("Saving enhanced PDF as:", filename)
      doc.save(filename)

      console.log("Enhanced PDF generation complete!")
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert(`There was an error generating the PDF: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const allLoaded = jsPDFLoaded && logoLoaded && footerLoaded

  return (
    <Button onClick={handleGeneratePdf} disabled={isGenerating || !allLoaded}>
      <FileDown className="mr-2 h-4 w-4" />
      {isGenerating
        ? "Generating PDF..."
        : allLoaded
          ? "Download Complete PDF"
          : `Loading PDF Generator (${[jsPDFLoaded ? "✓" : "✗", logoLoaded ? "✓" : "✗", footerLoaded ? "✓" : "✗"].join(
              " ",
            )})`}
    </Button>
  )
}
