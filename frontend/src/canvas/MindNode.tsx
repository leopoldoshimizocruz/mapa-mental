import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { No } from "../types";

export interface MindNodeData {
  no: No;
  temFilhos: boolean;
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
  const estilo: React.CSSProperties = {
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
    maxWidth: 260,
    boxShadow: selected ? "0 0 0 3px #3b5bdb88" : "0 1px 3px #0002",
    cursor: "pointer",
    userSelect: "none",
  };

  return (
    <div style={estilo}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {no.emoji && <span>{no.emoji}</span>}
        <span>{no.texto || "(vazio)"}</span>
        {no.nota && <span title="Tem nota">📝</span>}
        {no.link && <span title="Tem link">🔗</span>}
      </span>
      {data.temFilhos && no.recolhido && (
        <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.85 }}>▸</span>
      )}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}
