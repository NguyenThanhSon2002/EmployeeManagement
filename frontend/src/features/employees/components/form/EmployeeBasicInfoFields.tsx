import React from 'react';
import type { Employee } from '@/types/domain.types';
import type { EmployeeFormData } from '../../hooks/useEmployeeForm';
import { BadgeCheck, AlertCircle, Mail, Phone } from 'lucide-react';

interface EmployeeBasicInfoFieldsProps {
  formData: EmployeeFormData;
  errors: Record<string, string>;
  initialData: Employee | null;
  updateField: <K extends keyof EmployeeFormData>(field: K, value: EmployeeFormData[K]) => void;
}

export const EmployeeBasicInfoFields: React.FC<EmployeeBasicInfoFieldsProps> = ({
  formData,
  errors,
  initialData,
  updateField,
}) => {
  return (
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
            onChange={(e) => updateField('employeeCode', e.target.value.toUpperCase())}
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
            onChange={(e) => updateField('fullName', e.target.value)}
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
            onChange={(e) => updateField('email', e.target.value)}
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
            onChange={(e) => updateField('phoneNumber', e.target.value)}
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
  );
};
