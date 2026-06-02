import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useSpeech } from '../../hooks/useSpeech';
import ConfirmModal from '../../components/ConfirmModal';
import './LessonPlayer.css';

interface PromptData {
  finished: boolean;
  prompt: string;
  hint: string;
  step_index: number;
  total_steps: number;
  max_attempts: number;
  attempts: number;
  score: number;
  step_type: string;
}

interface SubmitResult {
  correct: boolean;
  attempts: number;
  max_attempts: number;
}

const LessonSession = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { speak } = useSpeech();
  const { t } = useTranslation();

  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [letterSent, setLetterSent] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentPromptRef = useRef<PromptData | null>(null);

  const { data: promptData, isLoading, isError } = useQuery<PromptData>({
    queryKey: ['sessionPrompt', sessionId],
    queryFn: () => api.get(`/student/session/${sessionId}/prompt`).then(res => res.data),
    refetchOnWindowFocus: false,
    staleTime: 0,
    enabled: !!sessionId,
  });

  const submitMutation = useMutation({
    mutationFn: (answerText: string) =>
      api.post(`/student/session/${sessionId}/submit`, { answer: answerText }).then(res => res.data),
    onSuccess: (result: SubmitResult) => {
      if (result.correct) {
        speak(t('student.correct'), { interrupt: true });
        setIsAnimating(true);
        setTimeout(() => {
          setIsAnimating(false);
          queryClient.invalidateQueries({ queryKey: ['sessionPrompt', sessionId] });
        }, 1200);
      } else {
        const attemptsLeft = (promptData?.max_attempts || 3) - result.attempts;
        if (attemptsLeft <= 0 || result.attempts >= (promptData?.max_attempts || 3)) {
          speak('Incorrecto. Escucha la pista.', { interrupt: true });
          setShowHint(true);
          setTimeout(() => {
            setIsAnimating(false);
            queryClient.invalidateQueries({ queryKey: ['sessionPrompt', sessionId] });
          }, 1500);
        } else {
          speak(t('student.incorrect'), { interrupt: true });
          setIsAnimating(true);
          setTimeout(() => {
            setIsAnimating(false);
            inputRef.current?.focus();
            queryClient.invalidateQueries({ queryKey: ['sessionPrompt', sessionId] });
          }, 1000);
        }
      }
    },
  });

  const promptError = (submitMutation.error as any)?.response?.data?.detail;

  useEffect(() => {
    currentPromptRef.current = promptData || null;
    setLetterSent(false);
  }, [promptData]);

  useEffect(() => {
    if (promptData && !promptData.finished && !isLoading) {
      speak(promptData.prompt, { interrupt: true });
      if (promptData.step_type === 'read' && promptData.target && !letterSent) {
        setLetterSent(true);
        api.post('/devices/letter', { letra: promptData.target }).catch(() => {});
        setAnswer(promptData.target.toUpperCase());
      } else if (promptData.step_type !== 'read') {
        api.post('/devices/clear').catch(() => {});
      }
    }
    if (promptData?.finished) {
      api.post('/devices/clear').catch(() => {});
    }
  }, [promptData, isLoading]);

  useEffect(() => {
    if (showHint && promptData?.hint) {
      speak(promptData.hint, { interrupt: false });
    }
  }, [showHint, promptData]);

  useEffect(() => {
    if (!isLoading && promptData && !promptData.finished) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isLoading, promptData]);

  useEffect(() => {
    return () => { api.post('/devices/clear').catch(() => {}); };
  }, []);

  useEffect(() => {
    if (promptData?.finished) {
      speak(`${t('student.sessionCompleted')}. ${t('student.totalPoints')}: ${promptData.score}.`, { interrupt: true });
    }
  }, [promptData, t]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isAnimating || submitMutation.isLoading) return;
    const currentAnswer = answer.trim().toUpperCase();
    setAnswer('');
    submitMutation.mutate(currentAnswer);
  };

  const handleHintRequest = () => {
    if (promptData?.hint) setShowHint(true);
  };

  const handleBack = () => {
    speak(t('student.exitConfirm'), { interrupt: false });
    setShowExitModal(true);
  };

  const handleExitConfirm = () => {
    setShowExitModal(false);
    navigate('/student');
  };

  const handleExitCancel = () => {
    setShowExitModal(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (promptData?.finished && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        navigate('/student');
        return;
      }
      if (e.altKey) {
        switch (e.key) {
          case '1': e.preventDefault(); inputRef.current?.focus(); speak('Campo de respuesta enfocado', { interrupt: false }); break;
          case '2': e.preventDefault(); speak(currentPromptRef.current?.prompt || '', { interrupt: true }); break;
          case '3': e.preventDefault(); if (currentPromptRef.current?.hint && !showHint) handleHintRequest(); break;
          case 'b': case 'B': e.preventDefault(); handleBack(); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [promptData, showHint, navigate]);

  if (isLoading) {
    return (
      <div className="lesson-player" role="status" aria-busy="true">
        <div className="loading-container"><div className="spinner spinner-dark"></div><span className="loading-text">{t('common.loading')}</span></div>
      </div>
    );
  }

  if (isError || promptError) {
    return <div className="alert alert-error" role="alert">Error: {(promptError as any)?.message || 'Error al cargar la lección'}</div>;
  }

  if (promptData?.finished) {
    return (
      <div className="lesson-player" aria-live="polite" role="status">
        <h1>{t('student.sessionCompleted')}</h1>
        <p>{t('student.totalPoints')}: <strong>{promptData.score}</strong></p>
        <button className="btn btn-primary" onClick={() => navigate('/student')} autoFocus>
          {t('student.backToLessons')} (Enter)
        </button>
      </div>
    );
  }

  return (
    <div className="lesson-player">
      <button
        className="btn btn-back"
        onClick={handleBack}
        aria-label={`${t('student.sessionExit')} (Alt+B)`}
        title={`${t('student.sessionExit')} (Alt+B)`}
        onMouseEnter={() => speak(`${t('student.sessionExit')}. ${t('student.exitConfirm')}`)}
      >
        Volver
      </button>

      <div className="prompt-container">
        <h2>{promptData?.prompt}</h2>
      </div>

      {showHint && promptData?.hint && (
        <div className="hint-container" id="hint-text" role="status" aria-live="polite">
          <p>{promptData.hint}</p>
        </div>
      )}

      {promptData?.step_type === 'read' ? (
        <form onSubmit={handleSubmit} className="answer-form read-step">
          <p className="read-instruction">Presiona Enter para continuar</p>
          <div className="read-letter-display">{promptData.target.toUpperCase()}</div>
          <input ref={inputRef} type="hidden" value={answer} readOnly />
          <button type="submit" className="btn btn-submit" disabled={isAnimating || submitMutation.isLoading} autoFocus>
            Enter
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="answer-form">
          <label htmlFor="answer-input" className="sr-only">Escribe tu respuesta</label>
          <input
            ref={inputRef}
            id="answer-input"
            type="text"
            className="answer-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value.toUpperCase())}
            disabled={isAnimating || submitMutation.isLoading}
            autoComplete="off"
            maxLength={10}
            aria-describedby={showHint && promptData?.hint ? 'hint-text' : undefined}
            aria-required="true"
            aria-invalid={submitMutation.isError || (submitMutation.data && !submitMutation.data.correct) ? true : undefined}
          />

          <div className="action-buttons">
            <button
              type="button"
              className="btn btn-hint"
              onClick={handleHintRequest}
              disabled={isAnimating || showHint || !promptData?.hint}
              aria-label="Escuchar pista"
            >
              {t('student.hint')}
            </button>
            <button
              type="submit"
              className="btn btn-submit"
              disabled={!answer.trim() || isAnimating || submitMutation.isLoading}
              aria-label="Enviar respuesta"
            >
              {t('student.submit')}
            </button>
          </div>
        </form>
      )}

      <div className="progress-section">
        <div
          className="progress-container"
          role="progressbar"
          aria-valuenow={(promptData?.step_index ?? 0) + 1}
          aria-valuemin={1}
          aria-valuemax={promptData?.total_steps || 1}
          aria-label={`Progreso: paso ${(promptData?.step_index ?? 0) + 1} de ${promptData?.total_steps || 0}`}
        >
          <div
            className="progress-bar"
            style={{ width: `${(((promptData?.step_index ?? 0) + 1) / (promptData?.total_steps || 1)) * 100}%` }}
          />
        </div>
        <p className="progress-text">
          Paso {(promptData?.step_index ?? 0) + 1} de {promptData?.total_steps || 0}. Intentos restantes: {(promptData?.max_attempts ?? 3) - (promptData?.attempts ?? 0)}.
        </p>
      </div>

      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {currentPromptRef.current?.prompt && `Nuevo paso: ${currentPromptRef.current.prompt}`}
        {submitMutation.data?.correct ? t('student.correct') : submitMutation.data && !submitMutation.data.correct ? t('student.incorrect') : ''}
      </div>

      <ConfirmModal
        isOpen={showExitModal}
        onClose={handleExitCancel}
        onConfirm={handleExitConfirm}
        title={t('student.sessionExit')}
        message={t('student.exitConfirm')}
        confirmText={t('student.sessionExit')}
        cancelText={t('common.cancel')}
        variant="warning"
      />
    </div>
  );
};

export default LessonSession;
