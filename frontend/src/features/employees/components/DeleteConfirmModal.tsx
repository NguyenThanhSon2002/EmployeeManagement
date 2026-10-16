import React from 'react';
import type { Employee } from '@/types/domain.types';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  employee: Employee | null;
  departmentName?: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  employee,
  departmentName,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  const modalRef = useModalFocusTrap({ isOpen, onClose });

  if (!isOpen || !employee) return null;

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
      aria-labelledby="delete-dialog-title"
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
            padding: '20px 24px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-full, 9999px)',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={24} />
          </div>

          <div style={{ flex: 1 }}>
            <h2
              id="delete-dialog-title"
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary, #0F172A)',
                margin: 0,
              }}
            >
              Xác nhận xóa hồ sơ nhân viên
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--color-text-secondary, #64748B)',
                margin: '4px 0 0',
              }}
            >
              Hành động này sẽ thực hiện ngừng hoạt động hồ sơ nhân viên trong hệ thống.
            </p>
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
              borderRadius: 'var(--radius-sm, 6px)',
            }}
            aria-label="Đóng hộp thoại"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px' }}>
          <p style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--color-text-primary, #1E293B)' }}>
            Bạn có chắc chắn muốn xóa hồ sơ của nhân sự sau đây không?
          </p>

          {/* Employee Card Preview */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--color-border, #E2E8F0)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '13.5px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary, #64748B)' }}>Họ và tên:</span>
              <strong style={{ color: 'var(--color-text-primary, #0F172A)' }}>{employee.fullName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary, #64748B)' }}>Mã nhân viên:</span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  color: 'var(--color-primary, #2563EB)',
                }}
              >
                {employee.employeeCode}
              </span>
            </div>
            {departmentName && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary, #64748B)' }}>Phòng ban:</span>
                <span style={{ color: 'var(--color-text-primary, #0F172A)' }}>{departmentName}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary, #64748B)' }}>Email:</span>
              <span style={{ color: 'var(--color-text-primary, #0F172A)' }}>{employee.email}</span>
            </div>
          </div>

          {/* Legal Warning Box */}
          <div
            style={{
              marginTop: '16px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '12px',
              color: '#92400E',
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontSize: '15px' }}>ℹ️</span>
            <div>
              <strong>Tuân thủ quy định:</strong> Nhân viên sẽ được chuyển sang trạng thái <em>Đã nghỉ việc</em> và ẩn khỏi danh sách phân ca. Toàn bộ lịch sử chấm công, đơn phép và phân ca trước đây vẫn được lưu trữ bảo lưu trên hệ thống CSDL MySQL theo Luật Lao Động 2019.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
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
            Hủy bỏ
          </button>
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
              transition: 'background-color 0.15s ease',
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Đang xóa...
              </>
            ) : (
              <>
                <Trash2 size={16} /> Xác nhận xóa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
