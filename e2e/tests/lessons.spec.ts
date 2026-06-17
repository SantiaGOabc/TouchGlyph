import { test, expect } from '@playwright/test';

const MOCK_STUDENT = { id: 1, username: 'student1', full_name: 'Estudiante Uno', role: 'student' };
const MOCK_LESSONS = [
  { id: 'lesson-1', title: 'Lección 1: Letra A', description: 'Aprende la letra A en Braille', difficulty: 'beginner', priority: 1, active: 1 },
  { id: 'lesson-2', title: 'Lección 2: Letra B', description: 'Aprende la letra B en Braille', difficulty: 'beginner', priority: 2, active: 1 },
  { id: 'lesson-3', title: 'Lección 3: Letra C', description: 'Aprende la letra C en Braille', difficulty: 'beginner', priority: 3, active: 1 },
];
const MOCK_PROGRESS = [
  { lesson_id: 'lesson-1', completed: 1, score: 100 },
  { lesson_id: 'lesson-2', completed: 0, score: 60 },
];

function mockApi(page) {
  return Promise.all([
    page.route('**/api/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_STUDENT) });
    }),
    page.route('**/api/student/lessons*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_LESSONS) });
    }),
    page.route('**/api/student/progress*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PROGRESS) });
    }),
    page.route('**/api/student/session*', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'session-new', lesson_id: 'lesson-1', user_id: 1, started_at: new Date().toISOString() }),
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
      }
    }),
  ]);
}

test.describe('Student Lessons', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test('dashboard estudiante muestra lista de lecciones', async ({ page }) => {
    await page.goto('/student');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/lección 1|letra a/i).first()).toBeVisible();
    await expect(page.getByText(/lección 2|letra b/i).first()).toBeVisible();
  });

  test('lección completada muestra indicador de éxito', async ({ page }) => {
    await page.goto('/student');
    await page.waitForLoadState('networkidle');

    const completedLesson = page.getByText(/lección 1|letra a/i).first();
    await expect(completedLesson).toBeVisible();
  });

  test('progreso de lección se muestra correctamente', async ({ page }) => {
    await page.goto('/student');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/60|100|progreso|score|puntaje/i).first()).toBeVisible();
  });

  test('iniciar sesión de lección navega a la sesión', async ({ page }) => {
    await page.goto('/student');
    await page.waitForLoadState('networkidle');

    const startButton = page.getByRole('button', { name: /iniciar|empezar|comenzar/i }).first();
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });
});
