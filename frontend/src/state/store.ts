import { create } from "zustand";
import { temporal } from "zundo";
import type { Mapa, No, Ligacao, EstiloNo, Layout } from "../types";
type Tema = "claro" | "escuro";
import { ESTILO_PADRAO } from "../types";
import { novoId } from "../lib/ids";

export type StatusSalvar = "salvo" | "salvando" | "erro";

interface Estado {
  mapa: Mapa | null;
  selecionado: string | null;
  editando: string | null;
  versaoLayout: number;
  clipboard: { raizId: string; nos: No[] } | null;
  statusSalvar: StatusSalvar;
  carregarMapa: (mapa: Mapa) => void;
  selecionar: (id: string | null) => void;
  iniciarEdicao: (id: string | null) => void;
  realinharTudo: () => void;
  definirLayout: (layout: Layout) => void;
  renomearMapa: (titulo: string) => void;
  setStatusSalvar: (s: StatusSalvar) => void;
  adicionarFilho: (paiId: string) => string;
  adicionarIsolado: (x: number, y: number) => string;
  copiar: (id: string) => void;
  colar: (destinoPaiId: string | null) => string | null;
  duplicar: (id: string) => string | null;
  reparentar: (filhoId: string, novoPaiId: string) => boolean;
  adicionarIrmao: (irmaoId: string) => string;
  atualizarNo: (id: string, patch: Partial<No>) => void;
  atualizarEstilo: (id: string, patch: Partial<EstiloNo>) => void;
  apagarNo: (id: string) => void;
  alternarRecolhido: (id: string) => void;
  moverNo: (id: string, x: number, y: number) => void;
  redimensionarNo: (id: string, w: number) => void;
  moverVarios: (updates: { id: string; x: number; y: number }[]) => void;
  apagarVarios: (ids: string[]) => void;
  atualizarCorVarios: (ids: string[], cor: string) => void;
  adicionarRelacao: (origem: string, destino: string) => void;
  removerLigacao: (id: string) => void;
  criarContorno: (nosIds: string[], cor: string) => void;
  removerContorno: (id: string) => void;
  definirTema: (tema: Tema) => void;
}

function criarNo(paiId: string | null, texto = ""): No {
  return {
    id: novoId(), paiId, texto, nota: null, link: null, imagem: null,
    cor: "#5b2be0", emoji: null, recolhido: false, posicao: null,
    tamanho: null, estilo: { ...ESTILO_PADRAO },
  };
}

function clonarNo(n: No): No {
  return {
    ...n,
    posicao: n.posicao ? { ...n.posicao } : null,
    tamanho: n.tamanho ? { ...n.tamanho } : null,
    estilo: { ...n.estilo },
  };
}

