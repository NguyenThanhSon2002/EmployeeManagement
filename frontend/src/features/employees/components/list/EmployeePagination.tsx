import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EmployeePaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  setCurrentPage: (page: number | ((p: number) => number)) => void;
}

export const EmployeePagination: React.FC<EmployeePaginationProps> = ({
  currentPage,
  totalPages,
  totalResults,
  setCurrentPage,
}) => {
  return (
    <div
      style={{
        padding: '12px 18px',
        borderTop: '1px solid var(--color-border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        fontSize: '12.5px',
        color: 'var(--color-text-secondary)',
      }}
    >
      <div>
        Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong> (Tổng cộng {totalResults} nhân viên)
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          className="btn btn-default"
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          style={{ height: 32, padding: '0 10px' }}
        >
          <ChevronLeft size={15} /> Trước
        </button>
        <button
          type="button"
          className="btn btn-default"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          style={{ height: 32, padding: '0 10px' }}
        >
          Sau <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};
