"use client"

import { useState, Suspense, ChangeEvent } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Terminal, Play, ShoppingCart, FileText, RotateCcw } from "lucide-react"

function TestPixelContent() {
  const searchParams = useSearchParams()
  const initialDatasetId = searchParams.get("datasetId") || ""
  
  const [datasetId, setDatasetId] = useState(initialDatasetId)
  const [pixelId, setPixelId] = useState("1405480357623137")
  const [isLoaded, setIsLoaded] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev])
  }

  const loadScript = () => {
    if (!datasetId) {
      addLog("Erro: Dataset ID é obrigatório. Copie da URL do seu dataset.")
      return
    }

    const actualPixelId = pixelId || 'TEST_PIXEL_ID'
    const endpointUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tracking/collect/${datasetId}`

    addLog(`Iniciando script com Dataset ID: ${datasetId} e Pixel ID: ${actualPixelId}`)

    try {
      // @ts-expect-error - fbq might not be defined on window
      if (window.fbq) {
        addLog("Aviso: FBQ já existe na janela. A lógica de proxy pode ser duplicada se não cuidada.")
      }

      // 1. Base Pixel Code
      /* eslint-disable prefer-rest-params, prefer-spread, @typescript-eslint/no-unused-expressions, @typescript-eslint/no-explicit-any */
      // @ts-expect-error - Facebook Pixel snippet
      !function(f:any,b:any,e:any,v:any,n:any,t:any,s:any){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable prefer-rest-params, prefer-spread, @typescript-eslint/no-unused-expressions, @typescript-eslint/no-explicit-any */

      // 2. Init
      // @ts-expect-error - fbq is added to window
      window.fbq('init', actualPixelId);
      // @ts-expect-error - fbq is added to window
      window.fbq('track', 'PageView');
      addLog("Pixel iniciado e PageView disparado.")

      // 3. Proxy Logic
      // @ts-expect-error - fbq is added to window
      const originalFbq = window.fbq;
      // @ts-expect-error - fbq is added to window
      window.fbq = function(...args: unknown[]) {
        originalFbq.apply(this, args);
        const action = typeof args[0] === 'string' ? args[0] : '';
        const eventName = (action === 'track' || action === 'trackCustom') && typeof args[1] === 'string' ? args[1] : null;
        const eventData = (args[2] && typeof args[2] === 'object') ? args[2] : {};
        
        if (eventName) {
          addLog(`Interceptado evento: ${eventName}`)
          const payload = {
            eventName,
            eventData,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: Math.floor(Date.now() / 1000),
            eventId: 'evt_' + Math.random().toString(36).substr(2, 9)
          };
          
          addLog(`Enviando para API: ${endpointUrl}`)
          
          fetch(endpointUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
          })
          .then(res => {
            if (res.ok) addLog(`Sucesso API: ${res.status}`)
            else addLog(`Erro API: ${res.status}`)
          })
          .catch(err => addLog(`Erro Fetch: ${err.message}`));
        }
      };
      // @ts-expect-error - fbq is added to window
      Object.keys(originalFbq).forEach(key => window.fbq[key] = originalFbq[key]);
      
      setIsLoaded(true)
      addLog("Script carregado e proxy configurado com sucesso.")

    } catch (e: unknown) {
      addLog(`Erro ao carregar script: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const trackEvent = (eventName: string, data: Record<string, unknown> = {}) => {
    if (!isLoaded) {
      addLog("Erro: Carregue o script primeiro.")
      return
    }
    addLog(`Disparando: ${eventName}`)
    // @ts-expect-error - fbq is added to window
    window.fbq('track', eventName, data)
  }

  const clearLogs = () => setLogs([])
  const reset = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Pixel Test Lab</h1>
          <p className="text-muted-foreground">Ambiente controlado para validação de scripts de rastreamento.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Configuration Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-primary" />
                  Configuração
                </CardTitle>
                <CardDescription>Defina os parâmetros do tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Dataset ID (Obrigatório)</Label>
                  <Input 
                    placeholder="ex: cm63..." 
                    value={datasetId} 
                    onChange={e => setDatasetId(e.target.value)}
                    disabled={isLoaded}
                  />
                  <p className="text-xs text-muted-foreground">ID do conjunto de dados no sistema.</p>
                </div>

                <div className="space-y-2">
                  <Label>Pixel ID (Opcional)</Label>
                  <Input 
                    placeholder="ex: 1234567890" 
                    value={pixelId} 
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPixelId(e.target.value)}
                    disabled={isLoaded}
                  />
                  <p className="text-xs text-muted-foreground">Se vazio, usa ID de teste genérico.</p>
                </div>

                {!isLoaded ? (
                  <Button className="w-full" onClick={loadScript}>
                    <Play className="h-4 w-4 mr-2" />
                    Carregar Script
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full border-dashed" onClick={reset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reiniciar Sessão
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className={!isLoaded ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader>
                <CardTitle>Disparar Eventos</CardTitle>
                <CardDescription>Simule interações do usuário</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={() => trackEvent('PageView')}>
                  <FileText className="h-4 w-4 mr-2" />
                  PageView
                </Button>
                <Button variant="secondary" onClick={() => trackEvent('ViewContent', { content_name: 'Produto Teste', value: 49.90, currency: 'BRL' })}>
                  <FileText className="h-4 w-4 mr-2" />
                  ViewContent
                </Button>
                <Button variant="secondary" onClick={() => trackEvent('AddToCart', { content_name: 'Produto Teste', value: 49.90, currency: 'BRL' })}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  AddToCart
                </Button>
                <Button variant="secondary" onClick={() => trackEvent('InitiateCheckout', { value: 49.90, currency: 'BRL' })}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  InitiateCheckout
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Logs Panel */}
          <div className="space-y-6">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Logs de Execução</CardTitle>
                <Button variant="ghost" size="sm" onClick={clearLogs} className="h-8 w-8 p-0">
                  <span className="sr-only">Limpar</span>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-xs h-[500px] overflow-y-auto space-y-1">
                  {logs.length === 0 && <span className="text-slate-500">Aguardando eventos...</span>}
                  {logs.map((log, i) => (
                    <div key={i} className="break-all border-b border-slate-800 pb-1 mb-1 last:border-0">
                      {log}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function TestPixelPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <TestPixelContent />
    </Suspense>
  )
}
