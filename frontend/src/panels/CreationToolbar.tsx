import { useStore } from "../state/store";

export function CreationToolbar() {
  const selecionado = useStore((s) => s.selecionado);
  const adicionarFilho = useStore((s) => s.adicionarFilho);

  const addNo = () => {
    if (selecionado) adicionarFilho(selecionado);
  };

  return (
    <div style={barra}>
      <button title="Adicionar nó (Tab)" onClick={addNo} style={btn}>＋</button>
      <button title="Sticky note (Fase 3)" disabled style={btnOff}>📌</button>
      <button title="Forma (Fase 3)" disabled style={btnOff}>▢</button>
      <button title="Seta (Fase 3)" disabled style={btnOff}>↗</button>
      <button title="Caneta (Fase 3)" disabled style={btnOff}>✏️</button>
      <button title="Imagem (Fase 2)" disabled style={btnOff}>🖼️</button>
    </div>
  );
}

const barra: React.CSSProperties = { position: "absolute", top: 64, left: 16, display: "flex", flexDirection: "column", gap: 8, background: "#fff", border: "1px solid #e3e6ea", borderRadius: 12, padding: 8, zIndex: 15, boxShadow: "0 2px 10px #0001" };
const btn: React.CSSProperties = { width: 36, height: 36, borderRadius: 8, border: "1px solid #e3e6ea", background: "#f7f8fa", fontSize: 16, cursor: "pointer" };
const btnOff: React.CSSProperties = { ...btn, opacity: 0.35, cursor: "not-allowed" };
