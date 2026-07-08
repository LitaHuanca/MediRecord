"""
PRUEBAS UNITARIAS — Módulo de QR y Emergencia
Responsable: Aldana
Módulo: generación de tokens, construcción de URLs, validación de acceso
Descripción: Prueba funciones de negocio del QR sin tocar la base de datos.
"""
import pytest
import uuid
import re


# ── Funciones de negocio a testear ───────────────────────────────────────────

def generar_token_uuid() -> str:
    """Genera un UUID v4 como token QR."""
    return str(uuid.uuid4())


def construir_url_emergencia(base_url: str, token: str) -> str:
    """Construye la URL pública de la vista paramédico."""
    return f"{base_url.rstrip('/')}/emergency/{token}"


def es_uuid_valido(token: str) -> bool:
    """Verifica que el token sea un UUID v4 válido."""
    patron = r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    return bool(re.match(patron, token, re.IGNORECASE))


def token_esta_activo(token_activo: str, token_a_verificar: str) -> bool:
    """Verifica si el token a verificar coincide con el token activo del perfil."""
    return token_activo is not None and token_activo == token_a_verificar


# ════════════════════════════════════════════════════════════
# BLOQUE 1 — Generación de tokens UUID
# ════════════════════════════════════════════════════════════

class TestGenerarTokenUUID:

    def test_token_es_string(self):
        """El token generado debe ser un string."""
        token = generar_token_uuid()
        assert isinstance(token, str)

    def test_token_no_es_vacio(self):
        """El token no debe estar vacío."""
        token = generar_token_uuid()
        assert len(token) > 0

    def test_token_es_uuid_v4_valido(self):
        """El token debe tener formato UUID v4."""
        token = generar_token_uuid()
        assert es_uuid_valido(token) is True

    def test_dos_tokens_consecutivos_son_distintos(self):
        """Cada generación produce un token único."""
        token1 = generar_token_uuid()
        token2 = generar_token_uuid()
        assert token1 != token2

    def test_multiples_tokens_son_unicos(self):
        """100 tokens generados no deben tener duplicados."""
        tokens = {generar_token_uuid() for _ in range(100)}
        assert len(tokens) == 100


# ════════════════════════════════════════════════════════════
# BLOQUE 2 — Construcción de URL de emergencia
# ════════════════════════════════════════════════════════════

class TestConstruirUrlEmergencia:

    def test_url_contiene_token(self):
        """La URL construida debe incluir el token."""
        token = "abc123-token"
        url = construir_url_emergencia("https://medirecor-deployada.vercel.app", token)
        assert token in url

    def test_url_contiene_ruta_emergency(self):
        """La URL debe incluir /emergency/ como ruta."""
        token = generar_token_uuid()
        url = construir_url_emergencia("https://medirecor-deployada.vercel.app", token)
        assert "/emergency/" in url

    def test_url_sin_doble_slash(self):
        """No debe haber doble slash entre base y ruta."""
        token = generar_token_uuid()
        url = construir_url_emergencia("https://medirecor-deployada.vercel.app/", token)
        assert "//emergency" not in url

    def test_url_formato_completo(self):
        """La URL debe tener el formato exacto esperado."""
        token = "test-token-123"
        url = construir_url_emergencia("https://medirecor-deployada.vercel.app", token)
        assert url == "https://medirecor-deployada.vercel.app/emergency/test-token-123"

    def test_url_con_staging_base(self):
        """La URL funciona también con la base de staging."""
        token = generar_token_uuid()
        url = construir_url_emergencia(
            "https://medirecor-deployada-2aspxo5m1-lita-park-s-projects.vercel.app",
            token
        )
        assert url.startswith("https://")
        assert token in url


# ════════════════════════════════════════════════════════════
# BLOQUE 3 — Validación de UUID
# ════════════════════════════════════════════════════════════

class TestEsUuidValido:

    def test_uuid_v4_valido(self):
        token = str(uuid.uuid4())
        assert es_uuid_valido(token) is True

    def test_uuid_todo_ceros_invalido(self):
        """UUID de todos ceros no es v4."""
        assert es_uuid_valido("00000000-0000-0000-0000-000000000000") is False

    def test_string_aleatorio_invalido(self):
        assert es_uuid_valido("esto-no-es-un-uuid") is False

    def test_uuid_sin_guiones_invalido(self):
        assert es_uuid_valido("550e8400e29b41d4a716446655440000") is False

    def test_cadena_vacia_invalida(self):
        assert es_uuid_valido("") is False


# ════════════════════════════════════════════════════════════
# BLOQUE 4 — Estado del token (activo/revocado)
# ════════════════════════════════════════════════════════════

class TestTokenEstaActivo:

    def test_token_coincide_con_activo(self):
        """Un token que coincide con el activo del perfil está activo."""
        token = generar_token_uuid()
        assert token_esta_activo(token, token) is True

    def test_token_no_coincide_con_activo(self):
        """Un token diferente al activo (revocado) no está activo."""
        token_activo = generar_token_uuid()
        token_viejo = generar_token_uuid()
        assert token_esta_activo(token_activo, token_viejo) is False

    def test_sin_token_activo_retorna_false(self):
        """Si el perfil no tiene token activo (None), el acceso es denegado."""
        token_cualquiera = generar_token_uuid()
        assert token_esta_activo(None, token_cualquiera) is False

    def test_ambos_none_retorna_false(self):
        """Si ambos son None, el acceso es denegado."""
        assert token_esta_activo(None, None) is False
