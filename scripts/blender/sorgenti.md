# Sorgenti esterne del modello 3D

L’esterno del modello (cassa, coperchio di legno, piastra, coperchio interno, tastiera, pannello a
spine) viene da un modello di terzi (decisione D20 di `docs/piano.md`). La copia di partenza sta
fuori da git, in `scripts/blender/sorgenti/` (D21): pesa 176 MB, con texture 4K.

| Campo | Valore |
| --- | --- |
| Titolo | Enigma Machine |
| Autore | ASHISH (<https://sketchfab.com/3dmodelsmith>) |
| Pagina | <https://sketchfab.com/3d-models/enigma-machine-30b85c037a164174a109ad6f002b9c47> |
| Licenza | CC BY 4.0 (<https://creativecommons.org/licenses/by/4.0/>) |
| File | `enigma_machine.zip`, formato glTF scaricato da Sketchfab |
| sha256 dello zip | `5e06a4715f644e43c9bc2e47294424001f52f83b5a611944734de169991b9978` |

Il credito da riportare, dal `license.txt` dello zip:

> This work is based on "Enigma Machine"
> (https://sketchfab.com/3d-models/enigma-machine-30b85c037a164174a109ad6f002b9c47) by ASHISH
> (https://sketchfab.com/3dmodelsmith) licensed under CC-BY-4.0
> (http://creativecommons.org/licenses/by/4.0/)

La geometria derivata, cioè il `.glb` del sito, ha la licenza dei contenuti del sito, CC BY-NC-SA
4.0, come la CC BY permette.

## Come si prepara

Si scarica lo zip dalla pagina di Sketchfab (serve un account), formato «glTF», si controlla lo
sha256 e lo si estrae:

```bash
shasum -a 256 ~/Downloads/enigma_machine.zip
```

```bash
mkdir -p scripts/blender/sorgenti/ashish && unzip -o ~/Downloads/enigma_machine.zip -d scripts/blender/sorgenti/ashish
```

Dopo, `scripts/blender/sorgenti/ashish/scene.gltf` deve esistere: `pnpm modello` lo cerca lì e,
se manca, si ferma rimandando a questo file.
