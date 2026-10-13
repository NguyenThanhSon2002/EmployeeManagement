import React from 'react';
import type { ShiftTemplate } from '@/types/domain.types';
import { Clock, Users, Moon, Edit, Trash2 } from 'lucide-react';

interface ShiftTemplateCardProps {
  template: ShiftTemplate;
  onEdit: (template: ShiftTemplate) => void;
  onDelete: (id: number) => void;
}

export const ShiftTemplateCard: React.FC<ShiftTemplateCardProps> = ({
  template,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px',
        borderLeft: `5px solid ${template.textColor}`,
        position: 'relative',
        transition: 'var(--transition-fast)',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: template.colorCode,
                  color: template.textColor,
                  fontWeight: 700,
                  fontSize: 'var(--font-caption)',
                  border: `1px solid ${template.textColor}40`,
                }}
              >
                {template.shiftCode}
              </span>
              {template.isCrossMidnight && (
                <span
                  className="badge badge-warning"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                >
                  <Moon size={11} /> Ca qua đêm (+1 ngày)
                </span>
              )}
            </div>
            <h3 style={{ fontSize: 'var(--font-h3)', marginTop: 8, fontWeight: 600 }}>
              {template.shiftName}
            </h3>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)', fontSize: 'var(--font-body-md)' }}>
            <Clock size={16} />
            <span>
              <strong>{template.startTime}</strong> - <strong>{template.endTime}</strong>
              {template.breakMinutes > 0 && ` (Nghỉ ${template.breakMinutes} phút)`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)', fontSize: 'var(--font-body-md)' }}>
            <Users size={16} />
            <span>
              Định biên nhân sự: <strong>{template.minStaffing} - {template.maxStaffing}</strong> người/ca
            </span>
          </div>

          <div style={{ fontSize: 'var(--font-caption)', color: 'var(--color-text-muted)', marginTop: 4 }}>
            Áp dụng: {template.applicableDays === '1,2,3,4,5,6,7' ? 'Tất cả các ngày trong tuần' : `Ngày: ${template.applicableDays}`}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          marginTop: 20,
          paddingTop: 12,
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onEdit(template)}
          style={{ height: 32, padding: '0 12px', fontSize: 13 }}
        >
          <Edit size={14} /> Sửa
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => onDelete(template.id)}
          style={{ height: 32, padding: '0 12px', fontSize: 13 }}
        >
          <Trash2 size={14} /> Xóa
        </button>
      </div>
    </div>
  );
};
