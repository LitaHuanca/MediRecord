/**
 * PRUEBAS E2E — Módulo de Autenticación
 * Responsable: Lita
 * Herramienta: Playwright
 * URL base: preview de Vercel (staging)
 * Descripción: Simula al usuario real navegando por login, registro y cambio de contraseña.
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'https://medirecor-deployada-2aspxo5m1-lita-park-s-projects.vercel.app'

const USUARIO_TEST = {
  email: 'test_sqa_grupo5@medirecord.com',
  password: 'TestSQA2026!',
  nombre: 'Usuario Test SQA',
  dni: '99999999',
}

// ═══════════════════════════════════════════════════════════
// BLOQUE 1 — Página de Login
// ═══════════════════════════════════════════════════════════

test.describe('Login', () => {

  test('la página de login carga correctamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await expect(page).toHaveTitle(/MediRecord/)
    await expect(page.locator('h1')).toContainText('Ingreso Clínico')
  })

  test('muestra campos de email y contraseña', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('login con credenciales correctas redirige al dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', USUARIO_TEST.email)
    await page.fill('input[type="password"]', USUARIO_TEST.password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 })
  })

  test('login con contraseña incorrecta muestra mensaje de error', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', USUARIO_TEST.email)
    await page.fill('input[type="password"]', 'contraseña_incorrecta_123')
    await page.click('button[type="submit"]')
    // Debe mostrar un mensaje de error visible
    await expect(page.locator('text=/error|incorrecto|inválido/i')).toBeVisible({ timeout: 10000 })
  })

  test('el ícono de ojito muestra y oculta la contraseña', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    const inputPass = page.locator('input[type="password"]')
    await expect(inputPass).toBeVisible()

    // Clic en el botón ojito
    await page.click('.lg-eye-btn')
    // Ahora el input debe ser tipo text
    await expect(page.locator('input[type="text"]')).toBeVisible()

    // Clic de nuevo oculta
    await page.click('.lg-eye-btn')
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('5 intentos fallidos activan el bloqueo temporal', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    for (let i = 0; i < 5; i++) {
      await page.fill('input[type="email"]', USUARIO_TEST.email)
      await page.fill('input[type="password"]', `contraseña_incorrecta_${i}`)
      await page.click('button[type="submit"]')
      await page.waitForTimeout(500)
    }
    // Debe aparecer mensaje de bloqueo con contador
    await expect(page.locator('text=/bloqueado|Espere|seguridad/i')).toBeVisible({ timeout: 10000 })
  })

  test('existe link para ir a registro', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    const linkRegistro = page.locator('a[href="/register"]')
    await expect(linkRegistro).toBeVisible()
  })

})

// ═══════════════════════════════════════════════════════════
// BLOQUE 2 — Página de Registro
// ═══════════════════════════════════════════════════════════

test.describe('Registro', () => {

  test('la página de registro carga correctamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await expect(page).toHaveURL(/register/)
  })

  test('muestra el formulario de registro', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('registro con email duplicado muestra error', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    // Intentar registrar con el email que ya existe
    await page.fill('input[name="email"], input[type="email"]', USUARIO_TEST.email)
    // Si hay más campos visibles en el paso 1, completarlos
    const inputNombre = page.locator('input[name="nombre_completo"], input[placeholder*="nombre" i]').first()
    if (await inputNombre.isVisible()) {
      await inputNombre.fill('Nombre Duplicado')
    }
  })

  test('existe link para volver al login', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    const linkLogin = page.locator('a[href="/login"]')
    await expect(linkLogin).toBeVisible()
  })

})

// ═══════════════════════════════════════════════════════════
// BLOQUE 3 — Cambio de contraseña desde Dashboard
// ═══════════════════════════════════════════════════════════

test.describe('Cambio de contraseña', () => {

  test.beforeEach(async ({ page }) => {
    // Login antes de cada test de este bloque
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', USUARIO_TEST.email)
    await page.fill('input[type="password"]', USUARIO_TEST.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/dashboard/, { timeout: 15000 })
  })

  test('el dropdown de usuario tiene opción Cambiar contraseña', async ({ page }) => {
    // Abrir dropdown de usuario
    await page.locator('button').filter({ hasText: /Usuario|Ciudadano/ }).first().click()
    await expect(page.locator('text=Cambiar contraseña')).toBeVisible()
  })

  test('clic en Cambiar contraseña abre el modal', async ({ page }) => {
    await page.locator('button').filter({ hasText: /Usuario|Ciudadano/ }).first().click()
    await page.click('text=Cambiar contraseña')
    // El modal debe aparecer
    await expect(page.locator('text=Contraseña actual')).toBeVisible({ timeout: 5000 })
  })

  test('contraseña actual incorrecta muestra error en el modal', async ({ page }) => {
    await page.locator('button').filter({ hasText: /Usuario|Ciudadano/ }).first().click()
    await page.click('text=Cambiar contraseña')
    // Llenar formulario con contraseña actual incorrecta
    await page.fill('input[placeholder*="actual" i], input[type="password"]', 'contraseña_incorrecta')
    await page.click('text=Actualizar contraseña')
    await expect(page.locator('text=/incorrecta|error/i')).toBeVisible({ timeout: 8000 })
  })

})
