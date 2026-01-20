"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
    ChevronDown, ChevronUp, Users, Plus, ExternalLink, Mail, ArrowRight, 
    Calendar, Clock, AlertCircle, FileText, CheckCircle2, TrendingUp
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import Link from "next/link"

  // Definindo interfaces básicas para evitar 'any'
  interface Service {
    id: string;
    title: string;
    description: string;
    status: string;
    features?: string[];
  }

  interface TeamMember {
    id: string
    name: string
    avatar?: string
    role: string
    email?: string
  }

  interface Ticket {
      id: string
      subject: string
      message: string
      status: string
      priority: string
      createdAt: string
  }

  interface AgencyEvent {
      id: string
      title: string
      description: string
      date: string
      amount?: number
  }

  interface DashboardData {
    summary: {
      activeServices: number;
      totalServices: number;
      openTickets: number;
      pendingInvoices: number;
    };
    recentTickets: Ticket[];
    upcomingEvents: AgencyEvent[];
    services: Service[];
  }

export default function ClientServices() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [openServices, setOpenServices] = useState<Record<string, boolean>>({})

  const toggleService = (id: string) => {
    setOpenServices(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const storedUser = localStorage.getItem("agency_user")
        const token = localStorage.getItem("agency_token")
        
        if (!storedUser || !token) {
           setError("Usuário não autenticado")
           setLoading(false)
           return
        }

        const user = JSON.parse(storedUser)
        const headers = { "Authorization": `Bearer ${token}` }

        const [dashboardRes, teamRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${user.slug}/services/dashboard`, { headers }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${user.slug}/team`, { headers })
        ])

        if (!dashboardRes.ok) throw new Error("Falha ao carregar dados do dashboard")
        
        const dashData = await dashboardRes.json()
        setDashboardData(dashData)
        
        if (dashData.services && Array.isArray(dashData.services)) {
            setServices(dashData.services)
        } else {
            setServices([])
        }

        if (teamRes.ok) {
            const teamData = await teamRes.json()
            setTeam(teamData)
        }

      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground animate-pulse">Carregando seus serviços...</p>
            </div>
        </div>
      )
  }

  if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-xl font-semibold mb-2">Ops! Algo deu errado.</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
        </div>
      )
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
       {/* Header Section */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Meus Serviços
                </h2>
                <p className="text-muted-foreground mt-1">
                    Gerencie seus contratos, acompanhe métricas e solicite suporte.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Button variant="outline" asChild>
                    <Link href="/client/support">
                        <Mail className="mr-2 h-4 w-4" />
                        Fale Conosco
                    </Link>
                </Button>
                <Button asChild className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                    <Link href="/client/support/new?category=new_service">
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Serviço
                    </Link>
                </Button>
            </div>
       </div>

       {/* Summary Cards with improved visuals */}
       {dashboardData && dashboardData.summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <Card className="overflow-hidden border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Serviços Ativos</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.summary.activeServices}</div>
              <p className="text-xs text-muted-foreground mt-1">
                de {dashboardData.summary.totalServices} contratados
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tickets Abertos</CardTitle>
              <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.summary.openTickets}</div>
              <p className="text-xs text-muted-foreground mt-1">
                aguardando resposta
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Faturas Pendentes</CardTitle>
              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.summary.pendingInvoices}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ver financeiro
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Investimento Mensal</CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ --</div>
              <p className="text-xs text-muted-foreground mt-1">
                atualizado hoje
              </p>
            </CardContent>
          </Card>
        </div>
       )}

       <div className="grid gap-8 lg:grid-cols-3">
         {/* Main Content - Services List */}
         <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    Contratos Ativos
                    <Badge variant="outline" className="ml-2">{services.length}</Badge>
                </h3>
            </div>
            
            <div className="space-y-4">
                {services.length === 0 ? (
                    <Card className="p-12 text-center border-dashed">
                        <div className="flex justify-center mb-4">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                <Plus className="h-6 w-6 text-muted-foreground" />
                            </div>
                        </div>
                        <h3 className="text-lg font-medium mb-2">Nenhum serviço ativo</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                            Você ainda não possui serviços contratados. Explore nosso catálogo ou entre em contato.
                        </p>
                        <Button asChild>
                            <Link href="/client/support/new?category=new_service">Contratar Serviço</Link>
                        </Button>
                    </Card>
                ) : services.map((service, index) => {
                    const isOpen = openServices[service.id || index] || false
                    
                    return (
                        <Collapsible
                            key={service.id || index}
                            open={isOpen}
                            onOpenChange={() => toggleService(service.id || String(index))}
                            className="group"
                        >
                            <Card className="overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/50">
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                {/* Ícone dinâmico baseado no título poderia ser legal aqui */}
                                                <div className="text-lg font-bold text-primary">
                                                    {service.title.substring(0, 2).toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-lg font-semibold hover:text-primary transition-colors cursor-pointer" onClick={() => toggleService(service.id || String(index))}>
                                                        {service.title}
                                                    </h4>
                                                    <Badge variant={service.status === "ACTIVE" ? "default" : "secondary"} className="capitalize">
                                                        {service.status === "ACTIVE" ? "Ativo" : service.status === "PAUSED" ? "Pausado" : "Cancelado"}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{service.description}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" className="hidden sm:flex" asChild title="Ir para o Dashboard do Serviço">
                                                <Link href={`/client/services/${service.id}`}>
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </Button>
                                            </CollapsibleTrigger>
                                        </div>
                                    </div>

                                    {/* Quick Stats visible when collapsed */}
                                    {!isOpen && (
                                        <div className="mt-4 pt-4 border-t flex items-center gap-6 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                                Sistema Operacional
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3 w-3" />
                                                Atualizado há 2 dias
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <CollapsibleContent>
                                    <div className="bg-muted/30 px-6 pb-6 pt-2">
                                        <div className="grid md:grid-cols-3 gap-6">
                                            {/* Features List */}
                                            <div className="md:col-span-2 space-y-4">
                                                <h5 className="text-sm font-semibold flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                                    Escopo do Serviço
                                                </h5>
                                                <div className="grid sm:grid-cols-2 gap-3">
                                                    {service.features && service.features.map((feature: string, i: number) => (
                                                        <div key={i} className="flex items-center text-sm bg-background p-2 rounded border">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2 shrink-0" />
                                                            {feature}
                                                        </div>
                                                    ))}
                                                    {(!service.features || service.features.length === 0) && (
                                                        <p className="text-sm text-muted-foreground italic">Detalhes do escopo não disponíveis.</p>
                                                    )}
                                                </div>

                                                <div className="pt-4">
                                                    <h5 className="text-sm font-semibold mb-3">Acesso Rápido</h5>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/client/services/${service.id}/integrations`}>Integrações</Link>
                                                        </Button>
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/client/services/${service.id}/reports`}>Relatórios</Link>
                                                        </Button>
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/client/services/${service.id}/settings`}>Configurações</Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Team & Contact */}
                                            <div className="space-y-4">
                                                <div className="bg-background rounded-lg border p-4">
                                                    <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-primary" />
                                                        Squad Responsável
                                                    </h5>
                                                    <div className="space-y-3">
                                                        {team.length > 0 ? team.slice(0, 3).map((member, i) => (
                                                            <div key={i} className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8 border">
                                                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.email}`} />
                                                                    <AvatarFallback>{member.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 overflow-hidden">
                                                                    <p className="text-xs font-medium truncate">{member.name}</p>
                                                                    <p className="text-[10px] text-muted-foreground truncate capitalize">
                                                                        {member.role?.toLowerCase().replace('_', ' ')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <p className="text-sm text-muted-foreground">Equipe em definição.</p>
                                                        )}
                                                    </div>
                                                    <Button variant="secondary" className="w-full mt-3 text-xs" asChild>
                                                        <Link href={`/client/services/${service.id}/contact`}>
                                                            Contatar Equipe
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-end pt-4 mt-4 border-t border-dashed">
                                            <Button asChild>
                                                <Link href={`/client/services/${service.id}`}>
                                                    Acessar Painel do Serviço <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </Card>
                        </Collapsible>
                    )
                })}
            </div>
         </div>

         {/* Sidebar Content - Calendar & History */}
         <div className="space-y-6">
            {/* Calendar Widget */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Próximos Eventos
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {(dashboardData?.upcomingEvents && dashboardData.upcomingEvents.length > 0) ? (
                            dashboardData.upcomingEvents.map((event, i) => (
                                <div key={i} className="p-4 flex gap-3 hover:bg-muted/50 transition-colors">
                                    <div className="flex flex-col items-center justify-center h-12 w-12 rounded bg-muted text-center shrink-0">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase">
                                            {new Date(event.date).toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}
                                        </span>
                                        <span className="text-lg font-bold leading-none">
                                            {new Date(event.date).getDate()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{event.title}</p>
                                        <p className="text-xs text-muted-foreground">{event.description}</p>
                                        {event.amount && (
                                            <Badge variant="outline" className="mt-1 h-5 text-[10px]">
                                                R$ {event.amount}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
                                <p className="text-sm">Nenhum evento agendado.</p>
                            </div>
                        )}
                    </div>
                    {dashboardData?.upcomingEvents && dashboardData.upcomingEvents.length > 0 && (
                        <div className="p-3 bg-muted/20 text-center">
                            <Button variant="link" size="sm" className="text-xs h-auto py-1">Ver calendário completo</Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent History Widget */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Histórico
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {(dashboardData?.recentTickets && dashboardData.recentTickets.length > 0) ? (
                            dashboardData.recentTickets.map((ticket, i) => (
                                <div key={i} className="flex items-start justify-between pb-4 border-b last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{ticket.subject}</span>
                                            <Badge variant={ticket.status === 'OPEN' ? 'default' : 'secondary'} className="text-[10px] h-5 px-1.5">
                                                {ticket.status}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{ticket.message}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-muted-foreground text-sm">
                                Nenhum ticket recente.
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/client/support">Ver Todos os Tickets</Link>
                    </Button>
                </CardFooter>
            </Card>
         </div>
       </div>
    </div>
  )
}
