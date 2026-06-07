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
