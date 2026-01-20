"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, Copy } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function ApiDocsPage() {
  const [copied, setCopied] = useState("")

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(""), 2000)
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
  const frontendUrl = "http://localhost:4000"

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-primary">Documentação da API do CMS</h1>
            <p className="text-xl text-muted-foreground">
                Guia completo para integrar o conteúdo dinâmico do seu CMS em qualquer aplicação (Frontend, Mobile, etc).
            </p>
            <div className="pt-2">
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
                    Voltar para o Dashboard
                </Button>
            </div>
        </div>

        <Separator />

        {/* Introduction */}
        <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Introdução</h2>
            <p className="leading-7">
                A API do CMS é <strong>pública para leitura</strong> (GET), o que significa que você pode buscar seu conteúdo diretamente do navegador do seu usuário sem expor chaves de API secretas. 
                Toda a autenticação é baseada no <code>slug</code> (identificador) do cliente e da coleção.
            </p>
            <div className="flex items-center gap-2 mt-4">
                <Badge variant="outline" className="text-base px-3 py-1">Base URL</Badge>
                <code className="bg-muted px-2 py-1 rounded font-mono text-sm">{baseUrl}/api/cms/public</code>
            </div>
        </section>

        {/* Authentication */}
        <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Autenticação Privada (API Key)</h2>
            <p className="leading-7">
                Para acessar endpoints protegidos ou realizar operações de escrita (POST/PUT/DELETE) via API, você deve utilizar uma <strong>API Key</strong>.
                Você pode gerar suas chaves no painel do CMS clicando em "Credenciais".
            </p>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Como Autenticar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Envie sua chave em um dos headers abaixo:</p>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <span className="text-sm font-semibold">Opção 1 (Recomendada)</span>
                            <div className="bg-muted p-3 rounded-md font-mono text-xs">
                                X-API-Key: sk_7a8f...
                            </div>
                        </div>
                        <div className="space-y-2">
                            <span className="text-sm font-semibold">Opção 2</span>
                            <div className="bg-muted p-3 rounded-md font-mono text-xs">
                                Authorization: ApiKey sk_7a8f...
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </section>

        {/* Endpoint: Create Entry */}
        <section className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-blue-600 hover:bg-blue-700">POST</Badge>
                            <code className="text-lg font-mono">/write/:typeSlug</code>
                        </div>
                    </div>
                    <CardTitle className="mt-4">Criar Novo Conteúdo</CardTitle>
                    <CardDescription>Cria um novo item na coleção especificada usando o slug da coleção.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 rounded text-sm text-yellow-500">
                        <strong>Atenção:</strong> Este endpoint requer autenticação via API Key.
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Parâmetros de URL</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            <li><code className="text-foreground font-mono">typeSlug</code>: O slug da coleção onde o item será criado (ex: <code>blog-posts</code>).</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Corpo da Requisição (JSON)</h4>
                        <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-xs overflow-x-auto">
