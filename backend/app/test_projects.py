
from .test_utils import client, auth

def test_list_projects_requires_auth():
    r = client.get("/projects/")
    assert r.status_code == 401

def test_create_project_manager_only():
    h_user = auth("user@example.com", "User123!")
    r = client.post("/projects/", json={"name": "X", "description": "Y"}, headers=h_user)
    assert r.status_code == 403

    h_mgr = auth("manager@example.com", "Manager123!")
    r2 = client.post("/projects/", json={"name": "Demo", "description": "ZZ"}, headers=h_mgr)
    assert r2.status_code == 200
    assert r2.json()["name"] == "Demo"
