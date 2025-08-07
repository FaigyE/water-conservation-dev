import type { Dispatch, SetStateAction } from "react"

export type ReportData = {
  clientName: string
  reportDate: string
  preparedBy: string
  introduction: string
  conclusion: string
  aeratorData: AeratorData[]
  notes: Note[]
  images: ReportImage[]
  sections: ReportSections
  installationData: InstallationData[]
}

export type ReportSections = {
  coverPage: {
    title: string
    enabled: boolean
  }
  letterPage: {
    title: string
    enabled: boolean
  }
  detailPage: {
    title: string
    enabled: boolean
  }
  notesPage: {
    title: string
    enabled: boolean
  }
  installationPage: {
    title: string
    enabled: boolean
  }
}

export type AeratorData = {
  "Aerator Type": string
  Location: string
  "Current GPM": string
  "New GPM": string
  Quantity: string
  "Water Savings (GPM)"?: number | string
}

export type Note = {
  id: string
  title: string
  content: string
}

export type ReportImage = {
  id: string
  src: string
  alt: string
}

export type InstallationData = {
  Unit?: string
  "Toilet ID"?: string
  "Est Install Date"?: string
  "Est Toilets Per Day"?: string
  "Installer"?: string
  "Toilets Installed:  219"?: string
  "Supply Line"?: string
  "Extra wax rings"?: string
  "Shower Head"?: string
  "ADA shower head"?: string
  "Washer Machine Adapter on sink"?: string
  "Kitchen Aerator"?: string
  "Bathroom aerator"?: string
  "Flange Repair:  18"?: string
  "Screw Down"?: string
  "Pig-tale Anglestop"?: string
  "Angle Stop"?: string
  "Toilet Baseplate"?: string
  "Leak Issue Kitchen Faucet"?: string
  "Leak Issue Bath Faucet"?: string
  "Tub Spout/Diverter Leak Issue"?: string
  "10\" Tanks"?: string
  "Reason Skipped"?: string
  "Notes"?: string
  "USWC Admin Notes"?: string
  "Install per Day"?: string
  "For FIlter"?: string
  [key: string]: string | undefined
}

export type ReportContextType = {
  reportData: ReportData
  setReportData: Dispatch<SetStateAction<ReportData>>
  updateReportData: (key: keyof ReportData, value: any) => void
  updateSectionTitle: (section: keyof ReportSections, title: string) => void
  toggleSectionEnabled: (section: keyof ReportSections) => void
}
