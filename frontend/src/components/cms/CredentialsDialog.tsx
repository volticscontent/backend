"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Key, Trash2, Copy, Check, Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface Credential {
    id: string
    serviceName: string
    apiKey: string
    createdAt: string
}

export function CredentialsDialog() {
    const [isOpen, setIsOpen] = useState(false)
    const [newKeyName, setNewKeyName] = useState("")
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const queryClient = useQueryClient()

    const { data: credentials = [], isLoading } = useQuery<Credential[]>({
        queryKey: ['credentials'],
        enabled: isOpen,
        queryFn: async () => {
            const token = localStorage.getItem("agency_token")
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credentials`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (!res.ok) throw new Error("Failed to fetch credentials")
            return res.json()
        }
    })

    const createCredentialMutation = useMutation({
        mutationFn: async () => {
            const token = localStorage.getItem("agency_token")
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credentials`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name: newKeyName })
            })
            if (!res.ok) throw new Error("Failed to create credential")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['credentials'] })
            setNewKeyName("")
            toast({ title: "Chave criada com sucesso!" })
        },
        onError: () => {
            toast({ title: "Erro ao criar chave", variant: "destructive" })
        }
    })

    const deleteCredentialMutation = useMutation({
        mutationFn: async (id: string) => {
            const token = localStorage.getItem("agency_token")
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credentials/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (!res.ok) throw new Error("Failed to delete credential")
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['credentials'] })
            toast({ title: "Chave revogada" })
        }
    })

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
        toast({ title: "Chave copiada!" })
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Key className="h-4 w-4" />
                    Credenciais
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Credenciais de API</DialogTitle>
                    <DialogDescription>
                        Gerencie as chaves de API para acesso externo ao CMS.
                        Atenção: As chaves têm acesso total de leitura e escrita ao seu conteúdo.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex gap-2 items-end">
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="keyName">Nova Chave</Label>
                            <Input 
                                id="keyName" 
                                placeholder="Ex: App Mobile, Integração Website" 
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                            />
                        </div>
                        <Button 
                            onClick={() => createCredentialMutation.mutate()} 
                            disabled={!newKeyName.trim() || createCredentialMutation.isPending}
                        >
                            {createCredentialMutation.isPending ? "Gerando..." : <><Plus className="mr-2 h-4 w-4" /> Gerar</>}
                        </Button>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Chave</TableHead>
                                    <TableHead>Criada em</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-4">Carregando...</TableCell>
                                    </TableRow>
                                ) : credentials.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                            Nenhuma credencial criada.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    credentials.map((cred) => (
                                        <TableRow key={cred.id}>
                                            <TableCell className="font-medium">{cred.serviceName}</TableCell>
                                            <TableCell className="font-mono text-xs">
                                                <div className="flex items-center gap-2">
                                                    {cred.apiKey}
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6" 
                                                        onClick={() => handleCopy(cred.apiKey, cred.id)}
                                                    >
                                                        {copiedId === cred.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell>{new Date(cred.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-destructive hover:text-destructive/90"
                                                    onClick={() => deleteCredentialMutation.mutate(cred.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
