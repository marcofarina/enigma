# Enigma — Rainbow Bits

Simulatore didattico della macchina Enigma, con un percorso su storia, funzionamento, matematica e crittoanalisi ed esercizi per gli studenti. Fa parte del progetto **Rainbow Bits**, che accompagna un libro di crittografia.

> Il piano di lavoro completo è in [`docs/piano.md`](docs/piano.md). I testi sono bozze in attesa di revisione.

## Stato

| Fase | Contenuto | Stato |
|---|---|---|
| 0 | Struttura del progetto, CI, pubblicazione su GitHub Pages | fatto |
| 1 | Motore, simulatore schematico, link condivisibili, lezioni “Come funziona” | fatto |
| 2 | Traccia passo-passo, modalità LIM, matematica, esercizi di livello 1–2 | fatto |
| 3 | Storia, Enigma e l’Italia, galleria, glossario, schede stampabili, esercizi di livello 3 | fatto |
| 4 | Crittoanalisi con Bombe simulata, vista “Macchina” 2.5D, missioni storiche, guida per i docenti, revisione di accessibilità e prestazioni | fatto (testi in revisione) |
| 5 | Vista 3D | da fare |

## Sviluppo

Servono Node ≥ 22.23.4 (vedi `.nvmrc`) e pnpm 10.

```bash
pnpm install
```

```bash
pnpm dev
```

Prima di ogni push:

```bash
pnpm verify
```

I test end-to-end (Playwright + axe) girano sulla build:

```bash
pnpm build && pnpm test:e2e
```

## Licenze

- **Codice**: [MIT](LICENSE).
- **Testi, illustrazioni originali e materiali didattici**: [CC BY-NC-SA 4.0](LICENSE-CONTENT).
- **Immagini di terzi**: ciascuna mantiene la propria licenza, indicata nella pagina dei crediti.

## Ringraziamenti

Il progetto è una reimplementazione da zero ispirata al simulatore [EnigmaMachine](https://github.com/SummersideMakerspace/EnigmaMachine) di Summerside Makerspace (Apache-2.0, 2016), da cui provengono i dati di cablaggio confrontati con le fonti e i vettori di test usati per la verifica.
