"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { SettingsProvider } from "@/lib/settings-context"
import { FunctionsProvider, useFunctions } from "@/lib/functions-context"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FunctionSelector } from "@/components/functions/function-selector"
import { FunctionTable } from "@/components/functions/function-table"
import { differentiate, integrate } from "@/lib/operations"
import { Loader2, GitBranch, Calculator, Download, Save } from "lucide-react"
import { toast } from "sonner"
import type { TabulatedFunction } from "@/lib/types"

function DifferentiationContent() {
  const { user, isLoading } = useAuth()
  const { addFunction } = useFunctions()
  const router = useRouter()

  const [sourceFunc, setSourceFunc] = useState<TabulatedFunction | null>(null)
  const [result, setResult] = useState<TabulatedFunction | null>(null)
  const [integralResult, setIntegralResult] = useState<number | null>(null)
  const [threads, setThreads] = useState(4)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handlePointChange = (index: number, field: "x" | "y", value: number) => {
    if (!sourceFunc) return
    const newPoints = [...sourceFunc.points]
    newPoints[index] = { ...newPoints[index], [field]: value }
    setSourceFunc({ ...sourceFunc, points: newPoints })
  }

  const handleInsertPoint = (x: number, y: number) => {
    if (!sourceFunc) return
    const newPoints = [...sourceFunc.points, { x, y }].sort((a, b) => a.x - b.x)
    setSourceFunc({ ...sourceFunc, points: newPoints })
    toast.success("Точка добавлена")
  }

  const handleRemovePoint = (index: number) => {
    if (!sourceFunc || sourceFunc.points.length <= 2) {
      toast.error("Минимум 2 точки")
      return
    }
    const newPoints = sourceFunc.points.filter((_, i) => i !== index)
    setSourceFunc({ ...sourceFunc, points: newPoints })
    toast.success("Точка удалена")
  }

  const handleDifferentiate = () => {
    if (!sourceFunc) {
      toast.error("Выберите функцию")
      return
    }

    setIsProcessing(true)
    try {
      const res = differentiate(sourceFunc)
      setResult(res)
      toast.success("Дифференцирование выполнено")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка дифференцирования")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleIntegrate = () => {
    if (!sourceFunc) {
      toast.error("Выберите функцию")
      return
    }

    if (threads < 1 || threads > 16) {
      toast.error("Количество потоков должно быть от 1 до 16")
      return
    }

    setIsProcessing(true)
    try {
      const res = integrate(sourceFunc, threads)
      setIntegralResult(res)
      toast.success("Интегрирование выполнено")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка интегрирования")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveResult = () => {
    if (!result) return
    addFunction(result)
    toast.success("Результат сохранён")
  }

  const handleExportResult = () => {
    if (!result) return
    const data = JSON.stringify(result, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${result.name.replace(/\s+/g, "_")}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Результат экспортирован")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Дифференцирование и интегрирование</h1>
          <p className="text-muted-foreground mt-1">Вычисление производной и определённого интеграла функции</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Source function */}
          <FunctionSelector
            title="Исходная функция"
            description="Выберите или создайте функцию для обработки"
            selectedFunction={sourceFunc}
            onSelect={setSourceFunc}
            onPointChange={handlePointChange}
            onInsertPoint={handleInsertPoint}
            onRemovePoint={handleRemovePoint}
          />

          {/* Result */}
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Результат дифференцирования</CardTitle>
              <CardDescription className="text-xs">
                {result ? result.name : "Выполните дифференцирование для получения производной"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-3">
              {result ? (
                <>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSaveResult} className="flex-1 bg-transparent">
                      <Save className="h-4 w-4 mr-1" />
                      Сохранить
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportResult} className="flex-1 bg-transparent">
                      <Download className="h-4 w-4 mr-1" />
                      Экспорт
                    </Button>
                  </div>
                  <div className="flex-1 min-h-0">
                    <FunctionTable points={result.points} editable={false} maxHeight="300px" />
                  </div>
                </>
              ) : (
                <div className="flex-1 min-h-[200px] flex items-center justify-center border rounded-lg border-dashed text-muted-foreground text-sm">
                  Нет результата
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Operations */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-chart-3" />
                Дифференцирование
              </CardTitle>
              <CardDescription className="text-xs">Вычисление производной методом конечных разностей</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleDifferentiate} disabled={!sourceFunc || isProcessing} className="w-full">
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <GitBranch className="h-4 w-4 mr-2" />
                )}
                Вычислить производную
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-5 w-5 text-chart-4" />
                Интегрирование
              </CardTitle>
              <CardDescription className="text-xs">
                Определённый интеграл методом трапеций (параллельно)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="threads" className="text-sm">
                    Количество потоков
                  </Label>
                  <Input
                    id="threads"
                    type="number"
                    min={1}
                    max={16}
                    value={threads}
                    onChange={(e) => setThreads(Number.parseInt(e.target.value) || 1)}
                    className="mt-1 bg-input/50"
                  />
                </div>
              </div>
              <Button onClick={handleIntegrate} disabled={!sourceFunc || isProcessing} className="w-full">
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4 mr-2" />
                )}
                Вычислить интеграл
              </Button>
              {integralResult !== null && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="text-sm text-muted-foreground">Результат интегрирования:</div>
                  <div className="text-2xl font-bold font-mono text-primary">{integralResult.toFixed(6)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function DifferentiationPage() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <FunctionsProvider>
          <DifferentiationContent />
        </FunctionsProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}
