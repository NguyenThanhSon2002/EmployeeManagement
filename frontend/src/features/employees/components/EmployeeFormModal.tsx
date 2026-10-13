import React, { useState, useEffect } from 'react';
import type { Employee, Department, Position, EmploymentStatus } from '@/types/domain.types';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { X, Check } from 'lucide-react';

interface EmployeeFormModalProps {
  isOpen: boolean;
  initialData: Employee | null;
  departments: Department[];
  positions: Position[];
  onClose: () => void;
  onSubmit: (employee: Omit<Employee, 'id'> & { id?: number }) => void;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  initialData,
  departments,
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
    departmentId: 2,
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
        departmentId: initialData.departmentId,
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
        departmentId: 2,
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
        aria-labelledby="employee-form-heading"
        aria-modal="true"
        style={{ width: 640 }}
      >
        <div
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 id="employee-form-heading" style={{ fontSize: 'var(--font-h3)', fontWeight: 600 }}>
            {initialData ? 'Chỉnh Sửa Hồ Sơ Nhân Viên' : 'Thêm Nhân Viên Mới'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Đóng form">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-lg)', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
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

            {/* Employee Code */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-caption)', marginBottom: 4 }}>
                Mã Nhân Viên *
              </label>
              <input
                type="text"
                className="input-base"
                style={{ width: '100%' }}
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
              />
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
                placeholder="user@company.com"
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

            {/* Department */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-caption)', marginBottom: 4 }}>
                Phòng Ban *
              </label>
              <select
                className="input-base"
                style={{ width: '100%' }}
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: Number(e.target.value) })}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.departmentName}
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
                <option value="OFFICIAL">Chính thức (Official)</option>
                <option value="PROBATION">Thử việc (Probation)</option>
                <option value="ON_LEAVE">Nghỉ thai sản / chế độ</option>
                <option value="RESIGNED">Đã thôi việc (Resigned)</option>
              </select>
            </div>

            {/* Hire Date */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-caption)', marginBottom: 4 }}>
                Ngày Vào Làm
              </label>
              <input
                type="date"
                className="input-base"
                style={{ width: '100%' }}
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              />
            </div>
          </div>
        </form>

        <div
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            backgroundColor: '#fafafa',
          }}
        >
          <button type="button" className="btn btn-default" onClick={onClose}>
            Hủy bỏ
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Check size={16} /> Lưu hồ sơ
          </button>
        </div>
      </div>
    </>
  );
};
