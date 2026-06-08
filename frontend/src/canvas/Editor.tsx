import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, useReactFlow,
  useNodesState, useEdgesState,
  type Node, type Edge, type Connection, type NodeMouseHandler, type EdgeMouseHandler, type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useStore } from "../state/store";
import { api } from "../api/client";
import { MindNode } from "./MindNode";
import { GrupoNode } from "./GrupoNode";
import { useSyncFlow } from "./useSyncFlow";
import { useShortcuts, type Acao } from "../lib/shortcuts";
import { TopBar } from "../panels/TopBar";
import { Inspector } from "../panels/Inspector";
import { CreationToolbar } from "../panels/CreationToolbar";
import { SelectionBar } from "../panels/SelectionBar";

const nodeTypes = { mind: MindNode, grupo: GrupoNode };

function EditorInterno({ onVoltar }: { onVoltar: () => void }) {
  const mapa = useStore((s) => s.mapa);
  const selecionar = useStore((s) => s.selecionar);
  const selecionado = useStore((s) => s.selecionado);
  const adicionarFilho = useStore((s) => s.adicionarFilho);
  const adicionarIrmao = useStore((s) => s.adicionarIrmao);
  const apagarNo = useStore((s) => s.apagarNo);
  const iniciarEdicao = useStore((s) => s.iniciarEdicao);
  const moverNo = useStore((s) => s.moverNo);
  const adicionarIsolado = useStore((s) => s.adicionarIsolado);
  const copiar = useStore((s) => s.copiar);
  const colar = useStore((s) => s.colar);
  const duplicar = useStore((s) => s.duplicar);
  const reparentar = useStore((s) => s.reparentar);
  const moverVarios = useStore((s) => s.moverVarios);
  const apagarVarios = useStore((s) => s.apagarVarios);
  const adicionarRelacao = useStore((s) => s.adicionarRelacao);
  const removerLigacao = useStore((s) => s.removerLigacao);
  const setStatusSalvar = useStore((s) => s.setStatusSalvar);
  const versaoLayout = useStore((s) => s.versaoLayout);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const selecionadosRef = useRef<string[]>([]);
  const { nodes: derNodes, edges: derEdges } = useSyncFlow(mapa, versaoLayout);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition, getIntersectingNodes } = useReactFlow();

  const salvarAgora = useCallback(() => {
    const m = useStore.getState().mapa;
    if (!m) return;
    setStatusSalvar("salvando");
    api.salvar(m).then(() => setStatusSalvar("salvo")).catch(() => setStatusSalvar("erro"));
  }, [setStatusSalvar]);

  // sincroniza o layout derivado (store) para o estado local do React Flow.
  // derNodes só muda em mudança real de layout/estrutura, então não há loop.
  useEffect(() => {
    setNodes(derNodes);
  }, [derNodes, setNodes]);
  useEffect(() => {
    setEdges(derEdges);
  }, [derEdges, setEdges]);

  const despachar = useCallback((acao: Acao) => {
    if (acao === "undo") return useStore.temporal.getState().undo();
    if (acao === "redo") return useStore.temporal.getState().redo();
    if (acao === "salvar") return salvarAgora();
    if (acao === "colar") { colar(selecionado); return; } // cola no selecionado, ou isolado se nada selecionado
    if (acao === "apagar") {
      if (selecionadosRef.current.length > 1) apagarVarios(selecionadosRef.current);
      else if (selecionado) apagarNo(selecionado);
      return;
    }
    if (!selecionado) return;
    if (acao === "filho") adicionarFilho(selecionado);
    else if (acao === "irmao") adicionarIrmao(selecionado);
    else if (acao === "copiar") copiar(selecionado);
    else if (acao === "duplicar") duplicar(selecionado);
  }, [selecionado, adicionarFilho, adicionarIrmao, apagarNo, apagarVarios, copiar, colar, duplicar, salvarAgora]);
  useShortcuts(despachar);

  const onNodeClick: NodeMouseHandler = (_e, node) => selecionar(node.id);
  const onPaneClick = () => selecionar(null);

  const onNodeDoubleClick: NodeMouseHandler = (_e, node) => iniciarEdicao(node.id);

  const onNodeDragStop: OnNodeDrag = (_e, node: Node) => {
    // se soltou em cima de outro nó, vira filho dele (re-parent); senão, só move
    const sobre = getIntersectingNodes(node).filter((n) => n.id !== node.id && n.type === "mind");
    if (sobre.length > 0 && reparentar(node.id, sobre[0].id)) return;
    moverNo(node.id, node.position.x, node.position.y);
  };

  // arrastar de um nó pra outro cria uma RELAÇÃO livre (seta tracejada)
  const onConnect = (c: Connection) => {
    if (c.source && c.target) adicionarRelacao(c.source, c.target);
  };

  // duplo-clique numa relação remove ela (hierarquia não é removível por aqui)
  const onEdgeDoubleClick: EdgeMouseHandler = (_e, edge) => {
    const lig = mapa?.ligacoes.find((l) => l.id === edge.id);
    if (lig?.tipo === "relacao") removerLigacao(edge.id);
  };

  // mover vários nós selecionados de uma vez (persiste todos no fim do arraste)
  const onSelectionDragStop = (_e: React.MouseEvent, nós: Node[]) => {
    moverVarios(nós.filter((n) => n.type === "mind").map((n) => ({ id: n.id, x: n.position.x, y: n.position.y })));
  };

  // callback ESTÁVEL e idempotente: só atualiza o estado quando a seleção realmente
  // muda (evita loop infinito de re-render disparado pela medição dos nós).
  const onSelectionChange = useCallback(({ nodes: sel }: { nodes: Node[] }) => {
    const ids = sel.filter((n) => n.type === "mind").map((n) => n.id);
    const atual = selecionadosRef.current;
    const igual = ids.length === atual.length && ids.every((id, i) => id === atual[i]);
    if (igual) return;
    selecionadosRef.current = ids;
    setSelecionados(ids);
  }, []);

  // duplo-clique numa área vazia do canvas cria um nó ISOLADO (sem ligação) ali
  const onPaneDoubleClick = (ev: React.MouseEvent) => {
    const alvo = ev.target as HTMLElement;
    if (!alvo.classList.contains("react-flow__pane")) return;
    const pos = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
    adicionarIsolado(pos.x, pos.y);
  };

  // autosave com debounce + status (salvando/salvo/erro)
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (!mapa) return;
    if (timer.current) window.clearTimeout(timer.current);
    setStatusSalvar("salvando");
    timer.current = window.setTimeout(() => {
      api.salvar(mapa)
        .then(() => setStatusSalvar("salvo"))
        .catch(() => setStatusSalvar("erro"));
    }, 800);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [mapa, setStatusSalvar]);

  const escuro = mapa?.config.tema === "escuro";

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar onVoltar={onVoltar} />
      <div
        style={{ flex: 1, position: "relative", background: escuro ? "#11151c" : "#f4f5f7" }}
        onDoubleClick={onPaneDoubleClick}
      >
        <CreationToolbar />
        <Inspector />
        <SelectionBar ids={selecionados} />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeDragStop={onNodeDragStop}
          onSelectionDragStop={onSelectionDragStop}
          onConnect={onConnect}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onPaneClick={onPaneClick}
          onSelectionChange={onSelectionChange}
          selectionOnDrag
          panOnDrag={[1, 2]}
          deleteKeyCode={null}
          minZoom={0.2}
          maxZoom={2.5}
          fitView
        >
          <Background color={escuro ? "#2a3340" : "#c9d1dc"} gap={16} />
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
