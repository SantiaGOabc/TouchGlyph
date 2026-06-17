import { test, expect } from '@playwright/test';

const MOCK_ADMIN = { id: 3, username: 'admin1', full_name: 'Admin Uno', role: 'admin' };
const MOCK_USERS = [
  { id: 1, username: 'student1', full_name: 'Estudiante Uno', role: 'student', active: 1 },
  { id: 2, username: 'teacher1', full_name: 'Profesor Uno', role: 'teacher', active: 1 },
  { id: 3, username: 'admin1', full_name: 'Admin Uno', role: 'admin', active: 1 },
];
const MOCK_CLASSES = [
  { id: 1, name: 'Clase A', description: 'Clase de Braille inicial', teacher_id: 2, active: 1, student_count: 5 },
  { id: 2, name: 'Clase B', description: 'Clase de Braille avanzado', teacher_id: 2, active: 1, student_count: 3 },
];
const MOCK_DEVICES = [
  { id: 'esp32-01', name: 'Display Aula 1', assigned_user_id: null, active: 1, last_seen: '2026-06-17T10:00:00Z' },
];

function mockAdminApi(page) {
  return Promise.all([
    page.route('**/api/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ADMIN) });
    }),
    page.route('**/api/admin/users*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USERS) });
      } else {
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 4 }) });
      }
    }),
    page.route('**/api/admin/classes*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CLASSES) });
    }),
    page.route('**/api/admin/devices*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DEVICES) });
    }),
    page.route('**/api/admin/lessons*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }),
  ]);
}

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminApi(page);
  });

  test('dashboard admin muestra secciones principales', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/usuarios|users|estudiantes|dashboard/i).first()).toBeVisible();
  });

  test('navegación a gestión de usuarios', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/student1|teacher1|admin1/i).first()).toBeVisible();
  });

  test('navegación a gestión de clases', async ({ page }) => {
    await page.goto('/admin/classes');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/clase a|clase b|class/i).first()).toBeVisible();
  });

  test('navegación a gestión de dispositivos', async ({ page }) => {
    await page.goto('/admin/devices');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/display aula|esp32/i).first()).toBeVisible();
  });

  test('navegación a gestión de lecciones', async ({ page }) => {
    await page.goto('/admin/lessons');
    await page.waitForLoadState('networkidle');
  });
});
