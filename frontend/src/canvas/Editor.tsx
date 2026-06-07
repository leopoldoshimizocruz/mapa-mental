import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap,
  type Node, type NodeMouseHandler, type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useStore } from "../state/store";
import { api } from "../api/client";
import { MindNode } from "./MindNode";
import { useSyncFlow } from "./useSyncFlow";
import { useShortcuts, type Acao } from "../lib/shortcuts";
import { TopBar } from "../panels/TopBar";
import { Inspector } from "../panels/Inspector";
import { CreationToolbar } from "../panels/CreationToolbar";

const nodeTypes = { mind: MindNode };

function EditorInterno({ onVoltar }: { onVoltar: () => void }) {
  const mapa = useStore((s) => s.mapa);
  const selecionar = useStore((s) => s.selecionar);
  const selecionado = useStore((s) => s.selecionado);
  const adicionarFilho = useStore((s) => s.adicionarFilho);
  const adicionarIrmao = useStore((s) => s.adicionarIrmao);
  const apagarNo = useStore((s) => s.apagarNo);
  const atualizarNo = useStore((s) => s.atualizarNo);
  const moverNo = useStore((s) => s.moverNo);
  const alternarRecolhido = useStore((s) => s.alternarRecolhido);
  const { nodes, edges } = useSyncFlow(mapa);

  const despachar = useCallback((acao: Acao) => {
    if (!selecionado) return;
    if (acao === "filho") adicionarFilho(selecionado);
    else if (acao === "irmao") adicionarIrmao(selecionado);
    else if (acao === "apagar") apagarNo(selecionado);
    else if (acao === "undo") useStore.temporal.getState().undo();
    else if (acao === "redo") useStore.temporal.getState().redo();
  }, [selecionado, adicionarFilho, adicionarIrmao, apagarNo]);
  useShortcuts(despachar);

  const onNodeClick: NodeMouseHandler = (_e, node) => selecionar(node.id);
  const onPaneClick = () => selecionar(null);

  const onNodeDoubleClick: NodeMouseHandler = (_e, node) => {
    const atual = mapa?.nos.find((n) => n.id === node.id);
    const texto = prompt("Texto do nó:", atual?.texto ?? "");
    if (texto !== null) atualizarNo(node.id, { texto });
  };

  const onNodeDragStop: OnNodeDrag = (_e, node: Node) => {
    moverNo(node.id, node.position.x, node.position.y);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      if (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA") return;
      if (e.key === " " && selecionado) {
        e.preventDefault();
        alternarRecolhido(selecionado);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selecionado, alternarRecolhido]);

  // autosave com debounce
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (!mapa) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      api.salvar(mapa).catch(() => console.warn("Falha no autosave"));
    }, 800);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [mapa]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar onVoltar={onVoltar} />
      <div style={{ flex: 1, position: "relative" }}>
        <CreationToolbar />
        <Inspector />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeDragStop={onNodeDragStop}
          onPaneClick={onPaneClick}
          fitView
        >
          <Background color="#c9d1dc" gap={16} />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

export function Editor({ mapId, onVoltar }: { mapId: string; onVoltar: () => void }) {
  const carregarMapa = useStore((s) => s.carregarMapa);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    api.carregar(mapId).then((m) => {
      carregarMapa(m);
      useStore.temporal.getState().clear();
      setPronto(true);
    });
  }, [mapId, carregarMapa]);

  if (!pronto) return <div style={{ padding: 40 }}>Carregando…</div>;
  return (
    <ReactFlowProvider>
      <EditorInterno onVoltar={onVoltar} />
    </ReactFlowProvider>
  );
}
