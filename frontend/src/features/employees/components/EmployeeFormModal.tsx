import React, { useState, useEffect } from 'react';
import type { Employee, Branch, Position, EmploymentStatus } from '@/types/domain.types';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { X, Check } from 'lucide-react';

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
    positionId: 2,
    employmentStatus: 'OFFICIAL' as EmploymentStatus,
    hireDate: '2024-01-01',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        employeeCode: initialData.employeeCode,
        fullName: initialData.fullName,
        email: initialData.email,
        phoneNumber: initialData.phoneNumber,
        branchId: initialData.branchId,
        positionId: initialData.positionId,
        employmentStatus: initialData.employmentStatus,
        hireDate: initialData.hireDate,
        isActive: initialData.isActive,
      });
    } else {
      setFormData({
        employeeCode: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        fullName: '',
        email: '',
        phoneNumber: '',
        branchId: 1,
        positionId: 2,
        employmentStatus: 'OFFICIAL',
        hireDate: new Date().toISOString().split('T')[0],
        isActive: true,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const err: Record<string, string> = {};
    if (!formData.fullName.trim()) err.fullName = 'Họ và tên không được để trống';
    if (!formData.email.trim() || !formData.email.includes('@')) {
      err.email = 'Email không hợp lệ (cần định dạng @company.com)';
    }
    if (!formData.phoneNumber.trim() || !/^\d{10}$/.test(formData.phoneNumber)) {
      err.phoneNumber = 'Số điện thoại phải gồm đúng 10 chữ số';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...(initialData ? { id: initialData.id } : {}),
      managerId: null,
      ...formData,
    });
    onClose();
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={modalRef}
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-form-modal-title"
      >
        <div className="modal-header">
          <h2 id="employee-form-modal-title" style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
            {initialData ? 'Cập Nhật Hồ Sơ Nhân Viên' : 'Thêm Nhân Viên Mới'}
          </h2>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Đóng biểu mẫu nhân viên"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Employee Code */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-caption)', marginBottom: 4 }}>
                Mã Nhân Viên *
              </label>
              <input
                type="text"
                className="input-base"
                style={{ width: '100%', fontFamily: 'monospace' }}
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value.toUpperCase() })}
                disabled={!!initialData}
              />
            </div>

            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-caption)', marginBottom: 4 }}>
                Họ và Tên *
              </label>
              <input
                type="text"
                className="input-base"
                style={{ width: '100%', borderColor: errors.fullName ? 'var(--color-error)' : undefined }}
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
              {errors.fullName && <div style={{ fontSize: 11, color: 'var(--color-error)', marginTop: 2 }}>{errors.fullName}</div>}
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-caption)', marginBottom: 4 }}>
                Email Doanh Nghiệp *
              </label>
              <input
                type="email"
                className="input-base"
                style={{ width: '100%', borderColor: errors.email ? 'var(--color-error)' : undefined }}
                placeholder="an.nguyen@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && <div style={{ fontSize: 11, color: 'var(--color-error)', marginTop: 2 }}>{errors.email}</div>}
            </div>

            {/* Phone Number */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-caption)', marginBottom: 4 }}>
                Số Điện Thoại (10 số) *
              </label>
              <input
                type="tel"
                className="input-base"
                style={{ width: '100%', borderColor: errors.phoneNumber ? 'var(--color-error)' : undefined }}
                placeholder="0901234567"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
              {errors.phoneNumber && <div style={{ fontSize: 11, color: 'var(--color-error)', marginTop: 2 }}>{errors.phoneNumber}</div>}
            </div>

            {/* Branch */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-caption)', marginBottom: 4 }}>
                Chi Nhánh / Cơ Sở Làm Việc *
              </label>
              <select
                className="input-base"
                style={{ width: '100%' }}
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: Number(e.target.value) })}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branchName}
                  </option>
                ))}
              </select>
            </div>

            {/* Position */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-caption)', marginBottom: 4 }}>
                Chức Danh *
              </label>
              <select
                className="input-base"
                style={{ width: '100%' }}
                value={formData.positionId}
                onChange={(e) => setFormData({ ...formData, positionId: Number(e.target.value) })}
              >
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.positionName}
                  </option>
                ))}
              </select>
            </div>

            {/* Employment Status */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-caption)', marginBottom: 4 }}>
                Trạng Thái Hợp Đồng
              </label>
              <select
                className="input-base"
                style={{ width: '100%' }}
                value={formData.employmentStatus}
                onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as EmploymentStatus })}
              >
                <option value="OFFICIAL">Chính thức</option>
                <option value="PROBATION">Thử việc</option>
                <option value="ON_LEAVE">Nghỉ chế độ / Tạm hoãn</option>
                <option value="RESIGNED">Đã nghỉ việc</option>
              </select>
            </div>

            {/* Hire Date */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-caption)', marginBottom: 4 }}>
                Ngày Vào Làm *
              </label>
              <input
                type="date"
                className="input-base"
                style={{ width: '100%' }}
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              />
            </div>

            {/* Active Status Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <input
                type="checkbox"
                id="emp-is-active"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ width: 16, height: 16 }}
              />
              <label htmlFor="emp-is-active" style={{ fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}>
                Kích hoạt tài khoản người dùng ngay lập tức
              </label>
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-default" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={16} /> Lưu hồ sơ
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
