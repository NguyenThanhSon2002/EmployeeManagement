import React, { useState, useEffect, useRef } from 'react';
import type { ShiftTemplate } from '@/types/domain.types';
import { X, Moon, AlertCircle, Check, Layers } from 'lucide-react';
import { SmartTimePicker } from './SmartTimePicker';

interface ShiftTemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateData: Omit<ShiftTemplate, 'id'>, editId?: number) => void;
  initialData?: ShiftTemplate | null;
}

const COLOR_PRESETS = [
  { name: 'Xanh dương nhạt', bg: '#E6F7FF', text: '#0958D9', border: '#91CAFF' },
  { name: 'Xanh ngọc', bg: '#E6FFFB', text: '#08979C', border: '#87E8DE' },
  { name: 'Cam ấm áp', bg: '#FFF7E6', text: '#D46B08', border: '#FFD591' },
  { name: 'Đỏ nhạt (Đêm)', bg: '#FFF1F0', text: '#CF1322', border: '#FFA39E' },
  { name: 'Tím thạch anh', bg: '#F9F0FF', text: '#722ED1', border: '#D3ADF7' },
  { name: 'Vàng tươi', bg: '#FEFFE6', text: '#D48806', border: '#FFF566' },
  { name: 'Xanh lục dịu', bg: '#F6FFED', text: '#389E0D', border: '#B7EB8F' },
  { name: 'Xám slate', bg: '#F1F5F9', text: '#334155', border: '#CBD5E1' },
];

