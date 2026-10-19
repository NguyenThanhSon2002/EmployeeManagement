import React from 'react';
import type { Branch } from '@/types/domain.types';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { AlertTriangle, AlertCircle, Trash2, X, Loader2, Users } from 'lucide-react';

interface DeleteBranchModalProps {
  isOpen: boolean;
  branch: Branch | null;
  employeeCount: number;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const DeleteBranchModal: React.FC<DeleteBranchModalProps> = ({
  isOpen,
  branch,
  employeeCount,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  const modalRef = useModalFocusTrap({ isOpen, onClose });

  if (!isOpen || !branch) return null;

  const hasEmployees = employeeCount > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-branch-dialog-title"
    >
      <div
        ref={modalRef}
        className="card"
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)',
            backgroundColor: hasEmployees ? '#FFFBEB' : '#FEF2F2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '8px',
                backgroundColor: hasEmployees ? '#FEF3C7' : '#FEE2E2',
                color: hasEmployees ? '#D97706' : '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {hasEmployees ? <AlertTriangle size={22} /> : <AlertCircle size={22} />}
            </div>
            <div>
              <h2
                id="delete-branch-dialog-title"
                style={{
                  fontSize: '16.5px',
                  fontWeight: 700,
                  color: hasEmployees ? '#92400E' : '#991B1B',
                  margin: 0,
                }}
              >
                {hasEmployees ? 'Không Thể Xóa Chi Nhánh' : 'Xác Nhận Xóa Chi Nhánh'}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748B' }}>
                Cơ sở: <strong>{branch.branchName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              color: 'var(--color-text-muted, #94A3B8)',
              padding: 4,
            }}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px' }}>
          {hasEmployees ? (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#B91C1C', fontWeight: 600, fontSize: '13.5px' }}>
                <Users size={18} />
                <span>Chi nhánh hiện đang có {employeeCount} nhân sự trực thuộc!</span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#7F1D1D', lineHeight: 1.5 }}>
                Để đảm bảo toàn vẹn dữ liệu hợp đồng, bảng lương và chấm công, hệ thống <strong>chặn xóa</strong> chi nhánh này.
              </p>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#991B1B', lineHeight: 1.4 }}>
                👉 <strong>Giải pháp:</strong> Vui lòng truy cập danh sách nhân sự và điều chuyển tất cả {employeeCount} nhân sự sang cơ sở khác trước khi thực hiện xóa.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-primary, #1E293B)', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa chi nhánh <strong>{branch.branchName}</strong> không?
              </p>
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  fontSize: '12.5px',
                  color: '#64748B',
                }}
              >
                ℹ️ Thao tác này sẽ vô hiệu hóa và chuyển chi nhánh vào trạng thái đã xóa (soft-delete).
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid var(--color-border-subtle, #E2E8F0)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            className="btn btn-default"
            onClick={onClose}
            disabled={isDeleting}
            style={{ height: 38, minWidth: 80 }}
          >
            {hasEmployees ? 'Đã hiểu' : 'Hủy'}
          </button>

          {!hasEmployees && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              style={{
                height: 38,
                minWidth: 120,
                padding: '0 16px',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-md, 6px)',
                fontWeight: 600,
                fontSize: '13.5px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.8 : 1,
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 size={16} /> Xóa Chi Nhánh
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
