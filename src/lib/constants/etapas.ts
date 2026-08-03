export const ETAPAS = [
  {
    id: 1,
    nombre: "No Creyente",
    descripcion: "Persona que aún no ha entregado su vida a Cristo",
    objetivos: [
      "Compartir el evangelio",
      "Invitarlo a la iglesia",
      "Establecer una relación de amistad",
      "Orar por su salvación",
    ],
    materialRecomendado: "Evangelismo - Material de acompañamiento",
  },
  {
    id: 2,
    nombre: "Bebé Espiritual",
    descripcion: "Nuevo creyente que necesita fundamentos de la fe",
    objetivos: [
      "Entender la salvación por gracia",
      "Establecer una vida de oración",
      "Comenzar a leer la Biblia",
      "Entender el bautismo",
    ],
    materialRecomendado: "Bebé Espiritual - Material de discipulado",
  },
  {
    id: 3,
    nombre: "Niño Espiritual",
    descripcion: "Creyente en crecimiento que afirma las bases de su fe",
    objetivos: [
      "Desarrollar una vida devocional consistente",
      "Entender la importancia de la iglesia local",
      "Aprender sobre los dones espirituales",
      "Comenzar a servir",
    ],
    materialRecomendado: "Niño Espiritual - Material de discipulado",
  },
  {
    id: 4,
    nombre: "Joven Espiritual",
    descripcion: "Creyente que desarrolla el carácter de Cristo",
    objetivos: [
      "Estudio del fruto del Espíritu",
      "Vida de integridad",
      "Relaciones saludables",
      "Mayordomía",
    ],
    materialRecomendado: "Joven Espiritual - Material de discipulado",
  },
  {
    id: 5,
    nombre: "Padre/Madre Espiritual",
    descripcion: "Creyente maduro que discipula y multiplica",
    objetivos: [
      "Identificar el llamado",
      "Desarrollar liderazgo",
      "Aprender a discipular a otros",
      "Multiplicación",
    ],
    materialRecomendado: "Padre/Madre Espiritual - Material de discipulado",
  },
] as const;

export type EtapaId = (typeof ETAPAS)[number]["id"];