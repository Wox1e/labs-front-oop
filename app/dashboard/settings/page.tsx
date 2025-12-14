"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { SettingsProvider, useSettings } from "@/lib/settings-context"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Settings } from "lucide-react"
import type { FactoryType, StorageMode } from "@/lib/types"

function SettingsContent() {
  const { user, isLoading } = useAuth()
  const { settings, setFactoryType, setStorageMode } = useSettings()
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Настройки
          </h1>
          <p className="text-muted-foreground mt-1">Способ хранения функций</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Способ сохранения функций</CardTitle>
            <CardDescription>Выберите, как функции будут сохраняться в базу данных</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={settings.storageMode} onValueChange={(value) => setStorageMode(value as StorageMode)}>
              <div className="flex items-center space-x-2 py-2">
                <RadioGroupItem value="pointwise" id="pointwise" />
                <Label htmlFor="pointwise" className="cursor-pointer flex-1">
                  <div className="font-medium">Поточечно</div>
                  <div className="text-sm text-muted-foreground">
                    Каждая точка сохраняется отдельно в базе данных
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 py-2">
                <RadioGroupItem value="polynomial" id="polynomial" />
                <Label htmlFor="polynomial" className="cursor-pointer flex-1">
                  <div className="font-medium">Полиномиальная аппроксимация</div>
                  <div className="text-sm text-muted-foreground">
                    Функция аппроксимируется полиномом, сохраняются только коэффициенты (компактнее)
                  </div>
                </Label>
              </div>
            </RadioGroup>
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

