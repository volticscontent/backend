"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

export default function ServicesPage() {
  const services = [
    {
      title: "Desenvolvimento Web",
      status: "Ativo",
      description: "Manutenção e desenvolvimento contínuo do website institucional.",
      features: ["Hospedagem inclusa", "Suporte 24/7", "Updates semanais"]
    },
    {
      title: "Marketing Digital",
      status: "Ativo",
      description: "Gestão de redes sociais e campanhas de tráfego pago.",
      features: ["3 Posts semanais", "Relatório mensal", "Gestão de Ads"]
    },
    {
        title: "SEO Otimização",
        status: "Pausado",
        description: "Otimização para motores de busca.",
        features: ["Análise de keywords", "Otimização On-page"]
      }
  ]

  return (
    <div className="space-y-4 p-4">
       <h2 className="text-3xl font-bold tracking-tight">Meus Serviços</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{service.title}</CardTitle>
                    <Badge variant={service.status === "Ativo" ? "default" : "secondary"}>{service.status}</Badge>
                </div>
              <CardDescription>{service.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <ul className="space-y-2">
                    {service.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-sm text-muted-foreground">
                            <Check className="mr-2 h-4 w-4 text-primary" />
                            {feature}
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter>
                <Button className="w-full" variant="outline">Ver Detalhes</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
