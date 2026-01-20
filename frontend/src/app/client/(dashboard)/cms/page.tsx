"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash, Edit, ArrowLeft, Layers, FileText, Code } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"

// --- Interfaces ---

interface CmsField {
  key: string
  label: string
  type: 'text' | 'long-text' | 'number' | 'boolean' | 'date' | 'image'
  required: boolean
}

interface CmsContentType {
  id: string
  name: string
  slug: string
  description?: string
  fields: CmsField[]
  createdAt: string
  updatedAt: string
}

interface CmsContentEntry {
  id: string
  contentTypeId: string
  data: any
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  slug?: string
  createdAt: string
  updatedAt: string
}

// --- Components ---

export default function CmsPage() {
  const [view, setView] = useState<'list-types' | 'create-type' | 'edit-type' | 'list-entries' | 'create-entry' | 'edit-entry'>('list-types')
  const [selectedType, setSelectedType] = useState<CmsContentType | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<CmsContentEntry | null>(null)

  const queryClient = useQueryClient()
  const token = typeof window !== 'undefined' ? localStorage.getItem("agency_token") : null

  // --- Queries ---

  const { data: types, isLoading: isLoadingTypes } = useQuery<CmsContentType[]>({
    queryKey: ['cms-types'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cms/types`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch types")
      return res.json()
    }
  })

  const { data: entries, isLoading: isLoadingEntries } = useQuery<CmsContentEntry[]>({
    queryKey: ['cms-entries', selectedType?.id],
    queryFn: async () => {
      if (!selectedType) return []
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cms/entries/${selectedType.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch entries")
      return res.json()
    },
    enabled: !!selectedType && (view === 'list-entries' || view === 'create-entry' || view === 'edit-entry')
  })

  // --- Actions ---

  const handleCreateType = () => {
    setSelectedType(null)
    setView('create-type')
  }

  const handleEditType = (type: CmsContentType) => {
    setSelectedType(type)
    setView('edit-type')
  }

  const handleManageEntries = (type: CmsContentType) => {
    setSelectedType(type)
    setView('list-entries')
  }

  const handleCreateEntry = () => {
    setSelectedEntry(null)
    setView('create-entry')
  }

  const handleEditEntry = (entry: CmsContentEntry) => {
    setSelectedEntry(entry)
    setView('edit-entry')
  }

  const handleBackToTypes = () => {
    setSelectedType(null)
    setView('list-types')
  }

  const handleBackToEntries = () => {
    setView('list-entries')
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">CMS / Conteúdo</h2>
            <p className="text-muted-foreground">Gerencie tipos de conteúdo e suas entradas.</p>
        </div>
        {view === 'list-types' && (
            <Button onClick={handleCreateType}>
                <Plus className="mr-2 h-4 w-4" /> Novo Tipo
            </Button>
        )}
        {view === 'list-entries' && (
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleBackToTypes}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button onClick={handleCreateEntry}>
                    <Plus className="mr-2 h-4 w-4" /> Nova Entrada
                </Button>
            </div>
        )}
        {(view === 'create-type' || view === 'edit-type') && (
            <Button variant="outline" onClick={handleBackToTypes}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
        )}
        {(view === 'create-entry' || view === 'edit-entry') && (
            <Button variant="outline" onClick={handleBackToEntries}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
        )}
      </div>

      {view === 'list-types' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingTypes ? (
                <p>Carregando...</p>
            ) : types?.map((type) => (
                <Card key={type.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>{type.name}</span>
                            <Layers className="h-5 w-5 text-muted-foreground" />
                        </CardTitle>
                        <CardDescription>{type.description || "Sem descrição"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            <code className="text-xs bg-muted p-1 rounded w-fit">Slug: {type.slug}</code>
                            <div className="flex justify-end gap-2 mt-4">
                                <ApiInfoDialog type={type} />
                                <Button variant="outline" size="sm" onClick={() => handleEditType(type)}>
                                    <Edit className="h-4 w-4 mr-1" /> Editar
                                </Button>
                                <Button size="sm" onClick={() => handleManageEntries(type)}>
                                    <FileText className="h-4 w-4 mr-1" /> Conteúdo
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
            {types?.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                    Nenhum tipo de conteúdo criado.
                </div>
            )}
        </div>
      )}

      {(view === 'create-type' || view === 'edit-type') && (
        <TypeForm 
            initialData={selectedType} 
            onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['cms-types'] })
                setView('list-types')
            }} 
        />
      )}

      {view === 'list-entries' && selectedType && (
        <Card>
            <CardHeader>
                <CardTitle>Entradas de {selectedType.name}</CardTitle>
                <CardDescription>Gerenciando conteúdo para {selectedType.slug}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Identificador / Slug</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Criado em</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries?.map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell>
                                    <div className="font-medium">{entry.slug || entry.id}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                        {/* Try to show first text field */}
                                        {Object.values(entry.data).find(v => typeof v === 'string') as string || '...'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={entry.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                                        {entry.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => handleEditEntry(entry)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {entries?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    Nenhuma entrada encontrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}

      {(view === 'create-entry' || view === 'edit-entry') && selectedType && (
        <EntryForm 
            type={selectedType} 
            initialData={selectedEntry} 
            onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['cms-entries', selectedType.id] })
                setView('list-entries')
            }} 
        />
      )}
    </div>
  )
}

// --- Sub-Components ---

function TypeForm({ initialData, onSuccess }: { initialData: CmsContentType | null, onSuccess: () => void }) {
    const [name, setName] = useState(initialData?.name || "")
    const [slug, setSlug] = useState(initialData?.slug || "")
    const [description, setDescription] = useState(initialData?.description || "")
    const [fields, setFields] = useState<CmsField[]>(initialData?.fields || [])

    const token = typeof window !== 'undefined' ? localStorage.getItem("agency_token") : null

    const mutation = useMutation({
        mutationFn: async () => {
            const url = initialData 
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/cms/types/${initialData.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/api/cms/types`
            
            const method = initialData ? "PUT" : "POST"

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name, slug, description, fields })
            })
            
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to save type")
            }
            return res.json()
        },
        onSuccess: () => {
            onSuccess()
        },
        onError: (err) => {
            alert(err.message)
        }
    })

    const addField = () => {
        setFields([...fields, { key: "", label: "", type: "text", required: false }])
    }

    const removeField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index))
    }

    const updateField = (index: number, updates: Partial<CmsField>) => {
        const newFields = [...fields]
        newFields[index] = { ...newFields[index], ...updates }
        setFields(newFields)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{initialData ? "Editar Tipo" : "Novo Tipo de Conteúdo"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Post do Blog" />
                    </div>
                    <div className="space-y-2">
                        <Label>Slug (Identificador API)</Label>
                        <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Ex: blog-post" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Label className="text-lg font-semibold">Campos (Schema)</Label>
                        <Button size="sm" variant="outline" onClick={addField}>
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Campo
                        </Button>
                    </div>
                    
                    {fields.map((field, index) => (
                        <div key={index} className="flex gap-4 items-end border p-4 rounded-md bg-muted/20">
                            <div className="space-y-2 flex-1">
                                <Label>Label (Nome visível)</Label>
                                <Input value={field.label} onChange={(e) => updateField(index, { label: e.target.value })} />
                            </div>
                            <div className="space-y-2 flex-1">
                                <Label>Key (Chave JSON)</Label>
                                <Input value={field.key} onChange={(e) => updateField(index, { key: e.target.value })} />
                            </div>
                            <div className="space-y-2 w-[150px]">
                                <Label>Tipo</Label>
                                <Select value={field.type} onValueChange={(val: any) => updateField(index, { type: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Texto Curto</SelectItem>
                                        <SelectItem value="long-text">Texto Longo</SelectItem>
                                        <SelectItem value="number">Número</SelectItem>
                                        <SelectItem value="boolean">Booleano</SelectItem>
                                        <SelectItem value="date">Data</SelectItem>
                                        <SelectItem value="image">Imagem (URL)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="block mb-2">Obrigatório</Label>
                                <Switch checked={field.required} onCheckedChange={(c) => updateField(index, { required: c })} />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeField(index)} className="text-destructive">
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                        {mutation.isPending ? "Salvando..." : "Salvar Tipo"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function ApiInfoDialog({ type }: { type: CmsContentType }) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.seusite.com";
    const exampleUrl = `${baseUrl}/api/cms/public/<seu-slug>/${type.slug}`;
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" title="Integração API">
                    <Code className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Integração API: {type.name}</DialogTitle>
                    <DialogDescription>
                        Use este endpoint para buscar o conteúdo publicado. Substitua &lt;seu-slug&gt; pelo seu identificador de cliente.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-md overflow-x-auto">
                        <code className="text-sm">
                            GET {exampleUrl}
                        </code>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-semibold">Exemplo (JavaScript):</p>
                        <pre className="bg-slate-950 text-slate-50 p-4 rounded-md text-xs overflow-x-auto">
{`// Buscar todas as entradas publicadas
const response = await fetch('${exampleUrl}');
const data = await response.json();

// Buscar uma entrada específica por slug
const entry = await fetch('${exampleUrl}/<entry-slug>');`}
                        </pre>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function EntryForm({ type, initialData, onSuccess }: { type: CmsContentType, initialData: CmsContentEntry | null, onSuccess: () => void }) {
    const [data, setData] = useState<any>(initialData?.data || {})
    const [slug, setSlug] = useState(initialData?.slug || "")
    const [status, setStatus] = useState(initialData?.status || "DRAFT")

    const token = typeof window !== 'undefined' ? localStorage.getItem("agency_token") : null

    // Initialize default values based on type fields
    // useEffect(() => {
    //    if (!initialData) {
    //        const defaults: any = {}
    //        type.fields.forEach(f => defaults[f.key] = "")
    //        setData(defaults)
    //    }
    // }, [])

    const mutation = useMutation({
        mutationFn: async () => {
            const url = initialData 
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/cms/entries/${initialData.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/api/cms/entries/${type.id}`
            
            const method = initialData ? "PUT" : "POST"

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ data, slug, status })
            })
            
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to save entry")
            }
            return res.json()
        },
        onSuccess: () => {
            onSuccess()
        },
        onError: (err) => {
            alert(err.message)
        }
    })

    const handleFieldChange = (key: string, value: any) => {
        setData({ ...data, [key]: value })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{initialData ? "Editar Entrada" : `Nova Entrada: ${type.name}`}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 bg-muted/10 p-4 rounded-md border">
                    <div className="space-y-2">
                        <Label>Slug da Entrada (Opcional)</Label>
                        <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="minha-entrada-1" />
                        <p className="text-xs text-muted-foreground">Usado para buscar esta entrada específica via API.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={(value) => setStatus(value as "DRAFT" | "PUBLISHED" | "ARCHIVED")}>
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

                <div className="space-y-4">
                    <Label className="text-lg font-semibold">Conteúdo</Label>
                    {type.fields.map((field) => (
                        <div key={field.key} className="space-y-2">
                            <Label>
                                {field.label} {field.required && <span className="text-destructive">*</span>}
                            </Label>
                            
                            {field.type === 'text' && (
                                <Input 
                                    value={data[field.key] || ""} 
                                    onChange={(e) => handleFieldChange(field.key, e.target.value)} 
                                />
                            )}
                            {field.type === 'long-text' && (
                                <Textarea 
                                    value={data[field.key] || ""} 
                                    onChange={(e) => handleFieldChange(field.key, e.target.value)} 
                                    rows={5}
                                />
                            )}
                            {field.type === 'number' && (
                                <Input 
                                    type="number"
                                    value={data[field.key] || ""} 
                                    onChange={(e) => handleFieldChange(field.key, Number(e.target.value))} 
                                />
                            )}
                            {field.type === 'date' && (
                                <Input 
                                    type="date"
                                    value={data[field.key] || ""} 
                                    onChange={(e) => handleFieldChange(field.key, e.target.value)} 
                                />
                            )}
                            {field.type === 'boolean' && (
                                <div className="flex items-center space-x-2">
                                    <Switch 
                                        checked={!!data[field.key]} 
                                        onCheckedChange={(c) => handleFieldChange(field.key, c)} 
                                    />
                                    <span>{data[field.key] ? "Sim" : "Não"}</span>
                                </div>
                            )}
                            {field.type === 'image' && (
                                <div className="space-y-2">
                                    <Input 
                                        value={data[field.key] || ""} 
                                        onChange={(e) => handleFieldChange(field.key, e.target.value)} 
                                        placeholder="https://..."
                                    />
                                    {data[field.key] && (
                                        <img src={data[field.key]} alt="Preview" className="h-20 w-20 object-cover rounded border" />
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                        {mutation.isPending ? "Salvando..." : "Salvar Entrada"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
