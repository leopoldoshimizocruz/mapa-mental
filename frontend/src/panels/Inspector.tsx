import { useStore } from "../state/store";
import { PALETA } from "../types";
import type { Alinhamento, Formato } from "../types";

const EMOJIS = ["📌", "⭐", "✅", "💡", "🔥", "❓", "📝", "🎯"];
const FONTES = ["Inter", "Roboto", "Poppins", "Georgia", "Comic Sans MS", "Courier New"];
const ALINHAMENTOS: { valor: Alinhamento; icone: string; rotulo: string }[] = [
  { valor: "esquerda", icone: "⯇", rotulo: "Esquerda" },
  { valor: "centro", icone: "≡", rotulo: "Centralizado" },
  { valor: "direita", icone: "⯈", rotulo: "Direita" },
];
const FORMATOS: { valor: Formato; icone: string; rotulo: string }[] = [
  { valor: "retangulo-arredondado", icone: "▢", rotulo: "Arredondado" },
  { valor: "pilula", icone: "⬭", rotulo: "Pílula" },
  { valor: "elipse", icone: "◯", rotulo: "Elipse" },
  { valor: "retangulo", icone: "▭", rotulo: "Retângulo" },
];

export function Inspector() {
  const selecionado = useStore((s) => s.selecionado);
  const no = useStore((s) => s.mapa?.nos.find((n) => n.id === s.selecionado) ?? null);
  const atualizarNo = useStore((s) => s.atualizarNo);
  const atualizarEstilo = useStore((s) => s.atualizarEstilo);
  if (!selecionado || !no) return null;

  const e = no.estilo;

  const onImagem = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    ev.target.value = "";
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => atualizarNo(no.id, { imagem: String(reader.result) });
    reader.readAsDataURL(f);
  };

  return (
    <div style={painel}>
      <div style={cabecalho}>
        <span style={{ ...bolinha, background: no.cor }} />
        <span style={titulo}>Estilo do nó</span>
      </div>

      <div style={secao}>
        <span style={label}>Texto</span>
        <input
          value={no.texto}
          onChange={(ev) => atualizarNo(no.id, { texto: ev.target.value })}
          placeholder="Digite…"
          style={input}
        />
      </div>

      <div style={secao}>
        <span style={label}>Cor</span>
        <div style={linha}>
          {PALETA.map((c) => (
            <button
              key={c}
              onClick={() => atualizarNo(no.id, { cor: c })}
              title={c}
              style={{
                ...swatch,
                background: c,
                boxShadow: no.cor === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : "inset 0 0 0 1px #0001",
              }}
            />
          ))}
          <label style={{ ...swatch, ...swatchCustom }} title="Cor personalizada">
            <span style={{ fontSize: 12 }}>🎨</span>
            <input
              type="color"
              value={no.cor}
              onChange={(ev) => atualizarNo(no.id, { cor: ev.target.value })}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
            />
          </label>
        </div>
      </div>

      <div style={secao}>
        <span style={label}>Emoji</span>
        <div style={linha}>
          <button
            onClick={() => atualizarNo(no.id, { emoji: null })}
            style={{ ...chip, ...(no.emoji ? {} : chipAtivo) }}
            title="Sem emoji"
          >
            —
          </button>
          {EMOJIS.map((em) => (
            <button
              key={em}
              onClick={() => atualizarNo(no.id, { emoji: em })}
              style={{ ...chip, ...(no.emoji === em ? chipAtivo : {}) }}
            >
              {em}
            </button>
          ))}
        </div>
      </div>

      <div style={secao}>
        <span style={label}>Formatação</span>
        <div style={linha}>
          <button onClick={() => atualizarEstilo(no.id, { negrito: !e.negrito })}
            style={{ ...toggle, ...(e.negrito ? toggleAtivo : {}), fontWeight: 700 }}>B</button>
          <button onClick={() => atualizarEstilo(no.id, { italico: !e.italico })}
            style={{ ...toggle, ...(e.italico ? toggleAtivo : {}), fontStyle: "italic" }}>i</button>
          <button onClick={() => atualizarEstilo(no.id, { sublinhado: !e.sublinhado })}
            style={{ ...toggle, ...(e.sublinhado ? toggleAtivo : {}), textDecoration: "underline" }}>U</button>
        </div>
      </div>

      <div style={secao}>
        <span style={label}>Alinhamento do texto</span>
        <div style={linha}>
          {ALINHAMENTOS.map((a) => (
            <button
              key={a.valor}
              title={a.rotulo}
              onClick={() => atualizarEstilo(no.id, { alinhamento: a.valor })}
              style={{ ...toggle, flex: 1, ...(e.alinhamento === a.valor ? toggleAtivo : {}) }}
            >
              {a.icone}
            </button>
          ))}
        </div>
      </div>

      <div style={secao}>
        <span style={label}>Formato da caixa</span>
        <div style={linha}>
          {FORMATOS.map((f) => (
            <button
              key={f.valor}
              title={f.rotulo}
              onClick={() => atualizarEstilo(no.id, { formato: f.valor })}
              style={{ ...toggle, width: 38, ...(e.formato === f.valor ? toggleAtivo : {}) }}
            >
              {f.icone}
            </button>
          ))}
        </div>
      </div>

      <div style={secao}>
        <div style={tamanhoTopo}>
          <span style={{ ...label, marginBottom: 0 }}>Borda</span>
          <span style={valorChip}>{e.larguraBorda}px</span>
        </div>
        <input
          type="range"
          min={0}
          max={8}
          value={e.larguraBorda}
          onChange={(ev) => atualizarEstilo(no.id, { larguraBorda: Number(ev.target.value) })}
          style={{ width: "100%", accentColor: "#5b2be0" }}
        />
        {e.larguraBorda > 0 && (
          <div style={{ ...linha, marginTop: 8 }}>
            {PALETA.map((c) => (
              <button
                key={c}
                onClick={() => atualizarEstilo(no.id, { corBorda: c })}
                style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: e.corBorda === c ? "2px solid #1f2733" : "1px solid #ccc", cursor: "pointer" }}
              />
            ))}
          </div>
        )}
      </div>

      <div style={secao}>
        <span style={label}>Fonte</span>
        <select
          value={e.fonte}
          onChange={(ev) => atualizarEstilo(no.id, { fonte: ev.target.value })}
          style={{ ...input, fontFamily: e.fonte }}
        >
          {FONTES.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
          ))}
        </select>
      </div>

      <div style={secao}>
        <div style={tamanhoTopo}>
          <span style={{ ...label, marginBottom: 0 }}>Tamanho da fonte</span>
          <span style={valorChip}>{e.tamanho}px</span>
        </div>
        <input
          type="range"
          min={10}
          max={40}
          value={e.tamanho}
          onChange={(ev) => atualizarEstilo(no.id, { tamanho: Number(ev.target.value) })}
          style={{ width: "100%", accentColor: "#5b2be0" }}
        />
      </div>

      <div style={secao}>
        <div style={tamanhoTopo}>
          <span style={{ ...label, marginBottom: 0 }}>Largura do nó</span>
          <span style={valorChip}>{no.tamanho?.w ? `${no.tamanho.w}px` : "auto"}</span>
        </div>
        <input
          type="range"
          min={120}
          max={600}
          value={no.tamanho?.w ?? 200}
          onChange={(ev) => atualizarNo(no.id, { tamanho: { w: Number(ev.target.value), h: no.tamanho?.h ?? 0 } })}
          style={{ width: "100%", accentColor: "#5b2be0" }}
        />
        {no.tamanho?.w ? (
          <button onClick={() => atualizarNo(no.id, { tamanho: null })} style={btnAuto}>Voltar pra largura automática</button>
        ) : null}
      </div>

      <div style={{ height: 1, background: "#eef0f3", margin: "4px 0 14px" }} />

      <div style={secao}>
        <span style={label}>Nota</span>
        <textarea
          value={no.nota ?? ""}
          onChange={(ev) => atualizarNo(no.id, { nota: ev.target.value || null })}
          placeholder="Anotação livre…"
          rows={3}
          style={{ ...input, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      <div style={secao}>
        <span style={label}>Link</span>
        <input
          value={no.link ?? ""}
          onChange={(ev) => atualizarNo(no.id, { link: ev.target.value || null })}
          placeholder="https://…"
          style={input}
        />
      </div>

      <div style={secao}>
        <span style={label}>Imagem</span>
        {no.imagem && (
          <img src={no.imagem} alt="" style={{ width: "100%", borderRadius: 8, marginBottom: 8, display: "block" }} />
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <label style={btnArquivo}>
            {no.imagem ? "Trocar" : "Enviar imagem"}
            <input type="file" accept="image/*" onChange={onImagem} style={{ display: "none" }} />
          </label>
          {no.imagem && (
            <button onClick={() => atualizarNo(no.id, { imagem: null })} style={btnRemover}>Remover</button>
          )}
        </div>
      </div>
    </div>
  );
}

const painel: React.CSSProperties = {
  position: "absolute", top: 16, right: 16, width: 248,
  background: "rgba(255,255,255,0.96)", backdropFilter: "blur(8px)",
  border: "1px solid #e6e8ec", borderRadius: 16,
  boxShadow: "0 12px 32px rgba(20,25,40,0.16)", padding: 16, zIndex: 15,
  fontSize: 13, color: "#1f2733",
};
const cabecalho: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, marginBottom: 16 };
const bolinha: React.CSSProperties = { width: 14, height: 14, borderRadius: "50%", boxShadow: "inset 0 0 0 1px #0002" };
const titulo: React.CSSProperties = { fontSize: 14, fontWeight: 700 };
const secao: React.CSSProperties = { marginBottom: 16 };
const label: React.CSSProperties = {
  display: "block", color: "#9aa3af", marginBottom: 8,
  fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6,
};
const linha: React.CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" };
const input: React.CSSProperties = {
  width: "100%", padding: "9px 11px", border: "1px solid #e0e3e8", borderRadius: 9,
  fontSize: 13, boxSizing: "border-box", background: "#fff", outline: "none", color: "#1f2733",
};
const swatch: React.CSSProperties = {
  width: 24, height: 24, borderRadius: "50%", border: "none", cursor: "pointer", padding: 0,
  position: "relative",
};
const swatchCustom: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  background: "#f4f5f7", boxShadow: "inset 0 0 0 1px #0001", overflow: "hidden",
};
const chip: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 9, border: "1px solid #e6e8ec", background: "#f7f8fa",
  cursor: "pointer", fontSize: 15, display: "inline-flex", alignItems: "center", justifyContent: "center",
};
const chipAtivo: React.CSSProperties = { border: "1px solid #5b2be0", background: "#efeaff", boxShadow: "0 0 0 2px #5b2be022" };
const toggle: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 9, border: "1px solid #e6e8ec", background: "#f7f8fa",
  cursor: "pointer", fontSize: 14, color: "#1f2733",
  display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
};
const toggleAtivo: React.CSSProperties = { border: "1px solid #5b2be0", background: "#5b2be0", color: "#fff" };
const tamanhoTopo: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 };
const valorChip: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "#5b2be0", background: "#efeaff",
  borderRadius: 6, padding: "2px 7px",
};
const btnArquivo: React.CSSProperties = {
  flex: 1, textAlign: "center", background: "#f1eefe", color: "#5b2be0",
  border: "1px solid #ddd4fb", borderRadius: 8, padding: "8px 10px",
  cursor: "pointer", fontSize: 13, fontWeight: 600,
};
const btnRemover: React.CSSProperties = {
  background: "transparent", color: "#d6336c", border: "1px solid #f1c4c4",
  borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 13,
};
const btnAuto: React.CSSProperties = {
  marginTop: 8, width: "100%", background: "transparent", color: "#5b6472",
  border: "1px solid #e0e3e8", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 12.5,
};
