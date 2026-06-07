# Mapa Mental, Fase 1 (MVP núcleo), Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar um app web local de mapa mental usável de ponta a ponta: criar/abrir/salvar mapas em disco, editar a hierarquia no canvas (estilo Sólido moderno), auto-layout radial, recolher ramos, personalização básica (cor, emoji, fonte, tamanho), zoom/pan/minimapa, undo/redo e exportar PNG/PDF/TXT.

**Architecture:** Frontend React + TypeScript (Vite) usando React Flow (xyflow) como motor de canvas e elkjs para auto-layout, estado em Zustand com undo/redo (zundo). Backend FastAPI (Python 3.12) persiste cada mapa como arquivo `.json` em `data/maps/` com escrita atômica e backups; em modo normal o backend também serve o frontend buildado, então um único `uvicorn` serve tudo em `localhost:8000`.

**Tech Stack:** Python 3.12, FastAPI, Pydantic v2, uvicorn, pytest. React 18, TypeScript, Vite, @xyflow/react, elkjs, zustand + zundo, html-to-image, jsPDF, vitest, @testing-library/react.

---

## File Structure

```
mapa-mental/
  backend/
    main.py                # app FastAPI: registra rotas e (modo normal) serve o frontend
    models.py              # schemas Pydantic do mapa
    storage.py             # CRUD em disco: escrita atômica + backups
    requirements.txt
    tests/
      conftest.py
      test_storage.py
      test_api.py
  frontend/
    index.html
    package.json
    tsconfig.json
    vite.config.ts
    vitest.config.ts
    src/
      main.tsx             # bootstrap React
      App.tsx              # roteia entre Biblioteca e Editor
      types.ts             # tipos do domínio (Mapa, No, Ligacao, ...)
      api/client.ts        # chamadas REST ao backend
      state/store.ts       # store Zustand + ações + undo/redo
      state/store.test.ts
      lib/layout/elk.ts    # integração elkjs (hierarquia -> posições)
      lib/layout/elk.test.ts
      lib/export/txt.ts    # serializa mapa -> outline indentado
      lib/export/txt.test.ts
      lib/export/image.ts  # exporta PNG e PDF a partir do canvas
      lib/ids.ts           # gerador de ids
      lib/shortcuts.ts     # mapa de atalhos de teclado (hook)
      panels/Library.tsx   # tela de biblioteca de mapas
      panels/TopBar.tsx    # barra superior: título, undo/redo, export, voltar
      panels/CreationToolbar.tsx  # barra vertical à esquerda
      panels/Inspector.tsx # inspector flutuante de personalização
      canvas/Editor.tsx    # shell do editor: ReactFlow + painéis
      canvas/MindNode.tsx  # componente de nó customizado (estilo Sólido)
      canvas/useSyncFlow.ts# sincroniza store <-> React Flow + aplica layout
  data/
    maps/.gitkeep
    assets/.gitkeep
  README.md
```

Princípio de decomposição: lógica pura (store, layout, export TXT) fica isolada e 100% testável por unidade; componentes React consomem essa lógica. Cada arquivo tem uma responsabilidade só.

---

## Task 0: Scaffold do projeto (backend + frontend)

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/main.py`
- Create: `backend/tests/conftest.py`
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `data/maps/.gitkeep`, `data/assets/.gitkeep`

- [ ] **Step 1: Criar `backend/requirements.txt`**

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
pydantic==2.9.2
pytest==8.3.3
httpx==0.27.2
```

- [ ] **Step 2: Criar `backend/main.py` mínimo (healthcheck)**

```python
from fastapi import FastAPI

app = FastAPI(title="Mapa Mental")


@app.get("/api/health")
def health() -> dict:
    """Healthcheck simples para verificar que o servidor está no ar."""
    return {"status": "ok"}
```

- [ ] **Step 3: Criar `backend/tests/conftest.py`**

```python
import sys
from pathlib import Path

# Garante que `import main`, `import storage` etc. funcionem nos testes.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
```

- [ ] **Step 4: Criar a venv e instalar deps**

Run (na pasta `mapa-mental/backend`):
```
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
```
Expected: instala sem erro.

- [ ] **Step 5: Rodar o servidor e validar o health**

Run: `.venv\Scripts\python.exe -m uvicorn main:app --port 8000`
Em outro terminal: `curl http://localhost:8000/api/health`
Expected: `{"status":"ok"}`

- [ ] **Step 6: Scaffold do frontend com Vite**

Run (na pasta `mapa-mental`):
```
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install @xyflow/react elkjs zustand zundo html-to-image jspdf
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
```
Expected: cria `frontend/` e instala deps.

- [ ] **Step 7: Criar `frontend/vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
  },
});
```

- [ ] **Step 8: Criar `frontend/src/setupTests.ts`**

```typescript
import "@testing-library/jest-dom";
```

- [ ] **Step 9: Configurar proxy do Vite para o backend em dev**

Substituir `frontend/vite.config.ts` por:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
  build: {
    outDir: "dist",
  },
});
```

- [ ] **Step 10: App.tsx placeholder**

Substituir `frontend/src/App.tsx` por:
```tsx
export default function App() {
  return <div>Mapa Mental, em construção</div>;
}
```

- [ ] **Step 11: Rodar o frontend em dev**

Run: `npm run dev` (em `frontend/`)
Expected: abre em `http://localhost:5173` mostrando "Mapa Mental, em construção".

- [ ] **Step 12: Commit**

```bash
git add backend frontend data
git commit -m "chore: scaffold backend FastAPI e frontend Vite React"
```

---

## Task 1: Modelos de dados do backend (Pydantic)

**Files:**
- Create: `backend/models.py`
- Test: `backend/tests/test_models.py`

- [ ] **Step 1: Escrever o teste que falha**

`backend/tests/test_models.py`:
```python
from models import Mapa, No


def test_mapa_minimo_valida_e_serializa():
    mapa = Mapa(id="m1", titulo="Teste", config={})
    data = mapa.model_dump()
    assert data["id"] == "m1"
    assert data["nos"] == []
    assert data["ligacoes"] == []


def test_no_aceita_campos_de_estilo():
    no = No(id="n1", paiId=None, texto="Central", cor="#5b2be0")
    assert no.paiId is None
    assert no.estilo.formato == "retangulo-arredondado"
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `.venv\Scripts\python.exe -m pytest tests/test_models.py -v`
Expected: FAIL com `ModuleNotFoundError: No module named 'models'`.

- [ ] **Step 3: Implementar `backend/models.py`**

```python
from typing import Literal, Optional

from pydantic import BaseModel, Field


class Posicao(BaseModel):
    x: float
    y: float


class Tamanho(BaseModel):
    w: float
    h: float


class EstiloNo(BaseModel):
    fonte: str = "Inter"
    tamanho: int = 16
    negrito: bool = False
    italico: bool = False
    sublinhado: bool = False
    corTexto: str = "#ffffff"
    alinhamento: Literal["esquerda", "centro", "direita"] = "centro"
    formato: Literal[
        "retangulo-arredondado", "pilula", "elipse", "retangulo"
    ] = "retangulo-arredondado"
    corBorda: Optional[str] = None
    larguraBorda: int = 0


class No(BaseModel):
    id: str
    paiId: Optional[str] = None
    texto: str = ""
    nota: Optional[str] = None
    link: Optional[str] = None
    imagem: Optional[str] = None
    cor: str = "#5b2be0"
    emoji: Optional[str] = None
    recolhido: bool = False
    posicao: Optional[Posicao] = None
    tamanho: Optional[Tamanho] = None
    estilo: EstiloNo = Field(default_factory=EstiloNo)


class Ligacao(BaseModel):
    id: str
    origem: str
    destino: str
    tipo: Literal["hierarquia", "relacao"] = "hierarquia"
    rotulo: Optional[str] = None
    estilo: dict = Field(default_factory=dict)


class Contorno(BaseModel):
    id: str
    nosIds: list[str] = Field(default_factory=list)
    cor: str = "#e9c46a"
    rotulo: Optional[str] = None


class ElementoLivre(BaseModel):
    id: str
    tipo: Literal["sticky", "forma", "texto", "seta", "desenho"]
    posicao: Posicao
    tamanho: Tamanho
    conteudo: Optional[str] = None
    estilo: dict = Field(default_factory=dict)
    pontos: Optional[list[Posicao]] = None


class ConfigMapa(BaseModel):
    layout: Literal["radial", "organograma", "arvore"] = "radial"
    tema: Literal["claro", "escuro"] = "claro"
    corFundo: str = "#f4f5f7"
    padraoFundo: Literal["pontos", "linhas", "nenhum"] = "pontos"
    fontePadrao: str = "Inter"
    paletaPadrao: list[str] = Field(default_factory=list)


