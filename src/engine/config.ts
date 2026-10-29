import { isLetter, LETTER_COUNT } from './alphabet.ts';
import { isModelId, MODELS, UKW_D_FIXED_PAIR, type ModelId, type ModelSpec } from './models.ts';

/**
 * Impostazioni complete di una macchina (la “chiave”), in forma leggibile.
 * Tutte le sequenze vanno da sinistra a destra, come le vede l’operatore.
 */
export interface MachineConfig {
  model: ModelId;
  /** Walzenlage: nomi dei rotori, per esempio `['II', 'IV', 'V']` o `['Beta', 'II', 'IV', 'I']`. */
  rotors: readonly string[];
  /** Ringstellung: una lettera per rotore, `A` = anello in posizione 01. */
  rings: string;
  /** Grundstellung: le lettere visibili nelle finestrelle. */
  positions: string;
  reflector: string;
  /** Posizione del riflettore, solo per i modelli che ne permettono la regolazione. */
  reflectorPosition?: string;
  /** Steckerverbindungen: coppie di lettere, per esempio `['AV', 'BS']`. */
  plugboard?: readonly string[];
  /**
   * Posizione dell’Uhr (0–39). Richiede esattamente 10 cavi: per ogni coppia del pannello,
   * la prima lettera riceve la spina rossa (a) e la seconda quella bianca (b), nell’ordine 1–10.
   */
  uhr?: number;
  /** Cablaggio dell’UKW-D: 12 coppie in notazione di Bletchley Park (J–Y è fissa e va omessa). */
  ukwD?: readonly string[];
}

export type ConfigField =
  'model' | 'rotors' | 'rings' | 'positions' | 'reflector' | 'reflectorPosition' | 'plugboard' | 'uhr' | 'ukwD';

export interface ConfigIssue {
  field: ConfigField;
  message: string;
}

export class InvalidConfigError extends Error {
  readonly issues: readonly ConfigIssue[];

  constructor(issues: readonly ConfigIssue[]) {
    super(issues.map((issue) => issue.message).join(' '));
    this.name = 'InvalidConfigError';
    this.issues = issues;
  }
}

/** Numero di rotori richiesti: 4 sulla M4 con riflettore sottile, altrimenti 3. */
export function expectedRotorCount(model: ModelSpec, reflector: string): number {
  return model.reflectors[reflector]?.thin ? 4 : 3;
}

function lettersOf(value: string, length: number, field: ConfigField, label: string, issues: ConfigIssue[]) {
  if (value.length !== length || ![...value].every(isLetter)) {
    issues.push({ field, message: `${label}: servono ${length} lettere da A a Z.` });
  }
}

function checkPairs(pairs: readonly string[], field: ConfigField, label: string, issues: ConfigIssue[]): boolean {
  const used = new Set<string>();
  for (const pair of pairs) {
    if (pair.length !== 2 || !isLetter(pair[0] ?? '') || !isLetter(pair[1] ?? '') || pair[0] === pair[1]) {
      issues.push({ field, message: `${label}: «${pair}» non è una coppia di lettere diverse.` });
      return false;
    }
    for (const letter of pair) {
      if (used.has(letter)) {
        issues.push({ field, message: `${label}: la lettera ${letter} è usata più di una volta.` });
        return false;
      }
      used.add(letter);
    }
  }
  return true;
}

/** Controlla che la configurazione sia realizzabile sulla macchina reale. Restituisce l’elenco dei problemi. */
export function validateConfig(config: MachineConfig): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  if (!isModelId(config.model)) {
    return [{ field: 'model', message: `Il modello «${config.model}» non esiste.` }];
  }
  const model = MODELS[config.model];

  const reflector = model.reflectors[config.reflector];
  if (!reflector) {
    issues.push({ field: 'reflector', message: `Il riflettore «${config.reflector}» non esiste per ${model.label}.` });
  }

  const count = expectedRotorCount(model, config.reflector);
  if (config.rotors.length !== count) {
    issues.push({ field: 'rotors', message: `Servono ${count} rotori.` });
  } else {
    const seen = new Set<string>();
    config.rotors.forEach((name, slot) => {
      const spec = model.rotors[name];
      if (!spec) {
        issues.push({ field: 'rotors', message: `Il rotore «${name}» non esiste per ${model.label}.` });
        return;
      }
      if (seen.has(name)) {
        issues.push({
          field: 'rotors',
          message: `Il rotore ${name} è montato due volte: ogni rotore esiste in un solo esemplare.`,
        });
      }
      seen.add(name);
      const wantsThin = count === 4 && slot === 0;
      if (Boolean(spec.thin) !== wantsThin) {
        issues.push({
          field: 'rotors',
          message: wantsThin
            ? 'Con un riflettore sottile, lo slot più a sinistra richiede un rotore sottile (Beta o Gamma).'
            : `Il rotore sottile ${name} può stare solo nello slot più a sinistra, accanto a un riflettore sottile.`,
        });
      }
    });
  }

  lettersOf(config.rings, count, 'rings', 'Anelli', issues);
  lettersOf(config.positions, count, 'positions', 'Posizioni iniziali', issues);

  if (config.reflectorPosition !== undefined && config.reflectorPosition !== 'A') {
    if (!model.reflectorSettable) {
      issues.push({ field: 'reflectorPosition', message: `Su ${model.label} il riflettore non si può regolare.` });
    } else {
      lettersOf(config.reflectorPosition, 1, 'reflectorPosition', 'Posizione del riflettore', issues);
    }
  }

  const plugboard = config.plugboard ?? [];
  if (plugboard.length > 0 && !model.plugboard) {
    issues.push({ field: 'plugboard', message: `${model.label} non ha il pannello a spine.` });
  } else if (checkPairs(plugboard, 'plugboard', 'Pannello a spine', issues) && plugboard.length > LETTER_COUNT / 2) {
    issues.push({ field: 'plugboard', message: 'Pannello a spine: al massimo 13 cavi.' });
  }

  if (config.uhr !== undefined) {
    if (!model.uhr) {
      issues.push({ field: 'uhr', message: `L’Uhr non si usava con ${model.label}.` });
    } else {
      if (!Number.isInteger(config.uhr) || config.uhr < 0 || config.uhr > 39) {
        issues.push({ field: 'uhr', message: 'L’Uhr ha 40 posizioni, da 0 a 39.' });
      }
      if (plugboard.length !== 10) {
        issues.push({ field: 'uhr', message: 'L’Uhr richiede esattamente 10 cavi sul pannello a spine.' });
      }
    }
  }

  if (config.ukwD !== undefined) {
    if (!reflector?.rewirable) {
      issues.push({ field: 'ukwD', message: 'Solo l’UKW-D si può ricablare.' });
    } else if (checkPairs(config.ukwD, 'ukwD', 'UKW-D', issues)) {
      const letters = config.ukwD.join('');
      if ([...UKW_D_FIXED_PAIR].some((letter) => letters.includes(letter))) {
        issues.push({ field: 'ukwD', message: 'UKW-D: la coppia J–Y è fissa e non si può spostare.' });
      } else if (config.ukwD.length !== 12) {
        issues.push({ field: 'ukwD', message: 'UKW-D: servono 12 coppie, oltre a J–Y.' });
      }
    }
  }

  return issues;
}
