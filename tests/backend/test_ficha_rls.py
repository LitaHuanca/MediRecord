"""
TC-BE-009 a TC-BE-010 — Aislamiento RLS y validación de esquema de ficha

TC-BE-009: verifica que RLS impide leer perfiles médicos ajenos via PostgREST anon.
TC-BE-010: verifica que PUT /api/ficha no permite renombrar entradas del catálogo de
           medicamentos (append-only: crea una nueva entrada en lugar de modificar la existente).

HALLAZGO ARQUITECTURAL (ya reportado):
RLS está habilitado en las tablas médicas pero SIN políticas explícitas definidas.
El aislamiento funciona por denegación por defecto (ningún rol no-service puede leer nada),
pero esto es frágil: un GRANT accidental sin política correspondiente expondría todos los perfiles.
Pendiente: agregar política explícita tipo "usuario_id = auth.uid()" sobre perfiles_medicos.
"""
import uuid

import pytest
from httpx import AsyncClient
from postgrest.exceptions import APIError
from supabase import Client as SupabaseClient

# UUID del perfil médico de TEST_Usuario_B (seed data staging)
_PERFIL_MEDICO_B_ID = "b2b20000-0000-0000-0000-000000000022"


# ---------------------------------------------------------------------------
# TC-BE-009 — RLS: anon no puede leer perfiles médicos ajenos via PostgREST
# ---------------------------------------------------------------------------

def test_tc_be_009_rls_aislamiento_perfiles_medicos(supabase_anon: SupabaseClient):
    """Acceso anon a perfiles_medicos via PostgREST -> denegado (RLS deny-by-default).

    PostgREST puede responder de dos formas equivalentes cuando RLS bloquea:
    - 0 filas en result.data  (con política USING false)
    - APIError 42501 "permission denied"  (sin políticas — deny-by-default)
    Ambas confirman que el perfil médico NO es accesible desde el rol anon.
    """
    try:
        result = (
            supabase_anon.table("perfiles_medicos")
            .select("*")
            .eq("id", _PERFIL_MEDICO_B_ID)
            .execute()
        )
        # Si no lanzó excepción, la lista debe estar vacía
        assert len(result.data) == 0, (
            f"DEFECTO CRÍTICO DE SEGURIDAD: RLS expone perfil médico ajeno a rol anon. "
            f"Filas devueltas: {result.data}"
        )
    except APIError as exc:
        # "permission denied" (código 42501) también es aislamiento correcto
        assert exc.code == "42501", (
            f"Error inesperado de PostgREST (se esperaba 42501 permission denied): {exc}"
        )


# ---------------------------------------------------------------------------
# TC-BE-010 — Schema: el nombre de un medicamento del catálogo no se puede renombrar
# ---------------------------------------------------------------------------

async def test_tc_be_010_medicamento_nombre_no_se_renombra(
    http_client: AsyncClient,
    supabase_ro: SupabaseClient,
    usuario_efimero: dict,
):
    """PUT /api/ficha con distinto 'nombre' de medicamento no modifica la entrada original del catálogo.

    La lógica del endpoint es append-only en el catálogo: si el nombre no existe
    (ilike lookup), crea una nueva entrada. La entrada original queda intacta.
    """
    token = usuario_efimero["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Nombre único para evitar colisiones con otros tests o datos existentes
    med_name_original = f"MedTest{uuid.uuid4().hex[:6]}"

    # --- Paso 1: Asociar medicamento con nombre original ---
    ficha_v1 = {
        "telefono": "912345888",
        "tipo_sangre": "A+",
        "sexo": "femenino",
        "fecha_nacimiento": "1988-03-20",
        "donante_organos": False,
        "peso_kg": 58.0,
        "altura_cm": 162,
        "notas_adicionales": None,
        "alergias": [],
        "condiciones": [],
        "medicamentos": [
            {"nombre": med_name_original, "dosis": "10mg", "frecuencia": "diaria", "notas": None}
        ],
        "contactos": [
            {"nombre": "Contacto Prueba", "telefono": "912345001", "relacion": "familiar", "orden_prioridad": 1}
        ],
    }
    resp1 = await http_client.put("/api/ficha", json=ficha_v1, headers=headers)
    assert resp1.status_code == 200

    # Obtener el ID del medicamento recién creado en el catálogo
    catalog_before = (
        supabase_ro.table("medicamentos")
        .select("id, nombre_generico")
        .ilike("nombre_generico", med_name_original)
        .execute()
    )
    assert catalog_before.data, f"Medicamento '{med_name_original}' no encontrado en catálogo"
    med_id_original = catalog_before.data[0]["id"]

    # --- Paso 2: PUT con nombre diferente (intento de renombrar) ---
    med_name_nuevo = f"{med_name_original}MODIFICADO"
    ficha_v2 = {**ficha_v1, "medicamentos": [
        {"nombre": med_name_nuevo, "dosis": "10mg", "frecuencia": "diaria", "notas": None}
    ]}
    resp2 = await http_client.put("/api/ficha", json=ficha_v2, headers=headers)
    assert resp2.status_code == 200

    # --- Verificación: entrada original sigue sin modificarse ---
    catalog_after = (
        supabase_ro.table("medicamentos")
        .select("id, nombre_generico")
        .eq("id", med_id_original)
        .execute()
    )
    assert catalog_after.data, "La entrada original fue eliminada del catálogo"
    assert catalog_after.data[0]["nombre_generico"] == med_name_original, (
        f"DEFECTO: el endpoint renombró la entrada del catálogo. "
        f"Esperado: '{med_name_original}', "
        f"Actual: '{catalog_after.data[0]['nombre_generico']}'"
    )

    # No se limpia medicamentos aquí: perfil_medicamentos aún referencia esas filas
    # y el fixture teardown borra perfil_medicamentos primero. Las entradas del catálogo
    # con nombres únicos son datos huérfanos inofensivos tras el teardown.