class Mapa(BaseModel):
    id: str
    titulo: str
    criadoEm: Optional[str] = None
    atualizadoEm: Optional[str] = None
    config: ConfigMapa = Field(default_factory=ConfigMapa)
    nos: list[No] = Field(default_factory=list)
    ligacoes: list[Ligacao] = Field(default_factory=list)
    contornos: list[Contorno] = Field(default_factory=list)
    elementosLivres: list[ElementoLivre] = Field(default_factory=list)


class MapaResumo(BaseModel):
    """Item da listagem da biblioteca (sem o corpo do mapa)."""

    id: str
    titulo: str
    atualizadoEm: Optional[str] = None
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `.venv\Scripts\python.exe -m pytest tests/test_models.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/models.py backend/tests/test_models.py
git commit -m "feat(backend): modelos Pydantic do mapa"
```

---

## Task 2: Camada de storage (escrita atômica + backups)

**Files:**
- Create: `backend/storage.py`
- Test: `backend/tests/test_storage.py`

- [ ] **Step 1: Escrever o teste que falha**

`backend/tests/test_storage.py`:
```python
import json

import pytest

import storage
from models import Mapa


@pytest.fixture
def store(tmp_path):
    return storage.Storage(base_dir=tmp_path)


def test_criar_lista_e_carregar(store):
    mapa = store.criar(titulo="Meu Mapa")
    assert mapa.titulo == "Meu Mapa"
    assert mapa.criadoEm is not None
    resumos = store.listar()
    assert len(resumos) == 1
    assert resumos[0].id == mapa.id
    carregado = store.carregar(mapa.id)
    assert carregado.id == mapa.id


def test_salvar_sobrescreve_e_atualiza_data(store):
    mapa = store.criar(titulo="A")
    mapa.titulo = "B"
    salvo = store.salvar(mapa)
    assert salvo.titulo == "B"
    assert store.carregar(mapa.id).titulo == "B"


def test_salvar_gera_backup_da_versao_anterior(store):
    mapa = store.criar(titulo="A")
    mapa.titulo = "B"
    store.salvar(mapa)
    backups = store.listar_backups(mapa.id)
    assert len(backups) >= 1


def test_escrita_e_atomica_arquivo_temp_some(store, tmp_path):
    mapa = store.criar(titulo="A")
    store.salvar(mapa)
    restos = list((tmp_path / "maps").glob("*.tmp"))
    assert restos == []


def test_carregar_inexistente_levanta(store):
    with pytest.raises(storage.MapaNaoEncontrado):
        store.carregar("nao-existe")


def test_apagar_remove_arquivo(store):
    mapa = store.criar(titulo="A")
    store.apagar(mapa.id)
    with pytest.raises(storage.MapaNaoEncontrado):
        store.carregar(mapa.id)


def test_renomear_altera_titulo_sem_carregar_corpo(store):
    mapa = store.criar(titulo="Antigo")
    store.renomear(mapa.id, "Novo")
    assert store.carregar(mapa.id).titulo == "Novo"
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `.venv\Scripts\python.exe -m pytest tests/test_storage.py -v`
Expected: FAIL com `ModuleNotFoundError: No module named 'storage'`.

- [ ] **Step 3: Implementar `backend/storage.py`**

```python
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
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `.venv\Scripts\python.exe -m pytest tests/test_storage.py -v`
Expected: PASS (todos).

- [ ] **Step 5: Commit**

```bash
git add backend/storage.py backend/tests/test_storage.py
git commit -m "feat(backend): storage com escrita atomica e backups"
```

---

## Task 3: Endpoints REST do backend

**Files:**
- Modify: `backend/main.py`
- Test: `backend/tests/test_api.py`

- [ ] **Step 1: Escrever o teste que falha**

`backend/tests/test_api.py`:
```python
import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("MAPA_DATA_DIR", str(tmp_path))
    import importlib

    import main

    importlib.reload(main)
    return TestClient(main.app)


def test_fluxo_crud(client):
    # cria
    r = client.post("/api/maps", json={"titulo": "Novo"})
    assert r.status_code == 200
    map_id = r.json()["id"]
    assert len(r.json()["nos"]) == 1  # nó central

    # lista
    r = client.get("/api/maps")
    assert r.status_code == 200
    assert any(m["id"] == map_id for m in r.json())

    # carrega
    r = client.get(f"/api/maps/{map_id}")
    assert r.status_code == 200

    # salva
    corpo = r.json()
    corpo["titulo"] = "Editado"
    r = client.put(f"/api/maps/{map_id}", json=corpo)
    assert r.status_code == 200
    assert client.get(f"/api/maps/{map_id}").json()["titulo"] == "Editado"

    # renomeia
    r = client.patch(f"/api/maps/{map_id}", json={"titulo": "Renomeado"})
    assert r.status_code == 200
    assert client.get(f"/api/maps/{map_id}").json()["titulo"] == "Renomeado"

    # apaga
    assert client.delete(f"/api/maps/{map_id}").status_code == 200
    assert client.get(f"/api/maps/{map_id}").status_code == 404


def test_carregar_inexistente_404(client):
    assert client.get("/api/maps/xxx").status_code == 404
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `.venv\Scripts\python.exe -m pytest tests/test_api.py -v`
Expected: FAIL (rotas ainda não existem, 404/405).

- [ ] **Step 3: Implementar as rotas em `backend/main.py`**

Substituir o conteúdo de `backend/main.py` por:
```python
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
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `.venv\Scripts\python.exe -m pytest tests/test_api.py -v`
Expected: PASS.

- [ ] **Step 5: Rodar a suíte inteira**

Run: `.venv\Scripts\python.exe -m pytest -v`
Expected: todos PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/main.py backend/tests/test_api.py
git commit -m "feat(backend): endpoints REST CRUD de mapas"
```

---

## Task 4: Backend serve o frontend buildado (modo normal)

**Files:**
- Modify: `backend/main.py`

- [ ] **Step 1: Adicionar o serviço de estáticos ao fim de `backend/main.py`**

Acrescentar no final do arquivo:
```python
from fastapi.staticfiles import StaticFiles

_FRONTEND_DIST = Path(__file__).resolve().parents[1] / "frontend" / "dist"
if _FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=_FRONTEND_DIST, html=True), name="frontend")
```

- [ ] **Step 2: Buildar o frontend**

Run (em `frontend/`): `npm run build`
Expected: gera `frontend/dist/`.

- [ ] **Step 3: Validar que o backend serve a SPA**

Run (em `backend/`): `.venv\Scripts\python.exe -m uvicorn main:app --port 8000`
Abrir `http://localhost:8000` no navegador.
Expected: carrega o app React (a tela placeholder).

- [ ] **Step 4: Rodar a suíte do backend de novo (garantir que o mount não quebrou testes)**

Run: `.venv\Scripts\python.exe -m pytest -v`
Expected: todos PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/main.py
git commit -m "feat(backend): serve frontend buildado em modo normal"
```

---

## Task 5: Tipos do domínio no frontend

**Files:**
- Create: `frontend/src/types.ts`
- Create: `frontend/src/lib/ids.ts`

- [ ] **Step 1: Criar `frontend/src/lib/ids.ts`**

```typescript
export function novoId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}
```

- [ ] **Step 2: Criar `frontend/src/types.ts`**

```typescript
export type Layout = "radial" | "organograma" | "arvore";
export type Formato = "retangulo-arredondado" | "pilula" | "elipse" | "retangulo";
export type Alinhamento = "esquerda" | "centro" | "direita";

export interface EstiloNo {
  fonte: string;
  tamanho: number;
  negrito: boolean;
  italico: boolean;
  sublinhado: boolean;
  corTexto: string;
  alinhamento: Alinhamento;
  formato: Formato;
  corBorda: string | null;
  larguraBorda: number;
}

export interface No {
  id: string;
  paiId: string | null;
  texto: string;
  nota: string | null;
  link: string | null;
  imagem: string | null;
  cor: string;
  emoji: string | null;
  recolhido: boolean;
  posicao: { x: number; y: number } | null;
  tamanho: { w: number; h: number } | null;
  estilo: EstiloNo;
}

export interface Ligacao {
  id: string;
  origem: string;
  destino: string;
  tipo: "hierarquia" | "relacao";
  rotulo: string | null;
  estilo: Record<string, unknown>;
}

