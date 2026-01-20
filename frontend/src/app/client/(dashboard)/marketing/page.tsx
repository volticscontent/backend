"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Copy, Check } from "lucide-react"

const marketingFormSchema = z.object({
  metaPixelId: z.string().min(1, {
    message: "Pixel ID é obrigatório.",
  }),
  metaApiToken: z.string().min(1, {
    message: "Token da API é obrigatório.",
  }),
})

export default function MarketingPage() {
  const [copied, setCopied] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

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

  // Get User ID from token (mock implementation - ideally decode token or get from profile)
  // For now we assume the settings endpoint returns the user context or we fetch profile
  // Actually, we need the userId to generate the script URL. 
  // Let's assume the settings object returns userId or we get it from another call.
  // Wait, the settings object in backend returns { userId, metaPixelId, ... }
  
  useEffect(() => {
    if (settings?.userId) {
      setTimeout(() => setUserId(settings.userId), 0)
    }
  }, [settings])

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
    onSuccess: (data) => {
      alert("Configurações salvas com sucesso!")
      setUserId(data.userId)
    },
    onError: (error) => {
      alert(`Erro: ${error.message}`)
    }
  })

  function onSubmit(values: z.infer<typeof marketingFormSchema>) {
    mutation.mutate(values)
  }

  const scriptCode = userId 
    ? `<script src="${process.env.NEXT_PUBLIC_API_URL}/api/marketing/pixel.js/${userId}"></script>`
    : "Carregando..."

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marketing Digital</h2>
          <p className="text-muted-foreground">Configure suas integrações e pixels de rastreamento.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Meta Ads (Facebook & Instagram)</CardTitle>
            <CardDescription>
              Configure seu Pixel e Token da API de Conversões para rastreamento avançado.
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
                      <FormDescription>
                        O ID do seu Pixel do Meta Business Suite.
                      </FormDescription>
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
                      <FormDescription>
                        Gere este token nas configurações do Pixel no Gerenciador de Eventos.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {userId && (
          <Card>
            <CardHeader>
              <CardTitle>Instalação do Pixel</CardTitle>
              <CardDescription>
                Copie o código abaixo e cole no <code>&lt;head&gt;</code> do seu site.
                Este código inclui automaticamente o Pixel do Facebook e a integração via API (CAPI).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                  {scriptCode}
                </pre>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
