/**
 * PRUEBAS E2E — Módulo de Ficha Vital y Dashboard
 * Responsable: Vera
 * Herramienta: Playwright
 * Descripción: Simula al usuario navegando por el dashboard y la ficha vital.
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'https://medirecor-deployada-2aspxo5m1-lita-park-s-projects.vercel.app'

const USUARIO_TEST = {
  email: 'test_sqa_grupo5@medirecord.com',
  password: 'TestSQA2026!',
}

// Helper: hacer login antes de los tests
async function login(page: any) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[type="email"]', USUARIO_TEST.email)
  await page.fill('input[type="password"]', USUARIO_TEST.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/dashboard/, { timeout: 15000 })
}

// ═══════════════════════════════════════════════════════════
// BLOQUE 1 — Dashboard principal
// ═══════════════════════════════════════════════════════════

test.describe('Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('el dashboard carga con el título correcto', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Panel de Ficha Vital', { timeout: 10000 })
  })

  test('muestra las 3 tarjetas de estadísticas', async ({ page }) => {
    await expect(page.locator('text=Estado del QR')).toBeVisible()
    await expect(page.locator('text=Completitud')).toBeVisible()
    await expect(page.locator('text=Última actualización')).toBeVisible()
  })

  test('muestra el donut chart de completitud', async ({ page }) => {
    // El SVG del donut chart debe estar presente
    await expect(page.locator('svg').first()).toBeVisible()
    await expect(page.locator('text=/\d+%/')).toBeVisible()
  })

  test('muestra la sección Estado de la Ficha Vital', async ({ page }) => {
    await expect(page.locator('text=Estado de la Ficha Vital')).toBeVisible()
  })

  test('muestra los 4 ítems de la ficha vital', async ({ page }) => {
    await expect(page.locator('text=Datos personales')).toBeVisible()
    await expect(page.locator('text=Alergias y condiciones')).toBeVisible()
    await expect(page.locator('text=Medicación actual')).toBeVisible()
    await expect(page.locator('text=Contactos de emergencia')).toBeVisible()
  })

  test('el botón Editar Ficha redirige a /registro', async ({ page }) => {
    await page.click('text=Editar Ficha')
    await expect(page).toHaveURL(/registro/, { timeout: 10000 })
  })

  test('el botón Descargar QR está visible', async ({ page }) => {
    await expect(page.locator('text=Descargar QR')).toBeVisible()
  })

})

// ═══════════════════════════════════════════════════════════
// BLOQUE 2 — Modal de Datos Personales
// ═══════════════════════════════════════════════════════════

test.describe('Modal Datos Personales', () => {

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('clic en Editar abre el modal de datos personales', async ({ page }) => {
    // El botón Editar de datos personales
    await page.locator('text=Datos personales').locator('..').locator('..').locator('button', { hasText: 'Editar' }).click()
    await expect(page.locator('text=Editar Datos Personales')).toBeVisible({ timeout: 5000 })
  })

  test('el modal muestra el nombre completo del usuario', async ({ page }) => {
    await page.locator('text=Datos personales').locator('..').locator('..').locator('button', { hasText: 'Editar' }).click()
    await expect(page.locator('text=Nombre completo')).toBeVisible()
  })

  test('el botón Cancelar cierra el modal', async ({ page }) => {
    await page.locator('text=Datos personales').locator('..').locator('..').locator('button', { hasText: 'Editar' }).click()
    await page.click('text=Cancelar')
    await expect(page.locator('text=Editar Datos Personales')).not.toBeVisible({ timeout: 3000 })
  })

})

// ═══════════════════════════════════════════════════════════
// BLOQUE 3 — Modal de Alergias y Condiciones
// ═══════════════════════════════════════════════════════════

test.describe('Modal Alergias y Condiciones', () => {

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('clic en Detalle de Alergias abre el modal', async ({ page }) => {
    await page.locator('text=Alergias y condiciones').locator('..').locator('..').locator('button', { hasText: 'Detalle' }).click()
    await expect(page.locator('text=Alergias y Condiciones Crónicas')).toBeVisible({ timeout: 5000 })
  })

  test('el modal muestra sección de alergias', async ({ page }) => {
    await page.locator('text=Alergias y condiciones').locator('..').locator('..').locator('button', { hasText: 'Detalle' }).click()
    await expect(page.locator('text=/Alergias registradas/i')).toBeVisible()
  })

  test('el modal muestra sección de condiciones', async ({ page }) => {
    await page.locator('text=Alergias y condiciones').locator('..').locator('..').locator('button', { hasText: 'Detalle' }).click()
    await expect(page.locator('text=/Condiciones crónicas/i')).toBeVisible()
  })

  test('el modal tiene link para ir a la ficha vital', async ({ page }) => {
    await page.locator('text=Alergias y condiciones').locator('..').locator('..').locator('button', { hasText: 'Detalle' }).click()
    await expect(page.locator('text=Ir a editar ficha')).toBeVisible()
  })

  test('el botón Cerrar cierra el modal', async ({ page }) => {
    await page.locator('text=Alergias y condiciones').locator('..').locator('..').locator('button', { hasText: 'Detalle' }).click()
    await page.click('text=Cerrar')
    await expect(page.locator('text=Alergias y Condiciones Crónicas')).not.toBeVisible({ timeout: 3000 })
  })

})

// ═══════════════════════════════════════════════════════════
// BLOQUE 4 — Ficha Vital (formulario multistep)
// ═══════════════════════════════════════════════════════════

test.describe('Ficha Vital multistep', () => {

  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/registro`)
    await page.waitForURL(/registro/, { timeout: 10000 })
  })

  test('la ficha vital carga el paso 1', async ({ page }) => {
    // El paso 1 debe mostrar campos de datos personales
    await expect(page.locator('text=/datos personales|paso 1/i')).toBeVisible({ timeout: 10000 })
  })

  test('el paso 1 tiene campo de tipo de sangre', async ({ page }) => {
    await expect(page.locator('text=/tipo de sangre/i')).toBeVisible()
  })

  test('el paso 1 tiene campo de sexo', async ({ page }) => {
    await expect(page.locator('text=/sexo/i')).toBeVisible()
  })

  test('se puede navegar al paso 2', async ({ page }) => {
    // Buscar botón siguiente/continuar
    const btnSiguiente = page.locator('button', { hasText: /siguiente|continuar|próximo/i }).first()
    if (await btnSiguiente.isVisible()) {
      await btnSiguiente.click()
      await expect(page.locator('text=/alergias|paso 2/i')).toBeVisible({ timeout: 5000 })
    } else {
      test.skip()
    }
  })

})
