import { useEffect, useRef, useState } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import type { No } from "../types";
import { useStore } from "../state/store";

export interface MindNodeData {
  no: No;
  temFilhos: boolean;
  qtdFilhos: number;
  [key: string]: unknown;
}

const RAIO: Record<No["estilo"]["formato"], string> = {
  "retangulo-arredondado": "10px",
  pilula: "999px",
  elipse: "50%",
  retangulo: "0px",
};

export function MindNode({ data, selected }: NodeProps & { data: MindNodeData }) {
  const { no } = data;
  const e = no.estilo;
  const editando = useStore((s) => s.editando === no.id);
  const iniciarEdicao = useStore((s) => s.iniciarEdicao);
  const atualizarNo = useStore((s) => s.atualizarNo);
  const adicionarFilho = useStore((s) => s.adicionarFilho);
  const adicionarIrmao = useStore((s) => s.adicionarIrmao);
  const alternarRecolhido = useStore((s) => s.alternarRecolhido);
  const redimensionarNo = useStore((s) => s.redimensionarNo);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [larguraPreview, setLarguraPreview] = useState<number | null>(null);
  const [valor, setValor] = useState(no.texto);
  const { getZoom } = useReactFlow();

  // ao iniciar a edição, sincroniza o valor do input com o texto atual do nó
  useEffect(() => {
    if (editando) setValor(no.texto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editando]);

  const larguraAtual = larguraPreview ?? (no.tamanho?.w && no.tamanho.w > 0 ? no.tamanho.w : null);
  const larguraFixa = larguraAtual !== null;
  const estilo: React.CSSProperties = {
    position: "relative",
    background: no.cor,
    color: e.corTexto,
    fontFamily: e.fonte,
    fontSize: e.tamanho,
    fontWeight: e.negrito ? 700 : 600,
    fontStyle: e.italico ? "italic" : "normal",
    textDecoration: e.sublinhado ? "underline" : "none",
    textAlign: e.alinhamento === "centro" ? "center" : e.alinhamento === "direita" ? "right" : "left",
    border: e.larguraBorda ? `${e.larguraBorda}px solid ${e.corBorda ?? "#0003"}` : "none",
    borderRadius: RAIO[e.formato],
    padding: "8px 16px",
    minWidth: 80,
    width: larguraFixa ? larguraAtual! : undefined,
    maxWidth: larguraFixa ? undefined : (editando ? 620 : 260),
    whiteSpace: larguraFixa ? "normal" : undefined,
    wordBreak: larguraFixa ? "break-word" : undefined,
    boxShadow: selected ? "0 0 0 3px #3b5bdb88" : "0 1px 3px #0002",
    cursor: "pointer",
    userSelect: "none",
  };

  const onResizeDown = (ev: React.PointerEvent<HTMLDivElement>) => {
    ev.stopPropagation();
    ev.preventDefault();
    const alvo = ev.currentTarget;
    alvo.setPointerCapture(ev.pointerId);
    const startX = ev.clientX;
    const startW = nodeRef.current?.offsetWidth ?? 160;
    const zoom = getZoom() || 1;
    let ultimaW = startW;
    const onMove = (e2: PointerEvent) => {
      ultimaW = Math.max(80, Math.round(startW + (e2.clientX - startX) / zoom));
      setLarguraPreview(ultimaW); // preview local, sem mexer no store/histórico
    };
    const onUp = () => {
      alvo.removeEventListener("pointermove", onMove);
      alvo.removeEventListener("pointerup", onUp);
      setLarguraPreview(null);
      redimensionarNo(no.id, ultimaW); // commit único -> 1 passo de undo
    };
    alvo.addEventListener("pointermove", onMove);
    alvo.addEventListener("pointerup", onUp);
  };

  const confirmar = () => {
    atualizarNo(no.id, { texto: valor });
  };

  const onKeyDownInput = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    ev.stopPropagation(); // evita que o React Flow capture Delete/Backspace etc.
    if (ev.key === "Enter" && !ev.shiftKey) {
      ev.preventDefault();
      confirmar();
      adicionarIrmao(no.id);
    } else if (ev.key === "Tab") {
      ev.preventDefault();
      confirmar();
      adicionarFilho(no.id);
    } else if (ev.key === "Escape") {
      ev.preventDefault();
      iniciarEdicao(null);
    }
  };

  const onBlurInput = () => {
    confirmar();
    if (useStore.getState().editando === no.id) iniciarEdicao(null);
  };

  return (
    <div
      ref={nodeRef}
      style={estilo}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 9, height: 9, background: "#3b5bdb", border: "2px solid #fff", opacity: hover ? 1 : 0 }}
      />

      {no.imagem && (
        <img
          src={no.imagem}
          alt=""
          style={{ display: "block", maxWidth: 220, maxHeight: 140, borderRadius: 8, marginBottom: 6 }}
        />
      )}

      {editando ? (
        <input
          ref={inputRef}
          autoFocus
          value={valor}
          onChange={(ev) => setValor(ev.target.value)}
          onFocus={(ev) => ev.currentTarget.select()}
          onKeyDown={onKeyDownInput}
          onBlur={onBlurInput}
          onMouseDown={(ev) => ev.stopPropagation()}
          style={{
            background: "rgba(255,255,255,0.18)",
            border: "none",
            outline: "none",
            color: e.corTexto,
            font: "inherit",
            textAlign: "inherit",
            // cresce conforme o usuário digita (a caixa do nó expande junto)
            width: larguraFixa ? "100%" : `${Math.max(4, valor.length + 1)}ch`,
            minWidth: 60,
            maxWidth: larguraFixa ? undefined : 560,
          }}
        />
      ) : (
        <span style={{
          display: "flex", width: "100%", alignItems: "center", gap: 6,
          justifyContent: e.alinhamento === "centro" ? "center" : e.alinhamento === "direita" ? "flex-end" : "flex-start",
        }}>
          {no.emoji && <span>{no.emoji}</span>}
          <span>{no.texto || "(vazio)"}</span>
          {no.nota && <span title={no.nota}>📝</span>}
          {no.link && (
            <a
              href={no.link}
              target="_blank"
              rel="noreferrer"
              title={no.link}
              onClick={(ev) => ev.stopPropagation()}
              onMouseDown={(ev) => ev.stopPropagation()}
              style={{ color: e.corTexto, textDecoration: "none" }}
            >
              🔗
            </a>
          )}
        </span>
      )}

      {/* alça de redimensionamento horizontal (borda direita) */}
      {(hover || selected) && !editando && (
        <div
          title="Arraste para mudar a largura"
          onPointerDown={onResizeDown}
          style={{
            position: "absolute", top: 6, bottom: 6, right: 0, width: 8,
            cursor: "ew-resize", borderRadius: "0 8px 8px 0",
            background: "rgba(255,255,255,0.35)", zIndex: 4,
          }}
        />
      )}

      {/* toggle recolher/expandir (estilo MindMeister), só quando tem filhos */}
      {data.qtdFilhos > 0 && (
        <button
          title={no.recolhido ? "Expandir ramo" : "Recolher ramo"}
          onMouseDown={(ev) => ev.stopPropagation()}
          onClick={(ev) => { ev.stopPropagation(); alternarRecolhido(no.id); }}
          style={{
            position: "absolute", right: -14, top: "50%", transform: "translateY(-50%)",
            minWidth: 20, height: 20, padding: "0 5px", borderRadius: 10,
            border: "2px solid #fff", background: no.cor, color: "#fff",
            fontSize: 11, fontWeight: 700, lineHeight: "16px", cursor: "pointer",
            boxShadow: "0 1px 4px #0004", zIndex: 6,
          }}
        >
          {no.recolhido ? data.qtdFilhos : "−"}
        </button>
      )}

      {/* adicionar filho (aparece no hover, embaixo) */}
      {(hover || selected) && !editando && (
        <button
          title="Adicionar filho (Tab)"
          onMouseDown={(ev) => ev.stopPropagation()}
          onClick={(ev) => { ev.stopPropagation(); adicionarFilho(no.id); }}
          style={{
            position: "absolute", bottom: -12, left: "50%", transform: "translateX(-50%)",
            width: 22, height: 22, borderRadius: "50%", border: "2px solid #fff",
            background: "#3b5bdb", color: "#fff", fontSize: 14, lineHeight: "18px",
            cursor: "pointer", boxShadow: "0 1px 4px #0003", padding: 0, zIndex: 6,
          }}
        >
          ＋
        </button>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 9, height: 9, background: "#3b5bdb", border: "2px solid #fff", opacity: hover ? 1 : 0 }}
      />
    </div>
  );
}
