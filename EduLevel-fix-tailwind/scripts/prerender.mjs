// scripts/prerender.mjs
//
// Genera un archivo HTML estático por cada combinación materia/nivel dentro de
// dist/tests/<subject>/<level>/index.html. Cada archivo es una copia del
// index.html generado por Vite con el <title>, las etiquetas <meta>, el
// <link rel="canonical"> y el JSON-LD reemplazados por los datos reales de
// ese test, para que los rastreadores que no ejecutan JavaScript (o que solo
// leen el HTML inicial) reciban contenido y metadatos específicos.
//
// El <div id="root"> y el <script type="module" src="/assets/..."> se
// mantienen intactos, así que React hidrata normalmente sobre este HTML en
// cuanto el navegador ejecuta JS — el comportamiento de la SPA no cambia.
//
// La configuración de materias, niveles y cantidad de preguntas se lee
// directamente de src/App.tsx mediante app-config.mjs. App.tsx es la única
// fuente de verdad; el prerender ya no mantiene copias manuales.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { subjectLabels, levelLabels, questionCounts } from "./app-config.mjs";

const distDir = path.resolve(import.meta.dirname, "..", "dist");
const indexPath = path.join(distDir, "index.html");
const siteUrl = "https://edulvl.com";

function buildHtml(template, subject, level) {
  const subjectLabel = subjectLabels[subject];
  const levelLabel = levelLabels[level];
  const questionCount = questionCounts[subject][level];
  const canonical = `${siteUrl}/tests/${subject}/${level}`;
  const title = `${subjectLabel}: test de nivel ${levelLabel} | EduLevel`;
  const description = `Practica ${subjectLabel} con un test interactivo de nivel ${levelLabel} (${questionCount} preguntas). Revisa tus respuestas al finalizar.`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Quiz",
        name: title,
        description,
        url: canonical,
        inLanguage: "es",
        educationalLevel: levelLabel,
        about: subjectLabel,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "EduLevel", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: subjectLabel, item: canonical },
          { "@type": "ListItem", position: 3, name: `Nivel ${levelLabel}`, item: canonical },
        ],
      },
    ],
  };

  let html = template;

  html = html.replace(/<title>.*?<\/title>/s, `<title>${title}</title>`);
  html = html.replace(
    /<meta name="description" content=".*?"\s*\/?>/,
    `<meta name="description" content="${description}" />`,
  );
  html = html.replace(
    /<link rel="canonical" href=".*?"\s*\/?>/,
    `<link rel="canonical" href="${canonical}" />`,
  );
  html = html.replace(
    /<meta property="og:title" content=".*?"\s*\/?>/,
    `<meta property="og:title" content="${title}" />`,
  );
  html = html.replace(
    /<meta property="og:description" content=".*?"\s*\/?>/,
    `<meta property="og:description" content="${description}" />`,
  );
  html = html.replace(
    /<meta property="og:url" content=".*?"\s*\/?>/,
    `<meta property="og:url" content="${canonical}" />`,
  );

  // Reemplaza el JSON-LD de WebApplication genérico por el Quiz/BreadcrumbList específico.
  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">${JSON.stringify(schema)}</script>`,
  );

  // Contenido visible mínimo para rastreadores que no ejecutan JS (noscript).
  const noscriptBlock = `<noscript><h1>${title}</h1><p>${description}</p></noscript>`;
  html = html.replace("<div id=\"root\"></div>", `<div id="root"></div>\n    ${noscriptBlock}`);

  return html;
}

async function main() {
  if (!existsSync(indexPath)) {
    console.error(`No se encontró ${indexPath}. Corre "vite build" antes de este script.`);
    process.exit(1);
  }

  const template = await readFile(indexPath, "utf-8");
  let count = 0;

  for (const subject of Object.keys(subjectLabels)) {
    for (const level of Object.keys(levelLabels)) {
      const outDir = path.join(distDir, "tests", subject, level);
      await mkdir(outDir, { recursive: true });
      const html = buildHtml(template, subject, level);
      await writeFile(path.join(outDir, "index.html"), html, "utf-8");
      count += 1;
    }
  }

  console.log(`✓ Prerenderizadas ${count} páginas de test en dist/tests/<materia>/<nivel>/index.html`);
}

main();
