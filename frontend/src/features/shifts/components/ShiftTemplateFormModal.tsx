import React, { useState, useEffect } from 'react';
import type { ShiftTemplate } from '@/types/domain.types';
import { X, Moon, AlertCircle } from 'lucide-react';

interface ShiftTemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateData: Omit<ShiftTemplate, 'id'>, editId?: number) => void;
  initialData?: ShiftTemplate | null;
}

const COLOR_PRESETS = [
  { name: 'Xanh dương nhạt', bg: '#E6F7FF', text: '#0958D9' },
  { name: 'Xanh ngọc', bg: '#E6FFFB', text: '#08979C' },
  { name: 'Cam nhạt', bg: '#FFF7E6', text: '#D46B08' },
  { name: 'Đỏ nhạt (Đêm)', bg: '#FFF1F0', text: '#CF1322' },
  { name: 'Tím nhạt', bg: '#F9F0FF', text: '#722ED1' },
  { name: 'Vàng tươi', bg: '#FEFFE6', text: '#D48806' },
];

export const ShiftTemplateFormModal: React.FC<ShiftTemplateFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [shiftCode, setShiftCode] = useState('');
  const [shiftName, setShiftName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [breakMinutes, setBreakMinutes] = useState(60);
  const [minStaffing, setMinStaffing] = useState(2);
  const [maxStaffing, setMaxStaffing] = useState(6);
  const [colorCode, setColorCode] = useState('#E6F7FF');
  const [textColor, setTextColor] = useState('#0958D9');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setShiftCode(initialData.shiftCode);
      setShiftName(initialData.shiftName);
      setStartTime(initialData.startTime);
      setEndTime(initialData.endTime);
      setBreakMinutes(initialData.breakMinutes);
      setMinStaffing(initialData.minStaffing);
      setMaxStaffing(initialData.maxStaffing);
      setColorCode(initialData.colorCode);
      setTextColor(initialData.textColor);
    } else {
      setShiftCode('');
      setShiftName('');
      setStartTime('08:00');
      setEndTime('17:00');
      setBreakMinutes(60);
      setMinStaffing(2);
      setMaxStaffing(6);
      setColorCode('#E6F7FF');
      setTextColor('#0958D9');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isCrossMidnight = endTime < startTime;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftCode.trim() || !shiftName.trim()) {
      setError('Vui lòng nhập đầy đủ Mã ca và Tên ca.');
      return;
    }
    if (maxStaffing < minStaffing) {
      setError('Định biên tối đa không được nhỏ hơn định biên tối thiểu.');
      return;
    }

    onSave(
      {
        shiftCode: shiftCode.toUpperCase().trim(),
        shiftName: shiftName.trim(),
        startTime,
        endTime,
        breakMinutes: Number(breakMinutes),
        isCrossMidnight,
        colorCode,
        textColor,
        minStaffing: Number(minStaffing),
        maxStaffing: Number(maxStaffing),
        applicableDays: '1,2,3,4,5,6,7',
        isActive: true,
      },
      initialData ? initialData.id : undefined
    );
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: 540 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 'var(--font-h2)', fontWeight: 600 }}>
            {initialData ? 'Chỉnh Sửa Mẫu Ca Làm Việc' : 'Thêm Mới Mẫu Ca Làm Việc'}
          </h2>
          <button type="button" onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fff1f0',
              border: '1px solid #ffa39e',
              borderRadius: 'var(--radius-md)',
              color: '#cf1322',
              fontSize: 'var(--font-caption)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                Mã ca <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="VD: CA-SANG"
                value={shiftCode}
                onChange={(e) => setShiftCode(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                Tên ca <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="VD: Ca Sáng Tiêu Chuẩn"
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                Bắt đầu <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="time"
                className="input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                Kết thúc <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="time"
                className="input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                Nghỉ (phút)
              </label>
              <input
                type="number"
                min="0"
                step="15"
                className="input"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value))}
              />
            </div>
          </div>

          {isCrossMidnight && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#fffbe6',
                border: '1px solid #ffe58f',
                borderRadius: 'var(--radius-md)',
                color: '#d46b08',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Moon size={14} /> Ca qua đêm (+1 ngày): Giờ kết thúc nhỏ hơn giờ bắt đầu, hệ thống tự động gán cờ qua đêm.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                Định biên tối thiểu
              </label>
              <input
                type="number"
                min="1"
                className="input"
                value={minStaffing}
                onChange={(e) => setMinStaffing(Number(e.target.value))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                Định biên tối đa
              </label>
              <input
                type="number"
                min="1"
                className="input"
                value={maxStaffing}
                onChange={(e) => setMaxStaffing(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Màu hiển thị trên lịch tuần (Chuẩn tương phản WCAG AA)
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.bg}
                  type="button"
                  onClick={() => {
                    setColorCode(p.bg);
                    setTextColor(p.text);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: p.bg,
                    color: p.text,
                    border: colorCode === p.bg ? `2px solid ${p.text}` : '1px solid var(--color-border)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              padding: '12px',
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Xem trước thẻ ca:
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: colorCode,
                color: textColor,
                fontWeight: 600,
                fontSize: 12,
                border: `1px solid ${textColor}30`,
              }}
            >
              <span>{shiftCode || 'MÃ CA'}</span>
              <span>•</span>
              <span>{startTime} - {endTime}</span>
              {isCrossMidnight && <span>(+1)</span>}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              {initialData ? 'Cập nhật mẫu ca' : 'Lưu mẫu ca'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
