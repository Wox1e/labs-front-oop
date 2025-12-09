"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, LogIn } from "lucide-react"

interface LoginFormProps {
  onSwitchToRegister: () => void
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { login } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password.trim()) {
      toast.error("Заполните все поля")
      return
    }

    setIsLoading(true)
    try {
      await login(username, password)
      toast.success("Вход выполнен успешно")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка входа")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">ƒ</span>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Вход в FuncLab</CardTitle>
        <CardDescription>Введите ваши данные для входа в систему</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Имя пользователя</Label>
            <Input
              id="username"
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="bg-input/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="bg-input/50"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Вход...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Войти
              </>
            )}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Нет аккаунта?{" "}
          <button type="button" onClick={onSwitchToRegister} className="text-primary hover:underline">
            Зарегистрироваться
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
