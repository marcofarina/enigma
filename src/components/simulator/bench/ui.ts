import { create } from 'zustand';

/** Pannelli ancorati della home: non modali, uno alla volta (docs/design.md, «Interazioni»). */
export type PanelId = 'plugs' | 'ukwd' | 'options' | 'share' | 'mission';

/** Come scorre il segnale nello schema: di colpo, al rallentatore o un passo alla volta. */
export type SignalMode = 'normal' | 'slow' | 'step';

interface BenchUi {
  panel: PanelId | null;
  /** Il pulsante che ha aperto il pannello: alla chiusura il fuoco torna lì. */
  opener: HTMLElement | null;
  mode: SignalMode;
  /** Opzioni di «Digita»: X al posto del punto, cifre scritte in lettere. */
  punctuation: boolean;
  digits: boolean;
  /** Testo del campo «Digita». */
  text: string;
  /** Messaggio storico caricato dal menu «Carica una chiave» (id di `missioni.yaml`), se c’è. */
  mission: string | null;
  togglePanel: (panel: PanelId, opener: HTMLElement | null) => void;
  closePanel: () => void;
  setMode: (mode: SignalMode) => void;
}

export const useBench = create<BenchUi>()((set, get) => ({
  panel: null,
  opener: null,
  mode: 'normal',
  punctuation: false,
  digits: false,
  text: '',
  mission: null,
  togglePanel: (panel, opener) => {
    if (get().panel === panel) get().closePanel();
    else set({ panel, opener });
  },
  closePanel: () => {
    const { opener } = get();
    set({ panel: null, opener: null });
    opener?.focus();
  },
  setMode: (mode) => set({ mode }),
}));
