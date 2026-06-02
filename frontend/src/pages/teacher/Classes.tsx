import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Users, BookOpen, Eye, ChevronRight } from 'lucide-react';
import api from '../../services/api';

interface Student {
  id: number;
  full_name: string;
  username: string;
  completed_lessons: number;
  total_score: number;
}

interface ClassItem {
  id: number;
  name: string;
  description: string;
  student_count: number;
  lesson_count: number;
  students: Student[];
}

const TeacherClasses = () => {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useQuery<ClassItem[]>({
    queryKey: ['teacherClasses'],
    queryFn: () => api.get('/teacher/classes').then(res => res.data.classes),
  });

  if (isLoading) return <div className="loading-container" role="status"><div className="spinner spinner-dark"></div><span className="loading-text">{t('common.loading')}</span></div>;
  if (isError) return <div className="alert alert-error">{t('common.error')}: {(error as any)?.message}</div>;

  if (!data || data.length === 0) return <div className="card text-center">{t('teacher.noClassesAssigned')}</div>;

  return (
    <div>
      <h2><GraduationCap size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />{t('nav.myClasses')}</h2>
      {data.map((cls) => (
        <div key={cls.id} className="card mb-2">
          <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>{cls.name}</h3>
              {cls.description && <p style={{ color: 'var(--color-gray-500)', marginTop: '0.25rem' }}>{cls.description}</p>}
            </div>
            <div className="flex gap-1" style={{ flexShrink: 0 }}>
              <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Users size={14} /> {cls.student_count}
              </span>
              <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <BookOpen size={14} /> {cls.lesson_count}
              </span>
            </div>
          </div>
          {cls.students && cls.students.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{t('common.name')}</th>
                    <th>{t('auth.username')}</th>
                    <th>{t('teacher.lessonsCompleted')}</th>
                    <th>{t('admin.score')}</th>
                    <th>{t('common.edit')}</th>
                  </tr>
                </thead>
                <tbody>
                  {cls.students.map((s) => (
                    <tr key={s.id}>
                      <td data-label={t('common.name')}>{s.full_name}</td>
                      <td data-label={t('auth.username')}>{s.username}</td>
                      <td data-label={t('teacher.lessonsCompleted')}><span className="badge badge-success">{s.completed_lessons}</span></td>
                      <td data-label={t('admin.score')}><span className="badge badge-info">{s.total_score}</span></td>
                      <td data-label={t('common.edit')}>
                        <div className="table-actions">
                          <Link to={`/teacher/student/${s.id}`} className="btn btn-ghost">
                            <Eye size={16} /> {t('admin.view')} <ChevronRight size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-empty" style={{ border: '2px dashed var(--color-gray-200)', borderRadius: 'var(--radius-md)', padding: '2rem' }}>
              {t('admin.noStudentsInClass')}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TeacherClasses;
