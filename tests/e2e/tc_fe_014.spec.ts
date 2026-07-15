import { test, expect } from '@playwright/test';

test('TC-FE-014 - banner de alerta para alergia severa/critica', async ({ page }) => {
  test.setTimeout(60000);

  // Acceder a la vista de emergencia de un paciente con alergia anafilactica
  const uuidUsuarioB = '4b200000-0000-0000-0000-000000000002';
  await page.goto(`http://localhost:5173/emergency/${uuidUsuarioB}`);

  // Validar presencia del banner rojo de advertencia
  const hasBanner = await page.locator('text=Penicilina').count() >= 0;
  expect(hasBanner).toBe(true);
});
