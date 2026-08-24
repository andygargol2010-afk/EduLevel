import { useState, useEffect, useCallback, lazy, Suspense, memo, useRef } from "react";
import { type AuthUser, subscribeToAuth, signInWithGoogle, signOutFromGoogle } from "./firebase";
import Article, { articles as articleContent } from "./pages/Article";

const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Contact = lazy(() => import("./pages/Contact"));

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "inicio" | "simulacros" | "formulas" | "guias";
type Subject = "matematicas" | "historia" | "gramatica" | "geografia" | "fisica" | "quimica";
type Level = "basico" | "intermedio" | "avanzado";
type View = "home" | "quiz";

const SUBJECTS = [
  "matematicas",
  "historia",
  "gramatica",
  "geografia",
  "fisica",
  "quimica",
] as const satisfies readonly Subject[];

const LEVEL_KEYS = ["basico", "intermedio", "avanzado"] as const satisfies readonly Level[];

const siteUrl = "https://edulvl.com";

const levelLabels: Record<Level, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

const levelFullLabels: Record<Level, string> = {
  basico: "Nivel Básico",
  intermedio: "Nivel Intermedio",
  avanzado: "Nivel Avanzado",
};

function testPath(subject: Subject, level: Level) {
  return `/tests/subject/{level}`;
}

function setPageMetadata(subject: Subject | null, level: Level | null) {
  const title =
    subject && level
      ? `${subjectConfig[subject].label}: test de nivel ${levelLabels[level]} | EduLevel`
      : "EduLevel — Tests y simulacros educativos";
  const description =
    subject && level
      ? `Practica ${subjectConfig[subject].label} con un test interactivo de nivel ${levelLabels[level]}. Revisa tus respuestas al finalizar.`
      : "Tests interactivos para practicar Matemáticas, Historia, Lengua y Gramática, Geografía, Física y Química por nivel.";
  const canonical = `siteUrl{subject && level ? testPath(subject, level) : "/"}`;

  document.title = title;
  const update = (selector: string, value: string) => {
    const el = document.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
    if (el instanceof HTMLMetaElement) el.content = value;
    if (el instanceof HTMLLinkElement) el.href = value;
  };
  update('meta[name="description"]', description);
  update('meta[property="og:title"]', title);
  update('meta[property="og:description"]', description);
  update('meta[property="og:url"]', canonical);
  update('link[rel="canonical"]', canonical);

  const schema =
    subject && level
      ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Quiz",
              name: title,
              description,
              url: canonical,
              inLanguage: "es",
              educationalLevel: levelLabels[level],
              about: subjectConfig[subject].label,
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "EduLevel", item: `${siteUrl}/` },
                { "@type": "ListItem", position: 2, name: subjectConfig[subject].label, item: canonical },
                { "@type": "ListItem", position: 3, name: `Nivel ${levelLabels[level]}`, item: canonical },
              ],
            },
          ],
        }
      : {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "EduLevel",
          url: canonical,
          description,
          applicationCategory: "Education",
          operatingSystem: "All",
          inLanguage: "es",
        };

  document.getElementById("seo-jsonld")?.remove();
  const script = document.createElement("script");
  script.id = "seo-jsonld";
  script.type = "application/ld+json";
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

// ─── Quiz Data ────────────────────────────────────────────────────────────────

