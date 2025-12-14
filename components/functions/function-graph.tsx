"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import type { TabulatedFunction } from "@/lib/types"

interface FunctionGraphProps {
  functions: TabulatedFunction[]
  height?: number
  showGrid?: boolean
  showDots?: boolean
  highlightPoint?: { x: number; y: number } | null
  zoom?: number // новее
}

const colors = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#eab308", // yellow
  "#a855f7", // purple
  "#f97316", // orange
]

export function FunctionGraph({ functions, height = 400, showGrid = true, showDots = true, highlightPoint, zoom = 1 }: FunctionGraphProps) {
  // Проверяем, что у КАЖДОЙ функции есть минимум 2 точки — если нет, не пытаемся строить график
  if (!Array.isArray(functions) || functions.length === 0 || functions.some(fn => !Array.isArray(fn.points) || fn.points.length < 2)) {
    return (
      <div className="flex items-center justify-center border rounded-lg border-dashed text-muted-foreground" style={{ height }}>
        Недостаточно точек для построения графика (нужно минимум 2)
      </div>
    )
  }

  const chartData = useMemo(() => {
    if (functions.length === 0) return []

    const allX = new Set<number>()
    for (const func of functions) {
      if (func && func.points && Array.isArray(func.points)) {
        for (const point of func.points) {
          if (point && typeof point.x === "number" && Number.isFinite(point.x)) {
            allX.add(point.x)
          }
        }
      }
    }

    const sortedX = Array.from(allX).sort((a, b) => a - b)

    return sortedX.map((x) => {
      const dataPoint: Record<string, number> = { x }
      for (let i = 0; i < functions.length; i++) {
        const func = functions[i]
        if (func && func.points && Array.isArray(func.points)) {
          const point = func.points.find((p) => p && typeof p.x === "number" && p.x === x)
          if (point && typeof point.y === "number" && Number.isFinite(point.y)) {
            dataPoint[`y${i}`] = point.y
          }
        }
      }
      return dataPoint
    })
  }, [functions])

  const { minY, maxY, minX, maxX } = useMemo(() => {
    if (functions.length === 0) return { minY: -1, maxY: 1, minX: -1, maxX: 1 }
    let minY = Number.POSITIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    let minX = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    for (const func of functions) {
      if (func && func.points && Array.isArray(func.points)) {
        for (const point of func.points) {
          if (point && typeof point.x === "number" && typeof point.y === "number" && 
              Number.isFinite(point.x) && Number.isFinite(point.y)) {
            minY = Math.min(minY, point.y)
            maxY = Math.max(maxY, point.y)
            minX = Math.min(minX, point.x)
            maxX = Math.max(maxX, point.x)
          }
        }
      }
    }
    
    // Если не нашли валидных точек, возвращаем дефолтные значения
    if (!Number.isFinite(minY) || !Number.isFinite(maxY) || !Number.isFinite(minX) || !Number.isFinite(maxX)) {
      return { minY: -1, maxY: 1, minX: -1, maxX: 1 }
    }
    
    // padding как раньше
    const paddingY = (maxY - minY) * 0.1 || 1
    const paddingX = (maxX - minX) * 0.05 || 0.1
    // zoom: range становится меньше при zoom < 1
    let rangeY = (maxY - minY + 2 * paddingY)
    let rangeX = (maxX - minX + 2 * paddingX)
    const centerY = (maxY + minY) / 2
    const centerX = (maxX + minX) / 2
    const zoomedRangeY = rangeY * zoom
    const zoomedRangeX = rangeX * zoom
    
    const result = {
      minY: centerY - zoomedRangeY / 2,
      maxY: centerY + zoomedRangeY / 2,
      minX: centerX - zoomedRangeX / 2,
      maxX: centerX + zoomedRangeX / 2,
    }
    
    // Финальная проверка - убеждаемся, что все значения конечные
    if (!Number.isFinite(result.minY) || !Number.isFinite(result.maxY) || 
        !Number.isFinite(result.minX) || !Number.isFinite(result.maxX)) {
      return { minY: -1, maxY: 1, minX: -1, maxX: 1 }
    }
    
    return result
  }, [functions, zoom])

  if (functions.length === 0 || chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center border rounded-lg border-dashed text-muted-foreground"
        style={{ height }}
      >
        {functions.length === 0 ? "Нет функций для отображения" : "Недостаточно данных для построения графика"}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart 
        data={chartData} 
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        aria-label="График табулированных функций"
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />}
        <XAxis 
          dataKey="x" 
          stroke="#9ca3af" 
          fontSize={12} 
          tickFormatter={(value: number | string) => {
            const numValue = typeof value === "number" ? value : Number.parseFloat(String(value))
            return (numValue != null && !Number.isNaN(numValue) && Number.isFinite(numValue) ? numValue.toFixed(2) : "")
          }}
          domain={Number.isFinite(minX) && Number.isFinite(maxX) ? [minX, maxX] : ["auto", "auto"]}
          label={{ value: "X", position: "insideBottom", offset: -5, style: { fill: "#9ca3af" } }}
        />
        <YAxis 
          domain={Number.isFinite(minY) && Number.isFinite(maxY) ? [minY, maxY] : ["auto", "auto"]} 
          stroke="#9ca3af" 
          fontSize={12} 
          tickFormatter={(value: number | string) => {
            const numValue = typeof value === "number" ? value : Number.parseFloat(String(value))
            return (numValue != null && !Number.isNaN(numValue) && Number.isFinite(numValue) ? numValue.toFixed(2) : "")
          }}
          label={{ value: "Y", angle: -90, position: "insideLeft", style: { fill: "#9ca3af" } }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#f3f4f6",
          }}
          formatter={(value: number | undefined, name: string) => {
            if (value == null || typeof value !== "number" || !Number.isFinite(value)) {
              return ["—", name || ""]
            }
            const indexStr = String(name || "").replace("y", "")
            const index = indexStr ? Number.parseInt(indexStr, 10) : -1
            if (index >= 0 && index < functions.length && functions[index]) {
              return [value.toFixed(4), functions[index].name || name || ""]
            }
            return [value.toFixed(4), name || ""]
          }}
          labelFormatter={(label: number | undefined) => {
            if (label == null || typeof label !== "number" || !Number.isFinite(label)) {
              return "x = —"
            }
            return `x = ${label.toFixed(4)}`
          }}
        />
        <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" strokeOpacity={0.5} />
        <ReferenceLine x={0} stroke="#6b7280" strokeDasharray="2 2" strokeOpacity={0.5} />
        {highlightPoint && highlightPoint.x != null && highlightPoint.y != null && (
          <>
            <ReferenceLine 
              x={highlightPoint.x} 
              stroke="#ef4444" 
              strokeDasharray="3 3" 
              strokeOpacity={0.6}
              label={{ value: `x=${typeof highlightPoint.x === "number" ? highlightPoint.x.toFixed(2) : "—"}`, position: "top" }}
            />
            <ReferenceLine 
              y={highlightPoint.y} 
              stroke="#ef4444" 
              strokeDasharray="3 3" 
              strokeOpacity={0.6}
              label={{ value: `y=${typeof highlightPoint.y === "number" ? highlightPoint.y.toFixed(2) : "—"}`, position: "right" }}
            />
          </>
        )}
        {functions.map((func, index) => (
          <Line
            key={func.id || index}
            type="linear"
            dataKey={`y${index}`}
            name={func?.name || `Функция ${index + 1}`}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={showDots ? { r: 4, fill: colors[index % colors.length] } : false}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
