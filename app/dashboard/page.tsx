"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, LineChart, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"

const features = [
  {
    title: "Создание функций",
    description: "Создайте функцию из массивов X/Y или из математической функции",
    icon: PlusCircle,
    href: "/dashboard/create",
    color: "text-chart-1",
  },
  {
    title: "Графики",
    description: "Визуализация функций и вычисление значений",
    icon: LineChart,
    href: "/dashboard/graphs",
    color: "text-chart-4",
  },
]

function DashboardContent() {
  const { user, isLoading } = useAuth()
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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Добро пожаловать, {user.username}!</h1>
          <p className="text-muted-foreground mt-2">Выберите действие для работы с табулированными функциями</p>
        </div>

        {/* Quick actions grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="group hover:border-primary/50 transition-colors cursor-pointer">
              <Link href={feature.href}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Link>
            </Card>
          ))}
        </div>

      </div>
    </DashboardLayout>
  )
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  )
}
