import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';

const initialStep = { type: 'input' as const, target: '', prompt: '', hint: '', max_attempts: 3 };

interface Step { type: string; target: string; prompt: string; hint: string; max_attempts: number; }
interface Props { isOpen: boolean; onClose: () => void; onCreated?: () => void; }

const LessonFormModal = ({ isOpen, onClose, onCreated }: Props) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepForm, setStepForm] = useState(initialStep);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [priority, setPriority] = useState(1);

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/teacher/lessons', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherMyLessons'] });
      queryClient.invalidateQueries({ queryKey: ['availableLessons'] });
      addToast(t('teacher.lessonCreated'), 'success');
      onCreated?.();
      handleClose();
    },
    onError: (err: any) => addToast(err.response?.data?.detail || t('teacher.lessonCreateError'), 'error'),
  });

  const handleAddStep = () => {
    if (!stepForm.target.trim() || !stepForm.prompt.trim()) {
      addToast(t('teacher.completeTargetAndPrompt'), 'error');
      return;
    }
    setSteps([...steps, { ...stepForm }]);
    setStepForm(initialStep);
  };

  const handleCreateLesson = () => {
    if (!title.trim()) { addToast(t('teacher.titleRequired'), 'error'); return; }
    if (steps.length === 0) { addToast(t('teacher.addAtLeastOneStep'), 'error'); return; }
    createMutation.mutate({ title, description, difficulty, priority, steps });
  };

  const handleClose = () => {
    setCurrentPage(1);
    setSteps([]);
    setTitle('');
    setDescription('');
    setDifficulty('beginner');
    setPriority(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('teacher.createLesson')}>
      {currentPage === 1 && (
        <div>
          <div className="form-group">
            <label htmlFor="lesson_title">{t('admin.title')}</label>
            <input id="lesson_title" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('admin.title')} />
          </div>
          <div className="form-group">
            <label htmlFor="lesson_desc">{t('admin.description')}</label>
            <textarea id="lesson_desc" value={description} onChange={e => setDescription(e.target.value)} placeholder={t('admin.description')} rows={3} />
          </div>
          <div className="form-group">
            <label htmlFor="lesson_difficulty">{t('admin.difficulty')}</label>
            <select id="lesson_difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="beginner">{t('student.difficultyBeginner')}</option>
              <option value="intermediate">{t('student.difficultyIntermediate')}</option>
              <option value="advanced">{t('student.difficultyAdvanced')}</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="lesson_priority">{t('admin.priority')}</label>
            <select id="lesson_priority" value={priority} onChange={e => setPriority(parseInt(e.target.value))}>
              <option value={0}>{t('teacher.priorityTutorial')}</option>
              <option value={1}>{t('teacher.priorityLesson')}</option>
              <option value={2}>{t('teacher.priorityPractice')}</option>
              <option value={3}>{t('teacher.priorityExam')}</option>
            </select>
          </div>
        </div>
      )}
      {currentPage === 2 && (
        <div>
          <div className="form-group">
            <label htmlFor="step_target">{t('teacher.targetLabel')}</label>
            <input id="step_target" value={stepForm.target} onChange={e => setStepForm({...stepForm, target: e.target.value})} placeholder={t('teacher.targetLabel')} />
          </div>
          <div className="form-group">
            <label htmlFor="step_prompt">{t('teacher.promptLabel')}</label>
            <textarea id="step_prompt" value={stepForm.prompt} onChange={e => setStepForm({...stepForm, prompt: e.target.value})} placeholder={t('teacher.promptLabel')} rows={3} />
          </div>
          <div className="form-group">
            <label htmlFor="step_hint">{t('teacher.hintLabel')}</label>
            <input id="step_hint" value={stepForm.hint} onChange={e => setStepForm({...stepForm, hint: e.target.value})} placeholder={t('teacher.hintLabel')} />
          </div>
          <button className="btn btn-secondary" onClick={handleAddStep}>{t('teacher.addStep', { count: steps.length })}</button>
          {steps.length > 0 && (
            <ul className="mt-1">
              {steps.map((s, i) => <li key={i}>{i+1}. {s.target}</li>)}
            </ul>
          )}
        </div>
      )}
      {currentPage === 3 && (
        <div className="card">
          <p><strong>{t('teacher.confirmTitle')}:</strong> {title}</p>
          <p><strong>{t('teacher.confirmDifficulty')}:</strong> {difficulty}</p>
          <p><strong>{t('teacher.confirmPriority')}:</strong> {priority}</p>
          <p><strong>{t('teacher.confirmSteps')}:</strong> {steps.length}</p>
        </div>
      )}
      <div className="flex gap-2 justify-between mt-2">
        <div className="flex gap-1">
          {currentPage > 1 && <button className="btn btn-ghost" onClick={() => setCurrentPage(p => p - 1)}>{t('teacher.previous')}</button>}
        </div>
        <div className="flex gap-1">
          <button className="btn btn-ghost" onClick={handleClose}>{t('common.cancel')}</button>
          {currentPage < 3 ? (
            <button className="btn btn-primary" onClick={() => setCurrentPage(p => p + 1)}>{t('teacher.next')}</button>
          ) : (
            <button className="btn btn-primary" onClick={handleCreateLesson} disabled={createMutation.isLoading}>
              {createMutation.isLoading ? t('admin.creating') : t('teacher.createLesson')}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default LessonFormModal;
