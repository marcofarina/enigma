/**
 * Catalogo dei modelli di Enigma.
 *
 * Cablaggi e tacche sono quelli del simulatore di Summerside Makerspace, confrontati con
 * Crypto Museum e con il catalogo dei rotori di CryptoCellar. Rispetto all’originale:
 * - il riflettore delle macchine commerciali è impostabile a mano (ma resta fermo durante la cifratura);
 * - l’Uhr è disponibile solo sull’Enigma I (Luftwaffe, dal luglio 1944);
 * - l’UKW-D è disponibile solo su Enigma I e M4, dove ne è documentato l’impiego.
 *
 * Le tacche sono indicate con la lettera visibile nella finestrella quando il rotore,
 * al tasto successivo, fa avanzare quello alla sua sinistra.
 */

export type Stepping = 'lever' | 'gear';

export interface RotorSpec {
  wiring: string;
  notches: string;
  /** Rotore sottile della M4 (β, γ): occupa lo slot più a sinistra e non avanza mai. */
  thin?: boolean;
}

export interface ReflectorSpec {
  wiring: string;
  /** Riflettore sottile della M4: richiede un rotore sottile accanto. */
  thin?: boolean;
  /** UKW-D: cablaggio modificabile dall’operatore. */
  rewirable?: boolean;
}

export type ModelId =
  | 'I'
  | 'M3'
  | 'M4'
  | 'Norway'
  | 'D'
  | 'K'
  | 'SwissK'
  | 'KD'
  | 'Railway'
  | 'T'
  | 'A865'
  | 'G31'
  | 'G111'
  | 'G260'
  | 'G312';

/**
 * Anni documentati da Crypto Museum (consultato il 4 novembre 2026). Per alcuni modelli la fonte dà
 * gli anni d’uso, per altri quelli di produzione: `basis` dice quali.
 */
export interface ModelPeriod {
  from: number;
  /** Assente quando la fonte non dice fino a quando la macchina fu usata. */
  to?: number;
  basis: 'use' | 'production';
}

export interface ModelSpec {
  id: ModelId;
  label: string;
  /** Assente quando la fonte non dà anni per questo modello o esemplare. */
  period?: ModelPeriod;
  /** Chi la usava, secondo Crypto Museum; assente se non è noto. */
  users?: string;
  /** Modelli militari principali, messi in evidenza nell’interfaccia. */
  featured: boolean;
  stepping: Stepping;
  /** Cablaggio della ruota d’ingresso: la lettera in posizione i è collegata al contatto i. */
  entryWheel: string;
  plugboard: boolean;
  uhr: boolean;
  /** Il riflettore si può impostare a mano su 26 posizioni. */
  reflectorSettable: boolean;
  /** Il riflettore avanza durante la cifratura (Enigma G e contatore A-865). */
  reflectorRotates: boolean;
  rotors: Readonly<Record<string, RotorSpec>>;
  reflectors: Readonly<Record<string, ReflectorSpec>>;
}

export const ALPHABETIC_ETW = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const QWERTZ_ETW = 'QWERTZUIOASDFGHJKPYXCVBNML';

const MILITARY_ROTORS = {
  I: { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notches: 'Q' },
  II: { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notches: 'E' },
  III: { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notches: 'V' },
  IV: { wiring: 'ESOVPZJAYQUIRHXLNFTGKDCMWB', notches: 'J' },
  V: { wiring: 'VZBRGITYUPSDNHLXAWMJQOFECK', notches: 'Z' },
} as const satisfies Record<string, RotorSpec>;

const NAVAL_ROTORS = {
  VI: { wiring: 'JPGVOUMFYQBENHZRDKASXLICTW', notches: 'ZM' },
  VII: { wiring: 'NZJHGRCXMYSWBOUFAIVLPEKQDT', notches: 'ZM' },
  VIII: { wiring: 'FKQHTLXOCBJSPDZRAMEWNIUYGV', notches: 'ZM' },
} as const satisfies Record<string, RotorSpec>;

/** UKW-D nella notazione di Bletchley Park: la coppia J–Y è fissa; qui il cablaggio iniziale di riferimento. */
export const UKW_D_DEFAULT_WIRING = 'ZXWVUTSRQYPONMLKIHGFEDCBJA';
export const UKW_D_FIXED_PAIR = 'JY';

const UKW_D: ReflectorSpec = { wiring: UKW_D_DEFAULT_WIRING, rewirable: true };

