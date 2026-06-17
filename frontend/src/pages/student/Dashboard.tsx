import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BookOpen, Star, Trophy, CheckCircle, Filter, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useSpeech } from '../../hooks/useSpeech';
import { useToast } from '../../context/ToastContext';
import './StudentLessons.css';

interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  total_steps: number;
  completed: number;
  score: number;
}

interface Stats {
  completed: number;
  total_score: number;
  total: number;
}

interface LessonsResponse {
  lessons: Lesson[];
  stats: Stats;
}

const StudentDashboard = () => {
  const [showCompleted, setShowCompleted] = useState(false);
  const navigate = useNavigate();
  const { speak } = useSpeech();
  const { addToast } = useToast();
  const { t } = useTranslation();

  const { data, isLoading, isError, error } = useQuery<LessonsResponse>({
    queryKey: ['studentLessons', showCompleted],
    queryFn: () =>
      api.get('/student/lessons', { params: { show_completed: showCompleted } })
        .then(res => res.data),
  });

  const lessons = data?.lessons || [];
  const stats = data?.stats || { completed: 0, total_score: 0, total: 0 };

  const handleStartLesson = async (lesson: Lesson) => {
    try {
      speak(t('student.startingLesson', { title: lesson.title }));
      const res = await api.post('/student/start-session', { lesson_id: lesson.id });
      navigate(`/student/session/${res.data.session_id}`);
    } catch {
      addToast(t('student.lessonStartError'), 'error');
    }
  };

  const handleFilter = () => {
    const newState = !showCompleted;
    setShowCompleted(newState);
    speak(newState ? t('student.showPendingAria') : t('student.showCompletedAria'));
  };

  const speakLessonInfo = (lesson: Lesson) => {
    speak(lesson.completed ? `${lesson.title}. ${lesson.description || ''}. Completada.` : `${lesson.title}. ${lesson.description || ''}`);
  };

  if (isLoading) {
    return (
      <div className="tg-loading" role="status" aria-busy="true">
        <div className="tg-spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (isError) {
    return <div role="alert" className="alert alert-error">Error: {(error as any)?.message}</div>;
  }

  return (
    <div className="tg-page-container">
      <div className="tg-content-wrapper">
        <div className="tg-header-section">
          <h1 className="tg-title">
            {showCompleted ? t('student.completedLessons') : t('student.myLessons')}
          </h1>
          <p className="tg-subtitle">
            {showCompleted ? t('student.reviewPrompt') : t('student.continueLearning')}
          </p>
        </div>

        <div className="tg-stats-grid">
          <div className="tg-stat-card" aria-label={t('student.srCompleted', { completed: stats.completed, total: stats.total })}>
            <div className="tg-icon-box success" aria-hidden="true"><Trophy size={24} /></div>
            <div className="tg-stat-info">
              <span className="tg-stat-value">{stats.completed}</span>
              <span className="tg-stat-label">{t('student.completed')}</span>
            </div>
          </div>
          <div className="tg-stat-card" aria-label={t('student.srTotalPoints', { points: stats.total_score })}>
            <div className="tg-icon-box warning" aria-hidden="true"><Star size={24} /></div>
            <div className="tg-stat-info">
              <span className="tg-stat-value">{stats.total_score}</span>
              <span className="tg-stat-label">{t('student.totalPoints')}</span>
            </div>
          </div>
          <div className="tg-stat-card" aria-label={t('student.srTotalLessons', { total: stats.total })}>
            <div className="tg-icon-box info" aria-hidden="true"><BookOpen size={24} /></div>
            <div className="tg-stat-info">
              <span className="tg-stat-value">{stats.total}</span>
              <span className="tg-stat-label">{t('nav.lessons')}</span>
            </div>
          </div>
        </div>

        <div className="tg-filter-bar">
          <button
            className={`tg-filter-btn ${showCompleted ? 'active' : ''}`}
            onClick={handleFilter}
            aria-pressed={showCompleted}
            aria-label={showCompleted ? t('student.showPendingAria') : t('student.showCompletedAria')}
          >
            {showCompleted ? (
              <><RefreshCw size={16} aria-hidden="true" /> {t('student.showPending')}</>
            ) : (
              <><Filter size={16} aria-hidden="true" /> {t('student.showCompleted')}</>
            )}
          </button>
        </div>

        <div className="sr-only" aria-live="polite">
          {lessons.length === 0
            ? t('student.srNoLessons')
            : t('student.srShowing', { count: lessons.length })}
        </div>

        {lessons.length === 0 ? (
          <div className="tg-empty-state">
            <div className="tg-empty-icon"><BookOpen size={48} aria-hidden="true" /></div>
            <h3>{showCompleted ? t('student.noCompleted') : t('student.allCompleted')}</h3>
            <p>{showCompleted ? t('student.emptyCompleted') : t('student.emptyPending')}</p>
          </div>
        ) : (
          <div className="tg-lessons-grid" role="list">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                role="button"
                tabIndex={0}
                className={`tg-lesson-card ${lesson.completed ? 'is-completed' : ''}`}
                onClick={() => handleStartLesson(lesson)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleStartLesson(lesson);
                  }
                }}
                onFocus={() => speakLessonInfo(lesson)}
                aria-label={
                  lesson.completed
                    ? t('student.lessonCompletedAria', { title: lesson.title, steps: lesson.total_steps, score: lesson.score })
                    : t('student.lessonPendingAria', { title: lesson.title, steps: lesson.total_steps })
                }
              >
                <div className="tg-card-header">
                  <span className={`tg-badge ${lesson.difficulty}`}>
                    {lesson.difficulty === 'beginner' ? t('student.difficultyBeginner') : lesson.difficulty === 'intermediate' ? t('student.difficultyIntermediate') : t('student.difficultyAdvanced')}
                  </span>
                  {lesson.completed && <CheckCircle size={18} className="tg-check-icon" aria-hidden="true" />}
                </div>
                <h3 className="tg-lesson-title">{lesson.title}</h3>
                <p className="tg-lesson-desc">{lesson.description}</p>
                <div className="tg-card-footer">
                  <div className="tg-lesson-meta">
                    <span className="tg-steps-count"><BookOpen size={14} aria-hidden="true" /> {lesson.total_steps || 0} {t('student.steps')}</span>
                    {lesson.score > 0 && (
                      <span className="tg-lesson-score"><Star size={14} aria-hidden="true" /> {lesson.score} pts</span>
                    )}
                  </div>
                  <button
                    className="tg-play-btn"
                    onClick={() => handleStartLesson(lesson)}
                    aria-label={
                      lesson.completed
                        ? t('student.reviewLessonAria', { title: lesson.title, steps: lesson.total_steps, score: lesson.score })
                        : t('student.startLessonAria', { title: lesson.title, steps: lesson.total_steps })
                    }
                  >
                    {lesson.completed ? t('student.reviewLesson') : showCompleted ? t('student.reviewLesson') : t('student.startLesson')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
