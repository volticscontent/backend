"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"

export default function ServiceSettingsPage() {
  
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações do Serviço</h2>
        <p className="text-muted-foreground">Ajuste as preferências deste serviço.</p>
      </div>
      <Card className="text-center py-12">
        <CardHeader>
            <div className="mx-auto bg-muted rounded-full p-4 mb-4 w-fit">
                <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>Configurações Gerais</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground max-w-md mx-auto">
                Opções de personalização e ajustes técnicos.
            </p>
        </CardContent>
      </Card>
    </div>
  )
}
