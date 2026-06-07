import { useEffect, useState } from "react";
import type { Edge, Node } from "@xyflow/react";
import type { Mapa } from "../types";
import { calcularLayout, type Posicoes } from "../lib/layout/elk";
import type { MindNodeData } from "./MindNode";

/** Deriva nodes/edges do React Flow a partir do mapa e das posições calculadas. */
export function derivarFlow(
  mapa: Mapa,
  posicoes: Posicoes,
): { nodes: Node<MindNodeData>[]; edges: Edge[] } {
  const visiveis = new Set(Object.keys(posicoes));
  const temFilhos = new Set(mapa.nos.filter((n) => n.paiId).map((n) => n.paiId!));

  const nodes: Node<MindNodeData>[] = mapa.nos
    .filter((n) => visiveis.has(n.id))
    .map((n) => ({
      id: n.id,
      type: "mind",
      position: posicoes[n.id],
      data: { no: n, temFilhos: temFilhos.has(n.id) },
    }));

  const edges: Edge[] = mapa.ligacoes
    .filter((l) => visiveis.has(l.origem) && visiveis.has(l.destino))
    .map((l) => ({
      id: l.id,
      source: l.origem,
      target: l.destino,
      type: "default",
      style: { stroke: "#cfd6e0", strokeWidth: 2 },
    }));

  return { nodes, edges };
}

/** Hook que recalcula layout quando o mapa muda e devolve nodes/edges prontos. */
export function useSyncFlow(mapa: Mapa | null) {
  const [flow, setFlow] = useState<{ nodes: Node<MindNodeData>[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });

  useEffect(() => {
    if (!mapa) {
      setFlow({ nodes: [], edges: [] });
      return;
    }
    let cancelado = false;
    calcularLayout(mapa.nos, mapa.ligacoes, mapa.config.layout).then((pos) => {
      if (!cancelado) setFlow(derivarFlow(mapa, pos));
    });
    return () => {
      cancelado = true;
    };
  }, [mapa]);

  return flow;
}
