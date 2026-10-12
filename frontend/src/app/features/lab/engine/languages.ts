import { LabFile, LabLanguage } from '../models/lab.models';

const BY_EXTENSION: Record<string, LabLanguage> = {
  html: 'html',
  htm: 'html',
  css: 'css',
  js: 'javascript',
  mjs: 'javascript',
  ts: 'typescript',
  java: 'java',
};

export function languageOf(path: string): LabLanguage {
  const extension = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  return BY_EXTENSION[extension] ?? 'text';
}

export function isScript(path: string): boolean {
  const language = languageOf(path);
  return language === 'javascript' || language === 'typescript';
}

export const LANGUAGE_LABEL: Record<LabLanguage, string> = {
  html: 'HTML',
  css: 'CSS',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  java: 'Java',
  text: 'Texto',
};

const PATH_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9_.-]*(\/[A-Za-z0-9_][A-Za-z0-9_.-]*)*$/;

/** Why a path cannot be used for a new or renamed file, or null when it can. */
export function pathProblem(path: string, files: readonly LabFile[], current?: string): string | null {
  if (!path) {
    return 'Escribe un nombre de archivo.';
  }
  if (path.length > 120 || !PATH_PATTERN.test(path)) {
    return 'Usa letras, números, guiones y puntos; las carpetas se separan con /.';
  }
  if (languageOf(path) === 'text') {
    return 'El archivo debe terminar en .html, .css, .js, .ts o .java.';
  }
  if (path !== current && files.some((file) => file.path.toLowerCase() === path.toLowerCase())) {
    return 'Ya existe un archivo con ese nombre.';
  }
  return null;
}

/** Resolves a relative reference (`./util`, `../css/a.css`) from the file that makes it. */
export function resolvePath(from: string, reference: string): string {
  const clean = reference.split(/[?#]/)[0];
  const base = clean.startsWith('/') ? [] : from.split('/').slice(0, -1);
  for (const part of clean.split('/')) {
    if (part === '..') {
      base.pop();
    } else if (part && part !== '.') {
      base.push(part);
    }
  }
  return base.join('/');
}

/** True for references that leave the project: other sites, data URLs, anchors. */
export function isExternalReference(reference: string): boolean {
  return /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference.trim());
}
