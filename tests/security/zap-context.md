# OWASP ZAP — Contexto de escaneo MediRecord (Staging)

## Propósito

Define las URLs de staging que OWASP ZAP debe incluir y excluir durante el escaneo
automatizado de seguridad (TC-SEC-xxx).

---

## URLs incluidas en el escaneo

| Patrón | Motivo |
|---|---|
| `https://staging.medirecord.example.com/auth/*` | Endpoints de autenticación y JWT |
| `https://staging.medirecord.example.com/ficha/*` | Ficha de salud del ciudadano |
| `https://staging.medirecord.example.com/emergency/*` | Acceso público a ficha de emergencia |
| `https://staging.medirecord.example.com/qr/*` | Generación y validación de QR |
| `https://staging.medirecord.example.com/dashboard/*` | Dashboard autenticado |

## URLs excluidas del escaneo

| Patrón | Motivo |
|---|---|
| `https://staging.medirecord.example.com/docs` | Swagger UI — solo documentación |
| `https://staging.medirecord.example.com/redoc` | ReDoc — solo documentación |
| `https://staging.medirecord.example.com/openapi.json` | Schema OpenAPI — solo lectura |
| `https://staging.medirecord.example.com/static/*` | Assets estáticos sin lógica |

---

## Políticas de escaneo sugeridas

- **Activo**: OWASP Top 10 2021 — A01 a A10
- **Autenticación**: Bearer token obtenido con credenciales de `TEST_ciudadano_completo`
- **Spider**: desactivar en rutas de eliminación (`DELETE`) para evitar efectos colaterales
- **Alertas a reportar**: Medium, High, Critical

---

## Casos de prueba asociados

| ID | Descripción |
|---|---|
| TC-SEC-001 | Escaneo OWASP ZAP sobre endpoints públicos |
| TC-SEC-002 | Verificación de cabeceras de seguridad HTTP |
| TC-SEC-003 | Acceso sin token a endpoints protegidos |
