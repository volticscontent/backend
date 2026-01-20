"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewTicketPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = searchParams.get('category')
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    subject: category === 'new_service' ? 'Solicitação de Novo Serviço' : '',
    priority: 'MEDIUM',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const storedUser = localStorage.getItem("agency_user")
      const token = localStorage.getItem("agency_token")
      
      if (!storedUser || !token) {
        toast({ title: "Erro de autenticação", variant: "destructive" })
        return
      }

      const user = JSON.parse(storedUser)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${user.slug}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast({ title: "Ticket criado com sucesso!" })
        router.push('/client/support')
      } else {
        toast({ title: "Erro ao criar ticket", variant: "destructive" })
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Erro de conexão", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Button variant="ghost" asChild className="mb-4">
            <Link href="/client/support">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Suporte
            </Link>
        </Button>

        <Card>
            <CardHeader>
                <CardTitle>Abrir Novo Chamado</CardTitle>
                <CardDescription>
                    Descreva seu problema ou solicitação detalhadamente para nossa equipe.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="subject">Assunto</Label>
                        <Input 
                            id="subject" 
                            placeholder="Resumo do problema" 
                            required
                            value={formData.subject}
                            onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="priority">Prioridade</Label>
                        <Select 
                            value={formData.priority} 
                            onValueChange={(value) => setFormData({...formData, priority: value})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a prioridade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LOW">Baixa</SelectItem>
                                <SelectItem value="MEDIUM">Média</SelectItem>
                                <SelectItem value="HIGH">Alta</SelectItem>
                                <SelectItem value="URGENT">Urgente</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">Mensagem</Label>
                        <Textarea 
                            id="message" 
                            placeholder="Descreva detalhadamente o que você precisa..." 
                            className="min-h-[150px]"
                            required
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={() => router.back()}>Cancelar</Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Criar Ticket
                    </Button>
                </CardFooter>
            </form>
        </Card>
    </div>
  )
}
