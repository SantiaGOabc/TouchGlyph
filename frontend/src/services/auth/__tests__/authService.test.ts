import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../authService';

import api from '../../api';

vi.mock('../../api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: { response: { use: vi.fn() } },
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('envía POST /login con username y password', async () => {
      const mockResponse = {
        data: {
          access_token: 'test-token-123',
          token_type: 'bearer',
          user: {
            id: '1',
            username: 'alumno1',
            full_name: 'Alumno Uno',
            email: 'alumno@test.com',
            role: 'student',
            is_active: true,
          },
        },
      };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authService.login({ username: 'alumno1', password: '123456' });

      expect(api.post).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledWith('/login', { username: 'alumno1', password: '123456' });
      expect(result.access_token).toBe('test-token-123');
      expect(result.user.username).toBe('alumno1');
      expect(result.user.role).toBe('student');
    });

    it('propaga el error cuando el login falla', async () => {
      const errorResponse = { response: { status: 401, data: { detail: 'Credenciales inválidas' } } };
      vi.mocked(api.post).mockRejectedValue(errorResponse);

      await expect(authService.login({ username: 'malo', password: 'mal' })).rejects.toEqual(errorResponse);
    });
  });

  describe('loginWithFace', () => {
    it('envía POST /face/login con image_base64', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { access_token: 'face-token', user: { username: 'alumno1', role: 'student' } },
      });

      const result = await authService.loginWithFace('data:image/jpeg;base64,abc123');

      expect(api.post).toHaveBeenCalledWith('/face/login', { image_base64: 'data:image/jpeg;base64,abc123' });
      expect(result.access_token).toBe('face-token');
    });
  });

  describe('register', () => {
    it('envía POST /register con los datos del usuario', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { id: '2', username: 'nuevo' },
      });

      const result = await authService.register({ username: 'nuevo', password: 'pass', role: 'student' });

      expect(api.post).toHaveBeenCalledWith('/register', { username: 'nuevo', password: 'pass', role: 'student' });
      expect(result.username).toBe('nuevo');
    });
  });
});
