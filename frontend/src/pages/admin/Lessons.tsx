import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';
import api from '../../services/api';

interface Lesson {
  id: number;
  title: string;
  difficulty: string;
  step_count: number;
  active: number;
}

const AdminLessons = () => {
  const { t } = useTranslation();
  const { data: lessons, isLoading, isError, error } = useQuery<Lesson[]>({
    queryKey: ['adminLessons'],
    queryFn: () => api.get('/admin/lessons').then(res => res.data.lessons),
  });

  if (isLoading) return <div className="loading-container" role="status"><div className="spinner spinner-dark"></div><span className="loading-text">{t('common.loading')}</span></div>;
  if (isError) return <div className="alert alert-error">{t('common.error')}: {(error as any)?.message}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2><BookOpen size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />{t('nav.lessons')}</h2>
      </div>
      {!lessons || lessons.length === 0 ? (
        <div className="card text-center">{t('admin.noClasses')}</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>{t('admin.id')}</th><th>{t('admin.title')}</th><th>{t('admin.difficulty')}</th><th>{t('admin.steps')}</th><th>{t('admin.active')}</th></tr>
            </thead>
            <tbody>
              {lessons.map(l => (
                <tr key={l.id}>
                  <td data-label={t('admin.id')}>{l.id}</td>
                  <td data-label={t('admin.title')}>{l.title}</td>
                  <td data-label={t('admin.difficulty')}><span className="badge badge-info">{l.difficulty}</span></td>
                  <td data-label={t('admin.steps')}>{l.step_count}</td>
                  <td data-label={t('admin.active')}>{l.active ? <span className="badge badge-success">{t('admin.yes')}</span> : <span className="badge badge-error">{t('admin.no')}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminLessons;
