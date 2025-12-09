"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { SettingsProvider, useSettings } from "@/lib/settings-context"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Database, Link2 } from "lucide-react"
import { toast } from "sonner"

function SettingsContent() {
  const { user, isLoading } = useAuth()
  const { settings, setFactoryType } = useSettings()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleFactoryChange = (value: string) => {
    setFactoryType(value as "array" | "linkedList")
    toast.success(`Тип фабрики изменен на: ${value === "array" ? "Массив" : "Связный список"}`)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
          <p className="text-muted-foreground mt-2">Настройте параметры приложения</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Фабрика функций</CardTitle>
            <CardDescription>Выберите тип структуры данных для хранения табулированных функций</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={settings.factoryType} onValueChange={handleFactoryChange} className="space-y-4">
              <div className="flex items-start space-x-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <RadioGroupItem value="array" id="array" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="array" className="flex items-center gap-2 cursor-pointer">
                    <Database className="h-5 w-5 text-chart-1" />
                    <span className="font-medium">Массив (ArrayTabulatedFunction)</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Быстрый доступ по индексу, компактное хранение. Рекомендуется для большинства задач.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <RadioGroupItem value="linkedList" id="linkedList" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="linkedList" className="flex items-center gap-2 cursor-pointer">
                    <Link2 className="h-5 w-5 text-chart-2" />
                    <span className="font-medium">Связный список (LinkedListTabulatedFunction)</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Быстрая вставка и удаление элементов. Подходит для частого изменения данных.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Информация о пользователе</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1">
              <Label className="text-muted-foreground text-sm">Имя пользователя</Label>
              <p className="font-medium">{user.username}</p>
            </div>
            <div className="grid gap-1">
              <Label className="text-muted-foreground text-sm">Email</Label>
              <p className="font-medium">{user.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default function SettingsPage() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <SettingsContent />
      </SettingsProvider>
    </AuthProvider>
  )
}
