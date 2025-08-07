"use client"

import { Button } from "@/components/ui/button"
import { Printer } from 'lucide-react'

export function PrintButton() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Button onClick={handlePrint} className="no-print">
      <Printer className="mr-2 h-4 w-4" /> Print Report
    </Button>
  )
}

// Add default export
export default PrintButton
