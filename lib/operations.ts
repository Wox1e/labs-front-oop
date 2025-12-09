import type { Point, TabulatedFunction } from "./types"

// Linear interpolation
function interpolate(points: Point[], x: number): number {
  if (points.length === 0) return 0
  if (points.length === 1) return points[0].y

  // Find the interval
  let i = 0
  while (i < points.length - 1 && points[i + 1].x < x) {
    i++
  }

  if (i >= points.length - 1) {
    // Extrapolate right
    const p1 = points[points.length - 2]
    const p2 = points[points.length - 1]
    const slope = (p2.y - p1.y) / (p2.x - p1.x)
    return p2.y + slope * (x - p2.x)
  }

  if (x < points[0].x) {
    // Extrapolate left
    const p1 = points[0]
    const p2 = points[1]
    const slope = (p2.y - p1.y) / (p2.x - p1.x)
    return p1.y + slope * (x - p1.x)
  }

  // Interpolate
  const p1 = points[i]
  const p2 = points[i + 1]
  const t = (x - p1.x) / (p2.x - p1.x)
  return p1.y + t * (p2.y - p1.y)
}

// Apply function at point
export function applyFunction(func: TabulatedFunction, x: number): number {
  return interpolate(func.points, x)
}

// Binary operation on two functions
function binaryOperation(
  func1: TabulatedFunction,
  func2: TabulatedFunction,
  operation: (a: number, b: number) => number,
  name: string,
): TabulatedFunction {
  // Check that both functions have the same x values
  if (func1.points.length !== func2.points.length) {
    throw new Error("Функции должны иметь одинаковое количество точек")
  }

  const points: Point[] = []

  for (let i = 0; i < func1.points.length; i++) {
    const x = func1.points[i].x
    const y1 = func1.points[i].y
    const y2 = interpolate(func2.points, x)
    const y = operation(y1, y2)

    if (!Number.isFinite(y)) {
      throw new Error(`Результат операции не определён в точке x = ${x.toFixed(4)}`)
    }

    points.push({ x, y })
  }

  return {
    name,
    points,
    factoryType: func1.factoryType,
    isInsertable: func1.isInsertable,
    isRemovable: func1.isRemovable,
  }
}

export function addFunctions(func1: TabulatedFunction, func2: TabulatedFunction): TabulatedFunction {
  return binaryOperation(func1, func2, (a, b) => a + b, `(${func1.name}) + (${func2.name})`)
}

export function subtractFunctions(func1: TabulatedFunction, func2: TabulatedFunction): TabulatedFunction {
  return binaryOperation(func1, func2, (a, b) => a - b, `(${func1.name}) - (${func2.name})`)
}

export function multiplyFunctions(func1: TabulatedFunction, func2: TabulatedFunction): TabulatedFunction {
  return binaryOperation(func1, func2, (a, b) => a * b, `(${func1.name}) * (${func2.name})`)
}

export function divideFunctions(func1: TabulatedFunction, func2: TabulatedFunction): TabulatedFunction {
  return binaryOperation(func1, func2, (a, b) => a / b, `(${func1.name}) / (${func2.name})`)
}

// Differentiation using finite differences
export function differentiate(func: TabulatedFunction): TabulatedFunction {
  if (func.points.length < 2) {
    throw new Error("Для дифференцирования нужно минимум 2 точки")
  }

  const points: Point[] = []

  for (let i = 0; i < func.points.length; i++) {
    const x = func.points[i].x
    let derivative: number

    if (i === 0) {
      // Forward difference
      const h = func.points[1].x - func.points[0].x
      derivative = (func.points[1].y - func.points[0].y) / h
    } else if (i === func.points.length - 1) {
      // Backward difference
      const h = func.points[i].x - func.points[i - 1].x
      derivative = (func.points[i].y - func.points[i - 1].y) / h
    } else {
      // Central difference
      const h = func.points[i + 1].x - func.points[i - 1].x
      derivative = (func.points[i + 1].y - func.points[i - 1].y) / h
    }

    points.push({ x, y: derivative })
  }

  return {
    name: `d(${func.name})/dx`,
    points,
    factoryType: func.factoryType,
    isInsertable: func.isInsertable,
    isRemovable: func.isRemovable,
  }
}

// Numerical integration using trapezoidal rule with parallel simulation
export function integrate(func: TabulatedFunction, threads = 4): number {
  if (func.points.length < 2) {
    throw new Error("Для интегрирования нужно минимум 2 точки")
  }

  const n = func.points.length - 1
  const chunkSize = Math.ceil(n / threads)
  let total = 0

  // Simulate parallel computation
  for (let t = 0; t < threads; t++) {
    const start = t * chunkSize
    const end = Math.min(start + chunkSize, n)

    let chunkSum = 0
    for (let i = start; i < end; i++) {
      const h = func.points[i + 1].x - func.points[i].x
      const avgY = (func.points[i].y + func.points[i + 1].y) / 2
      chunkSum += h * avgY
    }
    total += chunkSum
  }

  return total
}
