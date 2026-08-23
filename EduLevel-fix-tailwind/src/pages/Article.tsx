import React, { useEffect } from 'react'

export type ArticleSection = {
  heading: string
  paragraphs: string[]
  tips?: string[]
}

export type ArticleData = {
  slug: string
  title: string
  subject: string
  readTime: string
  accent: string
  accentLight: string
  intro: string
  sections: ArticleSection[]
}

export const articles: ArticleData[] = [
  {
    slug: 'matematicas-examenes',
    title: 'Cómo estudiar matemáticas para exámenes',
    subject: 'Matemáticas',
    readTime: '5 min de lectura',
    accent: '#2347C5',
    accentLight: '#EFF4FF',
    intro:
      'Matemáticas no se estudia memorizando, se estudia practicando. Esta guía te da un método concreto para preparar un examen sin perder tiempo en técnicas que no funcionan.',
    sections: [
      {
        heading: '1. Diagnosticá antes de repasar todo desde cero',
        paragraphs: [
          'El error más común es releer la teoría de principio a fin como si nunca la hubieras visto. En vez de eso, hacé primero un test corto (podés usar uno de los tests de EduLevel del nivel que te toque) y anotá qué temas fallaste, no solo cuántos.',
          'Ese diagnóstico te dice exactamente dónde poner el tiempo. Si fallaste en ecuaciones de segundo grado pero dominás las de primer grado, no tiene sentido repasar ambas por igual.',
        ],
      },
      {
        heading: '2. Estudiá por bloques de problemas, no por páginas de teoría',
        paragraphs: [
          'La teoría de matemáticas se entiende de verdad resolviendo problemas, no leyéndola dos veces. Un buen bloque de estudio es: leer la definición o fórmula (5 minutos), resolver 3 ejercicios guiados mirando un ejemplo resuelto, y después resolver 3 ejercicios solo, sin ayuda.',
          'Si en esos últimos 3 ejercicios te trabás, no es momento de rendirte: volvé al ejemplo resuelto, identificá el paso exacto que no entendiste, y recién ahí intentá de nuevo.',
        ],
        tips: [
          'Nunca copies una solución sin haber intentado el ejercicio primero.',
          'Anotá los errores que se repiten — suelen ser el 80% de los puntos que se pierden en un examen.',
        ],
      },
      {
        heading: '3. Simulá el examen real, con tiempo limitado',
        paragraphs: [
          'Los últimos días antes del examen, dejá de estudiar temas nuevos y empezá a hacer simulacros completos con cronómetro. Esto entrena algo que la teoría sola no entrena: la gestión del tiempo bajo presión.',
          'Si en el simulacro te quedás sin tiempo, no es un fracaso — es información. Fijate en qué ejercicio perdiste más minutos de los necesarios y practicá ese tipo de problema hasta resolverlo más rápido.',
        ],
      },
      {
        heading: '4. El día anterior, no aprendas nada nuevo',
        paragraphs: [
          'La noche anterior al examen sirve para repasar tus propios errores anotados, no para abrir un tema nuevo. Aprender algo nuevo bajo presión de tiempo genera más ansiedad que resultado real.',
          'Dormí bien. El rendimiento en matemáticas depende mucho de la memoria de trabajo, y esa es una de las primeras capacidades que se resiente con poco sueño.',
        ],
      },
    ],
  },
  {
    slug: 'gramatica-redaccion',
    title: 'Guía para mejorar en gramática y redacción',
    subject: 'Gramática',
    readTime: '6 min de lectura',
    accent: '#6D3FD1',
    accentLight: '#F4F0FE',
    intro:
      'Mejorar en gramática y redacción no requiere memorizar reglas sueltas, sino entender por qué existen y practicar con textos reales. Esta guía te propone un camino simple para avanzar en ambas a la vez.',
    sections: [
      {
        heading: '1. Separá los dos problemas: gramática y redacción no son lo mismo',
        paragraphs: [
          'La gramática es correcta o incorrecta: concordancia, ortografía, uso de tildes, puntuación. La redacción es una cuestión de claridad y estilo: cómo ordenás las ideas para que se entiendan rápido.',
          'Podés escribir una frase perfectamente correcta desde lo gramatical y que igual sea difícil de entender. Por eso conviene trabajar cada cosa por separado antes de mezclarlas.',
        ],
      },
      {
        heading: '2. Para gramática: practicá con tus propios errores, no con listas genéricas',
        paragraphs: [
          'En vez de estudiar reglas de tildación o de uso de "b/v" sueltas, guardá un cuaderno con los errores reales que cometiste en tests o redacciones anteriores. Repasar tus propios errores fija la regla mucho mejor que memorizarla en abstracto.',
          'Prestá especial atención a los errores que se repiten: normalmente son 4 o 5 reglas concretas (por ejemplo, tildación de palabras esdrújulas, uso de "que" vs "qué", o coma antes de "pero") las que explican la mayoría de los errores en un examen.',
        ],
        tips: [
          'Leé en voz alta lo que escribiste: el oído detecta errores de concordancia que el ojo se salta.',
          'Cuando dudes entre dos formas, buscá la regla una sola vez y anotala — no la busques de nuevo cada vez.',
        ],
      },
      {
        heading: '3. Para redacción: escribí primero, ordená después',
        paragraphs: [
          'Un error común es intentar que la primera oración quede perfecta antes de seguir escribiendo. Esto frena la idea completa. Es más efectivo escribir un borrador completo sin frenarte a corregir, y recién en una segunda pasada trabajar la claridad de cada frase.',
          'En esa segunda pasada, buscá frases largas y dividilas en dos si notás que perdés el hilo al leerlas. Un buen indicador: si una frase necesita más de una coma para respirar, probablemente funcione mejor separada.',
        ],
      },
      {
        heading: '4. Practicá con textos cortos y variados',
        paragraphs: [
          'No hace falta escribir un ensayo largo cada vez que practicás. Redactar un resumen de 5 líneas sobre una noticia, o responder una pregunta de comprensión lectora con tus propias palabras, entrena exactamente las mismas habilidades que necesitás en un examen de gramática y redacción.',
          'Alternar entre tipos de texto (narrativo, argumentativo, descriptivo) también te prepara mejor que practicar siempre el mismo formato, porque cada examen suele pedir un tipo distinto de respuesta.',
        ],
      },
    ],
  },
  {
    slug: 'historia-selectividad',
    title: 'Qué estudiar para historia en selectividad',
    subject: 'Historia',
    readTime: '7 min de lectura',
    accent: '#D9852A',
    accentLight: '#FEF6EA',
    intro:
      'Historia es una de las materias donde más rinde estudiar con una estructura clara, porque la cantidad de contenido puede abrumar si se estudia sin un plan. Esta guía te propone cómo priorizar y cómo repasar de forma efectiva.',
    sections: [
      {
        heading: '1. Armá una línea de tiempo antes de estudiar los detalles',
        paragraphs: [
          'Antes de memorizar fechas y nombres sueltos, dibujá (en papel o en un documento) una línea de tiempo simple con los grandes períodos y eventos que suele pedir el examen. Esto te da un "mapa" mental donde ubicar después cada dato nuevo.',
          'Cuando estudiás un evento nuevo, preguntate siempre dónde va en esa línea y qué evento vino justo antes y justo después. Esa relación de causa y consecuencia es lo que más se pregunta en los exámenes de selectividad, más que la fecha exacta.',
        ],
      },
      {
        heading: '2. Priorizá causas y consecuencias por sobre fechas exactas',
        paragraphs: [
          'Un examen de historia rara vez pregunta solo "¿en qué año pasó X?". Suele pedir explicar por qué pasó, qué lo provocó, y qué cambió después. Por eso, al estudiar un evento, dedicále más tiempo a entender el "por qué" que a memorizar el año exacto.',
          'Un buen ejercicio: por cada evento importante, escribí en una sola línea su causa principal y su consecuencia principal. Si podés hacer eso de memoria, ya tenés la base de cualquier pregunta de desarrollo sobre ese tema.',
        ],
        tips: [
          'Agrupá eventos por tema (económico, político, social) además de por fecha — ayuda a responder preguntas comparativas.',
          'Los exámenes de selectividad valoran mucho poder relacionar dos períodos distintos, no solo describir uno.',
        ],
      },
      {
        heading: '3. Practicá preguntas de desarrollo, no solo repaso pasivo',
        paragraphs: [
          'Leer los apuntes una y otra vez da una falsa sensación de dominio. La forma real de saber si dominás un tema es intentar responder una pregunta de desarrollo con tus propias palabras, sin mirar el apunte, y después comparar.',
          'Si al comparar ves que te faltaron datos clave, no te limites a agregarlos: preguntate por qué se te olvidaron. Muchas veces es porque no entendiste bien la relación causal, no porque te falte memoria.',
        ],
      },
      {
        heading: '4. Los últimos días: repasá por período, no por tema suelto',
        paragraphs: [
          'En la recta final, en vez de repasar cada evento por separado, repasá período por período completo (por ejemplo, todo el siglo XIX de corrido). Esto refuerza las conexiones entre eventos, que es justo lo que más rinde en preguntas de desarrollo largo.',
          'Terminá el repaso con un simulacro cronometrado de una pregunta de desarrollo completa, para practicar organizar una respuesta larga en el tiempo real que vas a tener en el examen.',
        ],
      },
    ],
  },
]

