import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users, GraduationCap, BookOpen } from 'lucide-react';
import api from '../../services/api';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { data: users } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api.get('/admin/users').then(res => res.data.users),
  });
  const { data: classes } = useQuery({
    queryKey: ['adminClasses'],
    queryFn: () => api.get('/admin/classes').then(res => res.data.classes),
  });
  const { data: lessons } = useQuery({
    queryKey: ['adminLessons'],
    queryFn: () => api.get('/admin/lessons').then(res => res.data.lessons),
  });

  return (
    <div>
      <h2>{t('admin.title')}</h2>
      <div className="stats-grid" style={{ marginTop: '1rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-primary)', color: 'white' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{users?.length || 0}</span>
            <span className="stat-label">{t('nav.users')}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#3b82f6', color: 'white' }}>
            <GraduationCap size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{classes?.length || 0}</span>
            <span className="stat-label">{t('nav.classes')}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#8b5cf6', color: 'white' }}>
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{lessons?.length || 0}</span>
            <span className="stat-label">{t('nav.lessons')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
