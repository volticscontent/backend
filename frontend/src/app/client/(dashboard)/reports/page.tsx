"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  { name: "Jan", total: 1200 },
  { name: "Fev", total: 2100 },
  { name: "Mar", total: 1800 },
  { name: "Abr", total: 2400 },
  { name: "Mai", total: 3200 },
  { name: "Jun", total: 3800 },
]

export default function ReportsPage() {
  return (
    <div className="space-y-4 p-4">
       <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
            <CardHeader>
            <CardTitle>Visitas ao Site</CardTitle>
            <CardDescription>Performance mensal do seu website.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
            <div className="h-[300px] w-full">
                {/* Placeholder para gráfico real - Recharts precisa de configuração extra no Next.js as vezes, 
                    mas vamos simular um container visual */}
                 <div className="flex h-full items-end justify-around gap-2 p-4 border-b">
                    {data.map((item) => (
                        <div key={item.name} className="flex flex-col items-center gap-2 group cursor-pointer">
                            <div 
                                className="w-12 bg-primary rounded-t-md transition-all hover:bg-primary/80 relative"
                                style={{ height: `${(item.total / 4000) * 100}%` }}
                            >
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.total}
                                </span>
                            </div>
                            <span className="text-sm text-muted-foreground font-medium">{item.name}</span>
                        </div>
                    ))}
                 </div>
            </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
