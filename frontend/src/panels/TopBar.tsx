import { useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useStore } from "../state/store";
import type { Layout } from "../types";
import { mapaParaTxt } from "../lib/export/txt";
import { exportarPng, exportarPdf, baixarTxt, baixarJson } from "../lib/export/image";

const LAYOUTS: { valor: Layout; rotulo: string }[] = [
  { valor: "radial", rotulo: "Horizontal" },
  { valor: "organograma", rotulo: "Vertical" },
];

export function TopBar({ onVoltar, onSalvar }: { onVoltar: () => void; onSalvar: () => void }) {
  const mapa = useStore((s) => s.mapa);
  const realinharTudo = useStore((s) => s.realinharTudo);
  const definirLayout = useStore((s) => s.definirLayout);
  const definirTema = useStore((s) => s.definirTema);
  const renomearMapa = useStore((s) => s.renomearMapa);
  const statusSalvar = useStore((s) => s.statusSalvar);
  const [aberto, setAberto] = useState(false);
  const { fitView } = useReactFlow();
  const undo = () => useStore.temporal.getState().undo();
  const redo = () => useStore.temporal.getState().redo();
  const organizar = () => {
    realinharTudo();
    setTimeout(() => fitView({ duration: 400, padding: 0.2 }), 200);
  };
  const trocarLayout = (l: Layout) => {
    definirLayout(l);
    setTimeout(() => fitView({ duration: 400, padding: 0.2 }), 200);
  };
  if (!mapa) return null;

  const escuro = mapa.config.tema === "escuro";
  const titulo = mapa.titulo || "mapa";
  return (
    <div style={barra}>
      <button onClick={onVoltar} style={ghost}>← Mapas</button>
      <span style={diamante}>◆</span>
      <input
        value={mapa.titulo}
        onChange={(e) => renomearMapa(e.target.value)}
        placeholder="Título do mapa"
        style={tituloInput}
        title="Clique para renomear o mapa"
      />
      <button
        onClick={onSalvar}
        style={{ ...salvarBtn, ...(statusSalvar === "erro" ? { borderColor: "#f1c4c4", color: "#d6336c" } : {}) }}
        title="Salvar agora (Ctrl+S)"
      >
        💾 {statusSalvar === "salvo" ? "Salvo" : statusSalvar === "salvando" ? "Salvando…" : "Salvar"}
      </button>

      <span style={divisor}>|</span>
      <button onClick={undo} style={iconBtn} title="Desfazer (Ctrl+Z)">↶</button>
      <button onClick={redo} style={iconBtn} title="Refazer (Ctrl+Y)">↷</button>

      <span style={divisor}>|</span>
      <div style={segmento}>
        {LAYOUTS.map((l) => (
          <button
            key={l.valor}
            onClick={() => trocarLayout(l.valor)}
            style={{ ...segBtn, ...(mapa.config.layout === l.valor ? segBtnAtivo : {}) }}
          >
            {l.rotulo}
          </button>
        ))}
      </div>
      <button onClick={organizar} style={ghost} title="Alinhar todos os nós (reaplica o layout)">⤢ Organizar</button>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        <button
          onClick={() => definirTema(escuro ? "claro" : "escuro")}
          title={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
          style={{
            position: "relative", width: 50, height: 26, borderRadius: 999, padding: 0,
            border: "none", cursor: "pointer", flexShrink: 0,
            background: escuro ? "#5b2be0" : "#cfd4db", transition: "background 0.2s ease",
          }}
        >
          <span style={{ position: "absolute", left: 8, top: 0, lineHeight: "26px", fontSize: 12, color: "#fff", opacity: escuro ? 1 : 0, transition: "opacity 0.2s" }}>☾</span>
          <span style={{ position: "absolute", right: 8, top: 0, lineHeight: "26px", fontSize: 12, color: "#f59e0b", opacity: escuro ? 0 : 1, transition: "opacity 0.2s" }}>☀</span>
          <span style={{
            position: "absolute", top: 3, left: escuro ? 27 : 3, width: 20, height: 20,
            borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            transition: "left 0.2s ease",
          }} />
        </button>

        <div style={{ position: "relative" }}>
          <button onClick={() => setAberto((v) => !v)} style={ghost}>⬇ Exportar ▾</button>
          {aberto && (
            <div style={menu} onMouseLeave={() => setAberto(false)}>
              <button style={itemMenu} onClick={() => { setAberto(false); exportarPng(titulo); }}>PNG (imagem)</button>
              <button style={itemMenu} onClick={() => { setAberto(false); exportarPdf(titulo); }}>PDF</button>
              <button style={itemMenu} onClick={() => { setAberto(false); baixarTxt(titulo, mapaParaTxt(mapa)); }}>TXT (outline)</button>
              <button style={itemMenu} onClick={() => { setAberto(false); baixarJson(titulo, mapa); }}>JSON (backup)</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const barra: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: "#fff", borderBottom: "1px solid #e6e8ec", boxShadow: "0 1px 4px rgba(20,25,40,0.05)", fontSize: 16 };
const diamante: React.CSSProperties = { color: "#3b5bdb", fontSize: 18 };
const tituloInput: React.CSSProperties = { border: "1px solid transparent", borderRadius: 8, padding: "6px 10px", fontSize: 19, fontWeight: 700, color: "#1f2733", background: "transparent", outline: "none", minWidth: 120, maxWidth: 320 };
const salvarBtn: React.CSSProperties = {
  background: "#f1eefe", color: "#5b2be0", border: "1px solid #ddd4fb",
  borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600,
  whiteSpace: "nowrap",
};
const divisor: React.CSSProperties = { color: "#d6dae0", fontSize: 18 };
const ghost: React.CSSProperties = { background: "transparent", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, color: "#1f2733", padding: "8px 12px", borderRadius: 8 };
const iconBtn: React.CSSProperties = { background: "transparent", border: "none", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "4px 10px", borderRadius: 8, color: "#1f2733" };
const segmento: React.CSSProperties = { display: "inline-flex", background: "#f1f3f6", borderRadius: 9, padding: 3, gap: 2 };
const segBtn: React.CSSProperties = { border: "none", background: "transparent", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: "#5b6472" };
const segBtnAtivo: React.CSSProperties = { background: "#fff", color: "#1f2733", boxShadow: "0 1px 3px rgba(20,25,40,0.12)" };
const menu: React.CSSProperties = { position: "absolute", right: 0, top: "100%", marginTop: 6, background: "#fff", border: "1px solid #e6e8ec", borderRadius: 10, boxShadow: "0 8px 24px rgba(20,25,40,0.16)", display: "flex", flexDirection: "column", minWidth: 190, zIndex: 20, overflow: "hidden" };
const itemMenu: React.CSSProperties = { background: "none", border: "none", textAlign: "left", padding: "12px 16px", cursor: "pointer", fontSize: 15, color: "#1f2733" };
