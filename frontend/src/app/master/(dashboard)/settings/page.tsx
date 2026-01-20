"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useMutation } from "@tanstack/react-query"

const adminFormSchema = z.object({
  name: z.string().min(2, {
    message: "Nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Email inválido.",
  }),
  password: z.string().min(6, {
    message: "Senha deve ter pelo menos 6 caracteres.",
  }),
  role: z.string().min(1, {
    message: "Selecione uma função.",
  }),
})

type AdminFormValues = z.infer<typeof adminFormSchema>

export default function SettingsPage() {
  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "COLABORADOR",
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: AdminFormValues) => {
       const token = localStorage.getItem("agency_admin_token")
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/admins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(values),
      })

      if (res.status === 401) {
        localStorage.removeItem("agency_admin_token")
        window.location.href = "/master/login"
        throw new Error("Sessão expirada")
      }

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Falha ao criar admin")
      }

      return res.json()
    },
    onSuccess: () => {
      alert("Admin criado com sucesso!")
      form.reset()
    },
    onError: (error) => {
      alert(`Erro: ${error.message}`)
    }
  })

  function onSubmit(values: AdminFormValues) {
    mutation.mutate(values)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configurações</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie as configurações do sistema e administradores.
        </p>
      </div>
      <Separator />
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Novo Administrador</CardTitle>
                <CardDescription>Crie um novo usuário administrativo.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nome do admin" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="admin@agency.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Senha</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="******" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Criando..." : "Criar Admin"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Sistema</CardTitle>
                <CardDescription>Configurações gerais da plataforma.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Em breve: Configurações de SMTP, Whitelabel, etc.</p>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
