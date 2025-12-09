"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import type { TabulatedFunction } from "@/lib/types"

interface FunctionGraphProps {
  functions: TabulatedFunction[]
  height?: number
  showGrid?: boolean
  showDots?: boolean
}

const colors = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#eab308", // yellow
  "#a855f7", // purple
  "#f97316", // orange
]

export function FunctionGraph({ functions, height = 400, showGrid = true, showDots = true }: FunctionGraphProps) {
  const chartData = useMemo(() => {
    if (functions.length === 0) return []

    const allX = new Set<number>()
    for (const func of functions) {
      for (const point of func.points) {
        allX.add(point.x)
      }
    }

    const sortedX = Array.from(allX).sort((a, b) => a - b)

    return sortedX.map((x) => {
      const dataPoint: Record<string, number> = { x }
      for (let i = 0; i < functions.length; i++) {
        const func = functions[i]
        const point = func.points.find((p) => p.x === x)
        if (point) {
          dataPoint[`y${i}`] = point.y
        }
      }
      return dataPoint
    })
  }, [functions])

  const { minY, maxY } = useMemo(() => {
    if (functions.length === 0) return { minY: -1, maxY: 1 }
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    for (const func of functions) {
      for (const point of func.points) {
        min = Math.min(min, point.y)
        max = Math.max(max, point.y)
      }
    }
    const padding = (max - min) * 0.1 || 1
    return { minY: min - padding, maxY: max + padding }
  }, [functions])

  if (functions.length === 0) {
    return (
      <div
        className="flex items-center justify-center border rounded-lg border-dashed text-muted-foreground"
        style={{ height }}
      >
        Нет функций для отображения
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
        <XAxis dataKey="x" stroke="#9ca3af" fontSize={12} tickFormatter={(value) => value.toFixed(2)} />
        <YAxis domain={[minY, maxY]} stroke="#9ca3af" fontSize={12} tickFormatter={(value) => value.toFixed(2)} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#f3f4f6",
          }}
          formatter={(value: number, name: string) => {
            const index = Number.parseInt(name.replace("y", ""))
            return [value.toFixed(4), functions[index]?.name || name]
          }}
          labelFormatter={(label: number) => `x = ${label.toFixed(4)}`}
        />
        <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
        {functions.map((func, index) => (
          <Line
            key={func.id || index}
            type="linear"
            dataKey={`y${index}`}
            name={func.name}
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
