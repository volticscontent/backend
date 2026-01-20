"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Plus, Users, Layers, MoreHorizontal } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Collaborator {
  id: string
  name: string
  role?: string
}

interface CreateServicePayload {
    title: string
    sector?: string
    description?: string
    status: string
}

interface Service {
  id: string
  title: string
  sector?: string
  description?: string
  status: string
  createdAt: string
  collaborators: Collaborator[]
}

interface UserDetail {
  id: string
  name: string
  email: string
  slug: string
  services: Service[]
}

export default function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const userId = params.id as string
  
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false)

  // Form states for Edit
  const [editSector, setEditSector] = useState("")
  const [editCollaborators, setEditCollaborators] = useState<string[]>([])
  const [editStatus, setEditStatus] = useState("ACTIVE")

  // Form states for Add
  const [newServiceTitle, setNewServiceTitle] = useState("")
  const [newServiceSector, setNewServiceSector] = useState("")
  const [newServiceDesc, setNewServiceDesc] = useState("")

  // Fetch User Details
  const { data: user, isLoading: isLoadingUser } = useQuery<UserDetail>({
    queryKey: ["master", "user", userId],
    queryFn: async () => {
      const token = localStorage.getItem("agency_admin_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        localStorage.removeItem("agency_admin_token")
        window.location.href = "/master/login"
        throw new Error("Sessão expirada")
      }
      if (!res.ok) throw new Error("Falha ao buscar detalhes do cliente")
      return res.json()
    },
  })

  // Fetch Admins for selection
  const { data: admins } = useQuery({
    queryKey: ["master", "admins"],
    queryFn: async () => {
      const token = localStorage.getItem("agency_admin_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        localStorage.removeItem("agency_admin_token")
        window.location.href = "/master/login"
        throw new Error("Sessão expirada")
      }
      if (!res.ok) throw new Error("Falha ao buscar admins")
      return res.json()
    },
  })

  // Update Service Mutation
  const updateServiceMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (data: any) => {
        const token = localStorage.getItem("agency_admin_token")
        if (!selectedService) throw new Error("No service selected")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/services/${selectedService.id}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify(data)
        })
        if (res.status === 401) {
            localStorage.removeItem("agency_admin_token")
            window.location.href = "/master/login"
            throw new Error("Sessão expirada")
        }
        if (!res.ok) throw new Error("Falha ao atualizar serviço")
        return res.json()
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["master", "user", userId] })
        setIsEditDialogOpen(false)
        setSelectedService(null)
    }
  })

  // Add Service Mutation
  const addServiceMutation = useMutation({
    mutationFn: async (data: CreateServicePayload) => {
        const token = localStorage.getItem("agency_admin_token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/users/${userId}/services`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify(data)
        })
        if (res.status === 401) {
            localStorage.removeItem("agency_admin_token")
            window.location.href = "/master/login"
            throw new Error("Sessão expirada")
        }
        if (!res.ok) throw new Error("Falha ao criar serviço")
        return res.json()
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["master", "user", userId] })
        setIsAddServiceDialogOpen(false)
        setNewServiceTitle("")
        setNewServiceSector("")
        setNewServiceDesc("")
    }
  })

  const handleEditClick = (service: Service) => {
      setSelectedService(service)
      setEditSector(service.sector || "")
      setEditStatus(service.status)
      setEditCollaborators(service.collaborators.map((c: Collaborator) => c.id))
      setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
      updateServiceMutation.mutate({
          sector: editSector,
          status: editStatus,
          collaboratorIds: editCollaborators
      })
  }

  const handleAddService = () => {
      addServiceMutation.mutate({
          title: newServiceTitle,
          sector: newServiceSector,
          description: newServiceDesc,
          status: "ACTIVE"
      })
  }

  const toggleCollaborator = (adminId: string) => {
      setEditCollaborators(prev => 
          prev.includes(adminId) 
              ? prev.filter(id => id !== adminId)
              : [...prev, adminId]
      )
  }

  if (isLoadingUser) return <div className="p-8">Carregando...</div>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{user?.name}</h1>
          <p className="text-muted-foreground">{user?.slug} • {user?.email}</p>
        </div>
        <div className="ml-auto">
            <Button onClick={() => setIsAddServiceDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Serviço
            </Button>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {user?.services?.map((service: Service) => (
            <Card key={service.id} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${service.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'}`} />
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <Badge variant="outline" className="mb-2">{service.sector || "Sem Setor"}</Badge>
                            <CardTitle className="text-lg">{service.title}</CardTitle>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="-mr-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(service)}>
                                    Editar Configurações
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                    Desativar Serviço
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <CardDescription className="line-clamp-2">{service.description || "Sem descrição"}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Users className="h-4 w-4" />
                            Squad Responsável
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {service.collaborators && service.collaborators.length > 0 ? (
                                service.collaborators.map((collab: Collaborator) => (
                                    <Badge key={collab.id} variant="secondary" className="text-xs">
                                        {collab.name.split(" ")[0]}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-xs text-muted-foreground italic">Nenhum colaborador atribuído</span>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/50 p-3 text-xs text-muted-foreground flex justify-between">
                   <span>Criado em {format(new Date(service.createdAt), "dd/MM/yyyy")}</span>
                   <Badge variant={service.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px] h-5">
                       {service.status}
                   </Badge>
                </CardFooter>
            </Card>
        ))}
        {user?.services?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 border border-dashed rounded-lg text-muted-foreground">
                <Layers className="h-12 w-12 mb-4 opacity-20" />
                <p>Nenhum serviço contratado.</p>
                <Button variant="link" onClick={() => setIsAddServiceDialogOpen(true)}>Adicionar o primeiro serviço</Button>
            </div>
        )}
      </div>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configurar Serviço</DialogTitle>
            <DialogDescription>
              Defina o setor e a equipe responsável por este serviço.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Serviço</Label>
              <Input id="name" value={selectedService?.title} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sector">Setor / Área</Label>
              <Select value={editSector} onValueChange={setEditSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Marketing">Marketing & Social</SelectItem>
                  <SelectItem value="Desenvolvimento">Desenvolvimento & Tech</SelectItem>
                  <SelectItem value="Design">Design & Criativo</SelectItem>
                  <SelectItem value="Conteúdo">Conteúdo & Copy</SelectItem>
                  <SelectItem value="Consultoria">Consultoria & Estratégia</SelectItem>
                  <SelectItem value="Suporte">Suporte Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Squad Responsável</Label>
              <ScrollArea className="h-[200px] border rounded-md p-2">
                  <div className="space-y-2">
                      {admins?.map((admin: Collaborator) => (
                          <div key={admin.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded">
                              <Checkbox 
                                id={`admin-${admin.id}`} 
                                checked={editCollaborators.includes(admin.id)}
                                onCheckedChange={() => toggleCollaborator(admin.id)}
                              />
                              <label
                                htmlFor={`admin-${admin.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {admin.name} <span className="text-xs text-muted-foreground ml-1">({admin.role})</span>
                              </label>
                          </div>
                      ))}
                  </div>
              </ScrollArea>
            </div>
            <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ACTIVE">Ativo</SelectItem>
                        <SelectItem value="PAUSED">Pausado</SelectItem>
                        <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Serviço</DialogTitle>
            <DialogDescription>Adicione um novo serviço para este cliente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label>Título do Serviço</Label>
                <Input value={newServiceTitle} onChange={(e) => setNewServiceTitle(e.target.value)} placeholder="Ex: Gestão de Tráfego" />
            </div>
            <div className="grid gap-2">
                <Label>Descrição</Label>
                <Input value={newServiceDesc} onChange={(e) => setNewServiceDesc(e.target.value)} placeholder="Breve descrição..." />
            </div>
            <div className="grid gap-2">
              <Label>Setor</Label>
              <Select value={newServiceSector} onValueChange={setNewServiceSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Marketing">Marketing & Social</SelectItem>
                  <SelectItem value="Desenvolvimento">Desenvolvimento & Tech</SelectItem>
                  <SelectItem value="Design">Design & Criativo</SelectItem>
                  <SelectItem value="Conteúdo">Conteúdo & Copy</SelectItem>
                  <SelectItem value="Consultoria">Consultoria & Estratégia</SelectItem>
                  <SelectItem value="Suporte">Suporte Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddServiceDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddService} disabled={!newServiceTitle}>Criar Serviço</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
