"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
    FileEdit, 
    Code, 
    Copy, 
    Check, 
    Plus, 
    Search, 
    Settings, 
    FileText, 
    Image as ImageIcon,
    MoreHorizontal,
    LayoutTemplate,
    Trash2,
    Type,
    List,
    LayoutDashboard,
    ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { CredentialsDialog } from "@/components/cms/CredentialsDialog"
import Link from "next/link"

// --- Types ---

type FieldType = 'text' | 'rich-text' | 'number' | 'date' | 'boolean' | 'image' | 'url' | 'json'

interface CmsField {
    key: string
    label: string
    type: FieldType
    required: boolean
}

interface CmsContentType {
    id: string
    name: string
    slug: string
    description?: string
    fields: CmsField[]
    updatedAt: string
}

interface CmsContentEntry {
    id: string
    contentTypeId: string
    data: Record<string, any>
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    slug?: string
    updatedAt: string
}

const FIELD_TYPES: { value: FieldType; label: string; icon: any }[] = [
    { value: 'text', label: 'Texto Curto', icon: Type },
    { value: 'rich-text', label: 'Texto Longo', icon: FileText },
    { value: 'number', label: 'Número', icon: List },
    { value: 'date', label: 'Data', icon: List },
    { value: 'boolean', label: 'Booleano (Sim/Não)', icon: Check },
    { value: 'image', label: 'Imagem (URL)', icon: ImageIcon },
    { value: 'url', label: 'Link / URL', icon: Code },
    { value: 'json', label: 'Objeto JSON', icon: Code },
]

