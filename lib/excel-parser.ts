import type { InstallationData } from "./types"

/**
 * Parses an Excel file by first converting it to CSV format internally,
 * then using the same processing logic as CSV files
 * @param file The Excel file to parse
 * @returns A promise that resolves to the parsed data
 */
export async function parseExcelFile(file: File): Promise<InstallationData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)

        // Dynamically import xlsx library
        const XLSX = await import("xlsx")

        // Parse the Excel file
        const workbook = XLSX.read(data, { type: "array" })

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        console.log("Excel: Converting first sheet to CSV format...")
        console.log("Excel: Sheet name:", firstSheetName)
        console.log("Excel: Sheet range:", worksheet["!ref"])

        // Convert the Excel sheet to CSV format
        const csvString = XLSX.utils.sheet_to_csv(worksheet, {
          FS: ",", // Field separator
          RS: "\n", // Record separator
          dateNF: "yyyy-mm-dd", // Date format
          strip: false, // Don't strip whitespace - we want to detect empty cells
        })

        console.log("Excel: Converted to CSV, length:", csvString.length)
        console.log("Excel: First 500 characters of CSV:", csvString.substring(0, 500))

        // Now parse the CSV string using the same logic as CSV files
        // Import Papa Parse dynamically
        const Papa = await import("papaparse")

        const parsedCsvData = await new Promise<any[]>((csvResolve, csvReject) => {
          Papa.default.parse(csvString, {
            header: true,
            skipEmptyLines: false, // Don't skip empty lines so we can detect them
            complete: (results) => {
              console.log("Excel->CSV: Parsing complete, raw data length:", results.data.length)

              // Helper function to find the unit column by looking for headers containing "unit"
              const findUnitColumn = (row: any): { value: any; columnName: string } => {
                // First, look for any column header that contains "unit" (case-insensitive)
                for (const key of Object.keys(row)) {
                  if (key.toLowerCase().includes("unit")) {
                    console.log(`Excel->CSV: Found unit column by keyword: "${key}"`)
                    return { value: row[key], columnName: key }
                  }
                }

                // Then try other apartment-related keywords
                const apartmentKeywords = ["apt", "apartment", "room"]
                for (const key of Object.keys(row)) {
                  const keyLower = key.toLowerCase()
                  for (const keyword of apartmentKeywords) {
                    if (keyLower.includes(keyword)) {
                      console.log(`Excel->CSV: Found unit column by apartment keyword "${keyword}": "${key}"`)
                      return { value: row[key], columnName: key }
                    }
                  }
                }

                // If no suitable column found, use the first column as a fallback
                const firstKey = Object.keys(row)[0]
                console.log(`Excel->CSV: No unit column found, using first column as fallback: "${firstKey}"`)
                return { value: row[firstKey], columnName: firstKey }
              }

              // Apply the same filtering logic as CSV files
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

                // Also check if this looks like a total row by examining all values in the row
                const rowValues = Object.values(row).map((v) =>
                  String(v || "")
                    .toLowerCase()
                    .trim(),
                )
                const containsTotalKeyword = rowValues.some((v) => invalidValues.some((invalid) => v.includes(invalid)))

                if (containsTotalKeyword) {
                  console.log(
                    `Excel->CSV: Skipping total row "${trimmedUnit}" at row ${i + 1} (row contains total keywords)`,
                  )
                  console.log(`Excel->CSV: Row values:`, rowValues)
                  continue // Skip this row but continue processing
                }

                console.log(`Excel->CSV: Adding valid unit: "${trimmedUnit}"`)
                filteredData.push(row)
              }

              console.log(`Excel->CSV: Final result: ${filteredData.length} valid units processed`)

              // Sort the results
              const sortedData = filteredData.sort((a, b) => {
                // Use the same unit column detection for sorting
                const { value: unitA } = findUnitColumn(a)
                const { value: unitB } = findUnitColumn(b)

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

              csvResolve(sortedData)
            },
            error: (error) => csvReject(error),
          })
        })

        // Convert the parsed data to the expected format
        const formattedData = parsedCsvData.map((row: any) => {
          const formattedRow: Record<string, string> = {}

          Object.keys(row).forEach((key) => {
            // Handle null/undefined values
            let value = row[key]
            if (value === null || value === undefined) {
              value = ""
            } else {
              value = String(value).trim()
            }

            // Preserve the original column name
            formattedRow[key] = value

            // Also add lowercase version for case-insensitive matching
            formattedRow[key.toLowerCase()] = value

            // Add common variations of column names for better matching
            if (key.toLowerCase().includes("kitchen") && key.toLowerCase().includes("aerator")) {
              formattedRow["Kitchen Aerator"] = value
            }
            if (key.toLowerCase().includes("bathroom") && key.toLowerCase().includes("aerator")) {
              formattedRow["Bathroom aerator"] = value
            }
            if (key.toLowerCase().includes("shower") && key.toLowerCase().includes("head")) {
              formattedRow["Shower Head"] = value
            }
          })

          return formattedRow as InstallationData
        })

        console.log("Excel->CSV: Final formatted data sample:", formattedData.slice(0, 3))
        console.log("Excel->CSV: Final formatted data last 3:", formattedData.slice(-3))

        resolve(formattedData)
      } catch (error) {
        console.error("Excel parsing error:", error)
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error("Error reading Excel file"))
    }

    reader.readAsArrayBuffer(file)
  })
}
