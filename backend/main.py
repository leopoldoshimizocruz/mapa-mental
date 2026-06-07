import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

import storage
from models import Mapa

app = FastAPI(title="Mapa Mental")

DATA_DIR = Path(os.environ.get("MAPA_DATA_DIR", Path(__file__).resolve().parents[1] / "data"))
store = storage.Storage(base_dir=DATA_DIR)


class CriarMapaBody(BaseModel):
    titulo: str = "Novo mapa"


class RenomearBody(BaseModel):
    titulo: str


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/maps")
def listar():
    return store.listar()


@app.post("/api/maps")
def criar(body: CriarMapaBody) -> Mapa:
    return store.criar(titulo=body.titulo)


@app.get("/api/maps/{map_id}")
def carregar(map_id: str) -> Mapa:
    try:
        return store.carregar(map_id)
    except storage.MapaNaoEncontrado:
        raise HTTPException(status_code=404, detail="Mapa não encontrado")


@app.put("/api/maps/{map_id}")
def salvar(map_id: str, mapa: Mapa) -> Mapa:
    if mapa.id != map_id:
        raise HTTPException(status_code=400, detail="id do corpo difere da URL")
    return store.salvar(mapa)


@app.patch("/api/maps/{map_id}")
def renomear(map_id: str, body: RenomearBody) -> Mapa:
    try:
        return store.renomear(map_id, body.titulo)
    except storage.MapaNaoEncontrado:
        raise HTTPException(status_code=404, detail="Mapa não encontrado")


@app.delete("/api/maps/{map_id}")
def apagar(map_id: str) -> dict:
    try:
        store.apagar(map_id)
    except storage.MapaNaoEncontrado:
        raise HTTPException(status_code=404, detail="Mapa não encontrado")
    return {"ok": True}
