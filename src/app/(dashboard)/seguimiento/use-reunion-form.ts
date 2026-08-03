"use client";

import { useState } from "react";

export interface PersonaOracion {
  nombre: string;
  apellido: string;
  estado: string;
}

export interface ReunionFormState {
  saved: boolean;
  setSaved: (v: boolean) => void;
  valores: Record<number, number>;
  setValores: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  evalObs: Record<number, string>;
  setEvalObs: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  estudios: boolean;
  setEstudios: (v: boolean) => void;
  trabajo: boolean;
  setTrabajo: (v: boolean) => void;
  positivo: string;
  setPositivo: (v: string) => void;
  desafioPrincipal: string;
  setDesafioPrincipal: (v: string) => void;
  compromisos: string[];
  setCompromisos: React.Dispatch<React.SetStateAction<string[]>>;
  desafioPersonalizado: string;
  setDesafioPersonalizado: (v: string) => void;
  proximaReunion: string;
  setProximaReunion: (v: string) => void;
  personasOracion: PersonaOracion[];
  setPersonasOracion: React.Dispatch<React.SetStateAction<PersonaOracion[]>>;
  reset: () => void;
}

export function useReunionForm(): ReunionFormState {
  const [saved, setSaved] = useState(false);
  const [valores, setValores] = useState<Record<number, number>>({});
  const [evalObs, setEvalObs] = useState<Record<number, string>>({});
  const [estudios, setEstudios] = useState(true);
  const [trabajo, setTrabajo] = useState(true);
  const [positivo, setPositivo] = useState("");
  const [desafioPrincipal, setDesafioPrincipal] = useState("");
  const [compromisos, setCompromisos] = useState<string[]>([]);
  const [desafioPersonalizado, setDesafioPersonalizado] = useState("");
  const [proximaReunion, setProximaReunion] = useState("");
  const [personasOracion, setPersonasOracion] = useState<PersonaOracion[]>([]);

  const reset = () => {
    setSaved(false);
    setValores({});
    setEvalObs({});
    setEstudios(true);
    setTrabajo(true);
    setPositivo("");
    setDesafioPrincipal("");
    setCompromisos([]);
    setDesafioPersonalizado("");
    setProximaReunion("");
    setPersonasOracion([]);
  };

  return {
    saved, setSaved,
    valores, setValores,
    evalObs, setEvalObs,
    estudios, setEstudios,
    trabajo, setTrabajo,
    positivo, setPositivo,
    desafioPrincipal, setDesafioPrincipal,
    compromisos, setCompromisos,
    desafioPersonalizado, setDesafioPersonalizado,
    proximaReunion, setProximaReunion,
    personasOracion, setPersonasOracion,
    reset,
  };
}
