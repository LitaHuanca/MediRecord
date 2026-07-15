# MediRecord — Suite de Pruebas

Este directorio contiene todas las suites de prueba del proyecto MediRecord, organizadas
por tipo y herramienta. **No modifica ni depende del código de la aplicación en `/backend`
o `/frontend`.**

---

## Estructura

```
tests/
├── backend/      Pruebas de componente e integración (pytest + httpx)
├── api/          Colecciones Postman / ejecución Newman
├── e2e/          Pruebas de sistema end-to-end (Playwright)
├── performance/  Pruebas de carga y rendimiento (k6)
├── security/     Configuración de escaneo OWASP ZAP
├── fixtures/     Datos de prueba ficticios compartidos (prefijo TEST_)
└── README.md     Este archivo
```

---

## Carpetas

### `/backend`
Pruebas de componente e integración sobre la API FastAPI.
- Herramienta: **pytest** + **httpx** + **pytest-cov**
- Configuración: `pytest.ini`, `conftest.py`
- Apunta al entorno de staging vía variable de entorno `STAGING_API_URL`

### `/api`
Colecciones Postman para pruebas de contrato y flujos de API.
- `collections/` — archivos `.json` exportados desde Postman
- `environment.staging.json` — variables de entorno de staging (sin credenciales reales)
- Ejecución automatizada con **Newman**

### `/e2e`
Pruebas de sistema que simulan flujos reales de usuario en el navegador.
- Herramienta: **Playwright** (TypeScript)
- Configuración: `playwright.config.ts`
- URL de staging vía variable de entorno `STAGING_FRONTEND_URL`
- Flujos cubiertos: ciudadano, paramédico

### `/performance`
Escenarios de prueba de carga y estrés.
- Herramienta: **k6**
- URL de staging vía variable de entorno `STAGING_API_URL`

### `/security`
Configuración para el escaneo automatizado de seguridad.
- Herramienta: **OWASP ZAP**
- `zap-context.md` — URLs incluidas/excluidas y políticas de escaneo

### `/fixtures`
Datos de prueba ficticios compartidos por todas las suites.
- Prefijo `TEST_` obligatorio en todos los identificadores
- `seed_data.json` — los 4 usuarios de prueba base

---

## Convención de IDs de casos de prueba

| Prefijo | Tipo de prueba | Herramienta |
|---|---|---|
| `TC-BE-xxx` | Backend — componente e integración | pytest |
| `TC-FE-xxx` | Frontend / E2E | Playwright |
| `TC-API-xxx` | Contrato de API | Postman / Newman |
| `TC-PERF-xxx` | Rendimiento y carga | k6 |
| `TC-SEC-xxx` | Seguridad | OWASP ZAP |

---

## Variables de entorno requeridas

| Variable | Usado por | Descripción |
|---|---|---|
| `STAGING_API_URL` | backend, performance | URL base de la API en staging |
| `STAGING_FRONTEND_URL` | e2e | URL base del frontend en staging |
| `TEST_EMERGENCY_UUID` | performance | UUID de ficha de emergencia de prueba |

Las credenciales nunca se almacenan en este repositorio.