export interface ConfigMapa {
  layout: Layout;
  tema: "claro" | "escuro";
  corFundo: string;
  padraoFundo: "pontos" | "linhas" | "nenhum";
  fontePadrao: string;
  paletaPadrao: string[];
}

export interface Mapa {
  id: string;
  titulo: string;
  criadoEm: string | null;
  atualizadoEm: string | null;
  config: ConfigMapa;
  nos: No[];
  ligacoes: Ligacao[];
  contornos: unknown[];
  elementosLivres: unknown[];
}

export interface MapaResumo {
  id: string;
  titulo: string;
  atualizadoEm: string | null;
}

export const ESTILO_PADRAO: EstiloNo = {
  fonte: "Inter",
  tamanho: 16,
  negrito: false,
  italico: false,
  sublinhado: false,
  corTexto: "#ffffff",
  alinhamento: "centro",
  formato: "retangulo-arredondado",
  corBorda: null,
  larguraBorda: 0,
};

export const PALETA: string[] = [
  "#5b2be0", "#3b5bdb", "#2a9d8f", "#e76f51",
  "#e9c46a", "#d6336c", "#0ca678", "#f08c00",
];
```

- [ ] **Step 3: Verificar typecheck**

Run (em `frontend/`): `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types.ts frontend/src/lib/ids.ts
git commit -m "feat(frontend): tipos do dominio e gerador de ids"
```

---

## Task 6: Store Zustand, operações de nó

**Files:**
- Create: `frontend/src/state/store.ts`
- Test: `frontend/src/state/store.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

`frontend/src/state/store.test.ts`:
```typescript
import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "./store";
import type { Mapa } from "../types";

function mapaBase(): Mapa {
  return {
    id: "m1",
    titulo: "T",
    criadoEm: null,
    atualizadoEm: null,
    config: {
      layout: "radial", tema: "claro", corFundo: "#f4f5f7",
      padraoFundo: "pontos", fontePadrao: "Inter", paletaPadrao: [],
    },
    nos: [{
      id: "raiz", paiId: null, texto: "Central", nota: null, link: null,
      imagem: null, cor: "#5b2be0", emoji: null, recolhido: false,
      posicao: null, tamanho: null,
      estilo: {
        fonte: "Inter", tamanho: 16, negrito: false, italico: false,
        sublinhado: false, corTexto: "#fff", alinhamento: "centro",
        formato: "retangulo-arredondado", corBorda: null, larguraBorda: 0,
      },
    }],
    ligacoes: [], contornos: [], elementosLivres: [],
  };
}

describe("store, operações de nó", () => {
  beforeEach(() => useStore.getState().carregarMapa(mapaBase()));

  it("adiciona filho cria nó e ligação de hierarquia", () => {
    const filho = useStore.getState().adicionarFilho("raiz");
    const s = useStore.getState();
    expect(s.mapa!.nos.find((n) => n.id === filho)).toBeTruthy();
    expect(s.mapa!.nos.find((n) => n.id === filho)!.paiId).toBe("raiz");
    expect(s.mapa!.ligacoes.some((l) => l.origem === "raiz" && l.destino === filho)).toBe(true);
  });

  it("adiciona irmão usa o mesmo pai", () => {
    const filho = useStore.getState().adicionarFilho("raiz");
    const irmao = useStore.getState().adicionarIrmao(filho);
    expect(useStore.getState().mapa!.nos.find((n) => n.id === irmao)!.paiId).toBe("raiz");
  });

  it("atualizar texto altera o nó", () => {
    useStore.getState().atualizarNo("raiz", { texto: "Novo" });
    expect(useStore.getState().mapa!.nos.find((n) => n.id === "raiz")!.texto).toBe("Novo");
  });

  it("apagar nó remove a subárvore inteira e suas ligações", () => {
    const a = useStore.getState().adicionarFilho("raiz");
    const b = useStore.getState().adicionarFilho(a);
    useStore.getState().apagarNo(a);
    const s = useStore.getState();
    expect(s.mapa!.nos.find((n) => n.id === a)).toBeUndefined();
    expect(s.mapa!.nos.find((n) => n.id === b)).toBeUndefined();
    expect(s.mapa!.ligacoes.length).toBe(0);
  });

  it("não apaga a raiz", () => {
    useStore.getState().apagarNo("raiz");
    expect(useStore.getState().mapa!.nos.find((n) => n.id === "raiz")).toBeTruthy();
  });

  it("alternar recolhido inverte o estado", () => {
    useStore.getState().alternarRecolhido("raiz");
    expect(useStore.getState().mapa!.nos.find((n) => n.id === "raiz")!.recolhido).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run (em `frontend/`): `npx vitest run src/state/store.test.ts`
Expected: FAIL (módulo `./store` não existe).

- [ ] **Step 3: Implementar `frontend/src/state/store.ts`**

```typescript
import { create } from "zustand";
import { temporal } from "zundo";
import type { Mapa, No, Ligacao, EstiloNo } from "../types";
import { ESTILO_PADRAO } from "../types";
import { novoId } from "../lib/ids";

interface Estado {
  mapa: Mapa | null;
  selecionado: string | null;
  carregarMapa: (mapa: Mapa) => void;
  selecionar: (id: string | null) => void;
  adicionarFilho: (paiId: string) => string;
  adicionarIrmao: (irmaoId: string) => string;
  atualizarNo: (id: string, patch: Partial<No>) => void;
  atualizarEstilo: (id: string, patch: Partial<EstiloNo>) => void;
  apagarNo: (id: string) => void;
  alternarRecolhido: (id: string) => void;
  moverNo: (id: string, x: number, y: number) => void;
}

function criarNo(paiId: string | null, texto = ""): No {
  return {
    id: novoId(), paiId, texto, nota: null, link: null, imagem: null,
    cor: "#5b2be0", emoji: null, recolhido: false, posicao: null,
    tamanho: null, estilo: { ...ESTILO_PADRAO },
  };
}

function descendentes(nos: No[], raiz: string): Set<string> {
  const ids = new Set<string>([raiz]);
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const n of nos) {
      if (n.paiId && ids.has(n.paiId) && !ids.has(n.id)) {
        ids.add(n.id);
        mudou = true;
      }
    }
  }
  return ids;
}

export const useStore = create<Estado>()(
  temporal(
    (set, get) => ({
      mapa: null,
      selecionado: null,

      carregarMapa: (mapa) => set({ mapa, selecionado: mapa.nos[0]?.id ?? null }),
      selecionar: (id) => set({ selecionado: id }),

      adicionarFilho: (paiId) => {
        const no = criarNo(paiId);
        const lig: Ligacao = {
          id: novoId(), origem: paiId, destino: no.id,
          tipo: "hierarquia", rotulo: null, estilo: {},
        };
        set((st) => st.mapa ? {
          mapa: { ...st.mapa, nos: [...st.mapa.nos, no], ligacoes: [...st.mapa.ligacoes, lig] },
          selecionado: no.id,
        } : st);
        return no.id;
      },

      adicionarIrmao: (irmaoId) => {
        const mapa = get().mapa;
        const irmao = mapa?.nos.find((n) => n.id === irmaoId);
        const paiId = irmao?.paiId ?? null;
        if (!paiId) return get().adicionarFilho(irmaoId);
        return get().adicionarFilho(paiId);
      },

      atualizarNo: (id, patch) => set((st) => st.mapa ? {
        mapa: { ...st.mapa, nos: st.mapa.nos.map((n) => n.id === id ? { ...n, ...patch } : n) },
      } : st),

      atualizarEstilo: (id, patch) => set((st) => st.mapa ? {
        mapa: { ...st.mapa, nos: st.mapa.nos.map((n) => n.id === id ? { ...n, estilo: { ...n.estilo, ...patch } } : n) },
      } : st),

      apagarNo: (id) => set((st) => {
        if (!st.mapa) return st;
        const no = st.mapa.nos.find((n) => n.id === id);
        if (!no || no.paiId === null) return st; // não apaga a raiz
        const remover = descendentes(st.mapa.nos, id);
        return {
          mapa: {
            ...st.mapa,
            nos: st.mapa.nos.filter((n) => !remover.has(n.id)),
            ligacoes: st.mapa.ligacoes.filter((l) => !remover.has(l.origem) && !remover.has(l.destino)),
          },
          selecionado: no.paiId,
        };
      }),

      alternarRecolhido: (id) => set((st) => st.mapa ? {
        mapa: { ...st.mapa, nos: st.mapa.nos.map((n) => n.id === id ? { ...n, recolhido: !n.recolhido } : n) },
      } : st),

      moverNo: (id, x, y) => set((st) => st.mapa ? {
        mapa: { ...st.mapa, nos: st.mapa.nos.map((n) => n.id === id ? { ...n, posicao: { x, y } } : n) },
      } : st),
    }),
    { limit: 100, partialize: (st) => ({ mapa: st.mapa }) },
  ),
);
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npx vitest run src/state/store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/state/store.ts frontend/src/state/store.test.ts
git commit -m "feat(frontend): store Zustand com operacoes de no"
```

---

## Task 7: Undo/redo

**Files:**
- Test: `frontend/src/state/undo.test.ts`

O store já usa o middleware `temporal` (zundo) na Task 6. Esta task valida e expõe helpers de undo/redo.

- [ ] **Step 1: Escrever o teste que falha**

`frontend/src/state/undo.test.ts`:
```typescript
import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "./store";
import type { Mapa } from "../types";

