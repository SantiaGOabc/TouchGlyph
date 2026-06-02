import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Activity, Eye, ChevronRight } from 'lucide-react';
import api from '../../services/api';

const TeacherDashboard = () => {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['teacherDashboard'],
    queryFn: () => api.get('/teacher/dashboard').then(res => res.data),
  });

  if (isLoading) return <div className="loading-container" role="status"><div className="spinner spinner-dark"></div><span className="loading-text">{t('common.loading')}</span></div>;
  if (isError) return <div className="alert alert-error">Error: {(error as any)?.message}</div>;

  const { total_students, total_lessons, active_sessions, students } = data || {};

  return (
    <div>
      <h2>{t('nav.dashboardTeacher')}</h2>
      <div className="stats-grid" style={{ marginTop: '1rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#10b981', color: 'white' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{total_students || 0}</span>
            <span className="stat-label">Total estudiantes</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#3b82f6', color: 'white' }}>
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{total_lessons || 0}</span>
            <span className="stat-label">Total lecciones</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b', color: 'white' }}>
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{active_sessions || 0}</span>
            <span className="stat-label">Sesiones activas</span>
          </div>
        </div>
      </div>

      <h3 className="mt-3">Progreso de estudiantes</h3>
      {students && students.length > 0 ? (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Username</th>
                <th>Intentos</th>
                <th>Aciertos</th>
                <th>Precisión</th>
                <th>Completadas</th>
                <th>Última actividad</th>
                <th>{t('common.edit')}</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student: any) => (
                <tr key={student.id}>
                  <td data-label="Nombre">{student.full_name}</td>
                  <td data-label="Username">{student.username}</td>
                  <td data-label="Intentos">{student.attempts}</td>
                  <td data-label="Aciertos">{student.corrects}</td>
                  <td data-label="Precisión"><span className="badge badge-info">{student.accuracy}%</span></td>
                  <td data-label="Completadas"><span className="badge badge-success">{student.completed}</span></td>
                  <td data-label="Última actividad">{student.last_activity || <span className="badge badge-error">Nunca</span>}</td>
                  <td data-label={t('common.edit')}>
                    <div className="table-actions">
                      <Link to={`/teacher/student/${student.id}`} className="btn btn-ghost">
                        <Eye size={16} /> Ver <ChevronRight size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center">No hay estudiantes registrados.</div>
      )}
    </div>
  );
};

export default TeacherDashboard;
