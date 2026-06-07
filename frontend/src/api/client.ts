import type { Mapa, MapaResumo } from "../types";

async function json<T>(resp: Response): Promise<T> {
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json() as Promise<T>;
}

export const api = {
  listar: () => fetch("/api/maps").then(json<MapaResumo[]>),
  criar: (titulo: string) =>
    fetch("/api/maps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo }),
    }).then(json<Mapa>),
  carregar: (id: string) => fetch(`/api/maps/${id}`).then(json<Mapa>),
  salvar: (mapa: Mapa) =>
    fetch(`/api/maps/${mapa.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mapa),
    }).then(json<Mapa>),
  renomear: (id: string, titulo: string) =>
    fetch(`/api/maps/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo }),
    }).then(json<Mapa>),
  apagar: (id: string) => fetch(`/api/maps/${id}`, { method: "DELETE" }).then(json),
};
