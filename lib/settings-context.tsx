"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import type { FactoryType, StorageMode, AppSettings } from "./types"

interface SettingsContextType {
  settings: AppSettings
  setStorageMode: (mode: StorageMode) => void
}

const defaultSettings: AppSettings = {
  storageMode: "pointwise",
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("app_settings")
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch {}
    }
  }, [])

  const setStorageMode = (mode: StorageMode) => {
    const newSettings = { ...settings, storageMode: mode }
    setSettings(newSettings)
    if (typeof window !== "undefined") {
      localStorage.setItem("app_settings", JSON.stringify(newSettings))
    }
  }

  if (!mounted) return null

  return <SettingsContext.Provider value={{ settings, setStorageMode }}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider")
  }
  return context
}
