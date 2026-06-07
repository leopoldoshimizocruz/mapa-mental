import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import type { Mapa, MapaResumo } from "../types";
import { tempoRelativo, dataAbsoluta } from "../lib/tempo";

const CORES = ["#5b2be0", "#3b5bdb", "#2a9d8f", "#e76f51", "#e9c46a", "#d6336c", "#0ca678", "#f08c00"];

function corDoId(id: string): string {
  let soma = 0;
  for (const c of id) soma += c.charCodeAt(0);
  return CORES[soma % CORES.length];
}

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

  const fileRef = useRef<HTMLInputElement>(null);
  const importar = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = ev.target.files?.[0];
    ev.target.value = ""; // permite reimportar o mesmo arquivo
    if (!arquivo) return;
    try {
      const dados = JSON.parse(await arquivo.text()) as Mapa;
      const novo = await api.criar(dados.titulo || "Mapa importado");
      await api.salvar({ ...dados, id: novo.id });
      onAbrir(novo.id);
    } catch {
      alert("Arquivo inválido. Selecione um .json exportado pelo próprio app.");
    }
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
        <div>
          <h1 style={{ color: "#1f2733", margin: 0, fontSize: 26 }}>Meus mapas</h1>
          <span style={{ color: "#9aa3af", fontSize: 13 }}>
            {mapas.length} {mapas.length === 1 ? "mapa" : "mapas"}
          </span>
        </div>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar mapa…"
          style={inputBusca}
        />
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={importar} style={{ display: "none" }} />
        <button onClick={() => fileRef.current?.click()} style={btnSecundario}>⬆ Importar</button>
        <button onClick={criar} style={btnPrimario}>＋ Novo mapa</button>
      </header>

      <div style={lista}>
        {filtrados.map((m) => {
          const cor = corDoId(m.id);
          return (
            <div key={m.id} style={linha} onClick={() => onAbrir(m.id)}>
              <span style={{ ...avatar, background: cor }}>
                {(m.titulo || "?").trim().charAt(0).toUpperCase()}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={tituloLinha}>{m.titulo || "(sem título)"}</div>
                <div style={metaLinha}>
                  <span style={chip}>⬡ {m.qtdNos ?? 0} {(m.qtdNos ?? 0) === 1 ? "nó" : "nós"}</span>
                  <span style={metaItem} title={dataAbsoluta(m.atualizadoEm)}>
                    Editado {tempoRelativo(m.atualizadoEm) || "—"}
                  </span>
                  <span style={metaSep}>·</span>
                  <span style={metaItem}>Criado em {dataAbsoluta(m.criadoEm)}</span>
                </div>
              </div>

              <div style={acoes}>
                <button onClick={(e) => { e.stopPropagation(); onAbrir(m.id); }} style={btnAbrir}>Abrir</button>
                <button onClick={(e) => renomear(e, m.id, m.titulo)} style={btnGhost}>Renomear</button>
                <button onClick={(e) => apagar(e, m.id)} style={btnPerigo}>Apagar</button>
              </div>
            </div>
          );
        })}
      </div>

      {filtrados.length === 0 && (
        <p style={{ color: "#888", textAlign: "center", marginTop: 48 }}>
          {mapas.length === 0 ? "Nenhum mapa ainda. Crie o primeiro." : "Nenhum mapa encontrado para a busca."}
        </p>
      )}
    </div>
  );
}

const pagina: React.CSSProperties = { maxWidth: 880, margin: "48px auto", padding: "0 20px", fontFamily: "Inter, sans-serif" };
const topo: React.CSSProperties = { display: "flex", alignItems: "center", gap: 14, marginBottom: 28, flexWrap: "wrap" };
const inputBusca: React.CSSProperties = { flex: 1, minWidth: 180, padding: "11px 14px", border: "1px solid #e0e3e8", borderRadius: 10, fontSize: 14, outline: "none" };
const btnPrimario: React.CSSProperties = { background: "#5b2be0", color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer" };
const btnSecundario: React.CSSProperties = { background: "#fff", color: "#1f2733", border: "1px solid #d6dae0", borderRadius: 10, padding: "11px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer" };
const lista: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };
const linha: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
  border: "1px solid #e6e8ec", borderRadius: 14, background: "#fff",
  boxShadow: "0 1px 3px rgba(20,25,40,0.05)", cursor: "pointer",
};
const avatar: React.CSSProperties = {
  width: 42, height: 42, borderRadius: 11, color: "#fff", flexShrink: 0,
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  fontSize: 18, fontWeight: 700,
};
const tituloLinha: React.CSSProperties = {
  fontSize: 16, fontWeight: 700, color: "#1f2733",
  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
};
const metaLinha: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8, marginTop: 4,
  fontSize: 12.5, color: "#8a93a0", flexWrap: "wrap",
};
const metaItem: React.CSSProperties = { whiteSpace: "nowrap" };
const metaSep: React.CSSProperties = { color: "#cfd4db" };
const chip: React.CSSProperties = {
  background: "#f1eefe", color: "#5b2be0", borderRadius: 6,
  padding: "2px 8px", fontWeight: 600, whiteSpace: "nowrap",
};
const acoes: React.CSSProperties = { display: "flex", gap: 8, flexShrink: 0 };
const btnAbrir: React.CSSProperties = { background: "#5b2be0", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 };
const btnGhost: React.CSSProperties = { background: "transparent", border: "1px solid #d6dae0", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 13, color: "#1f2733" };
const btnPerigo: React.CSSProperties = { background: "transparent", border: "1px solid #f1c4c4", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 13, color: "#d6336c" };
