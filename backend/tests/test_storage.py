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
