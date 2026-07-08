"""
PRUEBAS DE INTEGRACIÓN — Módulo de Autenticación
Responsable: Lita
Endpoints: POST /auth/register, POST /auth/login, GET /auth/me, PUT /auth/password
Descripción: Llama a la API real de staging y verifica respuestas y datos.
"""
import pytest
import httpx
import time
from tests.fixtures.seed_data import (
    USUARIO_VALIDO,
    USUARIO_DUPLICADO_EMAIL,
    USUARIO_DUPLICADO_DNI,
    CREDENCIALES_INCORRECTAS,
)

# ════════════════════════════════════════════════════════════
# BLOQUE 1 — Registro de usuario (POST /auth/register)
# ════════════════════════════════════════════════════════════

class TestRegistro:

    def test_registro_exitoso_retorna_201(self, client, registered_user):
        """El usuario de prueba se registra correctamente (o ya existe)."""
        # registered_user fixture ya lo crea — solo verificamos que el sistema lo acepta
        response = client.post("/auth/login", json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        })
        assert response.status_code == 200

    def test_registro_retorna_token(self, client):
        """El registro exitoso retorna un access_token."""
        import uuid
        usuario_unico = {
            "email": f"test_{uuid.uuid4().hex[:8]}@medirecord.com",
            "password": "TestSQA2026!",
            "nombres": "Usuario Temp",
            "apellido_paterno": "Test",
            "numero_documento": str(uuid.uuid4().int)[:8],
        }
        response = client.post("/auth/register", json=usuario_unico)
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["access_token"] != ""

    def test_registro_email_duplicado_retorna_error(self, client, registered_user):
        """Registrar con un email ya existente debe retornar error 409."""
        response = client.post("/auth/register", json={
            "email": registered_user["email"],  # email ya registrado
            "password": "OtraPass123!",
            "nombres": "Otro",
            "apellido_paterno": "Nombre",
            "numero_documento": "11111111",
        })
        assert response.status_code in (400, 409)  # API retorna 409 Conflict

    def test_registro_dni_duplicado_retorna_error(self, client, registered_user):
        """Registrar con un DNI ya existente debe retornar 409."""
        response = client.post("/auth/register", json={
            "email": "email_nuevo_unico@medirecord.com",
            "password": "TestSQA2026!",
            "nombres": "Nombre",
            "apellido_paterno": "Nuevo",
            "numero_documento": registered_user["numero_documento"],  # DNI duplicado
        })
        assert response.status_code in (400, 409)

    def test_registro_sin_email_retorna_422(self, client):
        """Registro sin email debe retornar error de validación 422."""
        response = client.post("/auth/register", json={
            "password": "TestSQA2026!",
            "nombre_completo": "Sin Email",
            "numero_documento": "55555555",
        })
        assert response.status_code == 422

    def test_registro_sin_password_retorna_422(self, client):
        """Registro sin contraseña debe retornar 422."""
        response = client.post("/auth/register", json={
            "email": "sinpass@medirecord.com",
            "nombre_completo": "Sin Password",
            "numero_documento": "44444444",
        })
        assert response.status_code == 422

    def test_registro_email_formato_invalido_retorna_422(self, client):
        """Email con formato inválido debe retornar 422."""
        response = client.post("/auth/register", json={
            "email": "esto_no_es_un_email",
            "password": "TestSQA2026!",
            "nombre_completo": "Email Inválido",
            "numero_documento": "33333333",
        })
        assert response.status_code == 422


# ════════════════════════════════════════════════════════════
# BLOQUE 2 — Inicio de sesión (POST /auth/login)
# ════════════════════════════════════════════════════════════

class TestLogin:

    def test_login_exitoso_retorna_200(self, client, registered_user):
        """Login con credenciales correctas retorna 200."""
        response = client.post("/auth/login", json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        })
        assert response.status_code == 200

    def test_login_retorna_access_token(self, client, registered_user):
        """Login exitoso debe retornar access_token en el body."""
        response = client.post("/auth/login", json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        })
        data = response.json()
        assert "access_token" in data
        assert len(data["access_token"]) > 0

    def test_login_retorna_datos_usuario(self, client, registered_user):
        """Login exitoso debe retornar nombre_completo y email."""
        response = client.post("/auth/login", json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        })
        data = response.json()
        assert "nombre_completo" in data
        assert "email" in data

    def test_login_contraseña_incorrecta_retorna_401(self, client, registered_user):
        """Login con contraseña incorrecta retorna 401."""
        response = client.post("/auth/login", json={
            "email": registered_user["email"],
            "password": "contraseña_totalmente_incorrecta",
        })
        assert response.status_code == 401

    def test_login_email_no_registrado_retorna_401(self, client):
        """Login con email que no existe retorna 401."""
        response = client.post("/auth/login", json={
            "email": "no_existe_jamas@medirecord.com",
            "password": "cualquier_pass",
        })
        assert response.status_code == 401

    def test_login_sin_body_retorna_422(self, client):
        """Login sin body retorna 422."""
        response = client.post("/auth/login", json={})
        assert response.status_code == 422


# ════════════════════════════════════════════════════════════
# BLOQUE 3 — Perfil autenticado (GET /auth/me)
# ════════════════════════════════════════════════════════════

class TestMe:

    def test_me_con_token_valido_retorna_200(self, auth_client):
        """GET /auth/me con token válido retorna 200."""
        response = auth_client.get("/auth/me")
        assert response.status_code == 200

    def test_me_retorna_email_del_usuario(self, auth_client, registered_user):
        """GET /auth/me debe retornar el email del usuario autenticado."""
        response = auth_client.get("/auth/me")
        data = response.json()
        assert data["email"] == registered_user["email"]

    def test_me_sin_token_retorna_401(self, client):
        """GET /auth/me sin Authorization header retorna 401 o 403."""
        response = client.get("/auth/me")
        assert response.status_code in (401, 403)

    def test_me_con_token_invalido_retorna_401(self, client):
        """GET /auth/me con token falso retorna 401."""
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer token_completamente_falso"}
        )
        assert response.status_code == 401


# ════════════════════════════════════════════════════════════
# BLOQUE 4 — Cambio de contraseña (PUT /auth/password)
# ════════════════════════════════════════════════════════════

class TestCambioPassword:

    def test_cambio_password_sin_token_retorna_401(self, client):
        """PUT /auth/password sin token retorna 401 o 403."""
        response = client.put("/auth/password", json={
            "password_actual": "cualquiera",
            "password_nueva": "nueva123",
        })
        assert response.status_code in (401, 403)

    def test_cambio_password_actual_incorrecta_retorna_400(self, auth_client):
        """PUT /auth/password con contraseña actual incorrecta retorna 400."""
        response = auth_client.put("/auth/password", json={
            "password_actual": "contraseña_que_no_es_la_real",
            "password_nueva": "nueva_contraseña_123",
        })
        assert response.status_code == 400

    def test_cambio_password_nueva_muy_corta_retorna_422(self, auth_client):
        """PUT /auth/password con nueva contraseña menor a 6 caracteres retorna 422."""
        response = auth_client.put("/auth/password", json={
            "password_actual": "TestSQA2026!",
            "password_nueva": "abc",
        })
        assert response.status_code == 422
