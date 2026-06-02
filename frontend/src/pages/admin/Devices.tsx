import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Play, Trash2, Plus } from 'lucide-react';
import api from '../../services/api';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import './Devices.css';

interface Device {
  id: string;
  device_id: string;
  name: string;
  is_active: boolean;
  last_seen: string | null;
}

interface DeviceForm {
  device_id: string;
  name: string;
}

const fetchDevices = async (): Promise<Device[]> => {
  const res = await api.get('/admin/devices');
  return res.data.devices;
};

const createDevice = async (data: DeviceForm) => {
  await api.post('/admin/devices', data);
};

const deleteDevice = async (id: string) => {
  await api.delete(`/admin/devices/${id}`);
};

const DeviceTester = ({ deviceId, onClose }: { deviceId: string; onClose: () => void }) => {
  const { t } = useTranslation();
  const [puntosEstado, setPuntosEstado] = useState([false, false, false, false, false, false]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(t('admin.checking'));
  const [activePoints, setActivePoints] = useState(t('common.loading'));

  const ordenVisual = [0, 3, 1, 4, 2, 5];

  const checkConnection = async () => {
    try {
      const res = await api.get('/devices/device-status');
      if (res.data.conectado) {
        setConnectionStatus(t('admin.connected', { time: res.data.tiempo_respuesta_ms || 0 }));
        setIsConnected(true);
        return true;
      } else {
        setConnectionStatus(t('admin.disconnected', { error: res.data.error || '' }));
        setIsConnected(false);
        return false;
      }
    } catch {
      setConnectionStatus(t('admin.connectionError'));
      setIsConnected(false);
      return false;
    }
  };

  const loadEstado = async () => {
    try {
      const res = await api.get('/devices/status');
      if (res.data.estados) setPuntosEstado(res.data.estados);
    } catch (err) {
      console.error('Error cargando estado:', err);
    }
  };

  const togglePunto = async (punto: number) => {
    if (!isConnected) return;
    try {
      const res = await api.post('/devices/toggle', { punto });
      if (res.data.estado !== undefined) {
        setPuntosEstado(prev => {
          const nuevo = [...prev];
          nuevo[punto] = res.data.estado;
          return nuevo;
        });
      }
    } catch (err) {
      console.error('Error toggling punto:', err);
    }
  };

  const sendLetter = async (letra: string) => {
    if (!isConnected) return;
    try {
      const res = await api.post('/devices/letter', { letra });
      if (res.data.estados) setPuntosEstado(res.data.estados);
      return res.data;
    } catch (err) {
      console.error('Error enviando letra:', err);
      return null;
    }
  };

  const clearPoints = async () => {
    if (!isConnected) return;
    try {
      await api.post('/devices/clear');
      await loadEstado();
    } catch (err) {
      console.error('Error limpiando puntos:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      const ok = await checkConnection();
      if (ok) await loadEstado();
    };
    init();
  }, []);

  useEffect(() => {
    const points = puntosEstado.reduce((acc: number[], active, idx) => {
      if (active) acc.push(idx + 1);
      return acc;
    }, []);
    setActivePoints(points.length ? t('admin.activePoints', { points: points.join(', ') }) : t('admin.activePointsNone'));
  }, [puntosEstado]);

  const handleSendLetter = async () => {
    const input = document.getElementById('testerLetterInput') as HTMLInputElement | null;
    if (!input) return;
    const letra = input.value.trim().toUpperCase();
    if (!letra || !/^[A-Z]$/.test(letra)) {
      alert(t('admin.validLetter'));
      return;
    }
    await sendLetter(letra);
    input.value = '';
  };

  const handleClear = () => clearPoints();
  const handleRefresh = async () => {
    const ok = await checkConnection();
    if (ok) await loadEstado();
  };

  return (
    <div className="devices-container" style={{ padding: 0 }}>
      <div className="devices-card" style={{ boxShadow: 'none', margin: 0 }}>
        <header className="devices-header">
          <h1>{t('admin.testingDevice', { id: deviceId })}</h1>
          <p className="devices-subtitle">{t('admin.brailleSubtitle')}</p>
        </header>
        <div className="devices-content">
          <div className="status-section">
            <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              <span className="status-indicator"></span>
              {connectionStatus}
            </div>
            <div className="active-points">{activePoints}</div>
          </div>

          <div className="control-section">
            <h2>{t('admin.braillePoints')}</h2>
            <div className="braille-grid">
              {ordenVisual.map((puntoIndex) => (
                <button
                  key={puntoIndex}
                  className={`braille-btn ${puntosEstado[puntoIndex] ? 'active' : 'inactive'}`}
                  onClick={() => togglePunto(puntoIndex)}
                  disabled={!isConnected}
                  aria-label={t('admin.pointLabel', { number: puntoIndex + 1 })}
                >
                  <span className="point-number">{t('admin.pointLabel', { number: puntoIndex + 1 })}</span>
                  <span className="point-state">{puntosEstado[puntoIndex] ? 'ON' : 'OFF'}</span>
                </button>
              ))}
            </div>

            <div className="letter-section">
              <h3>{t('admin.sendLetter')}</h3>
              <div className="letter-input-group">
                <label htmlFor="testerLetterInput" className="sr-only">{t('admin.letterToSend')}</label>
                <input
                  type="text"
                  id="testerLetterInput"
                  maxLength={1}
                  placeholder={t('admin.letterPlaceholder')}
                  onKeyUp={(e) => { (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.toUpperCase(); }}
                  disabled={!isConnected}
                  aria-label={t('admin.letterToSend')}
                />
                <button className="btn btn-primary" onClick={handleSendLetter} disabled={!isConnected}>
                  {t('admin.sendLetter')}
                </button>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn btn-secondary" onClick={handleClear} disabled={!isConnected}>
                {t('admin.clearAll')}
              </button>
              <button className="btn btn-ghost" onClick={handleRefresh}>
                {t('admin.refreshStatus')}
              </button>
            </div>
            <button className="btn btn-back" onClick={onClose} style={{ marginTop: '1rem' }}>
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Devices = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [testingDevice, setTestingDevice] = useState<string | null>(null);
  const { addToast } = useToast();
  const { t } = useTranslation();

  const initialForm: DeviceForm = { device_id: '', name: '' };
  const validateDevice = (values: DeviceForm) => {
    const errors: Record<string, string> = {};
    if (!values.device_id?.trim()) errors.device_id = t('admin.deviceIdRequired');
    return errors;
  };
  const { values, errors, handleChange, handleSubmit, resetForm } = useForm(initialForm, validateDevice);

  const { data: devices, isLoading, isError, error } = useQuery<Device[]>({
    queryKey: ['adminDevices'],
    queryFn: fetchDevices,
  });

  const createMutation = useMutation({
    mutationFn: createDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDevices'] });
      addToast(t('admin.deviceCreated'), 'success');
      closeModal();
    },
    onError: (err: any) => addToast(err.response?.data?.detail || t('admin.deviceCreateError'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDevices'] });
      addToast(t('admin.deviceDeleted'), 'success');
    },
    onError: (err: any) => addToast(err.response?.data?.detail || t('admin.deviceDeleteError'), 'error'),
  });

  const openModal = () => {
    resetForm(initialForm);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleDelete = (deviceId: string) => {
    if (window.confirm(t('admin.deleteDeviceConfirm'))) {
      deleteMutation.mutate(deviceId);
    }
  };

  const onSubmit = async (formValues: DeviceForm) => {
    await createMutation.mutateAsync({
      device_id: formValues.device_id,
      name: formValues.name || formValues.device_id,
    });
  };

  if (isLoading) return (
    <div className="loading-container" role="status">
      <div className="spinner spinner-dark"></div>
      <span className="loading-text">{t('admin.loadingDevices')}</span>
    </div>
  );

  if (isError) return <div className="alert alert-error">Error: {(error as any).message}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2>{t('admin.deviceManagement')}</h2>
        <button onClick={openModal} className="btn btn-primary">
          <Plus size={18} /> {t('admin.newDevice')}
        </button>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={t('admin.newDevice')}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="device_id_input">{t('admin.deviceIdRequired')}</label>
            <input id="device_id_input" name="device_id" value={values.device_id} onChange={handleChange} />
            {errors.device_id && <span className="form-error" role="alert">{errors.device_id}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="device_name_input">{t('common.name')} ({t('common.optional')})</label>
            <input id="device_name_input" name="name" value={values.name} onChange={handleChange} />
          </div>
          <div className="flex gap-2 mt-2">
            <button type="submit" className="btn btn-primary" disabled={createMutation.isLoading}>{t('common.save')}</button>
            <button type="button" className="btn btn-ghost" onClick={closeModal}>{t('common.cancel')}</button>
          </div>
        </form>
      </Modal>

      {testingDevice && (
        <Modal
          isOpen={!!testingDevice}
          onClose={() => setTestingDevice(null)}
          title={t('admin.testerTitle', { id: testingDevice })}
          width="600px"
        >
          <DeviceTester deviceId={testingDevice} onClose={() => setTestingDevice(null)} />
        </Modal>
      )}

      {!devices || devices.length === 0 ? (
        <div className="card text-center">{t('admin.noDevices')}</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t('admin.id')}</th>
                <th>{t('common.name')}</th>
                <th>{t('admin.active')}</th>
                <th>{t('admin.lastSeen')}</th>
                <th>{t('common.edit')}</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((dev: Device) => (
                <tr key={dev.id}>
                  <td data-label={t('admin.id')}>{dev.id}</td>
                  <td data-label={t('common.name')}>{dev.name}</td>
                  <td data-label={t('admin.active')}>{dev.is_active ? <span className="badge badge-success">{t('admin.yes')}</span> : <span className="badge badge-error">{t('admin.no')}</span>}</td>
                  <td data-label={t('admin.lastSeen')}>{dev.last_seen || <span className="badge badge-error">{t('admin.never')}</span>}</td>
                  <td data-label={t('common.edit')}>
                    <div className="table-actions">
                      <button onClick={() => setTestingDevice(dev.id)} className="btn btn-secondary" title={t('admin.deviceTest')}>
                        <Play size={16} /> {t('admin.test')}
                      </button>
                      <button onClick={() => handleDelete(dev.id)} disabled={deleteMutation.isLoading} className="btn btn-danger" title={t('admin.deleteTooltip')}>
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

export default Devices;
