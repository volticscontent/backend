"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

  interface Invoice {
    id: string
    amount: number
    status: string
    dueDate: string
    description: string
    service?: {
      title: string
    }
  }

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const storedUser = localStorage.getItem("agency_user")
        const token = localStorage.getItem("agency_token")
        
        if (!storedUser || !token) return

        const user = JSON.parse(storedUser)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${user.slug}/invoices`, {
          headers: { "Authorization": `Bearer ${token}` }
        })

        if (res.ok) {
          const data = await res.json()
          setInvoices(data)
        }
      } catch (error) {
        console.error("Erro ao carregar faturas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-500 hover:bg-green-600">Pago</Badge>
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pendente</Badge>
      case 'OVERDUE':
        return <Badge variant="destructive">Vencido</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Faturas</h2>
        <p className="text-muted-foreground">Visualize e gerencie suas faturas e pagamentos.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    invoices.filter(i => i.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0)
                )}
            </div>
            <p className="text-xs text-muted-foreground">no período atual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    invoices.filter(i => i.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0)
                )}
            </div>
            <p className="text-xs text-muted-foreground">aguardando pagamento</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vencido</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        invoices.filter(i => i.status === 'OVERDUE').reduce((acc, curr) => acc + curr.amount, 0)
                    )}
                </div>
                <p className="text-xs text-muted-foreground">faturas atrasadas</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Histórico de Faturas</CardTitle>
            <CardDescription>Todas as faturas geradas para sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                 <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                 </div>
            ) : invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Nenhuma fatura encontrada.</p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Serviço / Descrição</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{invoice.service?.title || 'Serviço Avulso'}</div>
                                    <div className="text-xs text-muted-foreground">ID: {invoice.id.substring(0, 8)}</div>
                                </TableCell>
                                <TableCell>{new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                                <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" title="Baixar PDF">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
