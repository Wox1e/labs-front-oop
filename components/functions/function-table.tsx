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
  // Для надёжного редактирования дробных/отрицательных чисел используем local input state
  const [inputValues, setInputValues] = React.useState(() =>
    points.map((pt) => ({ x: pt.x.toString(), y: pt.y.toString() }))
  );

  React.useEffect(() => {
    setInputValues(points.map((pt) => ({ x: pt.x.toString(), y: pt.y.toString() })))
  }, [points]);

  const handleChange = (index: number, field: "x" | "y", e: React.ChangeEvent<HTMLInputElement>) => {
    const newValues = [...inputValues];
    newValues[index] = { ...newValues[index], [field]: e.target.value };
    setInputValues(newValues);
  }
  const handleBlur = (index: number, field: "x" | "y") => {
    if (!onPointChange) return;
    const str = inputValues[index][field];
    // accept empty or just '-' or '.' as "no change"
    if (str.trim() === '' || str === '-' || str === '.' || str === '-.') return;
    const value = Number.parseFloat(str);
    if (!Number.isNaN(value)) {
      onPointChange(index, field, value);
    } else {
      // reset to last valid if broke
      setInputValues((prev) => {
        const copy = [...prev];
        copy[index][field] = points[index][field].toString();
        return copy;
      });
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden" role="table" aria-label="Таблица точек функции">
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
                        type="text"
                        inputMode="decimal"
                        value={inputValues[index]?.x ?? ''}
                        onChange={(e) => handleChange(index, "x", e)}
                        onBlur={() => handleBlur(index, "x")}
                        className="w-full text-center bg-input/50"
                        autoCorrect="off"
                        autoComplete="off"
                        spellCheck={false}
                        pattern="^-?\\d*[\\.,]?\\d*$"
                      />
                    ) : (
                      <div className="text-center font-mono">{point.x.toFixed(4)}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editable ? (
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={inputValues[index]?.y ?? ''}
                        onChange={(e) => handleChange(index, "y", e)}
                        onBlur={() => handleBlur(index, "y")}
                        className="w-full text-center bg-input/50"
                        autoCorrect="off"
                        autoComplete="off"
                        spellCheck={false}
                        pattern="^-?\\d*[\\.,]?\\d*$"
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
      <Input type="text" name="x" inputMode="decimal" pattern="^-?\\d*[\\.,]?\\d*$" placeholder="X" className="w-24 bg-input/50" autoCorrect="off" autoComplete="off" spellCheck={false} required />
      <Input type="text" name="y" inputMode="decimal" pattern="^-?\\d*[\\.,]?\\d*$" placeholder="Y" className="w-24 bg-input/50" autoCorrect="off" autoComplete="off" spellCheck={false} required />
      <Button type="submit" size="sm" variant="outline">
        <Plus className="h-4 w-4 mr-1" />
        Добавить
      </Button>
    </form>
  )
}
