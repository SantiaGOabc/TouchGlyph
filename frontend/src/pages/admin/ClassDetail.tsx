import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, UserPlus, UserCheck, GraduationCap } from 'lucide-react';
import api from '../../services/api';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../context/ToastContext';
import { ROLE_STUDENT } from '../../constants/roles';

interface Student { id: number; full_name: string; username: string; }
interface ClassData { id: number; name: string; description: string; teacher_name: string | null; students: Student[]; }

const ClassDetail = () => {
  const { classId } = useParams<{ classId: string }>();
  const queryClient = useQueryClient();
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [manualIds, setManualIds] = useState('');
  const { addToast } = useToast();
  const { t } = useTranslation();

  const { data: classData, isLoading, isError, error } = useQuery<ClassData>({
    queryKey: ['classDetail', classId],
    queryFn: () => api.get(`/admin/classes/${classId}`).then(res => res.data),
  });

  const { data: allStudents } = useQuery<Student[]>({
    queryKey: ['adminUsers'],
    queryFn: () => api.get('/admin/users').then(res => res.data.users.filter((u: any) => u.role === ROLE_STUDENT && u.active)),
  });

  const { data: teachers } = useQuery<any[]>({
    queryKey: ['adminTeachers'],
    queryFn: () => api.get('/admin/teachers').then(res => res.data.teachers),
  });

  const { values, handleChange } = useForm({ teacherId: '' });

  const studentsMutation = useMutation({
    mutationFn: (data: { classId: number; studentIds: number[] }) => api.post(`/admin/classes/${data.classId}/students`, { student_ids: data.studentIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classDetail', classId] });
      setSelectedStudentIds([]);
      setManualIds('');
      addToast(t('teacher.studentsAdded'), 'success');
    },
    onError: (err: any) => addToast(err.response?.data?.detail || t('teacher.studentsAddError'), 'error'),
  });

  const teacherMutation = useMutation({
    mutationFn: (data: { classId: number; teacherId: number | null }) => api.post(`/admin/classes/${data.classId}/teacher`, { teacher_id: data.teacherId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classDetail', classId] });
      addToast(t('teacher.teacherAssigned'), 'success');
    },
    onError: (err: any) => addToast(err.response?.data?.detail || t('teacher.teacherAssignError'), 'error'),
  });

  const assignedIds = classData?.students?.map(s => s.id) || [];
  const availableStudents = allStudents?.filter(s => !assignedIds.includes(s.id)) || [];

  const handleAddSelected = () => {
    if (selectedStudentIds.length === 0) return;
    studentsMutation.mutate({ classId: parseInt(classId!), studentIds: selectedStudentIds.map(id => parseInt(id)) });
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    const ids = manualIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    if (ids.length === 0) return;
    studentsMutation.mutate({ classId: parseInt(classId!), studentIds: ids });
  };

  const handleAssignTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    const tid = values.teacherId ? parseInt(values.teacherId as string) : null;
    teacherMutation.mutate({ classId: parseInt(classId!), teacherId: tid });
  };

  if (isLoading) return <div className="loading-container" role="status"><div className="spinner spinner-dark"></div><span className="loading-text">{t('common.loading')}</span></div>;
  if (isError) return <div className="alert alert-error">{t('common.error')}: {(error as any)?.message}</div>;

  return (
    <div>
      <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
        <GraduationCap size={28} style={{ color: 'var(--color-primary)' }} />
        <div>
          <h2 style={{ margin: 0 }}>{classData?.name}</h2>
          {classData?.description && <p style={{ color: 'var(--color-gray-500)', margin: '0.25rem 0 0 0' }}>{classData.description}</p>}
        </div>
      </div>
      <p style={{ color: 'var(--color-gray-600)' }}>
        <Users size={16} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
        {t('admin.teacher')}: <strong>{classData?.teacher_name || <span className="badge badge-error">{t('admin.noTeacher')}</span>}</strong>
      </p>

      <div className="card mt-3">
        <h3 className="flex items-center gap-1" style={{ marginBottom: '1rem' }}>
          <UserCheck size={20} /> {t('admin.currentStudents', { count: classData?.students?.length || 0 })}
        </h3>
        {classData?.students && classData.students.length > 0 ? (
          <div className="student-chips">
            {classData.students.map(s => (
              <span key={s.id} className="student-chip">
                <UserCheck size={14} /> {s.full_name} <span style={{ color: 'var(--color-gray-500)', fontSize: '0.8rem' }}>@{s.username}</span>
              </span>
            ))}
          </div>
        ) : (
          <div className="table-empty" style={{ border: '2px dashed var(--color-gray-200)', borderRadius: 'var(--radius-md)' }}>
            {t('admin.noStudents')}
          </div>
        )}
      </div>

      <div className="card mt-2">
        <h3 className="flex items-center gap-1" style={{ marginBottom: '1rem' }}>
          <UserPlus size={20} /> {t('admin.addStudents')}
        </h3>
        {availableStudents.length === 0 ? (
          <p style={{ color: 'var(--color-gray-500)', textAlign: 'center', padding: '1rem' }}>{t('admin.allStudentsInClass')}</p>
        ) : (
          <div className="form-group">
            <label>{t('admin.selectAvailableStudents')}</label>
            <select
              multiple
              value={selectedStudentIds}
              onChange={e => setSelectedStudentIds([...e.target.selectedOptions].map(o => o.value))}
              className="multi-select"
              aria-label={t('admin.selectAvailableStudents')}
            >
              {availableStudents.map(s => (
                <option key={s.id} value={s.id}>{s.full_name || s.username} (ID: {s.id})</option>
              ))}
            </select>
            <button className="btn btn-primary mt-1" onClick={handleAddSelected} disabled={studentsMutation.isLoading}>
              <UserPlus size={16} /> {t('admin.addSelected', { count: selectedStudentIds.length })}
            </button>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--color-gray-200)', margin: '1.5rem 0' }} />

        <form onSubmit={handleAddManual}>
          <div className="form-group">
            <label htmlFor="manual_ids">{t('admin.addByIDs')}</label>
            <div className="flex gap-1">
              <input
                id="manual_ids"
                placeholder={t('admin.idsPlaceholder')}
                value={manualIds}
                onChange={e => setManualIds(e.target.value)}
                style={{ flex: 1 }}
                aria-label={t('admin.addByIDs')}
              />
              <button type="submit" className="btn btn-primary" disabled={studentsMutation.isLoading}>
                <UserPlus size={16} /> {t('common.save')}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="card mt-2">
        <h3 className="flex items-center gap-1" style={{ marginBottom: '1rem' }}>
          <GraduationCap size={20} /> {t('admin.assignTeacher')}
        </h3>
        <form onSubmit={handleAssignTeacher}>
          <div className="form-group">
            <label htmlFor="assign_teacher">{t('admin.selectTeacher')}</label>
            <div className="flex gap-1">
              <select id="assign_teacher" name="teacherId" value={values.teacherId as string} onChange={handleChange} style={{ flex: 1 }}>
                <option value="">{t('admin.noAssigned')}</option>
                {teachers?.map(t => (
                  <option key={t.id} value={t.id}>{t.full_name || t.username} (ID: {t.id})</option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary" disabled={teacherMutation.isLoading}>
                <UserCheck size={16} /> {t('common.save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassDetail;
