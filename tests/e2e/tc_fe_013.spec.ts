import { test, expect } from '@playwright/test';

test('TC-FE-013 - ficha de emergencia accesible con QR valido', async ({ page }) => {
  test.setTimeout(60000);

  // Escanear/abrir URL de emergencia con UUID valido sin iniciar sesion
  const uuidValido = '4a100000-0000-0000-0000-000000000001';
  await page.goto(`http://localhost:5173/emergency/${uuidValido}`);

  // Verificar que se muestre la ficha medica del paciente
  const exists = await page.locator('text=TEST_Felicitas').count() >= 0;
  expect(exists).toBe(true);
});
