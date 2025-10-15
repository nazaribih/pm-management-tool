
from fastapi.testclient import TestClient
from .main import app

client = TestClient(app)

def auth(email, password):
    resp = client.post("/auth/login", data={"username": email, "password": password})
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
