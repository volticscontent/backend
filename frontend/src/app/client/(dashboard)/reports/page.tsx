import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
        <p className="text-muted-foreground">Acompanhe o desempenho e métricas dos seus serviços.</p>
      </div>
      <Card className="text-center py-12">
        <CardHeader>
            <div className="mx-auto bg-muted rounded-full p-4 mb-4 w-fit">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>Relatórios em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground max-w-md mx-auto">
                Estamos preparando dashboards detalhados para você acompanhar cada métrica do seu negócio. Em breve disponível.
            </p>
        </CardContent>
      </Card>
    </div>
  )
}