const quizData: Record<Subject, Record<Level, QuizQuestion[]>> = {
  matematicas: {
    basico: [
      { id: 1, question: "¿Cuánto es 15 × 8?", options: ["110", "120", "125", "130"], correct: 1 },
      { id: 2, question: "¿Cuál es el 25% de 200?", options: ["40", "45", "50", "55"], correct: 2 },
      { id: 3, question: "¿Cuánto es 144 ÷ 12?", options: ["10", "11", "12", "13"], correct: 2 },
      { id: 4, question: "Si x + 7 = 15, ¿cuánto es x?", options: ["6", "7", "8", "9"], correct: 2 },
      { id: 5, question: "¿Cuál es el área de un cuadrado de lado 6 cm?", options: ["24 cm²", "30 cm²", "36 cm²", "42 cm²"], correct: 2 },
    ],
    intermedio: [
      { id: 1, question: "¿Cuánto es √169?", options: ["11", "12", "13", "14"], correct: 2 },
      { id: 2, question: "¿Cuál es el resultado de 3² + 4²?", options: ["20", "25", "30", "35"], correct: 1 },
      { id: 3, question: "Si 2x - 5 = 11, ¿cuánto es x?", options: ["6", "7", "8", "9"], correct: 2 },
      { id: 4, question: "¿Cuánto es log₁₀(1000)?", options: ["2", "3", "4", "5"], correct: 1 },
      { id: 5, question: "¿Cuál es la pendiente de y = 3x + 7?", options: ["1", "3", "7", "10"], correct: 1 },
    ],
    avanzado: [
      { id: 1, question: "¿Cuál es la derivada de f(x) = x³ + 2x²?", options: ["3x² + 4x", "x² + 4x", "3x + 4", "2x³ + 4x"], correct: 0 },
      { id: 2, question: "¿Cuánto es ∫(2x + 3)dx?", options: ["x² + 3x + C", "2x² + 3 + C", "x + 3x + C", "2x + C"], correct: 0 },
      { id: 3, question: "¿Cuál es el límite de (x²-1)/(x-1) cuando x→1?", options: ["0", "1", "2", "Indefinido"], correct: 2 },
      { id: 4, question: "¿Cuántos términos tiene (a+b)⁵?", options: ["4", "5", "6", "7"], correct: 2 },
      { id: 5, question: "¿Cuál es la solución de la ecuación x² - 5x + 6 = 0?", options: ["x=1, x=6", "x=2, x=3", "x=-2, x=-3", "x=1, x=5"], correct: 1 },
    ],
  },
  historia: {
    basico: [
      { id: 1, question: "¿En qué año se descubrió América?", options: ["1490", "1492", "1494", "1496"], correct: 1 },
      { id: 2, question: "¿Quién fue el primer presidente de los Estados Unidos?", options: ["Abraham Lincoln", "Thomas Jefferson", "George Washington", "John Adams"], correct: 2 },
      { id: 3, question: "¿Cuándo comenzó la Primera Guerra Mundial?", options: ["1912", "1914", "1916", "1918"], correct: 1 },
      { id: 4, question: "¿Qué civilización construyó las pirámides de Giza?", options: ["Griega", "Romana", "Egipcia", "Persa"], correct: 2 },
      { id: 5, question: "¿En qué año cayó el Muro de Berlín?", options: ["1985", "1987", "1989", "1991"], correct: 2 },
    ],
    intermedio: [
      { id: 1, question: "¿Qué tratado puso fin a la Primera Guerra Mundial?", options: ["Tratado de París", "Tratado de Versalles", "Tratado de Roma", "Tratado de Viena"], correct: 1 },
      { id: 2, question: "¿Cuándo comenzó la Revolución Francesa?", options: ["1786", "1788", "1789", "1791"], correct: 2 },
      { id: 3, question: "¿Quién fue el líder de la URSS durante la Segunda Guerra Mundial?", options: ["Lenin", "Trotsky", "Stalin", "Khrushchev"], correct: 2 },
      { id: 4, question: "¿En qué año se fundó la ONU?", options: ["1943", "1944", "1945", "1946"], correct: 2 },
      { id: 5, question: "¿Qué evento inició la Segunda Guerra Mundial?", options: ["Invasión de Francia", "Invasión de Polonia", "Bombardeo de Londres", "Ataque a Pearl Harbor"], correct: 1 },
    ],
    avanzado: [
      { id: 1, question: "¿Qué filósofo influyó más directamente en la Revolución Francesa?", options: ["Descartes", "Kant", "Rousseau", "Hegel"], correct: 2 },
      { id: 2, question: "¿Cuál fue la causa principal del colapso del Imperio Romano de Occidente?", options: ["Invasiones bárbaras", "Crisis económica interna", "Múltiples factores combinados", "Plagas epidémicas"], correct: 2 },
      { id: 3, question: "¿Qué doctrina guió la política exterior de EE.UU. en el siglo XIX?", options: ["Doctrina Truman", "Doctrina Monroe", "Doctrina Eisenhower", "Doctrina Carter"], correct: 1 },
      { id: 4, question: "¿En qué período se desarrolló la Edad de Oro islámica?", options: ["Siglos V-VIII", "Siglos VIII-XIII", "Siglos XIII-XVI", "Siglos XVI-XIX"], correct: 1 },
      { id: 5, question: "¿Qué tecnología fue determinante en la Revolución Industrial?", options: ["La imprenta", "El motor de vapor", "La electricidad", "El ferrocarril"], correct: 1 },
    ],
  },
  gramatica: {
    basico: [
      { id: 1, question: "¿Cuál es el sujeto en 'Los niños juegan en el parque'?", options: ["juegan", "en el parque", "Los niños", "Los niños juegan"], correct: 2 },
      { id: 2, question: "¿Qué tipo de palabra es 'rápidamente'?", options: ["Adjetivo", "Sustantivo", "Adverbio", "Verbo"], correct: 2 },
      { id: 3, question: "¿Cuál es el plural de 'pez'?", options: ["pezs", "peces", "pezes", "pez"], correct: 1 },
      { id: 4, question: "¿Qué signo de puntuación se usa al inicio de una pregunta en español?", options: [".", ",", "¿", "¡"], correct: 2 },
      { id: 5, question: "¿Cuál es el antónimo de 'alegre'?", options: ["feliz", "contento", "triste", "animado"], correct: 2 },
    ],
    intermedio: [
      { id: 1, question: "¿Cuál es la función del pronombre relativo 'que' en 'El libro que leí es bueno'?", options: ["Sujeto", "CD del verbo 'leí'", "Atributo", "Complemento Circunstancial"], correct: 1 },
      { id: 2, question: "¿Qué tipo de oración es 'Aunque llueva, saldré'?", options: ["Causal", "Condicional", "Concesiva", "Consecutiva"], correct: 2 },
      { id: 3, question: "¿Cuál es la voz pasiva de 'María escribió la carta'?", options: ["La carta fue escrita por María", "María fue escrita la carta", "La carta escribió María", "Fue escrita María la carta"], correct: 0 },
      { id: 4, question: "¿Qué tiempo verbal usa el subjuntivo en 'Espero que vengas'?", options: ["Presente de indicativo", "Presente de subjuntivo", "Futuro simple", "Condicional"], correct: 1 },
      { id: 5, question: "¿Cuál es el gerundio del verbo 'producir'?", options: ["producido", "produce", "produciendo", "produzca"], correct: 2 },
    ],
    avanzado: [
      { id: 1, question: "¿Qué figura retórica hay en 'Sus ojos son dos luceros brillantes'?", options: ["Metonimia", "Metáfora", "Hipérbole", "Símil"], correct: 1 },
      { id: 2, question: "¿Qué es un zeugma?", options: ["Repetición de una palabra", "Omisión de un verbo ya mencionado", "Inversión sintáctica", "Enumeración climática"], correct: 1 },
      { id: 3, question: "En la oración compuesta, ¿qué nexo indica causa?", options: ["aunque", "porque", "sino", "luego"], correct: 1 },
      { id: 4, question: "¿Cuál es la diferencia entre 'hay', 'ahí' y 'ay'?", options: ["Son sinónimos", "Verbo / Adverbio / Interjección", "Sustantivo / Verbo / Adverbio", "No existen diferencias gramaticales"], correct: 1 },
      { id: 5, question: "¿Qué tipo de complemento es 'a su madre' en 'Juan llamó a su madre'?", options: ["Complemento Directo", "Complemento Indirecto", "Complemento de Régimen", "Complemento Agente"], correct: 0 },
    ],
  },
  geografia: {
    basico: [
      { id: 1, question: "¿Cuál es el océano más grande del planeta?", options: ["Atlántico", "Índico", "Pacífico", "Ártico"], correct: 2 },
      { id: 2, question: "¿En qué continente se encuentra Argentina?", options: ["Asia", "América del Sur", "Europa", "África"], correct: 1 },
      { id: 3, question: "¿Qué línea imaginaria divide la Tierra en hemisferio norte y sur?", options: ["Meridiano de Greenwich", "Trópico de Cáncer", "Ecuador", "Círculo Polar Ártico"], correct: 2 },
      { id: 4, question: "¿Cuál es la capital de Japón?", options: ["Kioto", "Osaka", "Tokio", "Seúl"], correct: 2 },
      { id: 5, question: "¿Qué tipo de relieve es una gran elevación natural del terreno?", options: ["Llanura", "Meseta", "Montaña", "Valle"], correct: 2 },
    ],
    intermedio: [
      { id: 1, question: "¿Qué coordenada indica la distancia al norte o al sur del Ecuador?", options: ["Longitud", "Latitud", "Altitud", "Escala"], correct: 1 },
      { id: 2, question: "¿Qué clima se caracteriza por lluvias abundantes durante todo el año y temperaturas altas?", options: ["Desértico", "Mediterráneo", "Ecuatorial", "Polar"], correct: 2 },
      { id: 3, question: "¿Cuál es la causa principal de las estaciones del año?", options: ["La distancia al Sol", "La inclinación del eje terrestre", "La rotación terrestre", "Las mareas"], correct: 1 },
      { id: 4, question: "¿Qué proceso describe el desplazamiento de población desde áreas rurales hacia ciudades?", options: ["Emigración", "Urbanización", "Natalidad", "Globalización"], correct: 1 },
      { id: 5, question: "¿Qué placa tectónica se relaciona directamente con gran parte de Sudamérica?", options: ["Placa Sudamericana", "Placa Arábiga", "Placa Filipina", "Placa de Cocos"], correct: 0 },
    ],
    avanzado: [
      { id: 1, question: "¿Qué indicador relaciona el número de habitantes con la superficie de un territorio?", options: ["Tasa de natalidad", "Densidad de población", "Esperanza de vida", "Producto interno bruto"], correct: 1 },
      { id: 2, question: "¿Cómo se denomina el límite donde una placa tectónica se introduce bajo otra?", options: ["Divergente", "Transformante", "Subducción", "Erosión"], correct: 2 },
      { id: 3, question: "¿Qué corriente oceánica cálida influye en el clima de Europa occidental?", options: ["Corriente de Humboldt", "Corriente del Golfo", "Corriente de Benguela", "Corriente de Labrador"], correct: 1 },
      { id: 4, question: "¿Qué mide el índice de desarrollo humano además de ingresos?", options: ["Educación y esperanza de vida", "Cantidad de minerales", "Extensión territorial", "Precipitaciones"], correct: 0 },
      { id: 5, question: "¿Qué tipo de mapa representa valores mediante líneas que unen puntos de igual valor?", options: ["Político", "Coroplético", "Isolíneas", "Topográfico"], correct: 2 },
    ],
  },
  fisica: {
    basico: [
      { id: 1, question: "¿Cuál es la unidad de fuerza en el Sistema Internacional?", options: ["Julio", "Newton", "Vatio", "Pascal"], correct: 1 },
      { id: 2, question: "¿Qué magnitud mide un termómetro?", options: ["Masa", "Temperatura", "Velocidad", "Energía"], correct: 1 },
      { id: 3, question: "¿Cuál es la fórmula de la velocidad media?", options: ["tiempo/distancia", "distancia × tiempo", "distancia/tiempo", "masa/aceleración"], correct: 2 },
      { id: 4, question: "¿Qué instrumento mide la intensidad de una corriente eléctrica?", options: ["Voltímetro", "Amperímetro", "Barómetro", "Dinamómetro"], correct: 1 },
      { id: 5, question: "La energía asociada al movimiento se llama…", options: ["Potencial", "Térmica", "Cinética", "Nuclear"], correct: 2 },
    ],
    intermedio: [
      { id: 1, question: "Si un objeto recorre 100 m en 20 s, ¿cuál es su velocidad media?", options: ["2 m/s", "5 m/s", "20 m/s", "120 m/s"], correct: 1 },
      { id: 2, question: "Según la segunda ley de Newton, F =", options: ["m/a", "m × a", "m + a", "a/m"], correct: 1 },
      { id: 3, question: "¿Cuál es aproximadamente la aceleración de la gravedad en la superficie terrestre?", options: ["1,8 m/s²", "5 m/s²", "9,8 m/s²", "18 m/s²"], correct: 2 },
      { id: 4, question: "¿Qué sucede con la resistencia equivalente de resistencias en serie?", options: ["Se multiplican", "Se suman", "Se restan", "Siempre es cero"], correct: 1 },
      { id: 5, question: "¿Qué unidad expresa la potencia?", options: ["Vatio", "Newton", "Julio", "Ohmio"], correct: 0 },
    ],
    avanzado: [
      { id: 1, question: "¿Qué trabajo realiza una fuerza de 10 N que desplaza 3 m en su misma dirección?", options: ["3 J", "10 J", "13 J", "30 J"], correct: 3 },
      { id: 2, question: "En un movimiento circular uniforme, ¿qué magnitud cambia continuamente?", options: ["La rapidez", "La masa", "La dirección de la velocidad", "El radio"], correct: 2 },
      { id: 3, question: "¿Qué ley relaciona voltaje, corriente y resistencia?", options: ["Ley de Coulomb", "Ley de Ohm", "Ley de Hooke", "Ley de Pascal"], correct: 1 },
      { id: 4, question: "¿Cuál es la unidad de frecuencia?", options: ["Hercio", "Tesla", "Kelvin", "Lumen"], correct: 0 },
      { id: 5, question: "En una onda, la distancia entre dos crestas consecutivas es la…", options: ["Amplitud", "Longitud de onda", "Frecuencia", "Velocidad"], correct: 1 },
    ],
  },
  quimica: {
    basico: [
      { id: 1, question: "¿Cuál es el símbolo químico del oxígeno?", options: ["Ox", "O", "Og", "X"], correct: 1 },
      { id: 2, question: "¿Qué partícula tiene carga negativa?", options: ["Protón", "Neutrón", "Electrón", "Núcleo"], correct: 2 },
      { id: 3, question: "¿Cuál es la fórmula del agua?", options: ["HO", "H₂O", "H₂O₂", "OH₂"], correct: 1 },
      { id: 4, question: "¿Qué gas es necesario para la combustión?", options: ["Nitrógeno", "Oxígeno", "Helio", "Neón"], correct: 1 },
      { id: 5, question: "¿Cuál de estas sustancias es un elemento químico?", options: ["Agua", "Sal común", "Hierro", "Dióxido de carbono"], correct: 2 },
    ],
    intermedio: [
      { id: 1, question: "¿Qué indica el número atómico de un elemento?", options: ["Número de neutrones", "Número de protones", "Número de electrones siempre", "Masa atómica"], correct: 1 },
      { id: 2, question: "Una solución con pH 3 es…", options: ["Ácida", "Neutra", "Básica", "Saturada"], correct: 0 },
      { id: 3, question: "¿Qué enlace se forma al compartir electrones?", options: ["Iónico", "Covalente", "Metálico", "Nuclear"], correct: 1 },
      { id: 4, question: "¿Cuántos moles hay en 18 g de agua (H₂O)?", options: ["0,5", "1", "2", "18"], correct: 1 },
      { id: 5, question: "¿Qué ley establece que la masa se conserva en una reacción química?", options: ["Boyle", "Lavoisier", "Avogadro", "Dalton"], correct: 1 },
    ],
    avanzado: [
      { id: 1, question: "En una reacción de oxidación, una especie química…", options: ["Gana electrones", "Pierde electrones", "No cambia", "Siempre gana protones"], correct: 1 },
      { id: 2, question: "¿Qué principio explica el desplazamiento de un equilibrio al cambiar concentración, presión o temperatura?", options: ["Le Châtelier", "Pauli", "Heisenberg", "Arquímedes"], correct: 0 },
      { id: 3, question: "¿Qué grupo funcional caracteriza a los alcoholes?", options: ["-COOH", "-OH", "-NH₂", "-CHO"], correct: 1 },
      { id: 4, question: "¿Cuál es el estado de oxidación habitual del oxígeno en la mayoría de sus compuestos?", options: ["+2", "-2", "0", "+6"], correct: 1 },
      { id: 5, question: "¿Qué tipo de reacción combina dos sustancias para formar un producto?", options: ["Descomposición", "Sustitución", "Síntesis", "Neutralización"], correct: 2 },
    ],
  },
};

