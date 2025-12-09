"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import type { FactoryType, AppSettings } from "./types"

interface SettingsContextType {
  settings: AppSettings
  setFactoryType: (type: FactoryType) => void
}

const defaultSettings: AppSettings = {
  factoryType: "array",
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    console.log("[v0] SettingsProvider mounted")
    setMounted(true)
    const saved = localStorage.getItem("app_settings")
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch {
        // ignore
      }
    }
  }, [])

  const setFactoryType = (type: FactoryType) => {
    const newSettings = { ...settings, factoryType: type }
    setSettings(newSettings)
    if (typeof window !== "undefined") {
      localStorage.setItem("app_settings", JSON.stringify(newSettings))
    }
  }

  if (!mounted) {
    return null
  }

  return <SettingsContext.Provider value={{ settings, setFactoryType }}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider")
  }
  return context
}
