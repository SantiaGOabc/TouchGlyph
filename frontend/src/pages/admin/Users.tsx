import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, UserPlus, Camera } from 'lucide-react';
import api from '../../services/api';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import FaceRegistration from '../../components/FaceRegistration';
import { ROLE_ADMIN, ROLE_TEACHER, ROLE_STUDENT } from '../../constants/roles';

interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: string;
  active: boolean;
}

interface UserForm {
  id?: string;
  username: string;
  password: string;
  full_name: string;
  role: string;
}

const PAGE_SIZE = 15;

const fetchUsers = async (): Promise<User[]> => {
  const res = await api.get('/admin/users');
  return res.data.users;
};

const createUser = async (data: Record<string, any>) => {
  const res = await api.post('/admin/users', data);
  return res.data;
};

const updateUser = async ({ id, ...data }: { id: string; [key: string]: any }) => {
  const res = await api.put(`/admin/users/${id}`, data);
  return res.data;
};

const deleteUser = async (id: string) => {
  await api.delete(`/admin/users/${id}`);
};

const Users = () => {
  const [faceModalUserId, setFaceModalUserId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { addToast } = useToast();
  const { t } = useTranslation();

  const initialForm: UserForm = { username: '', password: '', full_name: '', role: ROLE_STUDENT };
  const validateUser = (values: UserForm) => {
    const errors: Record<string, string> = {};
    if (!values.username?.trim()) errors.username = t('admin.usernameRequired');
    if (!values.id && !values.password?.trim()) errors.password = t('admin.passwordRequired');
    if (![ROLE_ADMIN, ROLE_TEACHER, ROLE_STUDENT].includes(values.role)) errors.role = t('admin.invalidRole');
    return errors;
  };
  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    resetForm,
    setValues,
  } = useForm(initialForm, validateUser);

  const { data: users, isLoading, isError, error } = useQuery<User[]>({
    queryKey: ['adminUsers'],
    queryFn: fetchUsers,
  });

  const { paginatedUsers, totalPages } = useMemo(() => {
    if (!users) return { paginatedUsers: [], totalPages: 0 };
    const total = Math.ceil(users.length / PAGE_SIZE);
    const start = (currentPage - 1) * PAGE_SIZE;
    return {
      paginatedUsers: users.slice(start, start + PAGE_SIZE),
      totalPages: Math.max(total, 1),
    };
  }, [users, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      addToast(t('admin.userCreated'), 'success');
      closeModal();
    },
    onError: (err: any) => {
      addToast(err.response?.data?.detail || t('admin.userCreateError'), 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      addToast(t('admin.userUpdated'), 'success');
      closeModal();
    },
    onError: (err: any) => {
      addToast(err.response?.data?.detail || t('admin.userUpdateError'), 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      addToast(t('admin.userDeleted'), 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.detail || t('admin.userDeleteError'), 'error');
    },
  });

  const openCreateModal = () => {
    setEditingUser(null);
    resetForm(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setValues({
      id: user.id,
      username: user.username,
      password: '',
      full_name: user.full_name || '',
      role: user.role,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = (userId: string) => {
    if (window.confirm(t('admin.deleteUserConfirm'))) {
      deleteMutation.mutate(userId);
    }
  };

  const onSubmit = async (formValues: UserForm) => {
    const payload = { ...formValues };
    if (editingUser) {
      const rest = { ...payload };
      delete rest.id;
      if (!rest.password) delete rest.password;
      await updateMutation.mutateAsync({ id: editingUser.id, ...rest });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  if (isLoading) return (
    <div className="loading-container" role="status">
      <div className="spinner spinner-dark"></div>
      <span className="loading-text">{t('admin.loadingUsers')}</span>
    </div>
  );

  if (isError) return <div className="alert alert-error">{t('common.error')}: {(error as any).message}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2>{t('admin.userManagement')}</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <UserPlus size={18} /> {t('admin.newUser')}
        </button>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingUser ? t('admin.editUser') : t('admin.createUser')}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="user_username">{t('auth.username')}:</label>
            <input id="user_username" name="username" value={values.username} onChange={handleChange} aria-describedby={errors.username ? 'user_username_error' : undefined} aria-invalid={!!errors.username} />
            {errors.username && <span id="user_username_error" className="form-error" role="alert">{errors.username}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="user_fullname">{t('admin.fullName')}:</label>
            <input id="user_fullname" name="full_name" value={values.full_name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="user_role">{t('admin.role')}:</label>
            <select id="user_role" name="role" value={values.role} onChange={handleChange}>
              <option value={ROLE_STUDENT}>{t('admin.student')}</option>
              <option value={ROLE_TEACHER}>{t('admin.teacher')}</option>
              <option value={ROLE_ADMIN}>{t('admin.admin')}</option>
            </select>
            {errors.role && <span className="form-error" role="alert">{errors.role}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="user_password">{t('auth.password')} {editingUser && t('admin.passwordLeaveEmpty')}:</label>
            <input id="user_password" type="password" name="password" value={values.password} onChange={handleChange} aria-describedby={errors.password ? 'user_password_error' : undefined} aria-invalid={!!errors.password} />
            {errors.password && <span id="user_password_error" className="form-error" role="alert">{errors.password}</span>}
          </div>
          <div className="flex gap-2 mt-2">
            <button type="submit" className="btn btn-primary" disabled={createMutation.isLoading || updateMutation.isLoading}>
              {editingUser ? t('common.edit') : t('common.create')}
            </button>
            <button type="button" className="btn btn-ghost" onClick={closeModal}>{t('common.cancel')}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!faceModalUserId} onClose={() => setFaceModalUserId(null)} title={t('auth.registerFace')}>
        {faceModalUserId && (
          <FaceRegistration
            key={faceModalUserId}
            userId={faceModalUserId}
            onSuccess={() => {
              setFaceModalUserId(null);
              addToast(t('auth.faceRegistered'), 'success');
            }}
            onClose={() => setFaceModalUserId(null)}
          />
        )}
      </Modal>

      <div className="table-wrapper mt-2">
        <table>
          <thead>
            <tr>
              <th>{t('admin.id')}</th>
              <th>{t('auth.username')}</th>
              <th>{t('common.name')}</th>
              <th>{t('admin.role')}</th>
              <th>{t('admin.active')}</th>
              <th>{t('common.edit')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 && (
              <tr><td colSpan={6} className="table-empty">{t('admin.noUsers')}</td></tr>
            )}
            {paginatedUsers.map((user: User) => (
              <tr key={user.id}>
                <td data-label={t('admin.id')}>{user.id}</td>
                <td data-label={t('auth.username')}>{user.username}</td>
                <td data-label={t('common.name')}>{user.full_name}</td>
                <td data-label={t('admin.role')}><span className="badge badge-info">{user.role}</span></td>
                <td data-label={t('admin.active')}>{user.active ? <span className="badge badge-success">{t('admin.yes')}</span> : <span className="badge badge-error">{t('admin.no')}</span>}</td>
                <td data-label={t('common.edit')}>
                  <div className="table-actions">
                    <button className="btn btn-ghost" onClick={() => openEditModal(user)} title={t('common.edit')}>
                      <Pencil size={16} />
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(user.id)} disabled={deleteMutation.isLoading} title={t('common.delete')}>
                      <Trash2 size={16} />
                    </button>
                    <button className="btn btn-ghost" onClick={() => setFaceModalUserId(Number(user.id))} title={t('auth.registerFace')}>
                      <Camera size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default Users;
