import os
import uuid
import pytest
import pytest_asyncio
from dotenv import load_dotenv
from httpx import AsyncClient
from supabase import create_client, Client as SupabaseClient

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env.test"))

BASE_URL = os.environ.get("STAGING_API_URL", "http://localhost:8000")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")


# ---------------------------------------------------------------------------
# HTTP client
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def http_client():
    async with AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        yield client


# ---------------------------------------------------------------------------
# Supabase clients (DB verification only — never used to simulate user access)
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def supabase_ro() -> SupabaseClient:
    """Service-role client for DB assertions. Bypasses RLS — assertions only."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        pytest.skip("SUPABASE_URL / SUPABASE_SERVICE_KEY no configurados en .env.test")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


@pytest.fixture(scope="session")
def supabase_anon() -> SupabaseClient:
    """Anon-role client for RLS tests (simulates unauthenticated PostgREST access)."""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        pytest.skip("SUPABASE_URL / SUPABASE_ANON_KEY no configurados en .env.test")
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _unique_user_data() -> dict:
    """Return valid register-endpoint payload with a unique email and DNI."""
    # DNI: exactly 8 numeric digits (auth schema validation)
    dni = str(90000000 + (uuid.uuid4().int % 9000000))
    suffix = uuid.uuid4().hex[:8]
    return {
        # nombres/apellido_paterno: letters/spaces/hyphens only (Pydantic regex)
        "nombres": "Efimero Prueba",
        "apellido_paterno": "Efimero",
        "apellido_materno": None,
        "tipo_documento": "DNI",
        "numero_documento": dni,
        "email": f"efimero.{suffix}@medirecord.com",
        "password": "EfimeroPass2024!",
        "telefono": "912345999",
    }


def _delete_user(supabase: SupabaseClient, user_id: str) -> None:
    """Cascade-delete all rows belonging to an ephemeral user in FK-safe order."""
    perfil_resp = (
        supabase.table("perfiles_medicos").select("id").eq("usuario_id", user_id).execute()
    )
    for row in perfil_resp.data or []:
        pid = row["id"]
        supabase.table("perfil_alergias").delete().eq("perfil_id", pid).execute()
        supabase.table("perfil_condiciones").delete().eq("perfil_id", pid).execute()
        supabase.table("perfil_medicamentos").delete().eq("perfil_id", pid).execute()

    supabase.table("tokens_qr").delete().eq("usuario_id", user_id).execute()
    supabase.table("contactos_emergencia").delete().eq("usuario_id", user_id).execute()
    supabase.table("perfiles_medicos").delete().eq("usuario_id", user_id).execute()
    supabase.table("usuarios").delete().eq("id", user_id).execute()


# ---------------------------------------------------------------------------
# Ephemeral user fixtures
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def usuario_efimero(http_client: AsyncClient, supabase_ro: SupabaseClient):
    """Register a fresh user and delete it on teardown.

    Yields: email, password, numero_documento, user_id, token.
    This user has NO medical profile and NO QR token.
    Do NOT use seed users (A–G) for destructive tests — use this fixture instead.
    """
    data = _unique_user_data()
    resp = await http_client.post("/auth/register", json=data)
    assert resp.status_code == 201, (
        f"No se pudo registrar usuario efímero: {resp.status_code} {resp.text}"
    )
    body = resp.json()
    user_id = body["user_id"]

    yield {
        **data,
        "user_id": user_id,
        "token": body["access_token"],
    }

    _delete_user(supabase_ro, user_id)


@pytest_asyncio.fixture
async def usuario_efimero_con_ficha(http_client: AsyncClient, supabase_ro: SupabaseClient):
    """Register a fresh user, complete their medical profile, and delete on teardown.

    Yields: email, password, numero_documento, user_id, token, token_qr.
    PUT /api/ficha triggers QR token creation — returned as token_qr UUID string.
    """
    data = _unique_user_data()
    resp = await http_client.post("/auth/register", json=data)
    assert resp.status_code == 201, (
        f"No se pudo registrar usuario efímero: {resp.status_code} {resp.text}"
    )
    body = resp.json()
    user_id = body["user_id"]
    token = body["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    ficha_body = {
        "telefono": "912345888",
        "tipo_sangre": "O+",
        "sexo": "masculino",
        "fecha_nacimiento": "1990-01-15",
        "donante_organos": False,
        "peso_kg": 72.0,
        "altura_cm": 172,
        "notas_adicionales": "Ficha efimera de prueba automatizada",
        "alergias": [],
        "condiciones": [],
        "medicamentos": [],
        "contactos": [
            {
                "nombre": "Contacto Efimero",
                "telefono": "912345777",
                "relacion": "familiar",
                "orden_prioridad": 1,
            }
        ],
    }
    ficha_resp = await http_client.put("/api/ficha", json=ficha_body, headers=headers)
    assert ficha_resp.status_code == 200, (
        f"No se pudo completar ficha efímera: {ficha_resp.status_code} {ficha_resp.text}"
    )
    ficha = ficha_resp.json()

    yield {
        **data,
        "user_id": user_id,
        "token": token,
        "token_qr": ficha.get("token_qr"),
    }

    _delete_user(supabase_ro, user_id)
