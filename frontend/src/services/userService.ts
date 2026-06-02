import api from './api';

export interface UserData {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserData;
}

export const userService = {
  async register(userData: Record<string, any>): Promise<any> {
    const response = await api.post('/register', userData);
    return response.data;
  },

  async login(credentials: { username: string; password: string }): Promise<LoginResponse> {
    const response = await api.post('/login', credentials);
    return response.data;
  },

  async loginWithFace(imageBase64: string): Promise<LoginResponse> {
    const response = await api.post('/face/login', { image_base64: imageBase64 });
    return response.data;
  },

  async registerFace(userId: string, imageBase64: string): Promise<any> {
    const response = await api.post('/face/register', {
      user_id: userId,
      image_base64: imageBase64,
    });
    return response.data;
  },

  async checkFaceStatus(userId: string): Promise<any> {
    const response = await api.get(`/face/status/${userId}`);
    return response.data;
  },

  async getFaceImage(userId: string): Promise<any> {
    const response = await api.get(`/face/image/${userId}`);
    return response.data;
  },

  async deleteFace(userId: string): Promise<any> {
    const response = await api.delete(`/face/${userId}`);
    return response.data;
  },
};