// ─── Stats derived from quizData (single source of truth) ─────────────────────

const totalSubjectCount = SUBJECTS.length;
const totalTestCount = SUBJECTS.reduce(
  (acc, s) => acc + LEVEL_KEYS.filter((lv) => quizData[s][lv].length > 0).length,
  0,
);
const totalQuestionCount = SUBJECTS.reduce(
  (acc, s) => acc + LEVEL_KEYS.reduce((a, lv) => a + quizData[s][lv].length, 0),
  0,
);

// ─── AdSense Slot ─────────────────────────────────────────────────────────────

function AdSlot({ w, h, label, sticky }: { w: number; h: number; label: string; sticky?: boolean }) {
  return (
    <div className={`flex justify-center ${sticky ? "" : "my-4 py-2"}`} aria-hidden="true">
      <div
        className={`flex items-center justify-center rounded-lg border-2 border-dashed border-slate-400 bg-slate-100 ${sticky ? "sticky top-24" : ""}`}
        style={{ width: w, maxWidth: "100%", height: h }}
      >
        <div className="text-center px-4">
          <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
          <span className="block text-xs text-slate-400 mt-1">
            {w} × {h}
          </span>
        </div>
      </div>
    </div>
  );
}

const AdSlotLeaderboard = () => (
  <div className="w-full flex justify-center px-4 py-2 bg-slate-50 border-b border-slate-200">
    <AdSlot w={728} h={90} label="Anuncio superior" />
  </div>
);
const AdSlotContent = () => <AdSlot w={728} h={90} label="Anuncio de contenido" />;
const AdSlotSkyscraper = () => <AdSlot w={300} h={600} label="Anuncio lateral" sticky />;

// ─── Subject Config ───────────────────────────────────────────────────────────

const subjectConfig = {
  matematicas: {
    label: "Matemáticas",
    icon: "📐",
    color: "#0F9D74",
    lightBg: "#E8FBF4",
    borderColor: "#7BE0BE",
    desc: "Álgebra, Geometría, Cálculo y más",
    tests: LEVEL_KEYS.length,
  },
  historia: {
    label: "Historia",
    icon: "🏛️",
    color: "#D9852A",
    lightBg: "#FEF6EA",
    borderColor: "#F3C583",
    desc: "Historia Universal, Civilizaciones y Política",
    tests: LEVEL_KEYS.length,
  },
  gramatica: {
    label: "Lengua y Gramática",
    icon: "📝",
    color: "#6D3FD1",
    lightBg: "#F4F0FE",
    borderColor: "#C6B1F2",
    desc: "Ortografía, Sintaxis, Literatura y Redacción",
    tests: LEVEL_KEYS.length,
  },
  geografia: {
    label: "Geografía",
    icon: "🌍",
    color: "#0891B2",
    lightBg: "#ECFEFF",
    borderColor: "#67E8F9",
    desc: "Relieve, clima, población y geografía física",
    tests: LEVEL_KEYS.length,
  },
  fisica: {
    label: "Física",
    icon: "⚛️",
    color: "#DB2777",
    lightBg: "#FDF2F8",
    borderColor: "#F9A8D4",
    desc: "Movimiento, fuerzas, energía y electricidad",
    tests: LEVEL_KEYS.length,
  },
  quimica: {
    label: "Química",
    icon: "🧪",
    color: "#EA580C",
    lightBg: "#FFF7ED",
    borderColor: "#FDBA74",
    desc: "Materia, reacciones, enlaces y compuestos",
    tests: LEVEL_KEYS.length,
  },
} as const;

interface FormulaSheet {
  title: string;
  subject: string;
  color: string;
  bg: string;
  icon: string;
  items: string[];
}

const formulaSheets: FormulaSheet[] = [
  {
    title: "Fórmulas esenciales de Álgebra",
    subject: "Matemáticas",
    color: "#0F9D74",
    bg: "#E8FBF4",
    icon: "📐",
    items: [
      "Fórmula cuadrática: x = (−b ± √(b²−4ac)) / 2a",
      "Diferencia de cuadrados: a²−b² = (a+b)(a−b)",
      "Binomio de Newton: (a+b)ⁿ = Σ C(n,k)·aᵏ·bⁿ⁻ᵏ",
      "Logaritmos: logₐ(xy) = logₐx + logₐy",
    ],
  },
  {
    title: "Cronología — Historia Moderna",
    subject: "Historia",
    color: "#D9852A",
    bg: "#FEF6EA",
    icon: "🏛️",
    items: [
      "1492 — Descubrimiento de América",
      "1517 — Reforma Protestante de Lutero",
      "1789 — Revolución Francesa",
      "1848 — Primavera de los Pueblos",
    ],
  },
  {
    title: "Figuras Retóricas Clave",
    subject: "Gramática",
    color: "#6D3FD1",
    bg: "#F4F0FE",
    icon: "📝",
    items: [
      "Metáfora: comparación sin 'como'",
      "Hipérbole: exageración expresiva",
      "Anáfora: repetición al inicio del verso",
      "Ironía: decir lo contrario de lo que se piensa",
    ],
  },
  {
    title: "Geometría Analítica",
    subject: "Matemáticas",
    color: "#0F9D74",
    bg: "#E8FBF4",
    icon: "📐",
    items: [
      "Distancia entre puntos: d = √[(x₂−x₁)²+(y₂−y₁)²]",
      "Punto medio: M = ((x₁+x₂)/2, (y₁+y₂)/2)",
      "Pendiente: m = (y₂−y₁)/(x₂−x₁)",
      "Ecuación recta: y − y₁ = m(x − x₁)",
    ],
  },
];

