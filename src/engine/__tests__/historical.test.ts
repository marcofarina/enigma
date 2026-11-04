import { describe, expect, it } from 'vitest';
import { encipherWith, type MachineConfig } from '../index.ts';

/**
 * Messaggi reali decifrati, già usati nei test del simulatore di Summerside Makerspace (dalla
 * raccolta di Franklin Heath). Le fonti primarie sono in `src/content/fonti.yaml`: Ostwald e
 * Weierud per Barbarossa, Krah ed Erskine per U-264, Weierud per Scharnhorst. Gli stessi
 * messaggi sono le missioni della home (`src/content/missioni.yaml`).
 */
const messages: { name: string; config: MachineConfig; ciphertext: string; plaintext: string }[] = [
  {
    name: 'Operazione Barbarossa, 7 luglio 1941, parte 1',
    config: {
      model: 'M3',
      rotors: ['II', 'IV', 'V'],
      rings: 'BUL',
      positions: 'BLA',
      reflector: 'B',
      plugboard: ['AV', 'BS', 'CG', 'DL', 'FU', 'HZ', 'IN', 'KM', 'OW', 'RX'],
    },
    ciphertext:
      'EDPUDNRGYSZRCXNUYTPOMRMBOFKTBZREZKMLXLVEFGUEYSIOZVEQMIKUBPMMYLKLTTDEISMDICAGYKUACTCDOMOHWXMUUIAUBSTSLRNBZSZWNRFXWFYSSXJZVIJHIDISHPRKLKAYUPADTXQSPINQMATLPIFSVKDASCTACDPBOPVHJK',
    plaintext:
      'AUFKLXABTEILUNGXVONXKURTINOWAXKURTINOWAXNORDWESTLXSEBEZXSEBEZXUAFFLIEGERSTRASZERIQTUNGXDUBROWKIXDUBROWKIXOPOTSCHKAXOPOTSCHKAXUMXEINSAQTDREINULLXUHRANGETRETENXANGRIFFXINFXRGTX',
  },
  {
    name: 'Operazione Barbarossa, 7 luglio 1941, parte 2',
    config: {
      model: 'M3',
      rotors: ['II', 'IV', 'V'],
      rings: 'BUL',
      positions: 'LSD',
      reflector: 'B',
      plugboard: ['AV', 'BS', 'CG', 'DL', 'FU', 'HZ', 'IN', 'KM', 'OW', 'RX'],
    },
    // Le ultime 15 lettere mancano nella raccolta di Franklin Heath: vengono dal modulo trascritto
    // da Ostwald e Weierud (p. 8).
    ciphertext:
      'SFBWDNJUSEGQOBHKRTAREEZMWKPPRBXOHDROEQGBBGTQVPGVKBVVGBIMHUSZYDAJQIROAXSSSNREHYGGRPISEZBOVMQIEMMZCYSGQDGRERVBILEKXYQIRGIRQNRDNVRXCYYTNJRSBDPJBFFKYQWFUS',
    plaintext:
      'DREIGEHTLANGSAMABERSIQERVORWAERTSXEINSSIEBENNULLSEQSXUHRXROEMXEINSXINFRGTXDREIXAUFFLIEGERSTRASZEMITANFANGXEINSSEQSXKMXKMXOSTWXKAMENECXKAMENECXDIVXKDRX',
  },
  {
    // Ricevuto alle 18:40 del 19 novembre (Erskine); il 25 è la data del rapporto che lo riporta.
    name: 'U-264 (Kapitänleutnant Hartwig Looks), 19 novembre 1942',
    config: {
      model: 'M4',
      rotors: ['Beta', 'II', 'IV', 'I'],
      rings: 'AAAV',
      positions: 'VJNA',
      reflector: 'B-thin',
      plugboard: ['AT', 'BL', 'DF', 'GJ', 'HM', 'NW', 'OP', 'QY', 'RZ', 'VX'],
    },
    ciphertext:
      'NCZWVUSXPNYMINHZXMQXSFWXWLKJAHSHNMCOCCAKUQPMKCSMHKSEINJUSBLKIOSXCKUBHMLLXCSJUSRRDVKOHULXWCCBGVLIYXEOAHXRHKKFVDREWEZLXOBAFGYUJQUKGRTVUKAMEURBVEKSUHHVOYHABCJWMAKLFKLMYFVNRIZRVVRTKOFDANJMOLBGFFLEOPRGTFLVRHOWOPBEKVWMUQFMPWPARMFHAGKXIIBG',
    plaintext:
      'VONVONJLOOKSJHFFTTTEINSEINSDREIZWOYYQNNSNEUNINHALTXXBEIANGRIFFUNTERWASSERGEDRUECKTYWABOSXLETZTERGEGNERSTANDNULACHTDREINULUHRMARQUANTONJOTANEUNACHTSEYHSDREIYZWOZWONULGRADYACHTSMYSTOSSENACHXEKNSVIERMBFAELLTYNNNNNNOOOVIERYSICHTEINSNULL',
  },
  {
    name: 'Scharnhorst (Konteradmiral Erich Bey), 26 dicembre 1943',
    config: {
      model: 'M3',
      rotors: ['III', 'VI', 'VIII'],
      rings: 'AHM',
      positions: 'UZV',
      reflector: 'B',
      plugboard: ['AN', 'EZ', 'HK', 'IJ', 'LR', 'MQ', 'OT', 'PV', 'SW', 'UX'],
    },
    ciphertext: 'YKAENZAPMSCHZBFOCUVMRMDPYCOFHADZIZMEFXTHFLOLPZLFGGBOTGOXGRETDWTJIQHLMXVJWKZUASTR',
    plaintext: 'STEUEREJTANAFJORDJANSTANDORTQUAAACCCVIERNEUNNEUNZWOFAHRTZWONULSMXXSCHARNHORSTHCO',
  },
];

describe('messaggi storici', () => {
  for (const message of messages) {
    it(message.name, () => {
      expect(encipherWith(message.config, message.ciphertext)).toBe(message.plaintext);
      expect(encipherWith(message.config, message.plaintext)).toBe(message.ciphertext);
    });
  }
});
