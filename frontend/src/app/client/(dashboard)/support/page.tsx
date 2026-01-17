"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export default function SupportPage() {
  const tickets = [
    {
      id: "TKT-1023",
      subject: "Problema no formulário de contato",
      date: "2024-01-16",
      status: "Aberto",
      priority: "Alta"
    },
    {
      id: "TKT-1022",
      subject: "Dúvida sobre relatório",
      date: "2024-01-10",
      status: "Fechado",
      priority: "Baixa"
    }
  ]

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
         <h2 className="text-3xl font-bold tracking-tight">Suporte</h2>
         <Button>Novo Ticket</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Meus Tickets</CardTitle>
          <CardDescription>Acompanhe o status das suas solicitações.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.id}</TableCell>
                  <TableCell>{ticket.subject}</TableCell>
                  <TableCell>{ticket.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ticket.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ticket.status === "Fechado" ? "secondary" : "default"}>
                      {ticket.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
