"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Database, ArrowRight, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"

interface Dataset {
  id: string
  name: string
  description?: string
  _count?: {
    sources: number
    destinations: number
  }
}

export function TrackingDatasetsList() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: datasets, isLoading } = useQuery({
    queryKey: ['trackingDatasets'],
    queryFn: async () => {
      const token = localStorage.getItem("agency_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracking/datasets`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.status === 401) {
          router.push("/client/login")
          throw new Error("Sessão expirada")
      }
      if (!res.ok) throw new Error("Falha ao carregar datasets")
      return res.json()
    }
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("agency_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracking/datasets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName, description: newDescription })
      })
      if (!res.ok) throw new Error("Falha ao criar dataset")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackingDatasets'] })
      setIsCreateOpen(false)
      setNewName("")
      setNewDescription("")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("agency_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracking/datasets/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Falha ao deletar dataset")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackingDatasets'] })
    }
  })

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando conjuntos de dados...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h3 className="text-lg font-medium">Seus Conjuntos de Dados</h3>
           <p className="text-sm text-muted-foreground">Cada conjunto de dados agrupa fontes (onde o dado nasce) e destinos (para onde o dado vai).</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Conjunto de Dados
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Conjunto de Dados</DialogTitle>
              <DialogDescription>
                Dê um nome para identificar este fluxo de dados (ex: &quot;E-commerce Principal&quot;, &quot;Lançamento X&quot;).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="Ex: Lançamento Agosto" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Descrição (Opcional)</Label>
                <Textarea 
                  id="desc" 
                  value={newDescription} 
                  onChange={(e) => setNewDescription(e.target.value)} 
                  placeholder="Detalhes sobre este conjunto..." 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !newName}>
                {createMutation.isPending ? "Criando..." : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {datasets?.map((dataset: Dataset) => (
          <Card key={dataset.id} className="group hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  {dataset.name}
                </CardTitle>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                        if(confirm("Tem certeza que deseja excluir este conjunto de dados?")) {
                            deleteMutation.mutate(dataset.id)
                        }
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>{dataset.description || "Sem descrição"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-muted-foreground mb-4">
                <div className="flex flex-col">
                    <span className="font-bold text-foreground">{dataset._count?.sources || 0}</span>
                    <span>Fontes</span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="font-bold text-foreground">{dataset._count?.destinations || 0}</span>
                    <span>Destinos</span>
                </div>
              </div>
              <Button 
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground" 
                variant="secondary"
                onClick={() => router.push(`/client/tracking/${dataset.id}`)}
              >
                Gerenciar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        
        {datasets?.length === 0 && (
            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                <Database className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                <h3 className="font-semibold text-lg">Nenhum conjunto de dados</h3>
                <p className="text-muted-foreground mb-4">Crie seu primeiro conjunto para começar a rastrear eventos.</p>
                <Button onClick={() => setIsCreateOpen(true)}>Criar Agora</Button>
            </div>
        )}
      </div>
    </div>
  )
}
