
from .test_utils import client, auth


def test_register_login_and_profile():
    email = "newuser@example.com"
    password = "Newuser123!"
    r = client.post("/auth/register", json={"email": email, "password": password})
    assert r.status_code in (200, 400)
    r2 = client.post("/auth/login", data={"username": email, "password": password})
    assert r2.status_code == 200
    data = r2.json()
    assert "access_token" in data and "refresh_token" in data

    r3 = client.get("/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"})
    assert r3.status_code == 200
    assert r3.json()["email"] == email


def test_change_password_flow():
    email = "changepass@example.com"
    password = "Change123!"
    new_password = "Better123!"

    client.post("/auth/register", json={"email": email, "password": password})
    headers = auth(email, password)

    wrong = client.post(
        "/auth/change-password",
        json={"current_password": "Wrong123!", "new_password": new_password},
        headers=headers,
    )
    assert wrong.status_code == 400

    ok = client.post(
        "/auth/change-password",
        json={"current_password": password, "new_password": new_password},
        headers=headers,
    )
    assert ok.status_code == 200

    old_login = client.post("/auth/login", data={"username": email, "password": password})
    assert old_login.status_code == 400

    new_login = client.post("/auth/login", data={"username": email, "password": new_password})
    assert new_login.status_code == 200


def test_admin_user_management():
    mgr_headers = auth("manager@example.com", "Manager123!")
    forbidden = client.get("/users/", headers=mgr_headers)
    assert forbidden.status_code == 403

    admin_headers = auth("admin@example.com", "Admin123!")
    listing = client.get("/users/", headers=admin_headers)
    assert listing.status_code == 200
    users = listing.json()
    assert any(u["email"] == "user@example.com" for u in users)

    target = next(u for u in users if u["email"] == "user@example.com")
    promote = client.patch(
        f"/users/{target['id']}/role",
        json={"role": "manager"},
        headers=admin_headers,
    )
    assert promote.status_code == 200
    assert promote.json()["role"] == "manager"

    # revert to keep other tests stable
    revert = client.patch(
        f"/users/{target['id']}/role",
        json={"role": "user"},
        headers=admin_headers,
    )
    assert revert.status_code == 200
