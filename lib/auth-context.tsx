"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { api } from "./api"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("[v0] AuthProvider mounted, checking token...")
    // Check for existing token on mount
    const token = api.getToken()
    console.log("[v0] Token found:", !!token)
    if (token) {
      // For demo, we'll create a mock user - in production, validate token with server
      setUser({ id: 1, username: api.getUsername()})
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    console.log("[v0] Login attempt:", username)
    try {
      const response = await api.login(username, password)
      api.setToken(response.token)
      setUser(response.user)
    } catch (err) {
      // Ошибка логина — не логиним пользователя, не ставим демо-токен
      throw err
    }
  }

  const register = async (username: string, password: string) => {
    console.log("[v0] Register attempt:", username)
    try {
      const response = await api.register(username, password)
      api.setToken(response.token)
      setUser(response.user)
    } catch (err) {
      // Ошибка регистрации — не логиним пользователя, не ставим демо-токен
      throw err
    }
  }

  const logout = () => {
    console.log("[v0] Logout")
    api.logout()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
