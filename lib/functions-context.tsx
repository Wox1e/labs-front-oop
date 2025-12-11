"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import type { TabulatedFunction } from "./types"
import { api } from "@/lib/api"

interface FunctionsContextType {
  functions: TabulatedFunction[]
  addFunction: (func: TabulatedFunction) => Promise<TabulatedFunction>
  updateFunction: (id: string, func: TabulatedFunction) => void
  deleteFunction: (id: string) => void
  getFunction: (id: string) => TabulatedFunction | undefined
}

const FunctionsContext = createContext<FunctionsContextType | null>(null)

export function FunctionsProvider({ children }: { children: ReactNode }) {
  const [functions, setFunctions] = useState<TabulatedFunction[]>([])

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
    // сохраняем на бэкенде и получаем реальный id
    const created = await api.createFromArray(func)
    const newFunc: TabulatedFunction = {
      ...func,
      id: created.id,
      isInsertable: created.isInsertable,
      isRemovable: created.isRemovable,
    }
    saveFunctions([...functions, newFunc])
    return newFunc
  }

  const updateFunction = (id: string, func: TabulatedFunction) => {
    saveFunctions(functions.map((f) => (f.id === id ? { ...func, id } : f)))
    api.updateFunction(id, func).catch((err) => console.error("Ошибка обновления функции", err))
  }

  const deleteFunction = (id: string) => {
    saveFunctions(functions.filter((f) => f.id !== id))
    api.deleteFunction(id).catch((err) => console.error("Ошибка удаления функции", err))
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
