"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { ReportData, ReportContextType, ReportSections, Note } from "./types"
import { loadNotesFromLocalStorage } from "./notes"

const ReportContext = createContext<ReportContextType | undefined>(undefined)

export const ReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reportData, setReportData] = useState<ReportData>(() => {
    // Initialize from localStorage or default values
    if (typeof window !== "undefined") {
      const savedData = localStorage.getItem("reportData")
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData)
          // Ensure notes are loaded from the unified notes system
          parsedData.notes = loadNotesFromLocalStorage()
          return parsedData
        } catch (error) {
          console.error("Error parsing saved reportData:", error)
        }
      }
      
      // If no saved reportData, try to load installation data and create initial reportData
      const installationDataStr = localStorage.getItem("installationData")
      let installationData = []
      if (installationDataStr) {
        try {
          installationData = JSON.parse(installationDataStr)
          console.log("ReportProvider: Loaded installation data:", installationData.length, "rows")
        } catch (error) {
          console.error("Error parsing installation data:", error)
        }
      }
      
      return {
        clientName: "Client Name",
        reportDate: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        preparedBy: "Your Name",
        introduction:
          "This report outlines the findings and recommendations for water conservation efforts at the client's property.",
        conclusion:
          "Implementing the recommended changes will significantly reduce water consumption and lead to substantial savings.",
        aeratorData: [], // This will be populated from installation data
        installationData: installationData, // Add the installation data
        notes: loadNotesFromLocalStorage(), // Load notes from unified system
        images: [],
        sections: {
          coverPage: { title: "Water Conservation Report", enabled: true },
          letterPage: { title: "Introduction Letter", enabled: true },
          detailPage: { title: "Aerator Details", enabled: true },
          notesPage: { title: "Additional Notes", enabled: true },
          installationPage: { title: "Installation Details", enabled: true },
        },
      }
    }
    
    // Server-side fallback
    return {
      clientName: "Client Name",
      reportDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      preparedBy: "Your Name",
      introduction:
        "This report outlines the findings and recommendations for water conservation efforts at the client's property.",
      conclusion:
        "Implementing the recommended changes will significantly reduce water consumption and lead to substantial savings.",
      aeratorData: [],
      installationData: [],
      notes: [],
      images: [],
      sections: {
        coverPage: { title: "Water Conservation Report", enabled: true },
        letterPage: { title: "Introduction Letter", enabled: true },
        detailPage: { title: "Aerator Details", enabled: true },
        notesPage: { title: "Additional Notes", enabled: true },
        installationPage: { title: "Installation Details", enabled: true },
      },
    }
  })

  // Effect to save reportData to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("ReportProvider: Saving reportData to localStorage")
      localStorage.setItem("reportData", JSON.stringify(reportData))
    }
  }, [reportData])

  // Effect to listen for custom note update events
  useEffect(() => {
    const handleNoteUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<Note[]>
      setReportData((prevData) => ({
        ...prevData,
        notes: customEvent.detail,
      }))
    }

    window.addEventListener("notesUpdated", handleNoteUpdate)

    return () => {
      window.removeEventListener("notesUpdated", handleNoteUpdate)
    }
  }, [])

  // Effect to load installation data if it's missing
  useEffect(() => {
    if (typeof window !== "undefined" && reportData.installationData.length === 0) {
      const installationDataStr = localStorage.getItem("installationData")
      if (installationDataStr) {
        try {
          const installationData = JSON.parse(installationDataStr)
          console.log("ReportProvider: Loading missing installation data:", installationData.length, "rows")
          setReportData(prevData => ({
            ...prevData,
            installationData: installationData
          }))
        } catch (error) {
          console.error("Error loading installation data:", error)
        }
      }
    }
  }, [reportData.installationData.length])

  const updateReportData = useCallback(
    (key: keyof ReportData, value: any) => {
      setReportData((prevData) => ({
        ...prevData,
        [key]: value,
      }))
    },
    [setReportData],
  )

  const updateSectionTitle = useCallback(
    (section: keyof ReportSections, title: string) => {
      setReportData((prevData) => ({
        ...prevData,
        sections: {
          ...prevData.sections,
          [section]: {
            ...prevData.sections[section],
            title: title,
          },
        },
      }))
    },
    [setReportData],
  )

  const toggleSectionEnabled = useCallback(
    (section: keyof ReportSections) => {
      setReportData((prevData) => ({
        ...prevData,
        sections: {
          ...prevData.sections,
          [section]: {
            ...prevData.sections[section],
            enabled: !prevData.sections[section].enabled,
          },
        },
      }))
    },
    [setReportData],
  )

  console.log("ReportProvider: Current reportData:", reportData)

  return (
    <ReportContext.Provider
      value={{
        reportData,
        setReportData,
        updateReportData,
        updateSectionTitle,
        toggleSectionEnabled,
      }}
    >
      {children}
    </ReportContext.Provider>
  )
}

export const useReportContext = () => {
  const context = useContext(ReportContext)
  if (context === undefined) {
    throw new Error("useReportContext must be used within a ReportProvider")
  }
  return context
}
