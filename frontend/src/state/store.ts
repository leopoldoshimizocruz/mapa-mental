import { create } from "zustand";
import { temporal } from "zundo";
import type { Mapa, No, Ligacao, EstiloNo } from "../types";
import { ESTILO_PADRAO } from "../types";
import { novoId } from "../lib/ids";

interface Estado {
  mapa: Mapa | null;
  selecionado: string | null;
  carregarMapa: (mapa: Mapa) => void;
  selecionar: (id: string | null) => void;
  adicionarFilho: (paiId: string) => string;
  adicionarIrmao: (irmaoId: string) => string;
  atualizarNo: (id: string, patch: Partial<No>) => void;
  atualizarEstilo: (id: string, patch: Partial<EstiloNo>) => void;
  apagarNo: (id: string) => void;
  alternarRecolhido: (id: string) => void;
  moverNo: (id: string, x: number, y: number) => void;
}

function criarNo(paiId: string | null, texto = ""): No {
  return {
    id: novoId(), paiId, texto, nota: null, link: null, imagem: null,
    cor: "#5b2be0", emoji: null, recolhido: false, posicao: null,
    tamanho: null, estilo: { ...ESTILO_PADRAO },
  };
}

function descendentes(nos: No[], raiz: string): Set<string> {
  const ids = new Set<string>([raiz]);
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const n of nos) {
      if (n.paiId && ids.has(n.paiId) && !ids.has(n.id)) {
        ids.add(n.id);
        mudou = true;
      }
    }
  }
  return ids;
}

export const useStore = create<Estado>()(
  temporal(
    (set, get) => ({
      mapa: null,
      selecionado: null,

      carregarMapa: (mapa) => set({ mapa, selecionado: mapa.nos[0]?.id ?? null }),
      selecionar: (id) => set({ selecionado: id }),

      adicionarFilho: (paiId) => {
        const no = criarNo(paiId);
        const lig: Ligacao = {
          id: novoId(), origem: paiId, destino: no.id,
          tipo: "hierarquia", rotulo: null, estilo: {},
        };
        set((st) => st.mapa ? {
          mapa: { ...st.mapa, nos: [...st.mapa.nos, no], ligacoes: [...st.mapa.ligacoes, lig] },
          selecionado: no.id,
        } : st);
        return no.id;
      },

      adicionarIrmao: (irmaoId) => {
        const mapa = get().mapa;
        const irmao = mapa?.nos.find((n) => n.id === irmaoId);
        const paiId = irmao?.paiId ?? null;
        if (!paiId) return get().adicionarFilho(irmaoId);
        return get().adicionarFilho(paiId);
      },

      atualizarNo: (id, patch) => set((st) => st.mapa ? {
        mapa: { ...st.mapa, nos: st.mapa.nos.map((n) => n.id === id ? { ...n, ...patch } : n) },
      } : st),

      atualizarEstilo: (id, patch) => set((st) => st.mapa ? {
        mapa: { ...st.mapa, nos: st.mapa.nos.map((n) => n.id === id ? { ...n, estilo: { ...n.estilo, ...patch } } : n) },
      } : st),

      apagarNo: (id) => set((st) => {
        if (!st.mapa) return st;
        const no = st.mapa.nos.find((n) => n.id === id);
        if (!no || no.paiId === null) return st; // não apaga a raiz
        const remover = descendentes(st.mapa.nos, id);
        return {
          mapa: {
            ...st.mapa,
            nos: st.mapa.nos.filter((n) => !remover.has(n.id)),
            ligacoes: st.mapa.ligacoes.filter((l) => !remover.has(l.origem) && !remover.has(l.destino)),
          },
          selecionado: no.paiId,
        };
      }),

      alternarRecolhido: (id) => set((st) => st.mapa ? {
        mapa: { ...st.mapa, nos: st.mapa.nos.map((n) => n.id === id ? { ...n, recolhido: !n.recolhido } : n) },
      } : st),

      moverNo: (id, x, y) => set((st) => st.mapa ? {
        mapa: { ...st.mapa, nos: st.mapa.nos.map((n) => n.id === id ? { ...n, posicao: { x, y } } : n) },
      } : st),
    }),
    { limit: 100, partialize: (st) => ({ mapa: st.mapa }) },
  ),
);
