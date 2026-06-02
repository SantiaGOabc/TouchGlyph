import api from './api';

export interface StudentLessonsResponse {
  lessons: any[];
  stats: {
    completed: number;
    total_score: number;
    total: number;
  };
}

export const studentService = {
  async getLessons(showCompleted: boolean = false): Promise<StudentLessonsResponse> {
    const response = await api.get(`/student/lessons?show_completed=${showCompleted}`);
    return response.data;
  },

  async startSession(lessonId: string): Promise<string> {
    const response = await api.post('/student/start-session', { lesson_id: lessonId });
    return response.data.session_id;
  },

  async getPrompt(sessionId: string): Promise<any> {
    const response = await api.get(`/student/session/${sessionId}/prompt`);
    return response.data;
  },

  async submitAnswer(sessionId: string, answer: string): Promise<any> {
    const response = await api.post(`/student/session/${sessionId}/submit`, { answer });
    return response.data;
  },

  async skipStep(sessionId: string): Promise<any> {
    const response = await api.post(`/student/session/${sessionId}/skip`);
    return response.data;
  },
};
