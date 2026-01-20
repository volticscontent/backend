"use client"

import { useState } from "react"
import { Copy, Check, Code, Globe, ShieldCheck, Zap, Smartphone, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlatformLogo } from "@/components/platform-logo"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface SourceDetailProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  source: any;
  datasetId: string;
  pixelId?: string;
}

export function SourceDetail({ source, datasetId, pixelId }: SourceDetailProps) {
  const [copied, setCopied] = useState(false)
  
  const endpointUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tracking/collect/${datasetId}`;
  const actualPixelId = pixelId || 'SEU_PIXEL_ID_AQUI';
  
  // Script template for Pixel Script source
  const scriptCode = `
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
               var payload = {
                  eventName: eventName,
                  eventData: eventData,
                  url: window.location.href,
                  userAgent: navigator.userAgent,
                  timestamp: Math.floor(Date.now() / 1000),
                  eventId: 'evt_' + Math.random().toString(36).substr(2, 9)
               };
               
               fetch('${endpointUrl}', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                  keepalive: true
               }).catch(function(e) { console.error('[RDS] Erro envio:', e); });
            }
        } catch (e) { console.error('[RDS] Erro interno:', e); }
     };

     // Preserva propriedades do Pixel original
     for (var prop in originalFbq) {
        if (Object.prototype.hasOwnProperty.call(originalFbq, prop)) {
           proxyFbq[prop] = originalFbq[prop];
        }
     }
     
     // Marca como instalado para evitar loops
     proxyFbq._rdsProxyInstalled = true;
     window.fbq = proxyFbq;
     console.log('[RDS] Proxy Instalado com Sucesso');
  }
})();

// 3. Inicialização do ID
fbq('init', '${actualPixelId}'); 
fbq('track', 'PageView');

