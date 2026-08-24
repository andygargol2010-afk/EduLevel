// scripts/prerender.mjs
//
// Genera HTML estático para tests y artículos. La configuración de tests se
// lee desde src/App.tsx mediante app-config.mjs. Los metadatos de artículos se
// extraen directamente de src/pages/Article.tsx para evitar otra fuente de
// verdad duplicada.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { subjectLabels, levelLabels, questionCounts } from "./app-config.mjs";

const projectDir = path.resolve(import.meta.dirname, "..");
const distDir = path.join(projectDir, "dist");
const indexPath = path.join(distDir, "index.html");
const articleSourcePath = path.join(projectDir, "src", "pages", "Article.tsx");
const siteUrl = "https://edulvl.com";

// Firebase Authentication: el dominio de producción autorizado es edulvl.com.
// Esta autorización vive en Firebase Console, no en el código del repositorio.

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function extractArticles(source) {
  const articles = [];
  const articleRegex = /\{\s*slug:\s*'([^']+)'\s*,\s*title:\s*'([^']+)'\s*,\s*subject:\s*'([^']+)'\s*,\s*readTime:\s*'([^']+)'\s*,[\s\S]*?intro:\s*\n?\s*'([^']+)'/g;
  let match;

  while ((match = articleRegex.exec(source)) !== null) {
    articles.push({
      slug: match[1],
      title: match[2],
      subject: match[3],
      readTime: match[4],
      intro: match[5],
    });
  }

  if (!articles.length) {
    throw new Error("No se pudieron extraer los artículos desde src/pages/Article.tsx.");
  }

  return articles;
}

function replaceMeta(html, selectorRegex, replacement) {
  return html.replace(selectorRegex, replacement);
}

function buildTestHtml(template, subject, level) {
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
  html = replaceMeta(html, /<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`);
  html = replaceMeta(html, /<meta name="description" content=".*?"\s*\/?>/, `<meta name="description" content="${escapeHtml(description)}" />`);
  html = replaceMeta(html, /<link rel="canonical" href=".*?"\s*\/?>/, `<link rel="canonical" href="${canonical}" />`);
  html = replaceMeta(html, /<meta property="og:title" content=".*?"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = replaceMeta(html, /<meta property="og:description" content=".*?"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = replaceMeta(html, /<meta property="og:url" content=".*?"\s*\/?>/, `<meta property="og:url" content="${canonical}" />`);
  html = replaceMeta(html, /<meta name="twitter:title" content=".*?"\s*\/?>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  html = replaceMeta(html, /<meta name="twitter:description" content=".*?"\s*\/?>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  html = replaceMeta(html, /<meta name="twitter:url" content=".*?"\s*\/?>/, `<meta name="twitter:url" content="${canonical}" />`);
  html = replaceMeta(html, /<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify(schema)}</script>`);

  return html;
}

function buildArticleHtml(template, article) {
  const canonical = `${siteUrl}/articulos/${article.slug}`;
  const title = `${article.title} | EduLevel`;
  const description = article.intro;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        description,
        url: canonical,
        inLanguage: "es",
        articleSection: article.subject,
        author: { "@type": "Organization", name: "EduLevel", url: siteUrl },
        publisher: { "@type": "Organization", name: "EduLevel", url: siteUrl },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "EduLevel", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "Artículos", item: `${siteUrl}/articulos` },
          { "@type": "ListItem", position: 3, name: article.title, item: canonical },
        ],
      },
    ],
  };

  let html = template;
  html = replaceMeta(html, /<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`);
  html = replaceMeta(html, /<meta name="description" content=".*?"\s*\/?>/, `<meta name="description" content="${escapeHtml(description)}" />`);
  html = replaceMeta(html, /<link rel="canonical" href=".*?"\s*\/?>/, `<link rel="canonical" href="${canonical}" />`);
  html = replaceMeta(html, /<meta property="og:title" content=".*?"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = replaceMeta(html, /<meta property="og:description" content=".*?"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = replaceMeta(html, /<meta property="og:url" content=".*?"\s*\/?>/, `<meta property="og:url" content="${canonical}" />`);
  html = replaceMeta(html, /<meta name="twitter:title" content=".*?"\s*\/?>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  html = replaceMeta(html, /<meta name="twitter:description" content=".*?"\s*\/?>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  html = replaceMeta(html, /<meta name="twitter:url" content=".*?"\s*\/?>/, `<meta name="twitter:url" content="${canonical}" />`);
  html = replaceMeta(html, /<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify(schema)}</script>`);

  const noscriptBlock = `<noscript><article><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(description)}</p><p>Artículo educativo de ${escapeHtml(article.subject)} · ${escapeHtml(article.readTime)}.</p></article></noscript>`;
  html = html.replace('<div id="root"></div>', `<div id="root"></div>\n    ${noscriptBlock}`);

  return html;
}

function buildSitemap(subjects, levels, articles) {
  const urls = [
    `${siteUrl}/`,
    ...Object.keys(subjects).flatMap((subject) => Object.keys(levels).map((level) => `${siteUrl}/tests/${subject}/${level}`)),
    `${siteUrl}/articulos`,
    ...articles.map((article) => `${siteUrl}/articulos/${article.slug}`),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`;
}

async function main() {
  if (!existsSync(indexPath)) {
    console.error(`No se encontró ${indexPath}. Corre "vite build" antes de este script.`);
    process.exit(1);
  }

  const [template, articleSource] = await Promise.all([
    readFile(indexPath, "utf-8"),
    readFile(articleSourcePath, "utf-8"),
  ]);
  const articles = extractArticles(articleSource);
  let testCount = 0;

  for (const subject of Object.keys(subjectLabels)) {
    for (const level of Object.keys(levelLabels)) {
      const outDir = path.join(distDir, "tests", subject, level);
      await mkdir(outDir, { recursive: true });
      await writeFile(path.join(outDir, "index.html"), buildTestHtml(template, subject, level), "utf-8");
      testCount += 1;
    }
  }

  for (const article of articles) {
    const outDir = path.join(distDir, "articulos", article.slug);
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, "index.html"), buildArticleHtml(template, article), "utf-8");
  }

  await writeFile(path.join(distDir, "sitemap.xml"), buildSitemap(subjectLabels, levelLabels, articles), "utf-8");

  console.log(`✓ Prerenderizadas ${testCount} páginas de test y ${articles.length} artículos.`);
  console.log(`✓ Sitemap generado con tests y artículos.`);
}

main();
