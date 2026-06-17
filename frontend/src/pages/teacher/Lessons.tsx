import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import AssignLessonModal from './AssignLessonModal';
import LessonFormModal from './LessonFormModal';
import { BookOpen, Plus, Import, Trash2, ChevronRight } from 'lucide-react';
import './LessonView.css';

interface Lesson { id: number; title: string; description: string; difficulty: string; step_count: number; active: number; }

const TeacherLessons = () => {
  const queryClient = useQueryClient();
  const [showAvailableModal, setShowAvailableModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLessonForAssign, setSelectedLessonForAssign] = useState<Lesson | null>(null);
  const { addToast } = useToast();
  const { t } = useTranslation();

  const { data: myLessons, isLoading, isError, error } = useQuery<Lesson[]>({
    queryKey: ['teacherMyLessons'],
    queryFn: () => api.get('/teacher/lessons').then(res => res.data.lessons),
  });

  const { data: availableLessons } = useQuery<Lesson[]>({
    queryKey: ['availableLessons'],
    queryFn: () => api.get('/teacher/lessons/available').then(res => res.data.lessons),
    enabled: showAvailableModal,
  });

  const unassignMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/teacher/lessons/${id}/unassign`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherMyLessons'] });
      queryClient.invalidateQueries({ queryKey: ['availableLessons'] });
      addToast('Lección desasignada', 'success');
    },
    onError: (err: any) => addToast(err.response?.data?.detail || t('teacher.lessonUnassignError'), 'error'),
  });

  const handleUnassignLesson = (lessonId: number) => {
    if (window.confirm(t('teacher.confirmUnassignLesson'))) {
      unassignMutation.mutate(lessonId);
    }
  };

  const openAssignModal = (lesson: Lesson) => {
    setSelectedLessonForAssign(lesson);
    setShowAvailableModal(false);
  };

  if (isLoading) return <div className="loading-container" role="status"><div className="spinner spinner-dark"></div><span className="loading-text">{t('common.loading')}</span></div>;
  if (isError) return <div className="alert alert-error">{t('common.error')}: {(error as any)?.message}</div>;

  return (
    <div className="lesson-view">
      <div className="lesson-view-header">
        <div>
          <h1><BookOpen className="title-icon" /> {t('nav.myClasses')}</h1>
          <p>{t('teacher.lessonsAssignedTo')}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={20} /> {t('teacher.createLesson')}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowAvailableModal(true)}>
            <Import size={20} /> {t('teacher.addExistingLesson')}
          </button>
        </div>
      </div>

      {!myLessons || myLessons.length === 0 ? (
        <div className="card text-center">
          <BookOpen size={64} />
          <h3>{t('teacher.noLessonsAssigned')}</h3>
          <p>{t('teacher.createOrImport')}</p>
        </div>
      ) : (
        <div className="lessons-grid">
          {myLessons.map((lesson) => (
            <div key={lesson.id} className="lesson-card">
              <div className="lesson-card-header">
                <h3>{lesson.title}</h3>
                <span className={`difficulty-badge ${lesson.difficulty}`}>{lesson.difficulty}</span>
              </div>
              <p>{lesson.description}</p>
              <div className="lesson-stats">
                <span>{t('teacher.lessonSteps', { count: lesson.step_count })}</span>
                <span className={`status-badge ${lesson.active ? 'active' : 'inactive'}`}>
                  {lesson.active ? t('teacher.activeLesson') : t('teacher.inactiveLesson')}
                </span>
              </div>
              <div className="lesson-actions">
                <button className="btn btn-ghost" onClick={() => handleUnassignLesson(lesson.id)} title="Quitar lección de mis clases" style={{ color: 'var(--color-error)' }}>
                  <Trash2 size={18} /> {t('teacher.removeLesson')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAvailableModal} onClose={() => setShowAvailableModal(false)} title={t('teacher.bankOfLessons')} width="700px">
        {!availableLessons || availableLessons.length === 0 ? (
          <p>{t('teacher.noLessonsAvailable')}</p>
        ) : (
          <ul className="lesson-select-list">
            {availableLessons.map((lesson) => (
              <li key={lesson.id} className="lesson-select-item">
                <div>
                  <strong>{lesson.title}</strong> ({lesson.difficulty}) - {t('teacher.lessonSteps', { count: lesson.step_count })}
                  {!lesson.active && <span className="inactive-warning"> ({t('teacher.inactiveLesson')})</span>}
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => openAssignModal(lesson)}>
                  {t('teacher.importLesson')} <ChevronRight size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <AssignLessonModal isOpen={!!selectedLessonForAssign} onClose={() => setSelectedLessonForAssign(null)} lesson={selectedLessonForAssign} />
      <LessonFormModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={() => queryClient.invalidateQueries({ queryKey: ['teacherMyLessons'] })} />
    </div>
  );
};

export default TeacherLessons;
