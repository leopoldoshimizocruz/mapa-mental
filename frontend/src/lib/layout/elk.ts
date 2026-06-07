import ELK from "elkjs/lib/elk.bundled.js";
import type { No, Ligacao, Layout } from "../../types";

const elk = new ELK();

const ALGORITMO: Record<Layout, string> = {
  radial: "org.eclipse.elk.radial",
  organograma: "org.eclipse.elk.mrtree",
  arvore: "org.eclipse.elk.layered",
};

const LARGURA = 160;
const ALTURA = 48;

export type Posicoes = Record<string, { x: number; y: number }>;

/** Calcula a posição de cada nó visível conforme o layout escolhido. */
export async function calcularLayout(
  nos: No[],
  ligacoes: Ligacao[],
  layout: Layout,
): Promise<Posicoes> {
  const ocultos = idsOcultos(nos, ligacoes);
  const visiveis = nos.filter((n) => !ocultos.has(n.id));

  const posicoes: Posicoes = {};
  const automaticos = visiveis.filter((n) => {
    if (n.posicao) {
      posicoes[n.id] = { x: n.posicao.x, y: n.posicao.y };
      return false;
    }
    return true;
  });

  if (automaticos.length === 0) return posicoes;

  const visiveisIds = new Set(visiveis.map((n) => n.id));
  const grafo = {
    id: "root",
    layoutOptions: { "elk.algorithm": ALGORITMO[layout] },
    children: automaticos.map((n) => ({ id: n.id, width: LARGURA, height: ALTURA })),
    edges: ligacoes
      .filter(
        (l) =>
          l.tipo === "hierarquia" &&
          visiveisIds.has(l.origem) &&
          visiveisIds.has(l.destino) &&
          !posicoes[l.origem] &&
          !posicoes[l.destino],
      )
      .map((l) => ({ id: l.id, sources: [l.origem], targets: [l.destino] })),
  };

  const resultado = await elk.layout(grafo);
  for (const filho of resultado.children ?? []) {
    posicoes[filho.id] = { x: filho.x ?? 0, y: filho.y ?? 0 };
  }
  return posicoes;
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
