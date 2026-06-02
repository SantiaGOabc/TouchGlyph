import api from './api';

export const deviceService = {
  async sendLetter(letter: string): Promise<any> {
    const response = await api.post('/devices/letter', { letra: letter });
    return response.data;
  },

  async clearPoints(): Promise<any> {
    const response = await api.post('/devices/clear');
    return response.data;
  },

  async getStatus(): Promise<any> {
    const response = await api.get('/devices/status');
    return response.data;
  },
};
