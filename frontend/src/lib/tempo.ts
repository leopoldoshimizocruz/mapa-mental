/** Tempo relativo em PT-BR a partir de uma data ISO (ex: "há 2 dias"). */
export function tempoRelativo(iso: string | null, agora: Date = new Date()): string {
  if (!iso) return "";
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const seg = Math.floor((agora.getTime() - ts) / 1000);
  if (seg < 60) return "agora mesmo";
  const min = Math.floor(seg / 60);
  if (min < 60) return `há ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `há ${meses} ${meses === 1 ? "mês" : "meses"}`;
  const anos = Math.floor(meses / 12);
  return `há ${anos} ${anos === 1 ? "ano" : "anos"}`;
}
