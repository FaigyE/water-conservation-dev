import type { InstallationData } from "./types"

/**
 * Parses an Excel file and returns the data from the first sheet
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

        // Convert to JSON with raw: false to handle headers more consistently
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: "" })

        // Log the first row to see what column names we're getting
        console.log("Excel first row:", jsonData.length > 0 ? jsonData[0] : "No data")

        // Ensure all data has the expected structure
        const formattedData = jsonData.map((row: any) => {
          // Convert all values to strings to match CSV parsing behavior
          const formattedRow: Record<string, string> = {}

          Object.keys(row).forEach((key) => {
            // Preserve the original column name
            const value = row[key]?.toString() || ""
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

        // Log the formatted data to debug
        console.log("Excel formatted data sample:", formattedData.slice(0, 2))

        resolve(formattedData)
      } catch (error) {
        console.error("Excel parsing error:", error)
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error("Error reading file"))
    }

    reader.readAsArrayBuffer(file)
  })
}
