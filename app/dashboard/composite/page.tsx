"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { SettingsProvider, useSettings } from "@/lib/settings-context"
import { FunctionsProvider, useFunctions } from "@/lib/functions-context"
import { CompositeProvider, useComposite } from "@/lib/composite-context"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FunctionGraph } from "@/components/functions/function-graph"
import { Loader2, Layers, Trash2, ArrowRight, Plus } from "lucide-react"
import { toast } from "sonner"
import type { TabulatedFunction, Point } from "@/lib/types"

// Base math functions for composition
const baseFunctions = [
  { name: "identity", localizedName: "Тождественная функция", fn: (x: number) => x },
  { name: "sqr", localizedName: "Квадратичная функция", fn: (x: number) => x * x },
  { name: "sqrt", localizedName: "Квадратный корень", fn: (x: number) => Math.sqrt(x) },
  { name: "sin", localizedName: "Синус", fn: (x: number) => Math.sin(x) },
  { name: "cos", localizedName: "Косинус", fn: (x: number) => Math.cos(x) },
  { name: "tan", localizedName: "Тангенс", fn: (x: number) => Math.tan(x) },
  { name: "exp", localizedName: "Экспонента", fn: (x: number) => Math.exp(x) },
  { name: "ln", localizedName: "Натуральный логарифм", fn: (x: number) => Math.log(x) },
  { name: "abs", localizedName: "Модуль", fn: (x: number) => Math.abs(x) },
]

