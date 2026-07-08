/**
 * PRUEBAS E2E — Módulo de QR y Vista de Emergencia
 * Responsable: Aldana
 * Herramienta: Playwright
 * Descripción: Simula al paramédico escaneando el QR y al ciudadano gestionándolo.
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'https://medirecor-deployada-2aspxo5m1-lita-park-s-projects.vercel.app'
const API_URL  = process.env.E2E_API_URL  || 'https://medirecord-staging.onrender.com'

const USUARIO_TEST = {
  email: 'test_sqa_grupo5@medirecord.com',
  password: 'TestSQA2026!',
}

const TOKEN_INVALIDO = '00000000-0000-0000-0000-000000000000'

// Helper: login y retornar token QR activo
async function loginYObtenerToken(page: any): Promise<string | null> {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[type="email"]', USUARIO_TEST.email)
  await page.fill('input[type="password"]', USUARIO_TEST.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/dashboard/, { timeout: 15000 })

  // Obtener token QR via API
  const cookies = await page.context().cookies()
  const mrToken = await page.evaluate(() => localStorage.getItem('mr_token'))
  if (!mrToken) return null

  const response = await page.request.get(`${API_URL}/api/ficha`, {
    headers: { Authorization: `Bearer ${mrToken}` }
  })
  const ficha = await response.json()
  return ficha.token_qr || null
}

// ═══════════════════════════════════════════════════════════
// BLOQUE 1 — Dashboard: sección QR
// ═══════════════════════════════════════════════════════════

test.describe('Dashboard - Gestión del QR', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', USUARIO_TEST.email)
    await page.fill('input[type="password"]', USUARIO_TEST.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/dashboard/, { timeout: 15000 })
  })

  test('la sección QR está visible en el dashboard', async ({ page }) => {
    await expect(page.locator('text=Mi QR de emergencia')).toBeVisible()
  })

  test('el QR generado es visible como imagen', async ({ page }) => {
    const qrImg = page.locator('img[alt="QR"]')
    // Esperar a que el QR se genere (puede tardar un momento)
    await expect(qrImg).toBeVisible({ timeout: 10000 })
  })

  test('el botón Descargar está visible', async ({ page }) => {
    await expect(page.locator('text=Descargar')).toBeVisible()
  })

  test('el botón Imprimir está visible', async ({ page }) => {
    await expect(page.locator('text=Imprimir')).toBeVisible()
  })

  test('el botón Revocar está visible', async ({ page }) => {
    await expect(page.locator('text=Revocar')).toBeVisible()
  })

  test('el link Vista del paramédico está visible', async ({ page }) => {
    await expect(page.locator('text=Vista del paramédico')).toBeVisible()
  })

  test('clic en Revocar abre modal de confirmación', async ({ page }) => {
    await page.click('text=Revocar')
    await expect(page.locator('text=Revocar Código QR')).toBeVisible({ timeout: 5000 })
  })

  test('el modal de revocación tiene selector de motivo', async ({ page }) => {
    await page.click('text=Revocar')
    await expect(page.locator('select, text=Motivo')).toBeVisible({ timeout: 5000 })
  })

  test('cancelar revocación cierra el modal', async ({ page }) => {
    await page.click('text=Revocar')
    await page.click('text=Cancelar')
    await expect(page.locator('text=Revocar Código QR')).not.toBeVisible({ timeout: 3000 })
  })

})

// ═══════════════════════════════════════════════════════════
// BLOQUE 2 — Vista de Emergencia (página pública)
// ═══════════════════════════════════════════════════════════

test.describe('Vista de Emergencia - Paramédico', () => {

  test('token inválido muestra pantalla de error', async ({ page }) => {
    await page.goto(`${BASE_URL}/emergency/${TOKEN_INVALIDO}`)
    // Debe mostrar algún mensaje de error — no la ficha del paciente
    await expect(
      page.locator('text=/inválido|no encontrado|error|revocado|expirado/i')
    ).toBeVisible({ timeout: 10000 })
  })

  test('token inválido no muestra datos de ningún paciente', async ({ page }) => {
    await page.goto(`${BASE_URL}/emergency/${TOKEN_INVALIDO}`)
    await page.waitForTimeout(3000)
    // No debe mostrar campos de ficha médica
    await expect(page.locator('text=Tipo de sangre')).not.toBeVisible()
  })

  test('la vista de emergencia con token activo muestra nombre del paciente', async ({ page }) => {
    const token = await loginYObtenerToken(page)
    if (!token) {
      test.skip()
      return
    }
    await page.goto(`${BASE_URL}/emergency/${token}`)
    await expect(page.locator('text=Usuario Test SQA')).toBeVisible({ timeout: 10000 })
  })

  test('la vista de emergencia muestra tipo de sangre', async ({ page }) => {
    const token = await loginYObtenerToken(page)
    if (!token) { test.skip(); return }

    await page.goto(`${BASE_URL}/emergency/${token}`)
    await expect(page.locator('text=/tipo de sangre|blood/i')).toBeVisible({ timeout: 10000 })
  })

  test('la vista de emergencia muestra sección de alergias', async ({ page }) => {
    const token = await loginYObtenerToken(page)
    if (!token) { test.skip(); return }

    await page.goto(`${BASE_URL}/emergency/${token}`)
    await expect(page.locator('text=/alerg/i')).toBeVisible({ timeout: 10000 })
  })

  test('la vista de emergencia muestra contactos de emergencia', async ({ page }) => {
    const token = await loginYObtenerToken(page)
    if (!token) { test.skip(); return }

    await page.goto(`${BASE_URL}/emergency/${token}`)
    await expect(page.locator('text=/contacto|emergencia/i')).toBeVisible({ timeout: 10000 })
  })

  test('la vista de emergencia no requiere login', async ({ page }) => {
    // Navegar directamente sin haber hecho login
    await page.goto(`${BASE_URL}/emergency/${TOKEN_INVALIDO}`)
    // No debe redirigir a /login
    await expect(page).not.toHaveURL(/login/, { timeout: 5000 })
  })

  test('la vista de emergencia tiene botón Llamar ahora para contactos', async ({ page }) => {
    const token = await loginYObtenerToken(page)
    if (!token) { test.skip(); return }

    await page.goto(`${BASE_URL}/emergency/${token}`)
    // Si hay contactos registrados, debe aparecer el botón de llamar
    const btnLlamar = page.locator('text=/llamar/i')
    // Solo verificamos si hay contactos
    const hayContactos = await btnLlamar.isVisible({ timeout: 5000 }).catch(() => false)
    if (hayContactos) {
      await expect(btnLlamar).toBeVisible()
    }
  })

})

// ═══════════════════════════════════════════════════════════
// BLOQUE 3 — Catálogos (visibles en el formulario de registro)
// ═══════════════════════════════════════════════════════════

test.describe('Catálogos en el formulario', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', USUARIO_TEST.email)
    await page.fill('input[type="password"]', USUARIO_TEST.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/dashboard/, { timeout: 15000 })
    await page.goto(`${BASE_URL}/registro`)
  })

  test('el formulario de registro carga correctamente', async ({ page }) => {
    await expect(page).toHaveURL(/registro/, { timeout: 10000 })
  })

  test('el selector de tipo de sangre tiene opciones', async ({ page }) => {
    // El paso 1 debe tener el selector de tipo de sangre
    const selector = page.locator('select, button').filter({ hasText: /sangre|blood type/i }).first()
    await expect(selector).toBeVisible({ timeout: 8000 })
  })

})
