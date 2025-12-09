"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"

export interface CompositeFunction {
  id: number
  name: string
  localizedName: string
  innerFunction: string
  outerFunction: string
  priority: number
}

interface CompositeContextType {
  compositeFunctions: CompositeFunction[]
  addCompositeFunction: (func: Omit<CompositeFunction, "id">) => void
  deleteCompositeFunction: (id: number) => void
}

const CompositeContext = createContext<CompositeContextType | null>(null)

export function CompositeProvider({ children }: { children: ReactNode }) {
  const [compositeFunctions, setCompositeFunctions] = useState<CompositeFunction[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("composite_functions")
    if (saved) {
      try {
        setCompositeFunctions(JSON.parse(saved))
      } catch {
        // ignore
      }
    }
  }, [])

  const saveFunctions = (funcs: CompositeFunction[]) => {
    setCompositeFunctions(funcs)
    localStorage.setItem("composite_functions", JSON.stringify(funcs))
  }

  const addCompositeFunction = (func: Omit<CompositeFunction, "id">) => {
    const newFunc = { ...func, id: Date.now() }
    saveFunctions([...compositeFunctions, newFunc])
  }

  const deleteCompositeFunction = (id: number) => {
    saveFunctions(compositeFunctions.filter((f) => f.id !== id))
  }

  return (
    <CompositeContext.Provider value={{ compositeFunctions, addCompositeFunction, deleteCompositeFunction }}>
      {children}
    </CompositeContext.Provider>
  )
}

export function useComposite() {
  const context = useContext(CompositeContext)
  if (!context) {
    throw new Error("useComposite must be used within CompositeProvider")
  }
  return context
}
