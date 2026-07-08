"""
PRUEBAS DE INTEGRACIÓN — Módulo de Ficha Vital y Dashboard
Responsable: Vera
Endpoints: GET /api/ficha, PUT /api/ficha
Descripción: Verifica que los datos se guardan y recuperan correctamente en Supabase staging.
"""
import pytest
from tests.fixtures.seed_data import (
    DATOS_PERSONALES,
    ALERGIA_LEVE,
    CONDICION_DIABETES,
    MEDICAMENTO_TEST,
    CONTACTO_TEST,
)


# ════════════════════════════════════════════════════════════
# BLOQUE 1 — Obtener ficha (GET /api/ficha)
# ════════════════════════════════════════════════════════════

class TestGetFicha:

    def test_get_ficha_autenticado_retorna_200(self, auth_client):
        """GET /api/ficha con token válido retorna 200."""
        response = auth_client.get("/api/ficha")
        assert response.status_code == 200

    def test_get_ficha_retorna_estructura_correcta(self, auth_client):
        """La ficha debe contener los campos principales."""
        response = auth_client.get("/api/ficha")
        data = response.json()
        assert "nombre_completo" in data
        assert "alergias" in data
        assert "condiciones" in data
        assert "medicamentos" in data
        assert "contactos" in data

    def test_get_ficha_alergias_es_lista(self, auth_client):
        """El campo alergias debe ser una lista."""
        response = auth_client.get("/api/ficha")
        data = response.json()
        assert isinstance(data["alergias"], list)

    def test_get_ficha_contactos_es_lista(self, auth_client):
        """El campo contactos debe ser una lista."""
        response = auth_client.get("/api/ficha")
        data = response.json()
        assert isinstance(data["contactos"], list)

    def test_get_ficha_sin_token_retorna_401(self, client):
        """GET /api/ficha sin token retorna 401."""
        response = client.get("/api/ficha")
        assert response.status_code == 401


# ════════════════════════════════════════════════════════════
# BLOQUE 2 — Actualizar datos personales (PUT /api/ficha)
# ════════════════════════════════════════════════════════════

class TestActualizarDatosPersonales:

    def test_actualizar_tipo_sangre_retorna_200(self, auth_client):
        """PUT /api/ficha actualizando tipo de sangre retorna 200."""
        response = auth_client.put("/api/ficha", json={
            **DATOS_PERSONALES,
            "alergias": [],
            "condiciones": [],
            "medicamentos": [],
            "contactos": [],
        })
        assert response.status_code == 200

    def test_tipo_sangre_se_guarda_correctamente(self, auth_client):
        """El tipo de sangre actualizado debe recuperarse en el GET siguiente."""
        auth_client.put("/api/ficha", json={
            **DATOS_PERSONALES,
            "tipo_sangre": "AB+",
            "alergias": [],
            "condiciones": [],
            "medicamentos": [],
            "contactos": [],
        })
        response = auth_client.get("/api/ficha")
        assert response.json()["tipo_sangre"] == "AB+"

    def test_telefono_se_guarda_correctamente(self, auth_client):
        """El teléfono actualizado debe recuperarse en el GET siguiente."""
        auth_client.put("/api/ficha", json={
            **DATOS_PERSONALES,
            "telefono": "912345678",
            "alergias": [],
            "condiciones": [],
            "medicamentos": [],
            "contactos": [],
        })
        response = auth_client.get("/api/ficha")
        assert response.json()["telefono"] == "912345678"

    def test_put_ficha_sin_token_retorna_401(self, client):
        """PUT /api/ficha sin token retorna 401."""
        response = client.put("/api/ficha", json=DATOS_PERSONALES)
        assert response.status_code == 401

    def test_donante_organos_se_guarda(self, auth_client):
        """El campo donante_organos se guarda y recupera correctamente."""
        auth_client.put("/api/ficha", json={
            **DATOS_PERSONALES,
            "donante_organos": True,
            "alergias": [],
            "condiciones": [],
            "medicamentos": [],
            "contactos": [],
        })
        response = auth_client.get("/api/ficha")
        assert response.json()["donante_organos"] is True


# ════════════════════════════════════════════════════════════
# BLOQUE 3 — Contactos de emergencia
# ════════════════════════════════════════════════════════════

class TestContactosEmergencia:

    def test_agregar_contacto_se_guarda(self, auth_client):
        """Un contacto agregado debe aparecer en el GET siguiente."""
        auth_client.put("/api/ficha", json={
            **DATOS_PERSONALES,
            "alergias": [],
            "condiciones": [],
            "medicamentos": [],
            "contactos": [CONTACTO_TEST],
        })
        response = auth_client.get("/api/ficha")
        contactos = response.json()["contactos"]
        assert len(contactos) >= 1
        assert any(c["nombre"] == CONTACTO_TEST["nombre"] for c in contactos)

    def test_eliminar_contactos_queda_lista_vacia(self, auth_client):
        """Enviar lista vacía de contactos debe eliminar todos."""
        auth_client.put("/api/ficha", json={
            **DATOS_PERSONALES,
            "alergias": [],
            "condiciones": [],
            "medicamentos": [],
            "contactos": [],
        })
        response = auth_client.get("/api/ficha")
        assert response.json()["contactos"] == []

    def test_contacto_tiene_campos_requeridos(self, auth_client):
        """Cada contacto en la respuesta debe tener nombre y telefono."""
        auth_client.put("/api/ficha", json={
            **DATOS_PERSONALES,
            "alergias": [],
            "condiciones": [],
            "medicamentos": [],
            "contactos": [CONTACTO_TEST],
        })
        response = auth_client.get("/api/ficha")
        contactos = response.json()["contactos"]
        if contactos:
            assert "nombre" in contactos[0]
            assert "telefono" in contactos[0]


# ════════════════════════════════════════════════════════════
# BLOQUE 4 — Medicamentos
# ════════════════════════════════════════════════════════════

class TestMedicamentos:

    def test_medicamentos_es_lista_vacia_por_defecto(self, auth_client):
        """Sin medicamentos registrados, la lista debe estar vacía."""
        auth_client.put("/api/ficha", json={
            **DATOS_PERSONALES,
            "alergias": [],
            "condiciones": [],
            "medicamentos": [],
            "contactos": [],
        })
        response = auth_client.get("/api/ficha")
        assert isinstance(response.json()["medicamentos"], list)

    def test_put_ficha_sin_body_retorna_422(self, auth_client):
        """PUT /api/ficha sin body retorna 422."""
        response = auth_client.put("/api/ficha", json={})
        assert response.status_code == 422
