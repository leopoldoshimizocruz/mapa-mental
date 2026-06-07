import { useStore } from "../state/store";

export interface GrupoData {
  cor: string;
  rotulo: string | null;
  contornoId: string;
  w: number;
  h: number;
  [key: string]: unknown;
}

/** Caixa de fundo (contorno/boundary) que agrupa visualmente um conjunto de nós. */
export function GrupoNode({ data }: { data: GrupoData }) {
  const removerContorno = useStore((s) => s.removerContorno);
  return (
    <div
      style={{
        width: data.w,
        height: data.h,
        background: `${data.cor}1f`,
        border: `2px dashed ${data.cor}`,
        borderRadius: 16,
        position: "relative",
      }}
    >
      <button
        title="Remover contorno"
        onClick={(e) => { e.stopPropagation(); removerContorno(data.contornoId); }}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: "absolute", top: -10, right: -10, width: 20, height: 20, borderRadius: "50%",
          border: "2px solid #fff", background: data.cor, color: "#fff", fontSize: 11,
          lineHeight: "16px", cursor: "pointer", padding: 0, pointerEvents: "all",
        }}
      >
        ×
      </button>
      {data.rotulo && (
        <span style={{
          position: "absolute", top: -11, left: 14, background: data.cor, color: "#fff",
          fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 6,
        }}>
          {data.rotulo}
        </span>
      )}
    </div>
  );
}
