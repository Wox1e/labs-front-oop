"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateFromArray } from "./create-from-array"
import { CreateFromMath } from "./create-from-math"
import { FunctionTable } from "./function-table"
import { useFunctions } from "@/lib/functions-context"
import type { TabulatedFunction } from "@/lib/types"
import { Download, Upload, Plus, PlusCircle } from "lucide-react"
import { toast } from "sonner"
import { useSettings } from "@/lib/settings-context"

interface FunctionSelectorProps {
  title: string
  description?: string
  selectedFunction: TabulatedFunction | null
  onSelect: (func: TabulatedFunction | null) => void
  onPointChange?: (index: number, field: "x" | "y", value: number) => void
  onInsertPoint?: (x: number, y: number) => void
  onRemovePoint?: (index: number) => void
  editable?: boolean
  showSaveLoad?: boolean
  maxHeight?: string
}

export function FunctionSelector({
  title,
  description,
  selectedFunction,
  onSelect,
  onPointChange,
  onInsertPoint,
  onRemovePoint,
  editable = true,
  showSaveLoad = true,
  maxHeight = "300px",
}: FunctionSelectorProps) {
  const { functions, addFunction } = useFunctions()
  const { settings } = useSettings()

  const handleExport = () => {
    if (!selectedFunction) return
    const data = JSON.stringify(selectedFunction, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedFunction.name.replace(/\s+/g, "_")}.json`
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
        const savedFunc = await addFunction({ ...func, factoryType: settings.factoryType })
        onSelect(savedFunc)
        toast.success("Функция загружена")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка загрузки")
      }
    }
    input.click()
  }

  const handleCreated = async (func: TabulatedFunction) => {
    const created = await addFunction(func)
    onSelect(created)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-3">
        {/* Select existing or create new */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={selectedFunction?.id?.toString() || ""}
            onValueChange={(v) => {
              const func = functions.find((f) => f.id?.toString() === v)
              onSelect(func || null)
            }}
          >
            <SelectTrigger className="flex-1 min-w-[150px] bg-input/50">
              <SelectValue placeholder="Выбрать функцию" />
            </SelectTrigger>
            <SelectContent>
              {functions.map((func) => (
                <SelectItem key={func.id} value={func.id?.toString() || ""}>
                  {func.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <CreateFromArray
            onCreated={handleCreated}
            trigger={
              <Button variant="outline" size="icon" title="Создать из массива">
                <Plus className="h-4 w-4" />
              </Button>
            }
          />

          <CreateFromMath
            onCreated={handleCreated}
            trigger={
              <Button variant="outline" size="icon" title="Создать из функции">
                <PlusCircle className="h-4 w-4" />
              </Button>
            }
          />
        </div>

        {/* Load/Save buttons */}
        {showSaveLoad && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleImport} className="flex-1 bg-transparent">
              <Upload className="h-4 w-4 mr-1" />
              Загрузить
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!selectedFunction}
              className="flex-1 bg-transparent"
            >
              <Download className="h-4 w-4 mr-1" />
              Сохранить
            </Button>
          </div>
        )}

        {/* Function table */}
        <div className="flex-1 min-h-0">
          {selectedFunction ? (
            <FunctionTable
              points={selectedFunction.points}
              onPointChange={editable ? onPointChange : undefined}
              onInsertPoint={editable && selectedFunction.isInsertable ? onInsertPoint : undefined}
              onDeletePoint={editable && selectedFunction.isRemovable ? onRemovePoint : undefined}
              editable={editable}
              showInsert={editable && !!selectedFunction.isInsertable}
              showDelete={editable && !!selectedFunction.isRemovable}
              maxHeight={maxHeight}
            />
          ) : (
            <div className="h-full min-h-[200px] flex items-center justify-center border rounded-lg border-dashed text-muted-foreground text-sm">
              Функция не выбрана
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
