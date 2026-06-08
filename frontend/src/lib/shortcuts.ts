import { useEffect } from "react";

export type Acao =
  | "filho" | "irmao" | "apagar" | "undo" | "redo"
  | "copiar" | "colar" | "duplicar" | "salvar";

/** Traduz um evento de teclado numa ação do editor (ou null). */
export function resolverAcao(e: KeyboardEvent): Acao | null {
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && e.key.toLowerCase() === "z") return e.shiftKey ? "redo" : "undo";
  if (ctrl && e.key.toLowerCase() === "y") return "redo";
  if (ctrl && e.key.toLowerCase() === "c") return "copiar";
  if (ctrl && e.key.toLowerCase() === "v") return "colar";
  if (ctrl && e.key.toLowerCase() === "d") return "duplicar";
  if (ctrl && e.key.toLowerCase() === "s") return "salvar";
  if (ctrl) return null;
  if (e.key === "Tab") return "filho";
  if (e.key === "Delete" || e.key === "Backspace") return "apagar";
  return null;
}

/** Liga os atalhos de teclado a um despachante de ações. */
export function useShortcuts(despachar: (acao: Acao) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      if (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.isContentEditable) return;
      const acao = resolverAcao(e);
      if (acao) {
        e.preventDefault();
        despachar(acao);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [despachar]);
}
