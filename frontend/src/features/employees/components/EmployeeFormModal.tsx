import React, { useState, useEffect } from 'react';
import type { Employee, Branch, Position, EmploymentStatus } from '@/types/domain.types';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { UserCog, UserPlus, X, Save } from 'lucide-react';

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
  positions,
  onClose,
  onSubmit,
}) => {
  const modalRef = useModalFocusTrap({ isOpen, onClose });

  const [formData, setFormData] = useState({
    employeeCode: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    branchId: 1,
    positionId: 3,
    employmentStatus: 'OFFICIAL' as EmploymentStatus,
    hireDate: '2024-01-01',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        employeeCode: initialData.employeeCode,
        fullName: initialData.fullName,
        email: initialData.email,
        phoneNumber: initialData.phoneNumber || '',
        branchId: initialData.branchId || 1,
        positionId: initialData.positionId || 3,
        employmentStatus: initialData.employmentStatus || 'OFFICIAL',
        hireDate: initialData.hireDate || '2024-01-01',
      });
    } else {
      setFormData({
        employeeCode: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        fullName: '',
        email: '',
        phoneNumber: '',
        branchId: branches.length > 0 ? branches[0].id : 1,
        positionId: 3,
        employmentStatus: 'OFFICIAL',
        hireDate: new Date().toISOString().split('T')[0],
      });
    }
    setErrors({});
  }, [initialData, isOpen, branches]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const err: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      err.fullName = 'Họ và tên không được để trống';
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      err.email = 'Email không hợp lệ (cần định dạng @company.com)';
    }

    if (!formData.phoneNumber.trim() || !/^\d{10}$/.test(formData.phoneNumber.trim())) {
      err.phoneNumber = 'Số điện thoại phải gồm đúng 10 chữ số';
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const isEmpActive = formData.employmentStatus !== 'RESIGNED';

    onSubmit({
      ...(initialData ? { id: initialData.id } : {}),
      managerId: null,
      employeeCode: formData.employeeCode.trim(),
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      branchId: formData.branchId,
      positionId: formData.positionId,
      employmentStatus: formData.employmentStatus,
      hireDate: formData.hireDate,
      isActive: isEmpActive,
    });
    onClose();
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
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-form-modal-title"
    >
      <div
        ref={modalRef}
        className="card"
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
          fontFamily: "var(--font-family, 'Be Vietnam Pro', 'Inter', -apple-system, sans-serif)",
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary-light, #EFF6FF)',
                color: 'var(--color-primary, #2563EB)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {initialData ? <UserCog size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h2
                id="employee-form-modal-title"
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary, #0F172A)',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                {initialData ? 'Cập Nhật Hồ Sơ Nhân Viên' : 'Thêm Nhân Viên Mới'}
              </h2>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '12.5px',
                  color: 'var(--color-text-secondary, #64748B)',
                }}
              >
                {initialData
                  ? `Chỉnh sửa thông tin [${formData.employeeCode}] - ${formData.fullName || 'Nhân viên'}`
                  : 'Thiết lập thông tin nhân sự, chi nhánh và chức danh'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng biểu mẫu nhân viên"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--color-text-muted, #94A3B8)',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              maxHeight: 'calc(80vh - 120px)',
              overflowY: 'auto',
            }}
          >
            {/* Row 1: Code and Full Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: 5,
                    color: '#334155',
                  }}
                >
                  Mã Nhân Viên <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.employeeCode}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeCode: e.target.value.toUpperCase() })
                  }
                  disabled={!!initialData}
                  style={{
                    width: '100%',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    backgroundColor: initialData ? '#F1F5F9' : '#FFFFFF',
                    color: initialData ? '#64748B' : '#0F172A',
                    borderColor: '#E2E8F0',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: 5,
                    color: '#334155',
                  }}
                >
                  Họ và Tên <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="VD: Nguyễn Văn An"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  style={{
                    width: '100%',
                    borderColor: errors.fullName ? '#DC2626' : '#E2E8F0',
                  }}
                />
                {errors.fullName && (
                  <span style={{ fontSize: '11.5px', color: '#DC2626', marginTop: 4, display: 'block' }}>
                    {errors.fullName}
                  </span>
                )}
              </div>
            </div>

            {/* Row 2: Email and Phone Number */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: 5,
                    color: '#334155',
                  }}
                >
                  Email Doanh Nghiệp <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="an.nguyen@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    borderColor: errors.email ? '#DC2626' : '#E2E8F0',
                  }}
                />
                {errors.email && (
                  <span style={{ fontSize: '11.5px', color: '#DC2626', marginTop: 4, display: 'block' }}>
                    {errors.email}
                  </span>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: 5,
                    color: '#334155',
                  }}
                >
                  Số Điện Thoại (10 số) <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="tel"
                  className="input"
                  placeholder="0901234567"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  style={{
                    width: '100%',
                    borderColor: errors.phoneNumber ? '#DC2626' : '#E2E8F0',
                  }}
                />
                {errors.phoneNumber && (
                  <span style={{ fontSize: '11.5px', color: '#DC2626', marginTop: 4, display: 'block' }}>
                    {errors.phoneNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Row 3: Branch and Canonical Position */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: 5,
                    color: '#334155',
                  }}
                >
                  Chi Nhánh / Cơ Sở Làm Việc <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  className="input"
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: Number(e.target.value) })}
                  style={{ width: '100%', backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branchName} ({b.branchCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: 5,
                    color: '#334155',
                  }}
                >
                  Chức Danh <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  className="input"
                  value={formData.positionId}
                  onChange={(e) => setFormData({ ...formData, positionId: Number(e.target.value) })}
                  style={{ width: '100%', backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
                >
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.positionName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Employment Status and Hire Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: 5,
                    color: '#334155',
                  }}
                >
                  Trạng Thái Hợp Đồng
                </label>
                <select
                  className="input"
                  value={formData.employmentStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, employmentStatus: e.target.value as EmploymentStatus })
                  }
                  style={{ width: '100%', backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
                >
                  <option value="OFFICIAL">Chính thức</option>
                  <option value="PROBATION">Thử việc</option>
                  <option value="ON_LEAVE">Nghỉ chế độ / Tạm hoãn</option>
                  <option value="RESIGNED">Đã nghỉ việc</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: 5,
                    color: '#334155',
                  }}
                >
                  Ngày Vào Làm <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="date"
                  className="input"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  style={{ width: '100%', borderColor: '#E2E8F0' }}
                />
              </div>
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
              style={{ height: 38, minWidth: 80 }}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                height: 38,
                minWidth: 120,
                padding: '0 16px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontWeight: 600,
                fontSize: '13.5px',
              }}
            >
              <Save size={16} /> Lưu hồ sơ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