function mapaBase(): Mapa {
  return {
    id: "m1", titulo: "T", criadoEm: null, atualizadoEm: null,
    config: { layout: "radial", tema: "claro", corFundo: "#f4f5f7", padraoFundo: "pontos", fontePadrao: "Inter", paletaPadrao: [] },
    nos: [{ id: "raiz", paiId: null, texto: "Central", nota: null, link: null, imagem: null, cor: "#5b2be0", emoji: null, recolhido: false, posicao: null, tamanho: null, estilo: { fonte: "Inter", tamanho: 16, negrito: false, italico: false, sublinhado: false, corTexto: "#fff", alinhamento: "centro", formato: "retangulo-arredondado", corBorda: null, larguraBorda: 0 } }],
    ligacoes: [], contornos: [], elementosLivres: [],
  };
}

describe("undo/redo", () => {
  beforeEach(() => {
    useStore.getState().carregarMapa(mapaBase());
    useStore.temporal.getState().clear();
  });

  it("desfaz a criação de um nó", () => {
    useStore.getState().adicionarFilho("raiz");
    expect(useStore.getState().mapa!.nos.length).toBe(2);
    useStore.temporal.getState().undo();
    expect(useStore.getState().mapa!.nos.length).toBe(1);
  });

  it("refaz depois de desfazer", () => {
    useStore.getState().adicionarFilho("raiz");
    useStore.temporal.getState().undo();
    useStore.temporal.getState().redo();
    expect(useStore.getState().mapa!.nos.length).toBe(2);
  });
});
```

- [ ] **Step 2: Rodar e ver passar (a infra já existe)**

Run: `npx vitest run src/state/undo.test.ts`
Expected: PASS. Se falhar, conferir que o `temporal(...)` envolve o store na Task 6.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/state/undo.test.ts
git commit -m "test(frontend): valida undo/redo via zundo"
```

---

## Task 8: Integração com elkjs (auto-layout)

**Files:**
- Create: `frontend/src/lib/layout/elk.ts`
- Test: `frontend/src/lib/layout/elk.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

`frontend/src/lib/layout/elk.test.ts`:
```typescript
import { describe, expect, it } from "vitest";
import { calcularLayout } from "./elk";
import type { No, Ligacao } from "../../types";

function no(id: string, paiId: string | null): No {
  return { id, paiId, texto: id, nota: null, link: null, imagem: null, cor: "#5b2be0", emoji: null, recolhido: false, posicao: null, tamanho: null, estilo: { fonte: "Inter", tamanho: 16, negrito: false, italico: false, sublinhado: false, corTexto: "#fff", alinhamento: "centro", formato: "retangulo-arredondado", corBorda: null, larguraBorda: 0 } };
}

