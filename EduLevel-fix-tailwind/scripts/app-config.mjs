// scripts/app-config.mjs
// App.tsx is the single source of truth for subjects, levels and quiz counts.
// This build-time reader lets the prerenderer consume that existing config
// without maintaining a second manual copy.

import { readFile } from "node:fs/promises";
import path from "node:path";

const appPath = path.resolve(import.meta.dirname, "..", "src", "App.tsx");

function findObjectLiteral(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) throw new Error(`No se encontró ${marker} en App.tsx`);
  const start = source.indexOf("{", markerIndex);
  if (start === -1) throw new Error(`No se encontró el objeto de ${marker}`);

  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "/" && next === "/") {
      lineComment = true;
      i += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      blockComment = true;
      i += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }

  throw new Error(`Objeto incompleto para ${marker}`);
}

function topLevelEntries(objectText) {
  const entries = {};
  let i = 1;

  while (i < objectText.length - 1) {
    while (/\s|,/.test(objectText[i] ?? "")) i += 1;
    const keyMatch = objectText.slice(i).match(/^([A-Za-z_$][\w$]*)\s*:/);
    if (!keyMatch) break;

    const key = keyMatch[1];
    const valueStart = i + keyMatch[0].length;
    let j = valueStart;
    let depth = 0;
    let quote = null;
    let escaped = false;

    for (; j < objectText.length - 1; j += 1) {
      const char = objectText[j];
      if (quote) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === quote) quote = null;
        continue;
      }
      if (char === '"' || char === "'" || char === "`") {
        quote = char;
        continue;
      }
      if (char === "{" || char === "[" || char === "(") depth += 1;
      else if (char === "}" || char === "]" || char === ")") depth -= 1;
      else if (char === "," && depth === 0) break;
    }

    entries[key] = objectText.slice(valueStart, j).trim();
    i = j + 1;
  }

  return entries;
}

function readStringLiteral(value) {
  const match = value.match(/^["']([\s\S]*)["']$/);
  if (!match) throw new Error(`Se esperaba una cadena, se obtuvo: ${value}`);
  return match[1];
}

function countQuestions(arrayText) {
  return (arrayText.match(/\bid\s*:/g) ?? []).length;
}

function buildConfig(source) {
  const subjectsObject = findObjectLiteral(source, "const subjectConfig =");
  const levelsObject = findObjectLiteral(source, "const levelLabels");
  const quizObject = findObjectLiteral(source, "const quizData:");

  const subjectEntries = topLevelEntries(subjectsObject);
  const levelEntries = topLevelEntries(levelsObject);
  const quizEntries = topLevelEntries(quizObject);
  const subjects = {};

  for (const [subject, value] of Object.entries(subjectEntries)) {
    const config = topLevelEntries(value);
    const quizLevels = topLevelEntries(quizEntries[subject]);
    const counts = {};

    for (const level of Object.keys(levelEntries)) {
      if (!quizLevels[level]) throw new Error(`Falta ${subject}.${level} en quizData`);
      counts[level] = countQuestions(quizLevels[level]);
    }

    subjects[subject] = {
      label: readStringLiteral(config.label),
      questionCounts: counts,
    };
  }

  return {
    subjects,
    levels: Object.fromEntries(
      Object.entries(levelEntries).map(([key, value]) => [key, readStringLiteral(value)]),
    ),
  };
}

const source = await readFile(appPath, "utf-8");
export const appConfig = buildConfig(source);
export const subjectLabels = Object.fromEntries(
  Object.entries(appConfig.subjects).map(([key, value]) => [key, value.label]),
);
export const levelLabels = appConfig.levels;
export const questionCounts = Object.fromEntries(
  Object.entries(appConfig.subjects).map(([key, value]) => [key, value.questionCounts]),
);
