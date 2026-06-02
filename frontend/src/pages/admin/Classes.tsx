import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Plus, Eye } from 'lucide-react';
import api from '../../services/api';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';

interface ClassItem {
  id: string;
  name: string;
  description: string;
  teacher_id: string | null;
  teacher_name: string | null;
  student_count: number;
  lesson_count: number;
}

interface Teacher {
  id: string;
  username: string;
  full_name: string;
}

interface ClassForm {
  name: string;
  description: string;
  teacher_id: string;
}

const fetchClasses = async (): Promise<ClassItem[]> => {
  const res = await api.get('/admin/classes');
  return res.data.classes;
};

const fetchTeachers = async (): Promise<Teacher[]> => {
  const res = await api.get('/admin/teachers');
  return res.data.teachers;
};

const createClass = async (data: Record<string, any>) => {
  const res = await api.post('/admin/classes', data);
  return res.data;
};

const updateClass = async ({ id, ...data }: { id: string; [key: string]: any }) => {
  const res = await api.put(`/admin/classes/${id}`, data);
  return res.data;
};

const deleteClass = async (id: string) => {
  await api.delete(`/admin/classes/${id}`);
};

const Classes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const { addToast } = useToast();
  const { t } = useTranslation();

  const initialForm: ClassForm = { name: '', description: '', teacher_id: '' };
  const validateClass = (values: ClassForm) => {
    const errors: Record<string, string> = {};
    if (!values.name?.trim()) errors.name = t('admin.classNameRequired');
    return errors;
  };
  const { values, errors, handleChange, handleSubmit, resetForm, setValues } = useForm(initialForm, validateClass);

  const { data: classes, isLoading, isError, error } = useQuery<ClassItem[]>({
    queryKey: ['adminClasses'],
    queryFn: fetchClasses,
  });

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['adminTeachers'],
    queryFn: fetchTeachers,
  });

  const createMutation = useMutation({
    mutationFn: createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminClasses'] });
      addToast(t('admin.classCreated'), 'success');
      closeModal();
    },
    onError: (err: any) => addToast(err.response?.data?.detail || t('admin.classCreateError'), 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: updateClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminClasses'] });
      addToast(t('admin.classUpdated'), 'success');
      closeModal();
    },
    onError: (err: any) => addToast(err.response?.data?.detail || t('admin.classUpdateError'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminClasses'] });
      addToast(t('admin.classDeleted'), 'success');
    },
    onError: (err: any) => addToast(err.response?.data?.detail || t('admin.classDeleteError'), 'error'),
  });

  const openCreate = () => {
    setEditingClass(null);
    resetForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (cls: ClassItem) => {
    setEditingClass(cls);
    setValues({
      name: cls.name,
      description: cls.description || '',
      teacher_id: cls.teacher_id ? String(cls.teacher_id) : '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingClass(null);
  };

  const handleDelete = (classId: string) => {
    if (window.confirm(t('admin.deleteClassConfirm'))) {
      deleteMutation.mutate(classId);
    }
  };

  const onSubmit = async (formValues: ClassForm) => {
    const payload = {
      name: formValues.name,
      description: formValues.description || null,
      teacher_id: formValues.teacher_id ? parseInt(formValues.teacher_id) : null,
    };
    if (editingClass) {
      await updateMutation.mutateAsync({ id: editingClass.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  if (isLoading) return (
    <div className="loading-container" role="status">
      <div className="spinner spinner-dark"></div>
      <span className="loading-text">{t('admin.loadingClasses')}</span>
    </div>
  );

  if (isError) return <div className="alert alert-error">Error: {(error as any).message}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2>{t('admin.classManagement')}</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> {t('admin.newClass')}
        </button>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingClass ? t('admin.editClass') : t('admin.createClass')}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="class_name">{t('common.name')}:</label>
            <input id="class_name" name="name" value={values.name} onChange={handleChange} aria-describedby={errors.name ? 'class_name_error' : undefined} aria-invalid={!!errors.name} />
            {errors.name && <span id="class_name_error" className="form-error" role="alert">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="class_desc">{t('admin.description')}:</label>
            <input id="class_desc" name="description" value={values.description} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="class_teacher">{t('admin.teacher')} ({t('common.optional')}):</label>
            <select id="class_teacher" name="teacher_id" value={values.teacher_id} onChange={handleChange}>
              <option value="">{t('admin.noAssigned')}</option>
              {teachers?.map((teacher: Teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name || teacher.username} (ID: {teacher.id})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-2">
            <button type="submit" className="btn btn-primary" disabled={createMutation.isLoading || updateMutation.isLoading}>
              {t('common.save')}
            </button>
            <button type="button" className="btn btn-ghost" onClick={closeModal}>{t('common.cancel')}</button>
          </div>
        </form>
      </Modal>

      {!classes || classes.length === 0 ? (
        <div className="card text-center">{t('admin.noClasses')}</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t('admin.id')}</th>
                <th>{t('common.name')}</th>
                <th>{t('admin.teacher')}</th>
                <th>{t('admin.students')}</th>
                <th>{t('nav.lessons')}</th>
                <th>{t('common.edit')}</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls: ClassItem) => (
                <tr key={cls.id}>
                  <td data-label={t('admin.id')}>{cls.id}</td>
                  <td data-label={t('common.name')}>
                    <a href={`/admin/classes/${cls.id}`} onClick={(e) => { e.preventDefault(); navigate(`/admin/classes/${cls.id}`); }} className="table-link">
                      <Eye size={14} /> {cls.name}
                    </a>
                  </td>
                  <td data-label={t('admin.teacher')}>{cls.teacher_name || <span className="badge badge-error">{t('admin.noTeacher')}</span>}</td>
                  <td data-label={t('admin.students')}><span className="badge badge-info">{cls.student_count}</span></td>
                  <td data-label={t('nav.lessons')}><span className="badge badge-info">{cls.lesson_count}</span></td>
                  <td data-label={t('common.edit')}>
                    <div className="table-actions">
                      <button className="btn btn-ghost" onClick={() => openEdit(cls)} title={t('common.edit')}>
                        <Pencil size={16} />
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(cls.id)} disabled={deleteMutation.isLoading} title={t('common.delete')}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Classes;
