import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_ADMIN, ROLE_TEACHER, ROLE_STUDENT } from '../constants/roles';

interface CardProps {
  to: string;
  title: string;
  desc: string;
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '1.5rem',
  width: '220px',
  background: '#fff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  transition: 'box-shadow 0.2s',
  cursor: 'pointer',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;

  return (
    <div>
      <h1>Panel Principal</h1>
      <p>Rol actual: <strong>{role}</strong></p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
        {role === ROLE_ADMIN && (
          <>
            <div style={cardStyle} role="button" tabIndex={0} onClick={() => navigate('/admin/users')} onKeyDown={(e) => { if (e.key === 'Enter') navigate('/admin/users'); }}>
              <h3>Usuarios</h3><p>Gestionar cuentas</p>
            </div>
            <div style={cardStyle} role="button" tabIndex={0} onClick={() => navigate('/admin/classes')} onKeyDown={(e) => { if (e.key === 'Enter') navigate('/admin/classes'); }}>
              <h3>Clases</h3><p>Administrar clases</p>
            </div>
            <div style={cardStyle} role="button" tabIndex={0} onClick={() => navigate('/admin/devices')} onKeyDown={(e) => { if (e.key === 'Enter') navigate('/admin/devices'); }}>
              <h3>Dispositivos</h3><p>Gestionar ESP32</p>
            </div>
            <div style={cardStyle} role="button" tabIndex={0} onClick={() => navigate('/admin/lessons')} onKeyDown={(e) => { if (e.key === 'Enter') navigate('/admin/lessons'); }}>
              <h3>Lecciones</h3><p>Ver todas las lecciones</p>
            </div>
          </>
        )}
        {role === ROLE_TEACHER && (
          <>
            <div style={cardStyle} role="button" tabIndex={0} onClick={() => navigate('/teacher')} onKeyDown={(e) => { if (e.key === 'Enter') navigate('/teacher'); }}>
              <h3>Dashboard Profesor</h3><p>Estadísticas y progreso</p>
            </div>
            <div style={cardStyle} role="button" tabIndex={0} onClick={() => navigate('/teacher/classes')} onKeyDown={(e) => { if (e.key === 'Enter') navigate('/teacher/classes'); }}>
              <h3>Mis Clases</h3><p>Ver estudiantes</p>
            </div>
            <div style={cardStyle} role="button" tabIndex={0} onClick={() => navigate('/teacher/lessons')} onKeyDown={(e) => { if (e.key === 'Enter') navigate('/teacher/lessons'); }}>
              <h3>Lecciones</h3><p>Crear y asignar lecciones</p>
            </div>
          </>
        )}
        {role === ROLE_STUDENT && (
          <div style={cardStyle} role="button" tabIndex={0} onClick={() => navigate('/student')} onKeyDown={(e) => { if (e.key === 'Enter') navigate('/student'); }}>
            <h3>Mis Lecciones</h3><p>Practicar Braille</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
