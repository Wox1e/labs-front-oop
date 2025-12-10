// API client for backend communication - updated for Java backend

import { TabulatedFunction } from "./types"


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

console.log("[v0] API_BASE_URL:", API_BASE_URL)

class ApiClient {
  private token: string | null = null
  private username: string | null = null

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("auth_token", token)
      } else {
        localStorage.removeItem("auth_token")
      }
    }
  }

  setUsername(username: string | null) {
    this.username = username
    if (typeof window !== "undefined") {
      if (username) {
        localStorage.setItem("username", username)
      } else {
        localStorage.removeItem("username")
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
    return this.token
  }

  getUsername(): string | null {
    if (this.username) return this.username
    if (typeof window !== "undefined") {
      this.username = localStorage.getItem("username")
    }
    return this.username
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken()
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-API-KEY": "my-secret-key",
      ...options.headers,
    }

    if (token) {
      headers["Authorization"] = `Basic ${token}`
    }

    console.log("[v0] API Request:", `${API_BASE_URL}${endpoint}`, options.method || "GET")

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    console.log("[v0] API Response status:", response.status)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Произошла ошибка" }))
      console.log("[v0] API Error:", error)
      throw new Error(error.message || `HTTP Error: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] API Response data:", data)
    return data
  }

  // Auth endpoints - соответствует UsersController
  async login(username: string, password: string) {
    // Новый: POST /users/login
    const result = await this.request<{
      status: string
      user?: { id: string; username: string }
      message?: string
    }>(`/users/login`, {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    if (result.status !== "success" || !result.user) {
      throw new Error(result.message || "Ошибка логина");
    }
    // Токен может быть простой basic, или заменить это на токен, если реализуешь
    const token = btoa(`${username}:${password}`);
    this.setToken(token);
    this.setUsername(username);
    return {
      token,
      user: result.user,
    };
  }

  async register(username: string, email: string, password: string) {
    const result = await this.request<{
      status: string
      created: boolean
      id: string
    }>("/users/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })

    if (!result.created) {
      window.alert("Пользователь с таким именем уже существует!")
      throw new Error("Пользователь уже существует")
    }

    // Автоматически логиним после регистрации
    const token = btoa(`${username}:${password}`)
    this.setToken(token)
    this.setUsername(username)

    return {
      token,
      user: {
        id: result.id,
        username,
      },
    }
  }

  async logout() {
    this.setToken(null)
    this.setUsername(null)
  }

  async getFunctions(type?: string, name?: string) {
    const params = new URLSearchParams()
    if (type) params.append("type", type)
    if (name) params.append("name", name)
    const queryString = params.toString()
  
    const result = await this.request<{
      status: string
      found: boolean
      data: any[]
      count: number
    }>(`/functions/${queryString ? `?${queryString}` : ""}`)
  
    // Используем map и Promise.all для параллельной загрузки точек
    const functionsList: TabulatedFunction[] = await Promise.all(
      result.data.map(async (func) => {
        const rawPoints = await this.getPoints(func.id)
        
        const points = rawPoints.map(p => ({
          x: p.x_value,  // переименовываем
          y: p.y_value
        }))

        return {
          id: func.id,
          name: func.name,
          points: points,
          factoryType: func.type || "array", // Предполагаем, что в func есть тип
          isInsertable: (func.type || "array") === "linkedList",
          isRemovable: (func.type || "array") === "linkedList"
        }
      })
    )
  
    return functionsList
  }


  async getFunction(id: string) {
    const result = await this.request<{
      status: string
      found: boolean
      data: any
    }>(`/functions/${id}`)

    if (!result.found) {
      throw new Error("Функция не найдена")
    }

    return result.data
  }

  async createFunction(func: TabulatedFunction) {
    const result = await this.request<{
      status: string
      created: boolean
      id: string
    }>("/functions/", {
      method: "POST",
      body: JSON.stringify({ name:func.name, type:func.factoryType }),
    })

      func.points.map(async (point_pair) => {        
        await this.request<{
          status: string
          created: boolean
          id: string
        }>("/points/", {
          method: "POST",
          body: JSON.stringify({ function_id:result.id, x_value:point_pair.x, y_value:point_pair.y }),
        })
      })


    return result
  }

  // Points endpoints - соответствует PointsController
  async getPoints(functionId?: string, x_value?: number, y_value?: number) {
    const params = new URLSearchParams()
    if (functionId) params.append("functionId", functionId)
    if (x_value !== undefined) params.append("x_value", x_value.toString())
    if (y_value !== undefined) params.append("y_value", y_value.toString())
    const queryString = params.toString()

    const result = await this.request<{
      status: string
      found: boolean
      data: any[]
      count: number
    }>(`/points/${queryString ? `?${queryString}` : ""}`)

    return result.data || []
  }

  async createPoint(functionId: string, x: number, y: number) {
    const result = await this.request<{
      status: string
      created: boolean
      id: string
    }>("/points/", {
      method: "POST",
      body: JSON.stringify({ function_id: functionId, x_value: x, y_value: y }),
    })

    return result
  }

  // Методы для работы с функциями (создание из массивов и мат. функций)
  // Эти эндпоинты должны быть реализованы на бэкенде
  async createFromArray(func: TabulatedFunction) {
    // Убеждаемся что name и points есть
    if (!func.name || !func.points) {
      throw new Error("Некорректные данные функции")
    }
    
    // Создаем функцию и получаем ID от сервера
    const funcResult = await this.createFunction(func)
    
    // Возвращаем созданную функцию с ID
    return {
      id: funcResult.id,
      name: func.name,
      points: func.points,
      factoryType: func.factoryType,
      isInsertable: func.factoryType === "linkedList",
      isRemovable: func.factoryType === "linkedList"
    }
  }

  async createFromMathFunction(
    name: string,
    mathFunctionName: string,
    from: number,
    to: number,
    pointsCount: number,
    factoryType: "array" | "linkedList",
  ) {
    // Генерируем точки на клиенте
    const step = (to - from) / (pointsCount - 1)
    const points = []
  
    for (let i = 0; i < pointsCount; i++) {
      const x = from + i * step
      const y = this.evaluateMathFunction(mathFunctionName, x)
      points.push({ x, y }) // Создаем объект точки и добавляем в массив
    }
  
    // Создаем объект TabulatedFunction
    const tabulatedFunc: TabulatedFunction = {
      name: name,
      points: points, // Используем созданный массив точек
      factoryType: factoryType,
      isInsertable: factoryType === "linkedList",
      isRemovable: factoryType === "linkedList"
    }
    
    return this.createFromArray(tabulatedFunc)
  }

  private evaluateMathFunction(funcName: string, x: number): number {
    switch (funcName.toLowerCase()) {
      case "sin":
        return Math.sin(x)
      case "cos":
        return Math.cos(x)
      case "tan":
        return Math.tan(x)
      case "sqr":
        return x * x
      case "sqrt":
        return Math.sqrt(x)
      case "exp":
        return Math.exp(x)
      case "ln":
        return Math.log(x)
      case "log10":
        return Math.log10(x)
      case "identity":
        return x
      case "zero":
        return 0
      case "unit":
        return 1
      default:
        return x
    }
  }

  // Вспомогательные методы для операций
  async applyFunction(id: string, x: number) {
    // Получаем функцию и интерполируем
    const func = await this.getFunction(id)
    const points = await this.getPoints(id)

    // Линейная интерполяция
    const sortedPoints = points.sort((a: any, b: any) => a.x_value - b.x_value)

    for (let i = 0; i < sortedPoints.length - 1; i++) {
      if (x >= sortedPoints[i].x_value && x <= sortedPoints[i + 1].x_value) {
        const x0 = sortedPoints[i].x_value
        const y0 = sortedPoints[i].y_value
        const x1 = sortedPoints[i + 1].x_value
        const y1 = sortedPoints[i + 1].y_value
        return { result: y0 + ((y1 - y0) * (x - x0)) / (x1 - x0) }
      }
    }

    throw new Error("x вне диапазона функции")
  }

  // Math functions list
  async getMathFunctions() {
    return [
      { name: "sin", localizedName: "Синус", priority: 1 },
      { name: "cos", localizedName: "Косинус", priority: 2 },
      { name: "tan", localizedName: "Тангенс", priority: 3 },
      { name: "sqr", localizedName: "Квадрат", priority: 4 },
      { name: "sqrt", localizedName: "Корень", priority: 5 },
      { name: "exp", localizedName: "Экспонента", priority: 6 },
      { name: "ln", localizedName: "Натуральный логарифм", priority: 7 },
      { name: "log10", localizedName: "Десятичный логарифм", priority: 8 },
      { name: "identity", localizedName: "Тождественная", priority: 9 },
      { name: "zero", localizedName: "Нулевая", priority: 10 },
      { name: "unit", localizedName: "Единичная", priority: 11 },
    ]
  }

  async deleteFunction(id: string) {
    // Если бэкенд поддерживает удаление
    return this.request<void>(`/functions/${id}`, {
      method: "DELETE",
    })
  }

  async updateFunction(id: string, data: any) {
    return this.request<any>(`/functions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async insertPoint(id: string, x: number, y: number) {
    return this.createPoint(id, x, y)
  }

  async removePoint(functionId: string, pointId: string) {
    return this.request<void>(`/points/${pointId}`, {
      method: "DELETE",
    })
  }
}

export const api = new ApiClient()
