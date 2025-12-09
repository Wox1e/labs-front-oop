"use client"

import type React from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2, Plus } from "lucide-react"
import type { Point } from "@/lib/types"

interface FunctionTableProps {
  points: Point[]
  onPointChange?: (index: number, field: "x" | "y", value: number) => void
  onDeletePoint?: (index: number) => void
  onInsertPoint?: (x: number, y: number) => void
  editable?: boolean
  editableX?: boolean
  showInsert?: boolean
  showDelete?: boolean
  maxHeight?: string
}

export function FunctionTable({
  points,
  onPointChange,
  onDeletePoint,
  onInsertPoint,
  editable = false,
  editableX = false,
  showInsert = false,
  showDelete = false,
  maxHeight = "400px",
}: FunctionTableProps) {
  const handleChange = (index: number, field: "x" | "y", e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!Number.isNaN(value) && onPointChange) {
      onPointChange(index, field, value)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-auto" style={{ maxHeight }}>
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="w-16 text-center">#</TableHead>
              <TableHead className="text-center">X</TableHead>
              <TableHead className="text-center">Y</TableHead>
              {(showDelete || showInsert) && <TableHead className="w-20 text-center">Действия</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {points.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showDelete || showInsert ? 4 : 3}
                  className="text-center text-muted-foreground py-8"
                >
                  Нет точек
                </TableCell>
              </TableRow>
            ) : (
              points.map((point, index) => (
                <TableRow key={index}>
                  <TableCell className="text-center text-muted-foreground font-mono text-sm">{index}</TableCell>
                  <TableCell>
                    {editableX && editable ? (
                      <Input
                        type="number"
                        step="any"
                        value={point.x}
                        onChange={(e) => handleChange(index, "x", e)}
                        className="w-full text-center bg-input/50"
                      />
                    ) : (
                      <div className="text-center font-mono">{point.x.toFixed(4)}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editable ? (
                      <Input
                        type="number"
                        step="any"
                        value={point.y}
                        onChange={(e) => handleChange(index, "y", e)}
                        className="w-full text-center bg-input/50"
                      />
                    ) : (
                      <div className="text-center font-mono">{point.y.toFixed(4)}</div>
                    )}
                  </TableCell>
                  {(showDelete || showInsert) && (
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {showDelete && onDeletePoint && (
                          <Button variant="ghost" size="icon" onClick={() => onDeletePoint(index)} className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {showInsert && onInsertPoint && (
        <div className="border-t p-3 bg-muted/30">
          <InsertPointForm onInsert={onInsertPoint} />
        </div>
      )}
    </div>
  )
}

function InsertPointForm({ onInsert }: { onInsert: (x: number, y: number) => void }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const x = Number.parseFloat(formData.get("x") as string)
    const y = Number.parseFloat(formData.get("y") as string)
    if (!Number.isNaN(x) && !Number.isNaN(y)) {
      onInsert(x, y)
      e.currentTarget.reset()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input type="number" step="any" name="x" placeholder="X" className="w-24 bg-input/50" required />
      <Input type="number" step="any" name="y" placeholder="Y" className="w-24 bg-input/50" required />
      <Button type="submit" size="sm" variant="outline">
        <Plus className="h-4 w-4 mr-1" />
        Добавить
      </Button>
    </form>
  )
}