<pre>{`{
  "data": {
    "title": "Meu Novo Post",
    "content": "Conteúdo criado via API..."
  },
  "status": "PUBLISHED", // Opcional (Default: DRAFT)
  "slug": "meu-novo-post" // Opcional (Gerado auto se vazio)
}`}</pre>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Exemplo de Requisição</h4>
                        <Tabs defaultValue="js" className="w-full">
                            <TabsList>
                                <TabsTrigger value="js">JavaScript (Fetch)</TabsTrigger>
                                <TabsTrigger value="curl">cURL</TabsTrigger>
                            </TabsList>
                            <TabsContent value="js">
                                <div className="relative bg-muted p-4 rounded-md font-mono text-xs overflow-x-auto">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute right-2 top-2 h-6 w-6"
                                        onClick={() => copyToClipboard(`const response = await fetch('${baseUrl}/api/cms/write/blog-posts', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'sk_seu_token_aqui'
    },
    body: JSON.stringify({
        data: { title: "Novo Post" },
        status: "PUBLISHED"
    })
});
const data = await response.json();`, "code5")}
                                    >
                                        {copied === "code5" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </Button>
<pre>{`const response = await fetch('${baseUrl}/api/cms/write/blog-posts', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'sk_seu_token_aqui'
    },
    body: JSON.stringify({
        data: { title: "Novo Post" },
        status: "PUBLISHED"
    })
});
const data = await response.json();`}</pre>
                                </div>
                            </TabsContent>
                            <TabsContent value="curl">
                                <div className="relative bg-muted p-4 rounded-md font-mono text-xs overflow-x-auto">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute right-2 top-2 h-6 w-6"
                                        onClick={() => copyToClipboard(`curl -X POST "${baseUrl}/api/cms/write/blog-posts" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sk_seu_token_aqui" \\
  -d '{"data": {"title": "Novo Post"}, "status": "PUBLISHED"}'`, "code6")}
                                    >
                                        {copied === "code6" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </Button>
<pre>{`curl -X POST "${baseUrl}/api/cms/write/blog-posts" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sk_seu_token_aqui" \\
  -d '{"data": {"title": "Novo Post"}, "status": "PUBLISHED"}'`}</pre>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </CardContent>
            </Card>
        </section>

        {/* Endpoint: List Entries */}
        <section className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-green-600 hover:bg-green-700">GET</Badge>
                            <code className="text-lg font-mono">/:clientSlug/:typeSlug</code>
                        </div>
                    </div>
                    <CardTitle className="mt-4">Listar Conteúdo da Coleção</CardTitle>
                    <CardDescription>Retorna uma lista de todos os itens publicados de uma coleção específica.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Parâmetros de URL</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            <li><code className="text-foreground font-mono">clientSlug</code>: O slug da sua conta (ex: <code>minha-agencia</code>).</li>
                            <li><code className="text-foreground font-mono">typeSlug</code>: O slug da coleção que você criou (ex: <code>blog-posts</code>, <code>banners</code>).</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Exemplo de Requisição</h4>
                        <Tabs defaultValue="js" className="w-full">
                            <TabsList>
                                <TabsTrigger value="js">JavaScript (Fetch)</TabsTrigger>
                                <TabsTrigger value="curl">cURL</TabsTrigger>
                            </TabsList>
                            <TabsContent value="js">
                                <div className="relative bg-muted p-4 rounded-md font-mono text-xs overflow-x-auto">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute right-2 top-2 h-6 w-6"
                                        onClick={() => copyToClipboard(`const response = await fetch('${baseUrl}/api/cms/public/minha-agencia/blog-posts');
const data = await response.json();
console.log(data);`, "code1")}
                                    >
                                        {copied === "code1" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </Button>
<pre>{`const response = await fetch('${baseUrl}/api/cms/public/minha-agencia/blog-posts');
const data = await response.json();
console.log(data);`}</pre>
                                </div>
                            </TabsContent>
                            <TabsContent value="curl">
                                <div className="relative bg-muted p-4 rounded-md font-mono text-xs overflow-x-auto">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute right-2 top-2 h-6 w-6"
                                        onClick={() => copyToClipboard(`curl -X GET "${baseUrl}/api/cms/public/minha-agencia/blog-posts"`, "code2")}
                                    >
                                        {copied === "code2" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </Button>
<pre>{`curl -X GET "${baseUrl}/api/cms/public/minha-agencia/blog-posts"`}</pre>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Exemplo de Resposta (200 OK)</h4>
                        <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-xs overflow-x-auto">
<pre>{`[
  {
    "id": "cm...",
    "slug": "meu-primeiro-post",
    "status": "PUBLISHED",
    "data": {
      "title": "Meu Primeiro Post",
      "cover": "https://...",
      "content": "Conteúdo do post..."
    },
    "updatedAt": "2024-03-20T10:00:00.000Z"
  },
  ...
]`}</pre>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </section>

        {/* Endpoint: Get Single Entry */}
        <section className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-green-600 hover:bg-green-700">GET</Badge>
                            <code className="text-lg font-mono">/:clientSlug/:typeSlug/:entrySlug</code>
                        </div>
                    </div>
                    <CardTitle className="mt-4">Obter Item Único</CardTitle>
                    <CardDescription>Retorna os detalhes de um único item baseado no slug do item.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Parâmetros de URL</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            <li><code className="text-foreground font-mono">entrySlug</code>: O slug específico do item (ex: <code>meu-primeiro-post</code>).</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Exemplo de Requisição</h4>
                        <Tabs defaultValue="js" className="w-full">
                            <TabsList>
                                <TabsTrigger value="js">JavaScript (Fetch)</TabsTrigger>
                                <TabsTrigger value="curl">cURL</TabsTrigger>
                            </TabsList>
                            <TabsContent value="js">
                                <div className="relative bg-muted p-4 rounded-md font-mono text-xs overflow-x-auto">
                                     <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute right-2 top-2 h-6 w-6"
                                        onClick={() => copyToClipboard(`const response = await fetch('${baseUrl}/api/cms/public/minha-agencia/blog-posts/meu-post');
const data = await response.json();`, "code3")}
                                    >
                                        {copied === "code3" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </Button>
<pre>{`const response = await fetch('${baseUrl}/api/cms/public/minha-agencia/blog-posts/meu-post');
const data = await response.json();`}</pre>
                                </div>
                            </TabsContent>
                            <TabsContent value="curl">
                                <div className="relative bg-muted p-4 rounded-md font-mono text-xs overflow-x-auto">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute right-2 top-2 h-6 w-6"
                                        onClick={() => copyToClipboard(`curl -X GET "${baseUrl}/api/cms/public/minha-agencia/blog-posts/meu-post"`, "code4")}
                                    >
                                        {copied === "code4" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </Button>
<pre>{`curl -X GET "${baseUrl}/api/cms/public/minha-agencia/blog-posts/meu-post"`}</pre>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                     <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Exemplo de Resposta (200 OK)</h4>
                        <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-xs overflow-x-auto">
<pre>{`{
  "id": "cm...",
  "slug": "meu-post",
  "status": "PUBLISHED",
  "data": {
    "title": "Meu Post",
    "content": "..."
  },
  "updatedAt": "..."
}`}</pre>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </section>

        <Separator />

        <div className="space-y-2">
            <h2 className="text-2xl font-semibold">API de Gerenciamento</h2>
            <p className="text-muted-foreground">Endpoints para criar coleções, configurar campos e gerenciar entradas programaticamente. Requer autenticação via API Key.</p>
        </div>

        {/* Management: Create Collection */}
        <section className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-blue-600 hover:bg-blue-700">POST</Badge>
                            <code className="text-lg font-mono">/types</code>
                        </div>
                    </div>
                    <CardTitle className="mt-4">Criar Nova Coleção (Schema)</CardTitle>
                    <CardDescription>Cria um novo tipo de conteúdo e define seus campos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 rounded text-sm text-yellow-500">
                        <strong>Atenção:</strong> Este endpoint requer autenticação via API Key.
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Corpo da Requisição (JSON)</h4>
                        <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-xs overflow-x-auto">
<pre>{`{
  "name": "Produtos",
  "slug": "produtos", // Opcional (gerado auto se vazio)
  "description": "Catálogo de produtos",
  "fields": [
    { "key": "nome", "label": "Nome do Produto", "type": "text", "required": true },
    { "key": "preco", "label": "Preço", "type": "number", "required": true },
    { "key": "imagem", "label": "Foto", "type": "image" }
  ]
}`}</pre>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </section>

        {/* Management: List Collections */}
        <section className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-green-600 hover:bg-green-700">GET</Badge>
                            <code className="text-lg font-mono">/types</code>
                        </div>
                    </div>
                    <CardTitle className="mt-4">Listar Coleções</CardTitle>
                    <CardDescription>Retorna todas as coleções configuradas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 rounded text-sm text-yellow-500">
                        <strong>Atenção:</strong> Este endpoint requer autenticação via API Key.
                    </div>
                </CardContent>
            </Card>
        </section>

        {/* Management: Update/Delete Entry */}
        <section className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-orange-600 hover:bg-orange-700">PUT</Badge>
                            <Badge className="bg-red-600 hover:bg-red-700">DELETE</Badge>
                            <code className="text-lg font-mono">/entries/:entryId</code>
                        </div>
                    </div>
                    <CardTitle className="mt-4">Atualizar ou Deletar Entrada</CardTitle>
                    <CardDescription>Operações diretas em um item específico pelo ID.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 rounded text-sm text-yellow-500">
                        <strong>Atenção:</strong> Estes endpoints requerem autenticação via API Key.
                    </div>
                    
                     <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Exemplo Body (PUT)</h4>
                        <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-xs overflow-x-auto">
<pre>{`{
  "data": { "nome": "Produto Atualizado" },
  "status": "PUBLISHED"
}`}</pre>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </section>

        {/* Tips */}
        <section className="bg-muted/30 p-6 rounded-lg border">
            <h3 className="font-semibold mb-2">Dicas de Integração</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>O campo <code>data</code> contém todos os campos personalizados que você definiu no CMS.</li>
                <li>Imagens são retornadas como URLs string. Certifique-se de que seu frontend pode renderizá-las.</li>
                <li>Apenas itens com status <strong>PUBLISHED</strong> são retornados por esta API pública.</li>
                <li>Para Next.js, recomendamos usar <code>revalidate</code> ou <code>no-store</code> dependendo da frequência de atualização do seu conteúdo.</li>
            </ul>
        </section>

      </div>
    </div>
  )
}