export interface GuiaDiscipulador {
  objetivo: string;
  puntosClave: string[];
  consejos: string[];
  preguntas: string[];
}

export interface PasoEstudio {
  numero: number;
  etapaId: number;
  titulo: string;
  archivo: string;
  descripcion: string;
  guia: GuiaDiscipulador;
}

export const ETAPA_LABELS: Record<number, string> = {
  1: "No creyente",
  2: "Nuevo creyente",
  3: "Discípulo",
  4: "Siervo",
  5: "Multiplicador",
};

export const ETAPADescripcion: Record<number, string> = {
  1: "Material de evangelismo y acompañamiento para quienes aún no conocen a Cristo",
  2: "Fundamentos de la fe para quienes recién aceptaron a Cristo",
  3: "Formación en carácter y conocimiento bíblico para creyentes comprometidos",
  4: "Preparación para servir y liderar en la iglesia",
  5: "Formación para hacer discípulos y multiplicar el reino",
};

export const ESTUDIOS_BIBLICOS: PasoEstudio[] = [
  {
    numero: 1,
    etapaId: 2,
    titulo: "Seguros por siempre",
    archivo: "paso01-seguros-por-siempre.pdf",
    descripcion: "Comprender la seguridad de la salvación y la permanencia en Cristo.",
    guia: {
      objetivo: "Que el discípulo entienda que su salvación es un hecho seguro y permanente basado en la obra de Cristo.",
      puntosClave: [
        "La salvación es por gracia mediante la fe",
        "Nada puede separarnos del amor de Dios",
        "La seguridad eterna se sustenta en las promesas bíblicas",
      ],
      consejos: [
        "Lee los pasajes bíblicos en voz alta junto al discípulo",
        "Animarlo a escribir su testimonio personal de salvación",
        "Resolver dudas con paciencia, sin minimizar sus preguntas",
      ],
      preguntas: [
        "¿En qué momento exacto te diste por salvo?",
        "¿Qué sentías antes y después de aceptar a Cristo?",
        "¿Alguna vez dudaste de tu salvación? ¿Por qué?",
      ],
    },
  },
  {
    numero: 2,
    etapaId: 2,
    titulo: "Hablando con Dios",
    archivo: "paso02-hablando-con-dios.pdf",
    descripcion: "Desarrollar una vida de oración personal y consistente.",
    guia: {
      objetivo: "Que el discípulo establezca un hábito diario de oración y aprenda a comunicarse con Dios de forma natural.",
      puntosClave: [
        "La oración es conversación, no solo fórmulas",
        "La oración modelada por Jesús (Mateo 6:9-13)",
        "La constancia es más importante que la perfección",
      ],
      consejos: [
        "Enseñar con el ejemplo: orar juntos al inicio y cierre",
        "Sugerir un horario fijo para orar (mañana o noche)",
        "Comenzar con oraciones cortas y crecer gradualmente",
      ],
      preguntas: [
        "¿Cuánto tiempo dedicas actualmente a la oración?",
        "¿En qué momentos del día se te facilita orar?",
        "¿Qué dificultades encuentras al orar?",
      ],
    },
  },
  {
    numero: 3,
    etapaId: 2,
    titulo: "La lectura bíblica",
    archivo: "paso03-la-lectura-biblica.pdf",
    descripcion: "Aprender a leer, estudiar y aplicar la Biblia en la vida diaria.",
    guia: {
      objetivo: "Que el discípulo descubra la Biblia como guía práctica para su vida y desarrolle el hábito de leerla diariamente.",
      puntosClave: [
        "La Biblia es la Palabra viva de Dios",
        "Cómo leer la Biblia: método de 4 pasos",
        "La importancia de la aplicación personal",
      ],
      consejos: [
        "Recomendar un plan de lectura sencillo (un capítulo al día)",
        "Enseñar a subrayar y anotar versículos clave",
        "Compartir un versículo que le haya impactado personalmente",
      ],
      preguntas: [
        "¿Lees la Biblia actualmente? ¿Cuántas veces por semana?",
        "¿Qué libro de la Biblia te gustaría entender mejor?",
        "¿Alguna vez un versículo te habló directamente? ¿Cuál?",
      ],
    },
  },
  {
    numero: 4,
    etapaId: 2,
    titulo: "¿Quién es usted?",
    archivo: "paso04-quien-es-usted.pdf",
    descripcion: "Descubrir la identidad en Cristo y los roles del creyente.",
    guia: {
      objetivo: "Que el discípulo conozca quién es en Cristo y entienda su nueva identidad como hijo de Dios.",
      puntosClave: [
        "Somos hijos adoptados por Dios (Gálatas 4:4-7)",
        "Somos nueva creación en Cristo (2 Corintios 5:17)",
        "Nuestra identidad no depende de circunstancias",
      ],
      consejos: [
        "Pedir al discípulo que escriba 5 cosas que diga la Biblia sobre él",
        "Comparar su identidad antes y después de Cristo",
        "Usar ejemplos cotidianos para explicar la adopción",
      ],
      preguntas: [
        "¿Cómo te definías antes de conocer a Cristo?",
        "¿Qué dice la Biblia sobre quién eres?",
        "¿En qué momento sientes que tu identidad está amenazada?",
      ],
    },
  },
  {
    numero: 5,
    etapaId: 2,
    titulo: "Más que vencedores",
    archivo: "paso05-mas-que-vencedores.pdf",
    descripcion: "Vivir en victoria sobre el pecado, las pruebas y las dificultades.",
    guia: {
      objetivo: "Que el discípulo entienda que en Cristo tiene poder para vencer toda adversidad y tentación.",
      puntosClave: [
        "En Cristo somos más que vencedores (Romanos 8:37)",
        "Las pruebas producen fortaleza y carácter",
        "El arma contra la tentación es la Palabra de Dios",
      ],
      consejos: [
        "Compartir una victoria personal sobre una dificultad",
        "Enseñar a identificar las armas espirituales (Efesios 6)",
        "No minimizar sus luchas; validar y acompañar",
      ],
      preguntas: [
        "¿Cuál ha sido la mayor dificultad que has enfrentado?",
        "¿Cómo la superaste? ¿Qué papel jugó la fe?",
        "¿Cuál es tu mayor tentación actual?",
      ],
    },
  },
  {
    numero: 6,
    etapaId: 2,
    titulo: "Ganando almas",
    archivo: "paso06-ganando-almas.pdf",
    descripcion: "Aprender a compartir el evangelio con otros de forma efectiva.",
    guia: {
      objetivo: "Que el discípulo se sienta preparado para compartir su fe y ganar almas para Cristo.",
      puntosClave: [
        "La Gran Comisión es para todo creyente (Mateo 28:19-20)",
        "Cómo compartir el evangelio de forma sencilla",
        "La importancia del testimonio personal",
      ],
      consejos: [
        "Practicar juntos cómo compartir el evangelio en 2 minutos",
        "Hacer una lista de 3 personas para orar y compartir",
        "Acompañarlo en su primera experiencia de evangelismo",
      ],
      preguntas: [
        "¿Cuántas personas has compartido el evangelio este mes?",
        "¿Qué te impide compartir tu fe con más frecuencia?",
        "¿Quién en tu vida necesita conocer a Cristo?",
      ],
    },
  },
  {
    numero: 7,
    etapaId: 2,
    titulo: "Creciendo solo o en familia",
    archivo: "paso07-creciendo-solo-o-en-familia.pdf",
    descripcion: "Aprender a crecer espiritualmente de forma individual y en comunidad.",
    guia: {
      objetivo: "Que el discípulo entienda que el crecimiento espiritual requiere disciplina personal y vida en comunidad.",
      puntosClave: [
        "El crecimiento espiritual es un proceso, no un evento",
        "La importancia de la comunidad y la iglesia local",
        "Disciplinas espirituales: oración, ayuno, comunión, servicio",
      ],
      consejos: [
        "Ayudar al discípulo a crear un plan de crecimiento personal",
        "Invitarlo a un grupo pequeño o ministerio de la iglesia",
        "Seguir reunión regularmente incluso después del nivel 1",
      ],
      preguntas: [
        "¿Qué disciplina espiritual te cuesta más mantener?",
        "¿Participas de un grupo pequeño o ministerio?",
        "¿Qué meta de crecimiento te gustaría alcanzar este año?",
      ],
    },
  },
];

export function getEstudiosPorEtapa(etapaId: number): PasoEstudio[] {
  return ESTUDIOS_BIBLICOS.filter((e) => e.etapaId === etapaId);
}

import { BASE_PATH } from "@/lib/constants/paths";

export function getBasePath(): string {
  return `${BASE_PATH}/estudios-biblicos/nivel-1`;
}
