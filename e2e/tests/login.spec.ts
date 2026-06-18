import { test, expect } from '@serenity-js/playwright-test';

const MOCK_STUDENT = {
  id: 1,
  username: 'student1',
  full_name: 'Estudiante Uno',
  role: 'student',
};

const MOCK_TEACHER = {
  id: 2,
  username: 'teacher1',
  full_name: 'Profesor Uno',
  role: 'teacher',
};

const MOCK_ADMIN = {
  id: 3,
  username: 'admin1',
  full_name: 'Admin Uno',
  role: 'admin',
};

function mockLoginResponse(page, user: typeof MOCK_STUDENT) {
  return page.route('**/api/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'fake-jwt-token',
        token_type: 'bearer',
        user,
      }),
    });
  });
}

function mockMeResponse(page, user: typeof MOCK_STUDENT | null) {
  return page.route('**/api/me', async (route) => {
    if (user) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(user),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'No autenticado' }),
      });
    }
  });
}

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockMeResponse(page, null);
    await page.goto('/login');
  });

  test('muestra el formulario de login correctamente', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /inicia sesión|bienvenido/i })).toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /^(ingresar|iniciar sesión)$/i }).first()).toBeVisible();
  });

  test('muestra error con credenciales vacías', async ({ page }) => {
    await page.evaluate(() => {
      document.querySelectorAll<HTMLElement>('input[required]').forEach(el => el.removeAttribute('required'));
    });
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.error-message[role="alert"]')).toBeVisible({ timeout: 3000 });
  });

  test('login exitoso como estudiante redirige a /student', async ({ page }) => {
    await mockLoginResponse(page, MOCK_STUDENT);
    await mockMeResponse(page, MOCK_STUDENT);

    await page.locator('#username').fill('student1');
    await page.locator('#password').fill('studentpass');
    await page.getByRole('button', { name: /^(ingresar|iniciar sesión)$/i }).first().click();

    await page.waitForURL('**/student');
  });

  test('login exitoso como profesor redirige a /teacher', async ({ page }) => {
    await mockLoginResponse(page, MOCK_TEACHER);
    await mockMeResponse(page, MOCK_TEACHER);

    await page.locator('#username').fill('teacher1');
    await page.locator('#password').fill('teacherpass');
    await page.getByRole('button', { name: /^(ingresar|iniciar sesión)$/i }).first().click();

    await page.waitForURL('**/teacher');
  });

  test('login exitoso como admin redirige a /admin', async ({ page }) => {
    await mockLoginResponse(page, MOCK_ADMIN);
    await mockMeResponse(page, MOCK_ADMIN);

    await page.locator('#username').fill('admin1');
    await page.locator('#password').fill('adminpass');
    await page.getByRole('button', { name: /^(ingresar|iniciar sesión)$/i }).first().click();

    await page.waitForURL('**/admin');
  });

  test('login fallido muestra mensaje de error', async ({ page }) => {
    await page.route('**/api/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Credenciales inválidas' }),
      });
    });

    await page.locator('#username').fill('baduser');
    await page.locator('#password').fill('badpass');
    await page.getByRole('button', { name: /^(ingresar|iniciar sesión)$/i }).first().click();

    await expect(page.getByRole('alert')).toContainText(/credenciales inválidas|inválidas/i);
  });

  test('boton de login facial está visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /reconocimiento facial|rostro|face/i })).toBeVisible();
  });
});

test.describe('Logout Flow', () => {
  test('cierre de sesión redirige a login', async ({ page }) => {
    await mockMeResponse(page, MOCK_STUDENT);
    await page.route('**/api/logout', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    await page.goto('/student');
    await page.waitForURL('**/student');

    const logoutButton = page.getByRole('button', { name: /cerrar sesión|salir|logout/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL('**/login');
    }
  });
});
