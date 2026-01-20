"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Megaphone } from "lucide-react"

export default function ServiceCampaignsPage() {

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Campanhas</h2>
        <p className="text-muted-foreground">Gerencie as campanhas vinculadas a este serviço.</p>
      </div>
      <Card className="text-center py-12">
        <CardHeader>
            <div className="mx-auto bg-muted rounded-full p-4 mb-4 w-fit">
                <Megaphone className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>Campanhas Ativas</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground max-w-md mx-auto">
                Visualize métricas e status das campanhas deste serviço.
            </p>
        </CardContent>
      </Card>
    </div>
  )
}
