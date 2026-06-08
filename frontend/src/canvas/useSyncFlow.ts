import { useEffect, useMemo, useState } from "react";
import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { Mapa } from "../types";
import { calcularLayout, estimarTamanho, type Posicoes } from "../lib/layout/elk";

/** Deriva nodes/edges do React Flow a partir do mapa e das posições calculadas.
 *  Tamanhos vêm da estimativa determinística (sem realimentação por medição = sem loop). */
export function derivarFlow(
  mapa: Mapa,
  posicoes: Posicoes,
): { nodes: Node[]; edges: Edge[] } {
  const visiveis = new Set(Object.keys(posicoes));
  const qtdFilhos = new Map<string, number>();
  for (const n of mapa.nos) {
    if (n.paiId) qtdFilhos.set(n.paiId, (qtdFilhos.get(n.paiId) ?? 0) + 1);
  }

  const posOf = (n: { id: string; posicao: { x: number; y: number } | null }) =>
    n.posicao ? { x: n.posicao.x, y: n.posicao.y } : posicoes[n.id];

  // contornos: caixas de fundo ao redor dos nós membros (renderizadas atrás dos nós)
  const grupos: Node[] = [];
  for (const c of mapa.contornos) {
    const membros = c.nosIds.filter((id) => visiveis.has(id));
    if (membros.length === 0) continue;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const id of membros) {
      const no = mapa.nos.find((n) => n.id === id)!;
      const p = posOf(no);
      const t = estimarTamanho(no);
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + t.w);
      maxY = Math.max(maxY, p.y + t.h);
    }
    const pad = 18;
    const w = maxX - minX + pad * 2;
    const h = maxY - minY + pad * 2;
    grupos.push({
      id: `grp_${c.id}`,
      type: "grupo",
      position: { x: minX - pad, y: minY - pad },
      data: { cor: c.cor, rotulo: c.rotulo, contornoId: c.id, w, h },
      draggable: false,
      selectable: false,
      zIndex: -1,
      style: { width: w, height: h },
    });
  }

  const mindNodes: Node[] = mapa.nos
    .filter((n) => visiveis.has(n.id))
    .map((n) => ({
      id: n.id,
      type: "mind",
      position: posOf(n),
      data: { no: n, temFilhos: qtdFilhos.has(n.id), qtdFilhos: qtdFilhos.get(n.id) ?? 0 },
    }));

  const edges: Edge[] = mapa.ligacoes
    .filter((l) => visiveis.has(l.origem) && visiveis.has(l.destino))
    .map((l) =>
      l.tipo === "relacao"
        ? {
            id: l.id, source: l.origem, target: l.destino, type: "default", animated: true,
            style: { stroke: "#d6336c", strokeWidth: 2, strokeDasharray: "6 4" },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#d6336c" },
          }
        : {
            id: l.id, source: l.origem, target: l.destino, type: "default",
            style: { stroke: "#cfd6e0", strokeWidth: 2 },
          },
    );

  return { nodes: [...grupos, ...mindNodes], edges };
}

/** Chave que muda quando a estrutura OU o tamanho estimado de algum nó muda
 *  (criar/apagar/recolher nós, mas também quando o texto/largura/imagem altera o
 *  tamanho do nó). Assim o layout se auto-reorganiza sem precisar do "Organizar".
 *  Não muda em arraste (posição), então a movimentação continua fluida. */
function chaveTopologia(mapa: Mapa): string {
  const partes = mapa.nos
    .map((n) => {
      const t = estimarTamanho(n);
      // bucket de ~8px: reorganiza conforme o nó cresce, sem churn por pixel
      return `${n.id}:${n.paiId ?? ""}:${n.recolhido ? 1 : 0}:${Math.round(t.w / 8)}x${Math.round(t.h / 8)}`;
    })
    .sort();
  return `${mapa.config.layout}|${partes.join(",")}`;
}

/** Hook que recalcula o layout só em mudanças de topologia/layout e devolve nodes/edges.
 *  Posições de arraste e edições NÃO disparam recálculo (movimentação fluida, sem loop). */
export function useSyncFlow(mapa: Mapa | null, versaoLayout = 0) {
  const [posicoes, setPosicoes] = useState<Posicoes>({});
  const chave = mapa ? `${chaveTopologia(mapa)}|v${versaoLayout}` : "";

  useEffect(() => {
    if (!mapa) {
      setPosicoes({});
      return;
    }
    let cancelado = false;
    calcularLayout(mapa.nos, mapa.ligacoes, mapa.config.layout).then((pos) => {
      if (!cancelado) setPosicoes(pos);
    });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  return useMemo(
    () => (mapa ? derivarFlow(mapa, posicoes) : { nodes: [], edges: [] }),
    [mapa, posicoes],
  );
}
