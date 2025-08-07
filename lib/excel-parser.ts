import * as XLSX from "xlsx"
import Papa from "papaparse"
import type { InstallationData } from "./types"

// Helper function to find the unit column by looking for headers containing "unit"
const findUnitColumn = (row: any): { value: any; columnName: string } => {
  // First, look for any column header that contains "unit" (case-insensitive)
  for (const key of Object.keys(row)) {
    if (key.toLowerCase().includes("unit")) {
      console.log(`Excel: Found unit column by keyword: "${key}"`)
      return { value: row[key], columnName: key }
    }
  }

  // Then try other apartment-related keywords
  const apartmentKeywords = ["apt", "apartment", "room"]
  for (const key of Object.keys(row)) {
    const keyLower = key.toLowerCase()
    for (const keyword of apartmentKeywords) {
      if (keyLower.includes(keyword)) {
        console.log(`Excel: Found unit column by apartment keyword "${keyword}": "${key}"`)
        return { value: row[key], columnName: key }
      }
    }
  }

  // If no suitable column found, use the first column as a fallback
  const firstKey = Object.keys(row)[0]
  console.log(`Excel: No unit column found, using first column as fallback: "${firstKey}"`)
  return { value: row[firstKey], columnName: firstKey }
}

// Shared data processing function for both CSV and Excel (after conversion to CSV string)
const processData = async (csvString: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: false, // Don't skip empty lines so we can detect them
      complete: (results) => {
        console.log("Excel->CSV: Parsing complete, raw data length:", results.data.length)

        const filteredData = []

        for (let i = 0; i < results.data.length; i++) {
          const row: any = results.data[i]

          // Use the improved unit column detection
          const { value: unitValue, columnName: unitColumnName } = findUnitColumn(row)

          // Log each row for debugging
          console.log(
            `Excel->CSV Row ${i + 1}: Unit column="${unitColumnName}", Unit value="${unitValue}" (type: ${typeof unitValue}, length: ${unitValue ? String(unitValue).length : "null"})`,
          )

          // Check if unit is truly empty - be very strict about this
          if (
            unitValue === undefined ||
            unitValue === null ||
            unitValue === "" ||
            (typeof unitValue === "string" && unitValue.trim() === "") ||
            String(unitValue).trim() === ""
          ) {
            console.log(
              `Excel->CSV STOPPING: Found empty unit at row ${i + 1}. Unit value: "${unitValue}". Processed ${filteredData.length} valid rows.`,
            )
            break // Stop processing immediately when we find an empty unit
          }

          // Convert to string and trim for further checks
          const trimmedUnit = String(unitValue).trim()

          // If after trimming it's empty, stop
          if (trimmedUnit === "") {
            console.log(
              `Excel->CSV STOPPING: Found empty unit after trimming at row ${i + 1}. Original: "${unitValue}". Processed ${filteredData.length} valid rows.`,
            )
            break
          }

          // Filter out rows with non-apartment values (often headers, totals, etc.) but continue processing
          const lowerUnit = trimmedUnit.toLowerCase()
          const invalidValues = [
            "total",
            "sum",
            "average",
            "avg",
            "count",
            "header",
            "n/a",
            "na",
            "grand total",
            "subtotal",
            "summary",
            "totals",
            "grand",
            "sub total",
          ]

          if (invalidValues.some((val) => lowerUnit.includes(val))) {
            console.log(
              `Excel->CSV: Skipping invalid unit "${trimmedUnit}" at row ${i + 1} (contains: ${invalidValues.find((val) => lowerUnit.includes(val))})`,
            )
            continue // Skip this row but continue processing
          }

          // Also check if this looks like a total row by examining only the first 5 values in the row
          const allKeys = Object.keys(row)
          const first5Keys = allKeys.slice(0, 5)
          const first5Values = first5Keys.map((key) =>
            String(row[key] || "")
              .toLowerCase()
              .trim(),
          )
          const containsTotalKeyword = first5Values.some((v) => invalidValues.some((invalid) => v.includes(invalid)))

          if (containsTotalKeyword) {
            console.log(`Excel->CSV: Skipping total row "${trimmedUnit}" at row ${i + 1} (first 5 columns contain total keywords)`)
            console.log(`First 5 column values:`, first5Values)
            continue // Skip this row but continue processing
          }

          console.log(`Excel->CSV: Adding valid unit: "${trimmedUnit}"`)

          // Create a normalized version of the row with a consistent "Unit" property
          const normalizedRow = { ...row }
          normalizedRow.Unit = unitValue // Ensure there's always a "Unit" property
          normalizedRow._originalUnitColumn = unitColumnName // Store the original column name for reference

          filteredData.push(normalizedRow)
        }

        console.log(`Excel->CSV: Final result: ${filteredData.length} valid units processed`)

        // Sort the results
        const sortedData = filteredData.sort((a, b) => {
          const unitA = a.Unit
          const unitB = b.Unit

          // Try to parse as numbers first
          const numA = Number.parseInt(unitA)
          const numB = Number.parseInt(unitB)

          // If both are valid numbers, sort numerically
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB
          }

          // Otherwise, sort alphabetically
          return String(unitA).localeCompare(String(unitB), undefined, { numeric: true, sensitivity: "base" })
        })

        console.log("Excel->CSV: Final formatted data sample:", sortedData.slice(0, 3))
        console.log("Excel->CSV: Final formatted data last 3:", sortedData.slice(-3))

        resolve(sortedData)
      },
      error: (error) => reject(error),
    })
  })
}

export const parseExcel = (file: File): Promise<InstallationData[]> => {
  return new Promise((resolve, reject) => {
    console.log("Processing xlsx file:", file.name)
    
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        console.log("Excel: Converting first sheet to CSV format...")
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        console.log("Excel: Sheet name:", sheetName)
        
        const worksheet = workbook.Sheets[sheetName]
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
        console.log("Excel: Sheet range:", XLSX.utils.encode_range(range))
        
        // Convert to CSV string first
        const csvString = XLSX.utils.sheet_to_csv(worksheet)
        console.log("Excel: Converted to CSV, length:", csvString.length)
        console.log("Excel: First 500 characters of CSV:", csvString.substring(0, 500))
        
        // Process the CSV data
        const processedData = await processData(csvString)
        console.log("Final parsed data length:", processedData.length)
        console.log("Sample of final data:", processedData.slice(0, 3))
        console.log("Last 3 rows of final data:", processedData.slice(-3))
        
        resolve(processedData as InstallationData[])
      } catch (error) {
        console.error("Error in parseExcel:", error)
        reject(new Error("Error parsing Excel file: " + error))
      }
    }

    reader.onerror = (error) => {
      console.error("FileReader error:", error)
      reject(new Error("Error reading file: " + error))
    }

    reader.readAsArrayBuffer(file)
  })
}
