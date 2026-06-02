import { type ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: string;
}

const Modal = ({ isOpen, onClose, title, children, width }: Props) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={width ? { maxWidth: width } : undefined}
      >
        {title && (
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
            <button
              onClick={onClose}
              className="modal-close-btn"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
