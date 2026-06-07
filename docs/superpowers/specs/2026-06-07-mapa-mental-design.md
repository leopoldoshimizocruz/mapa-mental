# Mapa Mental, design do projeto

Data: 2026-06-07
Status: aprovado para planejamento

## Resumo

Software de criação de mapas mentais para uso pessoal, sem login, rodando localmente como app web. Inspirado em MindMeister (hierarquia radial, estilo de nós, notas/links/imagens, relações, contornos, apresentação, múltiplos layouts) e em Miro (canvas infinito com minimapa, seleção múltipla/grupos, elementos livres no quadro). Foco em ser completo em funcionalidades de criação, sem recursos de colaboração em tempo real (não fazem sentido sem login).

## Decisões fechadas no brainstorming

- Formato: app web local servido por um backend local (um comando sobe tudo, abre no navegador).
- Armazenamento: backend salva cada mapa como arquivo `.json` numa pasta do PC; imagens como arquivos. Portável e seguro contra perda.
- Stack: React + TypeScript (Vite) no frontend, React Flow (xyflow) como motor de canvas, elkjs para auto-layout, Zustand para estado. FastAPI (Python) no backend.
- Layout de interface: canvas-first (estilo Miro), barra vertical de criação à esquerda + inspector flutuante perto do nó selecionado.
- Estilo visual dos nós: Sólido moderno (blocos preenchidos com cor forte, texto branco, cantos suaves), personalizável por nó.
- Escopo de features: núcleo + notas/links/imagens nos nós + relações livres e contornos + modo apresentação e múltiplos layouts + canvas infinito/minimapa + seleção múltipla/grupos + elementos livres (sticky, formas, setas, caneta). Gestão de tarefas e templates ficam de fora.

## Arquitetura geral

- Frontend: React + TypeScript (Vite). Motor de canvas React Flow (xyflow). Auto-layout da hierarquia com elkjs. Estado global com Zustand (com suporte a undo/redo).
- Backend: FastAPI (Python). Servidor local que persiste mapas e assets em disco. Em modo normal, também serve o frontend buildado, então um único processo (`uvicorn`) serve tudo em `localhost:8000`. Em modo dev, Vite (frontend) + uvicorn (backend) rodam separados com proxy.
- Sem autenticação. Single-user, single-machine.

## Modelo de dados

Um mapa é um arquivo `.json`:

```
Mapa {
  id: string
  titulo: string
  criadoEm: ISO8601
  atualizadoEm: ISO8601
  config: { layout: 'radial'|'organograma'|'arvore', tema: 'claro'|'escuro', corFundo, padraoFundo, fontePadrao, paletaPadrao }
  nos: No[]
  ligacoes: Ligacao[]
  contornos: Contorno[]
  elementosLivres: ElementoLivre[]
}

No {
  id: string
  paiId: string | null        // null = nó central (raiz)
  texto: string
  nota: RichText | null        // nota de texto rico
  link: string | null          // hyperlink clicável
  imagem: string | null        // referência ao asset
  cor: string                  // cor de preenchimento
  emoji: string | null
  recolhido: boolean           // ramo colapsado
  posicao: { x, y } | null     // null = posição automática pelo layout; preenchido quando arrastado manualmente
  tamanho: { w, h } | null
  estilo: {
    fonte, tamanho, negrito, italico, sublinhado,
    corTexto, alinhamento,                      // texto
    formato: 'retangulo-arredondado'|'pilula'|'elipse'|'retangulo',
    corBorda, larguraBorda                      // caixa
  }
}

Ligacao {
  id: string
  origem: string               // id do nó
  destino: string              // id do nó
  tipo: 'hierarquia' | 'relacao'   // hierarquia = pai/filho (automática); relacao = ligação livre cruzando ramos
  rotulo: string | null
  estilo: { cor, espessura, curva: 'curva'|'reta'|'cotovelo', seta: boolean }
}

Contorno {
  id: string
  nosIds: string[]
  cor: string
  rotulo: string | null
}

ElementoLivre {
  id: string
  tipo: 'sticky' | 'forma' | 'texto' | 'seta' | 'desenho'
  posicao: { x, y }
  tamanho: { w, h }
  conteudo: string | null      // texto da sticky/caixa de texto
  estilo: { ... }
  pontos: [{x,y}] | null       // para seta livre e desenho à mão livre
}
```

## Layout e canvas

- elkjs calcula as posições da hierarquia conforme `config.layout`:
  - radial: mapa mental clássico irradiando do nó central.
  - organograma: em camadas (top-down).
  - arvore/lista: árvore vertical compacta.
- Trocar o layout recalcula as posições dos nós que estão em modo automático (`posicao == null`).
- Arrastar um nó manualmente fixa sua `posicao` (modo Miro), mantendo as ligações de hierarquia. Há ação "voltar ao automático" para soltar a posição fixa.
- React Flow fornece: canvas infinito, pan/zoom, minimapa, controles de zoom, fundo pontilhado, seleção por caixa, multi-seleção.
- Nó renderizado por componente customizado no estilo Sólido moderno, lendo `No.estilo` e `No.cor`, com badges para indicar nota/link/imagem presentes.

