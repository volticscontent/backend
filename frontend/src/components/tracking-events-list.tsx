"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react"
import { useState } from "react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EventsListProps {
    datasetId: string
}

interface Delivery {
    id: string
    status: string
    responseCode: number
    responseBody: string
    destination: {
        platform: string
    }
}

interface TrackingEvent {
    id: string
    eventName: string
    eventId: string
    createdAt: string
    url: string
    userAgent: string
    ip: string
    eventData: Record<string, unknown>
    deliveries: Delivery[]
}

export function TrackingEventsList({ datasetId }: EventsListProps) {
    const [selectedEvent, setSelectedEvent] = useState<TrackingEvent | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ['trackingEvents', datasetId],
        queryFn: async () => {
            const token = localStorage.getItem("agency_token")
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracking/datasets/${datasetId}/events`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (!res.ok) throw new Error("Failed to fetch events")
            return res.json()
        },
        refetchInterval: 5000 // Poll every 5s for real-time updates
    })

    const events = data?.data || []

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Evento</TableHead>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Origem (URL)</TableHead>
                            <TableHead>Destinos</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    Carregando eventos...
                                </TableCell>
                            </TableRow>
                        ) : events.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    Nenhum evento recebido ainda.
                                </TableCell>
                            </TableRow>
                        ) : (
                            events.map((event: TrackingEvent) => (
                                <TableRow key={event.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{event.eventName}</span>
                                            <span className="text-xs text-muted-foreground font-mono">{event.eventId?.substring(0, 8)}...</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(event.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate" title={event.url}>
                                        {event.url}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {event.deliveries?.map((delivery: Delivery) => (
                                                <Badge 
                                                    key={delivery.id} 
                                                    variant="outline"
                                                    className={`gap-1 ${
                                                        delivery.status === 'SUCCESS' ? 'border-green-500 text-green-500' :
                                                        delivery.status === 'FAILED' ? 'border-red-500 text-red-500' :
                                                        'border-yellow-500 text-yellow-500'
                                                    }`}
                                                    title={`${delivery.destination.platform}: ${delivery.status}`}
                                                >
                                                    {delivery.destination.platform === 'META' ? 'Meta' : delivery.destination.platform}
                                                    {delivery.status === 'SUCCESS' && <CheckCircle className="h-3 w-3" />}
                                                    {delivery.status === 'FAILED' && <XCircle className="h-3 w-3" />}
                                                    {delivery.status === 'PENDING' && <Clock className="h-3 w-3" />}
                                                </Badge>
                                            ))}
                                            {(!event.deliveries || event.deliveries.length === 0) && (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(event)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Evento</DialogTitle>
                        <DialogDescription>
                            {selectedEvent?.eventName} - {selectedEvent && format(new Date(selectedEvent.createdAt), "PPpp", { locale: ptBR })}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <Tabs defaultValue="payload" className="w-full">
                        <TabsList>
                            <TabsTrigger value="payload">Payload Original</TabsTrigger>
                            <TabsTrigger value="deliveries">Entregas (Destinos)</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="payload" className="mt-4">
                            <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-muted/50">
                                <pre className="text-xs font-mono">
                                    {JSON.stringify({
                                        eventName: selectedEvent?.eventName,
                                        eventData: selectedEvent?.eventData,
                                        url: selectedEvent?.url,
                                        userAgent: selectedEvent?.userAgent,
                                        ip: selectedEvent?.ip,
                                        eventId: selectedEvent?.eventId
                                    }, null, 2)}
                                </pre>
                            </ScrollArea>
                        </TabsContent>
                        
                        <TabsContent value="deliveries" className="mt-4">
                            <ScrollArea className="h-[400px] w-full">
                                <div className="space-y-4">
                                    {selectedEvent?.deliveries?.map((delivery: Delivery) => (
                                        <div key={delivery.id} className="rounded-lg border p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{delivery.destination.platform}</span>
                                                    <Badge variant={delivery.status === 'SUCCESS' ? 'default' : 'destructive'}>
                                                        {delivery.status} ({delivery.responseCode})
                                                    </Badge>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    Tentativa 1
                                                </span>
                                            </div>
                                            
                                            {delivery.responseBody && (
                                                <div className="mt-2">
                                                    <p className="text-xs font-medium mb-1">Resposta da API:</p>
                                                    <div className="bg-muted p-2 rounded text-xs font-mono whitespace-pre-wrap break-all overflow-x-auto">
                                                        {(() => {
                                                            try {
                                                                return JSON.stringify(JSON.parse(delivery.responseBody), null, 2)
                                                            } catch {
                                                                return delivery.responseBody
                                                            }
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {(!selectedEvent?.deliveries || selectedEvent.deliveries.length === 0) && (
                                        <p className="text-center text-muted-foreground py-8">
                                            Nenhum registro de entrega encontrado.
                                        </p>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </div>
    )
}
