// scripts/app-config.mjs
//
// Reads the existing quiz configuration directly from src/App.tsx at build time.
// App.tsx remains the single source of truth; the prerenderer does not maintain
// a second manual copy of subjects, levels, labels, or question counts.

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
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === "//") {
      lineComment = true;
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
    if (char === "}") {
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

function stringProperty(objectText, property) {
  const match = objectText.match(new RegExp(`\\b${property}\\s*:\\s*(["'])(.*?)\\1`));
  if (!match) throw new Error(`No se encontró ${property}`);
  return match[2];
}

function countQuestions(arrayText) {
  return (arrayText.match(/\bid\s*:/g) ?? []).length;
}

function buildConfig(source) {
  const subjectsObject = findObjectLiteral(source, "const subjectConfig =");
  const levelsMatch = source.match(/const levelLabels[^=]*=\s*({[\s\S]*?})\s*;/);
  if (!levelsMatch) throw new Error("No se encontró levelLabels en App.tsx");

  const subjectEntries = topLevelEntries(subjectsObject);
  const levelEntries = topLevelEntries(levelsMatch[1]);
  const quizObject = findObjectLiteral(source, "const quizData:");
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
      label: stringProperty(value, "label"),
      questionCounts: counts,
    };
  }

  return {
    subjects,
    levels: Object.fromEntries(
      Object.entries(levelEntries).map(([key, value]) => [key, stringProperty(value, "")]),
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
