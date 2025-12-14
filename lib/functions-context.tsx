"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import type { TabulatedFunction } from "./types"
import { api } from "@/lib/api"
import { useSettings } from "./settings-context"

interface FunctionsContextType {
  functions: TabulatedFunction[]
  addFunction: (func: TabulatedFunction) => Promise<TabulatedFunction>
  updateFunction: (id: string, func: Partial<TabulatedFunction>) => Promise<void>
  deleteFunction: (id: string) => Promise<void>
  getFunction: (id: string) => TabulatedFunction | undefined
}

const FunctionsContext = createContext<FunctionsContextType | null>(null)

export function FunctionsProvider({ children }: { children: ReactNode }) {
  const [functions, setFunctions] = useState<TabulatedFunction[]>([])
  const { settings } = useSettings()

  useEffect(() => {
    const fetchFunctions = async () => {
      try {
        const tabulatedFunctions = await api.getFunctions()

        setFunctions(tabulatedFunctions)
        console.log("Fetched functions:", tabulatedFunctions)
      } catch (error) {
        console.error("Ошибка загрузки функций:", error)
        // не роняем приложение, просто оставляем пустой список
        setFunctions([])
      }
    }
  
    // 8. Вызываем функцию загрузки
    fetchFunctions()
  
  }, [])

  const saveFunctions = (funcs: TabulatedFunction[]) => {
    setFunctions(funcs)
  }

  const addFunction = async (func: TabulatedFunction) => {
    // сохраняем на бэкенде с учетом настройки режима сохранения
    const created = await api.createFromArray(func, settings.storageMode)
    if (!created || !created.id) {
      throw new Error("Ошибка создания функции: не получен ID")
    }
    const newFunc: TabulatedFunction = {
      ...func,
      id: created.id,
      isInsertable: created.isInsertable ?? false,
      isRemovable: created.isRemovable ?? false,
    }
    saveFunctions([...functions, newFunc])
    return newFunc
  }

  const updateFunction = async (id: string, func: Partial<TabulatedFunction>) => {
    const existing = functions.find((f) => f.id === id)
    if (!existing) throw new Error("Функция не найдена")
    
    const updated = { ...existing, ...func, id }
    saveFunctions(functions.map((f) => (f.id === id ? updated : f)))
    
    try {
      // Обновляем на бэкенде с учетом настройки режима сохранения
      await api.updateFunction(id, {
        name: updated.name,
        type: updated.factoryType,
        points: updated.points,
        factoryType: updated.factoryType,
        storageMode: settings.storageMode,
      })
    } catch (err) {
      console.error("Ошибка обновления функции", err)
      throw err
    }
  }

  const deleteFunction = async (id: string) => {
    try {
      await api.deleteFunction(id)
      saveFunctions(functions.filter((f) => f.id !== id))
    } catch (err) {
      console.error("Ошибка удаления функции", err)
      throw err
    }
  }

  const getFunction = (id: string) => {
    return functions.find((f) => f.id === id)
  }

  return (
    <FunctionsContext.Provider value={{ functions, addFunction, updateFunction, deleteFunction, getFunction }}>
      {children}
    </FunctionsContext.Provider>
  )
}

export function useFunctions() {
  const context = useContext(FunctionsContext)
  if (!context) {
    throw new Error("useFunctions must be used within FunctionsProvider")
  }
  return context
}
