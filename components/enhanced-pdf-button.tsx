"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import type { CustomerInfo, InstallationData, Note } from "@/lib/types"

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
  const [footerImage, setFooterImage] = useState<string | null>(null)

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
      setFooterImage(canvas.toDataURL("image/png"))
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

      // Helper function to add header and footer to each page
      const addHeaderFooter = (pageNum: number, totalPages: number) => {
        // Add logo
        if (logoImage) {
          doc.addImage(logoImage, "PNG", 15, 10, 50, 15)
        }

        // Add footer
        if (footerImage) {
          doc.addImage(footerImage, "PNG", 15, 260, 180, 20)
        }

        // Add page number
        doc.setFontSize(10)
        doc.text(`Page ${pageNum} of ${totalPages}`, 190, 10, { align: "right" })
      }

      // Cover Page
      addHeaderFooter(1, 4 + Math.ceil(notes.length / 15) + Math.ceil(installationData.length / 10))

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
      addHeaderFooter(2, 4 + Math.ceil(notes.length / 15) + Math.ceil(installationData.length / 10))

      doc.setFontSize(12)
      let yPos = 40

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
      if (notes.length > 0) {
        doc.addPage()
        addHeaderFooter(3, 4 + Math.ceil(notes.length / 15) + Math.ceil(installationData.length / 10))

        doc.setFontSize(18)
        doc.text("Notes", 105, 30, { align: "center" })

        doc.setFontSize(12)

        // Create table header
        yPos = 40
        doc.setFillColor(240, 240, 240)
        doc.rect(15, yPos - 5, 180, 10, "F")
        doc.setFont("helvetica", "bold")
        doc.text("Apt", 20, yPos)
        doc.text("Notes", 50, yPos)
        doc.setFont("helvetica", "normal")
        yPos += 10

        // Add notes in batches of 15 per page
        const notesPerPage = 15
        for (let i = 0; i < notes.length; i++) {
          if (i > 0 && i % notesPerPage === 0) {
            doc.addPage()
            const pageNum = 3 + Math.floor(i / notesPerPage)
            addHeaderFooter(pageNum, 4 + Math.ceil(notes.length / 15) + Math.ceil(installationData.length / 10))

            // Recreate table header on new page
            yPos = 40
            doc.setFillColor(240, 240, 240)
            doc.rect(15, yPos - 5, 180, 10, "F")
            doc.setFont("helvetica", "bold")
            doc.text("Apt", 20, yPos)
            doc.text("Notes", 50, yPos)
            doc.setFont("helvetica", "normal")
            yPos += 10
          }

          // Draw alternating row background
          if (i % 2 === 0) {
            doc.setFillColor(250, 250, 250)
            doc.rect(15, yPos - 5, 180, 10, "F")
          }

          doc.text(notes[i].unit, 20, yPos)

          // Handle long notes with wrapping
          const noteLines = doc.splitTextToSize(notes[i].note, 140)
          noteLines.forEach((line, lineIndex) => {
            if (lineIndex === 0) {
              doc.text(line, 50, yPos)
            } else {
              yPos += 7
              doc.text(line, 50, yPos)
            }
          })

          yPos += 10

          // Check if we need more space for the next row
          if (yPos > 250) {
            doc.addPage()
            const pageNum = 3 + Math.floor((i + 1) / notesPerPage)
            addHeaderFooter(pageNum, 4 + Math.ceil(notes.length / 15) + Math.ceil(installationData.length / 10))

            // Recreate table header on new page
            yPos = 40
            doc.setFillColor(240, 240, 240)
            doc.rect(15, yPos - 5, 180, 10, "F")
            doc.setFont("helvetica", "bold")
            doc.text("Apt", 20, yPos)
            doc.text("Notes", 50, yPos)
            doc.setFont("helvetica", "normal")
            yPos += 10
          }
        }
      }

      // Detail Pages
      doc.addPage()
      const detailStartPage = 3 + Math.ceil(notes.length / 15)
      addHeaderFooter(detailStartPage, 4 + Math.ceil(notes.length / 15) + Math.ceil(installationData.length / 10))

      doc.setFontSize(18)
      doc.text("Detailed Apartment Information", 105, 30, { align: "center" })

      // Create table header
      yPos = 40
      doc.setFillColor(240, 240, 240)
      doc.rect(15, yPos - 5, 180, 10, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.text("Apt", 17, yPos)
      doc.text("Kitchen Aerator", 35, yPos)
      doc.text("Bathroom Aerator", 70, yPos)
      doc.text("Shower Head", 105, yPos)
      doc.text("Toilet", 140, yPos)
      doc.text("Notes", 160, yPos)
      doc.setFont("helvetica", "normal")
      yPos += 10

      // Add installation data in batches of 10 per page
      const itemsPerPage = 10
      for (let i = 0; i < installationData.length; i++) {
        const item = installationData[i]

        if (i > 0 && i % itemsPerPage === 0) {
          doc.addPage()
          const pageNum = detailStartPage + Math.floor(i / itemsPerPage)
          addHeaderFooter(pageNum, 4 + Math.ceil(notes.length / 15) + Math.ceil(installationData.length / 10))

          // Recreate table header on new page
          yPos = 40
          doc.setFillColor(240, 240, 240)
          doc.rect(15, yPos - 5, 180, 10, "F")
          doc.setFont("helvetica", "bold")
          doc.setFontSize(9)
          doc.text("Apt", 17, yPos)
          doc.text("Kitchen Aerator", 35, yPos)
          doc.text("Bathroom Aerator", 70, yPos)
          doc.text("Shower Head", 105, yPos)
          doc.text("Toilet", 140, yPos)
          doc.text("Notes", 160, yPos)
          doc.setFont("helvetica", "normal")
          yPos += 10
        }

        // Draw alternating row background
        if (i % 2 === 0) {
          doc.setFillColor(250, 250, 250)
          doc.rect(15, yPos - 5, 180, 10, "F")
        }

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

        // Determine values for each cell
        const kitchenAerator = getAeratorDescription(item["Kitchen Aerator"], "kitchen")
        const bathroomAerator = getAeratorDescription(item["Bathroom aerator"], "bathroom")
        const showerHead = getAeratorDescription(item["Shower Head"], "shower")
        const toilet = item["Toilets Installed:  113"] === "1" ? "Replaced" : "No Touch."

        // Compile notes
        let noteText = ""
        if (item["Leak Issue Kitchen Faucet"]) noteText += "Kitchen faucet leak. "
        if (item["Leak Issue Bath Faucet"]) noteText += "Bath faucet leak. "
        if (item["Tub Spout/Diverter Leak Issue"] === "Light") noteText += "Light tub leak. "
        if (item["Tub Spout/Diverter Leak Issue"] === "Moderate") noteText += "Moderate tub leak. "
        if (item["Tub Spout/Diverter Leak Issue"] === "Heavy") noteText += "Heavy tub leak. "

        doc.setFontSize(9)
        doc.text(item.Unit, 17, yPos)
        doc.text(kitchenAerator, 35, yPos)
        doc.text(bathroomAerator, 70, yPos)
        doc.text(showerHead, 105, yPos)
        doc.text(toilet, 140, yPos)

        // Handle long notes with wrapping
        const noteLines = doc.splitTextToSize(noteText, 35)
        noteLines.forEach((line, lineIndex) => {
          if (lineIndex === 0) {
            doc.text(line, 160, yPos)
          } else {
            yPos += 5
            doc.text(line, 160, yPos)
          }
        })

        yPos += 10

        // Check if we need more space for the next row
        if (yPos > 250) {
          doc.addPage()
          const pageNum = detailStartPage + Math.floor((i + 1) / itemsPerPage)
          addHeaderFooter(pageNum, 4 + Math.ceil(notes.length / 15) + Math.ceil(installationData.length / 10))

          // Recreate table header on new page
          yPos = 40
          doc.setFillColor(240, 240, 240)
          doc.rect(15, yPos - 5, 180, 10, "F")
          doc.setFont("helvetica", "bold")
          doc.setFontSize(9)
          doc.text("Apt", 17, yPos)
          doc.text("Kitchen Aerator", 35, yPos)
          doc.text("Bathroom Aerator", 70, yPos)
          doc.text("Shower Head", 105, yPos)
          doc.text("Toilet", 140, yPos)
          doc.text("Notes", 160, yPos)
          doc.setFont("helvetica", "normal")
          yPos += 10
        }
      }

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
