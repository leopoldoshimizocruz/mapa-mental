import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

function baixar(url: string, nome: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
}

/** Captura o `.react-flow__viewport` como PNG e baixa. */
export async function exportarPng(titulo: string): Promise<void> {
  const alvo = document.querySelector<HTMLElement>(".react-flow__viewport");
  if (!alvo) throw new Error("Viewport não encontrado");
  const dataUrl = await toPng(alvo, { backgroundColor: "#ffffff", pixelRatio: 2 });
  baixar(dataUrl, `${titulo}.png`);
}

/** Gera um PDF com a imagem do mapa numa página landscape. */
export async function exportarPdf(titulo: string): Promise<void> {
  const alvo = document.querySelector<HTMLElement>(".react-flow__viewport");
  if (!alvo) throw new Error("Viewport não encontrado");
  const dataUrl = await toPng(alvo, { backgroundColor: "#ffffff", pixelRatio: 2 });
  const img = new Image();
  img.src = dataUrl;
  await new Promise((r) => (img.onload = r));
  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [img.width, img.height] });
  pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
  pdf.save(`${titulo}.pdf`);
}

/** Baixa um conteúdo de texto como arquivo .txt. */
export function baixarTxt(titulo: string, conteudo: string): void {
  const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  baixar(url, `${titulo}.txt`);
  URL.revokeObjectURL(url);
}

/** Baixa um objeto como arquivo .json (backup do mapa). */
export function baixarJson(titulo: string, dados: unknown): void {
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  baixar(url, `${titulo}.json`);
  URL.revokeObjectURL(url);
}
