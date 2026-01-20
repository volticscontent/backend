"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, LifeBuoy, CreditCard, Activity } from "lucide-react"
import Link from "next/link"

  interface DashboardUser {
    slug: string
    name: string
    email: string
  }

  interface DashboardStats {
    activeServices: number
    pendingInvoicesAmount: number
    openTickets: number
  }

  interface DashboardActivity {
    description: string
    date: string
    amount?: number
  }

  interface DashboardResponse {
    stats: DashboardStats
    recentActivity: DashboardActivity[]
  }

export default function ClientDashboard() {
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem("agency_user")
    if (storedUser && storedUser !== "undefined") {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        fetchDashboardData(parsedUser.slug)
      } catch (e) {
        console.error("Erro ao fazer parse do usuário:", e)
        localStorage.removeItem("agency_user")
      }
    } else if (storedUser === "undefined") {
      localStorage.removeItem("agency_user")
    }
  }, [])

  async function fetchDashboardData(slug: string) {
    try {
      const token = localStorage.getItem("agency_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${slug}/dashboard`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (res.ok) {
        const dashboardData = await res.json()
        setData(dashboardData)
      }
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Carregando painel...</div>
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between p-4 rounded-lg">
        <h2 className="text-3xl font-bold tracking-tight">Painel do Cliente</h2>
        <div className="flex items-center space-x-2">
            <Button asChild>
                <Link href="/client/support/new">Novo Ticket</Link>
            </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.activeServices || 0}</div>
            <p className="text-xs text-muted-foreground">
              Serviços contratados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturas Pendentes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.stats?.pendingInvoicesAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total a pagar
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Abertos</CardTitle>
            <LifeBuoy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.openTickets || 0}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando resposta
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatórios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Novos disponíveis
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
            <CardDescription>
                Bem-vindo, {user?.name || "Cliente"}. Este é o resumo da sua conta {user?.slug && `(${user.slug})`}.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-md m-4">
                Gráfico de Performance (Em breve)
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Últimas interações na sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.recentActivity && data.recentActivity.length > 0 ? (
                data.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{activity.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {activity.amount && (
                      <div className="ml-auto font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activity.amount)}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center">Nenhuma atividade recente.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
