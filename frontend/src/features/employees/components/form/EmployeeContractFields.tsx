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

        {/* Employment Type (Full-time / Part-time) */}
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
              Hình Thức Làm Việc <span style={{ color: '#DC2626' }}>*</span>
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
            value={formData.employmentType || 'FULL_TIME'}
            disabled={!isDirector}
            onChange={(e) => updateField('employmentType', e.target.value as any)}
            style={{
              width: '100%',
              backgroundColor: !isDirector ? '#F8FAFC' : '#FFFFFF',
              color: !isDirector ? '#475569' : '#0F172A',
              cursor: !isDirector ? 'not-allowed' : 'pointer',
              fontWeight: 500,
            }}
            title={!isDirector ? 'Chỉ Giám đốc mới có quyền thay đổi hình thức Full-time / Part-time' : undefined}
          >
            <option value="FULL_TIME">Toàn thời gian (Full-time)</option>
            <option value="PART_TIME">Bán thời gian (Part-time)</option>
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

        {/* Hourly Rate (chỉ khi là Part-time) hoặc Chú thích Full-time */}
        {formData.employmentType === 'PART_TIME' ? (
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
                Mức Lương Theo Giờ (VNĐ/h) <span style={{ color: '#DC2626' }}>*</span>
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
            <input
              type="number"
              className="input-base"
              min={0}
              step={1000}
              placeholder="35000"
              disabled={!isDirector}
              value={formData.hourlyRate !== undefined ? formData.hourlyRate : 35000}
              onChange={(e) => updateField('hourlyRate', Number(e.target.value) || 0)}
              style={{
                width: '100%',
                fontWeight: 600,
                color: '#D97706',
                backgroundColor: !isDirector ? '#F8FAFC' : '#FFFFFF',
                cursor: !isDirector ? 'not-allowed' : 'text',
              }}
            />
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748B' }}>
              💡 Mặc định 35.000 đ/h. Giờ làm từ lịch sẽ tính theo đơn giá này.
            </p>
          </div>
        ) : (
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
              Chế Độ Lương
            </label>
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                fontSize: '12.5px',
                color: '#475569',
                fontWeight: 500,
              }}
            >
              💼 Lương cứng cố định theo hợp đồng chức danh
            </div>
          </div>
        )}

        {/* Resignation Date (chỉ hiển thị khi đã nghỉ việc) */}
        {formData.employmentStatus === 'RESIGNED' && (
          <div style={{ gridColumn: 'span 2' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 600,
                marginBottom: 6,
                color: '#DC2626',
              }}
            >
              Ngày Nghỉ Việc (Chấm dứt HĐ) <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="date"
              className="input-base"
              value={formData.resignationDate || ''}
              disabled={!isDirector}
              onChange={(e) => updateField('resignationDate', e.target.value)}
              style={{
                width: '100%',
                fontWeight: 500,
                borderColor: '#FCA5A5',
                backgroundColor: !isDirector ? '#F8FAFC' : '#FFFFFF',
                cursor: !isDirector ? 'not-allowed' : 'text',
              }}
            />
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#64748B' }}>
              💡 Nhân sự sẽ hiển thị nốt trong bảng lương của tháng này (để quyết toán đợt cuối), và tự động ẩn ở các tháng tiếp theo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
