"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { SettingsProvider, useSettings } from "@/lib/settings-context"
import { FunctionsProvider, useFunctions } from "@/lib/functions-context"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FunctionTable } from "@/components/functions/function-table"
import { FunctionGraph } from "@/components/functions/function-graph"
import { Loader2, Save, Plus, Trash2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import type { TabulatedFunction, Point } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function EditContent() {
  const { user, isLoading } = useAuth()
  const { settings } = useSettings()
  const { functions, updateFunction } = useFunctions()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [func, setFunc] = useState<TabulatedFunction | null>(null)
  const [name, setName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [showInsertDialog, setShowInsertDialog] = useState(false)
  const [newPointX, setNewPointX] = useState("")
  const [newPointY, setNewPointY] = useState("")
  const [showGraph, setShowGraph] = useState(false)
  const [showPoints, setShowPoints] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
      return
    }

    const funcId = searchParams.get("id")
    if (funcId && functions.length > 0) {
      const found = functions.find((f) => f.id === funcId)
      if (found) {
        setFunc(found)
        setName(found.name)
      } else {
        toast.error("Функция не найдена")
        router.push("/dashboard/create")
      }
    } else if (!funcId) {
      router.push("/dashboard/create")
    }
  }, [user, isLoading, router, searchParams, functions])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!func) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  const handlePointChange = (index: number, field: "x" | "y", value: number) => {
    if (!func) return
    const newPoints = [...func.points]
    if (field === "x") {
      // X не редактируется, но для совместимости оставляем
      return
    }
    newPoints[index] = { ...newPoints[index], [field]: value }
    setFunc({ ...func, points: newPoints })
  }

  const handleInsertPoint = () => {
    if (!func) return
    const x = Number.parseFloat(newPointX)
    const y = Number.parseFloat(newPointY)

    if (Number.isNaN(x) || Number.isNaN(y)) {
      toast.error("Введите корректные значения X и Y")
      return
    }

    // Проверяем, что X строго возрастает
    const sortedByX = [...func.points, { x, y }].sort((a, b) => a.x - b.x)
    for (let i = 1; i < sortedByX.length; i++) {
      if (sortedByX[i].x <= sortedByX[i - 1].x) {
        toast.error("Значения X должны быть строго возрастающими")
        return
      }
    }

    setFunc({ ...func, points: sortedByX })
    setNewPointX("")
    setNewPointY("")
    setShowInsertDialog(false)
    toast.success("Точка добавлена")
  }

  const handleRemovePoint = (index: number) => {
    if (!func || func.points.length <= 2) {
      toast.error("Минимум 2 точки")
      return
    }
    const newPoints = func.points.filter((_, i) => i !== index)
    setFunc({ ...func, points: newPoints })
    toast.success("Точка удалена")
  }

  const handleSave = async () => {
    if (!func || !name.trim()) {
      toast.error("Введите название функции")
      return
    }

    if (func.points.length < 2) {
      toast.error("Функция должна содержать минимум 2 точки")
      return
    }

    // Проверяем, что X строго возрастает
    const sortedByX = [...func.points].sort((a, b) => a.x - b.x)
    for (let i = 1; i < sortedByX.length; i++) {
      if (sortedByX[i].x <= sortedByX[i - 1].x) {
        toast.error("Значения X должны быть строго возрастающими")
        return
      }
    }

    setIsSaving(true)
    try {
      if (func.id) {
        const updatedFunc = {
          ...func,
          name: name.trim(),
          points: sortedByX,
        }
        await updateFunction(func.id, updatedFunc)
        toast.success("Функция сохранена")
        setFunc(updatedFunc)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить функцию")
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Редактирование функции</h1>
            <p className="text-muted-foreground mt-1">Изменение имени и точек функции</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowGraph(!showGraph)}>
              {showGraph ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showGraph ? "Скрыть график" : "Показать график"}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Сохранить
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Edit form */}
          <Card>
            <CardHeader>
              <CardTitle>Информация о функции</CardTitle>
              <CardDescription>Измените название функции и точки</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название функции</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-input/50"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Точки функции ({func.points.length})</Label>
                  {func.isInsertable && (
                    <Dialog open={showInsertDialog} onOpenChange={setShowInsertDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Добавить точку
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Добавить точку</DialogTitle>
                          <DialogDescription>Введите координаты новой точки. Значения X должны быть строго возрастающими.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="newX">X</Label>
                            <Input
                              id="newX"
                              type="number"
                              step="any"
                              value={newPointX}
                              onChange={(e) => setNewPointX(e.target.value)}
                              className="bg-input/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newY">Y</Label>
                            <Input
                              id="newY"
                              type="number"
                              step="any"
                              value={newPointY}
                              onChange={(e) => setNewPointY(e.target.value)}
                              className="bg-input/50"
                            />
                          </div>
                          <Button onClick={handleInsertPoint} className="w-full">
                            Добавить
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <FunctionTable
                  points={func.points}
                  editable={true}
                  onPointChange={handlePointChange}
                  onDeletePoint={func.isRemovable ? handleRemovePoint : undefined}
                  showDelete={func.isRemovable}
                  maxHeight="400px"
                />
              </div>
            </CardContent>
          </Card>

          {/* Graph preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>График функции</CardTitle>
                  <CardDescription>Визуализация функции</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowPoints(!showPoints)}>
                  {showPoints ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showPoints ? "Скрыть точки" : "Показать точки"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showGraph ? (
                <FunctionGraph functions={[func]} height={400} showGrid={true} showDots={showPoints} />
              ) : (
                <div className="h-[400px] flex items-center justify-center border rounded-lg border-dashed text-muted-foreground">
                  Нажмите "Показать график" для визуализации
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function EditPage() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <FunctionsProvider>
          <EditContent />
        </FunctionsProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}