// 4. Rastreamento Automático de Cliques (data-pixel-event)
document.addEventListener('click', function(e) {
  var target = e.target;
  while (target && target !== document) {
    if (target.getAttribute && target.getAttribute('data-pixel-event')) {
      var eventName = target.getAttribute('data-pixel-event');
      var eventValue = target.getAttribute('data-pixel-value');
      var eventData = {};
      if (eventValue) {
          eventData.value = Number(eventValue);
          eventData.currency = target.getAttribute('data-pixel-currency') || 'BRL';
      }
      fbq('track', eventName, eventData);
      break;
    }
    target = target.parentNode;
  }
});
</script>
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
           <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden relative">
                {source.type === 'WEBHOOK' ? <PlatformLogo platform={source.provider || ''} className="h-6 w-6" /> : <Code className="h-6 w-6" />}
           </div>
           <div>
                <h3 className="text-xl font-bold tracking-tight">{source.name}</h3>
                <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm">
                    <Badge variant="secondary" className="font-normal">{source.type.replace('_', ' ')}</Badge>
                    {source.provider && <Badge variant="outline" className="font-normal">{source.provider}</Badge>}
                    <span className="text-xs text-muted-foreground ml-2 font-mono">ID: {source.id.split('-')[0]}...</span>
                </div>
           </div>
        </div>
        <div className="flex items-center gap-2">
            <Badge className={source.enabled ? "bg-emerald-600 hover:bg-emerald-700" : "bg-yellow-500 hover:bg-yellow-600"}>
                {source.enabled ? "Monitorando" : "Pausado"}
            </Badge>
        </div>
      </div>

      {source.type === 'PIXEL_SCRIPT' && (
        <div className="mt-8">
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h4 className="text-lg font-semibold mb-1">Guia de Instalação</h4>
                    <p className="text-sm text-muted-foreground">Siga os passos abaixo para conectar seu site.</p>
                </div>
                
                <Dialog>
                    <DialogTrigger asChild>
                         <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                            <HelpCircle className="h-4 w-4 mr-2" />
                            Por que usar este script?
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Vantagens do Rastreamento Híbrido</DialogTitle>
                            <DialogDescription>
                                Nossa tecnologia combina o Pixel do navegador com a API de Conversões (CAPI) para garantir máxima precisão.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 py-6">
                             <div className="space-y-3 p-4 rounded-xl bg-secondary/30 border border-border">
                                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div>
                                    <h5 className="font-semibold text-foreground">Anti-AdBlock</h5>
                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                        Recupera até 30% dos eventos que seriam bloqueados por extensões de privacidade no navegador.
                                    </p>
                                </div>
                            </div>

                             <div className="space-y-3 p-4 rounded-xl bg-secondary/30 border border-border">
                                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary">
                                    <Zap className="h-6 w-6" />
                                </div>
                                <div>
                                    <h5 className="font-semibold text-foreground">API de Conversões</h5>
                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                        Envia dados direto do servidor (Server-Side), aumentando a nota de qualidade (EMQ) no Facebook.
                                    </p>
                                </div>
                            </div>

                             <div className="space-y-3 p-4 rounded-xl bg-secondary/30 border border-border">
                                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary">
                                    <Smartphone className="h-6 w-6" />
                                </div>
                                <div>
                                    <h5 className="font-semibold text-foreground">iOS 14+ Ready</h5>
                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                        Mitiga a perda de rastreamento causada pelas restrições de privacidade da Apple (ATT).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted">
                {/* Step 1 */}
                <div className="relative pl-12">
                    <div className="absolute left-0 top-0 h-10 w-10 rounded-full bg-background border-2 border-primary flex items-center justify-center font-bold text-primary z-10">
                        1
                    </div>
                    <div className="space-y-3">
                        <h5 className="font-semibold text-base flex items-center gap-2">
                            Limpeza do Ambiente
                            <Badge variant="outline" className="text-xs font-normal border-destructive text-destructive">Importante</Badge>
                        </h5>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Se você já usa o Pixel do Facebook, <strong className="text-foreground">remova o código antigo</strong> do seu site.
                            Isso evita que os eventos sejam disparados duas vezes (uma pelo código antigo e outra pelo nosso sistema).
                        </p>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="relative pl-12">
                     <div className="absolute left-0 top-0 h-10 w-10 rounded-full bg-background border-2 border-primary flex items-center justify-center font-bold text-primary z-10">
                        2
                    </div>
                    <div className="space-y-3">
                        <h5 className="font-semibold text-base">Instalar o Snippet Inteligente</h5>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Copie o código abaixo e cole no cabeçalho <code>&lt;head&gt;</code> de <strong>todas as páginas</strong> do seu site.
                            Ele já inclui o Pixel do Facebook e nossa tecnologia de proteção de dados.
                        </p>
                        
                        <Card className="border-border shadow-sm overflow-hidden mt-2">
                            <div className="bg-secondary/50 p-3 border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 bg-background rounded-md shadow-sm">
                                        <Code className="h-3 w-3 text-primary" />
                                    </div>
                                    <span className="text-xs font-medium text-foreground">rds-tracking-snippet.js</span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 hover:bg-background/50"
                                    onClick={handleCopy}
                                >
                                    {copied ? <Check className="h-3.5 w-3.5 mr-1.5 text-primary" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                                    {copied ? "Copiado" : "Copiar"}
                                </Button>
                            </div>
                            <CardContent className="p-0 bg-[#000000]">
                                <pre className="p-4 text-xs font-mono text-white overflow-x-auto h-[250px] leading-relaxed custom-scrollbar">
                                    {scriptCode}
                                </pre>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="relative pl-12">
                    <div className="absolute left-0 top-0 h-10 w-10 rounded-full bg-background border-2 border-muted-foreground/20 flex items-center justify-center font-bold text-muted-foreground z-10">
                        3
                    </div>
                    <div className="space-y-3">
                         <h5 className="font-semibold text-base">Programar Eventos (Opcional)</h5>
                         <p className="text-sm text-muted-foreground leading-relaxed">
                            O evento <code>PageView</code> já é disparado automaticamente. Para rastrear ações específicas (compras, cadastros), use os comandos padrão do Facebook nos seus botões ou páginas de obrigado.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                             <div className="p-3 bg-muted/30 rounded-lg border text-xs font-mono space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <span className="w-2 h-2 rounded-full bg-primary"></span> Botão de Compra
                                </div>
                                <div className="p-2 bg-background rounded border break-all">
                                    &lt;button <span className="text-primary">data-pixel-event=&quot;Purchase&quot;</span> <span className="text-blue-500">data-pixel-value=&quot;99.90&quot;</span>&gt;Comprar&lt;/button&gt;
                                </div>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg border text-xs font-mono space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <span className="w-2 h-2 rounded-full bg-primary"></span> Link/Botão de WhatsApp
                                </div>
                                <div className="p-2 bg-background rounded border break-all">
                                    &lt;a href=&quot;...&quot; <span className="text-primary">data-pixel-event=&quot;Contact&quot;</span>&gt;Fale Conosco&lt;/a&gt;
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {source.type === 'WEBHOOK' && (
        <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-8 text-center space-y-4">
                <div className="mx-auto h-12 w-12 bg-background rounded-full flex items-center justify-center shadow-sm">
                    <Globe className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                    <h4 className="font-medium text-lg">Endpoint do Webhook</h4>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                        Configure este endereço na sua plataforma de origem ({source.provider || 'Externa'}) para receber eventos em tempo real.
                    </p>
                </div>
                <div className="flex items-center justify-center gap-2 max-w-xl mx-auto">
                    <code className="px-4 py-2 bg-background border rounded-lg font-mono text-sm flex-1 text-left truncate shadow-sm">
                        {endpointUrl}
                    </code>
                    <Button variant="outline" onClick={() => {
                        navigator.clipboard.writeText(endpointUrl)
                    }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  )
}
