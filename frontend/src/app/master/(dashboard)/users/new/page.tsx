"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

const clientFormSchema = z.object({
  name: z.string().min(2, {
    message: "Nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Email inválido.",
  }),
  slug: z.string().min(3, {
     message: "Slug deve ter pelo menos 3 caracteres."
  }).regex(/^[a-z0-9-]+$/, {
     message: "Slug deve conter apenas letras minúsculas, números e hífens."
  }),
  password: z.string().min(6, {
    message: "Senha deve ter pelo menos 6 caracteres.",
  }),
})

export default function NewUserPage() {
  const router = useRouter()

  const form = useForm<z.infer<typeof clientFormSchema>>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      email: "",
      slug: "",
      password: "",
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof clientFormSchema>) => {
       const token = localStorage.getItem("agency_admin_token")
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Falha ao criar cliente")
      }

      return res.json()
    },
    onSuccess: () => {
      alert("Cliente criado com sucesso!")
      router.push("/master/users")
    },
    onError: (error) => {
      alert(`Erro: ${error.message}`)
    }
  })

  function onSubmit(values: z.infer<typeof clientFormSchema>) {
    mutation.mutate(values)
  }

  return (
    <div className="space-y-6 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
            <CardHeader>
                <CardTitle>Novo Cliente</CardTitle>
                <CardDescription>Cadastre um novo cliente na plataforma.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Empresa/Cliente</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Minha Empresa Ltda" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Slug (Subdomínio)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="minhaempresa" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        O cliente acessará via {field.value || 'slug'}.agency.com
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email de Acesso</FormLabel>
                                    <FormControl>
                                        <Input placeholder="contato@minhaempresa.com" {...field} />
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
                                    <FormLabel>Senha Inicial</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="******" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "Criando..." : "Criar Cliente"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
