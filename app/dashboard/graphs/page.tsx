"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { SettingsProvider } from "@/lib/settings-context"
import { FunctionsProvider, useFunctions } from "@/lib/functions-context"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { FunctionGraph } from "@/components/functions/function-graph"
import { applyFunction } from "@/lib/operations"
import { Loader2, Calculator, ZoomIn, ZoomOut, Grid, Circle } from "lucide-react"
import { toast } from "sonner"
import type { TabulatedFunction } from "@/lib/types"

function GraphsContent() {
  const { user, isLoading } = useAuth()
  const { functions } = useFunctions()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedFunc, setSelectedFunc] = useState<TabulatedFunction | null>(null)
  const [applyX, setApplyX] = useState<string>("")
  const [applyResult, setApplyResult] = useState<number | null>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [showDots, setShowDots] = useState(true)
  const [graphHeight, setGraphHeight] = useState(400)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  // Handle URL parameter for initial selection
  useEffect(() => {
    const idParam = searchParams.get("id")
    if (idParam) {
      setSelectedIds(new Set([idParam]))
      const func = functions.find((f) => f.id === idParam)
      if (func) {
        setSelectedFunc(func)
      }
    }
  }, [searchParams, functions])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const selectedFunctions = functions.filter((f) => f.id && selectedIds.has(f.id))

  const toggleFunction = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
      if (selectedFunc?.id === id) {
        setSelectedFunc(null)
      }
    } else {
      newSelected.add(id)
      const func = functions.find((f) => f.id === id)
      if (func) {
        setSelectedFunc(func)
      }
    }
    setSelectedIds(newSelected)
  }

  const handleApply = () => {
    if (!selectedFunc) {
      toast.error("Выберите функцию")
      return
    }
    const x = Number.parseFloat(applyX)
    if (Number.isNaN(x)) {
      toast.error("Введите корректное значение X")
      return
    }
    try {
      const result = applyFunction(selectedFunc, x)
      setApplyResult(result)
      toast.success(`f(${x}) = ${result.toFixed(6)}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка вычисления")
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Графики функций</h1>
          <p className="text-muted-foreground mt-1">Визуализация и анализ табулированных функций</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Function selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Выбор функций</CardTitle>
              <CardDescription className="text-xs">Выберите функции для отображения на графике</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {functions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Нет созданных функций</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {functions.map((func) => (
                    <div
                      key={func.id}
                      className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedFunc?.id === func.id ? "bg-accent" : "hover:bg-accent/50"
                      }`}
                      onClick={() => {
                        if (func.id) toggleFunction(func.id)
                      }}
                    >
                      <Checkbox
                        checked={!!func.id && selectedIds.has(func.id)}
                        onCheckedChange={() => func.id && toggleFunction(func.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{func.name}</p>
                        <p className="text-xs text-muted-foreground">{func.points.length} точек</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Graph controls */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Настройки графика</CardTitle>
                  <CardDescription className="text-xs">Масштабирование и отображение</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    onClick={() => setGraphHeight(Math.max(200, graphHeight - 100))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    onClick={() => setGraphHeight(Math.min(800, graphHeight + 100))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="grid" checked={showGrid} onCheckedChange={(c) => setShowGrid(!!c)} />
                  <Label htmlFor="grid" className="flex items-center gap-1 text-sm cursor-pointer">
                    <Grid className="h-4 w-4" />
                    Сетка
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="dots" checked={showDots} onCheckedChange={(c) => setShowDots(!!c)} />
                  <Label htmlFor="dots" className="flex items-center gap-1 text-sm cursor-pointer">
                    <Circle className="h-4 w-4" />
                    Точки
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graph */}
        <Card>
          <CardContent className="pt-6">
            <FunctionGraph functions={selectedFunctions} height={graphHeight} showGrid={showGrid} showDots={showDots} />
          </CardContent>
        </Card>

        {/* Apply function (full width, editing removed) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-5 w-5 text-chart-1" />
              Вычислить значение
            </CardTitle>
            <CardDescription className="text-xs">Вычисление f(x) для выбранной функции</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <Label htmlFor="applyX" className="sr-only">
                  Значение X
                </Label>
                <Input
                  id="applyX"
                  type="number"
                  step="any"
                  placeholder="Введите X"
                  value={applyX}
                  onChange={(e) => setApplyX(e.target.value)}
                  className="bg-input/50"
                />
              </div>
              <Button onClick={handleApply} disabled={!selectedFunc}>
                <Calculator className="h-4 w-4 mr-1" />
                Вычислить
              </Button>
            </div>
            {applyResult !== null && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="text-sm text-muted-foreground">
                  {selectedFunc?.name}: f({applyX}) =
                </div>
                <div className="text-2xl font-bold font-mono text-primary">{applyResult.toFixed(6)}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default function GraphsPage() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <FunctionsProvider>
          <GraphsContent />
        </FunctionsProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}
