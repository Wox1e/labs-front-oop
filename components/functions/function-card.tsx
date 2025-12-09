import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Database,
  Download,
  Edit,
  LineChart,
  Link2,
  MoreVertical,
  Trash2,
} from "lucide-react"
import type { FunctionCardProps } from "./types" // Предполагается, что есть типы

export function FunctionCard({
  func,
  onDelete,
  onEdit,
  onViewGraph,
  onExport,
  selected,
  onClick,
}: FunctionCardProps) {
  // Защитная проверка - если func undefined или null, не рендерим компонент
  if (!func || typeof func !== "object") {
    console.warn("FunctionCard: func is undefined or invalid", func)
    return null
  }

  // Проверяем, что points существует и является массивом
  const points = Array.isArray(func.points) ? func.points : []
  
  // Безопасное вычисление min и max X
  let minX = 0
  let maxX = 0
  
  if (points.length > 0) {
    try {
      const xValues = points
        .map((p) => (p && typeof p.x === "number" ? p.x : NaN))
        .filter((x) => !isNaN(x))
      
      if (xValues.length > 0) {
        minX = Math.min(...xValues)
        maxX = Math.max(...xValues)
      }
    } catch (error) {
      console.error("Error calculating min/max X:", error)
    }
  }

  // Безопасное извлечение других свойств
  const name = typeof func.name === "string" ? func.name : "Без названия"
  const factoryType = func.factoryType === "array" ? "array" : "linkedList"
  const isInsertable = Boolean(func.isInsertable)
  const isRemovable = Boolean(func.isRemovable)
  const id = func.id !== undefined ? func.id : null

  return (
    <Card
      className={`transition-all cursor-pointer hover:border-primary/50 ${
        selected ? "border-primary ring-1 ring-primary" : ""
      }`}
      onClick={() => {
        if (onClick && id !== null) {
          onClick()
        }
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          if (onClick && id !== null) {
            onClick()
          }
        }
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{name}</CardTitle>
            <CardDescription className="text-xs mt-1">
              {points.length} точек • [{minX.toFixed(2)}, {maxX.toFixed(2)}]
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mr-2"
                aria-label="Действия с функцией"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Редактировать
                </DropdownMenuItem>
              )}
              {onViewGraph && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewGraph()
                  }}
                >
                  <LineChart className="mr-2 h-4 w-4" />
                  График
                </DropdownMenuItem>
              )}
              {onExport && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onExport()
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Экспорт
                </DropdownMenuItem>
              )}
              {onDelete && id !== null && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {factoryType === "array" ? (
              <>
                <Database className="h-3 w-3 mr-1" />
                Массив
              </>
            ) : (
              <>
                <Link2 className="h-3 w-3 mr-1" />
                Список
              </>
            )}
          </Badge>
          {isInsertable && (
            <Badge variant="outline" className="text-xs">
              Insertable
            </Badge>
          )}
          {isRemovable && (
            <Badge variant="outline" className="text-xs">
              Removable
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}