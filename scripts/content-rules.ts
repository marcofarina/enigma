/**
 * Regole tipografiche per la prosa italiana dei contenuti (vedi docs/piano.md).
 * Valgono solo per il testo discorsivo: blocchi di codice, codice inline, import/export
 * e tag JSX vengono ignorati.
 */

export type Severity = 'error' | 'warning';

export interface Issue {
  line: number;
  severity: Severity;
  rule: string;
  message: string;
}

/** Sostituisce i nomi propri ammessi con un segnaposto, così le regole sulle maiuscole li saltano. */
type Mask = (text: string) => string;

interface Rule {
  rule: string;
  severity: Severity;
  message: string;
  test: (prose: string, mask: Mask) => boolean;
}

const byPattern = (pattern: RegExp) => (prose: string) => pattern.test(prose);

/**
 * Struttura delle virgolette in una riga: caporali dentro caporali, “ ” fuori da una citazione.
 * Distinguere una citazione da un termine fra virgolette non è meccanico: per questo il
 * secondo caso è solo un avviso.
 */
function quoteDepthIssue(prose: string): 'annidati' | 'fuori-caporali' | null {
  let depth = 0;
  let outside = false;
  for (const char of prose) {
    if (char === '«') {
      if (depth > 0) return 'annidati';
      depth++;
    } else if (char === '»') depth = Math.max(0, depth - 1);
    else if (char === '“' && depth === 0) outside = true;
  }
  return outside ? 'fuori-caporali' : null;
}

