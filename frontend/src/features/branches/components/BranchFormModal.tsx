import React, { useState, useEffect } from 'react';
import type { Branch, Employee } from '@/types/domain.types';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { generateSlugCode } from '@/utils/code-generator.utils';
import { Building2, X, Loader2, Save } from 'lucide-react';

interface BranchFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  branch: Branch | null;
  managers: Employee[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Branch>) => Promise<void> | void;
}

export const BranchFormModal: React.FC<BranchFormModalProps> = ({
  isOpen,
  mode,
  branch,
  managers,
  isSaving,
  onClose,
  onSubmit,
}) => {
  const modalRef = useModalFocusTrap({ isOpen, onClose });

  const [branchCode, setBranchCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [managerId, setManagerId] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && branch) {
        setBranchCode(branch.branchCode);
        setBranchName(branch.branchName);
        setAddress(branch.address || '');
        setPhoneNumber(branch.phoneNumber || '');
        setManagerId(branch.managerId || null);
        setIsActive(branch.isActive);
      } else {
        setBranchCode('');
        setBranchName('');
        setAddress('');
        setPhoneNumber('');
        setManagerId(null);
        setIsActive(true);
      }
      setErrors({});
    }
  }, [isOpen, mode, branch]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!branchName.trim()) {
      errs.branchName = 'Tên chi nhánh không được để trống';
    } else if (branchName.trim().length > 150) {
      errs.branchName = 'Tên chi nhánh không được vượt quá 150 ký tự';
    }

    if (phoneNumber.trim() && !/^[0-9+() -]{8,20}$/.test(phoneNumber.trim())) {
      errs.phoneNumber = 'Số điện thoại không hợp lệ (8 - 20 số)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalCode = branchCode.trim() || generateSlugCode(branchName, 'CN_');

    onSubmit({
      branchCode: finalCode,
      branchName: branchName.trim(),
      address: address.trim(),
      phoneNumber: phoneNumber.trim(),
      managerId: managerId || undefined,
      isActive,
    });
  };

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
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="branch-dialog-title"
    >
      <div
        ref={modalRef}
        className="card"
        style={{
          width: '100%',
          maxWidth: '540px',
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
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary-light, #EFF6FF)',
                color: 'var(--color-primary, #2563EB)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h2
                id="branch-dialog-title"
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary, #0F172A)',
                  margin: 0,
                }}
              >
                {mode === 'create' ? 'Thêm Chi Nhánh / Cơ Sở Mới' : 'Cập Nhật Thông Tin Chi Nhánh'}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--color-text-secondary, #64748B)' }}>
                {mode === 'create' ? 'Thiết lập cơ sở làm việc và quản lý phụ trách' : `Chỉnh sửa thông tin chi nhánh "${branch?.branchName}"`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              color: 'var(--color-text-muted, #94A3B8)',
              padding: 4,
            }}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Tên chi nhánh */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: 6, color: '#334155' }}>
                Tên chi nhánh / cơ sở <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="VD: Chi nhánh Hà Đông"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                disabled={isSaving}
                style={{
                  width: '100%',
                  borderColor: errors.branchName ? '#DC2626' : undefined,
                }}
              />
              {errors.branchName && (
                <span style={{ fontSize: '11.5px', color: '#DC2626', marginTop: 4, display: 'block' }}>
                  {errors.branchName}
                </span>
              )}
            </div>

            {/* Row 2: Address */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: 6, color: '#334155' }}>
                Địa chỉ cơ sở
              </label>
              <input
                type="text"
                className="input"
                placeholder="VD: 102 Quang Trung, Hà Đông, Hà Nội"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isSaving}
                style={{ width: '100%' }}
              />
            </div>

            {/* Row 3: Phone & Manager */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: 6, color: '#334155' }}>
                  Hotline / Số điện thoại
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="VD: 0243555888"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    borderColor: errors.phoneNumber ? '#DC2626' : undefined,
                  }}
                />
                {errors.phoneNumber && (
                  <span style={{ fontSize: '11.5px', color: '#DC2626', marginTop: 4, display: 'block' }}>
                    {errors.phoneNumber}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: 6, color: '#334155' }}>
                  Quản lý phụ trách cơ sở
                </label>
                <select
                  className="input"
                  value={managerId || ''}
                  onChange={(e) => setManagerId(e.target.value ? Number(e.target.value) : null)}
                  disabled={isSaving}
                  style={{ width: '100%', backgroundColor: '#FFFFFF' }}
                >
                  <option value="">-- Chưa phân công --</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Status Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: '#F8FAFC',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
              }}
            >
              <div>
                <strong style={{ fontSize: '13.5px', color: '#1E293B', display: 'block' }}>
                  Trạng thái hoạt động
                </strong>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Chi nhánh hoạt động mới có thể xếp lịch ca tuần và thêm nhân sự
                </span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isSaving}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', fontWeight: 600, color: isActive ? '#16A34A' : '#64748B' }}>
                  {isActive ? 'Đang hoạt động' : 'Tạm ngừng'}
                </span>
              </label>
            </div>
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
              disabled={isSaving}
              style={{ height: 38, minWidth: 80 }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                height: 38,
                minWidth: 120,
                padding: '0 16px',
                backgroundColor: 'var(--color-primary, #2563EB)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-md, 6px)',
                fontWeight: 600,
                fontSize: '13.5px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.8 : 1,
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <Save size={16} /> {mode === 'create' ? 'Tạo chi nhánh' : 'Lưu thay đổi'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
