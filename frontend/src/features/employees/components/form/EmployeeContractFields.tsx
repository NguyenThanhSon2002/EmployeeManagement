import React from 'react';
import type { EmploymentStatus } from '@/types/domain.types';
import type { EmployeeFormData } from '../../hooks/useEmployeeForm';
import { Calendar, Lock } from 'lucide-react';

interface EmployeeContractFieldsProps {
  formData: EmployeeFormData;
  isDirector: boolean;
  updateField: <K extends keyof EmployeeFormData>(field: K, value: EmployeeFormData[K]) => void;
}

export const EmployeeContractFields: React.FC<EmployeeContractFieldsProps> = ({
  formData,
  isDirector,
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
            onChange={(e) => updateField('employmentStatus', e.target.value as EmploymentStatus)}
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
            onChange={(e) => updateField('hireDate', e.target.value)}
            style={{
              width: '100%',
              fontWeight: 500,
            }}
          />
        </div>
      </div>
    </div>
  );
};
