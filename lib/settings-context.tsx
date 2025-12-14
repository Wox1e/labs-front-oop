"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import type { FactoryType, StorageMode, AppSettings } from "./types"

interface SettingsContextType {
  settings: AppSettings
  setStorageMode: (mode: StorageMode) => void
  setFactoryType: (type: FactoryType) => void
}

const defaultSettings: AppSettings = {
  storageMode: "pointwise",
  factoryType: "array",
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
        const parsed = JSON.parse(saved) as AppSettings
        // Убеждаемся, что factoryType есть (для старых сохранений)
        setSettings({
          ...defaultSettings,
          ...parsed,
          factoryType: parsed.factoryType || defaultSettings.factoryType,
        })
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

  const setFactoryType = (type: FactoryType) => {
    const newSettings = { ...settings, factoryType: type }
    setSettings(newSettings)
    if (typeof window !== "undefined") {
      localStorage.setItem("app_settings", JSON.stringify(newSettings))
    }
  }

  if (!mounted) return null

  return <SettingsContext.Provider value={{ settings, setStorageMode, setFactoryType }}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider")
  }
  return context
}
