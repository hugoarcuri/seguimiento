"use client";

import type { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors, FieldValues, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OPCIONES_DON_ESPIRITUAL } from "@/app/(dashboard)/discipuladores/discipulador-constants";
import { calcularEdad } from "@/lib/utils";
import type { Etapa } from "@/types/database";

export type PersonaFormMode = "admin-create" | "admin-edit" | "admin-discipulador" | "self-register";

interface PersonaFormFieldsProps<T extends FieldValues> {
  mode: PersonaFormMode;
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  errors: FieldErrors<T>;
  etapas?: Etapa[];
  discipuladores?: Array<{ id: string; nombre: string; apellido: string }>;
}

const inputClass = "h-11 md:h-10 text-sm";
const inputLabelClass = "text-xs font-medium text-muted-foreground";

const sexoOptions: Array<{ value: "M" | "F"; label: string }> = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
];

function EtapaLabel({ etapa }: { etapa: Etapa }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0 py-0.5">
      <span className="truncate text-sm font-medium">{etapa.nombre}</span>
      {etapa.descripcion && (
        <span className="truncate text-[11px] text-muted-foreground leading-snug">{etapa.descripcion}</span>
      )}
    </div>
  );
}

export function PersonaFormFields<T extends FieldValues>({
  mode,
  register,
  watch,
  setValue,
  errors,
  etapas = [],
  discipuladores = [],
}: PersonaFormFieldsProps<T>) {
  const sexo = watch("sexo" as Path<T>) as "M" | "F" | null | undefined;
  const fechaNacimiento = watch("fecha_nacimiento" as Path<T>) as string | undefined;
  const edad = fechaNacimiento ? calcularEdad(fechaNacimiento) : null;
  const bautizado = !!watch("bautizado" as Path<T>);
  const esMiembro = !!watch("es_miembro" as Path<T>);
  const donField = (watch("dones" as Path<T>) as string) || undefined;

  const isEditing = mode === "admin-edit";
  const showPassword = mode === "admin-create" || mode === "admin-edit" || mode === "admin-discipulador";
  const showConfirmPassword = false;
  const showEmail = mode !== "self-register";
  const showEtapa = mode === "admin-create" || mode === "admin-edit";
  const showDiscipulador = mode === "admin-create" || mode === "admin-edit";
  const showMinisterio = mode === "admin-create" || mode === "admin-edit";
  const showObservaciones = mode === "admin-create" || mode === "admin-edit";
  const showBautismo = mode === "admin-create" || mode === "admin-edit";
  const showFortalezas = mode === "admin-discipulador";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
        <div className="space-y-1">
          <Label htmlFor="apellido" className={inputLabelClass}>Apellido *</Label>
          <Input id="apellido" className={inputClass} {...register("apellido" as Path<T>)} aria-invalid={!!errors.apellido} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="nombre" className={inputLabelClass}>Nombre *</Label>
          <Input id="nombre" className={inputClass} {...register("nombre" as Path<T>)} aria-invalid={!!errors.nombre} />
        </div>
        <div className="space-y-1">
          <Label className={inputLabelClass}>Sexo</Label>
          <div className="flex flex-wrap gap-1.5">
            {sexoOptions.map((opt) => {
              const active = sexo === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("sexo" as Path<T>, opt.value as T["sexo"] & string, { shouldValidate: true })}
                  className={`min-h-11 md:min-h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="fecha_nacimiento" className={inputLabelClass}>Nacimiento</Label>
          <Input id="fecha_nacimiento" type="date" className={inputClass} {...register("fecha_nacimiento" as Path<T>)} />
          {edad !== null && <p className="text-xs text-muted-foreground">Edad: {edad} años</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="telefono" className={inputLabelClass}>Teléfono</Label>
          <Input id="telefono" className={inputClass} {...register("telefono" as Path<T>)} />
        </div>
        {showEmail && (
          <div className="space-y-1">
            <Label htmlFor="email" className={inputLabelClass}>Email *</Label>
            <Input id="email" type="email" className={inputClass} {...register("email" as Path<T>)} />
          </div>
        )}
        {showPassword && (
          <div className="space-y-1">
            <Label htmlFor="password" className={inputLabelClass}>{isEditing ? "Nueva contraseña" : "Contraseña"}</Label>
            <Input
              id="password" type="password" className={inputClass}
              {...register("password" as Path<T>)}
              placeholder={isEditing ? "Dejar vacío para mantener actual" : mode === "admin-create" ? "Opcional" : undefined}
            />
            {mode === "admin-create" && <p className="text-[11px] text-muted-foreground">Si se completa, el miembro podrá iniciar sesión</p>}
            {isEditing && <p className="text-[11px] text-muted-foreground">Solo completar si desea cambiar la contraseña</p>}
          </div>
        )}
        {showConfirmPassword && (
          <div className="space-y-1">
            <Label htmlFor="confirmPassword" className={inputLabelClass}>Confirmar Contraseña *</Label>
            <Input id="confirmPassword" type="password" className={inputClass} {...register("confirmPassword" as Path<T>)} />
          </div>
        )}
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="direccion" className={inputLabelClass}>Dirección</Label>
          <Input id="direccion" className={inputClass} {...register("direccion" as Path<T>)} />
        </div>
        <div className="space-y-1 sm:col-span-2 lg:col-span-4">
          <Label htmlFor="convive_con" className={inputLabelClass}>¿Con quién vive?</Label>
          <Input id="convive_con" className={inputClass} {...register("convive_con" as Path<T>)} placeholder="Ej.: con sus padres, solo/a..." />
        </div>
      </div>

      {showEtapa && etapas.length > 0 && (
        <div className="space-y-1 pt-2">
          <Label className={inputLabelClass}>Etapa *</Label>
          <Select
            onValueChange={(v) => setValue("etapa_id" as Path<T>, parseInt(v?.toString() ?? "1") as T["etapa_id"] & number)}
            defaultValue={String((watch("etapa_id" as Path<T>) as number) || 1)}
          >
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[20rem] min-h-14 *:data-[slot=select-value]:items-start *:data-[slot=select-value]:!line-clamp-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[15rem]">
              {etapas.map((etapa) => (
                <SelectItem key={etapa.id} value={String(etapa.id)}>
                  <EtapaLabel etapa={etapa} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.etapa_id && <p className="text-sm text-destructive">{String(errors.etapa_id?.message)}</p>}
        </div>
      )}

      {showDiscipulador && discipuladores.length > 0 && (
        <div className="space-y-1 pt-2">
          <Label className={inputLabelClass}>Discipulador</Label>
          <Select
            onValueChange={(v) => setValue("lider_id" as Path<T>, (v?.toString() === "none" ? "" : v?.toString() ?? "") as T["lider_id"] & string, { shouldValidate: true })}
            defaultValue={String((watch("lider_id" as Path<T>) as string) || "none")}
          >
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[15rem] min-h-11 md:min-h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[15rem]">
              <SelectItem value="none">Sin asignar</SelectItem>
              {discipuladores.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.apellido}, {d.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-2">
        <div className="space-y-1">
          <Label htmlFor="fecha_conversion" className={inputLabelClass}>Conversión</Label>
          <Input id="fecha_conversion" type="date" className={inputClass} {...register("fecha_conversion" as Path<T>)} />
        </div>
        <div className="space-y-1">
          <Label className={inputLabelClass}>Don Espiritual</Label>
          <Select value={donField} onValueChange={(v) => setValue("dones" as Path<T>, (v?.toString() === "none" ? "" : v?.toString() ?? "") as T["dones"] & string, { shouldValidate: true })}>
            <SelectTrigger className={inputClass}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin don</SelectItem>
              {OPCIONES_DON_ESPIRITUAL.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className={inputLabelClass}>Marcas espirituales</Label>
          <div className="flex h-11 md:min-h-8 flex-wrap items-center gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={bautizado}
                onCheckedChange={(v) => {
                  setValue("bautizado" as Path<T>, !!v as T["bautizado"] & boolean);
                  if (!v && showBautismo) setValue("fecha_bautismo" as Path<T>, "" as T["fecha_bautismo"] & string);
                }}
              />
              Está bautizado
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={esMiembro}
                onCheckedChange={(v) => setValue("es_miembro" as Path<T>, !!v as T["es_miembro"] & boolean)}
              />
              Es miembro
            </label>
          </div>
        </div>
        {showBautismo && bautizado && (
          <div className="space-y-1">
            <Label htmlFor="fecha_bautismo" className={inputLabelClass}>Fecha de bautismo</Label>
            <Input id="fecha_bautismo" type="date" className={inputClass} {...register("fecha_bautismo" as Path<T>)} />
          </div>
        )}
        {showMinisterio && (
          <div className="space-y-1">
            <Label className={inputLabelClass}>Ministerio</Label>
            <Input id="ministerio" className={inputClass} {...register("ministerio" as Path<T>)} />
          </div>
        )}
        {showObservaciones && (
          <div className="space-y-1">
            <Label htmlFor="observaciones" className={inputLabelClass}>Observaciones</Label>
            <Input id="observaciones" className={inputClass} {...register("observaciones" as Path<T>)} />
          </div>
        )}
      </div>

      {showFortalezas && (
        <>
          <div className="space-y-1">
            <Label htmlFor="fortalezas" className={inputLabelClass}>Fortalezas</Label>
            <textarea id="fortalezas" rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Fortalezas del discipulador..." {...register("fortalezas" as Path<T>)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="debilidades" className={inputLabelClass}>Debilidades</Label>
            <textarea id="debilidades" rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Debilidades del discipulador..." {...register("debilidades" as Path<T>)} />
          </div>
        </>
      )}
    </div>
  );
}
