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

export interface Contorno {
  id: string;
  nosIds: string[];
  cor: string;
  rotulo: string | null;
}

export interface Mapa {
  id: string;
  titulo: string;
  criadoEm: string | null;
  atualizadoEm: string | null;
  config: ConfigMapa;
  nos: No[];
  ligacoes: Ligacao[];
  contornos: Contorno[];
  elementosLivres: unknown[];
}

export interface MapaResumo {
  id: string;
  titulo: string;
  criadoEm: string | null;
  atualizadoEm: string | null;
  qtdNos: number;
}

export const ESTILO_PADRAO: EstiloNo = {
  fonte: "Poppins",
  tamanho: 16,
  negrito: false,
  italico: false,
  sublinhado: false,
  corTexto: "#ffffff",
  alinhamento: "esquerda",
  formato: "retangulo-arredondado",
  corBorda: null,
  larguraBorda: 0,
};

export const PALETA: string[] = [
  "#5b2be0", "#3b5bdb", "#2a9d8f", "#e76f51",
  "#e9c46a", "#d6336c", "#0ca678", "#f08c00",
];
