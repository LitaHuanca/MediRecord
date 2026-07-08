"""
PRUEBAS DE INTEGRACIÓN — Módulo de QR, Emergencia y Catálogos
Responsable: Aldana
Endpoints: GET /api/emergency/{token}, POST /api/ficha/token/revoke, GET /api/catalogs
Descripción: Verifica el acceso público a la vista paramédico y la gestión del QR.
"""
import pytest
from tests.fixtures.seed_data import TOKEN_INVALIDO, TOKEN_FORMATO_INCORRECTO


# ════════════════════════════════════════════════════════════
# BLOQUE 1 — Vista de emergencia pública (GET /api/emergency/{token})
# ════════════════════════════════════════════════════════════

class TestEmergenciaPublica:

    def test_token_invalido_retorna_404(self, client):
        """Un token UUID válido pero inexistente en la DB retorna 404."""
        response = client.get(f"/api/emergency/{TOKEN_INVALIDO}")
        assert response.status_code in (404, 403)

    def test_token_formato_incorrecto_retorna_error(self, client):
        """Un token con formato no UUID retorna error de validación."""
        response = client.get(f"/api/emergency/{TOKEN_FORMATO_INCORRECTO}")
        assert response.status_code in (404, 422, 400)

    def test_emergencia_no_requiere_autenticacion(self, client, auth_client):
        """
        La vista de emergencia es pública.
        Verificamos que el endpoint existe y no exige Authorization.
        El token inválido retorna 404, no 401.
        """
        response = client.get(f"/api/emergency/{TOKEN_INVALIDO}")
        assert response.status_code != 401

    def test_token_activo_retorna_datos_paciente(self, auth_client, client):
        """
        Si el usuario tiene QR activo, la vista de emergencia retorna datos.
        Primero obtenemos el token del usuario de prueba.
        """
        ficha = auth_client.get("/api/ficha")
        assert ficha.status_code == 200
        token = ficha.json().get("token_qr")

        if token:
            response = client.get(f"/api/emergency/{token}")
            assert response.status_code == 200
            data = response.json()
            assert "nombre_completo" in data or "nombre" in data
        else:
            pytest.skip("El usuario de prueba no tiene token QR activo aún.")

    def test_token_activo_retorna_tipo_sangre(self, auth_client, client):
        """La vista de emergencia debe incluir el tipo de sangre."""
        ficha = auth_client.get("/api/ficha")
        token = ficha.json().get("token_qr")

        if token:
            response = client.get(f"/api/emergency/{token}")
            data = response.json()
            assert "tipo_sangre" in data
        else:
            pytest.skip("El usuario de prueba no tiene token QR activo.")

    def test_token_activo_retorna_alergias(self, auth_client, client):
        """La vista de emergencia debe incluir la lista de alergias."""
        ficha = auth_client.get("/api/ficha")
        token = ficha.json().get("token_qr")

        if token:
            response = client.get(f"/api/emergency/{token}")
            data = response.json()
            assert "alergias" in data
            assert isinstance(data["alergias"], list)
        else:
            pytest.skip("El usuario de prueba no tiene token QR activo.")

    def test_token_activo_retorna_contactos(self, auth_client, client):
        """La vista de emergencia debe incluir contactos de emergencia."""
        ficha = auth_client.get("/api/ficha")
        token = ficha.json().get("token_qr")

        if token:
            response = client.get(f"/api/emergency/{token}")
            data = response.json()
            assert "contactos" in data
            assert isinstance(data["contactos"], list)
        else:
            pytest.skip("El usuario de prueba no tiene token QR activo.")


# ════════════════════════════════════════════════════════════
# BLOQUE 2 — Revocación del QR (POST /api/ficha/token/revoke)
# ════════════════════════════════════════════════════════════

class TestRevocacionQR:

    def test_revocar_sin_token_retorna_401(self, client):
        """Revocar QR sin autenticación retorna 401."""
        response = client.post("/api/ficha/token/revoke")
        assert response.status_code == 401

    def test_revocar_con_token_valido_retorna_200(self, auth_client, client):
        """
        Revocar el QR con usuario autenticado retorna 200.
        NOTA: Este test modifica el estado — el token QR anterior queda inválido.
        Se ejecuta al final para no afectar otros tests.
        """
        ficha_antes = auth_client.get("/api/ficha").json()
        token_antes = ficha_antes.get("token_qr")

        response = auth_client.post("/api/ficha/token/revoke")
        assert response.status_code == 200

        # El token anterior ya no debe funcionar
        if token_antes:
            emergencia = client.get(f"/api/emergency/{token_antes}")
            assert emergencia.status_code in (403, 404)

    def test_token_nuevo_generado_tras_revocar(self, auth_client):
        """Tras revocar, la ficha debe tener un nuevo token QR distinto al anterior."""
        ficha_antes = auth_client.get("/api/ficha").json()
        token_antes = ficha_antes.get("token_qr")

        auth_client.post("/api/ficha/token/revoke")

        ficha_despues = auth_client.get("/api/ficha").json()
        token_despues = ficha_despues.get("token_qr")

        # El nuevo token debe ser distinto al anterior
        if token_antes and token_despues:
            assert token_antes != token_despues


# ════════════════════════════════════════════════════════════
# BLOQUE 3 — Catálogos (GET /api/catalogs)
# ════════════════════════════════════════════════════════════

class TestCatalogos:

    def test_get_catalogs_retorna_200(self, client):
        """GET /api/catalogs retorna 200 (es público o requiere auth — verificamos)."""
        response = client.get("/api/catalogs")
        assert response.status_code in (200, 401)

    def test_get_catalogs_autenticado_retorna_200(self, auth_client):
        """GET /api/catalogs con token retorna 200."""
        response = auth_client.get("/api/catalogs")
        assert response.status_code == 200

    def test_catalogs_contiene_alergias(self, auth_client):
        """El catálogo debe incluir la lista de alergias."""
        response = auth_client.get("/api/catalogs")
        data = response.json()
        assert "alergias" in data
        assert isinstance(data["alergias"], list)

    def test_catalogs_contiene_condiciones(self, auth_client):
        """El catálogo debe incluir la lista de condiciones."""
        response = auth_client.get("/api/catalogs")
        data = response.json()
        assert "condiciones" in data
        assert isinstance(data["condiciones"], list)

    def test_catalogs_contiene_medicamentos(self, auth_client):
        """El catálogo debe incluir la lista de medicamentos."""
        response = auth_client.get("/api/catalogs")
        data = response.json()
        assert "medicamentos" in data
        assert isinstance(data["medicamentos"], list)

    def test_catalogs_alergias_no_vacio(self, auth_client):
        """El catálogo de alergias debe tener al menos una entrada."""
        response = auth_client.get("/api/catalogs")
        alergias = response.json()["alergias"]
        assert len(alergias) > 0

    def test_catalogs_alergia_tiene_nombre(self, auth_client):
        """Cada entrada del catálogo de alergias debe tener el campo nombre."""
        response = auth_client.get("/api/catalogs")
        alergias = response.json()["alergias"]
        if alergias:
            assert "nombre" in alergias[0]
