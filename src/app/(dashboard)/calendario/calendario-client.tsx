"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarPlus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { redirectToGoogleAuth, handleRedirectCallback, getToken, listEvents, createEvent, type GoogleEvent } from "@/lib/google-calendar";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EncuentroData = any[];

interface CalendarioClientProps {
  encuentros: EncuentroData;
  clientId: string;
}

export function CalendarioClient({ encuentros, clientId }: CalendarioClientProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [connected, setConnected] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    const gotToken = handleRedirectCallback();
    if (gotToken) {
      setConnected(true);
      toast.success("Google Calendar conectado");
    } else {
      getToken().then(() => setConnected(true)).catch(() => {});
    }
  }, [clientId]);

  const handleConnect = useCallback(() => {
    redirectToGoogleAuth(clientId);
  }, [clientId]);

  const handleSync = useCallback(async () => {
    if (!date) return;
    setSyncing(true);
    try {
      const token = await getToken();
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      const events = await listEvents(token, monthStart.toISOString(), monthEnd.toISOString());
      setGoogleEvents(events);
      toast.success("Calendario sincronizado");
    } catch {
      toast.error("Error al sincronizar");
    } finally {
      setSyncing(false);
    }
  }, [date]);

  useEffect(() => {
    if (connected && date) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, date]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreateEvent = useCallback(async (encuentro: any) => {
    try {
      const token = await getToken();
      const start = new Date(encuentro.fecha);
      if (encuentro.hora) {
        const [h, m] = encuentro.hora.split(":");
        start.setHours(parseInt(h), parseInt(m));
      }
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      await createEvent(token, {
        summary: encuentro.tema_tratado,
        description: encuentro.notas || "",
        start: start.toISOString(),
        end: end.toISOString(),
      });
      toast.success("Evento creado en Google Calendar");
      handleSync();
    } catch {
      toast.error("Error al crear evento");
    }
  }, [handleSync]);

  const encuentrosDelDia = encuentros.filter((e) => {
    if (!date) return false;
    const d = new Date(e.fecha);
    return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
  });

  const googleEventsDelDia = googleEvents.filter((e) => {
    if (!date) return false;
    const d = new Date(e.start.dateTime);
    return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
  });

  const fechasConEncuentros = encuentros.map((e) => new Date(e.fecha));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendario</h1>
          <p className="text-muted-foreground">Visualiza y sincroniza encuentros con Google Calendar</p>
        </div>
        {clientId && (
          <div className="flex items-center gap-2">
            {!connected ? (
              <Button onClick={handleConnect} variant="outline">
                <CalendarPlus className="mr-2 h-4 w-4" />
                Conectar Google Calendar
              </Button>
            ) : (
              <Button onClick={handleSync} variant="outline" disabled={syncing}>
                {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {syncing ? "Sincronizando..." : "Sincronizar"}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-[400px_1fr]">
        <Card>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={es}
              className="rounded-md"
              modifiers={{ hasEncuentro: fechasConEncuentros }}
              modifiersStyles={{
                hasEncuentro: {
                  fontWeight: "bold",
                  backgroundColor: "hsl(var(--primary) / 0.1)",
                  borderRadius: "100%",
                },
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {date ? format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : "Selecciona una fecha"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {encuentrosDelDia.length === 0 && googleEventsDelDia.length === 0 ? (
              <p className="text-muted-foreground">No hay eventos para esta fecha</p>
            ) : (
              <div className="space-y-3">
                {encuentrosDelDia.map((encuentro) => (
                  <Card key={encuentro.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{encuentro.tema_tratado}</p>
                          <p className="text-sm text-muted-foreground">
                            {encuentro.discipulos?.nombre
                              ? `${encuentro.discipulos.apellido}, ${encuentro.discipulos.nombre}`
                              : "—"}
                          </p>
                          {encuentro.lugar && <p className="text-xs text-muted-foreground">{encuentro.lugar}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {encuentro.hora && <Badge variant="secondary">{encuentro.hora.slice(0, 5)}</Badge>}
                          {connected && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCreateEvent(encuentro)}
                              title="Crear evento en Google Calendar"
                            >
                              <CalendarPlus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {googleEventsDelDia.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{event.summary}</p>
                          {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                        </div>
                        {event.start.dateTime && (
                          <Badge variant="outline">
                            {format(new Date(event.start.dateTime), "HH:mm")}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
