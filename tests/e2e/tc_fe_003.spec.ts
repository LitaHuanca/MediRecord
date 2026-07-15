import { test, expect } from "@playwright/test";

test("TC-FE-003 - Ficha vital completada al 100%", async ({ page }) => {
  test.setTimeout(90000);
  page.on("console", (msg) => console.log("BROWSER LOG:", msg.text()));
  page.on("pageerror", (err) => console.log("BROWSER ERROR:", err.message));
  page.on("request", (req) => {
    if (req.url().includes("/api/") || req.url().includes("/auth/")) {
      console.log(`REQ: ${req.method()} ${req.url()}`);
    }
  });
  page.on("response", (res) => {
    if (res.url().includes("/api/") || res.url().includes("/auth/")) {
      console.log(`RES: ${res.status()} ${res.url()}`);
    }
  });

  // Go to login page
  await page.goto("http://localhost:5173/login");

  // Login with provided credentials
  await page.fill('input[type="email"]', "test_usuario_f@medirecord.com");
  await page.fill('input[type="password"]', "test_usuario_f");
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 45000 });
  console.log("Logged in, URL is:", page.url());
  let token = await page.evaluate(() => localStorage.getItem("mr_token"));
  console.log("Token in dashboard:", token ? token.substring(0, 15) : "NULL");

  // Click on "Editar Ficha" to go to the multistep form
  await page.click('a:has-text("Editar Ficha")');
  await expect(page).toHaveURL(/.*registro/, { timeout: 45000 });
  console.log("Navigated to /registro, URL is:", page.url());
  token = await page.evaluate(() => localStorage.getItem("mr_token"));
  console.log("Token in /registro:", token ? token.substring(0, 15) : "NULL");

  // Step 1: Datos Vitales y Filiación
  // Fill text fields
  await page.fill(
    'input[placeholder="ej. Juan Carlos Pérez Alva"]',
    "TEST_Usuario_F",
  );
  await page.fill('input[placeholder="ej. 12345678"]', "91111006");
  await page.fill('input[placeholder="ej. 987654321"]', "999999999");
  await page.fill('input[type="date"]', "1995-10-10");

  // Select Blood Type O+
  const bloodSelect = page
    .locator('label:has-text("Tipo de Sangre")')
    .locator("..")
    .getByRole("button")
    .first();
  await bloodSelect.click();
  await page
    .locator('label:has-text("Tipo de Sangre")')
    .locator("..")
    .getByRole("button", { name: "O+" })
    .last()
    .click();

  // Select Sexo Biológico Femenino
  const sexSelect = page
    .locator('label:has-text("Sexo Biológico")')
    .locator("..")
    .getByRole("button")
    .first();
  await sexSelect.click();
  await page
    .locator('label:has-text("Sexo Biológico")')
    .locator("..")
    .getByRole("button", { name: "Femenino" })
    .last()
    .click();

  // Peso and Altura
  await page.fill('input[placeholder="ej. 72.5"]', "60");
  await page.fill('input[placeholder="ej. 175"]', "165");

  // Check organ donor
  await page.check("input#donante");

  // Fill critical notes
  await page.fill(
    'textarea[placeholder*="ej. Marcapasos implantado"]',
    "Ninguna nota crítica de momento.",
  );

  // Click "Continuar a Alergias →"
  await page.click('button:has-text("Continuar a Alergias")');

  // Step 2: Alergias
  // Click on "— Buscar alergia —" dropdown
  await page.getByRole("button", { name: "— Buscar alergia —" }).click();
  // Fill search input
  await page
    .locator('input[placeholder*="Buscar por nombre"]')
    .fill("Penicilina");
  // Click "Penicilina" option
  await page.getByRole("button", { name: "Penicilina" }).click();
  // Fill reaction
  await page.fill(
    'input[placeholder="ej. Urticaria severa, shock anafiláctico con cianosis"]',
    "Urticaria leve",
  );
  // Click "Agregar alergia a la lista"
  await page.click('button:has-text("Agregar alergia a la lista")');
  // Click "Continuar a Condiciones →"
  await page.click('button:has-text("Continuar a Condiciones")');

  // Step 3: Condiciones
  // Click on "— Buscar condición —" dropdown
  await page.getByRole("button", { name: "— Buscar condición —" }).click();
  // Fill search input
  await page
    .locator('input[placeholder*="Buscar por nombre"]')
    .fill("Diabetes tipo 1");
  // Click "Diabetes tipo 1" option
  await page.getByRole("button", { name: "Diabetes tipo 1" }).click();
  // Fill treatment
  await page.fill(
    'input[placeholder="ej. Losartán 50 mg cada 12 h, dieta hiposódica"]',
    "Insulina NPH",
  );
  // Click "Agregar condición a la lista"
  await page.click('button:has-text("Agregar condición a la lista")');
  // Click "Continuar a Fármacos →"
  await page.click('button:has-text("Continuar a Fármacos")');

  // Step 4: Medicamentos
  // Click on "— Buscar medicamento —" dropdown
  await page.getByRole("button", { name: "— Buscar medicamento —" }).click();
  // Search for "Metformina"
  await page
    .locator('input[placeholder*="Buscar por nombre"]')
    .fill("Metformina");

  // Check if Metformina is already in the catalog (if not, add it)
  const addBtn = page.locator("button.cat-add-new-btn");
  if ((await addBtn.count()) > 0 && (await addBtn.isVisible())) {
    console.log("Metformina not found in catalog, adding it...");
    await addBtn.click();
    await page
      .locator('label:has-text("Categoría")')
      .locator("..")
      .getByRole("button")
      .click();
    await page.getByRole("button", { name: "Antidiabético" }).click();
    await page.click('button:has-text("Confirmar y agregar")');
  } else {
    console.log("Metformina was already in the catalog, clicking option...");
    await page
      .locator("button:not(.cat-add-new-btn)")
      .filter({ hasText: "Metformina" })
      .click();
  }
  // Fill Dose
  await page.fill('input[placeholder="ej. 850 mg, 10 UI, 0.5 mg"]', "850 mg");
  // Select Frequency "Cada 12 horas"
  await page
    .getByRole("button", { name: "— Seleccionar frecuencia —" })
    .click();
  await page.getByRole("button", { name: "Cada 12 horas" }).click();
  // Fill observations
  await page.fill(
    'input[placeholder="ej. No suspender bajo ninguna circunstancia"]',
    "Tomar después del desayuno.",
  );
  // Click "Agregar medicamento a la lista"
  await page.click('button:has-text("Agregar medicamento a la lista")');
  // Click "Continuar a Contactos →"
  await page.click('button:has-text("Continuar a Contactos")');

  // Step 5: Contactos
  // Fill first contact
  await page
    .locator('input[placeholder="ej. María Pérez"]')
    .first()
    .fill("TEST_Contacto_Emergencia");
  await page
    .locator('input[placeholder="ej. 987654321"]')
    .first()
    .fill("912345678");
  // Click "Finalizar y Crear Código QR"
  await page.click('button:has-text("Finalizar y Crear Código QR")');

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 45000 });
  await expect(page.locator("text=100%").first()).toBeVisible({
    timeout: 45000,
  });
});