function CompositeContent() {
  const { user, isLoading } = useAuth()
  const { settings } = useSettings()
  const { addFunction } = useFunctions()
  const { compositeFunctions, addCompositeFunction, deleteCompositeFunction } = useComposite()
  const router = useRouter()

  const [name, setName] = useState("")
  const [localizedName, setLocalizedName] = useState("")
  const [innerFunction, setInnerFunction] = useState("")
  const [outerFunction, setOuterFunction] = useState("")
  const [priority, setPriority] = useState(100)
  const [isCreating, setIsCreating] = useState(false)

  // Preview state
  const [previewFunc, setPreviewFunc] = useState<TabulatedFunction | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  // Update preview when inner/outer functions change
  useEffect(() => {
    if (!innerFunction || !outerFunction) {
      setPreviewFunc(null)
      return
    }

    const innerFn = [...baseFunctions, ...compositeFunctions].find((f) => f.name === innerFunction)
    const outerFn = [...baseFunctions, ...compositeFunctions].find((f) => f.name === outerFunction)

    if (!innerFn || !outerFn) {
      setPreviewFunc(null)
      return
    }

    // Generate preview points
    const points: Point[] = []
    const from = -5
    const to = 5
    const count = 50

    for (let i = 0; i < count; i++) {
      const x = from + ((to - from) * i) / (count - 1)

      // Apply composition: outer(inner(x))
      let innerValue: number
      if ("fn" in innerFn) {
        innerValue = innerFn.fn(x)
      } else {
        // For composite functions, we need to evaluate recursively
        innerValue = evaluateComposite(innerFn as any, x)
      }

      let y: number
      if ("fn" in outerFn) {
        y = outerFn.fn(innerValue)
      } else {
        y = evaluateComposite(outerFn as any, innerValue)
      }

      if (Number.isFinite(y)) {
        points.push({ x, y })
      }
    }

    if (points.length >= 2) {
      setPreviewFunc({
        name: localizedName || "Предпросмотр",
        points,
        factoryType: settings.factoryType,
      })
    } else {
      setPreviewFunc(null)
    }
  }, [innerFunction, outerFunction, localizedName, compositeFunctions, settings.factoryType])

  const evaluateComposite = (composite: { innerFunction: string; outerFunction: string }, x: number): number => {
    const innerFn = [...baseFunctions, ...compositeFunctions].find((f) => f.name === composite.innerFunction)
    const outerFn = [...baseFunctions, ...compositeFunctions].find((f) => f.name === composite.outerFunction)

    if (!innerFn || !outerFn) return x

    let innerValue: number
    if ("fn" in innerFn) {
      innerValue = innerFn.fn(x)
    } else {
      innerValue = evaluateComposite(innerFn as any, x)
    }

    if ("fn" in outerFn) {
      return outerFn.fn(innerValue)
    }
    return evaluateComposite(outerFn as any, innerValue)
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const allFunctions = [
    ...baseFunctions.map((f) => ({ ...f, isBase: true })),
    ...compositeFunctions.map((f) => ({ ...f, isBase: false })),
  ]

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Введите имя функции (латиницей)")
      return
    }
    if (!localizedName.trim()) {
      toast.error("Введите локализованное название")
      return
    }
    if (!innerFunction || !outerFunction) {
      toast.error("Выберите внутреннюю и внешнюю функции")
      return
    }

    // Check for duplicate name
    if (allFunctions.some((f) => f.name === name.trim())) {
      toast.error("Функция с таким именем уже существует")
      return
    }

    setIsCreating(true)
    try {
      addCompositeFunction({
        name: name.trim(),
        localizedName: localizedName.trim(),
        innerFunction,
        outerFunction,
        priority,
      })
      toast.success("Композитная функция создана")
      setName("")
      setLocalizedName("")
      setInnerFunction("")
      setOuterFunction("")
      setPriority(100)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка создания")
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateTabulated = () => {
    if (!previewFunc) {
      toast.error("Нет функции для создания")
      return
    }
    addFunction(previewFunc)
    toast.success("Табулированная функция создана")
  }

  const handleDelete = (id: number) => {
    deleteCompositeFunction(id)
    toast.success("Функция удалена")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Композитные функции</h1>
          <p className="text-muted-foreground mt-1">Создание сложных функций из простых: g(f(x))</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Create composite function */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-chart-5" />
                Новая композитная функция
              </CardTitle>
              <CardDescription>Выберите внутреннюю f(x) и внешнюю g(x) функции</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Имя функции (латиницей)</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="sin_sqr"
                    className="bg-input/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="localizedName">Локализованное название</Label>
                  <Input
                    id="localizedName"
                    value={localizedName}
                    onChange={(e) => setLocalizedName(e.target.value)}
                    placeholder="Синус квадрата"
                    className="bg-input/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Внутренняя функция f(x)</Label>
                <Select value={innerFunction} onValueChange={setInnerFunction}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue placeholder="Выберите f(x)" />
                  </SelectTrigger>
                  <SelectContent>
                    {allFunctions.map((fn) => (
                      <SelectItem key={fn.name} value={fn.name}>
                        {fn.localizedName} {!fn.isBase && "(композитная)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-center py-2">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <Label>Внешняя функция g(x)</Label>
                <Select value={outerFunction} onValueChange={setOuterFunction}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue placeholder="Выберите g(x)" />
                  </SelectTrigger>
                  <SelectContent>
                    {allFunctions.map((fn) => (
                      <SelectItem key={fn.name} value={fn.name}>
                        {fn.localizedName} {!fn.isBase && "(композитная)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Приоритет (для сортировки)</Label>
                <Input
                  id="priority"
                  type="number"
                  min={1}
                  value={priority}
                  onChange={(e) => setPriority(Number.parseInt(e.target.value) || 100)}
                  className="bg-input/50"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreate} disabled={isCreating} className="flex-1">
                  {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Создать композицию
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCreateTabulated}
                  disabled={!previewFunc}
                  className="flex-1 bg-transparent"
                >
                  Создать табулированную
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Предпросмотр: g(f(x))</CardTitle>
              <CardDescription>
                {innerFunction && outerFunction
                  ? `${allFunctions.find((f) => f.name === outerFunction)?.localizedName}(${allFunctions.find((f) => f.name === innerFunction)?.localizedName}(x))`
                  : "Выберите функции для предпросмотра"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FunctionGraph functions={previewFunc ? [previewFunc] : []} height={300} />
            </CardContent>
          </Card>
        </div>

        {/* Existing composite functions */}
        <Card>
          <CardHeader>
            <CardTitle>Созданные композитные функции</CardTitle>
            <CardDescription>Эти функции доступны при создании табулированных функций</CardDescription>
          </CardHeader>
          <CardContent>
            {compositeFunctions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Нет созданных композитных функций</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {compositeFunctions.map((fn) => (
                  <Card key={fn.id} className="bg-muted/30">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{fn.localizedName}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-1">{fn.name}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {allFunctions.find((f) => f.name === fn.outerFunction)?.localizedName}(
                            {allFunctions.find((f) => f.name === fn.innerFunction)?.localizedName}(x))
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(fn.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default function CompositePage() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <FunctionsProvider>
          <CompositeProvider>
            <CompositeContent />
          </CompositeProvider>
        </FunctionsProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}
