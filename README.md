# Mapa Mental

App web local de mapas mentais (uso pessoal, sem login).

## Rodar em desenvolvimento

Backend:

    cd backend
    python -m venv .venv
    .venv\Scripts\python.exe -m pip install -r requirements.txt
    .venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000

Frontend:

    cd frontend
    npm install
    npm run dev

Abra http://localhost:5173 (o Vite faz proxy de /api para o backend na porta 8000).

## Rodar em modo normal (um processo só)

    cd frontend
    npm run build
    cd ../backend
    .venv\Scripts\python.exe -m uvicorn main:app --port 8000

Abra http://localhost:8000.

## Testes

Backend:

    cd backend
    .venv\Scripts\python.exe -m pytest

Frontend:

    cd frontend
    npx vitest run

## Onde ficam os mapas

Em `data/maps/*.json`. Backups automáticos em `data/maps/.backups/`.

## Atalhos do editor

- Tab: novo nó filho
- Enter: novo nó irmão
- Delete / Backspace: apagar nó (e a subárvore)
- Espaço: recolher / expandir o ramo
- Ctrl+Z / Ctrl+Y: desfazer / refazer
- Duplo-clique no nó: editar o texto
