"use client"

import { TrackingDatasetsList } from "@/components/tracking-datasets-list"

export default function ServiceIntegrationsPage() {

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Conjuntos de Dados</h2>
        <p className="text-muted-foreground">Gerencie seus conjuntos de dados (Pixels e API de Conversões) de forma centralizada.</p>
      </div>
      
      <TrackingDatasetsList />
    </div>
  )
}
