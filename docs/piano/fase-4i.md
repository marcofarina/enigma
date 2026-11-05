# Fase 4i — Modello 3D: convenzione, abbozzo e catena di esportazione

**Modello: Opus · Effort: high · Durata: 2 h · Dipende da: D14, D15; non si fa nel cloud, Marco deve avere Blender aperto sul Mac**

**Obiettivo.** Provare da un capo all’altro il contratto fra Blender e il sito con un modello
abbozzato: scatole e cilindri con le dimensioni vere e i nodi, le origini e gli assi della
«Convenzione del modello 3D» (`docs/piano/convenzione-3d.md`). Il `.glb` si rigenera da una scena vuota con un comando e uno script
ne verifica la struttura. La 5a lavora su questo abbozzo; la 4j e la 4k ne sostituiscono la
geometria senza cambiare la convenzione.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui docs/piano/fase-4i.md. Leggi prima l’indice docs/piano.md (le decisioni D14 e D15) e
docs/piano/convenzione-3d.md. Controlla che gli strumenti dell’MCP di Blender siano disponibili in
questa sessione;
se non lo sono, fermati e dimmi che cosa manca (Blender, l’addon, il server).
```

**Prima della sessione (Marco, una volta sola).**

1. Installa Blender con `brew install --cask blender` (verificato il 2026-11-05: `uv` è già
   installato, Blender no).
2. Installa in Blender l’addon di [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp) e
   avviane il server dal pannello laterale. L’addon ascolta su una porta locale senza
   autenticazione ed esegue Python arbitrario: fermalo quando non serve e salva il `.blend` prima di
   ogni sessione.
3. Registra il server per l’utente, così serve anche a Python Doesn’t Byte, con la versione
   fissata: `claude mcp add --scope user blender -- uvx blender-mcp==<versione>` (la versione
   corrente è su PyPI, il comando esatto nel README). Nel README controlla se il server raccoglie
   telemetria e come si disattiva.
4. Facoltativo, dieci minuti al massimo: cerca su sketchfab.com un’Enigma con licenza CC0 o CC BY,
   pezzi separati e nominati e meno di circa 50 000 poligoni. Se la trovi, scaricala e tieni pronti
   il percorso del file e l’URL della pagina.

**Passi**

1. **Modello di terzi.** Se Marco ha scaricato un modello, importalo, confrontalo con la
   convenzione e digli quanto lavoro serve per adattarlo: decidete insieme se usarlo. Annota
   titolo, autore, URL e licenza verificata sulla pagina.
2. **Prima il file, poi l’esecuzione.** Ogni pezzo è una funzione in `scripts/blender/<pezzo>.py`:
   scrivi il file, poi fallo eseguire all’MCP e guarda la schermata. `scripts/blender/costruisci.py`
   parte da una scena vuota, chiama i pezzi in ordine, esporta il `.glb` e renderizza l’anteprima.
   Le modifiche fatte a mano nella GUI di Blender si perdono, perché il `.blend` non va in git:
   riportale negli script.
3. **Comando di ricostruzione.** In `package.json`, lo script `modello`:
   `${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender} -b --factory-startup -P scripts/blender/costruisci.py`.
4. **Abbozzo.** Dimensioni della cassa dalla fonte `crypto-museum-enigma-i` (annotale
   nell’«Esito»); geometria semplice; tutti i nodi marcati «4i» nella convenzione, con le origini e
   gli assi giusti e `raggio_contatti` dove serve; materiali piani; tasti e lampade come copie
   collegate della stessa mesh. Controlla nella schermata che ogni rotore giri sul proprio asse X.
5. **Esportazione** in `public/modelli/enigma-i.glb`, glTF binario con Y in alto e
   `export_extras=True`. L’anteprima va in `public/modelli/enigma-i-anteprima.webp` (o `.png`, se
   la versione di Blender non scrive WebP), 1280 × 720: è l’immagine statica della 5a.
6. **Verifica.** `scripts/verifica-modello.ts`, senza dipendenze nuove, legge il blocco JSON del
   `.glb` e controlla:
   - il peso, sotto 300 KB per l’abbozzo;
   - che ci siano tutti i nodi di `NODI_ATTESI`, l’elenco in testa al file copiato dalla
     convenzione;
   - che le dimensioni della mesh di `cassa` (minimo e massimo dell’accessor `POSITION`) stiano
     entro il 10 % di quelle della fonte, così un errore di unità si vede subito;
   - che `raggio_contatti` sia un numero positivo dove la convenzione lo chiede.

   Aggiungi a `package.json` lo script `verifica:modello` (`node scripts/verifica-modello.ts`) e
   mettilo in `verify` prima della build.
7. **Licenza.** Se la riga D14 dell’indice (docs/piano.md) non riporta la licenza della geometria, chiedila
   a Marco e scrivila in quella riga. Se c’è una base di terzi, riporta titolo, autore, URL e
   licenza. La voce nei crediti la crea la 5a.
8. **Commit.** Il `.glb` e l’anteprima si committano a fine fase, non a ogni prova: sono binari e
   ogni versione resta nella storia di git.

**Criteri di accettazione**

```bash
pnpm modello && pnpm verifica:modello
```
exit 0: il `.glb` si rigenera da una scena vuota e passa la verifica.

```bash
pnpm verify
```

**Esito.** Da compilare: versioni di Blender e di `blender-mcp`, modello di terzi (sì o no, con
licenza e URL), dimensioni usate con la fonte, peso, numero di poligoni, correzioni fatte alla
convenzione, che cosa ha richiesto più tempo con l’MCP e che cosa conviene sapere per PQuest.
