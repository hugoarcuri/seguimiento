"use client";

import { useState } from "react";

export interface PersonaOracion {
  nombre: string;
  apellido: string;
  estado: string;
}

export interface EvaluacionWizardState {
  saved: boolean;
  setSaved: (v: boolean) => void;
  par: number;
  setPar: (v: number) => void;
  valores: Record<number, number>;
  setValores: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  evalObs: Record<number, string>;
  setEvalObs: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  ministerioSeleccionado: string;
  setMinisterioSeleccionado: (v: string) => void;
  ministerioCustom: string;
  setMinisterioCustom: (v: string) => void;
  pasajeLeido: string;
  setPasajeLeido: (v: string) => void;
  materialLeido: string;
  setMaterialLeido: (v: string) => void;
  motivosOracion: string;
  setMotivosOracion: (v: string) => void;
  personasOracion: PersonaOracion[];
  setPersonasOracion: React.Dispatch<React.SetStateAction<PersonaOracion[]>>;
  editPersonaIdx: number;
  setEditPersonaIdx: (v: number) => void;
  editPersonaVal: PersonaOracion;
  setEditPersonaVal: React.Dispatch<React.SetStateAction<PersonaOracion>>;
  guardandoPersonas: boolean;
  setGuardandoPersonas: (v: boolean) => void;
  mensajeoAlguien?: number;
  setMensajeoAlguien: (v?: number) => void;
  mensajeoQuien: string;
  setMensajeoQuien: (v: string) => void;
  visitoAlguien?: number;
  setVisitoAlguien: (v?: number) => void;
  visitoQuien: string;
  setVisitoQuien: (v: string) => void;
  actoServicio?: number;
  setActoServicio: (v?: number) => void;
  actoServicioDesc: string;
  setActoServicioDesc: (v: string) => void;
  obsGenerales: string;
  setObsGenerales: (v: string) => void;
  compromisos: string[];
  setCompromisos: React.Dispatch<React.SetStateAction<string[]>>;
  desafioPersonalizado: string;
  setDesafioPersonalizado: (v: string) => void;
  proximaReunion: string;
  setProximaReunion: (v: string) => void;
  reset: () => void;
}

const editPersonaInicial = { nombre: "", apellido: "", estado: "Oración" };

export function useEvaluacionWizard(): EvaluacionWizardState {
  const [saved, setSaved] = useState(false);
  const [par, setPar] = useState(1);
  const [valores, setValores] = useState<Record<number, number>>({});
  const [evalObs, setEvalObs] = useState<Record<number, string>>({});
  const [ministerioSeleccionado, setMinisterioSeleccionado] = useState("");
  const [ministerioCustom, setMinisterioCustom] = useState("");
  const [pasajeLeido, setPasajeLeido] = useState("");
  const [materialLeido, setMaterialLeido] = useState("");
  const [motivosOracion, setMotivosOracion] = useState("");
  const [personasOracion, setPersonasOracion] = useState<PersonaOracion[]>([]);
  const [editPersonaIdx, setEditPersonaIdx] = useState(-1);
  const [editPersonaVal, setEditPersonaVal] = useState<PersonaOracion>(editPersonaInicial);
  const [guardandoPersonas, setGuardandoPersonas] = useState(false);
  const [mensajeoAlguien, setMensajeoAlguien] = useState<number | undefined>(undefined);
  const [mensajeoQuien, setMensajeoQuien] = useState("");
  const [visitoAlguien, setVisitoAlguien] = useState<number | undefined>(undefined);
  const [visitoQuien, setVisitoQuien] = useState("");
  const [actoServicio, setActoServicio] = useState<number | undefined>(undefined);
  const [actoServicioDesc, setActoServicioDesc] = useState("");
  const [obsGenerales, setObsGenerales] = useState("");
  const [compromisos, setCompromisos] = useState<string[]>([]);
  const [desafioPersonalizado, setDesafioPersonalizado] = useState("");
  const [proximaReunion, setProximaReunion] = useState("");

  const reset = () => {
    setSaved(false);
    setPar(1);
    setValores({});
    setEvalObs({});
    setMinisterioSeleccionado("");
    setMinisterioCustom("");
    setPasajeLeido("");
    setMaterialLeido("");
    setMotivosOracion("");
    setPersonasOracion([]);
    setEditPersonaIdx(-1);
    setEditPersonaVal(editPersonaInicial);
    setMensajeoAlguien(undefined);
    setMensajeoQuien("");
    setVisitoAlguien(undefined);
    setVisitoQuien("");
    setActoServicio(undefined);
    setActoServicioDesc("");
    setObsGenerales("");
    setCompromisos([]);
    setDesafioPersonalizado("");
    setProximaReunion("");
  };

  return {
    saved, setSaved, par, setPar,
    valores, setValores, evalObs, setEvalObs,
    ministerioSeleccionado, setMinisterioSeleccionado,
    ministerioCustom, setMinisterioCustom,
    pasajeLeido, setPasajeLeido, materialLeido, setMaterialLeido, motivosOracion, setMotivosOracion,
    personasOracion, setPersonasOracion, editPersonaIdx, setEditPersonaIdx, editPersonaVal, setEditPersonaVal,
    guardandoPersonas, setGuardandoPersonas,
    mensajeoAlguien, setMensajeoAlguien, mensajeoQuien, setMensajeoQuien,
    visitoAlguien, setVisitoAlguien, visitoQuien, setVisitoQuien,
    actoServicio, setActoServicio, actoServicioDesc, setActoServicioDesc,
    obsGenerales, setObsGenerales, compromisos, setCompromisos,
    desafioPersonalizado, setDesafioPersonalizado, proximaReunion, setProximaReunion,
    reset,
  };
}
