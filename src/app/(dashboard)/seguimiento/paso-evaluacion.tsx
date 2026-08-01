"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck, Heart } from "lucide-react";
import Link from "next/link";
import { AreaEvaluacionCards } from "./area-evaluacion-card";
import { PersonaOracionForm } from "./persona-oracion-form";
import { desafiosPredefinidos } from "./data";
import type { SupabaseArea, SupabaseIndicador } from "./data";
import type { EvaluacionWizardState } from "./use-evaluacion-wizard";

interface PasoDataProps {
  w: EvaluacionWizardState;
  areas: SupabaseArea[];
  indicadores: SupabaseIndicador[];
  objetivosNivel: Record<string, string>;
  etapaId?: number;
}

export function PasoVidaDevocional({ w, areas, indicadores, objetivosNivel, etapaId }: PasoDataProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
      <div className="space-y-3">
        <AreaEvaluacionCards
          areaIds={[1]}
          areas={areas} indicadores={indicadores} objetivosNivel={objetivosNivel} etapaId={etapaId}
          valores={w.valores} onValor={(id, v) => w.setValores((prev) => ({ ...prev, [id]: v }))}
          evalObs={w.evalObs} onEvalObs={(id, t) => w.setEvalObs((prev) => ({ ...prev, [id]: t }))}
          ministerioSeleccionado={w.ministerioSeleccionado} onMinisterio={w.setMinisterioSeleccionado}
          ministerioCustom={w.ministerioCustom} onMinisterioCustom={w.setMinisterioCustom}
        />
        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm">Lectura y oración de la semana</CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Pasaje bíblico, libro o capítulo que leyó esta semana</Label>
              <Input placeholder="Ej: Juan 1-5, Salmos 23..." className="h-9 text-sm" value={w.pasajeLeido} onChange={(e) => w.setPasajeLeido(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Libro cristiano u otro material leído</Label>
              <Input placeholder="Título del libro o material..." className="h-9 text-sm" value={w.materialLeido} onChange={(e) => w.setMaterialLeido(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">¿Cuáles fueron sus motivos de oración en la semana?</Label>
              <Textarea rows={2} className="text-sm" value={w.motivosOracion} onChange={(e) => w.setMotivosOracion(e.target.value)} placeholder="Familia, trabajo, salud, etc." />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        <AreaEvaluacionCards
          areaIds={[4]}
          areas={areas} indicadores={indicadores} objetivosNivel={objetivosNivel} etapaId={etapaId}
          valores={w.valores} onValor={(id, v) => w.setValores((prev) => ({ ...prev, [id]: v }))}
          evalObs={w.evalObs} onEvalObs={(id, t) => w.setEvalObs((prev) => ({ ...prev, [id]: t }))}
          ministerioSeleccionado={w.ministerioSeleccionado} onMinisterio={w.setMinisterioSeleccionado}
          ministerioCustom={w.ministerioCustom} onMinisterioCustom={w.setMinisterioCustom}
        />
        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm">Contacto y servicio semanal</CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">¿Envió mensaje o llamó a alguien esta semana?</Label>
              <div className="flex gap-2 mt-1">
                {["No", "Sí"].map((label, v) => (
                  <button key={v} type="button" onClick={() => { w.setMensajeoAlguien(v); if (v === 0) w.setMensajeoQuien(""); }}
                    className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                      (w.mensajeoAlguien ?? -1) === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >{label}</button>
                ))}
              </div>
              {w.mensajeoAlguien === 1 && (
                <Input placeholder="¿A quién?" className="h-9 text-sm mt-1" value={w.mensajeoQuien} onChange={(e) => w.setMensajeoQuien(e.target.value)} />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">¿Visitó a alguien en la semana?</Label>
              <div className="flex gap-2 mt-1">
                {["No", "Sí"].map((label, v) => (
                  <button key={v} type="button" onClick={() => { w.setVisitoAlguien(v); if (v === 0) w.setVisitoQuien(""); }}
                    className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                      (w.visitoAlguien ?? -1) === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >{label}</button>
                ))}
              </div>
              {w.visitoAlguien === 1 && (
                <Input placeholder="¿A quién visitó?" className="h-9 text-sm mt-1" value={w.visitoQuien} onChange={(e) => w.setVisitoQuien(e.target.value)} />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">¿Realizó algún acto de servicio?</Label>
              <div className="flex gap-2 mt-1">
                {["No", "Sí"].map((label, v) => (
                  <button key={v} type="button" onClick={() => { w.setActoServicio(v); if (v === 0) w.setActoServicioDesc(""); }}
                    className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                      (w.actoServicio ?? -1) === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >{label}</button>
                ))}
              </div>
              {w.actoServicio === 1 && (
                <Input placeholder="¿Qué hizo?" className="h-9 text-sm mt-1" value={w.actoServicioDesc} onChange={(e) => w.setActoServicioDesc(e.target.value)} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface PasoServicioProps extends PasoDataProps {
  onGuardarPersonas: () => void;
}

export function PasoServicioEvangelismo({ w, areas, indicadores, objetivosNivel, etapaId, onGuardarPersonas }: PasoServicioProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
      <div className="space-y-3">
        <AreaEvaluacionCards
          areaIds={[5, 7]}
          areas={areas} indicadores={indicadores} objetivosNivel={objetivosNivel} etapaId={etapaId}
          valores={w.valores} onValor={(id, v) => w.setValores((prev) => ({ ...prev, [id]: v }))}
          evalObs={w.evalObs} onEvalObs={(id, t) => w.setEvalObs((prev) => ({ ...prev, [id]: t }))}
          ministerioSeleccionado={w.ministerioSeleccionado} onMinisterio={w.setMinisterioSeleccionado}
          ministerioCustom={w.ministerioCustom} onMinisterioCustom={w.setMinisterioCustom}
        />
      </div>
      <div className="space-y-3">
        <AreaEvaluacionCards
          areaIds={[6, 8]}
          areas={areas} indicadores={indicadores} objetivosNivel={objetivosNivel} etapaId={etapaId}
          valores={w.valores} onValor={(id, v) => w.setValores((prev) => ({ ...prev, [id]: v }))}
          evalObs={w.evalObs} onEvalObs={(id, t) => w.setEvalObs((prev) => ({ ...prev, [id]: t }))}
          ministerioSeleccionado={w.ministerioSeleccionado} onMinisterio={w.setMinisterioSeleccionado}
          ministerioCustom={w.ministerioCustom} onMinisterioCustom={w.setMinisterioCustom}
        />
        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm">Acompañamiento evangelístico</CardTitle>
            <CardDescription className="text-xs">Gestioná el proceso completo de evangelismo (oración → servicio → evangelismo)</CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <Link href="/evangelismo" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <Heart className="h-4 w-4" /> Ir a Acompañamiento Evangelístico →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm">Personas por las que ora</CardTitle>
            <CardDescription className="text-xs">Registrá las personas por las que el discípulo está orando</CardDescription>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            {w.personasOracion.map((p, i) => (
              w.editPersonaIdx === i ? (
                <div key={i} className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2">
                  <Input className="h-7 text-xs flex-1" value={w.editPersonaVal.nombre} onChange={(e) => w.setEditPersonaVal((v) => ({ ...v, nombre: e.target.value }))} placeholder="Nombre" />
                  <Input className="h-7 text-xs flex-1" value={w.editPersonaVal.apellido} onChange={(e) => w.setEditPersonaVal((v) => ({ ...v, apellido: e.target.value }))} placeholder="Apellido" />
                  <select className="h-7 text-xs rounded-md border border-input bg-transparent px-1" value={w.editPersonaVal.estado} onChange={(e) => w.setEditPersonaVal((v) => ({ ...v, estado: e.target.value }))}>
                    <option>Oración</option><option>Oración y servicio</option><option>Oración y predicación</option>
                  </select>
                  <button type="button" onClick={() => { w.setPersonasOracion((prev) => prev.map((x, j) => j === i ? w.editPersonaVal : x)); w.setEditPersonaIdx(-1); }} className="text-green-600 hover:text-green-700 text-xs font-medium">OK</button>
                  <button type="button" onClick={() => w.setEditPersonaIdx(-1)} className="text-muted-foreground hover:text-foreground text-xs">X</button>
                </div>
              ) : (
                <div key={i} className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg p-2">
                  <span className="flex-1">{p.nombre} {p.apellido}</span>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">{p.estado}</span>
                  <button type="button" onClick={() => { w.setEditPersonaVal({ nombre: p.nombre, apellido: p.apellido, estado: p.estado }); w.setEditPersonaIdx(i); }} className="text-blue-400 hover:text-blue-600 text-xs font-medium">Editar</button>
                  <button type="button" onClick={() => w.setPersonasOracion((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs font-medium">Quitar</button>
                </div>
              )
            ))}
            <PersonaOracionForm onAgregar={(p) => w.setPersonasOracion((prev) => [...prev, p])} />
            <button type="button" onClick={onGuardarPersonas} disabled={w.guardandoPersonas}
              className="w-full h-9 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >{w.guardandoPersonas ? "Guardando..." : "Guardar personas"}</button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function PasoObservaciones({ w }: { w: EvaluacionWizardState }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
      <Card>
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm flex items-center gap-2"><Heart className="h-4 w-4" /> Observaciones pastorales</CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">¿Cómo percibes el ánimo espiritual del discípulo?</Label>
            <Textarea rows={2} className="text-sm" value={w.obsGenerales} onChange={(e) => w.setObsGenerales(e.target.value)} placeholder="Escribí tus observaciones..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Próxima reunión</Label>
            <Input type="date" className="h-9 text-sm" value={w.proximaReunion} onChange={(e) => w.setProximaReunion(e.target.value)} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Desafíos y compromisos</CardTitle>
          <CardDescription className="text-xs">Seleccioná los desafíos para esta semana</CardDescription>
        </CardHeader>
        <CardContent className="p-3 space-y-3">
          <div className="space-y-2">
            {desafiosPredefinidos.map((d) => (
              <label key={d} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="h-4 w-4" checked={w.compromisos.includes(d)} onChange={(e) => w.setCompromisos(e.target.checked ? [...w.compromisos, d] : w.compromisos.filter((x) => x !== d))} />
                {d}
              </label>
            ))}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Otro desafío personalizado</Label>
            <Input placeholder="Ej: Leer Santiago completo" className="h-9 text-sm" value={w.desafioPersonalizado} onChange={(e) => w.setDesafioPersonalizado(e.target.value)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
