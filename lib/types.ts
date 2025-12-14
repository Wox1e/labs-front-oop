// Types for the application

export interface Point {
  x: number
  y: number
}

export interface TabulatedFunction {
  id?: string
  name: string
  points: Point[]
  isInsertable?: boolean
  isRemovable?: boolean
}

export interface MathFunction {
  name: string
  localizedName: string
  priority: number
}

export interface User {
  id: string
  username: string
  email?: string
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
  firstFunctionId: string
  secondFunctionId: string
}

export interface ApiError {
  message: string
  status: number
}

export type StorageMode = "pointwise" | "polynomial"

export interface AppSettings {
  storageMode: StorageMode
}