describe("calcularLayout", () => {
  it("retorna uma posição para cada nó visível", async () => {
    const nos: No[] = [no("raiz", null), no("a", "raiz"), no("b", "raiz")];
    const ligacoes: Ligacao[] = [
      { id: "l1", origem: "raiz", destino: "a", tipo: "hierarquia", rotulo: null, estilo: {} },
      { id: "l2", origem: "raiz", destino: "b", tipo: "hierarquia", rotulo: null, estilo: {} },
    ];
    const pos = await calcularLayout(nos, ligacoes, "radial");
    expect(Object.keys(pos).sort()).toEqual(["a", "b", "raiz"]);
    expect(typeof pos["a"].x).toBe("number");
  });

  it("respeita posição manual fixada", async () => {
    const nos: No[] = [no("raiz", null)];
    nos[0].posicao = { x: 123, y: 456 };
    const pos = await calcularLayout(nos, [], "radial");
    expect(pos["raiz"]).toEqual({ x: 123, y: 456 });
  });

  it("omite descendentes de nó recolhido", async () => {
    const nos: No[] = [no("raiz", null), no("a", "raiz"), no("a1", "a")];
    nos[1].recolhido = true;
    const ligacoes: Ligacao[] = [
      { id: "l1", origem: "raiz", destino: "a", tipo: "hierarquia", rotulo: null, estilo: {} },
      { id: "l2", origem: "a", destino: "a1", tipo: "hierarquia", rotulo: null, estilo: {} },
    ];
    const pos = await calcularLayout(nos, ligacoes, "radial");
    expect(pos["a1"]).toBeUndefined();
    expect(pos["a"]).toBeDefined();
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npx vitest run src/lib/layout/elk.test.ts`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar `frontend/src/lib/layout/elk.ts`**

```typescript
import ELK from "elkjs/lib/elk.bundled.js";
import type { No, Ligacao, Layout } from "../../types";

const elk = new ELK();

const ALGORITMO: Record<Layout, string> = {
  radial: "org.eclipse.elk.radial",
  organograma: "org.eclipse.elk.mrtree",
  arvore: "org.eclipse.elk.layered",
};

const LARGURA = 160;
const ALTURA = 48;

export type Posicoes = Record<string, { x: number; y: number }>;

/** Calcula a posição de cada nó visível conforme o layout escolhido. */
export async function calcularLayout(
  nos: No[],
  ligacoes: Ligacao[],
  layout: Layout,
): Promise<Posicoes> {
  const ocultos = idsOcultos(nos, ligacoes);
  const visiveis = nos.filter((n) => !ocultos.has(n.id));

  const posicoes: Posicoes = {};
  const automaticos = visiveis.filter((n) => {
    if (n.posicao) {
      posicoes[n.id] = { x: n.posicao.x, y: n.posicao.y };
      return false;
    }
    return true;
  });

  if (automaticos.length === 0) return posicoes;

  const visiveisIds = new Set(visiveis.map((n) => n.id));
  const grafo = {
    id: "root",
    layoutOptions: { "elk.algorithm": ALGORITMO[layout] },
    children: automaticos.map((n) => ({ id: n.id, width: LARGURA, height: ALTURA })),
    edges: ligacoes
      .filter(
        (l) =>
          l.tipo === "hierarquia" &&
          visiveisIds.has(l.origem) &&
          visiveisIds.has(l.destino) &&
          !posicoes[l.origem] &&
          !posicoes[l.destino],
      )
      .map((l) => ({ id: l.id, sources: [l.origem], targets: [l.destino] })),
  };

  const resultado = await elk.layout(grafo);
  for (const filho of resultado.children ?? []) {
    posicoes[filho.id] = { x: filho.x ?? 0, y: filho.y ?? 0 };
  }
  return posicoes;
}

/** IDs de nós que descendem de algum nó recolhido (não devem ser desenhados). */
function idsOcultos(nos: No[], _ligacoes: Ligacao[]): Set<string> {
  const porId = new Map(nos.map((n) => [n.id, n]));
  const ocultos = new Set<string>();
  for (const n of nos) {
    let p = n.paiId ? porId.get(n.paiId) : undefined;
    while (p) {
      if (p.recolhido) {
        ocultos.add(n.id);
        break;
      }
      p = p.paiId ? porId.get(p.paiId) : undefined;
    }
  }
  return ocultos;
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npx vitest run src/lib/layout/elk.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/layout/elk.ts frontend/src/lib/layout/elk.test.ts
git commit -m "feat(frontend): auto-layout com elkjs"
```

---

## Task 9: Exportar TXT (outline indentado)

**Files:**
- Create: `frontend/src/lib/export/txt.ts`
- Test: `frontend/src/lib/export/txt.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

`frontend/src/lib/export/txt.test.ts`:
```typescript
import { describe, expect, it } from "vitest";
import { mapaParaTxt } from "./txt";
import type { Mapa, No } from "../../types";

function no(id: string, paiId: string | null, texto: string): No {
  return { id, paiId, texto, nota: null, link: null, imagem: null, cor: "#5b2be0", emoji: null, recolhido: false, posicao: null, tamanho: null, estilo: { fonte: "Inter", tamanho: 16, negrito: false, italico: false, sublinhado: false, corTexto: "#fff", alinhamento: "centro", formato: "retangulo-arredondado", corBorda: null, larguraBorda: 0 } };
}

function mapa(nos: No[]): Mapa {
  return { id: "m", titulo: "T", criadoEm: null, atualizadoEm: null, config: { layout: "radial", tema: "claro", corFundo: "#fff", padraoFundo: "pontos", fontePadrao: "Inter", paletaPadrao: [] }, nos, ligacoes: [], contornos: [], elementosLivres: [] };
}

describe("mapaParaTxt", () => {
  it("gera outline indentado em profundidade", () => {
    const txt = mapaParaTxt(mapa([
      no("raiz", null, "Central"),
      no("a", "raiz", "Ramo A"),
      no("a1", "a", "Folha A1"),
      no("b", "raiz", "Ramo B"),
    ]));
    expect(txt).toBe(
      ["Central", "  Ramo A", "    Folha A1", "  Ramo B"].join("\n"),
    );
  });

  it("inclui emoji quando presente", () => {
    const nos = [no("raiz", null, "Central")];
    nos[0].emoji = "📌";
    expect(mapaParaTxt(mapa(nos))).toBe("📌 Central");
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npx vitest run src/lib/export/txt.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `frontend/src/lib/export/txt.ts`**

```typescript
import type { Mapa, No } from "../../types";

/** Converte o mapa num outline de texto indentado (2 espaços por nível). */
export function mapaParaTxt(mapa: Mapa): string {
  const filhos = new Map<string | null, No[]>();
  for (const n of mapa.nos) {
    const lista = filhos.get(n.paiId) ?? [];
    lista.push(n);
    filhos.set(n.paiId, lista);
  }

  const linhas: string[] = [];
  const visitar = (no: No, nivel: number) => {
    const rotulo = no.emoji ? `${no.emoji} ${no.texto}` : no.texto;
    linhas.push("  ".repeat(nivel) + rotulo);
    for (const filho of filhos.get(no.id) ?? []) visitar(filho, nivel + 1);
  };

  for (const raiz of filhos.get(null) ?? []) visitar(raiz, 0);
  return linhas.join("\n");
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npx vitest run src/lib/export/txt.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/export/txt.ts frontend/src/lib/export/txt.test.ts
git commit -m "feat(frontend): exportar mapa como TXT outline"
```

---

## Task 10: Cliente REST do frontend

**Files:**
- Create: `frontend/src/api/client.ts`

- [ ] **Step 1: Implementar `frontend/src/api/client.ts`**

```typescript
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api/client.ts
git commit -m "feat(frontend): cliente REST do backend"
```

---

## Task 11: Tela de biblioteca de mapas

**Files:**
- Create: `frontend/src/panels/Library.tsx`
- Test: `frontend/src/panels/Library.test.tsx`

- [ ] **Step 1: Escrever o teste que falha**

`frontend/src/panels/Library.test.tsx`:
```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Library } from "./Library";
import { api } from "../api/client";

vi.mock("../api/client", () => ({
  api: {
    listar: vi.fn(),
    criar: vi.fn(),
    apagar: vi.fn(),
    renomear: vi.fn(),
  },
}));

describe("Library", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista os mapas vindos da API", async () => {
    (api.listar as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "m1", titulo: "Plano de Marketing", atualizadoEm: null },
    ]);
    render(<Library onAbrir={() => {}} />);
    await waitFor(() => expect(screen.getByText("Plano de Marketing")).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npx vitest run src/panels/Library.test.tsx`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar `frontend/src/panels/Library.tsx`**

```tsx
import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { MapaResumo } from "../types";

export function Library({ onAbrir }: { onAbrir: (id: string) => void }) {
  const [mapas, setMapas] = useState<MapaResumo[]>([]);

  const recarregar = () => api.listar().then(setMapas);
  useEffect(() => {
    recarregar();
  }, []);

  const criar = async () => {
    const mapa = await api.criar("Novo mapa");
    onAbrir(mapa.id);
  };

  const apagar = async (id: string) => {
    if (!confirm("Apagar este mapa?")) return;
    await api.apagar(id);
    recarregar();
  };

  const renomear = async (id: string, atual: string) => {
    const titulo = prompt("Novo título:", atual);
    if (!titulo) return;
    await api.renomear(id, titulo);
    recarregar();
  };

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "Inter, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ color: "#1f2733" }}>Meus mapas</h1>
        <button onClick={criar} style={btnPrimario}>＋ Novo mapa</button>
      </header>
      <ul style={{ listStyle: "none", padding: 0, marginTop: 24 }}>
        {mapas.map((m) => (
          <li key={m.id} style={item}>
            <button onClick={() => onAbrir(m.id)} style={{ ...linkTitulo }}>{m.titulo}</button>
            <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button onClick={() => renomear(m.id, m.titulo)} style={btnGhost}>Renomear</button>
              <button onClick={() => apagar(m.id)} style={btnGhost}>Apagar</button>
            </span>
          </li>
        ))}
        {mapas.length === 0 && <p style={{ color: "#888" }}>Nenhum mapa ainda. Crie o primeiro.</p>}
      </ul>
    </div>
  );
}

const btnPrimario: React.CSSProperties = { background: "#5b2be0", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 600, cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "transparent", border: "1px solid #d6dae0", borderRadius: 6, padding: "6px 10px", cursor: "pointer" };
const item: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: "1px solid #e3e6ea", borderRadius: 10, marginBottom: 8 };
const linkTitulo: React.CSSProperties = { background: "none", border: "none", fontSize: 16, fontWeight: 600, color: "#1f2733", cursor: "pointer" };
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npx vitest run src/panels/Library.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/panels/Library.tsx frontend/src/panels/Library.test.tsx
git commit -m "feat(frontend): tela de biblioteca de mapas"
```

---

## Task 12: Componente de nó customizado (estilo Sólido)

**Files:**
- Create: `frontend/src/canvas/MindNode.tsx`
- Test: `frontend/src/canvas/MindNode.test.tsx`

- [ ] **Step 1: Escrever o teste que falha**

`frontend/src/canvas/MindNode.test.tsx`:
```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { MindNode } from "./MindNode";
import { ESTILO_PADRAO } from "../types";

function dados() {
  return {
    no: {
      id: "n1", paiId: null, texto: "Olá", nota: null, link: null, imagem: null,
      cor: "#2a9d8f", emoji: "📌", recolhido: false, posicao: null, tamanho: null,
      estilo: { ...ESTILO_PADRAO },
    },
    temFilhos: false,
  };
}

describe("MindNode", () => {
  it("renderiza texto e emoji", () => {
    render(
      <ReactFlowProvider>
        <MindNode id="n1" data={dados()} selected={false} />
      </ReactFlowProvider> as never,
    );
    expect(screen.getByText("Olá")).toBeInTheDocument();
    expect(screen.getByText("📌")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npx vitest run src/canvas/MindNode.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar `frontend/src/canvas/MindNode.tsx`**

```tsx
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { No } from "../types";

export interface MindNodeData {
  no: No;
  temFilhos: boolean;
  [key: string]: unknown;
}

const RAIO: Record<No["estilo"]["formato"], string> = {
  "retangulo-arredondado": "10px",
  pilula: "999px",
  elipse: "50%",
  retangulo: "0px",
};

export function MindNode({ data, selected }: NodeProps & { data: MindNodeData }) {
  const { no } = data;
  const e = no.estilo;
  const estilo: React.CSSProperties = {
    background: no.cor,
    color: e.corTexto,
    fontFamily: e.fonte,
    fontSize: e.tamanho,
    fontWeight: e.negrito ? 700 : 600,
    fontStyle: e.italico ? "italic" : "normal",
    textDecoration: e.sublinhado ? "underline" : "none",
    textAlign: e.alinhamento === "centro" ? "center" : e.alinhamento === "direita" ? "right" : "left",
    border: e.larguraBorda ? `${e.larguraBorda}px solid ${e.corBorda ?? "#0003"}` : "none",
    borderRadius: RAIO[e.formato],
    padding: "8px 16px",
    minWidth: 80,
    maxWidth: 260,
    boxShadow: selected ? "0 0 0 3px #3b5bdb88" : "0 1px 3px #0002",
    cursor: "pointer",
    userSelect: "none",
  };

  return (
    <div style={estilo}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {no.emoji && <span>{no.emoji}</span>}
        <span>{no.texto || "(vazio)"}</span>
        {no.nota && <span title="Tem nota">📝</span>}
        {no.link && <span title="Tem link">🔗</span>}
      </span>
      {data.temFilhos && no.recolhido && (
        <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.85 }}>▸</span>
      )}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npx vitest run src/canvas/MindNode.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/canvas/MindNode.tsx frontend/src/canvas/MindNode.test.tsx
git commit -m "feat(frontend): no customizado estilo solido"
```

---

## Task 13: Hook de sincronização store <-> React Flow

**Files:**
- Create: `frontend/src/canvas/useSyncFlow.ts`
- Test: `frontend/src/canvas/useSyncFlow.test.ts`

Este hook deriva os `nodes`/`edges` do React Flow a partir do mapa do store, aplicando o auto-layout e ocultando ramos recolhidos.

- [ ] **Step 1: Escrever o teste que falha (função pura de derivação)**

`frontend/src/canvas/useSyncFlow.test.ts`:
```typescript
import { describe, expect, it } from "vitest";
import { derivarFlow } from "./useSyncFlow";
import type { Mapa, No, Ligacao } from "../types";
import { ESTILO_PADRAO } from "../types";

function no(id: string, paiId: string | null, recolhido = false): No {
  return { id, paiId, texto: id, nota: null, link: null, imagem: null, cor: "#5b2be0", emoji: null, recolhido, posicao: null, tamanho: null, estilo: { ...ESTILO_PADRAO } };
}

function mapa(nos: No[], ligacoes: Ligacao[]): Mapa {
  return { id: "m", titulo: "T", criadoEm: null, atualizadoEm: null, config: { layout: "radial", tema: "claro", corFundo: "#fff", padraoFundo: "pontos", fontePadrao: "Inter", paletaPadrao: [] }, nos, ligacoes, contornos: [], elementosLivres: [] };
}

const POS = { raiz: { x: 0, y: 0 }, a: { x: 100, y: 0 } };

describe("derivarFlow", () => {
  it("monta nodes e edges visíveis com posição", () => {
    const m = mapa(
      [no("raiz", null), no("a", "raiz")],
      [{ id: "l1", origem: "raiz", destino: "a", tipo: "hierarquia", rotulo: null, estilo: {} }],
    );
    const { nodes, edges } = derivarFlow(m, POS);
    expect(nodes.map((n) => n.id).sort()).toEqual(["a", "raiz"]);
    expect(nodes.find((n) => n.id === "a")!.position).toEqual({ x: 100, y: 0 });
    expect(edges).toHaveLength(1);
  });

  it("oculta descendentes de nó recolhido", () => {
    const m = mapa(
      [no("raiz", null), no("a", "raiz", true), no("a1", "a")],
      [
        { id: "l1", origem: "raiz", destino: "a", tipo: "hierarquia", rotulo: null, estilo: {} },
        { id: "l2", origem: "a", destino: "a1", tipo: "hierarquia", rotulo: null, estilo: {} },
      ],
    );
    const { nodes } = derivarFlow(m, { raiz: { x: 0, y: 0 }, a: { x: 100, y: 0 } });
    expect(nodes.map((n) => n.id).sort()).toEqual(["a", "raiz"]);
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npx vitest run src/canvas/useSyncFlow.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `frontend/src/canvas/useSyncFlow.ts`**

```typescript
import { useEffect, useState } from "react";
import type { Edge, Node } from "@xyflow/react";
import type { Mapa } from "../types";
import { calcularLayout, type Posicoes } from "../lib/layout/elk";
import type { MindNodeData } from "./MindNode";

/** Deriva nodes/edges do React Flow a partir do mapa e das posições calculadas. */
export function derivarFlow(
  mapa: Mapa,
  posicoes: Posicoes,
): { nodes: Node<MindNodeData>[]; edges: Edge[] } {
  const visiveis = new Set(Object.keys(posicoes));
  const temFilhos = new Set(mapa.nos.filter((n) => n.paiId).map((n) => n.paiId!));

  const nodes: Node<MindNodeData>[] = mapa.nos
    .filter((n) => visiveis.has(n.id))
    .map((n) => ({
      id: n.id,
      type: "mind",
      position: posicoes[n.id],
      data: { no: n, temFilhos: temFilhos.has(n.id) },
    }));

  const edges: Edge[] = mapa.ligacoes
    .filter((l) => visiveis.has(l.origem) && visiveis.has(l.destino))
    .map((l) => ({
      id: l.id,
      source: l.origem,
      target: l.destino,
      type: "default",
      style: { stroke: "#cfd6e0", strokeWidth: 2 },
    }));

  return { nodes, edges };
}

/** Hook que recalcula layout quando o mapa muda e devolve nodes/edges prontos. */
export function useSyncFlow(mapa: Mapa | null) {
  const [flow, setFlow] = useState<{ nodes: Node<MindNodeData>[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });

  useEffect(() => {
    if (!mapa) {
      setFlow({ nodes: [], edges: [] });
      return;
    }
    let cancelado = false;
    calcularLayout(mapa.nos, mapa.ligacoes, mapa.config.layout).then((pos) => {
      if (!cancelado) setFlow(derivarFlow(mapa, pos));
    });
    return () => {
      cancelado = true;
    };
  }, [mapa]);

  return flow;
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npx vitest run src/canvas/useSyncFlow.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/canvas/useSyncFlow.ts frontend/src/canvas/useSyncFlow.test.ts
git commit -m "feat(frontend): sincronizacao store para React Flow"
```

---

## Task 14: Atalhos de teclado

**Files:**
- Create: `frontend/src/lib/shortcuts.ts`
- Test: `frontend/src/lib/shortcuts.test.ts`

- [ ] **Step 1: Escrever o teste que falha (resolução pura de tecla -> ação)**

`frontend/src/lib/shortcuts.test.ts`:
```typescript
import { describe, expect, it } from "vitest";
import { resolverAcao } from "./shortcuts";

function ev(p: Partial<KeyboardEvent>): KeyboardEvent {
  return { key: "", ctrlKey: false, metaKey: false, shiftKey: false, ...p } as KeyboardEvent;
}

describe("resolverAcao", () => {
  it("Tab cria filho", () => expect(resolverAcao(ev({ key: "Tab" }))).toBe("filho"));
  it("Enter cria irmão", () => expect(resolverAcao(ev({ key: "Enter" }))).toBe("irmao"));
  it("Delete apaga", () => expect(resolverAcao(ev({ key: "Delete" }))).toBe("apagar"));
  it("Ctrl+Z desfaz", () => expect(resolverAcao(ev({ key: "z", ctrlKey: true }))).toBe("undo"));
  it("Ctrl+Shift+Z refaz", () => expect(resolverAcao(ev({ key: "z", ctrlKey: true, shiftKey: true }))).toBe("redo"));
  it("Ctrl+Y refaz", () => expect(resolverAcao(ev({ key: "y", ctrlKey: true }))).toBe("redo"));
  it("tecla qualquer não resolve", () => expect(resolverAcao(ev({ key: "a" }))).toBeNull());
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npx vitest run src/lib/shortcuts.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `frontend/src/lib/shortcuts.ts`**

```typescript
import { useEffect } from "react";

export type Acao = "filho" | "irmao" | "apagar" | "undo" | "redo";

/** Traduz um evento de teclado numa ação do editor (ou null). */
export function resolverAcao(e: KeyboardEvent): Acao | null {
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && e.key.toLowerCase() === "z") return e.shiftKey ? "redo" : "undo";
  if (ctrl && e.key.toLowerCase() === "y") return "redo";
  if (ctrl) return null;
  if (e.key === "Tab") return "filho";
  if (e.key === "Enter") return "irmao";
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
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npx vitest run src/lib/shortcuts.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/shortcuts.ts frontend/src/lib/shortcuts.test.ts
git commit -m "feat(frontend): atalhos de teclado do editor"
```

---

## Task 15: Exportar PNG e PDF

**Files:**
- Create: `frontend/src/lib/export/image.ts`

Funções que recebem o elemento do viewport do React Flow e geram download. Sem teste unitário (dependem de DOM/canvas real); validação manual no editor.

- [ ] **Step 1: Implementar `frontend/src/lib/export/image.ts`**

```typescript
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/export/image.ts
git commit -m "feat(frontend): exportar PNG, PDF e baixar TXT"
```

---

## Task 16: Barra superior (TopBar) com undo/redo e menu Exportar

**Files:**
- Create: `frontend/src/panels/TopBar.tsx`

- [ ] **Step 1: Implementar `frontend/src/panels/TopBar.tsx`**

```tsx
import { useState } from "react";
import { useStore } from "../state/store";
import { mapaParaTxt } from "../lib/export/txt";
import { exportarPng, exportarPdf, baixarTxt } from "../lib/export/image";

export function TopBar({ onVoltar }: { onVoltar: () => void }) {
  const mapa = useStore((s) => s.mapa);
  const [aberto, setAberto] = useState(false);
  const undo = () => useStore.temporal.getState().undo();
  const redo = () => useStore.temporal.getState().redo();
  if (!mapa) return null;

  const titulo = mapa.titulo || "mapa";
  return (
    <div style={barra}>
      <button onClick={onVoltar} style={ghost}>← Mapas</button>
      <b style={{ color: "#3b5bdb" }}>◆ {titulo}</b>
      <span style={{ color: "#ccc" }}>|</span>
      <button onClick={undo} style={ghost} title="Desfazer (Ctrl+Z)">↶</button>
      <button onClick={redo} style={ghost} title="Refazer (Ctrl+Y)">↷</button>
      <div style={{ marginLeft: "auto", position: "relative" }}>
        <button onClick={() => setAberto((v) => !v)} style={ghost}>⬇ Exportar ▾</button>
        {aberto && (
          <div style={menu} onMouseLeave={() => setAberto(false)}>
            <button style={itemMenu} onClick={() => { setAberto(false); exportarPng(titulo); }}>PNG (imagem)</button>
            <button style={itemMenu} onClick={() => { setAberto(false); exportarPdf(titulo); }}>PDF</button>
            <button style={itemMenu} onClick={() => { setAberto(false); baixarTxt(titulo, mapaParaTxt(mapa)); }}>TXT (outline)</button>
          </div>
        )}
      </div>
    </div>
  );
}

const barra: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fff", borderBottom: "1px solid #e3e6ea", fontSize: 14 };
const ghost: React.CSSProperties = { background: "transparent", border: "none", cursor: "pointer", fontSize: 14, padding: "4px 8px" };
const menu: React.CSSProperties = { position: "absolute", right: 0, top: "100%", background: "#fff", border: "1px solid #e3e6ea", borderRadius: 8, boxShadow: "0 4px 16px #0002", display: "flex", flexDirection: "column", minWidth: 160, zIndex: 20 };
const itemMenu: React.CSSProperties = { background: "none", border: "none", textAlign: "left", padding: "10px 14px", cursor: "pointer", fontSize: 14 };
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/panels/TopBar.tsx
git commit -m "feat(frontend): TopBar com undo/redo e menu exportar"
```

---

## Task 17: Inspector flutuante (personalização básica)

**Files:**
- Create: `frontend/src/panels/Inspector.tsx`

- [ ] **Step 1: Implementar `frontend/src/panels/Inspector.tsx`**

```tsx
import { useStore } from "../state/store";
import { PALETA } from "../types";

const EMOJIS = ["📌", "⭐", "✅", "💡", "🔥", "❓", "📝", "🎯"];
const FONTES = ["Inter", "Roboto", "Poppins", "Georgia", "Comic Sans MS", "Courier New"];

export function Inspector() {
  const selecionado = useStore((s) => s.selecionado);
  const no = useStore((s) => s.mapa?.nos.find((n) => n.id === s.selecionado) ?? null);
  const atualizarNo = useStore((s) => s.atualizarNo);
  const atualizarEstilo = useStore((s) => s.atualizarEstilo);
  if (!selecionado || !no) return null;

  return (
    <div style={painel}>
      <div style={secao}>
        <label style={label}>Texto</label>
        <input
          value={no.texto}
          onChange={(e) => atualizarNo(no.id, { texto: e.target.value })}
          style={input}
        />
      </div>

      <div style={secao}>
        <label style={label}>Cor</label>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {PALETA.map((c) => (
            <button key={c} onClick={() => atualizarNo(no.id, { cor: c })}
              style={{ width: 22, height: 22, borderRadius: 5, background: c, border: no.cor === c ? "2px solid #1f2733" : "1px solid #ccc", cursor: "pointer" }} />
          ))}
          <input type="color" value={no.cor} onChange={(e) => atualizarNo(no.id, { cor: e.target.value })} style={{ width: 26, height: 24, border: "none", background: "none" }} />
        </div>
      </div>

      <div style={secao}>
        <label style={label}>Emoji</label>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button onClick={() => atualizarNo(no.id, { emoji: null })} style={chip}>—</button>
          {EMOJIS.map((em) => (
            <button key={em} onClick={() => atualizarNo(no.id, { emoji: em })} style={chip}>{em}</button>
          ))}
        </div>
      </div>

      <div style={secao}>
        <label style={label}>Fonte</label>
        <select value={no.estilo.fonte} onChange={(e) => atualizarEstilo(no.id, { fonte: e.target.value })} style={input}>
          {FONTES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      <div style={secao}>
        <label style={label}>Tamanho: {no.estilo.tamanho}px</label>
        <input type="range" min={10} max={40} value={no.estilo.tamanho}
          onChange={(e) => atualizarEstilo(no.id, { tamanho: Number(e.target.value) })} style={{ width: "100%" }} />
      </div>
    </div>
  );
}

const painel: React.CSSProperties = { position: "absolute", top: 64, right: 16, width: 220, background: "#fff", border: "1px solid #e3e6ea", borderRadius: 12, boxShadow: "0 6px 24px #0002", padding: 14, zIndex: 15, fontSize: 13 };
const secao: React.CSSProperties = { marginBottom: 12 };
const label: React.CSSProperties = { display: "block", color: "#888", marginBottom: 6, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 };
const input: React.CSSProperties = { width: "100%", padding: "6px 8px", border: "1px solid #d6dae0", borderRadius: 6, fontSize: 13, boxSizing: "border-box" };
const chip: React.CSSProperties = { width: 26, height: 26, borderRadius: 6, border: "1px solid #e3e6ea", background: "#f7f8fa", cursor: "pointer" };
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/panels/Inspector.tsx
git commit -m "feat(frontend): inspector flutuante de personalizacao"
```

---

## Task 18: Barra de criação (lateral esquerda)

**Files:**
- Create: `frontend/src/panels/CreationToolbar.tsx`

Na Fase 1, o botão ativo é "adicionar nó filho do selecionado"; os demais (sticky, forma, seta, caneta, imagem) ficam visíveis porém desabilitados (entram na Fase 3), pra travar o layout visual desde já.

- [ ] **Step 1: Implementar `frontend/src/panels/CreationToolbar.tsx`**

```tsx
import { useStore } from "../state/store";

export function CreationToolbar() {
  const selecionado = useStore((s) => s.selecionado);
  const adicionarFilho = useStore((s) => s.adicionarFilho);

  const addNo = () => {
    if (selecionado) adicionarFilho(selecionado);
  };

  return (
    <div style={barra}>
      <button title="Adicionar nó (Tab)" onClick={addNo} style={btn}>＋</button>
      <button title="Sticky note (Fase 3)" disabled style={btnOff}>📌</button>
      <button title="Forma (Fase 3)" disabled style={btnOff}>▢</button>
      <button title="Seta (Fase 3)" disabled style={btnOff}>↗</button>
      <button title="Caneta (Fase 3)" disabled style={btnOff}>✏️</button>
      <button title="Imagem (Fase 2)" disabled style={btnOff}>🖼️</button>
    </div>
  );
}

const barra: React.CSSProperties = { position: "absolute", top: 64, left: 16, display: "flex", flexDirection: "column", gap: 8, background: "#fff", border: "1px solid #e3e6ea", borderRadius: 12, padding: 8, zIndex: 15, boxShadow: "0 2px 10px #0001" };
const btn: React.CSSProperties = { width: 36, height: 36, borderRadius: 8, border: "1px solid #e3e6ea", background: "#f7f8fa", fontSize: 16, cursor: "pointer" };
const btnOff: React.CSSProperties = { ...btn, opacity: 0.35, cursor: "not-allowed" };
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/panels/CreationToolbar.tsx
git commit -m "feat(frontend): barra de criacao lateral"
```

---

## Task 19: Editor (shell do canvas) com autosave

**Files:**
- Create: `frontend/src/canvas/Editor.tsx`

Junta tudo: carrega o mapa via API, monta o React Flow, liga atalhos, edição inline de texto (duplo-clique), drag para fixar posição, e autosave com debounce.

- [ ] **Step 1: Implementar `frontend/src/canvas/Editor.tsx`**

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap,
  type Node, type NodeMouseHandler, type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useStore } from "../state/store";
import { api } from "../api/client";
import { MindNode, type MindNodeData } from "./MindNode";
import { useSyncFlow } from "./useSyncFlow";
import { useShortcuts, type Acao } from "../lib/shortcuts";
import { TopBar } from "../panels/TopBar";
import { Inspector } from "../panels/Inspector";
import { CreationToolbar } from "../panels/CreationToolbar";

const nodeTypes = { mind: MindNode };

function EditorInterno({ onVoltar }: { onVoltar: () => void }) {
  const mapa = useStore((s) => s.mapa);
  const selecionar = useStore((s) => s.selecionar);
  const selecionado = useStore((s) => s.selecionado);
  const adicionarFilho = useStore((s) => s.adicionarFilho);
  const adicionarIrmao = useStore((s) => s.adicionarIrmao);
  const apagarNo = useStore((s) => s.apagarNo);
  const atualizarNo = useStore((s) => s.atualizarNo);
  const moverNo = useStore((s) => s.moverNo);
  const { nodes, edges } = useSyncFlow(mapa);

  const despachar = useCallback((acao: Acao) => {
    if (!selecionado) return;
    if (acao === "filho") adicionarFilho(selecionado);
    else if (acao === "irmao") adicionarIrmao(selecionado);
    else if (acao === "apagar") apagarNo(selecionado);
    else if (acao === "undo") useStore.temporal.getState().undo();
    else if (acao === "redo") useStore.temporal.getState().redo();
  }, [selecionado, adicionarFilho, adicionarIrmao, apagarNo]);
  useShortcuts(despachar);

  const onNodeClick: NodeMouseHandler = (_e, node) => selecionar(node.id);
  const onPaneClick = () => selecionar(null);

  const onNodeDoubleClick: NodeMouseHandler = (_e, node) => {
    const atual = mapa?.nos.find((n) => n.id === node.id);
    const texto = prompt("Texto do nó:", atual?.texto ?? "");
    if (texto !== null) atualizarNo(node.id, { texto });
  };

  const onNodeDragStop: OnNodeDrag = (_e, node: Node) => {
    moverNo(node.id, node.position.x, node.position.y);
  };

  // autosave com debounce
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (!mapa) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      api.salvar(mapa).catch(() => console.warn("Falha no autosave"));
    }, 800);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [mapa]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar onVoltar={onVoltar} />
      <div style={{ flex: 1, position: "relative" }}>
        <CreationToolbar />
        <Inspector />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeDragStop={onNodeDragStop}
          onPaneClick={onPaneClick}
          fitView
        >
          <Background color="#c9d1dc" gap={16} />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

export function Editor({ mapId, onVoltar }: { mapId: string; onVoltar: () => void }) {
  const carregarMapa = useStore((s) => s.carregarMapa);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    api.carregar(mapId).then((m) => {
      carregarMapa(m);
      useStore.temporal.getState().clear();
      setPronto(true);
    });
  }, [mapId, carregarMapa]);

  if (!pronto) return <div style={{ padding: 40 }}>Carregando…</div>;
  return (
    <ReactFlowProvider>
      <EditorInterno onVoltar={onVoltar} />
    </ReactFlowProvider>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros. (Se a versão do React Flow reclamar de tipos de handler, ajustar os tipos importados conforme o autocompletar do `@xyflow/react` instalado.)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/canvas/Editor.tsx
git commit -m "feat(frontend): editor com canvas, atalhos e autosave"
```

---

## Task 20: App raiz (roteia Biblioteca <-> Editor)

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Substituir `frontend/src/App.tsx`**

```tsx
import { useState } from "react";
import { Library } from "./panels/Library";
import { Editor } from "./canvas/Editor";

export default function App() {
  const [mapId, setMapId] = useState<string | null>(null);
  if (mapId) return <Editor mapId={mapId} onVoltar={() => setMapId(null)} />;
  return <Library onAbrir={setMapId} />;
}
```

- [ ] **Step 2: Garantir `frontend/src/main.tsx` limpo**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 3: Typecheck e build**

Run (em `frontend/`): `npx tsc --noEmit && npm run build`
Expected: build sem erros.

- [ ] **Step 4: Teste manual ponta a ponta**

Backend: `.venv\Scripts\python.exe -m uvicorn main:app --port 8000` (em `backend/`).
Abrir `http://localhost:8000`:
- Criar um mapa novo, ele abre no editor.
- `Tab` cria filho, `Enter` cria irmão, digitar duplo-clique edita texto.
- Selecionar nó e mudar cor/emoji/fonte/tamanho no inspector.
- Arrastar nó, dar zoom, ver o minimapa.
- `Ctrl+Z`/`Ctrl+Y` desfaz/refaz.
- Recarregar a página: o mapa volta salvo (autosave).
- Exportar PNG, PDF e TXT pelo menu.
Expected: todos funcionam.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/src/main.tsx
git commit -m "feat(frontend): roteia biblioteca e editor"
```

---

## Task 21: Recolher/expandir ramo por duplo-clique no indicador + README

**Files:**
- Modify: `frontend/src/canvas/Editor.tsx`
- Create: `README.md`

- [ ] **Step 1: Adicionar ação de recolher via tecla de espaço no nó selecionado**

Em `frontend/src/canvas/Editor.tsx`, dentro de `EditorInterno`, adicionar um listener próprio para a tecla que alterna recolhido (separado de `useShortcuts` para não conflitar):
```tsx
const alternarRecolhido = useStore((s) => s.alternarRecolhido);
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    const alvo = e.target as HTMLElement;
    if (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA") return;
    if (e.key === " " && selecionado) {
      e.preventDefault();
      alternarRecolhido(selecionado);
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [selecionado, alternarRecolhido]);
```

- [ ] **Step 2: Validar recolher manualmente**

Run o app (como na Task 20), selecionar um nó com filhos e apertar espaço.
Expected: o ramo recolhe (filhos somem, aparece ▸) e expande ao apertar de novo.

- [ ] **Step 3: Criar `README.md`**

```markdown
# Mapa Mental

App web local de mapas mentais (uso pessoal, sem login).

## Rodar em desenvolvimento

Backend:
```
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

Frontend:
```
cd frontend
npm install
npm run dev
```
Abrir http://localhost:5173 (o Vite faz proxy de /api pro backend).

## Rodar em modo normal (um processo só)

```
cd frontend && npm run build
cd ../backend && .venv\Scripts\python.exe -m uvicorn main:app --port 8000
```
Abrir http://localhost:8000.

## Testes

Backend: `cd backend && .venv\Scripts\python.exe -m pytest`
Frontend: `cd frontend && npx vitest run`

## Onde ficam os mapas

Em `data/maps/*.json`. Backups automáticos em `data/maps/.backups/`.
```

- [ ] **Step 4: Rodar todas as suítes**

Run backend: `.venv\Scripts\python.exe -m pytest -v`
Run frontend: `npx vitest run`
Expected: tudo PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/canvas/Editor.tsx README.md
git commit -m "feat: recolher ramo por teclado e README"
```

---

## Self-Review (cobertura do spec, Fase 1)

- Backend storage `.json` + escrita atômica + backups: Tasks 2, 3.
- Tela de biblioteca (listar/criar/abrir/renomear/apagar): Task 11 + endpoints Task 3.
- Canvas hierarquia estilo Sólido: Tasks 12, 13, 19.
- Criar/editar/apagar nó, Tab/Enter: Tasks 6, 14, 19.
- Arrastar nó (fixa posição): Tasks 6 (`moverNo`), 19 (`onNodeDragStop`), 8 (respeita posição manual).
- Auto-layout radial (elkjs): Task 8.
- Recolher/expandir ramos: Tasks 6, 8 (oculta descendentes), 13, 21.
- Personalização básica (cor, emoji, fonte, tamanho): Task 17.
- Zoom/pan, minimapa, controles: Task 19 (`MiniMap`, `Controls`, `Background`).
- Undo/redo: Tasks 6 (zundo), 7, 16, 19.
- Salvar/abrir, autosave: Tasks 3, 10, 19.
- Exportar PNG/PDF/TXT (menu na barra superior): Tasks 9, 15, 16.

Sem placeholders. Nomes de função consistentes entre tasks (`adicionarFilho`, `adicionarIrmao`, `atualizarNo`, `atualizarEstilo`, `apagarNo`, `alternarRecolhido`, `moverNo`, `calcularLayout`, `derivarFlow`, `mapaParaTxt`, `resolverAcao`). Itens fora da Fase 1 (notas/links/imagens, relações/contornos, multi-seleção, elementos livres, múltiplos layouts ativos, apresentação, SVG) ficam para as Fases 2 e 3 do spec.
