from .test_utils import client, auth


def test_crud_tasks():
    h_user = auth("user@example.com", "User123!")
    r = client.post("/tasks/", json={"title": "Task A", "status": "todo", "project_id": 1}, headers=h_user)
    assert r.status_code == 200, r.text
    tid = r.json()["id"]

    r2 = client.get("/tasks/?status=todo", headers=h_user)
    assert r2.status_code == 200
    assert any(t["id"] == tid for t in r2.json())

    r3 = client.put(f"/tasks/{tid}", json={"status": "doing"}, headers=h_user)
    assert r3.status_code == 200
    assert r3.json()["status"] == "doing"
