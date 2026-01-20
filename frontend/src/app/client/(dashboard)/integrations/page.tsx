import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plug } from "lucide-react"

export default function IntegrationsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Integrações</h2>
        <p className="text-muted-foreground">Conecte suas ferramentas de marketing e vendas.</p>
      </div>
      <Card className="text-center py-12">
        <CardHeader>
            <div className="mx-auto bg-muted rounded-full p-4 mb-4 w-fit">
                <Plug className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>Área de Integrações</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground max-w-md mx-auto">
                Configure aqui as conexões com CRM, Email Marketing e outras ferramentas. Esta funcionalidade será habilitada em breve.
            </p>
        </CardContent>
      </Card>
    </div>
  )
}