const COMMERCIAL_ROTORS = {
  I: { wiring: 'LPGSZMHAEOQKVXRFYBUTNICJDW', notches: 'Y' },
  II: { wiring: 'SLVGBTFXJQOHEWIRZYAMKPCNDU', notches: 'E' },
  III: { wiring: 'CJGDPSHKTURAWZXFMYNQOBVLIE', notches: 'N' },
} as const satisfies Record<string, RotorSpec>;

const COMMERCIAL_UKW: ReflectorSpec = { wiring: 'IMETCGFRAYSQBZXWLHKDVUPOJN' };

/** Tacche multiple dei rotori a ingranaggi (A-865 e serie G). */
const G_NOTCHES = { I: 'SUVWZABCEFGIKLOPQ', II: 'STVYZACDFGHKMNQ', III: 'UWXAEFHKMNR' } as const;

const commercial = {
  stepping: 'lever',
  entryWheel: QWERTZ_ETW,
  plugboard: false,
  uhr: false,
  reflectorSettable: true,
  reflectorRotates: false,
  featured: false,
} as const;

const gearDriven = {
  ...commercial,
  stepping: 'gear',
  reflectorRotates: true,
} as const;

export const MODELS: Readonly<Record<ModelId, ModelSpec>> = {
  I: {
    id: 'I',
    label: 'Enigma I',
    period: { from: 1930, to: 1945, basis: 'use' },
    users: 'Esercito (Heer) e aviazione (Luftwaffe)',
    featured: true,
    stepping: 'lever',
    entryWheel: ALPHABETIC_ETW,
    plugboard: true,
    uhr: true,
    reflectorSettable: false,
    reflectorRotates: false,
    rotors: MILITARY_ROTORS,
    reflectors: {
      A: { wiring: 'EJMZALYXVBWFCRQUONTSPIKHGD' },
      B: { wiring: 'YRUHQSLDPXNGOKMIEBFZCWVJAT' },
      C: { wiring: 'FVPJIAOYEDRZXWGCTKUQSBNMHL' },
      D: UKW_D,
    },
  },
  M3: {
    id: 'M3',
    label: 'Enigma M3',
    period: { from: 1934, to: 1945, basis: 'use' },
    users: 'Marina (Kriegsmarine): M1 dal 1934, M2 dal 1938, M3 dal 1940',
    featured: true,
    stepping: 'lever',
    entryWheel: ALPHABETIC_ETW,
    plugboard: true,
    uhr: false,
    reflectorSettable: false,
    reflectorRotates: false,
    rotors: { ...MILITARY_ROTORS, ...NAVAL_ROTORS },
    reflectors: {
      B: { wiring: 'YRUHQSLDPXNGOKMIEBFZCWVJAT' },
      C: { wiring: 'FVPJIAOYEDRZXWGCTKUQSBNMHL' },
    },
  },
  M4: {
    id: 'M4',
    label: 'Enigma M4',
    period: { from: 1942, to: 1945, basis: 'use' },
    users: 'Marina (Kriegsmarine), soprattutto i sommergibili',
    featured: true,
    stepping: 'lever',
    entryWheel: ALPHABETIC_ETW,
    plugboard: true,
    uhr: false,
    reflectorSettable: false,
    reflectorRotates: false,
    rotors: {
      Beta: { wiring: 'LEYJVCNIXWPBQMDRTAKZGFUHOS', notches: '', thin: true },
      Gamma: { wiring: 'FSOKANUERHMBTIYCWLQPZXVGJD', notches: '', thin: true },
      ...MILITARY_ROTORS,
      ...NAVAL_ROTORS,
    },
    reflectors: {
      'B-thin': { wiring: 'ENKQAUYWJICOPBLMDXZVFTHRGS', thin: true },
      'C-thin': { wiring: 'RDOBJNTKVEHMLFCWZAXGYIPSUQ', thin: true },
      D: UKW_D,
    },
  },
  Norway: {
    id: 'Norway',
    label: 'Enigma norvegese (Norenigma)',
    period: { from: 1945, basis: 'use' },
    users: 'Polizia di sicurezza norvegese (Overvaakingspolitiet), con Enigma I catturate',
    featured: false,
    stepping: 'lever',
    entryWheel: ALPHABETIC_ETW,
    plugboard: true,
    uhr: false,
    reflectorSettable: false,
    reflectorRotates: false,
    rotors: {
      I: { wiring: 'WTOKASUYVRBXJHQCPZEFMDINLG', notches: 'Q' },
      II: { wiring: 'GJLPUBSWEMCTQVHXAOFZDRKYNI', notches: 'E' },
      III: { wiring: 'JWFMHNBPUSDYTIXVZGRQLAOEKC', notches: 'V' },
      IV: { wiring: 'ESOVPZJAYQUIRHXLNFTGKDCMWB', notches: 'J' },
      V: { wiring: 'HEJXQOTZBVFDASCILWPGYNMURK', notches: 'Z' },
    },
    reflectors: { UKW: { wiring: 'MOWJYPUXNDSRAIBFVLKZGQCHET' } },
  },
  D: {
    id: 'D',
    label: 'Enigma D (commerciale)',
    period: { from: 1926, to: 1927, basis: 'production' },
    users: 'Uso commerciale',
    ...commercial,
    rotors: COMMERCIAL_ROTORS,
    reflectors: { UKW: COMMERCIAL_UKW },
  },
  K: {
    id: 'K',
    label: 'Enigma K (commerciale)',
    period: { from: 1927, to: 1944, basis: 'production' },
    users: 'Uso commerciale; ferrovie tedesche, marina italiana, Spagna, Svizzera',
    ...commercial,
    rotors: COMMERCIAL_ROTORS,
    reflectors: { UKW: COMMERCIAL_UKW },
  },
  SwissK: {
    id: 'SwissK',
    label: 'Enigma K svizzera',
    period: { from: 1939, to: 1946, basis: 'use' },
    users: 'Esercito, aviazione e ministero degli esteri svizzeri',
    ...commercial,
    rotors: {
      I: { wiring: 'PEZUOHXSCVFMTBGLRINQJWAYDK', notches: 'Y' },
      II: { wiring: 'ZOUESYDKFWPCIQXHMVBLGNJRAT', notches: 'E' },
      III: { wiring: 'EHRVXGAOBQUSIMZFLYNWKTPDJC', notches: 'N' },
    },
    reflectors: { UKW: COMMERCIAL_UKW },
  },
  KD: {
    id: 'KD',
    label: 'Enigma KD',
    period: { from: 1944, to: 1945, basis: 'use' },
    users: 'Mil Amt, il servizio informazioni succeduto all’Abwehr, sulla linea Berlino–Madrid–Lisbona',
    ...commercial,
    rotors: {
      I: { wiring: 'VEZIOJCXKYDUNTWAPLQGBHSFMR', notches: 'SUYAEHLNQ' },
      II: { wiring: 'HGRBSJZETDLVPMQYCXAOKINFUW', notches: 'SUYAEHLNQ' },
      III: { wiring: 'NWLHXGRBYOJSAZDVTPKFQMEUIC', notches: 'SUYAEHLNQ' },
    },
    // Il riflettore originale era riconfigurabile (UKW-D); qui il cablaggio dell’esemplare noto.
    reflectors: { UKW: { wiring: 'KOTVPNLMJIAGHFBEWYXCZDQSRU' } },
  },
  Railway: {
    id: 'Railway',
    label: 'Enigma delle ferrovie (Rocket)',
    period: { from: 1940, to: 1944, basis: 'use' },
    users: 'Ferrovie tedesche (Deutsche Reichsbahn)',
    ...commercial,
    rotors: {
      I: { wiring: 'JGDQOXUSCAMIFRVTPNEWKBLZYH', notches: 'N' },
      II: { wiring: 'NTZPSFBOKMWRCJDIVLAEYUXHGQ', notches: 'E' },
      III: { wiring: 'JVIUBHTCDYAKEQZPOSGXNRMWFL', notches: 'Y' },
    },
    reflectors: { UKW: { wiring: 'QYHOGNECVPUZTFDJAXWMKISRBL' } },
  },
  T: {
    id: 'T',
    label: 'Enigma T (Tirpitz)',
    period: { from: 1943, to: 1945, basis: 'use' },
    users: 'Collegamenti fra la marina tedesca e quella giapponese',
    ...commercial,
    entryWheel: 'KZROUQHYAIGBLWVSTDXFPNMCJE',
    rotors: {
      I: { wiring: 'KPTYUELOCVGRFQDANJMBSWHZXI', notches: 'WZEKQ' },
      II: { wiring: 'UPHZLWEQMTDJXCAKSOIGVBYFNR', notches: 'WZFLR' },
      III: { wiring: 'QUDLYRFEKONVZAXWHMGPJBSICT', notches: 'WZEKQ' },
      IV: { wiring: 'CIWTBKXNRESPFLYDAGVHQUOJZM', notches: 'WZFLR' },
      V: { wiring: 'UAXGISNJBVERDYLFZWTPCKOHMQ', notches: 'YCFKR' },
      VI: { wiring: 'XFUZGALVHCNYSEWQTDMRBKPIOJ', notches: 'XEIMQ' },
      VII: { wiring: 'BJVFTXPLNAYOZIKWGDQERUCHSM', notches: 'YCFKR' },
      VIII: { wiring: 'YMTPNZHWKODAJXELUQVGCBISFR', notches: 'XEIMQ' },
    },
    reflectors: { UKW: { wiring: 'GEKPBTAUMOCNILJDXZYFHWVQSR' } },
  },
  A865: {
    id: 'A865',
    label: 'Enigma con contatore (A-865)',
    period: { from: 1928, to: 1931, basis: 'production' },
    users: 'Marina olandese (esemplare A865)',
    ...gearDriven,
    rotors: {
      I: { wiring: COMMERCIAL_ROTORS.I.wiring, notches: G_NOTCHES.I },
      II: { wiring: COMMERCIAL_ROTORS.II.wiring, notches: G_NOTCHES.II },
      III: { wiring: COMMERCIAL_ROTORS.III.wiring, notches: G_NOTCHES.III },
    },
    reflectors: { UKW: COMMERCIAL_UKW },
  },
  G31: {
    id: 'G31',
    label: 'Enigma G (G-31)',
    period: { from: 1931, to: 1943, basis: 'production' },
    users: 'Abwehr, esercito ungherese, marina olandese',
    ...gearDriven,
    rotors: {
      I: { wiring: COMMERCIAL_ROTORS.I.wiring, notches: G_NOTCHES.I },
      II: { wiring: COMMERCIAL_ROTORS.II.wiring, notches: G_NOTCHES.II },
      III: { wiring: COMMERCIAL_ROTORS.III.wiring, notches: G_NOTCHES.III },
    },
    reflectors: { UKW: COMMERCIAL_UKW },
  },
  G111: {
    id: 'G111',
    label: 'Enigma G (G-111)',
    users: 'Esercito ungherese',
    ...gearDriven,
    rotors: {
      I: { wiring: 'WLRHBQUNDKJCZSEXOTMAGYFPVI', notches: G_NOTCHES.I },
      II: { wiring: 'TFJQAZWMHLCUIXRDYGOEVBNSKP', notches: G_NOTCHES.II },
      V: { wiring: 'QTPIXWVDFRMUSLJOHCANEZKYBG', notches: 'SWZFHMQ' },
    },
    reflectors: { UKW: COMMERCIAL_UKW },
  },
  G260: {
    id: 'G260',
    label: 'Enigma G (G-260)',
    users: 'Probabilmente il Sicherheitsdienst, rete Rot; sequestrata in Argentina nel 1945',
    ...gearDriven,
    rotors: {
      I: { wiring: 'RCSPBLKQAUMHWYTIFZVGOJNEXD', notches: G_NOTCHES.I },
      II: { wiring: 'WCMIBVPJXAROSGNDLZKEYHUFQT', notches: G_NOTCHES.II },
      III: { wiring: 'FVDHZELSQMAXOKYIWPGCBUJTNR', notches: G_NOTCHES.III },
    },
    reflectors: { UKW: COMMERCIAL_UKW },
  },
  G312: {
    id: 'G312',
    label: 'Enigma G (G-312)',
    users: 'Abwehr',
    ...gearDriven,
    rotors: {
      I: { wiring: 'DMTWSILRUYQNKFEJCAZBPGXOHV', notches: G_NOTCHES.I },
      II: { wiring: 'HQZGPJTMOBLNCIFDYAWVEUSRKX', notches: G_NOTCHES.II },
      III: { wiring: 'UQNTLSZFMREHDPXKIBVYGJCWOA', notches: G_NOTCHES.III },
    },
    reflectors: { UKW: { wiring: 'RULQMZJSYGOCETKWDAHNBXPVIF' } },
  },
};

export const MODEL_IDS = Object.keys(MODELS) as ModelId[];

export function isModelId(value: string): value is ModelId {
  return Object.hasOwn(MODELS, value);
}

/** Rotori normali e sottili disponibili per un modello, nell’ordine del catalogo. */
export function rotorNames(model: ModelSpec): { regular: string[]; thin: string[] } {
  const entries = Object.entries(model.rotors);
  return {
    regular: entries.filter(([, spec]) => !spec.thin).map(([name]) => name),
    thin: entries.filter(([, spec]) => spec.thin).map(([name]) => name),
  };
}
