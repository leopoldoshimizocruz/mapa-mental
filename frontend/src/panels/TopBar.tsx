import { useState } from "react";
import { useStore } from "../state/store";
import { mapaParaTxt } from "../lib/export/txt";
import { exportarPng, exportarPdf, baixarTxt } from "../lib/export/image";

export function TopBar({ onVoltar }: { onVoltar: () => void }) {
  const mapa = useStore((s) => s.mapa);
  const [aberto, setAberto] = useState(false);
  const undo = () => useStore.temporal.getState().undo();
  const redo = () => useStore.temporal.getState().redo();
  if (!mapa) return null;

  const titulo = mapa.titulo || "mapa";
  return (
    <div style={barra}>
      <button onClick={onVoltar} style={ghost}>← Mapas</button>
      <b style={{ color: "#3b5bdb" }}>◆ {titulo}</b>
      <span style={{ color: "#ccc" }}>|</span>
      <button onClick={undo} style={ghost} title="Desfazer (Ctrl+Z)">↶</button>
      <button onClick={redo} style={ghost} title="Refazer (Ctrl+Y)">↷</button>
      <div style={{ marginLeft: "auto", position: "relative" }}>
        <button onClick={() => setAberto((v) => !v)} style={ghost}>⬇ Exportar ▾</button>
        {aberto && (
          <div style={menu} onMouseLeave={() => setAberto(false)}>
            <button style={itemMenu} onClick={() => { setAberto(false); exportarPng(titulo); }}>PNG (imagem)</button>
            <button style={itemMenu} onClick={() => { setAberto(false); exportarPdf(titulo); }}>PDF</button>
            <button style={itemMenu} onClick={() => { setAberto(false); baixarTxt(titulo, mapaParaTxt(mapa)); }}>TXT (outline)</button>
          </div>
        )}
      </div>
    </div>
  );
}

const barra: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fff", borderBottom: "1px solid #e3e6ea", fontSize: 14 };
const ghost: React.CSSProperties = { background: "transparent", border: "none", cursor: "pointer", fontSize: 14, padding: "4px 8px" };
const menu: React.CSSProperties = { position: "absolute", right: 0, top: "100%", background: "#fff", border: "1px solid #e3e6ea", borderRadius: 8, boxShadow: "0 4px 16px #0002", display: "flex", flexDirection: "column", minWidth: 160, zIndex: 20 };
const itemMenu: React.CSSProperties = { background: "none", border: "none", textAlign: "left", padding: "10px 14px", cursor: "pointer", fontSize: 14 };
