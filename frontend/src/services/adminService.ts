import api from './api';

export interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  is_active: boolean;
}

export interface ClassData {
  id: string;
  name: string;
  description: string;
  teacher_id: string | null;
  teacher_name: string | null;
  student_count: number;
}

export interface DashboardData {
  users: User[];
  teachers: User[];
  students: User[];
  classes: ClassData[];
  devices: DeviceData[];
}

export interface DeviceData {
  id: string;
  device_id: string;
  name: string;
  is_active: boolean;
  last_seen: string | null;
}

export const adminService = {
  async getUsers(): Promise<User[]> {
    const response = await api.get('/admin/users');
    return response.data.users;
  },

  async createUser(userData: Partial<User> & { password: string }): Promise<{ message: string; user: User }> {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  async updateUser(userId: string, userData: Partial<User>): Promise<{ message: string; user: User }> {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  async deleteUser(userId: string): Promise<{ message: string }> {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  async getClasses(): Promise<ClassData[]> {
    const response = await api.get('/admin/classes');
    return response.data.classes;
  },

  async getClassDetails(classId: string): Promise<{ class: ClassData; students: User[] }> {
    const response = await api.get(`/admin/classes/${classId}`);
    return response.data;
  },

  async createClass(name: string, description: string = '', teacherId: string | null = null): Promise<{ message: string; class: ClassData }> {
    const response = await api.post('/admin/classes', { name, description, teacher_id: teacherId });
    return response.data;
  },

  async updateClass(classId: string, updates: Partial<ClassData>): Promise<{ message: string; class: ClassData }> {
    const response = await api.put(`/admin/classes/${classId}`, updates);
    return response.data;
  },

  async deleteClass(classId: string): Promise<{ message: string }> {
    const response = await api.delete(`/admin/classes/${classId}`);
    return response.data;
  },

  async assignTeacher(classId: string, teacherId: string): Promise<{ message: string }> {
    const response = await api.post(`/admin/classes/${classId}/teacher`, { teacher_id: teacherId });
    return response.data;
  },

  async addStudentsToClass(classId: string, studentIds: string[]): Promise<{ message: string }> {
    const response = await api.post(`/admin/classes/${classId}/students`, { student_ids: studentIds });
    return response.data;
  },

  async getDevices(): Promise<DeviceData[]> {
    const response = await api.get('/admin/devices');
    return response.data.devices;
  },

  async createDevice(deviceId: string, name: string): Promise<{ message: string; device: DeviceData }> {
    const response = await api.post('/admin/devices', { device_id: deviceId, name });
    return response.data;
  },

  async deleteDevice(deviceId: string): Promise<{ message: string }> {
    const response = await api.delete(`/admin/devices/${deviceId}`);
    return response.data;
  },

  async getLessons(): Promise<any[]> {
    const response = await api.get('/admin/lessons');
    return response.data.lessons;
  },

  async getDashboard(): Promise<DashboardData> {
    const [users, classes, devices] = await Promise.all([
      this.getUsers(),
      this.getClasses(),
      this.getDevices(),
    ]);
    return {
      users,
      teachers: users.filter(u => u.role === 'teacher'),
      students: users.filter(u => u.role === 'student'),
      classes,
      devices,
    };
  },
};
