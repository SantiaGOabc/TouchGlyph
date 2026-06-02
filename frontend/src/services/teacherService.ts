import api from './api';

export interface TeacherDashboardData {
  classes: any[];
  students: any[];
  lessons: any[];
}

export interface LessonData {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  total_steps: number;
}

export const teacherService = {
  async getDashboard(): Promise<TeacherDashboardData> {
    const response = await api.get('/teacher/dashboard');
    return response.data;
  },

  async getMyClasses(): Promise<any[]> {
    const response = await api.get('/teacher/classes');
    return response.data.classes;
  },

  async getStudentDetails(studentId: string): Promise<any> {
    const response = await api.get(`/teacher/student/${studentId}`);
    return response.data;
  },

  async getLessons(): Promise<LessonData[]> {
    const response = await api.get('/teacher/lessons');
    return response.data.lessons;
  },

  async getLessonById(lessonId: string): Promise<LessonData> {
    const response = await api.get(`/teacher/lessons/${lessonId}`);
    return response.data;
  },

  async createLesson(lessonData: Partial<LessonData>): Promise<{ message: string; lesson: LessonData }> {
    const response = await api.post('/teacher/lessons', lessonData);
    return response.data;
  },

  async updateLesson(lessonId: string, lessonData: Partial<LessonData>): Promise<{ message: string; lesson: LessonData }> {
    const response = await api.put(`/teacher/lessons/${lessonId}`, lessonData);
    return response.data;
  },

  async deleteLesson(lessonId: string): Promise<{ message: string }> {
    const response = await api.delete(`/teacher/lessons/${lessonId}`);
    return response.data;
  },

  async assignLessonToClass(lessonId: string, classId: string, dueDate: string | null = null): Promise<{ message: string }> {
    const response = await api.post(`/teacher/lessons/${lessonId}/assign`, {
      class_id: classId,
      due_date: dueDate,
    });
    return response.data;
  },
};
