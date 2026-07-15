"""
TC-BE-001 a TC-BE-008 — Autenticación y registro (auth.py)

Variables de entorno requeridas (.env.test):
  TEST_USER_A_EMAIL      email del usuario semilla A (solo lectura)
  TEST_USER_A_PASSWORD   contraseña del usuario semilla A (solo lectura)
"""
import os
import re
import time
import uuid

import pytest
from httpx import AsyncClient
from supabase import Client as SupabaseClient

TEST_A_EMAIL = os.environ.get("TEST_USER_A_EMAIL", "test_usuario_a@medirecord.com")
TEST_A_PASSWORD = os.environ.get("TEST_USER_A_PASSWORD", "TEST_Password_2024!")

# DNI y email conocidos de TEST_Usuario_A (seed data staging)
_TEST_A_DNI = "91111001"


# ---------------------------------------------------------------------------
# TC-BE-001 — Login con credenciales válidas
# ---------------------------------------------------------------------------

async def test_tc_be_001_login_exitoso(http_client: AsyncClient):
    """POST /auth/login con credenciales válidas -> 200 con JWT y datos de usuario."""
    resp = await http_client.post(
        "/auth/login",
        json={"email": TEST_A_EMAIL, "password": TEST_A_PASSWORD},
    )
    assert resp.status_code == 200

    body = resp.json()
    assert "access_token" in body, "Falta access_token en la respuesta"
    assert "user_id" in body, "Falta user_id en la respuesta"
    assert "nombre_completo" in body, "Falta nombre_completo en la respuesta"
    assert body["email"] == TEST_A_EMAIL

    # JWT tiene 3 segmentos separados por punto
    parts = body["access_token"].split(".")
    assert len(parts) == 3, f"JWT malformado: {len(parts)} segmentos"


# ---------------------------------------------------------------------------
# TC-BE-002 — Login con contraseña incorrecta
# ---------------------------------------------------------------------------

async def test_tc_be_002_login_password_incorrecta(http_client: AsyncClient):
    """POST /auth/login con password incorrecta -> 401 con mensaje genérico."""
    resp = await http_client.post(
        "/auth/login",
        json={"email": TEST_A_EMAIL, "password": "ContraseñaIncorrecta999!"},
    )
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Credenciales incorrectas."


# ---------------------------------------------------------------------------
# TC-BE-003 — Login con email no registrado (sin enumerar emails)
# ---------------------------------------------------------------------------

async def test_tc_be_003_login_email_no_registrado(http_client: AsyncClient):
    """POST /auth/login con email inexistente -> mismo 401 que TC-BE-002 (no enumera emails)."""
    fake_email = f"noexiste.{uuid.uuid4().hex[:8]}@medirecord.com"
    resp = await http_client.post(
        "/auth/login",
        json={"email": fake_email, "password": "CualquierPassword123!"},
    )
    assert resp.status_code == 401
    # Debe ser idéntico al mensaje de TC-BE-002 para prevenir enumeración
    assert resp.json()["detail"] == "Credenciales incorrectas."


# ---------------------------------------------------------------------------
# TC-BE-004 — Bloqueo tras 5 intentos fallidos
# NOTA: auth.py no implementa rate limiting a nivel de API. El bloqueo que
# se observó manualmente ocurre en el frontend (botón deshabilitado via UI).
# Este test documenta el comportamiento esperado a nivel de API.
# ---------------------------------------------------------------------------

@pytest.mark.xfail(
    strict=False,
    reason="Rate limiting no implementado en auth.py — el bloqueo ocurre en el frontend, no en la API",
)
async def test_tc_be_004_bloqueo_tras_5_intentos_fallidos(
    http_client: AsyncClient,
    usuario_efimero: dict,
):
    """5 logins fallidos consecutivos -> 6to intento devuelve 429 (cuenta bloqueada)."""
    email = usuario_efimero["email"]

    for _ in range(5):
        await http_client.post(
            "/auth/login",
            json={"email": email, "password": "ContraseñaErronea!"},
        )

    resp = await http_client.post(
        "/auth/login",
        json={"email": email, "password": usuario_efimero["password"]},
    )
    assert resp.status_code == 429
    detail = resp.json().get("detail", "").lower()
    assert "bloqueo" in detail or "intentos" in detail or "locked" in detail


# ---------------------------------------------------------------------------
# TC-BE-005 — Login exitoso tras expiración del bloqueo
# Marcado como No automatizado en la matriz (requiere esperar 60+ segundos).
# ---------------------------------------------------------------------------

