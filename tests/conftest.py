"""
Configuración compartida de pytest para MediRecord SQA.
Todos los tests importan fixtures desde aquí.
"""
import os
import pytest
import httpx
from dotenv import load_dotenv

load_dotenv(".env.test")

BASE_URL = os.getenv("TEST_API_URL", "https://medirecord-staging.onrender.com")

# ── Usuario de prueba principal ───────────────────────────────────────────────
TEST_USER = {
    "email": "test_sqa_grupo5@medirecord.com",
    "password": "TestSQA2026!",
    "nombre_completo": "Usuario Test SQA",
    "numero_documento": "99999999",
    "telefono": "987654321",
}

# ── Fixture: cliente HTTP reutilizable ────────────────────────────────────────
@pytest.fixture(scope="session")
def client():
    """Cliente HTTP que apunta al backend de staging."""
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as c:
        yield c


# ── Fixture: registrar o reutilizar usuario de prueba ─────────────────────────
@pytest.fixture(scope="session")
def registered_user(client):
    """
    Intenta registrar el usuario de prueba.
    Si ya existe (400), continúa igual — el usuario ya está creado.
    """
    response = client.post("/auth/register", json={
        "email": TEST_USER["email"],
        "password": TEST_USER["password"],
        "nombre_completo": TEST_USER["nombre_completo"],
        "numero_documento": TEST_USER["numero_documento"],
    })
    # 201 = creado, 400 = ya existe — ambos son válidos para continuar
    assert response.status_code in (201, 400), (
        f"Error inesperado al registrar usuario de prueba: {response.status_code} {response.text}"
    )
    return TEST_USER


# ── Fixture: token JWT del usuario de prueba ──────────────────────────────────
@pytest.fixture(scope="session")
def auth_token(client, registered_user):
    """Retorna el token JWT del usuario de prueba."""
    response = client.post("/auth/login", json={
        "email": registered_user["email"],
        "password": registered_user["password"],
    })
    assert response.status_code == 200, f"Login falló: {response.text}"
    return response.json()["access_token"]


# ── Fixture: headers con Authorization ───────────────────────────────────────
@pytest.fixture(scope="session")
def auth_headers(auth_token):
    """Headers listos para usar en requests autenticados."""
    return {"Authorization": f"Bearer {auth_token}"}


# ── Fixture: cliente autenticado ──────────────────────────────────────────────
@pytest.fixture(scope="session")
def auth_client(auth_headers):
    """Cliente HTTP ya autenticado (incluye header Authorization)."""
    with httpx.Client(
        base_url=BASE_URL,
        headers=auth_headers,
        timeout=30.0
    ) as c:
        yield c