const rules: Rule[] = [
  {
    rule: 'virgolette-diritte',
    severity: 'error',
    test: byPattern(/"/),
    message: 'Usa « » per le citazioni (e “ ” per quelle interne), non le virgolette diritte.',
  },
  {
    rule: 'apostrofo-diritto',
    severity: 'error',
    test: byPattern(/'/),
    message: 'Usa l’apostrofo tipografico ’ al posto di quello diritto.',
  },
  {
    rule: 'inciso-trattino',
    severity: 'error',
    test: byPattern(/\s[-–]\s/),
    message: 'Per gli incisi usa il trattino lungo — al posto di - o –.',
  },
  {
    rule: 'puntini-sospensione',
    severity: 'error',
    test: byPattern(/\.{3}/),
    message: 'Usa il carattere unico … al posto dei tre punti.',
  },
  {
    rule: 'parola-vietata',
    severity: 'error',
    test: byPattern(/(?<!\p{L})sennò(?!\p{L})/iu),
    message: '«Sennò» è scorretto: usa «altrimenti», «se no» o «in caso contrario».',
  },
  {
    rule: 'qual-e',
    severity: 'error',
    test: byPattern(/(?<!\p{L})qual['’]\s*è(?!\p{L})/iu),
    message: '«Qual è» si scrive senza apostrofo: «qual» è un troncamento, non un’elisione.',
  },
  {
    rule: 'acronimo-con-punti',
    severity: 'error',
    test: byPattern(/\b(?:[A-Z]\.){2,}/),
    message: 'Scrivi gli acronimi in maiuscolo senza punti (per esempio USA, non U.S.A.).',
  },
  {
    rule: 'migliaia-non-separabili',
    severity: 'error',
    // Spazio normale o punto fra i gruppi di tre cifre: «17 576» può andare a capo a metà numero.
    test: byPattern(/(?<![\d.,])\d{1,3}(?:[ .]\d{3})+(?!\d)/),
    message: 'Raggruppa le cifre a tre a tre con lo spazio non separabile (U+00A0), non con spazio o punto.',
  },
  {
    rule: 'caporali-annidati',
    severity: 'error',
    test: (prose) => quoteDepthIssue(prose) === 'annidati',
    message: 'Dentro una citazione tra « » le virgolette interne sono “ ”, non altri caporali.',
  },
  {
    rule: 'virgolette-fuori-caporali',
    severity: 'warning',
    test: (prose) => quoteDepthIssue(prose) === 'fuori-caporali',
    message: 'Le citazioni vanno tra « »: “ ” solo dentro una citazione o per un termine.',
  },
  {
    rule: 'matematica-unicode',
    severity: 'warning',
    // Apici e pedici Unicode (² ³ ¹, ⁻, ⁿ, ₀…) e il × fra due numeri: vanno in <Formula>.
    test: byPattern(/[²³¹⁰-₟ᴬ-ᵪ]|\d\s*×\s*\d/),
    message: 'La matematica in prosa va scritta con <Formula>, non con caratteri Unicode o ×.',
  },
  {
    rule: 'maiuscola-dopo-due-punti',
    severity: 'warning',
    test: (prose, mask) => /[:;] [A-ZÀÈÉÌÒÙ][a-zà-ù]/.test(mask(prose)),
    message: 'Dopo due punti o punto e virgola di norma non va la maiuscola (salvo nomi propri).',
  },
  {
    rule: 'numero-in-cifre',
    severity: 'warning',
    // Le date restano in cifre: “il 10 luglio 1944”. Dopo un articolo elisso (“dal 31 all’1”)
    // il numero è un giorno o un’ora, non una quantità.
    test: byPattern(
      /(?<![\d.,/’'-])\b(?:[0-9]|10)\b(?![\d.,/×x-]) (?!(?:gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\b)[a-zà-ù]/,
    ),
    message: 'I numeri fino a dieci vanno scritti in lettere nel testo discorsivo.',
  },
];

/** Toglie dalla riga le parti che non sono prosa. */
function stripNonProse(line: string): string {
  return line
    .replace(/`[^`]*`/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\{[^}]*\}/g, '')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/https?:\/\/\S+/g, '');
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Prepara il mascheramento dei nomi propri; i più lunghi vanno per primi («Bletchley Park» prima di «Park»). */
function createMask(properNames: readonly string[]): Mask {
  if (properNames.length === 0) return (text) => text;
  const alternatives = [...properNames]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives})(?![\\p{L}\\p{N}])`, 'gu');
  return (text) => text.replace(pattern, '·');
}

/** Maiuscole in un titolo: la prima parola è esclusa, i nomi propri ammessi sono già mascherati. */
function checkHeading(text: string): string | null {
  const words = text
    .split(/\s+/)
    .slice(1)
    .flatMap((w) => w.split(/[’']/));
  const capitalized = words.filter((w) => /^[A-ZÀÈÉÌÒÙ][a-zà-ù]+$/.test(w));
  return capitalized.length > 0 ? capitalized.join(', ') : null;
}

function proseIssues(prose: string, mask: Mask, errorsOnly = false): Omit<Issue, 'line'>[] {
  return rules
    .filter((r) => !errorsOnly || r.severity === 'error')
    .filter((r) => r.test(prose, mask))
    .map(({ severity, rule, message }) => ({ severity, rule, message }));
}

export function lintContent(source: string, properNames: readonly string[] = []): Issue[] {
  const mask = createMask(properNames);
  const issues: Issue[] = [];
  const lines = source.split('\n');
  let inFence = false;
  let inQuote = false;
  let inFrontmatter = lines[0]?.trim() === '---';

  lines.forEach((raw, index) => {
    const line = index + 1;
    if (index === 0 && inFrontmatter) return;
    if (inFrontmatter) {
      if (raw.trim() === '---') {
        inFrontmatter = false;
        return;
      }
      // Nel frontmatter si controllano solo i valori testuali di title e description.
      const match = /^(title|description):\s*(.*)$/.exec(raw);
      if (!match?.[2]) return;
      const value = match[2].replace(/^(['"])(.*)\1$/, '$2');
      for (const issue of proseIssues(value, mask, true)) issues.push({ line, ...issue });
      return;
    }
    if (/^\s*(```|~~~)/.test(raw)) {
      inFence = !inFence;
      return;
    }
    // Il corpo di <Citazione> è già una citazione: il componente fa da caporali, e dentro valgono “ ”.
    if (/^\s*<Citazione[\s>]/.test(raw)) inQuote = !/<\/Citazione>/.test(raw);
    else if (/^\s*<\/Citazione>/.test(raw)) inQuote = false;
    if (inFence || /^\s*(import|export)\s/.test(raw) || /^\s*<\/?[A-Za-z]/.test(raw)) return;

    const prose = stripNonProse(raw);
    for (const issue of proseIssues(inQuote ? `«${prose}»` : prose, mask)) issues.push({ line, ...issue });
    const heading = /^#{1,6}\s+(.*)$/.exec(raw);
    if (heading?.[1]) {
      const words = checkHeading(mask(stripNonProse(heading[1])));
      if (words) {
        issues.push({
          line,
          severity: 'warning',
          rule: 'maiuscole-titolo',
          message: `Nei titoli la maiuscola va solo sulla prima parola e sui nomi propri: controlla ${words}.`,
        });
      }
    }
  });

  return issues;
}

/** Campi dei file YAML che contengono prosa italiana. */
const YAML_PROSE_FIELDS = ['definizione', 'didascalia', 'descrizione', 'contesto', 'procedura', 'traduzione'];

/** Regole della prosa applicate ai campi testuali di un file YAML dei contenuti. */
export function lintYaml(source: string, properNames: readonly string[] = []): Issue[] {
  const mask = createMask(properNames);
  const issues: Issue[] = [];
  source.split('\n').forEach((raw, index) => {
    const match = /^\s*-?\s*([a-z]+):\s*(.+)$/.exec(raw);
    if (!match?.[1] || !match[2] || !YAML_PROSE_FIELDS.includes(match[1])) return;
    const value = match[2].replace(/^(['"])(.*)\1$/, '$2');
    for (const issue of proseIssues(stripNonProse(value), mask)) issues.push({ line: index + 1, ...issue });
  });
  return issues;
}

/** Regole della prosa applicate ai valori di un file JSON di stringhe (`src/i18n/it.json`). */
export function lintJson(source: string, properNames: readonly string[] = []): Issue[] {
  const mask = createMask(properNames);
  const issues: Issue[] = [];
  const lines = source.split('\n');
  const entries = Object.entries(JSON.parse(source) as Record<string, unknown>);
  for (const [key, value] of entries) {
    if (typeof value !== 'string') continue;
    const marker = `${JSON.stringify(key)}:`;
    const line = lines.findIndex((l) => l.trimStart().startsWith(marker)) + 1;
    // Le etichette brevi (senza punto) sono contatori e intervalli, come «1 lettera» o «da 1 a 5»:
    // restano in cifre. La regola dei numeri vale per le frasi.
    const isSentence = value.includes('.');
    for (const issue of proseIssues(stripNonProse(value), mask)) {
      if (issue.rule === 'numero-in-cifre' && !isSentence) continue;
      issues.push({ line, ...issue });
    }
  }
  return issues;
}
