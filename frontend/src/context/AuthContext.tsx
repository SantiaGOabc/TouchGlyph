import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'admin' | 'teacher' | 'student';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  loginWithFace: (imageBase64: string) => Promise<{ access_token: string; user: User }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/me')
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    const response = await api.post('/login', { username, password });
    const userData: User = response.data.user;
    setUser(userData);
    return userData;
  };

  const loginWithFace = async (imageBase64: string) => {
    const response = await api.post('/face/login', { image_base64: imageBase64 });
    const { access_token, user: userData } = response.data;
    setUser(userData);
    return { access_token, user: userData };
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch {
      // even if the request fails, clear local state
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithFace, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