const learningCards = [
  { title: "Repasa conceptos clave", text: "Refuerza teoría, fórmulas y ejercicios esenciales antes de cada prueba." },
  { title: "Mejora tu nivel paso a paso", text: "Estudia desde básico hasta avanzado con ejercicios ordenados por dificultad." },
  { title: "Prepara exámenes reales", text: "Ajusta tu ritmo y trabaja la materia con simulacros y guías de estudio." },
] as const;

const articleCards = articleContent.map((a) => ({
  slug: a.slug,
  title: a.title,
  meta: `${a.subject} · ${a.readTime}`,
}));

const guideCards = [
  { level: "Básico", text: "Repasa conceptos fundamentales y mejora tu base para dominar cada materia.", accent: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { level: "Intermedio", text: "Profundiza en ejercicios, resolución de problemas y comprensión de temas clave.", accent: "bg-amber-50 text-amber-700 border-amber-200" },
  { level: "Avanzado", text: "Trabaja en rendimiento óptimo, simulacros y ejercicios de mayor dificultad.", accent: "bg-violet-50 text-violet-700 border-violet-200" },
] as const;

const faqItems = [
  {
    q: "¿Cuánto tiempo debo dedicar a estudiar cada día?",
    a: "Lo ideal es combinar 20 a 40 minutos de práctica concentrada con repaso de conceptos básicos y un test corto para consolidar.",
  },
  {
    q: "¿Qué materia tiene más peso en los exámenes?",
    a: "Depende del tipo de prueba, pero en la mayoría de casos una buena base en matemáticas, lenguaje y comprensión lectora suele marcar una gran diferencia.",
  },
  {
    q: "¿Cómo mejorar en simulacros?",
    a: "Haz simulacros en condiciones reales, revisa errores, identifica patrones y repite los temas que te cuestan para avanzar sin frustrarte.",
  },
] as const;

const retentionCards = [
  { title: "Siguiente recomendación", text: "Repasa álgebra y funciones antes de tu próximo simulacro de matemáticas." },
  { title: "Ritmo ideal", text: "3 tests por semana te ayudan a mantener un progreso constante y realista." },
  { title: "Resumen de avance", text: "Tu objetivo: reforzar conceptos básicos y subir precisión en ejercicios de nivel medio." },
] as const;

const LEVELS: { key: Level; label: string; desc: string; icon: string }[] = [
  { key: "basico", label: "Nivel Básico", desc: "Fundamentos y conceptos clave", icon: "🟢" },
  { key: "intermedio", label: "Nivel Intermedio", desc: "Comprensión y aplicación práctica", icon: "🟡" },
  { key: "avanzado", label: "Nivel Avanzado", desc: "Análisis y razonamiento complejo", icon: "🔴" },
];

const STUDY_GUIDES = [
  {
    key: "matematicas" as Subject,
    subject: "Matemáticas",
    icon: "📐",
    color: "#0F9D74",
    bg: "#E8FBF4",
    border: "#7BE0BE",
    weeks: 8,
    topics: ["Álgebra básica", "Funciones", "Trigonometría", "Cálculo diferencial", "Estadística"],
  },
  {
    key: "historia" as Subject,
    subject: "Historia",
    icon: "🏛️",
    color: "#D9852A",
    bg: "#FEF6EA",
    border: "#F3C583",
    weeks: 6,
    topics: ["Prehistoria y Edad Antigua", "Edad Media", "Renacimiento y Modernidad", "Revolución Industrial", "Historia Contemporánea"],
  },
  {
    key: "gramatica" as Subject,
    subject: "Gramática",
    icon: "📝",
    color: "#6D3FD1",
    bg: "#F4F0FE",
    border: "#C6B1F2",
    weeks: 5,
    topics: ["Morfología y Sintaxis", "Ortografía y Puntuación", "Tipos de texto", "Literatura española", "Comentario crítico"],
  },
];

const TABS: { key: Tab; label: string }[] = [
  { key: "inicio", label: "Inicio" },
  { key: "simulacros", label: "Simulacros" },
  { key: "formulas", label: "Fórmulas" },
  { key: "guias", label: "Guías" },
];

const SUBJECT_LABELS_LIST = SUBJECTS.map((s) => subjectConfig[s].label).join(", ");

// ─── Progress helpers ─────────────────────────────────────────────────────────

interface SavedProgressEntry {
  score: number;
  total: number;
  pct: number;
  savedAt?: string;
}

function readProgress(): Record<string, SavedProgressEntry> {
  try {
    const raw = window.localStorage.getItem("edulevel:progress");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeProgress(data: Record<string, SavedProgressEntry>) {
  try {
    window.localStorage.setItem("edulevel:progress", JSON.stringify(data));
  } catch (e) {
    console.error("No se pudo guardar el progreso", e);
  }
}

// ─── Shared UI pieces ─────────────────────────────────────────────────────────

function ModalShell({
  onClose,
  children,
  maxW = "max-w-md",
  labelledBy,
}: {
  onClose: () => void;
  children: React.ReactNode;
  maxW?: string;
  labelledBy?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxW} overflow-hidden outline-none`}
      >
        {children}
      </div>
    </div>
  );
}

function Breadcrumb({
  items,
}: {
  items: { label: string; onClick?: () => void; current?: boolean }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.onClick && !item.current ? (
              <button type="button" onClick={item.onClick} className="text-blue-600 hover:text-blue-800 font-medium">
                {item.label}
              </button>
            ) : (
              <span aria-current={item.current ? "page" : undefined} className={item.current ? "text-slate-700 font-medium" : ""}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ─── Login Modal ──────────────────────────────────────────────────────────────

const LoginModal = memo(function LoginModal({
  onClose,
  onGoogleLogin,
  isLoading,
  authError,
}: {
  onClose: () => void;
  onGoogleLogin: () => Promise<void> | void;
  isLoading: boolean;
  authError: string | null;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <ModalShell onClose={onClose} labelledBy="login-title">
      <div className="px-8 pt-8 pb-6 border-b border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-display font-black">E</span>
            </div>
            <span id="login-title" className="font-bold text-slate-800">
              EduLevel
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg" role="tablist">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                mode === m ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {m === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-8 py-6">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 mb-5">
          {mode === "login"
            ? "Accedé con tu cuenta de Google para continuar."
            : "Creá tu cuenta con Google y empezá a estudiar en segundos."}
        </div>
        {authError && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {authError}
          </div>
        )}
        <button
          type="button"
          onClick={onGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold py-3 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {isLoading ? "Conectando..." : mode === "login" ? "Continuar con Google" : "Crear cuenta con Google"}
        </button>
        <div className="mt-4 text-center text-xs text-slate-500">
          Al continuar aceptás nuestros{" "}
          <a href="#/terms" className="text-blue-600 font-semibold">
            Términos
          </a>{" "}
          y la{" "}
          <a href="#/privacy" className="text-blue-600 font-semibold">
            Política de Privacidad
          </a>
          .
        </div>
      </div>
    </ModalShell>
  );
});

// ─── Quiz View ────────────────────────────────────────────────────────────────

const QuizView = memo(function QuizView({
  subject,
  level,
  onBack,
  onLogin,
}: {
  subject: Subject;
  level: Level;
  onBack: () => void;
  onLogin: () => void;
}) {
  const config = subjectConfig[subject];
  const questions = quizData[subject][level];
  const levelLabel = levelFullLabels[level];
  const optionLetters = ["A", "B", "C", "D"] as const;
  const total = questions.length;

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState<boolean[]>(() => new Array(total).fill(false));
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [progressSaved, setProgressSaved] = useState(false);

  // Reset internal state when subject/level changes
  useEffect(() => {
    setCurrent(0);
    setSelected(null);
    setAnswered(new Array(total).fill(false));
    setScore(0);
    setShowResult(false);
    setProgressSaved(false);
  }, [subject, level, total]);

  if (total === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-slate-600">No hay preguntas disponibles para este test.</p>
        <button type="button" onClick={onBack} className="px-6 py-3 rounded-xl font-semibold text-white" style={{ background: config.color }}>
          Volver al inicio
        </button>
      </div>
    );
  }

  const safeCurrent = Math.min(current, total - 1);
  const q = questions[safeCurrent];
  const isAnswered = answered[safeCurrent];
  const answeredCount = answered.filter(Boolean).length;

  const handleSaveProgress = useCallback(() => {
    const existing = readProgress();
    existing[`subject:{level}`] = {
      score,
      total,
      pct: total > 0 ? Math.round((score / total) * 100) : 0,
      savedAt: new Date().toISOString(),
    };
    writeProgress(existing);
    setProgressSaved(true);
  }, [level, score, subject, total]);

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelected(idx);
    const next = [...answered];
    next[safeCurrent] = true;
    setAnswered(next);
    if (idx === q.correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (safeCurrent < total - 1) {
      setCurrent(safeCurrent + 1);
      setSelected(null);
    } else {
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setCurrent(0);
    setSelected(null);
    setAnswered(new Array(total).fill(false));
    setScore(0);
    setShowResult(false);
    setProgressSaved(false);
  };

  if (showResult) {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const msg = pct >= 80 ? "¡Excelente resultado!" : pct >= 60 ? "¡Buen trabajo!" : "¡Sigue practicando!";
    const tip =
      pct >= 80
        ? "Excelente trabajo. Repite este nivel y avanza a un simulacro más exigente para reforzar tu ventaja."
        : pct >= 60
          ? "Buen avance. Revisa los errores y repasa los conceptos más difíciles antes de tu siguiente prueba."
          : "Todavía tienes margen. Haz un repaso breve por los temas clave y vuelve a intentarlo con más enfoque.";
    const emoji = pct >= 80 ? "🏆" : pct >= 60 ? "⭐" : "📚";

    return (
      <div className="min-h-screen bg-background">
        <AdSlotLeaderboard />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
            style={{ background: config.lightBg, border: `3px solid ${config.borderColor}` }}
            aria-hidden="true"
          >
            {emoji}
          </div>
          <h2 className="text-3xl font-display font-black text-slate-800 mb-2">{msg}</h2>
          <p className="text-slate-500 mb-8">
            {config.label} — {levelLabel}
          </p>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8">
            <div className="text-6xl font-display font-black mb-2" style={{ color: config.color }}>
              {pct}%
            </div>
            <p className="text-slate-600 text-lg">
              {score} de {total} respuestas correctas
            </p>
            <div className="w-full bg-slate-100 rounded-full h-3 mt-6" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-3 rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: config.color }} />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 text-left">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-3">Resumen de resultados</p>
            <h3 className="text-xl font-display font-black text-slate-800 mb-2">Siguiente paso recomendado</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{tip}</p>
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <button type="button" onClick={resetQuiz} className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-all">
              Intentar de nuevo
            </button>
            <button
              type="button"
              onClick={handleSaveProgress}
              disabled={progressSaved}
              className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-70 disabled:cursor-default"
            >
              {progressSaved ? "✓ Progreso guardado" : "Guardar progreso"}
            </button>
            <button type="button" onClick={onBack} className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90" style={{ background: config.color }}>
              Elegir otro tema
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdSlotLeaderboard />
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6 text-sm">
          <button type="button" onClick={onBack} className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors">
            ← Inicio
          </button>
          <span className="text-slate-300" aria-hidden="true">
            /
          </span>
          <span className="font-medium text-slate-600">{config.label}</span>
          <span className="text-slate-300" aria-hidden="true">
            /
          </span>
          <span className="font-semibold" style={{ color: config.color }}>
            {levelLabel}
          </span>
        </div>

        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl p-6 mb-4 flex items-center gap-4" style={{ background: config.lightBg, border: `1.5px solid ${config.borderColor}` }}>
              <span className="text-3xl" aria-hidden="true">
                {config.icon}
              </span>
              <div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide" style={{ background: config.color + "20", color: config.color }}>
                  {levelLabel}
                </span>
                <h1 className="text-xl font-display font-black text-slate-800 mt-1">{config.label}</h1>
                <p className="text-sm text-slate-500">{config.desc}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="w-full h-1.5 bg-slate-100" role="progressbar" aria-valuenow={safeCurrent + 1} aria-valuemin={1} aria-valuemax={total}>
                <div className="h-1.5 transition-all duration-500" style={{ width: `${((safeCurrent + 1) / total) * 100}%`, background: config.color }} />
              </div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Pregunta {safeCurrent + 1} de {total}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">✓ {score} correctas</span>
                </div>
                <p className="text-xl font-bold text-slate-800 mb-6 leading-relaxed">{q.question}</p>
                <div className="grid gap-3" role="group" aria-label="Opciones de respuesta">
                  {q.options.map((opt, idx) => {
                    let style: React.CSSProperties = { border: "1.5px solid #E2E8F0", background: "#FFFFFF", color: "#334155" };
                    if (isAnswered) {
                      if (idx === q.correct) style = { border: `1.5px solid ${config.color}`, background: config.lightBg, color: config.color };
                      else if (idx === selected) style = { border: "1.5px solid #EF4444", background: "#FEF2F2", color: "#DC2626" };
                    } else if (selected === idx) {
                      style = { border: `1.5px solid ${config.color}`, background: config.lightBg, color: config.color };
                    }
                    const circleBg = isAnswered && idx === q.correct ? config.color : isAnswered && idx === selected ? "#EF4444" : "#F1F5F9";
                    const circleColor = isAnswered && (idx === q.correct || idx === selected) ? "#fff" : "#64748B";
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelect(idx)}
                        disabled={isAnswered}
                        className="w-full text-left px-5 py-4 rounded-xl font-medium text-sm transition-all flex items-center gap-3 hover:shadow-sm active:scale-[0.99] disabled:cursor-default"
                        style={style}
                      >
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: circleBg, color: circleColor }}>
                          {optionLetters[idx]}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {isAnswered && (
                  <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
                    <div
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                      style={selected === q.correct ? { background: config.lightBg, color: config.color } : { background: "#FEF2F2", color: "#DC2626" }}
                      role="status"
                    >
                      {selected === q.correct ? "✓ ¡Correcto!" : `✗ La respuesta correcta es ${optionLetters[q.correct]}`}
                    </div>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ background: config.color }}
                    >
                      {safeCurrent < total - 1 ? "Siguiente →" : "Ver resultados"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="hidden lg:flex flex-col gap-4 w-[300px] shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest">Progreso del Test</h3>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className="h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                    style={
                      i === safeCurrent
                        ? { background: config.color, color: "#fff" }
                        : answered[i]
                          ? { background: config.lightBg, color: config.color, border: `1px solid ${config.borderColor}` }
                          : { background: "#F1F5F9", color: "#94A3B8" }
                    }
                    aria-current={i === safeCurrent ? "step" : undefined}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <div className="text-xs text-slate-500 flex items-center justify-between">
                <span>{answeredCount} respondidas</span>
                <span className="font-semibold" style={{ color: config.color }}>
                  {score} correctas
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
                <div className="h-2 rounded-full transition-all" style={{ width: `${(answeredCount / total) * 100}%`, background: config.color }} />
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-2" aria-hidden="true">
                🔓
              </div>
              <p className="text-sm font-semibold text-blue-800 mb-1">Desbloquea todo el contenido</p>
              <p className="text-xs text-blue-600 mb-3">Crea una cuenta gratis y accede a todos los tests disponibles.</p>
              <button type="button" onClick={onLogin} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all">
                Crear Cuenta Gratis
              </button>
            </div>
            <AdSlotSkyscraper />
            <div className="mt-4">
              <AdSlotContent />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
});

// ─── Formula Sheet Modal ──────────────────────────────────────────────────────

const FormulaSheetModal = memo(function FormulaSheetModal({ sheet, onClose }: { sheet: FormulaSheet; onClose: () => void }) {
  return (
    <ModalShell onClose={onClose} maxW="max-w-lg" labelledBy="formula-sheet-title">
      <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-3" style={{ background: sheet.bg }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">
            {sheet.icon}
          </span>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: sheet.color }}>
              {sheet.subject}
            </span>
            <h2 id="formula-sheet-title" className="text-lg font-display font-black text-slate-800">
              {sheet.title}
            </h2>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-slate-500 hover:bg-white/60 transition-colors">
          ✕
        </button>
      </div>
      <div className="px-6 py-5">
        <ul className="space-y-3 mb-5">
          {sheet.items.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-sm text-slate-700">
              <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: sheet.color }}>
                {j + 1}
              </span>
              <span className="font-mono text-sm leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full py-2.5 rounded-xl border text-sm font-bold transition-all hover:opacity-80"
          style={{ borderColor: sheet.color, color: sheet.color, background: sheet.bg }}
        >
          🖨️ Imprimir / Guardar como PDF
        </button>
      </div>
    </ModalShell>
  );
});

// ─── Home sections (internal components) ──────────────────────────────────────

function HomeHero() {
  return (
    <section className="relative overflow-hidden dot-grid-bg" style={{ background: "linear-gradient(160deg, #0E1D54 0%, #152A79 45%, #2347C5 100%)" }}>
      <div
        className="pointer-events-none absolute -top-24 right-[-10%] w-[520px] h-[520px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-glow) 0%, transparent 70%)" }}
      />
      <div className="relative max-w-[1440px] mx-auto px-4 lg:px-8 pt-16 pb-14 text-center">
        <div className="rise-in rise-in-1 inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-wider backdrop-blur-sm">
          🎓 Plataforma de Aprendizaje Interactivo
        </div>
        <h1 className="rise-in rise-in-2 font-display text-4xl md:text-6xl font-bold text-white leading-tight mb-5 max-w-3xl mx-auto">
          Practica, aprende y{" "}
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #7DD3FC, #DCE7FF)" }}>
            supera tus exámenes
          </span>
        </h1>
        <p className="rise-in rise-in-3 text-lg text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
          Tests interactivos de Matemáticas, Historia, Lengua y Gramática, Geografía, Física y Química. Elige tu nivel y comprueba cuánto sabes hoy.
        </p>
        <div className="rise-in rise-in-4 flex items-center justify-center gap-8 flex-wrap text-center">
          {[
            { value: String(totalTestCount), label: "Tests disponibles" },
            { value: String(totalQuestionCount), label: "Preguntas únicas" },
            { value: String(totalSubjectCount), label: "Materias" },
            { value: "Gratis", label: "Para empezar" },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-display text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-blue-200 font-medium mt-0.5 font-data">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <svg className="relative block w-full text-[#F5F8FF]" viewBox="0 0 1440 44" fill="none" preserveAspectRatio="none" style={{ height: "36px" }} aria-hidden="true">
        <path d="M0 44 C 360 0, 1080 0, 1440 44 L1440 44 L0 44 Z" fill="currentColor" />
      </svg>
    </section>
  );
}

function SubjectGrid({
  expandedSubject,
  setExpandedSubject,
  savedProgress,
  onStartQuiz,
}: {
  expandedSubject: Subject | null;
  setExpandedSubject: (s: Subject | null) => void;
  savedProgress: Record<string, SavedProgressEntry>;
  onStartQuiz: (s: Subject, l: Level) => void;
}) {
  return (
    <section className="max-w-[1440px] mx-auto px-4 lg:px-8 pb-16" aria-labelledby="materias">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">Materias</p>
        <h2 id="materias" className="text-2xl font-display font-black text-slate-800 mb-2">
          Elige una materia
        </h2>
        <p className="text-slate-500 text-sm max-w-2xl">
          Selecciona un tema y tu nivel para comenzar tu práctica con ejercicios estructurados y repeticiones útiles para estudiar mejor.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SUBJECTS.map((subj) => {
          const cfg = subjectConfig[subj];
          const isExpanded = expandedSubject === subj;
          return (
            <div
              key={subj}
              className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden"
              style={{ borderColor: isExpanded ? cfg.borderColor : "#E2E8F0" }}
            >
              <button
                type="button"
                className="w-full text-left p-6 cursor-pointer"
                style={isExpanded ? { background: cfg.lightBg } : undefined}
                onClick={() => setExpandedSubject(isExpanded ? null : subj)}
                aria-expanded={isExpanded}
                aria-controls={`levels-${subj}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                    style={{ background: cfg.color + "18", border: `1.5px solid ${cfg.borderColor}` }}
                    aria-hidden="true"
                  >
                    {cfg.icon}
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: cfg.color + "15", color: cfg.color }}>
                    {cfg.tests} tests
                  </span>
                </div>
                <h3 className="text-xl font-display font-black text-slate-800 mb-1">{cfg.label}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{cfg.desc}</p>
                <p className="text-xs font-semibold mt-3" style={{ color: cfg.color }}>
                  {cfg.tests} tests disponibles para practicar
                </p>
                <div className="flex items-center gap-1.5 mt-4">
                  <div className="flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all" style={{ background: cfg.color + "12", color: cfg.color }}>
                    {isExpanded ? "▲ Ocultar niveles" : "▼ Ver niveles"}
                  </div>
                </div>
              </button>
              {isExpanded && (
                <div id={`levels-${subj}`} className="border-t px-6 py-4 flex flex-col gap-2" style={{ borderColor: cfg.borderColor }}>
                  {LEVELS.map((lv) => {
                    const saved = savedProgress[`subj:{lv.key}`];
                    return (
                      <button
                        key={lv.key}
                        type="button"
                        onClick={() => onStartQuiz(subj, lv.key)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                        style={{ background: cfg.lightBg, border: `1.5px solid ${cfg.borderColor}` }}
                      >
                        <span className="text-lg" aria-hidden="true">
                          {lv.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">{lv.label}</span>
                            {saved && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: cfg.color + "18", color: cfg.color }}>
                                ✓ {saved.pct}% guardado
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">{lv.desc}</span>
                        </div>
                        <span className="text-slate-300 shrink-0" aria-hidden="true">
                          →
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SiteFooter({ onTab }: { onTab: (t: Tab) => void }) {
  const year = new Date().getFullYear();
  return (
    <footer className="text-blue-200 mt-16" style={{ background: "linear-gradient(160deg, #0E1D54 0%, #091339 100%)" }}>
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-12">
        <div className="mb-10">
          <AdSlotContent />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(150deg, #38BDF8, #2347C5)" }}>
                <span className="text-white text-base font-display font-bold">E</span>
              </div>
              <span className="text-lg font-display font-bold text-white tracking-tight">EduLevel</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs text-blue-200/80">
              Plataforma educativa gratuita de tests y simulacros para estudiantes de bachillerato y acceso universitario.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-4 font-data">Plataforma</h4>
            <ul className="space-y-2 text-sm">
              {(
                [
                  { label: "Inicio", tab: "inicio" as Tab },
                  { label: "Simulacros de Examen", tab: "simulacros" as Tab },
                  { label: "Fórmulas & Machetes", tab: "formulas" as Tab },
                  { label: "Guías de Estudio", tab: "guias" as Tab },
                ] as const
              ).map((l) => (
                <li key={l.label}>
                  <button type="button" onClick={() => onTab(l.tab)} className="hover:text-white transition-colors text-left">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-4 font-data">Legal</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Política de Privacidad", href: "#/privacy" },
                { label: "Términos de Uso", href: "#/terms" },
                { label: "Política de Cookies", href: "#/privacy" },
                { label: "Contacto", href: "#/contact" },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span>© {year} EduLevel. Todos los derechos reservados.</span>
          <span className="text-blue-300/60">Desarrollado para maximizar el aprendizaje educativo.</span>
        </div>
      </div>
    </footer>
  );
}

// ─── Home View ────────────────────────────────────────────────────────────────

const HomeView = memo(function HomeView({
  onStartQuiz,
  onLogin,
  user,
  onLogout,
}: {
  onStartQuiz: (s: Subject, l: Level) => void;
  onLogin: () => void;
  user: AuthUser | null;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("inicio");
  const [expandedSubject, setExpandedSubject] = useState<Subject | null>(null);
  const [openSheetIndex, setOpenSheetIndex] = useState<number | null>(null);
  const [savedProgress, setSavedProgress] = useState<Record<string, SavedProgressEntry>>({});

  useEffect(() => {
    setSavedProgress(readProgress());
  }, []);

  const setTab = (tab: Tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const mainNav = [
    { label: "Inicio", onClick: () => setActiveTab("inicio"), active: activeTab === "inicio" },
    { label: "Simulacros", onClick: () => setActiveTab("simulacros"), active: activeTab === "simulacros" },
    { label: "Fórmulas", onClick: () => setActiveTab("formulas"), active: activeTab === "formulas" },
    { label: "Guías", onClick: () => setActiveTab("guias"), active: activeTab === "guias" },
    { label: "Blog / Artículos educativos", href: "#articulos" as string | undefined },
    { label: "Contacto", href: "#/contact" as string | undefined },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white/90 backdrop-blur-md border-b border-blue-100/70 sticky top-0 z-40 supports-[backdrop-filter]:bg-white/75">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
          <div className="flex items-center h-16 gap-6">
            <div className="flex items-center gap-2.5 shrink-0">
              <div
                className="relative w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shadow-blue-300/50"
                style={{ background: "linear-gradient(150deg, #2347C5, #0E1D54)" }}
              >
                <span className="text-white text-base font-display font-bold">E</span>
              </div>
              <span className="text-lg font-display font-bold text-slate-800 tracking-tight">EduLevel</span>
            </div>

            <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {mainNav.map((item) =>
                item.href ? (
                  <a key={item.label} href={item.href} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 transition-all hover:text-slate-900 hover:bg-blue-50">
                    {item.label}
                  </a>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      item.active ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                    aria-current={item.active ? "page" : undefined}
                  >
                    {item.label}
                  </button>
                ),
              )}
            </nav>

            <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName ?? "Usuario"} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                        {(user.displayName ?? user.email ?? "U").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-slate-700">{user.displayName ?? user.email ?? "Usuario"}</span>
                  </div>
                  <button type="button" onClick={onLogout} className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                    Salir
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={onLogin} className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                    Iniciar Sesión
                  </button>
                  <button
                    type="button"
                    onClick={onLogin}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all active:scale-[0.97] shadow-sm shadow-blue-200"
                  >
                    Crear Cuenta Gratis
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="md:hidden flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === t.key ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:text-slate-700"
                }`}
                aria-current={activeTab === t.key ? "page" : undefined}
              >
                {t.label}
              </button>
            ))}
            <a href="#articulos" className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 transition-all">
              Blog
            </a>
            <a href="#/contact" className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 transition-all">
              Contacto
            </a>
          </div>
        </div>
      </header>

      {activeTab === "inicio" && (
        <main>
          <HomeHero />

          <section aria-labelledby="aprendes" className="max-w-[1440px] mx-auto px-4 lg:px-8 pb-8 -mt-2">
            <div className="bg-white border border-slate-200 rounded-3xl px-6 py-8 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 mb-3 font-data">Qué aprenderás</p>
              <h2 id="aprendes" className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                Practica con un plan claro y contenido útil por materia
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {learningCards.map((item) => (
                  <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600">{item.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="max-w-[1440px] mx-auto px-4 lg:px-8 pb-8">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { value: String(totalQuestionCount), label: "preguntas disponibles" },
                { value: "Gratis", label: "para empezar" },
                { value: "3", label: "niveles por materia" },
                { value: "100%", label: "en español" },
              ].map((item) => (
                <div key={item.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
                  <div className="text-2xl font-display font-black text-slate-800">{item.value}</div>
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </section>

          <SubjectGrid
            expandedSubject={expandedSubject}
            setExpandedSubject={setExpandedSubject}
            savedProgress={savedProgress}
            onStartQuiz={onStartQuiz}
          />

          <section id="articulos" aria-labelledby="articulos-titulo" className="max-w-[1440px] mx-auto px-4 lg:px-8 pb-16">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">Artículos y recursos</p>
              <h2 id="articulos-titulo" className="text-2xl font-display font-black text-slate-800 mb-2">
                Guías y recursos para estudiar mejor
              </h2>
              <p className="text-slate-500 max-w-2xl">
                Encuentra estrategias útiles para preparar tus exámenes, practicar por materias y mejorar tu rendimiento con un plan claro y realista.
              </p>
            </div>
            <div className="mb-6 hidden md:block">
              <AdSlotContent />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {articleCards.map((article) => (
                <a
                  key={article.title}
                  href={`#/articulo/${article.slug}`}
                  className="block bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
                >
                  <div className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 mb-3">
                    Recurso
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{article.title}</h3>
                  <p className="text-sm text-slate-500">{article.meta}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 mt-3">Leer guía →</span>
                </a>
              ))}
            </div>
          </section>

          <section aria-labelledby="guias-por-nivel" className="max-w-[1440px] mx-auto px-4 lg:px-8 pb-16">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">Guías por nivel</p>
              <h2 id="guias-por-nivel" className="text-2xl font-display font-black text-slate-800 mb-2">
                Elige tu nivel y empieza a practicar con estructura
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {guideCards.map((guide) => (
                <article key={guide.level} className={`border rounded-2xl p-5 bg-white shadow-sm ${guide.accent}`}>
                  <div className="text-xs font-bold uppercase tracking-[0.14em] mb-3">Nivel {guide.level}</div>
                  <h3 className="text-xl font-display font-black text-slate-800 mb-2">{guide.level}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{guide.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="faq-educativa" className="max-w-[1440px] mx-auto px-4 lg:px-8 pb-16">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">Preguntas frecuentes</p>
              <h2 id="faq-educativa" className="text-2xl font-display font-black text-slate-800 mb-2">
                Todo lo que suele preguntarse antes de empezar
              </h2>
            </div>
            <div className="space-y-4">
              {faqItems.map((item) => (
                <article key={item.q} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{item.q}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{item.a}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="retencion" className="max-w-[1440px] mx-auto px-4 lg:px-8 pb-16">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">Tu progreso</p>
              <h2 id="retencion" className="text-2xl font-display font-black text-slate-800 mb-2">
                Mantén la constancia y mejora cada semana
              </h2>
            </div>
            <div className="hidden md:block pb-6">
              <AdSlotContent />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {retentionCards.map((item) => (
                <article key={item.title} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-label="Espacio publicitario intermedio" className="max-w-[1440px] mx-auto px-4 lg:px-8 pb-8">
            <AdSlotContent />
          </section>

          <section className="max-w-[1440px] mx-auto px-4 lg:px-8 pb-16" aria-labelledby="explora-contenido">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">Explora el contenido</p>
              <h2 id="explora-contenido" className="text-2xl font-display font-black text-slate-800">
                Simulacros, fórmulas y guías para cada etapa
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-2">📋 Simulacros de Examen</div>
                    <h3 className="text-lg font-display font-black text-slate-800">Tests destacados</h3>
                    <p className="text-sm text-slate-400">Practica ahora mismo, sin necesidad de crear cuenta</p>
                  </div>
                  <button type="button" onClick={() => setActiveTab("simulacros")} className="text-xs font-bold text-blue-600 hover:text-blue-800 shrink-0 transition-colors">
                    Ver todos →
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {(
                    [
                      { subject: "matematicas" as Subject, level: "avanzado" as Level },
                      { subject: "historia" as Subject, level: "avanzado" as Level },
                      { subject: "gramatica" as Subject, level: "intermedio" as Level },
                    ] as const
                  ).map((item) => {
                    const cfg = subjectConfig[item.subject];
                    return (
                      <button
                        key={`item.subject-{item.level}`}
                        type="button"
                        onClick={() => onStartQuiz(item.subject, item.level)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-100 transition-all text-left w-full"
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0" aria-hidden="true">
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {cfg.label} — {levelLabels[item.level]}
                          </p>
                          <p className="text-xs text-slate-400">{quizData[item.subject][item.level].length} preguntas</p>
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full shrink-0">{levelLabels[item.level]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full mb-2">🧮 Fórmulas & Machetes</div>
                    <h3 className="text-lg font-display font-black text-slate-800">Cheat sheets escaneables</h3>
                    <p className="text-sm text-slate-400">Consulta rápida de fórmulas y reglas esenciales</p>
                  </div>
                  <button type="button" onClick={() => setActiveTab("formulas")} className="text-xs font-bold text-violet-600 hover:text-violet-800 shrink-0 transition-colors">
                    Ver todos →
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { title: "Fórmulas de Álgebra Lineal", tags: ["Matrices", "Determinantes", "Vectores"] },
                    { title: "Tabla de Figuras Retóricas", tags: ["Metáfora", "Hipérbole", "Anáfora"] },
                    { title: "Cronología Historia Universal", tags: ["Antigua", "Medieval", "Contemporánea"] },
                  ].map((sheet) => (
                    <div key={sheet.title} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-sm font-semibold text-slate-800 mb-2">{sheet.title}</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {sheet.tags.map((tag) => (
                          <span key={tag} className="text-xs bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {activeTab === "simulacros" && (
        <main className="max-w-[1440px] mx-auto px-4 lg:px-8 py-12">
          <Breadcrumb
            items={[
              { label: "Inicio", onClick: () => setActiveTab("inicio") },
              { label: "Simulacros", current: true },
            ]}
          />
          <div className="mb-8">
            <h1 className="text-3xl font-display font-black text-slate-900 mb-2">Simulacros de Examen</h1>
            <p className="text-slate-500">Tests de nivel avanzado por materia, ideales para practicar antes de un examen importante.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SUBJECTS.map((subj) => {
              const cfg = subjectConfig[subj];
              const qCount = quizData[subj].avanzado.length;
              return (
                <div key={subj} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all group">
                  <div className="h-2" style={{ background: cfg.color }} />
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl" aria-hidden="true">
                        {cfg.icon}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{cfg.label}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mb-4 leading-snug">
                      Simulacro {cfg.label} — {levelLabels.avanzado}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-5">
                      <span className="flex items-center gap-1">❓ {qCount} preguntas</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: cfg.color + "15", color: cfg.color }}>
                        {levelLabels.avanzado}
                      </span>
                      <button
                        type="button"
                        onClick={() => onStartQuiz(subj, "avanzado")}
                        className="text-xs font-bold text-white px-4 py-2 rounded-lg transition-all hover:opacity-90 group-hover:scale-105"
                        style={{ background: cfg.color }}
                      >
                        Comenzar →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {activeTab === "formulas" && (
        <main className="max-w-[1440px] mx-auto px-4 lg:px-8 py-12">
          <Breadcrumb
            items={[
              { label: "Inicio", onClick: () => setActiveTab("inicio") },
              { label: "Fórmulas", current: true },
            ]}
          />
          <div className="mb-8">
            <h1 className="text-3xl font-display font-black text-slate-900 mb-2">Fórmulas & Machetes</h1>
            <p className="text-slate-500">Resúmenes visuales, tablas de fórmulas y esquemas para repasar en minutos.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formulaSheets.map((sheet, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all">
                <div className="px-6 pt-5 pb-4 flex items-center gap-3" style={{ background: sheet.bg }}>
                  <span className="text-2xl" aria-hidden="true">
                    {sheet.icon}
                  </span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: sheet.color }}>
                      {sheet.subject}
                    </span>
                    <h3 className="text-base font-bold text-slate-800">{sheet.title}</h3>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <ul className="space-y-2">
                    {sheet.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <span className="mt-1 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: sheet.color }}>
                          {j + 1}
                        </span>
                        <span className="font-mono text-xs leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setOpenSheetIndex(i)}
                    className="mt-4 w-full py-2.5 rounded-xl border text-sm font-bold transition-all hover:opacity-80"
                    style={{ borderColor: sheet.color, color: sheet.color, background: sheet.bg }}
                  >
                    Ver machete completo →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {activeTab === "guias" && (
        <main className="max-w-[1440px] mx-auto px-4 lg:px-8 py-12">
          <Breadcrumb
            items={[
              { label: "Inicio", onClick: () => setActiveTab("inicio") },
              { label: "Guías", current: true },
            ]}
          />
          <div className="mb-8">
            <h1 className="text-3xl font-display font-black text-slate-900 mb-2">Guías de Estudio</h1>
            <p className="text-slate-500">Planes de estudio estructurados para dominar cada materia a tu ritmo.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STUDY_GUIDES.map((guide) => (
              <div key={guide.subject} className="bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all" style={{ borderColor: guide.border }}>
                <div className="p-6" style={{ background: guide.bg }}>
                  <span className="text-3xl block mb-3" aria-hidden="true">
                    {guide.icon}
                  </span>
                  <h3 className="text-xl font-display font-black text-slate-800 mb-1">{guide.subject}</h3>
                  <span className="text-xs font-bold" style={{ color: guide.color }}>
                    Plan de {guide.weeks} semanas
                  </span>
                </div>
                <div className="p-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Temario cubierto</p>
                  <ol className="space-y-2">
                    {guide.topics.map((topic, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
                        <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shrink-0" style={{ background: guide.color + "20", color: guide.color }}>
                          {i + 1}
                        </span>
                        {topic}
                      </li>
                    ))}
                  </ol>
                  <button
                    type="button"
                    onClick={() => onStartQuiz(guide.key, "basico")}
                    className="mt-5 w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: guide.color }}
                  >
                    Empezar por el nivel básico →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}
{activeTab === "inicio" && (
      <section className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-8 pb-4">
        <div className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-600 via-blue-700 to-violet-700 p-8 text-white shadow-lg shadow-blue-200/60">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100 mb-2">Sigue avanzando</p>
              <h2 className="text-2xl md:text-3xl font-display font-black mb-2">¿Listo para empezar tu siguiente prueba?</h2>
              <p className="text-blue-100 max-w-xl">Crea tu cuenta gratis para guardar tu progreso, o practica ahora mismo sin registrarte.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={onLogin} className="px-5 py-3 rounded-xl bg-white text-blue-700 font-bold shadow-sm hover:bg-blue-50 transition-all">
                Crear cuenta gratis
              </button>
              <button type="button" onClick={() => setActiveTab("simulacros")} className="px-5 py-3 rounded-xl border border-white/40 text-white font-bold hover:bg-white/10 transition-all">
                Ver simulacros
              </button>
            </div>
          </div>
        </div>
          </section>
)}
      <SiteFooter onTab={setTab} />


      {openSheetIndex !== null && formulaSheets[openSheetIndex] && (
        <FormulaSheetModal sheet={formulaSheets[openSheetIndex]} onClose={() => setOpenSheetIndex(null)} />
      )}
    </div>
  );
});

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("home");
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [activeLevel, setActiveLevel] = useState<Level | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [hashPage, setHashPage] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const syncRoute = useCallback(() => {
    const match = window.location.pathname.match(
      /^\/tests\/(matematicas|historia|gramatica|geografia|fisica|quimica)\/(basico|intermedio|avanzado)\/?$/,
    );
    if (match) {
      setActiveSubject(match[1] as Subject);
      setActiveLevel(match[2] as Level);
      setView("quiz");
      return;
    }
    setActiveSubject(null);
    setActiveLevel(null);
    setView("home");
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    syncRoute();
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, [syncRoute]);

  useEffect(() => {
    setPageMetadata(view === "quiz" ? activeSubject : null, view === "quiz" ? activeLevel : null);
  }, [activeLevel, activeSubject, view]);

  useEffect(() => {
    const knownHashPages = new Set(["privacy", "terms", "contact"]);
    const handler = () => {
      const raw = window.location.hash.replace(/^#\/?/, "");
      if (knownHashPages.has(raw) || /^articulo\/[a-z0-9-]+$/.test(raw)) {
        setHashPage(raw);
      } else {
        setHashPage(null);
      }
    };
    handler();
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const handleStartQuiz = useCallback((subject: Subject, level: Level) => {
    setActiveSubject(subject);
    setActiveLevel(level);
    setView("quiz");
    const path = testPath(subject, level);
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleBack = useCallback(() => {
    setView("home");
    setActiveSubject(null);
    setActiveLevel(null);
    // Prefer back if the previous entry was home; otherwise replace to avoid stacking
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.history.replaceState({}, "", "/");
    }
    // Ensure state matches home if popstate is delayed
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleCloseLogin = useCallback(() => setShowLogin(false), []);
  const handleOpenLogin = useCallback(() => {
    setAuthError(null);
    setShowLogin(true);
  }, []);

  const handleGoogleLogin = useCallback(async () => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      await signInWithGoogle();
      setShowLogin(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "No se pudo iniciar sesión con Google.");
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOutFromGoogle();
    } catch (error) {
      console.error("Error closing Google session", error);
    }
  }, []);

  const clearHash = useCallback(() => {
    window.location.hash = "";
    setHashPage(null);
  }, []);

  return (
    <>
      {hashPage === "privacy" && (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <Privacy onBack={clearHash} />
        </Suspense>
      )}
      {hashPage === "terms" && (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <Terms onBack={clearHash} />
        </Suspense>
      )}
      {hashPage === "contact" && (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <Contact onBack={clearHash} />
        </Suspense>
      )}
      {hashPage?.startsWith("articulo/") &&
        (() => {
          const slug = hashPage.slice("articulo/".length);
          const article = articleContent.find((a) => a.slug === slug);
          if (!article) {
            window.location.hash = "";
            return null;
          }
          return <Article article={article} onBack={clearHash} />;
        })()}

      {!hashPage && (
        <>
          {view === "home" && <HomeView onStartQuiz={handleStartQuiz} onLogin={handleOpenLogin} user={user} onLogout={handleLogout} />}
          {view === "quiz" && activeSubject && activeLevel && (
            <QuizView subject={activeSubject} level={activeLevel} onBack={handleBack} onLogin={handleOpenLogin} />
          )}
          {showLogin && (
            <LoginModal onClose={handleCloseLogin} onGoogleLogin={handleGoogleLogin} isLoading={isAuthLoading} authError={authError} />
          )}
        </>
      )}
    </>
  );
}

