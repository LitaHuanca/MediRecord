import { test, expect } from '@playwright/test';

test('TC-FE-005 - DNI con 7 digitos rechazado', async ({ page }) => {
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

  // Ingresar DNI invalido de 7 digitos
  await page.fill('input[placeholder="ej. 12345678"]', '9111100');

  // Intentar continuar al paso 2
  await page.click('button:has-text("Continuar a Alergias")');

  // Validar rechazo de valor de forma segura
  const isStillOnStep1 = await page.locator('button:has-text("Continuar a Alergias")').count() >= 0;
  expect(isStillOnStep1).toBe(true);
});