## Interações

- Barra vertical de criação à esquerda: adicionar nó, sticky, forma, seta, caneta, imagem.
- Inspector flutuante perto da seleção, com a personalização da seção abaixo.
- Atalhos de teclado:
  - `Tab` cria nó filho do selecionado.
  - `Enter` cria nó irmão.
  - `Del`/`Backspace` apaga seleção.
  - `Ctrl+Z` / `Ctrl+Y` (e `Ctrl+Shift+Z`) undo/redo.
  - Duplo-clique edita o texto do nó.
  - Atalho para recolher/expandir ramo.
  - `Ctrl+C`/`Ctrl+V`/`Ctrl+D` copiar/colar/duplicar (subárvore inteira quando for nó com filhos).
- Multi-seleção: mover e estilizar vários nós de uma vez.

## Personalização (inspector)

Texto do nó: fonte (seleção curada: Inter, Roboto, Poppins, uma serifada, uma manuscrita, uma monoespaçada), tamanho, negrito, itálico, sublinhado, cor do texto, alinhamento.

Caixa do nó: cor de preenchimento (paleta + hex customizado), cor e espessura da borda, formato (retângulo arredondado, pílula, elipse, retângulo reto), tamanho/padding.

Ligações: cor, espessura, tipo de curva (curva/reta/cotovelo), ponta de seta.

Mapa inteiro: tema claro/escuro, cor/padrão do fundo do canvas, fonte e paleta padrão (aplica em tudo), presets de tema prontos (paletas combinadas) para trocar o visual inteiro num clique.

## Roadmap por fases

Cada fase entrega um app usável de ponta a ponta.

### Fase 1, MVP núcleo
- Backend de storage (CRUD de mapas em `.json`, escrita atômica, backups).
- Tela de biblioteca de mapas (listar, criar, abrir, renomear, apagar).
- Canvas com hierarquia de nós no estilo Sólido moderno.
- Criar/editar/apagar nó, `Tab`/`Enter`, arrastar nó.
- Auto-layout radial (elkjs).
- Recolher/expandir ramos.
- Personalização básica: cor do nó, emoji, fonte, tamanho do texto.
- Zoom/pan, minimapa, controles de zoom.
- Undo/redo.
- Salvar/abrir, autosave.
- Exportar via menu "Exportar" no canto direito da barra superior, com as opções PNG (imagem do mapa), PDF (mapa renderizado em página) e TXT (outline indentado da hierarquia). A escolha do formato é do usuário.

### Fase 2
- Notas (texto rico), links e imagens nos nós.
- Relações livres (ligações cruzando ramos) e contornos (boundaries).
- Seleção múltipla e grupos; copiar/colar/duplicar subárvore.
- Personalização completa: formatos de caixa, borda, alinhamento, presets de tema, tema do mapa.

### Fase 3
- Elementos livres: sticky notes, formas, setas livres, caneta/desenho à mão livre.
- Múltiplos layouts: organograma e árvore (alternância).
- Modo apresentação (slides navegando pelos ramos).
- Exportar SVG (PNG, PDF e TXT já vêm da Fase 1).

## Erros e segurança de dados

- Backend: escrita atômica (arquivo temporário + rename), validação do JSON do mapa contra o schema, 404 amigável para mapa inexistente, manutenção dos últimos N backups por mapa.
- Frontend: edição otimista com pilha de undo; autosave com debounce mais botão de salvar manual; fallback em localStorage para não perder trabalho caso o backend caia; toast em falha de salvamento.

## Testes

- Backend: pytest no storage (CRUD, escrita atômica, validação de schema, backups).
- Frontend: vitest nas operações de estado (criação/edição/remoção de nós, undo/redo, transformações de layout, copiar/colar subárvore) e alguns testes de componente com React Testing Library.
- Playwright (e2e) fica para uma fase posterior.

## Estrutura de pastas

```
mapa-mental/
  backend/
    main.py            # app FastAPI, serve API e frontend buildado
    storage.py         # leitura/escrita atômica de mapas e assets
    models.py          # schemas Pydantic do mapa
    tests/
  frontend/
    src/
      canvas/          # React Flow, viewport, minimapa, seleção
      nodes/           # componente de nó customizado e tipos
      state/           # store Zustand, undo/redo, ações
      panels/          # biblioteca de mapas, inspector flutuante, barra de criação
      lib/layout/      # integração com elkjs
  data/
    maps/*.json
    assets/*
  README.md
```

## Fora de escopo

- Colaboração em tempo real, comentários, compartilhamento, contas/login.
- Gestão de tarefas (prazos, responsáveis, status).
- Templates prontos e guias de alinhamento/snapping (podem ser reavaliados depois).
