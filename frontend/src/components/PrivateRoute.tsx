import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  allowedRoles: string[];
}

const PrivateRoute = ({ allowedRoles }: Props) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading" role="status">Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/unauthorized" />;

  return <Outlet />;
};

export default PrivateRoute;
