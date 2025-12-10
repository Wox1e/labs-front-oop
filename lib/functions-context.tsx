"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import type { TabulatedFunction } from "./types"
import {api} from "@/lib/api"

interface FunctionsContextType {
  functions: TabulatedFunction[]
  addFunction: (func: TabulatedFunction) => void
  updateFunction: (id: number, func: TabulatedFunction) => void
  deleteFunction: (id: number) => void
  getFunction: (id: number) => TabulatedFunction | undefined
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
      }
    }
  
    // 8. Вызываем функцию загрузки
    fetchFunctions()
  
  }, [])

  const saveFunctions = (funcs: TabulatedFunction[]) => {
    setFunctions(funcs)
    localStorage.setItem("tabulated_functions", JSON.stringify(funcs))
  }

  const addFunction = (func: TabulatedFunction) => {
    const newFunc = { ...func, id: Date.now() }
    saveFunctions([...functions, newFunc])
  }

  const updateFunction = (id: number, func: TabulatedFunction) => {
    saveFunctions(functions.map((f) => (f.id === id ? { ...func, id } : f)))
  }

  const deleteFunction = (id: string) => {
    saveFunctions(functions.filter((f) => f.id !== id))
    api.deleteFunction(id)
  }

  const getFunction = (id: number) => {
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
