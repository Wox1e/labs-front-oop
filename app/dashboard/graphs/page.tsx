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
import { FunctionTable } from "@/components/functions/function-table"
import { applyFunction } from "@/lib/operations"
import { Loader2, Calculator, ZoomIn, ZoomOut, Grid, Circle } from "lucide-react"
import { toast } from "sonner"
import type { TabulatedFunction } from "@/lib/types"

function GraphsContent() {
  const { user, isLoading } = useAuth()
  const { functions, updateFunction } = useFunctions()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
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
      const id = Number.parseInt(idParam)
      if (!Number.isNaN(id)) {
        setSelectedIds(new Set([id]))
        const func = functions.find((f) => f.id === id)
        if (func) {
          setSelectedFunc(func)
        }
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

  const toggleFunction = (id: number) => {
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

  const handlePointChange = (index: number, field: "x" | "y", value: number) => {
    if (!selectedFunc) return
    const newPoints = [...selectedFunc.points]
    newPoints[index] = { ...newPoints[index], [field]: value }
    const updated = { ...selectedFunc, points: newPoints }
    setSelectedFunc(updated)
    if (selectedFunc.id) {
      updateFunction(selectedFunc.id, updated)
    }
  }

  const handleInsertPoint = (x: number, y: number) => {
    if (!selectedFunc) return
    const newPoints = [...selectedFunc.points, { x, y }].sort((a, b) => a.x - b.x)
    const updated = { ...selectedFunc, points: newPoints }
    setSelectedFunc(updated)
    if (selectedFunc.id) {
      updateFunction(selectedFunc.id, updated)
    }
    toast.success("Точка добавлена")
  }

  const handleRemovePoint = (index: number) => {
    if (!selectedFunc || selectedFunc.points.length <= 2) {
      toast.error("Минимум 2 точки")
      return
    }
    const newPoints = selectedFunc.points.filter((_, i) => i !== index)
    const updated = { ...selectedFunc, points: newPoints }
    setSelectedFunc(updated)
    if (selectedFunc.id) {
      updateFunction(selectedFunc.id, updated)
    }
    toast.success("Точка удалена")
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
                        toggleFunction(func.id!)
                      }}
                    >
                      <Checkbox
                        checked={selectedIds.has(func.id!)}
                        onCheckedChange={() => toggleFunction(func.id!)}
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

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Apply function */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-5 w-5 text-chart-1" />
                Вычислить значение
              </CardTitle>
              <CardDescription className="text-xs">Вычисление f(x) для выбранной функции</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
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

          {/* Edit points */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Редактирование точек</CardTitle>
              <CardDescription className="text-xs">
                {selectedFunc ? selectedFunc.name : "Выберите функцию для редактирования"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedFunc ? (
                <FunctionTable
                  points={selectedFunc.points}
                  onPointChange={handlePointChange}
                  onInsertPoint={selectedFunc.isInsertable ? handleInsertPoint : undefined}
                  onDeletePoint={selectedFunc.isRemovable ? handleRemovePoint : undefined}
                  editable
                  showInsert={!!selectedFunc.isInsertable}
                  showDelete={!!selectedFunc.isRemovable}
                  maxHeight="250px"
                />
              ) : (
                <div className="h-[200px] flex items-center justify-center border rounded-lg border-dashed text-muted-foreground text-sm">
                  Выберите функцию
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
