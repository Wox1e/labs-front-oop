import type { TabulatedFunction } from "@/lib/types"

export interface FunctionCardProps {
  func: TabulatedFunction
  selected?: boolean
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onExport?: () => void
  onViewGraph?: () => void
}
