"use client"

import { useEffect, useState } from "react"

export default function MasterDashboard() {
  const [user, setUser] = useState<{ name: string } | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("agency_admin_user")
    if (storedUser && storedUser !== "undefined") {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error("Erro ao fazer parse do usuário admin:", e)
        localStorage.removeItem("agency_admin_user")
      }
    } else if (storedUser === "undefined") {
      localStorage.removeItem("agency_admin_user")
    }
  }, [])

  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
      <div className="aspect-video rounded-xl bg-muted/50" />
      <div className="aspect-video rounded-xl bg-muted/50" />
      <div className="aspect-video rounded-xl bg-muted/50" />
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:col-span-3 p-6">
        <h1 className="text-2xl font-semibold mb-4">
          Bem-vindo ao Painel Master, {user?.name || "Admin"}
        </h1>
        <p className="text-muted-foreground">Esta é a visão geral do seu CRM Agency.</p>
      </div>
    </div>
  );
}
