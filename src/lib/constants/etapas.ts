export const ETAPAS = [
  {
    id: 1,
    nombre: "Nueva Vida en Cristo",
    descripcion: "Fundamentos de la fe cristiana para nuevos creyentes",
    objetivos: [
      "Entender la salvación por gracia",
      "Establecer una vida de oración",
      "Comenzar a leer la Biblia",
      "Entender el bautismo",
    ],
    materialRecomendado: "Nueva Vida en Cristo - Material de discipulado",
  },
  {
    id: 2,
    nombre: "Consolidación",
    descripcion: "Afirmando las bases de la fe y la vida cristiana",
    objetivos: [
      "Desarrollar una vida de devocional consistente",
      "Entender la importancia de la iglesia local",
      "Aprender sobre los dones espirituales",
      "Comenzar a servir",
    ],
    materialRecomendado: "Consolidación - Material de discipulado",
  },
  {
    id: 3,
    nombre: "Carácter",
    descripcion: "Desarrollando el carácter de Cristo",
    objetivos: [
      "Estudio del fruto del Espíritu",
      "Vida de integridad",
      "Relaciones saludables",
      "Mayordomía",
    ],
    materialRecomendado: "Carácter - Material de discipulado",
  },
  {
    id: 4,
    nombre: "Servicio",
    descripcion: "Preparándose para servir y hacer discípulos",
    objetivos: [
      "Identificar el llamado",
      "Desarrollar liderazgo",
      "Aprender a discipular a otros",
      "Multiplicación",
    ],
    materialRecomendado: "Servicio - Material de discipulado",
  },
] as const;

export type EtapaId = (typeof ETAPAS)[number]["id"];
