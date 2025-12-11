"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useSettings } from "@/lib/settings-context"
import { toast } from "sonner"
import { Loader2, FunctionSquare } from "lucide-react"
import type { Point, TabulatedFunction } from "@/lib/types"


// Available math functions (sorted by priority, then alphabetically)
const mathFunctions = [
  { name: "identity", localizedName: "Тождественная функция", priority: 1, fn: (x: number) => x },
  { name: "sqr", localizedName: "Квадратичная функция", priority: 2, fn: (x: number) => x * x },
  { name: "sqrt", localizedName: "Квадратный корень", priority: 3, fn: (x: number) => Math.sqrt(x) },
  { name: "sin", localizedName: "Синус", priority: 4, fn: (x: number) => Math.sin(x) },
  { name: "cos", localizedName: "Косинус", priority: 5, fn: (x: number) => Math.cos(x) },
  { name: "tan", localizedName: "Тангенс", priority: 6, fn: (x: number) => Math.tan(x) },
  { name: "exp", localizedName: "Экспонента", priority: 7, fn: (x: number) => Math.exp(x) },
  { name: "ln", localizedName: "Натуральный логарифм", priority: 8, fn: (x: number) => Math.log(x) },
  { name: "abs", localizedName: "Модуль", priority: 9, fn: (x: number) => Math.abs(x) },
  { name: "zero", localizedName: "Нулевая функция", priority: 10, fn: () => 0 },
  { name: "unit", localizedName: "Единичная функция", priority: 11, fn: () => 1 },
  { name: "cubic", localizedName: "Кубическая функция", priority: 12, fn: (x: number) => x * x * x },
].sort((a, b) => a.priority - b.priority || a.localizedName.localeCompare(b.localizedName, "ru"))

interface CreateFromMathProps {
  onCreated: (func: TabulatedFunction) => Promise<void> | void
  trigger?: React.ReactNode
}

export function CreateFromMath({ onCreated, trigger }: CreateFromMathProps) {
  const { settings } = useSettings()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [selectedFunction, setSelectedFunction] = useState("")
  const [from, setFrom] = useState<number>(0)
  const [to, setTo] = useState<number>(10)
  const [pointsCount, setPointsCount] = useState<number>(10)
  const [isLoading, setIsLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Введите название функции")
      return
    }
    if (!selectedFunction) {
      toast.error("Выберите математическую функцию")
      return
    }
    if (from >= to) {
      toast.error("Начало интервала должно быть меньше конца")
      return
    }
    if (pointsCount < 2) {
      toast.error("Минимальное количество точек: 2")
      return
    }
    if (pointsCount > 1000) {
      toast.error("Максимальное количество точек: 1000")
      return
    }

    setIsLoading(true)
    try {
      const mathFunc = mathFunctions.find((f) => f.name === selectedFunction)
      if (!mathFunc) {
        throw new Error("Функция не найдена")
      }

      // Generate points
      const step = (to - from) / (pointsCount - 1)
      const points: Point[] = []

      for (let i = 0; i < pointsCount; i++) {
        const x = from + i * step
        const y = mathFunc.fn(x)
        if (!Number.isFinite(y)) {
          throw new Error(`Функция не определена в точке x = ${x.toFixed(4)}`)
        }
        points.push({ x, y })
      }

      const func: TabulatedFunction = {
        name: name.trim(),
        points,
        factoryType: settings.factoryType,
        isInsertable: settings.factoryType === "linkedList",
        isRemovable: settings.factoryType === "linkedList",
      }

      await onCreated(func)
      toast.success("Функция создана успешно")
      setOpen(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка создания функции")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setSelectedFunction("")
    setFrom(0)
    setTo(10)
    setPointsCount(10)
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
            <FunctionSquare className="h-5 w-5 mr-2" />
            Из математической функции
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Создание из математической функции</DialogTitle>
          <DialogDescription>Выберите функцию и укажите интервал табулирования</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
            <Label>Математическая функция</Label>
            <Select value={selectedFunction} onValueChange={setSelectedFunction}>
              <SelectTrigger className="bg-input/50">
                <SelectValue placeholder="Выберите функцию" />
              </SelectTrigger>
              <SelectContent>
                {mathFunctions.map((fn) => (
                  <SelectItem key={fn.name} value={fn.name}>
                    {fn.localizedName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">Начало интервала</Label>
              <Input
                id="from"
                type="number"
                step="any"
                value={from}
                onChange={(e) => setFrom(Number.parseFloat(e.target.value) || 0)}
                className="bg-input/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">Конец интервала</Label>
              <Input
                id="to"
                type="number"
                step="any"
                value={to}
                onChange={(e) => setTo(Number.parseFloat(e.target.value) || 0)}
                className="bg-input/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pointsCount">Количество точек</Label>
            <Input
              id="pointsCount"
              type="number"
              min={2}
              max={1000}
              value={pointsCount}
              onChange={(e) => setPointsCount(Number.parseInt(e.target.value) || 2)}
              className="bg-input/50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreate} disabled={isLoading}>
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
