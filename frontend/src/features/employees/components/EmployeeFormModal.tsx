import React from 'react';
import type { Employee, Branch, Position } from '@/types/domain.types';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { useEmployeeForm } from '../hooks/useEmployeeForm';
import { EmployeeBasicInfoFields } from './form/EmployeeBasicInfoFields';
import { EmployeeWorkBranchFields } from './form/EmployeeWorkBranchFields';
import { EmployeeContractFields } from './form/EmployeeContractFields';
import {
  UserCog,
  UserPlus,
  X,
  Save,
  ShieldCheck,
} from 'lucide-react';

interface EmployeeFormModalProps {
  isOpen: boolean;
  initialData: Employee | null;
  branches: Branch[];
  positions: Position[];
  onClose: () => void;
  onSubmit: (employee: Omit<Employee, 'id'> & { id?: number }) => void;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  initialData,
  branches,
  positions: inputPositions,
  onClose,
  onSubmit,
}) => {
  const positions = inputPositions || [];
  const modalRef = useModalFocusTrap({ isOpen, onClose });

  const {
    formData,
    errors,
    isDirector,
    availableBranchesForSecondary,
    updateField,
    addSecondaryBranch,
    updateSecondaryBranch,
    removeSecondaryBranch,
    handleSubmit,
  } = useEmployeeForm({
    isOpen,
    initialData,
    branches,
    positions,
    onSubmit,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-form-modal-title"
    >
      <div
        ref={modalRef}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "var(--font-family, 'Be Vietnam Pro', 'Inter', -apple-system, sans-serif)",
          animation: 'modalSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header - Enterprise Clean Linear Style */}
        <div
          style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E2E8F0',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: initialData
                  ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)'
                  : 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                color: initialData ? '#2563EB' : '#16A34A',
                border: initialData ? '1px solid #BFDBFE' : '1px solid #BBF7D0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
              }}
            >
              {initialData ? <UserCog size={22} strokeWidth={2.2} /> : <UserPlus size={22} strokeWidth={2.2} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2
                  id="employee-form-modal-title"
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#0F172A',
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {initialData ? 'Cập Nhật Hồ Sơ Nhân Viên' : 'Thêm Mới Nhân Sự'}
                </h2>
                {initialData && (
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    {formData.employeeCode}
                  </span>
                )}
              </div>
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: '13px',
                  color: '#64748B',
                }}
              >
                {initialData
                  ? `Điều chỉnh thông tin làm việc, phân quyền cơ sở và chức danh cho ${formData.fullName || 'nhân viên'}`
                  : 'Thiết lập thông tin cá nhân, chi nhánh trực thuộc và vị trí chuyên môn'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng biểu mẫu nhân viên"
            style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              cursor: 'pointer',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F1F5F9';
              e.currentTarget.style.color = '#0F172A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.color = '#64748B';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body - Card Grouped Layout */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            <EmployeeBasicInfoFields
              formData={formData}
              errors={errors}
              initialData={initialData}
              updateField={updateField}
            />

            <EmployeeWorkBranchFields
              formData={formData}
              branches={branches}
              positions={positions}
              isDirector={isDirector}
              initialData={initialData}
              availableBranchesForSecondary={availableBranchesForSecondary}
              updateField={updateField}
              addSecondaryBranch={addSecondaryBranch}
              updateSecondaryBranch={updateSecondaryBranch}
              removeSecondaryBranch={removeSecondaryBranch}
            />

            <EmployeeContractFields
              formData={formData}
              isDirector={isDirector}
              updateField={updateField}
            />
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '16px 24px',
              backgroundColor: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#64748B' }}>
              <ShieldCheck size={14} color="#16A34A" />
              <span>Dữ liệu đồng bộ tức thời trên hệ thống và lịch ca</span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-default"
                onClick={onClose}
                style={{
                  height: 40,
                  minWidth: 84,
                  fontWeight: 500,
                  borderRadius: '8px',
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  height: 40,
                  minWidth: 130,
                  padding: '0 18px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
                }}
              >
                <Save size={16} /> Lưu hồ sơ
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
