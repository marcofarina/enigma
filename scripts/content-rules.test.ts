import { describe, expect, it } from 'vitest';
import { lintContent, lintJson, lintYaml } from './content-rules.ts';

const rulesOf = (source: string, properNames: string[] = []) =>
  lintContent(source, properNames).map((issue) => issue.rule);

describe('lintContent', () => {
  it('accetta la prosa con caratteri tipografici corretti', () => {
    expect(lintContent('L’operatore preme un tasto — e si accende una «lampada».')).toEqual([]);
  });

  it('segnala virgolette e apostrofi diritti', () => {
    expect(rulesOf('L\'operatore disse "ciao".')).toEqual(['virgolette-diritte', 'apostrofo-diritto']);
  });

  it('segnala gli incisi con trattino corto e gli acronimi con i punti', () => {
    expect(rulesOf('La macchina - brevettata nel 1918 - arrivò negli U.S.A.')).toEqual([
      'inciso-trattino',
      'acronimo-con-punti',
    ]);
  });

  it('ignora codice, import e tag JSX', () => {
    const source = [
      "import Figura from '@/components/Figura.astro';",
      '```js',
      "const a = 'x';",
      '```',
      '<Figura src="a.png" alt="Rotore" />',
      'Il valore `"A"` resta com’è.',
    ].join('\n');
    expect(lintContent(source)).toEqual([]);
  });

  it('controlla title e description nel frontmatter', () => {
    const source = ['---', "title: 'Che cos'è Enigma'", 'ordine: 1', '---', 'Testo.'].join('\n');
    expect(rulesOf(source)).toEqual(['apostrofo-diritto']);
  });

  it('avvisa per maiuscole nei titoli e numeri piccoli in cifre', () => {
    expect(rulesOf('## Il Riflettore')).toEqual(['maiuscole-titolo']);
    expect(rulesOf('La macchina ha 3 rotori.')).toEqual(['numero-in-cifre']);
    expect(rulesOf('Nel 1918 e con 26 lettere.')).toEqual([]);
    expect(rulesOf('Arrivò il 10 luglio 1944, con 3 giorni di ritardo.')).toEqual(['numero-in-cifre']);
    expect(rulesOf('Arrivò il 2 novembre 1944.')).toEqual([]);
  });

  it('non scambia per quantità il numero dopo un articolo elisso', () => {
    expect(rulesOf('I giorni vanno dal 31 all’1 in basso.')).toEqual([]);
    expect(rulesOf('Il foglio ha 1 riga.')).toEqual(['numero-in-cifre']);
  });
});

describe('puntini, parole vietate, migliaia', () => {
  it('vuole il carattere … e non i tre punti', () => {
    expect(rulesOf('E così via...')).toEqual(['puntini-sospensione']);
    expect(rulesOf('E così via…')).toEqual([]);
    expect(rulesOf('Vedi [la guida](../../guida/) e `a...b`.')).toEqual([]);
  });

  it('vieta «sennò» con ogni maiuscola, ma non le parole che lo contengono', () => {
    expect(rulesOf('Premi il tasto, sennò non succede nulla.')).toEqual(['parola-vietata']);
    expect(rulesOf('Sennò niente.')).toEqual(['parola-vietata']);
    expect(rulesOf('Altrimenti non succede nulla.')).toEqual([]);
  });

  it('vieta «qual’è» con l’apostrofo diritto o tipografico', () => {
    expect(rulesOf('Qual’è la chiave?')).toEqual(['qual-e']);
    expect(rulesOf('Qual è la chiave?')).toEqual([]);
    expect(rulesOf("Qual'è la chiave?")).toEqual(['apostrofo-diritto', 'qual-e']);
  });

  it('vuole lo spazio non separabile fra i gruppi di cifre', () => {
    expect(rulesOf('Sono 17 576 posizioni.')).toEqual(['migliaia-non-separabili']);
    expect(rulesOf('Sono 150.000 miliardi.')).toEqual(['migliaia-non-separabili']);
    expect(rulesOf('Sono 17 576 posizioni.')).toEqual([]);
    expect(rulesOf('Nel 1944 arrivarono 26 lettere e 3,14 giri.')).toEqual([]);
    expect(rulesOf('Nel 1944 arrivarono 26 lettere e 100 giri.')).toEqual([]);
  });
});

describe('virgolette (D2)', () => {
  it('vieta i caporali dentro una citazione', () => {
    expect(rulesOf('«Disse «ciao» e se ne andò».')).toEqual(['caporali-annidati']);
    expect(rulesOf('«Disse “ciao” e se ne andò».')).toEqual([]);
  });

  it('avvisa per “ ” fuori da una citazione', () => {
    expect(rulesOf('Premi “Ricomincia” per ripartire.')).toEqual(['virgolette-fuori-caporali']);
    expect(rulesOf('Lo chiamò «la macchina “quasi” perfetta».')).toEqual([]);
  });

  it('tratta il corpo di <Citazione> come una citazione', () => {
    const source = ['<Citazione fonte="x">', 'Il cablaggio “traduce” la lettera.', '</Citazione>'];
    expect(rulesOf(source.join('\n'))).toEqual([]);
    expect(rulesOf(['<Citazione fonte="x">', 'Disse «ciao».', '</Citazione>'].join('\n'))).toEqual([
      'caporali-annidati',
    ]);
    expect(rulesOf([...source, 'Premi “Ricomincia”.'].join('\n'))).toEqual(['virgolette-fuori-caporali']);
  });

  it('applica i caporali anche a title e description, ma non gli avvisi', () => {
    const source = ['---', 'title: Il «Cifrario «nuovo»»', 'description: Premi “Ricomincia”', '---'].join('\n');
    expect(rulesOf(source)).toEqual(['caporali-annidati']);
  });
});

