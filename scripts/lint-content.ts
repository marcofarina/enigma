import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { lintContent, lintJson, lintYaml } from './content-rules.ts';

const root = join(import.meta.dirname, '..', 'src', 'content');
const strings = join(import.meta.dirname, '..', 'src', 'i18n', 'it.json');

/** Nomi propri ammessi: un file di testo, una voce per riga, # per i commenti. */
const properNames = readFileSync(join(import.meta.dirname, 'nomi-propri.txt'), 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line !== '' && !line.startsWith('#'));

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (/\.(mdx?|ya?ml)$/.test(entry.name)) yield path;
  }
}

function lintFile(file: string) {
  const source = readFileSync(file, 'utf8');
  if (file.endsWith('.json')) return lintJson(source, properNames);
  if (/\.ya?ml$/.test(file)) return lintYaml(source, properNames);
  return lintContent(source, properNames);
}

let errors = 0;
let warnings = 0;
for (const file of [...walk(root), strings]) {
  for (const issue of lintFile(file)) {
    const where = `${relative(process.cwd(), file)}:${issue.line}`;
    console.log(`${issue.severity === 'error' ? '✖' : '⚠'} ${where} [${issue.rule}] ${issue.message}`);
    if (issue.severity === 'error') errors++;
    else warnings++;
  }
}

console.log(`\n${errors} errori, ${warnings} avvisi.`);
process.exit(errors > 0 ? 1 : 0);
