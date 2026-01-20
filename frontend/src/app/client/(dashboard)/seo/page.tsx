import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"

export default function SeoPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">SEO & Visibilidade</h2>
        <p className="text-muted-foreground">Monitore o posicionamento do seu site nos buscadores.</p>
      </div>
      <Card className="text-center py-12">
        <CardHeader>
            <div className="mx-auto bg-muted rounded-full p-4 mb-4 w-fit">
                <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>Painel de SEO</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground max-w-md mx-auto">
                Acompanhe palavras-chave, backlinks e saúde técnica do seu site. Dados em tempo real em breve.
            </p>
        </CardContent>
      </Card>
    </div>
  )
}
