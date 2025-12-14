import type { Point, TabulatedFunction } from "./types"

// Linear interpolation
function interpolate(points: Point[], x: number): number {
  if (points.length === 0) return 0
  
  // Фильтруем валидные точки
  const validPoints = points.filter(
    (p) => p != null && typeof p.x === "number" && typeof p.y === "number" && 
           Number.isFinite(p.x) && Number.isFinite(p.y)
  )
  
  if (validPoints.length === 0) return 0
  if (validPoints.length === 1) return validPoints[0].y

  // Find the interval
  let i = 0
  while (i < validPoints.length - 1 && validPoints[i + 1].x < x) {
    i++
  }

  if (i >= validPoints.length - 1) {
    // Extrapolate right
    if (validPoints.length < 2) return validPoints[0].y
    const p1 = validPoints[validPoints.length - 2]
    const p2 = validPoints[validPoints.length - 1]
    const slope = (p2.y - p1.y) / (p2.x - p1.x)
    return p2.y + slope * (x - p2.x)
  }

  if (x < validPoints[0].x) {
    // Extrapolate left
    if (validPoints.length < 2) return validPoints[0].y
    const p1 = validPoints[0]
    const p2 = validPoints[1]
    const slope = (p2.y - p1.y) / (p2.x - p1.x)
    return p1.y + slope * (x - p1.x)
  }

  // Interpolate
  const p1 = validPoints[i]
  const p2 = validPoints[i + 1]
  const t = (x - p1.x) / (p2.x - p1.x)
  return p1.y + t * (p2.y - p1.y)
}

// Apply function at point
export function applyFunction(func: TabulatedFunction, x: number): number {
  if (!func || !func.points || !Array.isArray(func.points) || func.points.length === 0) {
    return 0
  }
  // гарантируем упорядоченность по X, чтобы интерполяция была корректной
  const sorted = [...func.points].sort((a, b) => a.x - b.x)
  return interpolate(sorted, x)
}

// Binary operation on two functions
function binaryOperation(
  func1: TabulatedFunction,
  func2: TabulatedFunction,
  operation: (a: number, b: number) => number,
  name: string,
): TabulatedFunction {
  if (!func1 || !func1.points || !Array.isArray(func1.points) || func1.points.length === 0) {
    throw new Error("Первая функция невалидна или не имеет точек")
  }
  if (!func2 || !func2.points || !Array.isArray(func2.points) || func2.points.length === 0) {
    throw new Error("Вторая функция невалидна или не имеет точек")
  }

  // Check that both functions have the same x values
  if (func1.points.length !== func2.points.length) {
    throw new Error("Функции должны иметь одинаковое количество точек")
  }

  const points: Point[] = []

  for (let i = 0; i < func1.points.length; i++) {
    const point1 = func1.points[i]
    if (!point1 || typeof point1.x !== "number" || typeof point1.y !== "number" || 
        !Number.isFinite(point1.x) || !Number.isFinite(point1.y)) {
      continue // Пропускаем невалидные точки
    }
    
    const x = point1.x
    const y1 = point1.y
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
    factoryType: func1.factoryType || "array",
    isInsertable: func1.isInsertable || false,
    isRemovable: func1.isRemovable || false,
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
  if (!func || !func.points || !Array.isArray(func.points)) {
    throw new Error("Функция невалидна")
  }
  
  // Фильтруем валидные точки
  const validPoints = func.points.filter(
    (p) => p != null && typeof p.x === "number" && typeof p.y === "number" && 
           Number.isFinite(p.x) && Number.isFinite(p.y)
  )
  
  if (validPoints.length < 2) {
    throw new Error("Для дифференцирования нужно минимум 2 валидные точки")
  }

  const points: Point[] = []

  for (let i = 0; i < validPoints.length; i++) {
    const x = validPoints[i].x
    let derivative: number

    if (i === 0) {
      // Forward difference
      const h = validPoints[1].x - validPoints[0].x
      if (h === 0 || !Number.isFinite(h)) continue
      derivative = (validPoints[1].y - validPoints[0].y) / h
    } else if (i === validPoints.length - 1) {
      // Backward difference
      const h = validPoints[i].x - validPoints[i - 1].x
      if (h === 0 || !Number.isFinite(h)) continue
      derivative = (validPoints[i].y - validPoints[i - 1].y) / h
    } else {
      // Central difference
      const h = validPoints[i + 1].x - validPoints[i - 1].x
      if (h === 0 || !Number.isFinite(h)) continue
      derivative = (validPoints[i + 1].y - validPoints[i - 1].y) / h
    }

    if (Number.isFinite(derivative)) {
      points.push({ x, y: derivative })
    }
  }

  return {
    name: `d(${func.name || "функция"})/dx`,
    points,
    factoryType: func.factoryType || "array",
    isInsertable: func.isInsertable || false,
    isRemovable: func.isRemovable || false,
  }
}

// Numerical integration using trapezoidal rule with parallel simulation
export function integrate(func: TabulatedFunction, threads = 4): number {
  if (!func || !func.points || !Array.isArray(func.points)) {
    throw new Error("Функция невалидна")
  }
  
  // Фильтруем валидные точки
  const validPoints = func.points.filter(
    (p) => p != null && typeof p.x === "number" && typeof p.y === "number" && 
           Number.isFinite(p.x) && Number.isFinite(p.y)
  )
  
  if (validPoints.length < 2) {
    throw new Error("Для интегрирования нужно минимум 2 валидные точки")
  }

  const n = validPoints.length - 1
  const chunkSize = Math.ceil(n / threads)
  let total = 0

  // Simulate parallel computation
  for (let t = 0; t < threads; t++) {
    const start = t * chunkSize
    const end = Math.min(start + chunkSize, n)

    let chunkSum = 0
    for (let i = start; i < end; i++) {
      const h = validPoints[i + 1].x - validPoints[i].x
      if (!Number.isFinite(h) || h === 0) continue
      const avgY = (validPoints[i].y + validPoints[i + 1].y) / 2
      if (Number.isFinite(avgY)) {
        chunkSum += h * avgY
      }
    }
    total += chunkSum
  }

  return total
}