export default function ServiceCmsPage() {
  const [clientSlug, setClientSlug] = useState("")
  const [copied, setCopied] = useState(false)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>('dashboard')
  const [searchQuery, setSearchQuery] = useState("")
  
  // Dialog States
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false)
  
  // Editing States
  const [editingType, setEditingType] = useState<CmsContentType | null>(null)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  
  // Type Form State
  const [typeName, setTypeName] = useState("")
  const [typeSlug, setTypeSlug] = useState("")
  const [typeFields, setTypeFields] = useState<CmsField[]>([
      { key: 'title', label: 'Título', type: 'text', required: true }
  ])

  // Entry Form State
  const [entryData, setEntryData] = useState<Record<string, any>>({})
  const [entrySlug, setEntrySlug] = useState("")
  const [entryStatus, setEntryStatus] = useState("DRAFT")

  const queryClient = useQueryClient()

  useEffect(() => {
    const storedUser = localStorage.getItem("agency_user")
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser)
            if (user.slug) setClientSlug(user.slug)
        } catch (e) {
            console.error(e)
        }
    }
  }, [])

  // --- Queries ---

  const { data: contentTypes = [], isLoading: isLoadingTypes } = useQuery<CmsContentType[]>({
      queryKey: ['cmsTypes'],
      queryFn: async () => {
          const token = localStorage.getItem("agency_token")
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cms/types`, {
              headers: { "Authorization": `Bearer ${token}` }
          })
          if (!res.ok) throw new Error("Failed to fetch types")
          return res.json()
      }
  })

  const { data: entries = [], isLoading: isLoadingEntries } = useQuery<CmsContentEntry[]>({
      queryKey: ['cmsEntries', selectedTypeId],
      enabled: !!selectedTypeId && selectedTypeId !== 'dashboard',
      queryFn: async () => {
          const token = localStorage.getItem("agency_token")
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cms/entries/${selectedTypeId}`, {
              headers: { "Authorization": `Bearer ${token}` }
          })
          if (!res.ok) throw new Error("Failed to fetch entries")
          return res.json()
      }
  })

  // --- Mutations ---

  const createTypeMutation = useMutation({
      mutationFn: async () => {
          const token = localStorage.getItem("agency_token")
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cms/types`, {
              method: "POST",
              headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}` 
              },
              body: JSON.stringify({
                  name: typeName,
                  slug: typeSlug || typeName.toLowerCase().replace(/\s+/g, '-'),
                  fields: typeFields
              })
          })
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || "Failed to create type")
          }
          return res.json()
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['cmsTypes'] })
          setIsTypeDialogOpen(false)
          resetTypeForm()
          toast({ title: "Coleção criada com sucesso!" })
      },
      onError: (err) => {
          toast({ title: "Erro ao criar coleção", description: err.message, variant: "destructive" })
      }
  })

  const updateTypeMutation = useMutation({
    mutationFn: async () => {
        if (!editingType) return
        const token = localStorage.getItem("agency_token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cms/types/${editingType.id}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({
                name: typeName,
                slug: typeSlug,
                fields: typeFields
            })
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Failed to update type")
        }
        return res.json()
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['cmsTypes'] })
        setIsTypeDialogOpen(false)
        resetTypeForm()
        toast({ title: "Coleção atualizada com sucesso!" })
    },
    onError: (err) => {
        toast({ title: "Erro ao atualizar coleção", description: err.message, variant: "destructive" })
    }
  })

  const createEntryMutation = useMutation({
      mutationFn: async () => {
          const token = localStorage.getItem("agency_token")
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cms/entries/${selectedTypeId}`, {
              method: "POST",
              headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}` 
              },
              body: JSON.stringify({
                  data: entryData,
                  slug: entrySlug || undefined,
                  status: entryStatus
              })
          })
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || "Failed to create entry")
          }
          return res.json()
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['cmsEntries', selectedTypeId] })
          setIsEntryDialogOpen(false)
          resetEntryForm()
          toast({ title: "Item criado com sucesso!" })
      },
      onError: (err) => {
          toast({ title: "Erro ao criar item", description: err.message, variant: "destructive" })
      }
  })

  const updateEntryMutation = useMutation({
      mutationFn: async () => {
          if (!editingEntryId) return
          const token = localStorage.getItem("agency_token")
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cms/entries/${editingEntryId}`, {
              method: "PUT",
              headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}` 
              },
              body: JSON.stringify({
                  data: entryData,
                  slug: entrySlug || undefined,
                  status: entryStatus
              })
          })
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || "Failed to update entry")
          }
          return res.json()
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['cmsEntries', selectedTypeId] })
          setIsEntryDialogOpen(false)
          resetEntryForm()
          toast({ title: "Item atualizado com sucesso!" })
      },
      onError: (err) => {
          toast({ title: "Erro ao atualizar item", description: err.message, variant: "destructive" })
      }
  })

  const deleteTypeMutation = useMutation({
      mutationFn: async (id: string) => {
          const token = localStorage.getItem("agency_token")
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cms/types/${id}`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${token}` }
          })
          if (!res.ok) throw new Error("Failed to delete type")
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['cmsTypes'] })
          if (selectedTypeId) setSelectedTypeId('dashboard')
          toast({ title: "Coleção excluída" })
      },
      onError: (err) => {
          toast({ title: "Erro ao excluir coleção", description: err.message, variant: "destructive" })
      }
  })
  
  const deleteEntryMutation = useMutation({
      mutationFn: async (id: string) => {
          const token = localStorage.getItem("agency_token")
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cms/entries/${id}`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${token}` }
          })
          if (!res.ok) throw new Error("Failed to delete entry")
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['cmsEntries', selectedTypeId] })
          toast({ title: "Item excluído" })
      }
  })

  // --- Helpers ---

  const selectedType = contentTypes.find(t => t.id === selectedTypeId)
  
  const filteredEntries = entries.filter(entry => {
      const title = entry.data.title || entry.data.name || Object.values(entry.data)[0] || ''
      return String(title).toLowerCase().includes(searchQuery.toLowerCase())
  })

  const apiUrl = selectedType 
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/cms/public/${clientSlug}/${selectedType.slug}`
    : ''

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Field Builder Logic
  const addField = () => {
      setTypeFields([...typeFields, { key: '', label: '', type: 'text', required: false }])
  }

  const updateField = (index: number, field: Partial<CmsField>) => {
      const newFields = [...typeFields]
      newFields[index] = { ...newFields[index], ...field }
      // Auto-generate key from label if key is empty
      if (field.label && !newFields[index].key) {
          newFields[index].key = field.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      }
      setTypeFields(newFields)
  }

  const removeField = (index: number) => {
      setTypeFields(typeFields.filter((_, i) => i !== index))
  }

  // Form Resetters
  const resetTypeForm = () => {
      setTypeName("")
      setTypeSlug("")
      setTypeFields([{ key: 'title', label: 'Título', type: 'text', required: true }])
      setEditingType(null)
  }

  const resetEntryForm = () => {
      setEntryData({})
      setEntrySlug("")
      setEntryStatus("DRAFT")
      setEditingEntryId(null)
  }

  const openEditType = (type: CmsContentType) => {
      setEditingType(type)
      setTypeName(type.name)
      setTypeSlug(type.slug)
      setTypeFields(type.fields)
      setIsTypeDialogOpen(true)
  }

  const openEditEntry = (entry: CmsContentEntry) => {
      setEditingEntryId(entry.id)
      setEntryData(entry.data)
      setEntrySlug(entry.slug || "")
      setEntryStatus(entry.status)
      setIsEntryDialogOpen(true)
  }

  // --- Render ---

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b px-6 py-4 flex items-center justify-between bg-background">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">CMS & Conteúdo</h2>
            <p className="text-muted-foreground text-sm">Gerencie suas coleções e conteúdo dinâmico.</p>
        </div>
        <div className="flex gap-2">
            <CredentialsDialog />
            <Link href="/docs" target="_blank">
                <Button variant="outline">
                    <Code className="mr-2 h-4 w-4" />
                    Documentação API
                </Button>
            </Link>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de Coleções */}
        <div className="w-72 border-r bg-muted/10 p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="space-y-1">
                 <Button
                    variant={selectedTypeId === 'dashboard' ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedTypeId('dashboard')}
                >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Visão Geral
                </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between px-2 mb-2">
                <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Coleções</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                    resetTypeForm()
                    setIsTypeDialogOpen(true)
                }}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-1">
                {isLoadingTypes ? (
                    <div className="text-sm text-muted-foreground p-2">Carregando...</div>
                ) : contentTypes.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-2 text-center border border-dashed rounded-md">
                        Nenhuma coleção.
                    </div>
                ) : (
                    contentTypes.map((type) => (
                        <div key={type.id} className="group relative flex items-center">
                            <Button
                                variant={selectedTypeId === type.id ? "secondary" : "ghost"}
                                className="w-full justify-start pr-8"
                                onClick={() => setSelectedTypeId(type.id)}
                            >
                                <LayoutTemplate className="mr-2 h-4 w-4" />
                                <span className="truncate">{type.name}</span>
                            </Button>
                        </div>
                    ))
                )}
            </div>
            
            {selectedType && (
                <div className="mt-auto">
                    <Card className="bg-primary/5 border-none shadow-none">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Code className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-sm text-primary">API Endpoint</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3 break-all font-mono bg-background p-1 rounded border">
                                .../api/cms/public/{clientSlug}/{selectedType.slug}
                            </p>
                            <Button variant="secondary" size="sm" className="w-full h-7 text-xs" onClick={copyToClipboard}>
                                {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                                Copiar URL
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>

        {/* Área Principal */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {selectedTypeId === 'dashboard' ? (
                <div className="p-8 overflow-y-auto">
                    <h3 className="text-xl font-semibold mb-6">Visão Geral do Projeto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total de Coleções</CardTitle>
                                <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{contentTypes.length}</div>
                            </CardContent>
                        </Card>
                        {/* More stats could go here */}
                        <Card className="md:col-span-2 bg-muted/20 border-dashed">
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Acesso Rápido</CardTitle>
                            </CardHeader>
                            <CardContent className="flex gap-4">
                                <Button variant="outline" onClick={() => setIsTypeDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" /> Nova Coleção
                                </Button>
                                <Link href="/docs" target="_blank">
                                    <Button variant="outline">
                                        <Code className="mr-2 h-4 w-4" /> Ver Documentação
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>

                    <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Suas Coleções</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {contentTypes.map(type => (
                            <Card key={type.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedTypeId(type.id)}>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center justify-between">
                                        {type.name}
                                        <Badge variant="secondary">{type.fields.length} campos</Badge>
                                    </CardTitle>
                                    <CardDescription className="font-mono text-xs">{type.slug}</CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            ) : selectedType ? (
                <>
                    {/* Toolbar */}
                    <div className="border-b p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder={`Buscar em ${selectedType.name}...`} 
                                    className="pl-9" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => openEditType(selectedType)}>
                                <Settings className="mr-2 h-4 w-4" />
                                Configurações
                            </Button>
                            <Button onClick={() => {
                                resetEntryForm()
                                setIsEntryDialogOpen(true)
                            }}>
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Item
                            </Button>
                        </div>
                    </div>

                    {/* Tabela de Conteúdo */}
                    <div className="flex-1 overflow-auto p-6">
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Título / ID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Slug</TableHead>
                                        {selectedType.fields.slice(0, 2).map(f => (
                                            <TableHead key={f.key}>{f.label}</TableHead>
                                        ))}
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingEntries ? (
                                        <TableRow>
                                            <TableCell colSpan={5 + selectedType.fields.length} className="h-24 text-center">
                                                Carregando itens...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredEntries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5 + selectedType.fields.length} className="h-24 text-center">
                                                Nenhum item encontrado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredEntries.map((entry) => (
                                            <TableRow key={entry.id}>
                                                <TableCell className="font-medium">
                                                    {entry.data.title || entry.data.name || <span className="text-muted-foreground italic">Sem título</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={entry.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                                                        {entry.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground font-mono text-xs">
                                                    {entry.slug}
                                                </TableCell>
                                                {selectedType.fields.slice(0, 2).map(f => (
                                                    <TableCell key={f.key} className="max-w-[200px] truncate">
                                                        {typeof entry.data[f.key] === 'boolean' 
                                                            ? (entry.data[f.key] ? 'Sim' : 'Não')
                                                            : entry.data[f.key]}
                                                    </TableCell>
                                                ))}
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Abrir menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => openEditEntry(entry)}>
                                                                <FileEdit className="mr-2 h-4 w-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive" onClick={() => deleteEntryMutation.mutate(entry.id)}>
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                    <LayoutTemplate className="h-12 w-12 mb-4 opacity-20" />
                    <h3 className="text-lg font-semibold">Selecione uma Coleção</h3>
                </div>
            )}
        </div>
      </div>

      {/* Dialogs */}
      
      {/* Create/Edit Type Dialog */}
      <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{editingType ? "Editar Coleção" : "Nova Coleção"}</DialogTitle>
                <DialogDescription>Defina a estrutura dos dados para esta coleção.</DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nome da Coleção</Label>
                        <Input 
                            placeholder="Ex: Blog Posts" 
                            value={typeName}
                            onChange={(e) => setTypeName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Slug (Identificador API)</Label>
                        <Input 
                            placeholder="blog-posts" 
                            value={typeSlug}
                            onChange={(e) => setTypeSlug(e.target.value)}
                        />
                    </div>
                </div>

                <Separator />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Campos (Schema)</Label>
                        <Button variant="outline" size="sm" onClick={addField}>
                            <Plus className="mr-2 h-3 w-3" /> Adicionar Campo
                        </Button>
                    </div>

                    {typeFields.map((field, index) => (
                        <Card key={index} className="p-3">
                            <div className="flex items-start gap-3">
                                <div className="flex-1 grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Rótulo</Label>
                                        <Input 
                                            value={field.label} 
                                            onChange={(e) => updateField(index, { label: e.target.value })}
                                            placeholder="Ex: Título"
                                            className="h-8"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Chave (API)</Label>
                                        <Input 
                                            value={field.key} 
                                            onChange={(e) => updateField(index, { key: e.target.value })}
                                            placeholder="titulo"
                                            className="h-8 font-mono text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Tipo</Label>
                                        <Select 
                                            value={field.type} 
                                            onValueChange={(v) => updateField(index, { type: v as FieldType })}
                                        >
                                            <SelectTrigger className="h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {FIELD_TYPES.map(t => (
                                                    <SelectItem key={t.value} value={t.value}>
                                                        <div className="flex items-center gap-2">
                                                            <t.icon className="h-3 w-3" />
                                                            {t.label}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-2 pt-6">
                                        <Switch 
                                            checked={field.required}
                                            onCheckedChange={(c) => updateField(index, { required: c })}
                                        />
                                        <Label className="text-xs">Obrigatório</Label>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeField(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            <DialogFooter className="flex justify-between items-center sm:justify-between">
                {editingType ? (
                     <Button variant="destructive" onClick={() => {
                        if (confirm("ATENÇÃO: Isso excluirá a coleção e TODOS os itens nela. Deseja continuar?")) {
                            deleteTypeMutation.mutate(editingType.id)
                            setIsTypeDialogOpen(false)
                        }
                    }}>
                        Excluir Coleção
                    </Button>
                ) : <div></div>}
               
               <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsTypeDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={() => editingType ? updateTypeMutation.mutate() : createTypeMutation.mutate()}>
                        {createTypeMutation.isPending || updateTypeMutation.isPending ? "Salvando..." : (editingType ? "Salvar Alterações" : "Criar Coleção")}
                    </Button>
               </div>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Entry Dialog */}
      <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{editingEntryId ? "Editar Item" : "Novo Item"}: {selectedType?.name}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Slug (Opcional)</Label>
                        <Input 
                            placeholder="slug-automatico" 
                            value={entrySlug}
                            onChange={(e) => setEntrySlug(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={entryStatus} onValueChange={setEntryStatus}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DRAFT">Rascunho</SelectItem>
                                <SelectItem value="PUBLISHED">Publicado</SelectItem>
                                <SelectItem value="ARCHIVED">Arquivado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Separator />
                {selectedType?.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                        <Label>
                            {field.label}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        
                        {field.type === 'rich-text' || field.type === 'json' ? (
                            <Textarea 
                                value={
                                    field.type === 'json' && typeof entryData[field.key] === 'object'
                                        ? JSON.stringify(entryData[field.key], null, 2)
                                        : entryData[field.key] || ''
                                }
                                onChange={(e) => {
                                    let val: any = e.target.value
                                    if (field.type === 'json') {
                                        try {
                                            val = JSON.parse(e.target.value)
                                        } catch {
                                            // keep string
                                        }
                                    }
                                    setEntryData({...entryData, [field.key]: val})
                                }}
                                className={field.type === 'json' ? "font-mono text-xs" : "min-h-[100px]"}
                                placeholder={field.type === 'json' ? '{ "key": "value" }' : ''}
                                rows={field.type === 'json' ? 5 : 5}
                            />
                        ) : field.type === 'boolean' ? (
                            <div className="flex items-center gap-2">
                                <Switch 
                                    checked={!!entryData[field.key]}
                                    onCheckedChange={(c) => setEntryData({...entryData, [field.key]: c})}
                                />
                                <span className="text-sm text-muted-foreground">{entryData[field.key] ? 'Sim' : 'Não'}</span>
                            </div>
                        ) : field.type === 'image' ? (
                            <div className="space-y-2">
                                <Input 
                                    type="text"
                                    placeholder="https://exemplo.com/imagem.jpg"
                                    value={entryData[field.key] || ''}
                                    onChange={(e) => setEntryData({...entryData, [field.key]: e.target.value})}
                                />
                                {entryData[field.key] && (
                                    <div className="relative w-full h-40 bg-muted rounded-md overflow-hidden border">
                                        <img 
                                            src={entryData[field.key]} 
                                            alt="Preview" 
                                            className="w-full h-full object-cover"
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Input 
                                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                value={entryData[field.key] || ''}
                                onChange={(e) => setEntryData({...entryData, [field.key]: e.target.value})}
                            />
                        )}
                    </div>
                ))}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEntryDialogOpen(false)}>Cancelar</Button>
                <Button onClick={() => editingEntryId ? updateEntryMutation.mutate() : createEntryMutation.mutate()}>
                    {createEntryMutation.isPending || updateEntryMutation.isPending ? "Salvando..." : (editingEntryId ? "Salvar Alterações" : "Criar Item")}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
