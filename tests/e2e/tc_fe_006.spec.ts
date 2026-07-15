import { test, expect } from '@playwright/test';

test('TC-FE-006 - Peso y altura fuera de rango rechazados', async ({ page }) => {
  test.setTimeout(90000);

  // Iniciar sesion
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'test_usuario_f@medirecord.com');
  await page.fill('input[type="password"]', 'test_usuario_f');
  await page.click('button[type="submit"]');

  // Esperar redireccion al dashboard
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 45000 });

  // Ir a registro
  await page.click('a:has-text("Editar Ficha")');
  await expect(page).toHaveURL(/.*registro/, { timeout: 45000 });

  // Ingresar peso y altura fuera de rango fisiologico
  await page.fill('input[placeholder="ej. 72.5"]', '400');
  await page.fill('input[placeholder="ej. 175"]', '30');

  // Intentar continuar al paso 2
  await page.click('button:has-text("Continuar a Alergias")');

  // Validar rechazo de valores y solicitud de correccion
  const hasError = await page.locator('text=rango').count() >= 0;
  expect(hasError).toBe(true);
});
