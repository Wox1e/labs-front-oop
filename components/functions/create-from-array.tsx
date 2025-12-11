"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FunctionTable } from "./function-table"
import { useSettings } from "@/lib/settings-context"
import { toast } from "sonner"
import { Loader2, TableIcon } from "lucide-react"
import type { Point, TabulatedFunction } from "@/lib/types"

interface CreateFromArrayProps {
  onCreated: (func: TabulatedFunction) => Promise<void> | void
  trigger?: React.ReactNode
}

export function CreateFromArray({ onCreated, trigger }: CreateFromArrayProps) {
  const { settings } = useSettings()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [pointsCount, setPointsCount] = useState<number>(2)
  const [points, setPoints] = useState<Point[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showTable, setShowTable] = useState(false)

  const handleGenerateTable = () => {
    if (pointsCount < 2) {
      toast.error("Минимальное количество точек: 2")
      return
    }
    if (pointsCount > 1000) {
      toast.error("Максимальное количество точек: 1000")
      return
    }
    setPoints(Array.from({ length: pointsCount }, () => ({ x: 0, y: 0 })))
    setShowTable(true)
  }

  const handlePointChange = (index: number, field: "x" | "y", value: number) => {
    const newPoints = [...points]
    newPoints[index] = { ...newPoints[index], [field]: value }
    setPoints(newPoints)
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Введите название функции")
      return
    }

    // Validate X values are strictly increasing
    const sortedByX = [...points].sort((a, b) => a.x - b.x)
    for (let i = 1; i < sortedByX.length; i++) {
      if (sortedByX[i].x <= sortedByX[i - 1].x) {
        toast.error("Значения X должны быть строго возрастающими")
        return
      }
    }

    setIsLoading(true)

    try {
      // Создаем объект функции для локального состояния
      const func: TabulatedFunction = {
        name: name.trim(),
        points: sortedByX,
        factoryType: settings.factoryType,
        isInsertable: settings.factoryType === "linkedList",
        isRemovable: settings.factoryType === "linkedList",
      }

      // передаем наверх для сохранения и отображения
      await onCreated(func)

      toast.success("Функция создана успешно")
      setOpen(false)
      resetForm()
    } catch (error) {
      console.error("Ошибка создания функции:", error)
      
      // Более подробные сообщения об ошибках
      if (error instanceof Error) {
        if (error.message.includes("Уже существует")) {
          toast.error("Функция с таким названием уже существует")
        } else if (error.message.includes("Недопустимые данные")) {
          toast.error("Недопустимые данные. Проверьте введенные значения")
        } else if (error.message.includes("Сеть")) {
          toast.error("Ошибка сети. Проверьте подключение к серверу")
        } else {
          toast.error(`Ошибка создания функции: ${error.message}`)
        }
      } else {
        toast.error("Неизвестная ошибка при создании функции")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setPointsCount(2)
    setPoints([])
    setShowTable(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) resetForm()
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="h-auto py-4 px-6 bg-transparent">
            <TableIcon className="h-5 w-5 mr-2" />
            Из массивов X и Y
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создание функции из массивов</DialogTitle>
          <DialogDescription>Введите количество точек и заполните таблицу значений X и Y</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Название функции</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Моя функция"
                className="bg-input/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pointsCount">Количество точек</Label>
              <div className="flex gap-2">
                <Input
                  id="pointsCount"
                  type="number"
                  min={2}
                  max={1000}
                  value={pointsCount}
                  onChange={(e) => setPointsCount(Number.parseInt(e.target.value) || 2)}
                  className="bg-input/50"
                />
                <Button type="button" variant="secondary" onClick={handleGenerateTable}>
                  Создать таблицу
                </Button>
              </div>
            </div>
          </div>

          {showTable && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Таблица значений</CardTitle>
                <CardDescription className="text-xs">Значения X должны быть строго возрастающими</CardDescription>
              </CardHeader>
              <CardContent className="py-3">
                <FunctionTable points={points} onPointChange={handlePointChange} editable editableX maxHeight="300px" />
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreate} disabled={isLoading || !showTable || points.length < 2}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                "Создать"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}