@pytest.mark.skip(reason="TC-BE-005 es manual: requiere esperar 60s de bloqueo (ver matriz)")
async def test_tc_be_005_login_exitoso_tras_desbloqueo(
    http_client: AsyncClient,
    usuario_efimero: dict,
):
    """Tras el período de bloqueo (LOCKOUT_SECONDS), login con credenciales correctas -> 200."""
    email = usuario_efimero["email"]
    lockout = int(os.environ.get("LOCKOUT_SECONDS", "60"))

    for _ in range(5):
        await http_client.post(
            "/auth/login",
            json={"email": email, "password": "ContraseñaErronea!"},
        )

    time.sleep(lockout + 2)

    resp = await http_client.post(
        "/auth/login",
        json={"email": email, "password": usuario_efimero["password"]},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


# ---------------------------------------------------------------------------
# TC-BE-006 — Registro con DNI duplicado (usa DNI conocido de TEST_A)
# ---------------------------------------------------------------------------

async def test_tc_be_006_registro_dni_duplicado(http_client: AsyncClient):
    """POST /auth/register con DNI ya registrado (91111001 de TEST_A) -> 409."""
    suffix = uuid.uuid4().hex[:8]
    resp = await http_client.post(
        "/auth/register",
        json={
            "nombres": "Otro Usuario",
            "apellido_paterno": "Apellido",
            "apellido_materno": None,
            "tipo_documento": "DNI",
            "numero_documento": _TEST_A_DNI,          # DNI de TEST_A — duplicado
            "email": f"otro.{suffix}@medirecord.com",
            "password": "OtroPass2024!",
            "telefono": "912345001",
        },
    )
    assert resp.status_code == 409
    assert resp.json()["detail"] == "Este número de documento ya está registrado."


# ---------------------------------------------------------------------------
# TC-BE-007 — Registro con email duplicado (usa email conocido de TEST_A)
# ---------------------------------------------------------------------------

async def test_tc_be_007_registro_email_duplicado(http_client: AsyncClient):
    """POST /auth/register con email ya registrado (TEST_A) -> 409."""
    dni = str(90000000 + (uuid.uuid4().int % 9000000))
    resp = await http_client.post(
        "/auth/register",
        json={
            "nombres": "Otro Usuario",
            "apellido_paterno": "Apellido",
            "apellido_materno": None,
            "tipo_documento": "DNI",
            "numero_documento": dni,
            "email": TEST_A_EMAIL,                    # email de TEST_A — duplicado
            "password": "OtroPass2024!",
            "telefono": "912345001",
        },
    )
    assert resp.status_code == 409
    assert resp.json()["detail"] == "Este correo ya está registrado."


# ---------------------------------------------------------------------------
# TC-BE-008 — Hash de contraseña almacenado en formato bcrypt ($2b$)
# ---------------------------------------------------------------------------

async def test_tc_be_008_password_hash_bcrypt(
    http_client: AsyncClient,
    supabase_ro: SupabaseClient,
):
    """POST /auth/register -> password_hash en DB es bcrypt ($2b$) y nunca texto plano."""
    plain = "EfimeroHashTest2024!"
    dni = str(90000000 + (uuid.uuid4().int % 9000000))
    suffix = uuid.uuid4().hex[:8]
    email = f"hashtest.{suffix}@medirecord.com"

    resp = await http_client.post(
        "/auth/register",
        json={
            "nombres": "Hash Prueba",
            "apellido_paterno": "Prueba",
            "apellido_materno": None,
            "tipo_documento": "DNI",
            "numero_documento": dni,
            "email": email,
            "password": plain,
            "telefono": "912345002",
        },
    )
    assert resp.status_code == 201
    user_id = resp.json()["user_id"]

    try:
        result = (
            supabase_ro.table("usuarios")
            .select("password_hash")
            .eq("id", user_id)
            .execute()
        )
        assert result.data, "Usuario no encontrado en la base de datos"
        pw_hash: str = result.data[0]["password_hash"]

        # Debe ser bcrypt: prefijo $2b$ (Python bcrypt) o $2a$ (pgcrypto legacy)
        assert re.match(r"^\$2[aby]\$\d{2}\$", pw_hash), (
            f"Hash no tiene formato bcrypt válido. Primeros 10 chars: {pw_hash[:10]}..."
        )
        assert pw_hash != plain, "CRÍTICO: contraseña almacenada en texto plano"
    finally:
        supabase_ro.table("usuarios").delete().eq("id", user_id).execute()
