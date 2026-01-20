"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Search, MessageSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  createdAt: string
  message?: string
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function fetchTickets() {
      try {
        const storedUser = localStorage.getItem("agency_user")
        const token = localStorage.getItem("agency_token")
        
        if (!storedUser || !token) return

        const user = JSON.parse(storedUser)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${user.slug}/tickets`, {
          headers: { "Authorization": `Bearer ${token}` }
        })

        if (res.ok) {
          const data = await res.json()
          setTickets(data)
        }
      } catch (error) {
        console.error("Erro ao carregar tickets:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  const filteredTickets = tickets.filter(ticket => 
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Suporte e Tickets</h2>
          <p className="text-muted-foreground">Gerencie seus chamados e solicitações de suporte.</p>
        </div>
        <Button asChild>
          <Link href="/client/support/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Chamado
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por assunto ou ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
           <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
           <p>Nenhum ticket encontrado.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    {ticket.subject}
                    <Badge variant={ticket.status === 'OPEN' ? 'destructive' : 'outline'}>
                      {ticket.status === 'OPEN' ? 'Aberto' : ticket.status === 'IN_PROGRESS' ? 'Em Andamento' : 'Fechado'}
                    </Badge>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {ticket.priority}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    ID: {ticket.id} • Criado em {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/client/support/${ticket.id}`}>Ver Detalhes</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {ticket.message}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
