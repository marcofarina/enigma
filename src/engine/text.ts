/**
 * Preparazione del testo in chiaro. La tastiera di Enigma ha solo 26 lettere: niente spazi,
 * cifre, punteggiatura o accenti. Gli operatori seguivano convenzioni (per esempio X al posto
 * del punto e numeri scritti in lettere); qui si possono scegliere quelle da applicare.
 */

export interface PrepareOptions {
  /** `drop` elimina la punteggiatura; `x` sostituisce con X il punto e gli altri segni di fine frase. */
  punctuation?: 'drop' | 'x';
  /** `drop` elimina le cifre; `spell` le scrive in lettere, cifra per cifra, in italiano. */
  digits?: 'drop' | 'spell';
}

const DIGIT_WORDS = ['ZERO', 'UNO', 'DUE', 'TRE', 'QUATTRO', 'CINQUE', 'SEI', 'SETTE', 'OTTO', 'NOVE'];

/** Trasforma un testo libero nella sequenza di lettere A–Z da digitare sulla macchina. */
export function prepareText(text: string, options: PrepareOptions = {}): string {
  const { punctuation = 'drop', digits = 'drop' } = options;
  let result = '';
  const normalized = text
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/ß/g, 'ss')
    .toUpperCase();
  for (const char of normalized) {
    if (char >= 'A' && char <= 'Z') result += char;
    else if (char >= '0' && char <= '9') {
      if (digits === 'spell') result += DIGIT_WORDS[Number(char)];
    } else if (punctuation === 'x' && /[.!?;:]/.test(char)) {
      result += 'X';
    }
  }
  return result;
}

/** Divide le lettere in gruppi (di cinque, come nei radiogrammi), separati da spazi. */
export function groupLetters(letters: string, size = 5): string {
  const groups: string[] = [];
  for (let i = 0; i < letters.length; i += size) groups.push(letters.slice(i, i + size));
  return groups.join(' ');
}
