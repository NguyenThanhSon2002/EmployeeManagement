import React, { useState, useEffect } from 'react';
import type { Employee, Branch, Position, EmploymentStatus } from '@/types/domain.types';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import {
  UserCog,
  UserPlus,
  X,
  Save,
  Lock,
  Plus,
  Trash2,
  Building2,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  BadgeCheck,
  AlertCircle,
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

const DEFAULT_POSITIONS: Position[] = [
  { id: 1, positionCode: 'POS_DIRECTOR', positionName: 'Giám đốc' },
  { id: 2, positionCode: 'POS_MANAGER', positionName: 'Quản lý' },
  { id: 3, positionCode: 'POS_EMPLOYEE', positionName: 'Nhân viên' },
];

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  initialData,
  branches,
  positions: inputPositions,
  onClose,
  onSubmit,
}) => {
  const positions = inputPositions && inputPositions.length > 0 ? inputPositions : DEFAULT_POSITIONS;
  const modalRef = useModalFocusTrap({ isOpen, onClose });
  const { currentRole, currentUser } = useAuthStore();
  const isDirector = currentRole === 'ROLE_DIRECTOR';
  const userBranchId = currentUser?.branchId || (branches.length > 0 ? branches[0].id : 1);

  const [formData, setFormData] = useState({
    employeeCode: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    branchId: 1,
    secondaryBranchIds: [] as number[],
    secondaryBranches: [] as Array<{ branchId: number; positionId: number }>,
    positionId: 3,
    employmentStatus: 'OFFICIAL' as EmploymentStatus,
    hireDate: '2024-01-01',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const defaultBranchId = !isDirector ? userBranchId : (branches.length > 0 ? branches[0].id : 1);

  useEffect(() => {
    if (initialData) {
      let secList: Array<{ branchId: number; positionId: number }> = [];
      if (initialData.secondaryBranches && initialData.secondaryBranches.length > 0) {
        secList = initialData.secondaryBranches.map((sb) => ({
          branchId: sb.branchId,
          positionId: sb.positionId || 3,
        }));
      } else if (initialData.secondaryBranchIds && initialData.secondaryBranchIds.length > 0) {
        secList = initialData.secondaryBranchIds.map((bId) => ({
          branchId: bId,
          positionId: 3,
        }));
      }

      setFormData({
        employeeCode: initialData.employeeCode,
        fullName: initialData.fullName,
        email: initialData.email,
        phoneNumber: initialData.phoneNumber || '',
        branchId: initialData.branchId || 1,
        secondaryBranchIds: initialData.secondaryBranchIds || [],
        secondaryBranches: secList,
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
        branchId: defaultBranchId,
        secondaryBranchIds: [],
        secondaryBranches: [],
        positionId: 3,
        employmentStatus: !isDirector ? 'PROBATION' : 'OFFICIAL',
        hireDate: new Date().toISOString().split('T')[0],
      });
    }
    setErrors({});
  }, [initialData, isOpen, defaultBranchId, isDirector]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const err: Record<string, string> = {};

    if (!formData.employeeCode.trim()) {
      err.employeeCode = 'Mã nhân viên không được để trống';
    }

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

    const effectiveBranchId = !isDirector
      ? (initialData ? initialData.branchId : userBranchId)
      : formData.branchId;

    const effectiveStatus = !isDirector
      ? (initialData ? initialData.employmentStatus : 'PROBATION')
      : formData.employmentStatus;

    const isEmpActive = effectiveStatus !== 'RESIGNED';

    const validSecondaryBranches = formData.secondaryBranches
      .filter((sb) => sb.branchId && sb.branchId !== effectiveBranchId)
      .map((sb) => {
        const b = branches.find((br) => br.id === sb.branchId);
        const p = positions.find((pos) => pos.id === sb.positionId);
        return {
          branchId: sb.branchId,
          positionId: sb.positionId,
          branchName: b?.branchName,
          positionName: p?.positionName,
        };
      });

    onSubmit({
      ...(initialData ? { id: initialData.id } : {}),
      managerId: initialData?.managerId ?? null,
      employeeCode: formData.employeeCode.trim(),
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      branchId: effectiveBranchId,
      secondaryBranchIds: validSecondaryBranches.map((sb) => sb.branchId),
      secondaryBranches: validSecondaryBranches,
      positionId: formData.positionId,
      employmentStatus: effectiveStatus,
      hireDate: formData.hireDate,
      isActive: isEmpActive,
    });
    onClose();
  };

  const availableBranchesForSecondary = branches.filter(
    (b) => b.id !== formData.branchId && !formData.secondaryBranches.some((sb) => sb.branchId === b.id)
  );

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
            {/* Group 1: Thông tin cơ bản */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '16px 18px',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748B',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <BadgeCheck size={14} color="#2563EB" />
                Thông Tin Cơ Bản & Liên Hệ
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
                {/* Employee Code */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      marginBottom: 6,
                      color: '#334155',
                    }}
                  >
                    Mã Nhân Viên <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input-base"
                    value={formData.employeeCode}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeCode: e.target.value.toUpperCase() })
                    }
                    disabled={!!initialData}
                    placeholder="VD: EMP-101"
                    style={{
                      width: '100%',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      backgroundColor: initialData ? '#F8FAFC' : '#FFFFFF',
                      color: initialData ? '#64748B' : '#0F172A',
                      borderColor: errors.employeeCode ? '#DC2626' : '#E2E8F0',
                    }}
                  />
                  {errors.employeeCode && (
                    <span style={{ fontSize: '11.5px', color: '#DC2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={12} /> {errors.employeeCode}
                    </span>
                  )}
                </div>

                {/* Full Name */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      marginBottom: 6,
                      color: '#334155',
                    }}
                  >
                    Họ và Tên Nhân Sự <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input-base"
                    placeholder="VD: Nguyễn Văn An"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    style={{
                      width: '100%',
                      borderColor: errors.fullName ? '#DC2626' : '#E2E8F0',
                    }}
                  />
                  {errors.fullName && (
                    <span style={{ fontSize: '11.5px', color: '#DC2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={12} /> {errors.fullName}
                    </span>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '12.5px',
                      fontWeight: 600,
                      marginBottom: 6,
                      color: '#334155',
                    }}
                  >
                    <Mail size={13} color="#64748B" /> Email Doanh Nghiệp <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="email"
                    className="input-base"
                    placeholder="an.nguyen@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      borderColor: errors.email ? '#DC2626' : '#E2E8F0',
                    }}
                  />
                  {errors.email && (
                    <span style={{ fontSize: '11.5px', color: '#DC2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={12} /> {errors.email}
                    </span>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '12.5px',
                      fontWeight: 600,
                      marginBottom: 6,
                      color: '#334155',
                    }}
                  >
                    <Phone size={13} color="#64748B" /> Số Điện Thoại (10 số) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    className="input-base"
                    placeholder="0901234567"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    style={{
                      width: '100%',
                      borderColor: errors.phoneNumber ? '#DC2626' : '#E2E8F0',
                    }}
                  />
                  {errors.phoneNumber && (
                    <span style={{ fontSize: '11.5px', color: '#DC2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={12} /> {errors.phoneNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Group 2: Cơ sở chính & Chức danh chính */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '16px 18px',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748B',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Building2 size={14} color="#2563EB" />
                Cơ Sở Trực Thuộc & Chức Danh Chính
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
                {/* Primary Branch */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: '#334155',
                        margin: 0,
                      }}
                    >
                      Cơ Sở Làm Việc Chính <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    {!isDirector && (
                      <span
                        style={{
                          fontSize: '10.5px',
                          color: '#64748B',
                          backgroundColor: '#F1F5F9',
                          padding: '1px 6px',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          fontWeight: 500,
                        }}
                      >
                        <Lock size={10} /> Cố định
                      </span>
                    )}
                  </div>
                  <select
                    className="input-base"
                    value={formData.branchId}
                    disabled={!isDirector}
                    onChange={(e) => setFormData({ ...formData, branchId: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      backgroundColor: !isDirector ? '#F8FAFC' : '#FFFFFF',
                      color: !isDirector ? '#475569' : '#0F172A',
                      cursor: !isDirector ? 'not-allowed' : 'pointer',
                      fontWeight: 500,
                    }}
                    title={!isDirector ? 'Chỉ Giám đốc mới có quyền điều chuyển chi nhánh làm việc' : undefined}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branchName}
                      </option>
                    ))}
                  </select>
                  {!isDirector && (
                    <p style={{ fontSize: '11px', color: '#94A3B8', margin: '4px 0 0 0' }}>
                      Phân bổ cơ sở chính do Giám đốc quản lý
                    </p>
                  )}
                </div>

                {/* Primary Position */}
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '12.5px',
                      fontWeight: 600,
                      marginBottom: 6,
                      color: '#334155',
                    }}
                  >
                    <Briefcase size={13} color="#64748B" /> Chức Danh Chính <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    className="input-base"
                    value={formData.positionId}
                    onChange={(e) => setFormData({ ...formData, positionId: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      backgroundColor: '#FFFFFF',
                      color: '#0F172A',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.positionName}
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '11px', color: '#94A3B8', margin: '4px 0 0 0' }}>
                    Áp dụng cho ca làm việc tại cơ sở chính
                  </p>
                </div>
              </div>
            </div>

            {/* Group 3: Dynamic Secondary Branches Assignment */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Building2 size={14} color="#2563EB" />
                   Cơ Sở Phụ Trách Thêm & Chức Danh
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const availableBranch = availableBranchesForSecondary[0];
                    if (!availableBranch) return;
                    setFormData((prev) => ({
                      ...prev,
                      secondaryBranches: [
                        ...prev.secondaryBranches,
                        { branchId: availableBranch.id, positionId: 3 },
                      ],
                    }));
                  }}
                  disabled={availableBranchesForSecondary.length === 0}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '12.5px',
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #BFDBFE',
                    background: availableBranchesForSecondary.length > 0 ? '#FFFFFF' : '#F1F5F9',
                    color: availableBranchesForSecondary.length > 0 ? '#2563EB' : '#94A3B8',
                    cursor: availableBranchesForSecondary.length > 0 ? 'pointer' : 'not-allowed',
                    boxShadow: availableBranchesForSecondary.length > 0 ? '0 1px 2px rgba(37, 99, 235, 0.08)' : 'none',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (availableBranchesForSecondary.length > 0) {
                      e.currentTarget.style.backgroundColor = '#EFF6FF';
                      e.currentTarget.style.borderColor = '#2563EB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (availableBranchesForSecondary.length > 0) {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                      e.currentTarget.style.borderColor = '#BFDBFE';
                    }
                  }}
                >
                  <Plus size={14} strokeWidth={2.5} /> Thêm chi nhánh phụ trách
                </button>
              </div>

              {formData.secondaryBranches.length === 0 ? (
                <div
                  style={{
                    padding: '20px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    border: '1px dashed #CBD5E1',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: '#F1F5F9',
                      color: '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Building2 size={18} />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                    Chưa phân công chi nhánh phụ trách
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', maxWidth: '380px' }}>
                    Bấm nút <strong>"+ Thêm chi nhánh phụ trách"</strong> ở góc trên để phân công nhân sự làm việc hoặc hỗ trợ ca tại các cơ sở khác.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {formData.secondaryBranches.map((item, index) => {
                    return (
                      <div
                        key={index}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr auto',
                          gap: '12px',
                          alignItems: 'center',
                          backgroundColor: '#FFFFFF',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                        }}
                      >
                        {/* Dropdown 1: Secondary Branch */}
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              marginBottom: 5,
                              color: '#475569',
                            }}
                          >
                            Cơ sở phụ trách <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <select
                            className="input-base"
                            value={item.branchId}
                            onChange={(e) => {
                              const newBranchId = Number(e.target.value);
                              setFormData((prev) => {
                                const next = [...prev.secondaryBranches];
                                next[index] = { ...next[index], branchId: newBranchId };
                                return { ...prev, secondaryBranches: next };
                              });
                            }}
                            style={{
                              width: '100%',
                              height: '38px',
                              fontSize: '13px',
                              borderColor: '#CBD5E1',
                              backgroundColor: '#FFFFFF',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            {branches
                              .filter(
                                (b) =>
                                  b.id !== formData.branchId &&
                                  (!formData.secondaryBranches.some((sb, i) => i !== index && sb.branchId === b.id) ||
                                    b.id === item.branchId)
                              )
                              .map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.branchName}
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* Dropdown 2: Position at Secondary Branch */}
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              marginBottom: 5,
                              color: '#475569',
                            }}
                          >
                            Chức danh bên cơ sở đó <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <select
                            className="input-base"
                            value={item.positionId}
                            onChange={(e) => {
                              const newPosId = Number(e.target.value);
                              setFormData((prev) => {
                                const next = [...prev.secondaryBranches];
                                next[index] = { ...next[index], positionId: newPosId };
                                return { ...prev, secondaryBranches: next };
                              });
                            }}
                            style={{
                              width: '100%',
                              height: '38px',
                              fontSize: '13px',
                              borderColor: '#CBD5E1',
                              backgroundColor: '#FFFFFF',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            {positions.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.positionName}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Delete Action Button */}
                        <div style={{ paddingTop: 20 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                secondaryBranches: prev.secondaryBranches.filter((_, i) => i !== index),
                              }));
                            }}
                            title="Xóa phân công chi nhánh này"
                            style={{
                              border: '1px solid #FCA5A5',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              borderRadius: '8px',
                              width: '38px',
                              height: '38px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#FEE2E2';
                              e.currentTarget.style.borderColor = '#EF4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#FEF2F2';
                              e.currentTarget.style.borderColor = '#FCA5A5';
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Group 4: Hợp đồng & Ngày vào làm */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '16px 18px',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748B',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Calendar size={14} color="#2563EB" />
                Trạng Thái Hợp Đồng & Thời Gian
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
                {/* Employment Status */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: '#334155',
                        margin: 0,
                      }}
                    >
                      Trạng Thái Hợp Đồng <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    {!isDirector && (
                      <span
                        style={{
                          fontSize: '10.5px',
                          color: '#64748B',
                          backgroundColor: '#F1F5F9',
                          padding: '1px 6px',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          fontWeight: 500,
                        }}
                      >
                        <Lock size={10} /> Khóa
                      </span>
                    )}
                  </div>
                  <select
                    className="input-base"
                    value={formData.employmentStatus}
                    disabled={!isDirector}
                    onChange={(e) =>
                      setFormData({ ...formData, employmentStatus: e.target.value as EmploymentStatus })
                    }
                    style={{
                      width: '100%',
                      backgroundColor: !isDirector ? '#F8FAFC' : '#FFFFFF',
                      color: !isDirector ? '#475569' : '#0F172A',
                      cursor: !isDirector ? 'not-allowed' : 'pointer',
                      fontWeight: 500,
                    }}
                    title={!isDirector ? 'Chỉ Giám đốc mới có quyền thay đổi trạng thái hợp đồng lao động' : undefined}
                  >
                    <option value="OFFICIAL">Chính thức</option>
                    <option value="PROBATION">Thử việc</option>
                    <option value="ON_LEAVE">Nghỉ chế độ / Tạm hoãn</option>
                    <option value="RESIGNED">Đã nghỉ việc</option>
                  </select>
                </div>

                {/* Hire Date */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      marginBottom: 6,
                      color: '#334155',
                    }}
                  >
                    Ngày Vào Làm <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="input-base"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    style={{
                      width: '100%',
                      fontWeight: 500,
                    }}
                  />
                </div>
              </div>
            </div>
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
