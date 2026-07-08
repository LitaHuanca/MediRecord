"""
PRUEBAS UNITARIAS — Módulo de Ficha Vital y Dashboard
Responsable: Vera
Módulo: lógica de completitud, validaciones de campos
Descripción: Prueba funciones de negocio sin tocar la base de datos.
"""
import pytest
from datetime import date, timedelta


# ── Funciones de negocio extraídas para testear ───────────────────────────────
# Estas funciones replican la lógica del backend/frontend de manera aislada.

def calcular_completitud(nombre_completo, alergias_o_condiciones, tipo_sangre, medicamentos, contactos):
    """Réplica de la lógica de completitud del dashboard."""
    items = [
        bool(nombre_completo),
        bool(alergias_o_condiciones),
        bool(tipo_sangre),
        bool(medicamentos),
        bool(contactos),
    ]
    completados = sum(items)
    return round((completados / len(items)) * 100)


def validar_telefono(telefono: str) -> bool:
    """Teléfono peruano: 9 dígitos, empieza con 9."""
    return bool(telefono) and len(telefono) == 9 and telefono.startswith("9") and telefono.isdigit()


def validar_fecha_nacimiento(fecha: date) -> bool:
    """La fecha de nacimiento no puede ser futura ni demasiado antigua."""
    hoy = date.today()
    return fecha <= hoy and fecha >= date(1900, 1, 1)


def validar_peso(peso_kg: float) -> bool:
    """Peso entre 20 y 300 kg."""
    return 20 <= peso_kg <= 300


def validar_altura(altura_cm: int) -> bool:
    """Altura entre 50 y 250 cm."""
    return 50 <= altura_cm <= 250


def validar_password(password: str) -> bool:
    """Contraseña mínima de 6 caracteres."""
    return len(password) >= 6


# ════════════════════════════════════════════════════════════
# BLOQUE 1 — Completitud de la ficha
# ════════════════════════════════════════════════════════════

class TestCalcularCompletitud:

    def test_ficha_vacia_retorna_0(self):
        """Sin ninguna sección completada, la completitud es 0%."""
        assert calcular_completitud("", [], "", [], []) == 0

    def test_solo_nombre_retorna_20(self):
        """Solo el nombre completo equivale al 20%."""
        assert calcular_completitud("Juan Pérez", [], "", [], []) == 20

    def test_todas_las_secciones_retorna_100(self):
        """Todas las secciones completas = 100%."""
        resultado = calcular_completitud(
            "Juan Pérez",
            [{"nombre": "Polen"}],
            "O+",
            [{"nombre": "Paracetamol"}],
            [{"nombre": "María Pérez"}],
        )
        assert resultado == 100

    def test_tres_secciones_retorna_60(self):
        """3 de 5 secciones = 60%."""
        resultado = calcular_completitud("Juan Pérez", [], "O+", [{"nombre": "Med"}], [])
        assert resultado == 60

    def test_tipo_sangre_vacio_cuenta_como_incompleto(self):
        """Tipo de sangre None o vacío no suma al porcentaje."""
        resultado = calcular_completitud("Juan Pérez", [], None, [], [])
        assert resultado == 20

    def test_lista_vacia_no_cuenta_como_completa(self):
        """Una lista vacía no cuenta como sección completada."""
        resultado = calcular_completitud("Juan Pérez", [], "O+", [], [])
        assert resultado == 40


# ════════════════════════════════════════════════════════════
# BLOQUE 2 — Validación de teléfono
# ════════════════════════════════════════════════════════════

class TestValidarTelefono:

    def test_telefono_valido(self):
        assert validar_telefono("987654321") is True

    def test_telefono_empieza_con_8_invalido(self):
        assert validar_telefono("887654321") is False

    def test_telefono_menos_de_9_digitos(self):
        assert validar_telefono("98765432") is False

    def test_telefono_mas_de_9_digitos(self):
        assert validar_telefono("9876543210") is False

    def test_telefono_con_letras_invalido(self):
        assert validar_telefono("98765432A") is False

    def test_telefono_vacio_invalido(self):
        assert validar_telefono("") is False

    def test_telefono_con_espacios_invalido(self):
        assert validar_telefono("987 654 32") is False


# ════════════════════════════════════════════════════════════
# BLOQUE 3 — Validación de fecha de nacimiento
# ════════════════════════════════════════════════════════════

class TestValidarFechaNacimiento:

    def test_fecha_pasada_valida(self):
        fecha_valida = date(1990, 5, 15)
        assert validar_fecha_nacimiento(fecha_valida) is True

    def test_fecha_futura_invalida(self):
        fecha_futura = date.today() + timedelta(days=1)
        assert validar_fecha_nacimiento(fecha_futura) is False

    def test_fecha_hoy_valida(self):
        assert validar_fecha_nacimiento(date.today()) is True

    def test_fecha_muy_antigua_invalida(self):
        assert validar_fecha_nacimiento(date(1800, 1, 1)) is False

    def test_fecha_1900_valida(self):
        assert validar_fecha_nacimiento(date(1900, 1, 1)) is True


# ════════════════════════════════════════════════════════════
# BLOQUE 4 — Validación de peso y altura
# ════════════════════════════════════════════════════════════

class TestValidarPesoAltura:

    def test_peso_valido(self):
        assert validar_peso(70.5) is True

    def test_peso_minimo_valido(self):
        assert validar_peso(20) is True

    def test_peso_maximo_valido(self):
        assert validar_peso(300) is True

    def test_peso_menor_al_minimo(self):
        assert validar_peso(19.9) is False

    def test_peso_mayor_al_maximo(self):
        assert validar_peso(300.1) is False

    def test_altura_valida(self):
        assert validar_altura(170) is True

    def test_altura_minima_valida(self):
        assert validar_altura(50) is True

    def test_altura_maxima_valida(self):
        assert validar_altura(250) is True

    def test_altura_menor_al_minimo(self):
        assert validar_altura(49) is False

    def test_altura_mayor_al_maximo(self):
        assert validar_altura(251) is False


# ════════════════════════════════════════════════════════════
# BLOQUE 5 — Validación de contraseña
# ════════════════════════════════════════════════════════════

class TestValidarPassword:

    def test_password_6_caracteres_valido(self):
        assert validar_password("abc123") is True

    def test_password_mas_de_6_valido(self):
        assert validar_password("contraseña_larga_2026") is True

    def test_password_5_caracteres_invalido(self):
        assert validar_password("abc12") is False

    def test_password_vacio_invalido(self):
        assert validar_password("") is False

    def test_password_solo_espacios_invalido(self):
        # 5 espacios no alcanzan los 6 caracteres mínimos
        assert validar_password("     ") is False