/** Monta uma cópia (ids novos) de uma subárvore, anexada a destinoPaiId (ou isolada se null). */
function montarCopia(
  subset: No[],
  raizId: string,
  destinoPaiId: string | null,
): { novosNos: No[]; novasLig: Ligacao[]; novaRaizId: string } {
  const idMap = new Map<string, string>();
  for (const n of subset) idMap.set(n.id, novoId());
  const raizOriginal = subset.find((n) => n.id === raizId);
  const base = raizOriginal?.posicao ?? { x: 0, y: 0 };

  const novosNos: No[] = subset.map((n) => {
    const ehRaiz = n.id === raizId;
    return {
      ...clonarNo(n),
      id: idMap.get(n.id)!,
      paiId: ehRaiz ? destinoPaiId : (n.paiId ? idMap.get(n.paiId) ?? null : null),
      posicao: ehRaiz ? (destinoPaiId === null ? { x: base.x + 48, y: base.y + 48 } : null) : null,
    };
  });

  const novasLig: Ligacao[] = [];
  for (const n of novosNos) {
    if (n.paiId) {
      novasLig.push({
        id: novoId(), origem: n.paiId, destino: n.id,
        tipo: "hierarquia", rotulo: null, estilo: {},
      });
    }
  }
  return { novosNos, novasLig, novaRaizId: idMap.get(raizId)! };
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
      editando: null,
      versaoLayout: 0,
      clipboard: null,
      statusSalvar: "salvo",

      carregarMapa: (mapa) => set({ mapa, selecionado: mapa.nos[0]?.id ?? null, editando: null, statusSalvar: "salvo" }),
      selecionar: (id) => set({ selecionado: id }),
      iniciarEdicao: (id) => set({ editando: id }),
      setStatusSalvar: (s) => set({ statusSalvar: s }),

      renomearMapa: (titulo) => set((st) => st.mapa ? { mapa: { ...st.mapa, titulo } } : st),

      definirLayout: (layout) => set((st) => st.mapa ? {
        mapa: {
          ...st.mapa,
          config: { ...st.mapa.config, layout },
          nos: st.mapa.nos.map((n) => ({ ...n, posicao: null })),
        },
        versaoLayout: st.versaoLayout + 1,
      } : st),

      realinharTudo: () => set((st) => st.mapa ? {
        mapa: { ...st.mapa, nos: st.mapa.nos.map((n) => ({ ...n, posicao: null })) },
        versaoLayout: st.versaoLayout + 1,
      } : st),

      adicionarIsolado: (x, y) => {
        const no: No = { ...criarNo(null), posicao: { x, y } };
        set((st) => st.mapa ? {
          mapa: { ...st.mapa, nos: [...st.mapa.nos, no] },
          selecionado: no.id,
          editando: no.id,
        } : st);
        return no.id;
      },

      copiar: (id) => {
        const mapa = get().mapa;
        if (!mapa) return;
        const ids = descendentes(mapa.nos, id);
        const nos = mapa.nos.filter((n) => ids.has(n.id)).map(clonarNo);
        set({ clipboard: { raizId: id, nos } });
      },

      colar: (destinoPaiId) => {
        const cb = get().clipboard;
        const mapa = get().mapa;
        if (!cb || !mapa) return null;
        const { novosNos, novasLig, novaRaizId } = montarCopia(cb.nos, cb.raizId, destinoPaiId);
        set((st) => st.mapa ? {
          mapa: {
            ...st.mapa,
            nos: [...st.mapa.nos, ...novosNos],
            ligacoes: [...st.mapa.ligacoes, ...novasLig],
          },
          selecionado: novaRaizId,
          editando: null,
        } : st);
        return novaRaizId;
      },

      duplicar: (id) => {
        const mapa = get().mapa;
        if (!mapa) return null;
        const ids = descendentes(mapa.nos, id);
        const subset = mapa.nos.filter((n) => ids.has(n.id)).map(clonarNo);
        const original = mapa.nos.find((n) => n.id === id);
        const destino = original?.paiId ?? null; // duplica como irmão (mesmo pai), ou isolado se raiz
        const { novosNos, novasLig, novaRaizId } = montarCopia(subset, id, destino);
        set((st) => st.mapa ? {
          mapa: {
            ...st.mapa,
            nos: [...st.mapa.nos, ...novosNos],
            ligacoes: [...st.mapa.ligacoes, ...novasLig],
          },
          selecionado: novaRaizId,
          editando: null,
        } : st);
        return novaRaizId;
      },

      reparentar: (filhoId, novoPaiId) => {
        const mapa = get().mapa;
        if (!mapa || filhoId === novoPaiId) return false;
        const no = mapa.nos.find((n) => n.id === filhoId);
        if (!no || no.paiId === novoPaiId) return false;
        const desc = descendentes(mapa.nos, filhoId);
        if (desc.has(novoPaiId)) return false; // impede ciclo (mover pra dentro de si mesmo)
        const nos = mapa.nos.map((n) =>
          n.id === filhoId ? { ...n, paiId: novoPaiId, posicao: null } : n,
        );
        const ligacoes = mapa.ligacoes.filter(
          (l) => !(l.tipo === "hierarquia" && l.destino === filhoId),
        );
        ligacoes.push({
          id: novoId(), origem: novoPaiId, destino: filhoId,
          tipo: "hierarquia", rotulo: null, estilo: {},
        });
        set({ mapa: { ...mapa, nos, ligacoes } });
        return true;
      },

      adicionarFilho: (paiId) => {
        const no = criarNo(paiId);
        const lig: Ligacao = {
          id: novoId(), origem: paiId, destino: no.id,
          tipo: "hierarquia", rotulo: null, estilo: {},
        };
        set((st) => st.mapa ? {
          mapa: { ...st.mapa, nos: [...st.mapa.nos, no], ligacoes: [...st.mapa.ligacoes, lig] },
          selecionado: no.id,
          editando: no.id,
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
        if (!no) return st;
        if (st.mapa.nos.length <= 1) return st; // não deixa o mapa totalmente vazio
        const remover = descendentes(st.mapa.nos, id);
        return {
          mapa: {
            ...st.mapa,
            nos: st.mapa.nos.filter((n) => !remover.has(n.id)),
            ligacoes: st.mapa.ligacoes.filter((l) => !remover.has(l.origem) && !remover.has(l.destino)),
            contornos: st.mapa.contornos
              .map((c) => ({ ...c, nosIds: c.nosIds.filter((id) => !remover.has(id)) }))
              .filter((c) => c.nosIds.length > 0),
          },
          selecionado: no.paiId,
          editando: st.editando && remover.has(st.editando) ? null : st.editando,
        };
      }),

      alternarRecolhido: (id) => set((st) => st.mapa ? {
        mapa: { ...st.mapa, nos: st.mapa.nos.map((n) => n.id === id ? { ...n, recolhido: !n.recolhido } : n) },
      } : st),

      moverNo: (id, x, y) => set((st) => st.mapa ? {
        mapa: { ...st.mapa, nos: st.mapa.nos.map((n) => n.id === id ? { ...n, posicao: { x, y } } : n) },
      } : st),

      redimensionarNo: (id, w) => set((st) => st.mapa ? {
        mapa: { ...st.mapa, nos: st.mapa.nos.map((n) => n.id === id ? { ...n, tamanho: { w, h: n.tamanho?.h ?? 0 } } : n) },
      } : st),

      moverVarios: (updates) => set((st) => {
        if (!st.mapa) return st;
        const mapaPos = new Map(updates.map((u) => [u.id, u]));
        return {
          mapa: {
            ...st.mapa,
            nos: st.mapa.nos.map((n) => {
              const u = mapaPos.get(n.id);
              return u ? { ...n, posicao: { x: u.x, y: u.y } } : n;
            }),
          },
        };
      }),

      apagarVarios: (ids) => set((st) => {
        if (!st.mapa) return st;
        const remover = new Set<string>();
        for (const id of ids) for (const d of descendentes(st.mapa.nos, id)) remover.add(d);
        const restantes = st.mapa.nos.filter((n) => !remover.has(n.id));
        if (restantes.length === 0) return st; // não esvaziar o mapa
        return {
          mapa: {
            ...st.mapa,
            nos: restantes,
            ligacoes: st.mapa.ligacoes.filter((l) => !remover.has(l.origem) && !remover.has(l.destino)),
            contornos: st.mapa.contornos
              .map((c) => ({ ...c, nosIds: c.nosIds.filter((id) => !remover.has(id)) }))
              .filter((c) => c.nosIds.length > 0),
          },
          selecionado: null,
          editando: null,
        };
      }),

      atualizarCorVarios: (ids, cor) => set((st) => {
        if (!st.mapa) return st;
        const s = new Set(ids);
        return { mapa: { ...st.mapa, nos: st.mapa.nos.map((n) => s.has(n.id) ? { ...n, cor } : n) } };
      }),

      adicionarRelacao: (origem, destino) => set((st) => {
        if (!st.mapa || origem === destino) return st;
        const existe = st.mapa.ligacoes.some(
          (l) => l.tipo === "relacao" && l.origem === origem && l.destino === destino,
        );
        if (existe) return st;
        return {
          mapa: {
            ...st.mapa,
            ligacoes: [...st.mapa.ligacoes, {
              id: novoId(), origem, destino, tipo: "relacao", rotulo: null, estilo: {},
            }],
          },
        };
      }),

      removerLigacao: (id) => set((st) => st.mapa ? {
        mapa: { ...st.mapa, ligacoes: st.mapa.ligacoes.filter((l) => l.id !== id) },
      } : st),

      criarContorno: (nosIds, cor) => set((st) => {
        if (!st.mapa || nosIds.length === 0) return st;
        return {
          mapa: {
            ...st.mapa,
            contornos: [...st.mapa.contornos, { id: novoId(), nosIds: [...nosIds], cor, rotulo: null }],
          },
        };
      }),

      removerContorno: (id) => set((st) => st.mapa ? {
        mapa: { ...st.mapa, contornos: st.mapa.contornos.filter((c) => c.id !== id) },
      } : st),

      definirTema: (tema) => set((st) => st.mapa ? {
        mapa: { ...st.mapa, config: { ...st.mapa.config, tema } },
      } : st),
    }),
    { limit: 100, partialize: (st) => ({ mapa: st.mapa }) },
  ),
);
