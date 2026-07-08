"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CalendarioClientProps {
  encuentros: any[];
}

export function CalendarioClient({ encuentros }: CalendarioClientProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const encuentrosDelDia = encuentros.filter((e) => {
    if (!date) return false;
    const encuentroDate = new Date(e.fecha);
    return (
      encuentroDate.getDate() === date.getDate() &&
      encuentroDate.getMonth() === date.getMonth() &&
      encuentroDate.getFullYear() === date.getFullYear()
    );
  });

  const fechasConEncuentros = encuentros.map((e) => new Date(e.fecha));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendario</h1>
        <p className="text-muted-foreground">
          Visualiza los encuentros programados
        </p>
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
              modifiers={{
                hasEncuentro: fechasConEncuentros,
              }}
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
            {encuentrosDelDia.length === 0 ? (
              <p className="text-muted-foreground">
                No hay encuentros programados para esta fecha
              </p>
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
                          {encuentro.lugar && (
                            <p className="text-xs text-muted-foreground">
                              {encuentro.lugar}
                            </p>
                          )}
                        </div>
                        {encuentro.hora && (
                          <Badge variant="secondary">
                            {encuentro.hora.slice(0, 5)}
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
