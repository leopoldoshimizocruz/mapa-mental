import type { No, Ligacao, Layout } from "../../types";

export type Posicoes = Record<string, { x: number; y: number }>;
type Tam = { w: number; h: number };

// folga ao longo do eixo principal (entre um nó e seus filhos) e extra só na raiz
const GAP_PRINCIPAL = 80;
const EXTRA_RAIZ = 120;
// folga entre irmãos no eixo cruzado
const GAP_CRUZADO = 28;

/** Estima (de forma conservadora, sempre >= real) o tamanho renderizado de um nó.
 *  Determinístico: o layout depende só disto, sem realimentação por medição (evita loop). */
export function estimarTamanho(n: No): Tam {
  const fonte = n.estilo?.tamanho ?? 16;
  const charW = fonte * 0.66;
  const fixaW = n.tamanho?.w && n.tamanho.w > 0 ? n.tamanho.w : null;
  const maxW = fixaW ?? 280;
  const len = (n.texto?.length ?? 1) + (n.emoji ? 2 : 0);
  const w = fixaW ?? Math.min(maxW, Math.max(96, len * charW + 40));
  const charsPorLinha = Math.max(1, Math.floor((w - 40) / charW));
  const linhas = Math.max(1, Math.ceil(len / charsPorLinha));
  let h = Math.round(linhas * fonte * 1.6 + 28);
  if (n.imagem) h += 160;
  return { w: Math.round(w), h };
}

/** Layout de árvore tidy: cada subárvore reserva, no eixo cruzado, a soma das
 *  extensões dos filhos (ou a própria altura, o que for maior). Garante ZERO
 *  sobreposição. Usa o tamanho real medido de cada nó (com fallback de estimativa).
 *  Posições manuais de arraste são aplicadas depois, em derivarFlow. */
export async function calcularLayout(
  nos: No[],
  ligacoes: Ligacao[],
  layout: Layout,
): Promise<Posicoes> {
  const ocultos = idsOcultos(nos, ligacoes);
  const visiveis = nos.filter((n) => !ocultos.has(n.id));
  if (visiveis.length === 0) return {};

  const horizontal = layout !== "organograma";
  const tam = new Map<string, Tam>(visiveis.map((n) => [n.id, estimarTamanho(n)]));

  const filhos = new Map<string, No[]>();
  const visivelIds = new Set(visiveis.map((n) => n.id));
  for (const n of visiveis) {
    if (n.paiId && visivelIds.has(n.paiId)) {
      const arr = filhos.get(n.paiId) ?? [];
      arr.push(n);
      filhos.set(n.paiId, arr);
    }
  }
  const raizes = visiveis.filter((n) => !n.paiId || !visivelIds.has(n.paiId));

  // tamanho no eixo principal (profundidade) e no eixo cruzado (empilhamento de irmãos)
  const principal = (n: No) => (horizontal ? tam.get(n.id)!.w : tam.get(n.id)!.h);
  const cruzado = (n: No) => (horizontal ? tam.get(n.id)!.h : tam.get(n.id)!.w);

  // extensão (espaço no eixo cruzado) da subárvore, com memo
  const extCache = new Map<string, number>();
  const extensao = (n: No): number => {
    const cache = extCache.get(n.id);
    if (cache !== undefined) return cache;
    const ch = filhos.get(n.id) ?? [];
    let valor: number;
    if (ch.length === 0) {
      valor = cruzado(n);
    } else {
      let soma = 0;
      for (const c of ch) soma += extensao(c);
      soma += GAP_CRUZADO * (ch.length - 1);
      valor = Math.max(cruzado(n), soma);
    }
    extCache.set(n.id, valor);
    return valor;
  };

  const pos: Posicoes = {};
  const setPos = (n: No, eixoPrincipal: number, eixoCruzado: number) => {
    pos[n.id] = horizontal
      ? { x: eixoPrincipal, y: eixoCruzado }
      : { x: eixoCruzado, y: eixoPrincipal };
  };
  const centroCruzado = (n: No) =>
    (horizontal ? pos[n.id].y : pos[n.id].x) + cruzado(n) / 2;

  // posiciona a subárvore: principalPos = borda do nó no eixo principal;
  // cruzadoTopo = início da banda reservada no eixo cruzado
  const posicionar = (n: No, principalPos: number, cruzadoTopo: number) => {
    const ch = filhos.get(n.id) ?? [];
    const ext = extensao(n);
    const gap = n.paiId ? GAP_PRINCIPAL : GAP_PRINCIPAL + EXTRA_RAIZ;
    const filhoPrincipal = principalPos + principal(n) + gap;

    if (ch.length === 0) {
      setPos(n, principalPos, cruzadoTopo + ext / 2 - cruzado(n) / 2);
      return;
    }

    let totalFilhos = 0;
    for (const c of ch) totalFilhos += extensao(c);
    totalFilhos += GAP_CRUZADO * (ch.length - 1);

    let cursor = cruzadoTopo + (ext - totalFilhos) / 2;
    for (const c of ch) {
      posicionar(c, filhoPrincipal, cursor);
      cursor += extensao(c) + GAP_CRUZADO;
    }

    const centro = (centroCruzado(ch[0]) + centroCruzado(ch[ch.length - 1])) / 2;
    setPos(n, principalPos, centro - cruzado(n) / 2);
  };

  let cursor = 0;
  for (const r of raizes) {
    posicionar(r, 0, cursor);
    cursor += extensao(r) + GAP_CRUZADO * 2;
  }

  return pos;
}

/** IDs de nós que descendem de algum nó recolhido (não devem ser desenhados). */
function idsOcultos(nos: No[], _ligacoes: Ligacao[]): Set<string> {
  const porId = new Map(nos.map((n) => [n.id, n]));
  const ocultos = new Set<string>();
  for (const n of nos) {
    let p = n.paiId ? porId.get(n.paiId) : undefined;
    while (p) {
      if (p.recolhido) {
        ocultos.add(n.id);
        break;
      }
      p = p.paiId ? porId.get(p.paiId) : undefined;
    }
  }
  return ocultos;
}