export default function Article({ article, onBack }: { article: ArticleData; onBack?: () => void }) {
  useEffect(() => {
    const prev = document.title
    document.title = `${article.title} — EduLevel`
    return () => { document.title = prev }
  }, [article])

  return (
    <div className="min-h-screen bg-background">
      <header
        className="relative overflow-hidden dot-grid-bg"
        style={{ background: 'linear-gradient(160deg, #0E1D54 0%, #152A79 45%, #2347C5 100%)' }}
      >
        <div
          className="pointer-events-none absolute -top-24 right-[-10%] w-[420px] h-[420px] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-glow) 0%, transparent 70%)' }}
        />
        <div className="relative max-w-[760px] mx-auto px-4 pt-10 pb-14">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-100 hover:text-white transition-colors mb-6"
          >
            ← Volver
          </button>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider backdrop-blur-sm">
            📘 {article.subject} · {article.readTime}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">{article.title}</h1>
          <p className="text-blue-100 max-w-xl leading-relaxed">{article.intro}</p>
        </div>
        <svg className="relative block w-full text-background" viewBox="0 0 900 28" fill="none" preserveAspectRatio="none" style={{ height: '24px' }} aria-hidden="true">
          <path d="M0 28 C 225 0, 675 0, 900 28 L900 28 L0 28 Z" fill="currentColor" />
        </svg>
      </header>

      <main className="max-w-[760px] mx-auto px-4 -mt-2 pb-16">
        <article className="bg-white border border-slate-200 rounded-2xl p-6 md:p-10">
          {article.sections.map((section, i) => (
            <section key={i} className={i > 0 ? 'mt-8 pt-8 border-t border-slate-100' : ''}>
              <h2 className="font-display text-xl font-bold text-slate-900 mb-3">{section.heading}</h2>
              {section.paragraphs.map((p, j) => (
                <p key={j} className="text-[15px] leading-relaxed text-slate-600 mb-3">{p}</p>
              ))}
              {section.tips && (
                <div
                  className="mt-4 rounded-xl p-4 space-y-2"
                  style={{ background: article.accentLight }}
                >
                  {section.tips.map((tip, k) => (
                    <div key={k} className="flex items-start gap-2 text-sm" style={{ color: article.accent }}>
                      <span className="mt-0.5 shrink-0">💡</span>
                      <span className="font-medium">{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </article>

        <div className="mt-8 text-center">
          <button onClick={onBack} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            ← Volver a artículos y recursos
          </button>
        </div>
      </main>
    </div>
  )
}
