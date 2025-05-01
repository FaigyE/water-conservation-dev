"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import type { CustomerInfo, InstallationData, Note } from "@/lib/types"

interface PrintButtonProps {
  customerInfo: CustomerInfo
  installationData: InstallationData[]
  toiletCount: number
  notes: Note[]
}

export default function PrintButton({ customerInfo, installationData, toiletCount, notes }: PrintButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrint = () => {
    setIsPrinting(true)

    // Create a new window for printing
    const printWindow = window.open("", "_blank")

    if (!printWindow) {
      alert("Please allow pop-ups to print the report")
      setIsPrinting(false)
      return
    }

    // Get the CSS from the current document
    const styles = Array.from(document.styleSheets)
      .map((styleSheet) => {
        try {
          return Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n")
        } catch (e) {
          // Ignore CORS errors for external stylesheets
          return ""
        }
      })
      .join("\n")

    // Create the content for the print window
    const printContent = document.querySelector(".print-content")

    if (!printContent) {
      alert("Print content not found")
      printWindow.close()
      setIsPrinting(false)
      return
    }

    // Write the content to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Water Conservation Installation Report</title>
          <style>
            ${styles}
            
            @page {
              size: letter;
              margin: 0.5in;
            }
            
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background: white;
              color: black;
            }
            
            .page-break {
              page-break-after: always;
              break-after: page;
              height: 0;
              margin: 0;
              padding: 0;
            }
            
            .report-page {
              position: relative;
              height: 10.5in;
              width: 8in;
              padding: 0.5in;
              margin-bottom: 0.5in;
              page-break-after: always;
              break-after: page;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            th, td {
              border-bottom: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            img {
              max-width: 100%;
            }
            
            .footer-container {
              position: absolute;
              bottom: 0.5in;
              left: 0;
              right: 0;
              width: 100%;
            }
            
            .hidden {
              display: block !important;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${printContent.innerHTML}
          </div>
          <script>
            // Wait for images to load before printing
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              }, 1000);
            };
          </script>
        </body>
      </html>
    `)

    printWindow.document.close()

    // Handle print completion or cancellation
    printWindow.onafterprint = () => {
      setTimeout(() => {
        printWindow.close()
        setIsPrinting(false)
      }, 500)
    }

    // Fallback in case onafterprint doesn't fire
    setTimeout(() => {
      setIsPrinting(false)
    }, 5000)
  }

  return (
    <Button onClick={handlePrint} disabled={isPrinting}>
      <Printer className="mr-2 h-4 w-4" />
      {isPrinting ? "Preparing..." : "Print Report"}
    </Button>
  )
}
