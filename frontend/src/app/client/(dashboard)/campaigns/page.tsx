import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Megaphone } from "lucide-react"

export default function CampaignsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Campanhas</h2>
        <p className="text-muted-foreground">Gerencie suas campanhas de marketing ativas.</p>
      </div>
      <Card className="text-center py-12">
        <CardHeader>
            <div className="mx-auto bg-muted rounded-full p-4 mb-4 w-fit">
                <Megaphone className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>Gestão de Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground max-w-md mx-auto">
                Visualize o status, orçamento e resultados das suas campanhas de tráfego pago. Módulo em construção.
            </p>
        </CardContent>
      </Card>
    </div>
  )
}
