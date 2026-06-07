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
    criadoEm: Optional[str] = None
    atualizadoEm: Optional[str] = None
