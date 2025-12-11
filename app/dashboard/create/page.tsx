"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { SettingsProvider, useSettings } from "@/lib/settings-context"
import { FunctionsProvider, useFunctions } from "@/lib/functions-context"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreateFromArray } from "@/components/functions/create-from-array"
import { CreateFromMath } from "@/components/functions/create-from-math"
import { FunctionCard } from "@/components/functions/function-card"
import { FunctionTable } from "@/components/functions/function-table"
import { Loader2, Upload, Trash2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import type { TabulatedFunction } from "@/lib/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function CreateContent() {
  const { user, isLoading } = useAuth()
  const { settings } = useSettings()
  const { functions, addFunction, deleteFunction } = useFunctions()
  const router = useRouter()
  const [selectedFunc, setSelectedFunc] = useState<TabulatedFunction | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showPoints, setShowPoints] = useState(true)

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

  const handleCreated = async (func: TabulatedFunction) => {
    const created = await addFunction(func)
    setSelectedFunc(created)
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteFunction(deleteId)
      if (selectedFunc?.id === deleteId) {
        setSelectedFunc(null)
      }
      toast.success("Функция удалена")
      setDeleteId(null)
    }
  }

  const handleExport = (func: TabulatedFunction) => {
    const data = JSON.stringify(func, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${func.name.replace(/\s+/g, "_")}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Функция экспортирована")
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const func = JSON.parse(text) as TabulatedFunction
        if (!func.name || !func.points || !Array.isArray(func.points)) {
          throw new Error("Неверный формат файла")
        }
        await addFunction({ ...func, factoryType: settings.factoryType })
        toast.success("Функция импортирована")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка импорта")
      }
    }
    input.click()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Создание функций</h1>
            <p className="text-muted-foreground mt-1">
              Текущая фабрика:{" "}
              <Badge variant="secondary">{settings.factoryType === "array" ? "Массив" : "Связный список"}</Badge>
            </p>
          </div>
          <Button variant="outline" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Импорт JSON
          </Button>
        </div>

        {/* Create options */}
        <Card>
          <CardHeader>
            <CardTitle>Новая функция</CardTitle>
            <CardDescription>Выберите способ создания табулированной функции</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <CreateFromArray onCreated={handleCreated} />
              <CreateFromMath onCreated={handleCreated} />
            </div>
          </CardContent>
        </Card>

        {/* Functions list and preview */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Functions list */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Мои функции ({functions.length})</h2>
            {functions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Нет созданных функций. Создайте первую функцию выше.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {functions.map((func) => (
                  <FunctionCard
                    key={func.id}
                    func={func}
                    selected={selectedFunc?.id === func.id}
                    onClick={() => setSelectedFunc(func)}
                    onDelete={() => setDeleteId(func.id!)}
                    onExport={() => handleExport(func)}
                    onViewGraph={() => router.push(`/dashboard/graphs?id=${func.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Предпросмотр</h2>
              {selectedFunc && (
                <Button variant="ghost" size="sm" onClick={() => setShowPoints(!showPoints)}>
                  {showPoints ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showPoints ? "Скрыть точки" : "Показать точки"}
                </Button>
              )}
            </div>
            {selectedFunc ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>{selectedFunc.name}</CardTitle>
                  <CardDescription>
                    {selectedFunc.points.length} точек • Тип:{" "}
                    {selectedFunc.factoryType === "array" ? "Массив" : "Список"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {showPoints && <FunctionTable points={selectedFunc.points} editable={false} maxHeight="350px" />}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center text-muted-foreground">
                  Выберите функцию для просмотра
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить функцию?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Функция будет удалена безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}

export default function CreatePage() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <FunctionsProvider>
          <CreateContent />
        </FunctionsProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}
