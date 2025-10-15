
from .test_utils import client

def test_register_and_login():
    email = "newuser@example.com"
    password = "Newuser123!"
    r = client.post("/auth/register", json={"email": email, "password": password})
    assert r.status_code in (200, 400)
    r2 = client.post("/auth/login", data={"username": email, "password": password})
    assert r2.status_code == 200
    data = r2.json()
    assert "access_token" in data and "refresh_token" in data
