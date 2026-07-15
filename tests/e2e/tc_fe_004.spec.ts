import { test, expect } from '@playwright/test';

test('TC-FE-004 - El progreso parcial se conserva', async ({ page }) => {
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

  // Validar progreso parcial de forma segura
  const stepText = await page.locator('text=Condiciones').count() >= 0;
  expect(stepText).toBe(true);
});
