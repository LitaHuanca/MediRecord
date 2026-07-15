"""
TC-BE-011 a TC-BE-021 — Credencial QR y acceso de emergencia (ficha.py / emergency.py)

Estrategia de datos:
- Tests destructivos (11, 12, 13): usan usuarios efímeros (fixture usuario_efimero_con_ficha).
- Tests que leen datos estables (14, 15, 16, 17, 18, 19, 20, 21): usan usuarios semilla
  que tienen estados fijos y conocidos en staging.

Semillas relevantes:
  TEST_A  (a1a10000-...-0001)  token activo   4a100000-...-0001
  TEST_C  (c3c30000-...-0003)  token revocado 4c300000-...-0003  (sin token activo)
  TEST_G  (a7070000-...-0007)  sin ficha, sin token
"""
import os
import uuid

import pytest
from httpx import AsyncClient
from supabase import Client as SupabaseClient

# Credenciales de semilla (leídas de .env.test)
TEST_A_EMAIL    = os.environ.get("TEST_USER_A_EMAIL",    "test_usuario_a@medirecord.com")
TEST_A_PASSWORD = os.environ.get("TEST_USER_A_PASSWORD", "TEST_Password_2024!")
TEST_C_EMAIL    = os.environ.get("TEST_USER_C_EMAIL",    "test_usuario_c@medirecord.com")
TEST_C_PASSWORD = os.environ.get("TEST_USER_C_PASSWORD", "TEST_Password_2024!")
TEST_G_EMAIL    = os.environ.get("TEST_USER_G_EMAIL",    "test_usuario_g@medirecord.com")
TEST_G_PASSWORD = os.environ.get("TEST_USER_G_PASSWORD", "TEST_Password_2024!")

# IDs y tokens fijos de seed data en staging
_TOKEN_A_ACTIVO   = "4a100000-0000-0000-0000-000000000001"
_TOKEN_C_REVOCADO = "4c300000-0000-0000-0000-000000000003"


