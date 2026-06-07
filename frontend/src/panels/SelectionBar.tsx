import { useStore } from "../state/store";
import { PALETA } from "../types";

/** Barra flutuante que aparece quando 2+ nós estão selecionados (seleção por caixa),
 *  pra estilizar todos de uma vez, criar contorno ou apagar em lote. */
export function SelectionBar({ ids }: { ids: string[] }) {
  const atualizarCorVarios = useStore((s) => s.atualizarCorVarios);
  const criarContorno = useStore((s) => s.criarContorno);
  const apagarVarios = useStore((s) => s.apagarVarios);
  if (ids.length < 2) return null;

  return (
    <div style={barra}>
      <span style={{ fontWeight: 700, fontSize: 13 }}>{ids.length} selecionados</span>
      <span style={{ color: "#cfd4db" }}>|</span>
      <span style={{ display: "flex", gap: 4 }}>
        {PALETA.map((c) => (
          <button
            key={c}
            title="Aplicar cor a todos"
            onClick={() => atualizarCorVarios(ids, c)}
            style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: "1px solid #0001", cursor: "pointer" }}
          />
        ))}
      </span>
      <span style={{ color: "#cfd4db" }}>|</span>
      <button onClick={() => criarContorno(ids, "#5b2be0")} style={btn}>▢ Contorno</button>
      <button onClick={() => apagarVarios(ids)} style={{ ...btn, color: "#d6336c" }}>Apagar</button>
    </div>
  );
}

const barra: React.CSSProperties = {
  position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
  background: "#fff", border: "1px solid #e6e8ec", borderRadius: 12,
  boxShadow: "0 8px 24px rgba(20,25,40,0.18)", zIndex: 20, fontSize: 13,
};
const btn: React.CSSProperties = {
  background: "transparent", border: "1px solid #d6dae0", borderRadius: 8,
  padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#1f2733",
};
