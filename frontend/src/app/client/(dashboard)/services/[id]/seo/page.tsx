"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Search, Globe, BarChart, Save } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface SeoSettings {
  id: string
  globalTitle?: string
  globalDescription?: string
  googleSearchConsoleId?: string
  googleAnalyticsId?: string
  targetKeywords?: string[] // Recebido como array
}

export default function ServiceSeoPage() {
  const queryClient = useQueryClient()
  
  // Form States
  const [globalTitle, setGlobalTitle] = useState("")
  const [globalDescription, setGlobalDescription] = useState("")
  const [googleSearchConsoleId, setGoogleSearchConsoleId] = useState("")
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("")
  const [keywordsInput, setKeywordsInput] = useState("") // String separada por vírgulas

  // --- Queries ---
  const { data: settings, isLoading } = useQuery<SeoSettings>({
    queryKey: ['seoSettings'],
    queryFn: async () => {
      const token = localStorage.getItem("agency_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/seo/settings`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch SEO settings")
      return res.json()
    }
  })

  // Load data into form
  useEffect(() => {
    if (settings) {
      setGlobalTitle(settings.globalTitle || "")
      setGlobalDescription(settings.globalDescription || "")
      setGoogleSearchConsoleId(settings.googleSearchConsoleId || "")
      setGoogleAnalyticsId(settings.googleAnalyticsId || "")
      setKeywordsInput(settings.targetKeywords ? settings.targetKeywords.join(", ") : "")
    }
  }, [settings])

  // --- Mutations ---
  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("agency_token")
      // Converter string de keywords para array, removendo espaços
      const targetKeywords = keywordsInput
        .split(",")
        .map(k => k.trim())
        .filter(k => k.length > 0)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/seo/settings`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          globalTitle,
          globalDescription,
          googleSearchConsoleId,
          googleAnalyticsId,
          targetKeywords
        })
      })
      
      if (!res.ok) throw new Error("Failed to update SEO settings")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seoSettings'] })
      toast({ title: "Configurações de SEO atualizadas!" })
    },
    onError: (err) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" })
    }
  })

  if (isLoading) {
    return <div className="p-6">Carregando configurações...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SEO & Visibilidade</h2>
          <p className="text-muted-foreground">Configure metatags, rastreamento e palavras-chave.</p>
        </div>
        <Button onClick={() => updateSettingsMutation.mutate()} disabled={updateSettingsMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configurações Globais */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Metatags Globais</CardTitle>
            </div>
            <CardDescription>Defina como seu site aparece nos resultados de busca.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="globalTitle">Título Padrão (Meta Title)</Label>
              <Input 
                id="globalTitle" 
                placeholder="Ex: Minha Empresa - Soluções em Tecnologia" 
                value={globalTitle}
                onChange={(e) => setGlobalTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Recomendado: 50-60 caracteres.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="globalDescription">Descrição Padrão (Meta Description)</Label>
              <Textarea 
                id="globalDescription" 
                placeholder="Uma breve descrição do seu negócio..." 
                className="min-h-[100px]"
                value={globalDescription}
                onChange={(e) => setGlobalDescription(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Recomendado: 150-160 caracteres.</p>
            </div>
          </CardContent>
        </Card>

        {/* Integrações */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <BarChart className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Integrações</CardTitle>
            </div>
            <CardDescription>Conecte ferramentas de análise externa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gsc">Google Search Console ID</Label>
              <Input 
                id="gsc" 
                placeholder="Ex: google-site-verification=..." 
                value={googleSearchConsoleId}
                onChange={(e) => setGoogleSearchConsoleId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ga">Google Analytics ID</Label>
              <Input 
                id="ga" 
                placeholder="Ex: G-XXXXXXXXXX" 
                value={googleAnalyticsId}
                onChange={(e) => setGoogleAnalyticsId(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Palavras-chave */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Palavras-chave Alvo</CardTitle>
            </div>
            <CardDescription>Liste as principais palavras-chave que deseja monitorar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
              <Textarea 
                id="keywords" 
                placeholder="desenvolvimento web, marketing digital, seo, ..." 
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Isso ajudará a gerar relatórios de posicionamento futuramente.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
