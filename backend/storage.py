import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from models import Mapa, MapaResumo

MAX_BACKUPS = 10


class MapaNaoEncontrado(Exception):
    """Levantada quando o mapa pedido não existe em disco."""


def _agora() -> str:
    return datetime.now(timezone.utc).isoformat()


class Storage:
    """Persistência de mapas em arquivos .json com escrita atômica e backups."""

    def __init__(self, base_dir: Path):
        self.base_dir = Path(base_dir)
        self.maps_dir = self.base_dir / "maps"
        self.backups_dir = self.base_dir / "maps" / ".backups"
        self.maps_dir.mkdir(parents=True, exist_ok=True)
        self.backups_dir.mkdir(parents=True, exist_ok=True)

    def _caminho(self, map_id: str) -> Path:
        return self.maps_dir / f"{map_id}.json"

    def criar(self, titulo: str) -> Mapa:
        map_id = uuid.uuid4().hex[:12]
        raiz_id = uuid.uuid4().hex[:12]
        mapa = Mapa(
            id=map_id,
            titulo=titulo,
            criadoEm=_agora(),
            atualizadoEm=_agora(),
            nos=[{"id": raiz_id, "paiId": None, "texto": titulo}],
        )
        self._escrever(mapa)
        return mapa

    def listar(self) -> list[MapaResumo]:
        resumos: list[MapaResumo] = []
        for arq in self.maps_dir.glob("*.json"):
            data = json.loads(arq.read_text(encoding="utf-8"))
            resumos.append(
                MapaResumo(
                    id=data["id"],
                    titulo=data.get("titulo", ""),
                    criadoEm=data.get("criadoEm"),
                    atualizadoEm=data.get("atualizadoEm"),
                )
            )
        resumos.sort(key=lambda r: r.atualizadoEm or "", reverse=True)
        return resumos

    def carregar(self, map_id: str) -> Mapa:
        caminho = self._caminho(map_id)
        if not caminho.exists():
            raise MapaNaoEncontrado(map_id)
        return Mapa.model_validate_json(caminho.read_text(encoding="utf-8"))

    def salvar(self, mapa: Mapa) -> Mapa:
        caminho = self._caminho(mapa.id)
        if caminho.exists():
            self._backup(mapa.id, caminho)
        mapa.atualizadoEm = _agora()
        self._escrever(mapa)
        return mapa

    def renomear(self, map_id: str, titulo: str) -> Mapa:
        mapa = self.carregar(map_id)
        mapa.titulo = titulo
        return self.salvar(mapa)

    def apagar(self, map_id: str) -> None:
        caminho = self._caminho(map_id)
        if not caminho.exists():
            raise MapaNaoEncontrado(map_id)
        caminho.unlink()

    def listar_backups(self, map_id: str) -> list[Path]:
        pasta = self.backups_dir / map_id
        if not pasta.exists():
            return []
        return sorted(pasta.glob("*.json"))

    def _escrever(self, mapa: Mapa) -> None:
        caminho = self._caminho(mapa.id)
        tmp = caminho.with_suffix(".tmp")
        tmp.write_text(
            json.dumps(mapa.model_dump(), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        os.replace(tmp, caminho)

    def _backup(self, map_id: str, caminho: Path) -> None:
        pasta = self.backups_dir / map_id
        pasta.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%f")
        (pasta / f"{stamp}.json").write_text(
            caminho.read_text(encoding="utf-8"), encoding="utf-8"
        )
        backups = sorted(pasta.glob("*.json"))
        for antigo in backups[:-MAX_BACKUPS]:
            antigo.unlink()
