"""
PRUEBAS UNITARIAS — Módulo de Autenticación
Responsable: Lita
Módulo: app/routers/auth.py
Descripción: Prueba funciones aisladas de autenticación sin tocar la base de datos.
"""
import sys
import os
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta, timezone

# Permite importar desde backend/app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

# ── Setup mínimo para importar sin DB real ────────────────────────────────────
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://fake:fake@localhost/fake")
os.environ.setdefault("JWT_SECRET", "clave_secreta_para_tests_unitarios_sqa")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_EXPIRE_MINUTES", "1440")
os.environ.setdefault("FRONTEND_URL", "http://localhost:5173")

from app.routers.auth import hash_password, verify_password, create_token
from jose import jwt, JWTError


# ════════════════════════════════════════════════════════════
# BLOQUE 1 — hash_password
# ════════════════════════════════════════════════════════════

class TestHashPassword:

    def test_hash_es_diferente_al_texto_plano(self):
        """El hash nunca debe ser igual a la contraseña original."""
        hashed = hash_password("mi_contraseña_123")
        assert hashed != "mi_contraseña_123"

    def test_hash_empieza_con_prefijo_bcrypt(self):
        """bcrypt siempre genera hashes que empiezan con $2b$."""
        hashed = hash_password("cualquier_contraseña")
        assert hashed.startswith("$2b$")

    def test_dos_hashes_del_mismo_password_son_distintos(self):
        """bcrypt usa salt aleatorio — dos hashes del mismo texto deben diferir."""
        hash1 = hash_password("misma_contraseña")
        hash2 = hash_password("misma_contraseña")
        assert hash1 != hash2

    def test_hash_no_es_vacio(self):
        """El hash resultante no debe ser vacío."""
        hashed = hash_password("abc")
        assert len(hashed) > 0


# ════════════════════════════════════════════════════════════
# BLOQUE 2 — verify_password
# ════════════════════════════════════════════════════════════

class TestVerifyPassword:

    def test_contraseña_correcta_retorna_true(self):
        """verify_password debe retornar True cuando la contraseña coincide."""
        password = "contraseña_correcta_2026"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True

    def test_contraseña_incorrecta_retorna_false(self):
        """verify_password debe retornar False cuando la contraseña no coincide."""
        hashed = hash_password("contraseña_real")
        assert verify_password("contraseña_incorrecta", hashed) is False

    def test_contraseña_vacia_no_coincide_con_hash(self):
        """Una contraseña vacía no debe coincidir con el hash de otra contraseña."""
        hashed = hash_password("contraseña_real")
        assert verify_password("", hashed) is False

    def test_contraseña_con_espacios_distingue_correctamente(self):
        """La verificación es sensible a espacios."""
        hashed = hash_password("contraseña sin espacios")
        assert verify_password("contraseñasin espacios", hashed) is False

    def test_contraseña_case_sensitive(self):
        """La verificación es sensible a mayúsculas/minúsculas."""
        hashed = hash_password("MiContraseña")
        assert verify_password("micontraseña", hashed) is False


# ════════════════════════════════════════════════════════════
# BLOQUE 3 — create_token
# ════════════════════════════════════════════════════════════

class TestCreateToken:

    def test_token_es_string_no_vacio(self):
        """create_token debe retornar un string no vacío."""
        token = create_token("usuario-uuid-123")
        assert isinstance(token, str)
        assert len(token) > 0

    def test_token_contiene_user_id_correcto(self):
        """El payload del token debe contener el user_id en el campo 'sub'."""
        user_id = "usuario-uuid-456"
        token = create_token(user_id)
        payload = jwt.decode(
            token,
            os.environ["JWT_SECRET"],
            algorithms=[os.environ["JWT_ALGORITHM"]]
        )
        assert payload["sub"] == user_id

    def test_token_contiene_expiracion(self):
        """El payload del token debe contener el campo 'exp'."""
        token = create_token("usuario-uuid-789")
        payload = jwt.decode(
            token,
            os.environ["JWT_SECRET"],
            algorithms=[os.environ["JWT_ALGORITHM"]]
        )
        assert "exp" in payload

    def test_dos_tokens_del_mismo_usuario_son_distintos(self):
        """Dos tokens generados en distintos momentos deben diferir (por el timestamp)."""
        import time
        token1 = create_token("mismo-usuario")
        time.sleep(1)
        token2 = create_token("mismo-usuario")
        assert token1 != token2

    def test_token_con_secret_incorrecto_falla(self):
        """Decodificar un token con secret incorrecto debe lanzar JWTError."""
        token = create_token("usuario-uuid-000")
        with pytest.raises(JWTError):
            jwt.decode(token, "secret_incorrecto", algorithms=["HS256"])
