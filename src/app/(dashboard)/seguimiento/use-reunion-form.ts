"use client";

import { useState } from "react";

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
  reset: () => void;
}

export function useReunionForm(): ReunionFormState {
  const [saved, setSaved] = useState(false);
  const [valores, setValores] = useState<Record<number, number>>({});
  const [evalObs, setEvalObs] = useState<Record<number, string>>({});
  const [estudios, setEstudios] = useState(true);
  const [trabajo, setTrabajo] = useState(true);

  const reset = () => {
    setSaved(false);
    setValores({});
    setEvalObs({});
    setEstudios(true);
    setTrabajo(true);
  };

  return {
    saved, setSaved,
    valores, setValores,
    evalObs, setEvalObs,
    estudios, setEstudios,
    trabajo, setTrabajo,
    reset,
  };
}