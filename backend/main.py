from fastapi import FastAPI

app = FastAPI(title="Mapa Mental")


@app.get("/api/health")
def health() -> dict:
    """Healthcheck simples para verificar que o servidor está no ar."""
    return {"status": "ok"}
