import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';

interface Lesson { id: number; title: string; }
interface Props { isOpen: boolean; onClose: () => void; lesson: Lesson | null; }
interface ClassItem { id: number; name: string; student_count: number; }

const AssignLessonModal = ({ isOpen, onClose, lesson }: Props) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const [selectedClassId, setSelectedClassId] = useState('');

  const { data: classes, isLoading } = useQuery<ClassItem[]>({
    queryKey: ['teacherClasses'],
    queryFn: () => api.get('/teacher/classes').then(res => res.data.classes),
    enabled: isOpen,
  });

  const assignMutation = useMutation({
    mutationFn: (data: { lessonId: number; classId: number }) => api.post(`/teacher/lessons/${data.lessonId}/assign`, { class_id: data.classId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherMyLessons'] });
      addToast(t('teacher.lessonAssigned'), 'success');
      handleClose();
    },
    onError: (err: any) => addToast(err.response?.data?.detail || t('teacher.lessonAssignError'), 'error'),
  });

  const handleAssign = () => {
    if (!selectedClassId || !lesson) return;
    assignMutation.mutate({ lessonId: lesson.id, classId: parseInt(selectedClassId) });
  };

  const handleClose = () => {
    setSelectedClassId('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`${t('teacher.assignLesson')} "${lesson?.title}"`}>
      {isLoading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <>
          <div className="form-group">
            <label htmlFor="assign_class">{t('admin.selectClass')}</label>
            <select id="assign_class" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} aria-label={t('admin.selectClass')}>
              <option value="">{t('admin.selectClassPlaceholder')}</option>
              {classes?.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name} ({cls.student_count} {t('admin.students').toLowerCase()})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary" onClick={handleAssign} disabled={!selectedClassId || assignMutation.isLoading}>
              {assignMutation.isLoading ? t('admin.assigning') : t('common.save')}
            </button>
            <button className="btn btn-ghost" onClick={handleClose}>{t('common.cancel')}</button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default AssignLessonModal;
