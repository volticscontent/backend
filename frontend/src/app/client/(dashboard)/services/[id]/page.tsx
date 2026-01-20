"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ServiceDetailsPage() {
  const params = useParams()
  const serviceId = params.id

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Detalhes do Serviço</h2>
        <p className="text-muted-foreground">ID do Serviço: {serviceId}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Informações detalhadas sobre este serviço serão exibidas aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