export const ShiftTemplateFormModal: React.FC<ShiftTemplateFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate Duration & Overnight flag
  const isCrossMidnight = endTime < startTime;

  const calculateHours = () => {
    if (!startTime || !endTime) return { totalSpan: '0', workHours: '0' };
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startTotal = (startH || 0) * 60 + (startM || 0);
    let endTotal = (endH || 0) * 60 + (endM || 0);

    if (endTotal < startTotal) {
      endTotal += 24 * 60; // Cross midnight
    }

    const totalSpanMinutes = endTotal - startTotal;
    const workMinutes = Math.max(0, totalSpanMinutes - breakMinutes);
    return {
      totalSpan: (totalSpanMinutes / 60).toFixed(1),
      workHours: (workMinutes / 60).toFixed(1),
    };
  };

  const { workHours } = calculateHours();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftCode.trim() || !shiftName.trim()) {
      setError('Vui lòng nhập đầy đủ Mã ca và Tên ca làm việc.');
      return;
    }
    if (Number(maxStaffing) < Number(minStaffing)) {
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
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shift-modal-title"
    >
      <div
        ref={modalRef}
        className="modal-content animate-fade-in"
        style={{
          maxWidth: 580,
          width: '100%',
          maxHeight: 'min(90vh, 580px)',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: 18,
          border: '1px solid #E2E8F0',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          backgroundColor: '#FFFFFF',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 22px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={18} />
            </div>
            <div>
              <h2
                id="shift-modal-title"
                style={{
                  fontSize: '16.5px',
                  fontWeight: 700,
                  color: '#0F172A',
                  margin: 0,
                }}
              >
                {initialData ? 'Chỉnh Sửa Mẫu Ca Làm Việc' : 'Thêm Mới Mẫu Ca Làm Việc'}
              </h2>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
                Cấu hình khung giờ và định biên cho mẫu ca chuẩn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            style={{ width: 32, height: 32 }}
            aria-label="Đóng cửa sổ"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form with Scrollable Body & Sticky Footer */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {/* Scrollable Form Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  color: '#991B1B',
                  fontSize: 12.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} color="#DC2626" />
                <span>{error}</span>
              </div>
            )}

            {/* Hàng 1: Mã ca & Tên ca */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                  Mã ca <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="VD: CA_SANG"
                  value={shiftCode}
                  onChange={(e) => setShiftCode(e.target.value.toUpperCase())}
                  style={{ width: '100%', textTransform: 'uppercase', fontWeight: 700 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                  Tên ca hiển thị <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="VD: Ca Sáng (06:00 - 14:00)"
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>
            </div>

            {/* Hàng 2: Khung giờ & Nghỉ giữa ca */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                  Khung giờ làm việc <span style={{ color: '#DC2626' }}>*</span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: '#1D4ED8',
                      backgroundColor: '#EFF6FF',
                      padding: '2px 8px',
                      borderRadius: 9999,
                      border: '1px solid #BFDBFE',
                    }}
                  >
                    ⏱️ {workHours}h công thực tế
                  </span>
                  {isCrossMidnight && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#B45309',
                        backgroundColor: '#FFFBEB',
                        padding: '2px 8px',
                        borderRadius: 9999,
                        border: '1px solid #FDE68A',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <Moon size={11} /> Ca qua đêm (+1)
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1.15fr) minmax(0, 0.9fr)', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <SmartTimePicker
                    label="Bắt đầu"
                    value={startTime}
                    onChange={setStartTime}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <SmartTimePicker
                    label="Kết thúc"
                    value={endTime}
                    onChange={setEndTime}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label style={{ display: 'block', fontSize: 11.5, color: '#64748B', marginBottom: 4, fontWeight: 500 }}>
                    Nghỉ giữa ca
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0"
                      step="15"
                      className="input-base"
                      value={breakMinutes}
                      onChange={(e) => setBreakMinutes(Math.max(0, Number(e.target.value)))}
                      style={{
                        width: '100%',
                        height: 40,
                        paddingRight: 45,
                        fontWeight: 600,
                        backgroundColor: '#F8FAFC',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#64748B',
                        pointerEvents: 'none',
                      }}
                    >
                      phút
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hàng 3: Định biên nhân sự */}
            <div>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                Định biên nhân sự cho ca
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="1"
                    className="input-base"
                    placeholder="Tối thiểu"
                    value={minStaffing}
                    onChange={(e) => setMinStaffing(Number(e.target.value))}
                    style={{ width: '100%', paddingRight: 65, fontWeight: 600 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 11.5,
                      color: '#64748B',
                      pointerEvents: 'none',
                    }}
                  >
                    người tối thiểu
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="1"
                    className="input-base"
                    placeholder="Tối đa"
                    value={maxStaffing}
                    onChange={(e) => setMaxStaffing(Number(e.target.value))}
                    style={{ width: '100%', paddingRight: 65, fontWeight: 600 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 11.5,
                      color: '#64748B',
                      pointerEvents: 'none',
                    }}
                  >
                    người tối đa
                  </span>
                </div>
              </div>
            </div>

            {/* Hàng 4: Bảng màu sắc & Thẻ xem trước mini */}
            <div>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
                Màu hiển thị trên lịch tuần (Chuẩn WCAG AA)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                {/* Color Swatches */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COLOR_PRESETS.map((p) => {
                    const isSelected = colorCode === p.bg;
                    return (
                      <button
                        key={p.bg}
                        type="button"
                        onClick={() => {
                          setColorCode(p.bg);
                          setTextColor(p.text);
                        }}
                        title={p.name}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: p.bg,
                          color: p.text,
                          border: isSelected ? `2px solid ${p.text}` : `1px solid ${p.border}`,
                          boxShadow: isSelected ? `0 0 0 2px ${p.text}35` : 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        }}
                      >
                        {isSelected && <Check size={16} strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>

                {/* Mini Live Preview Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 8,
                    backgroundColor: colorCode,
                    color: textColor,
                    fontWeight: 700,
                    fontSize: 12,
                    border: `1px solid ${textColor}40`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  <span>{shiftCode || 'MÃ CA'}</span>
                  <span>•</span>
                  <span>{startTime} - {endTime}</span>
                  {isCrossMidnight && <span style={{ fontSize: 10.5 }}>🌙 (+1)</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Fixed Footer - Luôn luôn ghim cố định ở đáy modal */}
          <div
            style={{
              padding: '14px 22px',
              backgroundColor: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ height: 38, padding: '0 18px', fontWeight: 600 }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                height: 38,
                padding: '0 22px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                minWidth: 140,
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Check size={16} strokeWidth={2.5} />
              {initialData ? 'Lưu thay đổi' : 'Tạo mẫu ca mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
