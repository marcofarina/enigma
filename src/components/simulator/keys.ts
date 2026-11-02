import { prepareText } from '@/engine';

/** Disposizione QWERTZ di tastiera e lampade, comune all’Enigma I e alle macchine commerciali. */
export const KEYBOARD_ROWS = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'] as const;

export type KeyAction = { type: 'letter'; letter: string } | { type: 'undo' } | null;

type KeyLike = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'repeat'>;

/**
 * Traduce un tasto della tastiera fisica. Contano solo le lettere (anche accentate, “è” vale E,
 * con o senza Maiuscolo) e Backspace, che annulla. Le scorciatoie con Ctrl, Alt o Cmd e la
 * ripetizione automatica di un tasto tenuto premuto vengono ignorate: ogni pressione è un passo.
 */
export function keyAction(event: KeyLike): KeyAction {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return null;
  if (event.key === 'Backspace') return { type: 'undo' };
  if ([...event.key].length !== 1) return null;
  const letter = prepareText(event.key);
  return letter.length === 1 ? { type: 'letter', letter } : null;
}

/**
 * Campi in cui le lettere servono a scrivere o a scegliere. Caselle, pulsanti di opzione e cursori
 * non usano le lettere: con il focus su di loro i tasti vanno alla macchina.
 */
const EDITABLE =
  'textarea, select, [contenteditable=""], [contenteditable="true"], ' +
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]):not([type="reset"])';

/** Vero se il tasto è destinato a un campo di testo o a un menu, e non alla macchina. */
export function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as Partial<Element> | null;
  if (typeof element?.closest !== 'function') return false;
  return Boolean(element.closest(EDITABLE));
}
