"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Phone, Calendar } from "lucide-react"

export default function ServiceContactPage() {

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Falar com Especialista</h2>
        <p className="text-muted-foreground">Entre em contato com a equipe responsável por este serviço.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Chat Online
                </CardTitle>
                <CardDescription>Converse agora com nosso suporte.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Disponível das 09:00 às 18:00</p>
            </CardContent>
            <CardFooter>
                <Button className="w-full">Iniciar Chat</Button>
            </CardFooter>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Agendar Reunião
                </CardTitle>
                <CardDescription>Marque um horário com o especialista.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Videoconferência via Google Meet</p>
            </CardContent>
            <CardFooter>
                <Button variant="outline" className="w-full">Ver Agenda</Button>
            </CardFooter>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contato Urgente
                </CardTitle>
                <CardDescription>Para situações críticas.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Ligue ou mande WhatsApp</p>
            </CardContent>
            <CardFooter>
                <Button variant="destructive" className="w-full">Ver Telefone</Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  )
}
