"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Copy, Check, Activity, BarChart3, Database, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

const marketingFormSchema = z.object({
  metaPixelId: z.string().min(1, {
    message: "Pixel ID é obrigatório.",
  }),
  metaApiToken: z.string().min(1, {
    message: "Token da API é obrigatório.",
  }),
})

export function MarketingSettingsForm() {
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch current settings
  const { data: settings } = useQuery({
    queryKey: ['marketingSettings'],
    queryFn: async () => {
      const token = localStorage.getItem("agency_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketing/settings`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error("Falha ao carregar configurações")
      return res.json()
    }
  })

  const form = useForm<z.infer<typeof marketingFormSchema>>({
    resolver: zodResolver(marketingFormSchema),
    defaultValues: {
      metaPixelId: "",
      metaApiToken: "",
    },
  })

  useEffect(() => {
    if (settings) {
      form.reset({
        metaPixelId: settings.metaPixelId || "",
        metaApiToken: settings.metaApiToken || "",
      })
    }
  }, [settings, form])

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof marketingFormSchema>) => {
      const token = localStorage.getItem("agency_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketing/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(values),
      })
      
      if (!res.ok) throw new Error("Falha ao salvar configurações")
      return res.json()
    },
    onSuccess: () => {
      alert("Configurações salvas com sucesso!")
      queryClient.invalidateQueries({ queryKey: ['marketingSettings'] })
    },
    onError: (error) => {
      alert(`Erro: ${error.message}`)
    }
  })

  const testEventMutation = useMutation({
    mutationFn: async () => {
      if (!settings?.userId) throw new Error("ID do usuário não encontrado")
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketing/events/${settings.userId}?sync=true`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              eventName: "TestEvent",
              eventData: { source: "dashboard_test", value: 1.00, currency: "BRL" },
              url: window.location.href,
              userAgent: navigator.userAgent,
              timestamp: Math.floor(Date.now() / 1000)
          })
      })
      
      if (!res.ok) {
          const err = await res.json()
          throw new Error(err.details || "Falha ao enviar evento")
      }
      return res.json()
    },
    onSuccess: () => {
      alert("Evento de teste enviado com sucesso para a API de Conversões!")
    },
    onError: (error) => {
      alert(`Erro no teste: ${error.message}`)
    }
  })

  function onSubmit(values: z.infer<typeof marketingFormSchema>) {
    mutation.mutate(values)
  }

  const scriptCode = settings?.userId 
    ? `<script src="${process.env.NEXT_PUBLIC_API_URL}/api/marketing/pixel.js/${settings.userId}"></script>`
    : "Carregando..."

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const hasConfig = !!settings?.metaPixelId;

  return (
    <div className="space-y-6">
      {/* Header with list of datasets (simulated) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Sidebar / List of Sources */}
         <div className="md:col-span-1 space-y-4">
            <Card className="h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Fontes de Dados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-2">
                    <div className="flex items-center gap-3 p-3 rounded-md bg-accent text-accent-foreground cursor-pointer">
                        <Database className="h-5 w-5 text-blue-500" />
                        <div className="flex-1 overflow-hidden">
                            <p className="font-medium truncate">Meta Pixel do Cliente</p>
                            <p className="text-xs text-muted-foreground truncate">
                                {settings?.metaPixelId ? `ID: ${settings.metaPixelId}` : "Não configurado"}
                            </p>
                        </div>
                        {hasConfig ? (
                            <div className="h-2 w-2 rounded-full bg-green-500" title="Ativo" />
                        ) : (
                            <div className="h-2 w-2 rounded-full bg-slate-300" title="Inativo" />
                        )}
                    </div>
                    {/* Placeholder for future sources */}
                    {/* <div className="flex items-center gap-3 p-3 rounded-md hover:bg-muted cursor-not-allowed opacity-50">
                        <Activity className="h-5 w-5" />
                        <div className="flex-1">
                            <p className="font-medium">Offline Events</p>
                        </div>
                    </div> */}
                </CardContent>
            </Card>
         </div>

         {/* Main Content Area */}
         <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="settings">Configurações</TabsTrigger>
                    <TabsTrigger value="test-events">Eventos de Teste</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>Visão Geral</CardTitle>
                                    <CardDescription>Atividade recente do Pixel e API de Conversões.</CardDescription>
                                </div>
                                {hasConfig && <Badge variant="default" className="bg-green-600">Ativo</Badge>}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!hasConfig ? (
                                <div className="text-center py-10 space-y-4">
                                    <div className="mx-auto bg-muted rounded-full p-4 w-fit">
                                        <BarChart3 className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Nenhuma fonte de dados conectada</h3>
                                        <p className="text-muted-foreground">Conecte seu Pixel do Meta para começar a receber eventos.</p>
                                    </div>
                                    <Button onClick={() => setActiveTab("settings")}>Conectar Fonte de Dados</Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="border rounded-md p-4 text-center">
                                            <p className="text-xs text-muted-foreground uppercase font-bold">Eventos Totais</p>
                                            <p className="text-2xl font-bold mt-2">0</p>
                                            <p className="text-xs text-muted-foreground mt-1">Últimos 7 dias</p>
                                        </div>
                                        <div className="border rounded-md p-4 text-center">
                                            <p className="text-xs text-muted-foreground uppercase font-bold">Correspondência</p>
                                            <p className="text-2xl font-bold mt-2">-</p>
                                            <p className="text-xs text-muted-foreground mt-1">Qualidade Média</p>
                                        </div>
                                        <div className="border rounded-md p-4 text-center">
                                            <p className="text-xs text-muted-foreground uppercase font-bold">Status da API</p>
                                            <p className="text-2xl font-bold mt-2 text-green-600">OK</p>
                                            <p className="text-xs text-muted-foreground mt-1">Conexão CAPI</p>
                                        </div>
                                    </div>
                                    
                                    <div className="border rounded-md p-4 bg-muted/20">
                                        <h4 className="font-semibold mb-2 text-sm">Instalação Manual</h4>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Se você ainda não instalou o pixel no site, copie o código abaixo.
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-slate-950 text-slate-50 p-2 rounded text-xs truncate">
                                                {scriptCode}
                                            </code>
                                            <Button size="sm" variant="outline" onClick={copyToClipboard}>
                                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configurações da Fonte de Dados</CardTitle>
                            <CardDescription>
                                Atualize o Pixel ID e Token da API.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="metaPixelId"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pixel ID</FormLabel>
                                            <FormControl>
                                            <Input placeholder="1234567890" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="metaApiToken"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Token da API de Conversões</FormLabel>
                                            <FormControl>
                                            <Input type="password" placeholder="EAAB..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={mutation.isPending}>
                                        {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="test-events" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Testar Eventos</CardTitle>
                            <CardDescription>
                                Verifique se os eventos estão chegando corretamente via API de Conversões (CAPI).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="text-center py-8 space-y-4">
                                <div className="mx-auto bg-muted rounded-full p-4 w-fit">
                                    <Activity className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Disparar Evento de Teste</h3>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        Clique abaixo para enviar um evento &quot;TestEvent&quot; diretamente do servidor para o Meta, verificando se seu Token e Pixel ID estão corretos.
                                    </p>
                                </div>
                                <Button 
                                    onClick={() => testEventMutation.mutate()} 
                                    disabled={testEventMutation.isPending || !hasConfig}
                                    className="min-w-[200px]"
                                >
                                    {testEventMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        "Enviar Evento de Teste"
                                    )}
                                </Button>
                                {!hasConfig && (
                                    <p className="text-xs text-red-500">
                                        Configure o Pixel ID e Token primeiro.
                                    </p>
                                )}
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
         </div>
      </div>
    </div>
  )
}
