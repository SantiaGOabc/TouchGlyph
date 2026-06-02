import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { User, BookOpen, Target, CheckCircle, Brain, Zap, Calendar } from 'lucide-react';
import api from '../../services/api';

interface StudentData {
  student: { id: number; full_name: string; username: string; role: string; created_at: string };
  overall: { lessons_attempted: number; lessons_completed: number; total_attempts: number; correct_attempts: number; overall_accuracy: number } | null;
  progress: Array<{ lesson_id: number; title: string; score: number; started_at: string; finished_at: string | null; total_attempts: number; correct_attempts: number }>;
}

const StudentDetail = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useQuery<StudentData>({
    queryKey: ['studentDetail', studentId],
    queryFn: () => api.get(`/teacher/student/${studentId}`).then(res => res.data),
  });

  if (isLoading) return <div className="loading-container" role="status"><div className="spinner spinner-dark"></div><span className="loading-text">{t('common.loading')}</span></div>;
  if (isError) return <div className="alert alert-error">{t('common.error')}: {(error as any)?.message}</div>;
  if (!data) return <div className="card text-center">{t('admin.studentNotFound')}</div>;

  const { student, progress, overall } = data;

  return (
    <div>
      <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
        <div className="user-avatar" style={{ width: 48, height: 48, background: 'var(--color-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <User size={24} />
        </div>
        <div>
          <h2 style={{ margin: 0 }}>{student.full_name} (@{student.username})</h2>
          <span className="badge badge-info">{student.role}</span>
          <span style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)', marginLeft: '0.5rem' }}>
            <Calendar size={14} style={{ verticalAlign: 'middle' }} /> {t('teacher.activeSince', { date: new Date(student.created_at).toLocaleDateString() })}
          </span>
        </div>
      </div>

      <h3 className="mt-3">{t('teacher.generalStats')}</h3>
      {overall ? (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#8b5cf6', color: 'white' }}><BookOpen size={24} /></div>
            <div className="stat-info">
              <span className="stat-value">{overall.lessons_attempted}</span>
              <span className="stat-label">{t('teacher.lessonsAttempted')}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#10b981', color: 'white' }}><CheckCircle size={24} /></div>
            <div className="stat-info">
              <span className="stat-value">{overall.lessons_completed}</span>
              <span className="stat-label">{t('teacher.lessonsCompleted')}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f59e0b', color: 'white' }}><Target size={24} /></div>
            <div className="stat-info">
              <span className="stat-value">{overall.total_attempts}</span>
              <span className="stat-label">{t('teacher.totalAttempts')}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#3b82f6', color: 'white' }}><Brain size={24} /></div>
            <div className="stat-info">
              <span className="stat-value">{overall.correct_attempts}</span>
              <span className="stat-label">{t('admin.correct')}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ef4444', color: 'white' }}><Zap size={24} /></div>
            <div className="stat-info">
              <span className="stat-value">{overall.overall_accuracy}%</span>
              <span className="stat-label">{t('admin.accuracy')}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center">{t('admin.noStats')}</div>
      )}

      <h3 className="mt-3">{t('teacher.progressByLesson')}</h3>
      {progress && progress.length > 0 ? (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t('nav.lessons')}</th>
                <th>{t('admin.score')}</th>
                <th>{t('admin.startDate')}</th>
                <th>{t('admin.endDate')}</th>
                <th>{t('admin.attempts')}</th>
                <th>{t('admin.correct')}</th>
              </tr>
            </thead>
            <tbody>
              {progress.map((p) => (
                <tr key={p.lesson_id}>
                  <td data-label={t('nav.lessons')}>{p.title}</td>
                  <td data-label={t('admin.score')}><span className="badge badge-info">{p.score}</span></td>
                  <td data-label={t('admin.startDate')}>{new Date(p.started_at).toLocaleString()}</td>
                  <td data-label={t('admin.endDate')}>{p.finished_at ? new Date(p.finished_at).toLocaleString() : <span className="badge badge-error">{t('student.inProgress')}</span>}</td>
                  <td data-label={t('admin.attempts')}>{p.total_attempts}</td>
                  <td data-label={t('admin.correct')}>{p.correct_attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center">{t('admin.noSessions')}</div>
      )}
    </div>
  );
};

export default StudentDetail;
