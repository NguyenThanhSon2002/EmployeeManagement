import React from 'react';
import type { ShiftTemplate } from '@/types/domain.types';
import { Clock, Users, Moon, Pencil, Trash2, Coffee, CalendarCheck, Sun, MapPin, Copy } from 'lucide-react';

interface ShiftTemplateCardProps {
  template: ShiftTemplate;
  onEdit?: (template: ShiftTemplate) => void;
  onDuplicate?: (template: ShiftTemplate) => void;
  onDelete?: (id: number) => void;
  readOnly?: boolean;
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  // Convert "06:00:00" to "06:00"
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeStr;
};

const calculateNetHours = (start: string, end: string, breakMins: number) => {
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  if (isNaN(sH) || isNaN(eH)) return 0;
  const startMins = sH * 60 + (sM || 0);
  let endMins = eH * 60 + (eM || 0);
  if (endMins < startMins) {
    endMins += 24 * 60;
  }
  const totalMins = endMins - startMins;
  const workMins = Math.max(0, totalMins - (breakMins || 0));
  return (workMins / 60).toFixed(1);
};

export const ShiftTemplateCard: React.FC<ShiftTemplateCardProps> = ({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  readOnly = false,
}) => {
  const startTimeClean = formatTime(template.startTime);
  const endTimeClean = formatTime(template.endTime);
  const netHours = calculateNetHours(startTimeClean, endTimeClean, template.breakMinutes);

  return (
    <div
      className={`card ${readOnly ? '' : 'card-interactive'}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '22px',
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderTop: `4px solid ${template.textColor || '#2563EB'}`,
        boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
        position: 'relative',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div>
        {/* Card Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {/* Branch Badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3.5,
                padding: '3px 8px',
                borderRadius: 9999,
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
                fontSize: 11,
                fontWeight: 700,
              }}
              title={`Mẫu ca của ${template.branchName || (template.branchId ? `Chi nhánh #${template.branchId}` : 'Chi nhánh')}`}
            >
              <MapPin size={11} strokeWidth={2.5} />
              <span>{template.branchName || (template.branchId ? `Cơ sở #${template.branchId}` : 'Cơ sở')}</span>
            </span>

            {template.isCrossMidnight ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 9999,
                  backgroundColor: '#FFFBEB',
                  color: '#B45309',
                  border: '1px solid #FDE68A',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                <Moon size={11} /> Ca đêm
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 9999,
                  backgroundColor: '#F8FAFC',
                  color: '#475569',
                  border: '1px solid #E2E8F0',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <Sun size={11} color="#EAB308" /> Trong ngày
              </span>
            )}
          </div>

          {/* Net Working Hours Pill */}
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#1E40AF',
              backgroundColor: '#EFF6FF',
              border: '1px solid #DBEAFE',
              padding: '3px 8px',
              borderRadius: 6,
            }}
          >
            {netHours}h công
          </span>
        </div>

        {/* Shift Name */}
        <h3
          style={{
            fontSize: '16.5px',
            fontWeight: 700,
            color: '#0F172A',
            margin: '0 0 14px',
            lineHeight: 1.3,
          }}
        >
          {template.shiftName}
        </h3>

        {/* Shift Details List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Time & Break */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: '#F8FAFC',
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1E293B' }}>
              <Clock size={16} color="#2563EB" />
              <span style={{ fontWeight: 700 }}>
                {startTimeClean} - {endTimeClean}
              </span>
            </div>
            {template.breakMinutes > 0 ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748B' }}>
                <Coffee size={13} /> Nghỉ {template.breakMinutes}p
              </span>
            ) : (
              <span style={{ fontSize: 11.5, color: '#94A3B8' }}>Không nghỉ</span>
            )}
          </div>

          {/* Staffing Quota */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: '#F8FAFC',
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1E293B' }}>
              <Users size={16} color="#059669" />
              <span style={{ fontSize: 12.5, color: '#475569' }}>Định biên nhân sự:</span>
            </div>
            <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>
              {template.minStaffing} - {template.maxStaffing} <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B' }}>người/ca</span>
            </span>
          </div>

          {/* Applicable Days */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: '#64748B',
              marginTop: 2,
            }}
          >
            <CalendarCheck size={14} color="#94A3B8" />
            <span>
              {template.applicableDays === '1,2,3,4,5,6,7'
                ? 'Áp dụng: Tất cả các ngày trong tuần'
                : `Áp dụng: Thứ ${template.applicableDays}`}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      {!readOnly && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid #F1F5F9',
          }}
        >
          <button
            type="button"
            onClick={() => onEdit?.(template)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 34,
              padding: '0 14px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              backgroundColor: '#F8FAFC',
              color: '#2563EB',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EFF6FF';
              e.currentTarget.style.borderColor = '#BFDBFE';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
          >
            <Pencil size={14} /> Chỉnh sửa
          </button>

          <button
            type="button"
            onClick={() => onDuplicate?.(template)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 34,
              padding: '0 12px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              backgroundColor: '#F8FAFC',
              color: '#4F46E5',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EEF2FF';
              e.currentTarget.style.borderColor = '#C7D2FE';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
            title="Sao chép mẫu ca này để tạo ca mới hoặc áp dụng cho chi nhánh khác"
          >
            <Copy size={14} /> Sao chép
          </button>

          <button
            type="button"
            onClick={() => onDelete?.(template.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 34,
              padding: '0 14px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FECACA',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FEE2E2';
              e.currentTarget.style.borderColor = '#FCA5A5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FEF2F2';
              e.currentTarget.style.borderColor = '#FECACA';
            }}
          >
            <Trash2 size={14} /> Xóa
          </button>
        </div>
      )}
    </div>
  );
};
