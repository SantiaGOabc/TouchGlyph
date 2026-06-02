import { type ReactNode, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, Info, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const variantConfig = {
  danger: { icon: AlertTriangle, color: 'var(--color-error)', bg: 'var(--color-error-bg)' },
  warning: { icon: AlertTriangle, color: '#f59e0b', bg: '#fef3c7' },
  info: { icon: Info, color: 'var(--color-secondary)', bg: 'var(--color-secondary-bg)' },
};

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}: Props) => {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    setTimeout(() => confirmRef.current?.focus(), 50);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !confirmRef.current) return;
        const focusable = confirmRef.current.parentElement?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      };
      window.addEventListener('keydown', handleTab);
      return () => window.removeEventListener('keydown', handleTab);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const { icon: Icon, color, bg } = variantConfig[variant];

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-content confirm-modal-content" onClick={e => e.stopPropagation()} role="document">
        <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: bg, color, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }} aria-hidden="true">
            <Icon size={32} />
          </div>
          <h3 className="modal-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }} id="confirm-modal-title">{title}</h3>
          <p style={{ color: 'var(--color-gray-600)', lineHeight: 1.6, margin: 0 }} id="confirm-modal-desc">{message}</p>
        </div>

        <div className="flex gap-2" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            className={`btn ${variant === 'danger' ? 'btn-danger' : variant === 'warning' ? 'btn-warning' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? <span className="spinner" /> : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;