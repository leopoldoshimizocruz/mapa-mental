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
