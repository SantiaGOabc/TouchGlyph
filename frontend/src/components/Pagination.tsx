import { useTranslation } from 'react-i18next';
import './Pagination.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages, start + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="pagination" role="navigation" aria-label="Paginación">
      <button
        className="pagination-btn"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label={t('common.prev')}
      >
        &laquo; {t('common.prev')}
      </button>

      {start > 1 && (
        <>
          <button className="pagination-btn" onClick={() => onPageChange(1)}>1</button>
          {start > 2 && <span className="pagination-dots">...</span>}
        </>
      )}

      {pages.map(p => (
        <button
          key={p}
          className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
          onClick={() => onPageChange(p)}
          aria-current={p === currentPage ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="pagination-dots">...</span>}
          <button className="pagination-btn" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
        </>
      )}

      <button
        className="pagination-btn"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label={t('common.next')}
      >
        {t('common.next')} &raquo;
      </button>
    </nav>
  );
};

export default Pagination;
