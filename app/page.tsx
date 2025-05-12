"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Papa from "papaparse"
import { parseExcelFile } from "@/lib/excel-parser"

export default function Home() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [propertyName, setPropertyName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zip, setZip] = useState("")
  const [loading, setLoading] = useState(false)
  const [unitType, setUnitType] = useState("Unit")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)

    try {
      // Check file extension to determine how to parse
      const fileExtension = file.name.split(".").pop()?.toLowerCase()
      let parsedData: any[] = []

      if (fileExtension === "csv") {
        // Parse CSV file
        parsedData = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            complete: (results) => resolve(results.data),
            error: (error) => reject(error),
          })
        })
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        // Parse Excel file
        parsedData = await parseExcelFile(file)
      } else {
        throw new Error("Unsupported file format. Please upload a CSV or Excel file.")
      }

      // Store data in localStorage
      localStorage.setItem("installationData", JSON.stringify(parsedData))
      localStorage.setItem(
        "customerInfo",
        JSON.stringify({
          customerName,
          propertyName,
          address,
          city,
          state,
          zip,
          date: new Date().toLocaleDateString(),
          unitType,
        }),
      )

      // Navigate to report page
      router.push("/report")
    } catch (error) {
      console.error("Error parsing file:", error)
      alert(error instanceof Error ? error.message : "An error occurred while processing the file")
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115501-BD1uw5tVq9PtVYW6Z6FKM1i8in6GeV.png"
          alt="GreenLight Logo"
          className="h-16 mr-4"
        />
        <h1 className="text-3xl font-bold">Water Conservation Installation Report Generator</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Customer Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyName">Property Name</Label>
                  <Input
                    id="propertyName"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitType">Unit Type</Label>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="unitTypeUnit"
                      name="unitType"
                      value="Unit"
                      checked={unitType === "Unit"}
                      onChange={(e) => setUnitType(e.target.value)}
                      className="mr-2"
                    />
                    <Label htmlFor="unitTypeUnit">Unit</Label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="unitTypeRoom"
                      name="unitType"
                      value="Room"
                      checked={unitType === "Room"}
                      onChange={(e) => setUnitType(e.target.value)}
                      className="mr-2"
                    />
                    <Label htmlFor="unitTypeRoom">Room</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={state} onChange={(e) => setState(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} required />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Installation Data</h2>
              <p className="text-sm text-muted-foreground">
                Upload the CSV or Excel file containing installation data.
              </p>
              <Input id="csvFile" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} required />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processing..." : "Generate Report"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
