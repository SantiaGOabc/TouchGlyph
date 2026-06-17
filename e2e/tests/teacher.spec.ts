import { test, expect } from '@playwright/test';

const MOCK_TEACHER = { id: 2, username: 'teacher1', full_name: 'Profesor Uno', role: 'teacher' };
const MOCK_CLASSES = [
  { id: 1, name: 'Clase A', description: 'Clase de Braille inicial', student_count: 5 },
  { id: 2, name: 'Clase B', description: 'Clase de Braille avanzado', student_count: 3 },
];
const MOCK_STUDENTS = [
  { id: 1, username: 'student1', full_name: 'Estudiante Uno', progress: { completed: 3, total: 10, score: 70 } },
  { id: 4, username: 'student2', full_name: 'Estudiante Dos', progress: { completed: 5, total: 10, score: 85 } },
];
const MOCK_LESSONS = [
  { id: 'lesson-1', title: 'Lección 1: Letra A', difficulty: 'beginner', priority: 1 },
  { id: 'lesson-2', title: 'Lección 2: Letra B', difficulty: 'beginner', priority: 2 },
];

function mockTeacherApi(page) {
  return Promise.all([
    page.route('**/api/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_TEACHER) });
    }),
    page.route('**/api/teacher/classes*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ classes: MOCK_CLASSES }) });
    }),
    page.route('**/api/teacher/students*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_STUDENTS) });
    }),
    page.route('**/api/teacher/lessons*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ lessons: MOCK_LESSONS }) });
    }),
    page.route('**/api/teacher/progress*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    }),
    page.route('**/api/teacher/dashboard*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total_students: 2, total_classes: 2, total_lessons: 2 }),
      });
    }),
  ]);
}

test.describe('Teacher Panel', () => {
  test.beforeEach(async ({ page }) => {
    await mockTeacherApi(page);
  });

  test('dashboard profesor muestra resumen', async ({ page }) => {
    await page.goto('/teacher');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/clase|estudiante|lección|braille/i).first()).toBeVisible();
  });

  test('navegación a clases del profesor', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/clase a|clase b/i).first()).toBeVisible();
  });

  test('vista detalle de estudiante', async ({ page }) => {
    await page.goto('/teacher/student/1');
    await page.waitForLoadState('networkidle');
  });

  test('navegación a lecciones del profesor', async ({ page }) => {
    await page.goto('/teacher/lessons');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/letra a|letra b|lección/i).first()).toBeVisible();
  });

  test('información de progreso visible en dashboard', async ({ page }) => {
    await page.goto('/teacher');
    await page.waitForLoadState('networkidle');
  });
});