describe('matematica fuori da <Formula>', () => {
  it('avvisa per apici, pedici e × fra numeri', () => {
    expect(rulesOf('Vale U = U⁻¹.')).toEqual(['matematica-unicode']);
    expect(rulesOf('Il periodo è 2ⁿ.')).toEqual(['matematica-unicode']);
    expect(rulesOf('Sono 26 × 26 × 26 posizioni.')).toEqual(['matematica-unicode']);
    expect(rulesOf('Sono 26×26 posizioni.')).toEqual(['matematica-unicode']);
    expect(rulesOf('Il rotore ρ⁻ᵏ gira.')).toEqual(['matematica-unicode']);
  });

  it('ignora la matematica dentro <Formula> e il × non numerico', () => {
    expect(lintContent('Sono <Formula tex="26 \\times 26^{3}" /> posizioni.')).toEqual([]);
    expect(rulesOf('Una matrice m × n.')).toEqual([]);
  });
});

describe('nomi propri ammessi', () => {
  const names = ['Cesare', 'Giulio Cesare', 'Bletchley Park', 'Crypto Museum', 'Spagna'];

  it('non avvisa sui nomi propri nei titoli', () => {
    expect(rulesOf('## Dal cifrario di Cesare al rotore', names)).toEqual([]);
    expect(rulesOf('## Enigma in Spagna', ['Enigma', 'Spagna'])).toEqual([]);
    expect(rulesOf('## Da Bletchley Park a Cesare', names)).toEqual([]);
  });

  it('avvisa ancora sui nomi che non sono nella lista, e sui nomi solo in parte', () => {
    expect(rulesOf('## Il Riflettore di Cesare', names)).toEqual(['maiuscole-titolo']);
    expect(rulesOf('## Il parco di Bletchley', names)).toEqual(['maiuscole-titolo']);
    expect(rulesOf('## Dal cifrario di Cesare', [])).toEqual(['maiuscole-titolo']);
  });

  it('non avvisa sui nomi propri dopo i due punti o il punto e virgola', () => {
    expect(rulesOf('Fu decisivo; Crypto Museum la considera una svolta.', names)).toEqual([]);
    expect(rulesOf('La conclusione: Cesare vinse.', names)).toEqual([]);
    expect(rulesOf('La conclusione: Cesare vinse.')).toEqual(['maiuscola-dopo-due-punti']);
    expect(rulesOf('La conclusione: Il resto.', names)).toEqual(['maiuscola-dopo-due-punti']);
  });

  it('riconosce il nome anche dopo un articolo elisso', () => {
    expect(rulesOf('## Il rotore dell’Uhr', ['Uhr'])).toEqual([]);
  });
});

describe('lintYaml', () => {
  it('controlla solo i campi di prosa', () => {
    const source = ["- id: l'uhr", "  definizione: L'Uhr - un accessorio.", '  tedesco: "Uhr"'].join('\n');
    expect(lintYaml(source).map((issue) => [issue.line, issue.rule])).toEqual([
      [2, 'apostrofo-diritto'],
      [2, 'inciso-trattino'],
    ]);
  });

  it('applica le regole nuove e i nomi propri ai campi di prosa', () => {
    const source = [
      '- id: brevetto',
      '  didascalia: Brevetto 1 657 411 di Arthur Scherbius...',
      '  attribuzione: brevetto 1 657 411',
    ].join('\n');
    expect(lintYaml(source, ['Arthur Scherbius']).map((issue) => issue.rule)).toEqual([
      'puntini-sospensione',
      'migliaia-non-separabili',
    ]);
  });
});

describe('lintJson', () => {
  const source = JSON.stringify(
    {
      'sim.title': 'Simulatore',
      'ex.bad': "Qual'è il risultato? Sono 17 576 posizioni...",
      'ex.math': 'Sono 5 × 4 × 3 = {n} ordini.',
      'sim.tape.countOne': '1 lettera',
      'sim.uhr.hint': 'L’Uhr richiede esattamente 10 cavi.',
      count: 3,
    },
    null,
    2,
  );

  it('controlla i valori e riporta la riga della chiave', () => {
    const found = lintJson(source).map((issue) => [issue.line, issue.rule]);
    expect(found).toEqual([
      [3, 'apostrofo-diritto'],
      [3, 'puntini-sospensione'],
      [3, 'qual-e'],
      [3, 'migliaia-non-separabili'],
      [4, 'matematica-unicode'],
      [6, 'numero-in-cifre'],
    ]);
  });

  it('lascia in cifre contatori e intervalli nelle etichette brevi', () => {
    expect(lintJson('{\n  "a": "1 lettera",\n  "b": "Spine da 1 a 5"\n}')).toEqual([]);
  });
});
