"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Plus, Trash2, Globe, Activity, Share2, Code, Check, Facebook } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlatformLogo } from "@/components/platform-logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import { SourceDetail } from "@/components/source-detail"
import { TrackingEventsList } from "@/components/tracking-events-list"

  interface TrackingSource {
    id: string
    name: string
    type: string
    provider: string
    status: string
  }

  interface TrackingDestination {
    id: string
    platform: string
    pixelId: string
    status: string
    config?: {
      pixelId?: string
      conversionId?: string
      apiToken?: string
    }
  }

  interface TrackingDataset {
    id: string
    name: string
    description?: string
    sources: TrackingSource[]
    destinations: TrackingDestination[]
  }

export default function DatasetDetailPage() {
  // Force rebuild timestamp: 2026-01-20
  const params = useParams()
  const router = useRouter()
  const datasetId = params.id as string
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState("overview")
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false)
  const [isAddDestOpen, setIsAddDestOpen] = useState(false)

  // Form States
  const [sourceName, setSourceName] = useState("")
  const [sourceType, setSourceType] = useState("PIXEL_SCRIPT")
  const [sourceProvider, setSourceProvider] = useState("STRIPE")
  const [sourceSecret, setSourceSecret] = useState("")
  
  // Verification State
  const [isVerifying, setIsVerifying] = useState(false)
  const [createdSourceId, setCreatedSourceId] = useState<string | null>(null)

  const [destPlatform, setDestPlatform] = useState("META")
  const [destPixelId, setDestPixelId] = useState("")
  const [destApiToken, setDestApiToken] = useState("")

  // View Details State
  const [selectedDest, setSelectedDest] = useState<TrackingDestination | null>(null)
  const [selectedSource, setSelectedSource] = useState<TrackingSource | null>(null)

  const { data: dataset, isLoading } = useQuery<TrackingDataset>({
    queryKey: ['trackingDataset', datasetId],
    queryFn: async () => {
      const token = localStorage.getItem("agency_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracking/datasets/${datasetId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.status === 401) {
          router.push("/client/login")
          throw new Error("Sessão expirada")
      }
      if (!res.ok) throw new Error("Dataset not found")
      return res.json()
    },
    refetchInterval: isVerifying ? 2000 : false // Poll every 2s when verifying
  })

  const { data: stats } = useQuery({
    queryKey: ['trackingStats', datasetId],
    queryFn: async () => {
       const token = localStorage.getItem("agency_token")
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracking/datasets/${datasetId}/stats`, {
           headers: { "Authorization": `Bearer ${token}` }
       })
       if (!res.ok) return null;
       return res.json()
    }
  })

  // Check verification status
  const verifiedSource = dataset?.sources?.find((s) => s.id === createdSourceId)
  const isVerified = verifiedSource?.status === 'ACTIVE'

  // Helper to get the primary Meta Pixel ID
  const metaPixelId = dataset?.destinations?.find((d) => d.platform === 'META')?.config?.pixelId;

  const addSourceMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("agency_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracking/datasets/${datasetId}/sources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: sourceName,
          type: sourceType,
          provider: sourceType === 'WEBHOOK' ? sourceProvider : undefined,
          config: sourceType === 'WEBHOOK' && sourceSecret ? { secret: sourceSecret } : {}
        })
      })
      if (!res.ok) throw new Error("Failed to add source")
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trackingDataset', datasetId] })
      if (sourceType === 'PIXEL_SCRIPT') {
          setCreatedSourceId(data.id)
          setIsVerifying(true)
      } else {
          setIsAddSourceOpen(false)
          setSourceName("")
          setSourceSecret("")
      }
    }
  })

  const handleCloseVerification = () => {
      setIsVerifying(false)
      setCreatedSourceId(null)
      setIsAddSourceOpen(false)
      setSourceName("")
      setSourceSecret("")
  }

  // Generate script for verification view
  const verificationScript = `
<!-- RDS Tracking & CAPI Proxy -->
<script>
// 1. Carregamento Seguro do Pixel (Evita Conflitos)
if(typeof fbq === 'undefined') {
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
}

// 2. Camada de Redundância (Server-Side)
(function() {
  if (window.fbq && !window.fbq._rdsProxyInstalled) {
     var originalFbq = window.fbq;
     var proxyFbq = function() {
        if (originalFbq) originalFbq.apply(this, arguments);
        
        try {
            var args = Array.from(arguments);
            var eventName = args[0] === 'track' ? args[1] : (args[0] === 'trackCustom' ? args[1] : null);
            var eventData = args[2] || {};
            
            if (eventName) {
               console.log('[RDS Proxy] Interceptado:', eventName);
               var payload = {
                  eventName: eventName,
                  eventData: eventData,
                  userAgent: navigator.userAgent,
                  url: window.location.href,
                  timestamp: Date.now()
               };
               
               fetch('${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tracking/collect/${datasetId}', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                  keepalive: true
               }).catch(function(e) { console.error('[RDS Proxy] Erro envio:', e); });
            }
        } catch (e) { console.error('[RDS Proxy] Erro interno:', e); }
     };

     for (var prop in originalFbq) {
        if (Object.prototype.hasOwnProperty.call(originalFbq, prop)) {
           proxyFbq[prop] = originalFbq[prop];
        }
     }
     proxyFbq._rdsProxyInstalled = true;
     window.fbq = proxyFbq;
  }
})();

fbq('init', '${metaPixelId || 'SEU_PIXEL_ID'}'); 
fbq('track', 'PageView');
</script>
  `.trim();

  const addDestMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("agency_token")
      const config = {
        pixelId: destPixelId,
        apiToken: destApiToken
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracking/datasets/${datasetId}/destinations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          platform: destPlatform,
          config
        })
      })
      if (!res.ok) throw new Error("Failed to add destination")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackingDataset', datasetId] })
      setIsAddDestOpen(false)
      setDestPixelId("")
      setDestApiToken("")
    }
  })

  const deleteDestMutation = useMutation({
    mutationFn: async (id: string) => {
        const token = localStorage.getItem("agency_token")
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracking/destinations/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trackingDataset', datasetId] })
  })

  if (isLoading) return <div className="p-8 text-center">Carregando detalhes...</div>
  if (!dataset) return <div className="p-8 text-center">Dataset não encontrado</div>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{dataset.name}</h2>
          <p className="text-muted-foreground">{dataset.description || "Gerencie fontes e destinos de dados."}</p>
        </div>
        <Button variant="outline" onClick={() => window.open(`/client/test-pixel?datasetId=${datasetId}`, '_blank')}>
            <Activity className="h-4 w-4 mr-2" />
            Testar Integração
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="setup">Configuração (Instalação)</TabsTrigger>
          <TabsTrigger value="events">Eventos (Logs)</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Histórico de Eventos</h3>
                    <p className="text-sm text-muted-foreground">
                        Visualize os eventos recebidos e o status de envio para as plataformas.
                    </p>
                </div>
                <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['trackingEvents', datasetId] })}>
                    Atualizar
                </Button>
            </div>
            <TrackingEventsList datasetId={datasetId} />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
           {/* ... existing overview content ... */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                  <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Fontes Ativas</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">{dataset.sources.length}</div>
                      <p className="text-xs text-muted-foreground">Webhooks e Pixels conectados</p>
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Destinos Ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">{dataset.destinations.length}</div>
                      <p className="text-xs text-muted-foreground">Plataformas recebendo dados</p>
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Eventos Hoje</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalEvents24h || 0}</div>
                      <p className="text-xs text-muted-foreground">Processados nas últimas 24h</p>
                      {stats?.eventsByHour && (
                          <div className="flex items-end gap-0.5 h-8 w-full mt-3">
                            {stats.eventsByHour.map((val: number, i: number) => {
                                const max = Math.max(...stats.eventsByHour, 1);
                                const height = (val / max) * 100;
                                return (
                                    <div 
                                        key={i} 
                                        className="bg-primary/20 hover:bg-primary/60 transition-colors flex-1 rounded-t-[1px]"
                                        style={{ height: `${height}%` }}
                                        title={`${val} eventos às ${new Date().getHours() - (23-i)}h`}
                                    />
                                )
                            })}
                          </div>
                      )}
                  </CardContent>
              </Card>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <Card>
                  <CardHeader>
                      <CardTitle className="text-lg">Plataformas Conectadas</CardTitle>
                      <CardDescription>Clique para ver detalhes e estatísticas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {dataset.destinations.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground">
                              Nenhuma plataforma configurada.
                          </div>
                      ) : (
                          dataset.destinations.map(dest => (
                              <div 
                                key={dest.id} 
                                className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                                onClick={() => setSelectedDest(dest)}
                              >
                                  <div className="flex items-center gap-3">
                                      <div className="relative">
                                          <div className={cn(
                                              "p-3 rounded-xl border-2 shadow-sm transition-transform group-hover:scale-105",
                                              dest.platform === 'META' && "bg-[#1877F2]/10 border-[#1877F2]/20 text-[#1877F2]",
                                              dest.platform === 'TIKTOK' && "bg-[#000000]/5 border-[#000000]/10 text-[#000000] dark:bg-white/10 dark:text-white",
                                              dest.platform === 'GOOGLE_ADS' && "bg-[#4ad34a]/10 border-[#e2f442]/20 text-[#4285F4]"
                                          )}>
                                              <PlatformLogo platform={dest.platform} className="h-8 w-8" />
                                          </div>
                                          <div className={cn(
                                              "absolute -bottom-1 -right-1 p-1 rounded-full bg-background border shadow-sm",
                                          )}>
                                              <PlatformLogo platform={dest.platform} className="h-3 w-3" />
                                          </div>
                                      </div>
                                      <div>
                                          <div className="font-medium flex items-center gap-2">
                                              {dest.platform === 'META' ? 'Meta Ads' : dest.platform}
                                              <Badge variant="outline" className={cn(
                                                  "text-[10px] h-5 px-1.5",
                                                  dest.status === 'ACTIVE' ? "border-green-200 text-green-600 bg-green-50" : "text-muted-foreground"
                                              )}>
                                                  {dest.status === 'ACTIVE' ? 'Ativo' : 'Pendente'}
                                              </Badge>
                                          </div>
                                          <div className="text-xs text-muted-foreground font-mono mt-1">
                                              ID: {dest.config?.pixelId || dest.config?.conversionId}
                                          </div>
                                          {dest.config?.pixelId && dest.platform === 'META' && (
                                              <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                                  {dest.config.apiToken ? (
                                                      <span className="text-green-600 flex items-center gap-1">
                                                          <Check className="h-3 w-3" /> CAPI Habilitado
                                                      </span>
                                                  ) : (
                                                      <span className="text-amber-600">CAPI Desabilitado (Sem Token)</span>
                                                  )}
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                  </CardContent>
              </Card>

              <Card>
                  <CardHeader>
                      <CardTitle className="text-lg">Fontes de Dados</CardTitle>
                      <CardDescription>Origens dos eventos rastreados</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {dataset.sources.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground">
                              Nenhuma fonte configurada.
                          </div>
                      ) : (
                          dataset.sources.map(source => (
                              <div 
                                key={source.id} 
                                className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                                onClick={() => setSelectedSource(source)}
                              >
                                  <div className="flex items-center gap-3">
                                      <div className="p-3 rounded-xl border shadow-sm bg-secondary/50 text-secondary-foreground group-hover:scale-105 transition-transform overflow-hidden relative">
                                          {source.type === 'PIXEL_SCRIPT' ? (
                                            <Code className="h-6 w-6" /> 
                                          ) : (
                                            source.provider ? (
                                              <PlatformLogo platform={source.provider} className="h-6 w-6" />
                                            ) : (
                                              <Globe className="h-6 w-6" />
                                            )
                                          )}
                                      </div>
                                      <div>
                                          <div className="font-medium flex items-center gap-2">
                                              {source.name}
                                              <Badge variant="outline" className={cn(
                                                  "text-[10px] h-5 px-1.5",
                                                  source.status === 'ACTIVE' ? "border-green-200 text-green-600 bg-green-50" : "text-amber-600 bg-amber-50 border-amber-200"
                                              )}>
                                                  {source.status === 'ACTIVE' ? 'Validado' : 'Aguardando Evento'}
                                              </Badge>
                                          </div>
                                          <div className="text-xs text-muted-foreground mt-1">
                                              {source.type === 'PIXEL_SCRIPT' ? 'Script (Pixel)' : `Webhook (${source.provider})`}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                  </CardContent>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="setup" className="max-w-5xl mx-auto space-y-4 py-4">
            {/* Wizard Header */}
            <div className="relative mb-8">
                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-muted -z-10" />
                <div className="flex justify-between">
                    <div className="flex flex-col items-center gap-2 bg-background rounded-full">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm border-2 bg-primary text-primary-foreground border-primary`}>1</div>
                        <span className="text-sm font-medium">Base de Dados</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 bg-background rounded-full">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${dataset.destinations.length > 0 ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-primary text-primary'}`}>2</div>
                        <span className="text-sm font-medium">Plataformas</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 bg-background rounded-full">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${dataset.sources.length > 0 ? 'bg-primary text-primary-foreground border-primary' : (dataset.destinations.length > 0 ? 'bg-background border-primary text-primary' : 'bg-muted border-muted text-muted-foreground')}`}>3</div>
                        <span className="text-sm font-medium">Rastreamento</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 bg-background rounded-full">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm border-2 bg-muted border-muted text-muted-foreground">4</div>
                        <span className="text-sm font-medium">Validar</span>
                    </div>
                </div>
            </div>

            {/* Step 1: Database Configuration */}
            <Card className="border-primary/20 bg-[#f0fffd]">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle>1. Base de Dados de Eventos</CardTitle>
                            <CardDescription>Seu repositório central para armazenamento e processamento de eventos.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                            <Label className="text-muted-foreground">Nome do Dataset</Label>
                            <div className="font-medium text-lg">{dataset.name}</div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-muted-foreground">ID do Dataset</Label>
                            <div className="font-mono bg-muted p-1 px-2 rounded text-sm">{dataset.id}</div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-muted-foreground">Status do Serviço</Label>
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="text-sm font-medium text-green-600">Operacional</span>
                            </div>
                        </div>
                         <div className="space-y-1">
                            <Label className="text-muted-foreground">Retenção de Dados</Label>
                            <div className="text-sm">30 dias (Plano Standard)</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Step 2: Destination Configuration */}
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-secondary text-secondary-foreground rounded-lg">
                                    <Share2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle>2. Conexão com Plataformas</CardTitle>
                                    <CardDescription>Configure para onde os eventos processados devem ser enviados.</CardDescription>
                                </div>
                            </div>
                             {dataset.destinations.length > 0 && (
                                 <Badge variant="outline" className="flex gap-1 border-green-600 text-green-600 bg-green-50 dark:bg-green-950/20">
                                    <Check className="h-3 w-3" /> {dataset.destinations.length} Conectado(s)
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {dataset.destinations.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
                                    Conecte o Meta Ads, TikTok ou Google Ads para sincronizar seus eventos.
                                    Isso é necessário para gerar os scripts de rastreamento com os IDs corretos.
                                </p>
                                <Button onClick={() => setIsAddDestOpen(true)} size="lg" className="gap-2">
                                    <Plus className="h-4 w-4" /> Adicionar Plataforma
                                </Button>
                            </div>
                        ) : (
                             <div className="space-y-3">
                                {dataset.destinations.map((dest) => (
                                    <div key={dest.id} className="flex items-center justify-between p-4 bg-background rounded-lg border shadow-sm">
                                         <div className={cn(
                                            "flex items-center gap-3 p-2 border-2 rounded-md",
                                            dest.platform === 'META' && "border-blue-100 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-900/20",
                                            dest.platform === 'TIKTOK' && "border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/20",
                                            dest.platform === 'GOOGLE_ADS' && "border-green-100 bg-green-50/50 dark:border-green-900/50 dark:bg-green-900/20"
                                         )}>
                                            <PlatformLogo platform={dest.platform} className="h-5 w-5" />
                                            <div>
                                                <p className="font-medium">{dest.platform === 'META' ? 'Meta Ads' : dest.platform}</p>
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    ID: {dest.config?.pixelId || dest.config?.conversionId}
                                                </p>
                                            </div>
                                         </div>
                                         <div className="flex gap-2">
                                             <Button variant="outline" size="sm" onClick={() => deleteDestMutation.mutate(dest.id)}>
                                                 <Trash2 className="h-4 w-4" />
                                             </Button>
                                         </div>
                                     </div>
                                ))}
                                <Button variant="outline" onClick={() => setIsAddDestOpen(true)} className="w-full mt-2 border-dashed">
                                    <Plus className="h-4 w-4 mr-2" /> Adicionar Outra Plataforma
                                </Button>
                             </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Step 3: Data Sources */}
            {dataset.destinations.length > 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card>
                        <CardHeader>
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-secondary text-secondary-foreground rounded-lg">
                                        <Code className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle>3. Fontes de Dados</CardTitle>
                                        <CardDescription>Configure como os eventos entram no sistema (Script ou Webhook).</CardDescription>
                                    </div>
                                </div>
                                {dataset.sources.length > 0 && (
                                    <Button variant="outline" size="sm" onClick={() => setIsAddSourceOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" /> Adicionar
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {dataset.sources.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 bg-muted/20 rounded-lg border-2 border-dashed">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                        <Globe className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Adicionar Fonte de Dados</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm">
                                            Escolha entre instalar o script no seu site ou conectar via webhook.
                                        </p>
                                    </div>
                                    <Button onClick={() => setIsAddSourceOpen(true)} className="gap-2">
                                        Adicionar Fonte <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                dataset.sources.map((source) => (
                                    <SourceDetail key={source.id} source={source} datasetId={datasetId} pixelId={metaPixelId} />
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Step 4: Verify */}
            {dataset.destinations.length > 0 && dataset.sources.length > 0 && (
                <Card className={cn(
                    "animate-in fade-in slide-in-from-bottom-4 duration-500",
                    dataset.sources.some(s => s.status === 'ACTIVE') 
                        ? "border-green-200 bg-green-50 dark:bg-green-900/10 border-solid opacity-100" 
                        : "opacity-50 border-dashed"
                )}>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-3 rounded-full flex items-center justify-center transition-colors",
                                dataset.sources.some(s => s.status === 'ACTIVE')
                                    ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                                    : "bg-muted text-muted-foreground"
                            )}>
                                {dataset.sources.some(s => s.status === 'ACTIVE') ? <Check className="h-6 w-6" /> : <Activity className="h-6 w-6" />}
                            </div>
                            <div>
                                <CardTitle className={cn(
                                    "text-lg",
                                    dataset.sources.some(s => s.status === 'ACTIVE') ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
                                )}>
                                    4. Validação de Eventos
                                </CardTitle>
                                <CardDescription className="text-base">
                                    {dataset.sources.some(s => s.status === 'ACTIVE')
                                        ? "Sucesso! Seus eventos estão sendo recebidos e processados corretamente."
                                        : "Aguardando o primeiro evento ser recebido..."}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            )}

            {/* Dialogs */}
            <Dialog open={isAddSourceOpen} onOpenChange={(open) => !isVerifying && setIsAddSourceOpen(open)}>
                 <DialogContent className={isVerifying ? "sm:max-w-2xl" : ""}>
                        <DialogHeader>
                            <DialogTitle>{isVerifying ? "Verificação de Instalação" : "Adicionar Fonte de Dados"}</DialogTitle>
                            <DialogDescription>
                                {isVerifying 
                                 ? "Instale o script e aguarde o recebimento do primeiro evento." 
                                 : "Configure de onde os eventos serão recebidos."}
                            </DialogDescription>
                        </DialogHeader>

                        {!isVerifying ? (
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nome da Fonte</Label>
                                    <Input value={sourceName} onChange={e => setSourceName(e.target.value)} placeholder="Ex: Minha Landing Page ou Stripe" />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Tipo de Integração</Label>
                                    <Select value={sourceType} onValueChange={setSourceType}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PIXEL_SCRIPT">Script no Site (Pixel)</SelectItem>
                                            <SelectItem value="WEBHOOK">Webhook (Backend)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {sourceType === 'WEBHOOK' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Provedor</Label>
                                            <Select value={sourceProvider} onValueChange={setSourceProvider}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="STRIPE">Stripe</SelectItem>
                                                    <SelectItem value="SHOPIFY">Shopify</SelectItem>
                                                    <SelectItem value="HOTMART">Hotmart</SelectItem>
                                                    <SelectItem value="CUSTOM">Customizado / Outro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Segredo de Assinatura (Webhook Secret)</Label>
                                            <Input 
                                                type="password"
                                                value={sourceSecret} 
                                                onChange={e => setSourceSecret(e.target.value)} 
                                                placeholder="whsec_..." 
                                            />
                                            <p className="text-[10px] text-muted-foreground">
                                                Usado para validar a autenticidade dos eventos recebidos (opcional, mas recomendado).
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6 py-4">
                                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                                   {isVerified ? (
                                      <div className="rounded-full bg-green-100 p-3 text-green-600 dark:bg-green-900/30">
                                         <Check className="h-8 w-8" />
                                      </div>
                                   ) : (
                                      <div className="rounded-full bg-blue-100 p-3 text-blue-600 animate-pulse dark:bg-blue-900/30">
                                         <Activity className="h-8 w-8" />
                                      </div>
                                   )}
                                   
                                   <div>
                                     <h3 className="text-lg font-medium">
                                        {isVerified ? "Integração Confirmada!" : "Aguardando Eventos..."}
                                     </h3>
                                     <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                        {isVerified 
                                          ? "Seu script está enviando dados corretamente." 
                                          : "Instale o script no seu site e aguarde o primeiro evento (PageView)."}
                                     </p>
                                   </div>
                                </div>

                                {/* Show Script if not verified or just always for reference */}
                                {!isVerified && (
                                    <div className="rounded-md bg-muted p-4 relative border">
                                         <pre className="text-[10px] overflow-x-auto whitespace-pre-wrap font-mono h-48">
                                            {verificationScript}
                                         </pre>
                                         <Button size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => navigator.clipboard.writeText(verificationScript)}>
                                            <Check className="h-4 w-4" />
                                         </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter>
                            {!isVerifying ? (
                                <Button onClick={() => addSourceMutation.mutate()} disabled={addSourceMutation.isPending}>
                                    {sourceType === 'PIXEL_SCRIPT' ? 'Gerar Script' : 'Criar Webhook'}
                                </Button>
                            ) : (
                                isVerified ? (
                                     <Button onClick={handleCloseVerification} className="w-full bg-green-600 hover:bg-green-700 text-white">
                                        <Check className="mr-2 h-4 w-4" /> Concluir Integração
                                     </Button>
                                ) : (
                                     <Button variant="outline" onClick={handleCloseVerification}>
                                        Verificar Depois
                                     </Button>
                                )
                            )}
                        </DialogFooter>
                 </DialogContent>
            </Dialog>

            <Dialog open={isAddDestOpen} onOpenChange={setIsAddDestOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Plataforma</DialogTitle>
                            <DialogDescription>Configure a integração com a plataforma de anúncios.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Plataforma</Label>
                                <Select value={destPlatform} onValueChange={setDestPlatform}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="META">Meta Ads (Facebook/Instagram)</SelectItem>
                                        <SelectItem value="TIKTOK">TikTok Ads</SelectItem>
                                        <SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>ID de Rastreamento (Pixel/Conversion ID)</Label>
                                <Input value={destPixelId} onChange={e => setDestPixelId(e.target.value)} placeholder="1234567890" />
                            </div>
                            <div className="space-y-2">
                                <Label>Token de API (Opcional)</Label>
                                <Input type="password" value={destApiToken} onChange={e => setDestApiToken(e.target.value)} placeholder="Token de Conversão (CAPI)" />
                                <p className="text-[10px] text-muted-foreground">Necessário para eventos server-side (CAPI).</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => addDestMutation.mutate()} disabled={addDestMutation.isPending}>Salvar e Continuar</Button>
                        </DialogFooter>
                    </DialogContent>
            </Dialog>

            {/* View Details Dialogs */}
            <Dialog open={!!selectedDest} onOpenChange={(open) => !open && setSelectedDest(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <PlatformLogo platform={selectedDest?.platform || ''} className="h-6 w-6" />
                            {selectedDest?.platform === 'META' ? 'Meta Ads' : selectedDest?.platform}
                        </DialogTitle>
                        <DialogDescription>Detalhes da configuração</DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">Status</span>
                            <Badge variant={selectedDest?.status === 'ACTIVE' ? 'default' : 'secondary'} className={selectedDest?.status === 'ACTIVE' ? 'bg-green-600' : ''}>
                                {selectedDest?.status === 'ACTIVE' ? 'Ativo' : 'Pendente'}
                            </Badge>
                        </div>

                        <div className="p-4 bg-muted/30 rounded-lg border">
                            <h4 className="text-xs font-medium mb-2 text-muted-foreground">Atividade Recente (Dataset)</h4>
                            {stats?.eventsByHour ? (
                                <div className="flex items-end gap-1 h-16 w-full">
                                {stats.eventsByHour.map((val: number, i: number) => {
                                    const max = Math.max(...stats.eventsByHour, 1);
                                    const height = (val / max) * 100;
                                    return (
                                        <div 
                                            key={i} 
                                            className={cn(
                                                "flex-1 rounded-t-[1px] transition-all",
                                                selectedDest?.platform === 'META' ? "bg-blue-500/20 hover:bg-blue-500/60" :
                                                selectedDest?.platform === 'TIKTOK' ? "bg-zinc-500/20 hover:bg-zinc-500/60" :
                                                "bg-green-500/20 hover:bg-green-500/60"
                                            )}
                                            style={{ height: `${height}%` }}
                                            title={`${val} eventos`}
                                        />
                                    )
                                })}
                                </div>
                            ) : (
                                <div className="h-16 flex items-center justify-center text-xs text-muted-foreground">
                                    Sem dados recentes
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">ID do Pixel / Conversão</Label>
                            <div className="font-mono text-sm p-2 bg-secondary rounded border">
                                {selectedDest?.config?.pixelId || selectedDest?.config?.conversionId}
                            </div>
                        </div>

                        {selectedDest?.platform === 'META' && (
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">API de Conversões (CAPI)</Label>
                                <div className="flex items-center gap-2 p-2 bg-secondary rounded border">
                                    {selectedDest?.config?.apiToken ? (
                                        <>
                                            <Check className="h-4 w-4 text-green-600" />
                                            <span className="text-sm">Token Configurado</span>
                                        </>
                                    ) : (
                                        <>
                                            <Activity className="h-4 w-4 text-amber-600" />
                                            <span className="text-sm text-amber-600">Não configurado</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedDest(null)}>Fechar</Button>
                        <Button variant="destructive" onClick={() => {
                            if (selectedDest) deleteDestMutation.mutate(selectedDest.id);
                            setSelectedDest(null);
                        }}>
                            <Trash2 className="h-4 w-4 mr-2" /> Remover
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedSource} onOpenChange={(open) => !open && setSelectedSource(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedSource?.type === 'PIXEL_SCRIPT' ? <Code className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                            {selectedSource?.name}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedSource?.type === 'PIXEL_SCRIPT' ? 'Instalação via Script' : 'Integração via Webhook'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                         <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">Status</span>
                            <Badge variant={selectedSource?.status === 'ACTIVE' ? 'default' : 'secondary'} className={selectedSource?.status === 'ACTIVE' ? 'bg-green-600' : ''}>
                                {selectedSource?.status === 'ACTIVE' ? 'Validado' : 'Aguardando Evento'}
                            </Badge>
                        </div>

                        {selectedSource?.type === 'PIXEL_SCRIPT' && (
                            <div className="space-y-2">
                                <Label>Script de Instalação</Label>
                                <div className="rounded-md bg-muted p-4 relative border">
                                     <pre className="text-[10px] overflow-x-auto whitespace-pre-wrap font-mono h-48">
                                        {verificationScript}
                                     </pre>
                                     <Button size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => navigator.clipboard.writeText(verificationScript)}>
                                        <Check className="h-4 w-4" />
                                     </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    Instale este script no <code>&lt;head&gt;</code> de todas as páginas do seu site.
                                </p>
                            </div>
                        )}

                        {selectedSource?.type === 'WEBHOOK' && (
                            <div className="space-y-2">
                                <Label>URL do Webhook</Label>
                                <div className="flex items-center gap-2">
                                    <div className="font-mono text-xs p-2 bg-secondary rounded border flex-1 break-all">
                                        {`${process.env.NEXT_PUBLIC_API_URL}/api/tracking/collect/${datasetId}`}
                                    </div>
                                    <Button size="icon" variant="outline" onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_URL}/api/tracking/collect/${datasetId}`)}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    Configure seu {selectedSource.provider} para enviar eventos para esta URL.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedSource(null)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
