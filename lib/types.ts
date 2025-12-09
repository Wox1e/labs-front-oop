// Types for the application

export interface Point {
  x: number
  y: number
}

export interface TabulatedFunction {
  id?: string
  name: string
  points: Point[]
  factoryType: "array" | "linkedList"
  isInsertable?: boolean
  isRemovable?: boolean
}

export interface MathFunction {
  name: string
  localizedName: string
  priority: number
}

export interface User {
  id: number
  username: string
  email: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface CreateFromArrayRequest {
  name: string
  xValues: number[]
  yValues: number[]
}

export interface CreateFromMathFunctionRequest {
  name: string
  mathFunctionName: string
  from: number
  to: number
  pointsCount: number
}

export interface OperationRequest {
  firstFunctionId: number
  secondFunctionId: number
}

export interface ApiError {
  message: string
  status: number
}

export type FactoryType = "array" | "linkedList"

export interface AppSettings {
  factoryType: FactoryType
}
