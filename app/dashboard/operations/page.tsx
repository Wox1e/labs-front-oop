"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { SettingsProvider, useSettings } from "@/lib/settings-context"
import { FunctionsProvider, useFunctions } from "@/lib/functions-context"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FunctionSelector } from "@/components/functions/function-selector"
import { FunctionTable } from "@/components/functions/function-table"
import { addFunctions, subtractFunctions, multiplyFunctions, divideFunctions } from "@/lib/operations"
import { Loader2, Plus, Minus, X, Divide, Download, Save } from "lucide-react"
import { toast } from "sonner"
import type { TabulatedFunction } from "@/lib/types"

function OperationsContent() {
  const { user, isLoading } = useAuth()
  const { settings } = useSettings()
  const { addFunction } = useFunctions()
  const router = useRouter()

  const [func1, setFunc1] = useState<TabulatedFunction | null>(null)
  const [func2, setFunc2] = useState<TabulatedFunction | null>(null)
  const [result, setResult] = useState<TabulatedFunction | null>(null)
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

  const handlePointChange1 = (index: number, field: "x" | "y", value: number) => {
    if (!func1) return
    const newPoints = [...func1.points]
    newPoints[index] = { ...newPoints[index], [field]: value }
    setFunc1({ ...func1, points: newPoints })
  }

  const handlePointChange2 = (index: number, field: "x" | "y", value: number) => {
    if (!func2) return
    const newPoints = [...func2.points]
    newPoints[index] = { ...newPoints[index], [field]: value }
    setFunc2({ ...func2, points: newPoints })
  }

  const handleInsertPoint1 = (x: number, y: number) => {
    if (!func1) return
    const newPoints = [...func1.points, { x, y }].sort((a, b) => a.x - b.x)
    setFunc1({ ...func1, points: newPoints })
    toast.success("Точка добавлена")
  }

  const handleInsertPoint2 = (x: number, y: number) => {
    if (!func2) return
    const newPoints = [...func2.points, { x, y }].sort((a, b) => a.x - b.x)
    setFunc2({ ...func2, points: newPoints })
    toast.success("Точка добавлена")
  }

  const handleRemovePoint1 = (index: number) => {
    if (!func1 || func1.points.length <= 2) {
      toast.error("Минимум 2 точки")
      return
    }
    const newPoints = func1.points.filter((_, i) => i !== index)
    setFunc1({ ...func1, points: newPoints })
    toast.success("Точка удалена")
  }

  const handleRemovePoint2 = (index: number) => {
    if (!func2 || func2.points.length <= 2) {
      toast.error("Минимум 2 точки")
      return
    }
    const newPoints = func2.points.filter((_, i) => i !== index)
    setFunc2({ ...func2, points: newPoints })
    toast.success("Точка удалена")
  }

  const performOperation = (operation: "add" | "subtract" | "multiply" | "divide") => {
    if (!func1 || !func2) {
      toast.error("Выберите обе функции")
      return
    }

    setIsProcessing(true)
    try {
      let res: TabulatedFunction
      switch (operation) {
        case "add":
          res = addFunctions(func1, func2)
          break
        case "subtract":
          res = subtractFunctions(func1, func2)
          break
        case "multiply":
          res = multiplyFunctions(func1, func2)
          break
        case "divide":
          res = divideFunctions(func1, func2)
          break
      }
      setResult(res)
      toast.success("Операция выполнена")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка операции")
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
          <h1 className="text-3xl font-bold tracking-tight">Операции над функциями</h1>
          <p className="text-muted-foreground mt-1">Сложение, вычитание, умножение и деление табулированных функций</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* First operand */}
          <FunctionSelector
            title="Первый операнд"
            description="Выберите или создайте функцию"
            selectedFunction={func1}
            onSelect={setFunc1}
            onPointChange={handlePointChange1}
            onInsertPoint={handleInsertPoint1}
            onRemovePoint={handleRemovePoint1}
          />

          {/* Second operand */}
          <FunctionSelector
            title="Второй операнд"
            description="Выберите или создайте функцию"
            selectedFunction={func2}
            onSelect={setFunc2}
            onPointChange={handlePointChange2}
            onInsertPoint={handleInsertPoint2}
            onRemovePoint={handleRemovePoint2}
          />

          {/* Result */}
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Результат</CardTitle>
              <CardDescription className="text-xs">
                {result ? result.name : "Выполните операцию для получения результата"}
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

        {/* Operation buttons */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Выберите операцию</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => performOperation("add")}
                disabled={!func1 || !func2 || isProcessing}
                className="flex-1 min-w-[120px]"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Сложение
              </Button>
              <Button
                onClick={() => performOperation("subtract")}
                disabled={!func1 || !func2 || isProcessing}
                variant="secondary"
                className="flex-1 min-w-[120px]"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Minus className="h-4 w-4 mr-2" />}
                Вычитание
              </Button>
              <Button
                onClick={() => performOperation("multiply")}
                disabled={!func1 || !func2 || isProcessing}
                variant="secondary"
                className="flex-1 min-w-[120px]"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                Умножение
              </Button>
              <Button
                onClick={() => performOperation("divide")}
                disabled={!func1 || !func2 || isProcessing}
                variant="secondary"
                className="flex-1 min-w-[120px]"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Divide className="h-4 w-4 mr-2" />}
                Деление
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default function OperationsPage() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <FunctionsProvider>
          <OperationsContent />
        </FunctionsProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}
