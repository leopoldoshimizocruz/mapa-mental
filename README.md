# Mapa Mental

App web local de mapas mentais (uso pessoal, sem login), no estilo MindMeister/Miro.
Frontend React + TypeScript (Vite) com React Flow; backend FastAPI que salva cada mapa
como um arquivo `.json` no seu PC.

## Pré-requisitos

- **Python 3.12 ou 3.13**
- **Node.js 18+** e **npm**

## Instalação

Backend (uma vez):

    cd backend
    python -m venv .venv
    .venv\Scripts\python.exe -m pip install -r requirements.txt

Frontend (uma vez):

    cd frontend
    npm install

> No macOS/Linux, troque `.venv\Scripts\python.exe` por `.venv/bin/python`.

## Como rodar

### Modo normal (1 processo só, recomendado pra usar)

Builda o frontend e deixa o backend servir tudo numa porta só:

    cd frontend
    npm run build
    cd ../backend
    .venv\Scripts\python.exe -m uvicorn main:app --port 8000

Abra **http://localhost:8000**. (Quando mexer no frontend, rode `npm run build` de novo.)

### Modo desenvolvimento (2 terminais, com hot-reload)

Terminal 1 (backend):

    cd backend
    .venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000

Terminal 2 (frontend):

    cd frontend
    npm run dev

Abra **http://localhost:5173** (o Vite faz proxy de `/api` pro backend na porta 8000).

> O `backend` é Python (uvicorn), não tem `npm run dev`. Só o `frontend` usa npm.

## Testes

Backend:

    cd backend
    .venv\Scripts\python.exe -m pytest

Frontend:

    cd frontend
    npx vitest run

## Onde ficam os mapas

Cada mapa é um arquivo em `data/maps/*.json` (com escrita atômica). Backups automáticos
das versões anteriores ficam em `data/maps/.backups/`. Esses dados são pessoais e **não**
sobem pro Git (estão no `.gitignore`).

## Funcionalidades

- Tela inicial em lista com histórico (criado/editado) e contagem de nós, busca e import/export `.json`
- Edição inline dos nós, criar filho/irmão, nó isolado, copiar/colar e duplicar subárvores
- Re-parent arrastando um nó pra cima de outro; relações livres (setas) entre ramos; contornos (boundaries)
- Seleção por caixa (multi-nó) com ações em lote; recolher/expandir ramos
- Personalização: cor, emoji, fonte, tamanho, negrito/itálico/sublinhado, alinhamento, formato da caixa, borda, largura, nota, link e imagem
- Layout automático (horizontal/vertical) sem sobreposição, tema claro/escuro
- Autosave + salvar manual; exportar PNG, PDF e TXT

## Atalhos do editor

| Atalho | Ação |
|--------|------|
| `Tab` | novo nó filho |
| `Enter` | novo nó irmão |
| `Espaço` | recolher / expandir o ramo |
| `Delete` / `Backspace` | apagar o(s) nó(s) selecionado(s) |
| duplo-clique no nó | editar o texto inline |
| duplo-clique no vazio | criar um nó isolado ali |
| `Ctrl+C` / `Ctrl+V` | copiar / colar (com a subárvore) |
| `Ctrl+D` | duplicar |
| `Ctrl+Z` / `Ctrl+Y` | desfazer / refazer |
| `Ctrl+S` | salvar agora |

Mouse: arraste no vazio pra selecionar vários; pan com o botão do meio/direito; arraste a
alça na borda direita do nó pra mudar a largura; arraste a bolinha azul de um nó até outro
pra criar uma relação.

## Estrutura

    backend/    FastAPI: main.py (API + serve o frontend), storage.py, models.py, tests/
    frontend/   Vite + React + TypeScript (src/canvas, src/panels, src/state, src/lib)
    data/       maps/*.json (seus mapas) + maps/.backups/
