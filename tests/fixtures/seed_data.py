"""
Datos de prueba reutilizables para los tests de MediRecord.
Ningún dato aquí corresponde a una persona real.
"""

# ── Usuarios ficticios ────────────────────────────────────────────────────────
USUARIO_VALIDO = {
    "email": "test_sqa_grupo5@medirecord.com",
    "password": "TestSQA2026!",
    "nombre_completo": "Usuario Test SQA",
    "numero_documento": "99999999",
}

USUARIO_DUPLICADO_EMAIL = {
    "email": "test_sqa_grupo5@medirecord.com",  # mismo email
    "password": "OtraPass123",
    "nombre_completo": "Otro Usuario",
    "numero_documento": "88888888",
}

USUARIO_DUPLICADO_DNI = {
    "email": "otro_test@medirecord.com",
    "password": "OtraPass123",
    "nombre_completo": "Otro Usuario DNI",
    "numero_documento": "99999999",  # mismo DNI
}

USUARIO_SIN_EMAIL = {
    "password": "TestSQA2026!",
    "nombre_completo": "Sin Email",
    "numero_documento": "77777777",
}

# ── Credenciales incorrectas ──────────────────────────────────────────────────
CREDENCIALES_INCORRECTAS = {
    "email": "test_sqa_grupo5@medirecord.com",
    "password": "contraseña_incorrecta",
}

# ── Datos de ficha vital ──────────────────────────────────────────────────────
DATOS_PERSONALES = {
    "telefono": "987654321",
    "tipo_sangre": "O+",
    "sexo": "Femenino",
    "fecha_nacimiento": "1995-03-15",
    "donante_organos": True,
    "peso_kg": 60.5,
    "altura_cm": 165,
    "notas_adicionales": "Paciente de prueba SQA — no usar en producción.",
}

# ── Alergias de prueba ────────────────────────────────────────────────────────
ALERGIA_PENICILINA = {
    "severidad": "Severa",
    "reaccion": "Anafilaxia",
}

ALERGIA_LEVE = {
    "severidad": "Leve",
    "reaccion": "Urticaria leve",
}

# ── Condición crónica de prueba ───────────────────────────────────────────────
CONDICION_DIABETES = {
    "estado": "Controlada",
    "tratamiento": "Metformina 500mg",
}

# ── Medicamento de prueba ─────────────────────────────────────────────────────
MEDICAMENTO_TEST = {
    "dosis": "500mg",
    "frecuencia": "Dos veces al día",
    "notas": "Tomar con alimentos",
}

# ── Contacto de emergencia de prueba ─────────────────────────────────────────
CONTACTO_TEST = {
    "nombre": "Contacto Prueba SQA",
    "telefono": "912345678",
    "relacion": "Familiar",
    "orden_prioridad": 1,
}

# ── Tokens de prueba para emergencia ─────────────────────────────────────────
TOKEN_INVALIDO = "00000000-0000-0000-0000-000000000000"
TOKEN_FORMATO_INCORRECTO = "esto-no-es-un-uuid"
