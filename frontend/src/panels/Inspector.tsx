import { useStore } from "../state/store";
import { PALETA } from "../types";

const EMOJIS = ["📌", "⭐", "✅", "💡", "🔥", "❓", "📝", "🎯"];
const FONTES = ["Inter", "Roboto", "Poppins", "Georgia", "Comic Sans MS", "Courier New"];

export function Inspector() {
  const selecionado = useStore((s) => s.selecionado);
  const no = useStore((s) => s.mapa?.nos.find((n) => n.id === s.selecionado) ?? null);
  const atualizarNo = useStore((s) => s.atualizarNo);
  const atualizarEstilo = useStore((s) => s.atualizarEstilo);
  if (!selecionado || !no) return null;

  return (
    <div style={painel}>
      <div style={secao}>
        <label style={label}>Texto</label>
        <input
          value={no.texto}
          onChange={(e) => atualizarNo(no.id, { texto: e.target.value })}
          style={input}
        />
      </div>

      <div style={secao}>
        <label style={label}>Cor</label>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {PALETA.map((c) => (
            <button key={c} onClick={() => atualizarNo(no.id, { cor: c })}
              style={{ width: 22, height: 22, borderRadius: 5, background: c, border: no.cor === c ? "2px solid #1f2733" : "1px solid #ccc", cursor: "pointer" }} />
          ))}
          <input type="color" value={no.cor} onChange={(e) => atualizarNo(no.id, { cor: e.target.value })} style={{ width: 26, height: 24, border: "none", background: "none" }} />
        </div>
      </div>

      <div style={secao}>
        <label style={label}>Emoji</label>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button onClick={() => atualizarNo(no.id, { emoji: null })} style={chip}>—</button>
          {EMOJIS.map((em) => (
            <button key={em} onClick={() => atualizarNo(no.id, { emoji: em })} style={chip}>{em}</button>
          ))}
        </div>
      </div>

      <div style={secao}>
        <label style={label}>Fonte</label>
        <select value={no.estilo.fonte} onChange={(e) => atualizarEstilo(no.id, { fonte: e.target.value })} style={input}>
          {FONTES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      <div style={secao}>
        <label style={label}>Tamanho: {no.estilo.tamanho}px</label>
        <input type="range" min={10} max={40} value={no.estilo.tamanho}
          onChange={(e) => atualizarEstilo(no.id, { tamanho: Number(e.target.value) })} style={{ width: "100%" }} />
      </div>
    </div>
  );
}

const painel: React.CSSProperties = { position: "absolute", top: 64, right: 16, width: 220, background: "#fff", border: "1px solid #e3e6ea", borderRadius: 12, boxShadow: "0 6px 24px #0002", padding: 14, zIndex: 15, fontSize: 13 };
const secao: React.CSSProperties = { marginBottom: 12 };
const label: React.CSSProperties = { display: "block", color: "#888", marginBottom: 6, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 };
const input: React.CSSProperties = { width: "100%", padding: "6px 8px", border: "1px solid #d6dae0", borderRadius: 6, fontSize: 13, boxSizing: "border-box" };
const chip: React.CSSProperties = { width: 26, height: 26, borderRadius: 6, border: "1px solid #e3e6ea", background: "#f7f8fa", cursor: "pointer" };