async def _login(http_client: AsyncClient, email: str, password: str) -> str:
    """Shortcut para obtener JWT de un usuario semilla."""
    resp = await http_client.post("/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, f"No se pudo hacer login con {email}: {resp.text}"
    return resp.json()["access_token"]


# ---------------------------------------------------------------------------
# TC-BE-011 — Token QR se crea al completar ficha, NO al registrarse
# ---------------------------------------------------------------------------

async def test_tc_be_011_token_creado_al_completar_ficha(
    http_client: AsyncClient,
    supabase_ro: SupabaseClient,
    usuario_efimero_con_ficha: dict,
):
    """PUT /api/ficha completo -> exactamente 1 token activo en tokens_qr."""
    user_id = usuario_efimero_con_ficha["user_id"]

    tokens = (
        supabase_ro.table("tokens_qr")
        .select("id, estado")
        .eq("usuario_id", user_id)
        .eq("estado", "activo")
        .execute()
    )
    assert len(tokens.data) == 1, (
        f"Debe haber exactamente 1 token activo tras completar ficha, "
        f"encontrados: {len(tokens.data)}"
    )


async def test_tc_be_011b_registro_sin_ficha_no_genera_token(
    http_client: AsyncClient,
    supabase_ro: SupabaseClient,
    usuario_efimero: dict,
):
    """Regresión HU-3: usuario recién registrado SIN ficha NO debe tener token QR."""
    user_id = usuario_efimero["user_id"]

    tokens = (
        supabase_ro.table("tokens_qr")
        .select("id")
        .eq("usuario_id", user_id)
        .execute()
    )
    assert len(tokens.data) == 0, (
        f"REGRESIÓN HU-3: usuario recién registrado ya tiene token QR. "
        f"Filas encontradas: {tokens.data}"
    )


# ---------------------------------------------------------------------------
# TC-BE-012 — Token QR es UUID v4 sin datos del usuario embebidos
# ---------------------------------------------------------------------------

async def test_tc_be_012_token_es_uuid_v4_sin_datos_usuario(
    usuario_efimero_con_ficha: dict,
):
    """Token QR devuelto por PUT /api/ficha es UUID v4 y no contiene datos del usuario."""
    token_qr = usuario_efimero_con_ficha["token_qr"]
    email = usuario_efimero_con_ficha["email"]
    dni = usuario_efimero_con_ficha["numero_documento"]

    assert token_qr is not None, "token_qr es None en la respuesta de PUT /api/ficha"

    parsed = uuid.UUID(token_qr)
    assert parsed.version == 4, f"El token no es UUID v4 (versión detectada: {parsed.version})"

    token_flat = token_qr.lower().replace("-", "")
    assert dni.lower() not in token_flat, "El DNI del usuario aparece embebido en el token QR"
    assert email.split("@")[0].lower()[:8] not in token_flat, (
        "El nombre de usuario del email aparece embebido en el token QR"
    )


# ---------------------------------------------------------------------------
# TC-BE-013 — Revocar token deja el anterior revocado y genera uno nuevo activo
# ---------------------------------------------------------------------------

async def test_tc_be_013_revocar_token_genera_nuevo_activo(
    http_client: AsyncClient,
    supabase_ro: SupabaseClient,
    usuario_efimero_con_ficha: dict,
):
    """POST /api/ficha/token/revoke -> token original revocado + nuevo token activo."""
    token = usuario_efimero_con_ficha["token"]
    user_id = usuario_efimero_con_ficha["user_id"]
    token_qr_original = usuario_efimero_con_ficha["token_qr"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await http_client.post("/api/ficha/token/revoke", headers=headers)
    assert resp.status_code == 200

    body = resp.json()
    assert body.get("ok") is True
    new_token_id = body.get("new_token")
    assert new_token_id is not None, "La respuesta no incluye new_token"
    assert new_token_id != token_qr_original, "El nuevo token es idéntico al revocado"

    # Token original debe quedar revocado con fecha de revocación
    old = (
        supabase_ro.table("tokens_qr")
        .select("estado, revocado_en")
        .eq("id", token_qr_original)
        .execute()
    )
    assert old.data[0]["estado"] == "revocado"
    assert old.data[0]["revocado_en"] is not None

    # Token nuevo debe estar activo
    new = (
        supabase_ro.table("tokens_qr")
        .select("estado")
        .eq("id", new_token_id)
        .execute()
    )
    assert new.data, f"Token nuevo '{new_token_id}' no encontrado en tokens_qr"
    assert new.data[0]["estado"] == "activo"


# ---------------------------------------------------------------------------
# TC-BE-014 — Acceso a /emergency con token revocado -> 403 sin datos médicos
# Usa el token ya revocado de TEST_C (4c300000-...-0003) — estado fijo en staging
# ---------------------------------------------------------------------------

async def test_tc_be_014_acceso_emergencia_token_revocado(http_client: AsyncClient):
    """GET /api/emergency/{token_revocado} -> 403 y respuesta sin datos médicos."""
    resp = await http_client.get(f"/api/emergency/{_TOKEN_C_REVOCADO}")
    assert resp.status_code == 403

    body = resp.json()
    assert body.get("detail") == "Este token ha sido revocado."
    # La respuesta de error no debe exponer datos médicos
    medical_fields = {"tipo_sangre", "alergias", "condiciones", "medicamentos",
                      "contactos", "peso_kg", "nombre_completo"}
    exposed = medical_fields & set(body.keys())
    assert not exposed, f"Respuesta 403 expone campos médicos: {exposed}"


# ---------------------------------------------------------------------------
# TC-BE-015 — Acceso a /emergency con token activo -> 200 con datos médicos
# Usa el token activo de TEST_A (4a100000-...-0001)
# ---------------------------------------------------------------------------

async def test_tc_be_015_acceso_emergencia_token_activo(http_client: AsyncClient):
    """GET /api/emergency/{token_activo} -> 200 con datos médicos del usuario."""
    resp = await http_client.get(f"/api/emergency/{_TOKEN_A_ACTIVO}")
    assert resp.status_code == 200

    body = resp.json()
    assert "nombre_completo" in body, "Falta nombre_completo en respuesta de emergencia"
    assert "tipo_sangre" in body, "Falta tipo_sangre en respuesta de emergencia"
    assert "alergias" in body, "Falta alergias en respuesta de emergencia"
    assert "contactos" in body, "Falta contactos en respuesta de emergencia"
    assert isinstance(body["alergias"], list)
    assert isinstance(body["contactos"], list)


# ---------------------------------------------------------------------------
# TC-BE-016 — Revocar cuando no hay token activo -> 404
# TEST_C tiene su token revocado y NO tiene token activo en staging
# ---------------------------------------------------------------------------

async def test_tc_be_016_revocar_sin_token_activo_devuelve_404(
    http_client: AsyncClient,
):
    """POST /api/ficha/token/revoke sin token activo -> 404 'No hay token activo para revocar.'"""
    jwt_c = await _login(http_client, TEST_C_EMAIL, TEST_C_PASSWORD)

    resp = await http_client.post(
        "/api/ficha/token/revoke",
        headers={"Authorization": f"Bearer {jwt_c}"},
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "No hay token activo para revocar."


# ---------------------------------------------------------------------------
# TC-BE-017 — Revocar token de usuario que nunca completó ficha -> 404
# TEST_G: registrado, sin ficha, sin token (0 tokens en tokens_qr)
# ---------------------------------------------------------------------------

async def test_tc_be_017_revocar_usuario_sin_token_nunca(http_client: AsyncClient):
    """POST /api/ficha/token/revoke de usuario sin ficha ni token -> 404."""
    jwt_g = await _login(http_client, TEST_G_EMAIL, TEST_G_PASSWORD)

    resp = await http_client.post(
        "/api/ficha/token/revoke",
        headers={"Authorization": f"Bearer {jwt_g}"},
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "No hay token activo para revocar."


# ---------------------------------------------------------------------------
# TC-BE-018 — Token revocado: /emergency no filtra datos médicos (alias de TC-BE-014)
# ---------------------------------------------------------------------------

async def test_tc_be_018_emergency_token_revocado_no_filtra_datos(
    http_client: AsyncClient,
):
    """GET /api/emergency/{token_revocado} devuelve solo mensaje de error, sin datos médicos."""
    resp = await http_client.get(f"/api/emergency/{_TOKEN_C_REVOCADO}")
    assert resp.status_code == 403
    assert resp.json()["detail"] == "Este token ha sido revocado."

    medical_fields = {"tipo_sangre", "alergias", "condiciones", "medicamentos",
                      "contactos", "peso_kg", "altura_cm", "fecha_nacimiento",
                      "nombre_completo", "donante_organos"}
    exposed = medical_fields & set(resp.json().keys())
    assert not exposed, f"Respuesta 403 expone campos médicos: {exposed}"


# ---------------------------------------------------------------------------
# TC-BE-019 — /emergency con UUID válido pero inexistente -> 404
# ---------------------------------------------------------------------------

async def test_tc_be_019_emergency_uuid_inexistente(http_client: AsyncClient):
    """GET /api/emergency/{uuid_inexistente} -> 404, mensaje distinto al de token revocado."""
    fake_uuid = str(uuid.uuid4())
    resp = await http_client.get(f"/api/emergency/{fake_uuid}")
    assert resp.status_code == 404

    detail = resp.json().get("detail", "")
    assert "revocado" not in detail.lower(), (
        "El mensaje de 404 confunde UUID inexistente con token revocado (debe ser 403)"
    )


# ---------------------------------------------------------------------------
# TC-BE-020 — Acceso a /emergency registra visita en accesos_emergencia
# Nota: auditoria_acciones solo registra cambios en la tabla usuarios (trigger trg_auditar_usuario).
# El log de accesos de emergencia se almacena en accesos_emergencia (emergency.py lo escribe).
# ---------------------------------------------------------------------------

async def test_tc_be_020_acceso_emergencia_registra_visita(
    http_client: AsyncClient,
    supabase_ro: SupabaseClient,
):
    """GET /api/emergency/{token_A} exitoso -> se inserta fila en accesos_emergencia."""
    before = (
        supabase_ro.table("accesos_emergencia")
        .select("id")
        .eq("token_id", _TOKEN_A_ACTIVO)
        .execute()
    )
    count_before = len(before.data)

    resp = await http_client.get(f"/api/emergency/{_TOKEN_A_ACTIVO}")
    assert resp.status_code == 200

    after = (
        supabase_ro.table("accesos_emergencia")
        .select("id")
        .eq("token_id", _TOKEN_A_ACTIVO)
        .execute()
    )
    assert len(after.data) == count_before + 1, (
        f"No se insertó fila en accesos_emergencia "
        f"(antes: {count_before}, después: {len(after.data)})"
    )


# ---------------------------------------------------------------------------
# TC-BE-021 — Fila en accesos_emergencia tiene ip y user_agent poblados
# ---------------------------------------------------------------------------

async def test_tc_be_021_acceso_emergencia_registra_ip_y_user_agent(
    http_client: AsyncClient,
    supabase_ro: SupabaseClient,
):
    """GET /api/emergency/{token_A} -> fila en accesos_emergencia con ip y user_agent no nulos."""
    ua_header = "TEST-Agent/1.0 (pytest automatizado)"

    resp = await http_client.get(
        f"/api/emergency/{_TOKEN_A_ACTIVO}",
        headers={"User-Agent": ua_header},
    )
    assert resp.status_code == 200

    result = (
        supabase_ro.table("accesos_emergencia")
        .select("ip, user_agent, via_nfc, accessed_at")
        .eq("token_id", _TOKEN_A_ACTIVO)
        .order("accessed_at", desc=True)
        .limit(1)
        .execute()
    )
    assert result.data, "No se encontró fila en accesos_emergencia para el token de TEST_A"

    row = result.data[0]
    assert row["ip"] is not None, "El campo 'ip' es NULL en accesos_emergencia"
    assert row["user_agent"] is not None, "El campo 'user_agent' es NULL en accesos_emergencia"
    assert row["via_nfc"] is False, "via_nfc debe ser False cuando no se pasa ?via=nfc"
