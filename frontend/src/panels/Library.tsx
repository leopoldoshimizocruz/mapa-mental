import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { MapaResumo } from "../types";
import { tempoRelativo } from "../lib/tempo";

export function Library({ onAbrir }: { onAbrir: (id: string) => void }) {
  const [mapas, setMapas] = useState<MapaResumo[]>([]);
  const [busca, setBusca] = useState("");

  const recarregar = () => api.listar().then(setMapas);
  useEffect(() => {
    recarregar();
  }, []);

  const criar = async () => {
    const mapa = await api.criar("Novo mapa");
    onAbrir(mapa.id);
  };

  const apagar = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Apagar este mapa?")) return;
    await api.apagar(id);
    recarregar();
  };

  const renomear = async (e: React.MouseEvent, id: string, atual: string) => {
    e.stopPropagation();
    const titulo = prompt("Novo título:", atual);
    if (!titulo) return;
    await api.renomear(id, titulo);
    recarregar();
  };

  const filtrados = useMemo(
    () => mapas.filter((m) => m.titulo.toLowerCase().includes(busca.toLowerCase())),
    [mapas, busca],
  );

  return (
    <div style={pagina}>
      <header style={topo}>
        <h1 style={{ color: "#1f2733", margin: 0 }}>Meus mapas</h1>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar mapa…"
          style={inputBusca}
        />
        <button onClick={criar} style={btnPrimario}>＋ Novo mapa</button>
      </header>

      <div style={grade}>
        {filtrados.map((m) => (
          <div key={m.id} style={card} onClick={() => onAbrir(m.id)}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1f2733", marginBottom: 10 }}>
              {m.titulo || "(sem título)"}
            </div>
            <div style={{ fontSize: 12, color: "#8a93a0", lineHeight: 1.6 }}>
              <div>Editado {tempoRelativo(m.atualizadoEm) || "—"}</div>
              <div>Criado {tempoRelativo(m.criadoEm) || "—"}</div>
            </div>
            <div style={acoes}>
              <button onClick={(e) => renomear(e, m.id, m.titulo)} style={btnGhost}>Renomear</button>
              <button onClick={(e) => apagar(e, m.id)} style={btnGhost}>Apagar</button>
            </div>
          </div>
        ))}
      </div>

      {filtrados.length === 0 && (
        <p style={{ color: "#888", textAlign: "center", marginTop: 40 }}>
          {mapas.length === 0 ? "Nenhum mapa ainda. Crie o primeiro." : "Nenhum mapa encontrado para a busca."}
        </p>
      )}
    </div>
  );
}

const pagina: React.CSSProperties = { maxWidth: 980, margin: "40px auto", padding: "0 20px", fontFamily: "Inter, sans-serif" };
const topo: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, marginBottom: 28, flexWrap: "wrap" };
const inputBusca: React.CSSProperties = { flex: 1, minWidth: 180, padding: "10px 14px", border: "1px solid #d6dae0", borderRadius: 8, fontSize: 14 };
const btnPrimario: React.CSSProperties = { background: "#5b2be0", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 600, cursor: "pointer" };
const grade: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 };
const card: React.CSSProperties = { border: "1px solid #e3e6ea", borderRadius: 12, padding: 16, cursor: "pointer", background: "#fff", boxShadow: "0 1px 3px #0001", display: "flex", flexDirection: "column", minHeight: 130 };
const acoes: React.CSSProperties = { display: "flex", gap: 8, marginTop: "auto", paddingTop: 12 };
const btnGhost: React.CSSProperties = { background: "transparent", border: "1px solid #d6dae0", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12 };
