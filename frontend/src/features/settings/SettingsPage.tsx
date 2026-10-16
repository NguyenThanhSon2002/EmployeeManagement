import React, { useState } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useUIStore } from '@/store/useUIStore';
import { Sliders, RotateCcw, Check, ShieldAlert } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore();
  const { resetDemoData, recomputeAllConflicts } = useScheduleStore();
  const { addToast } = useUIStore();

  const [minRest, setMinRest] = useState<number>(settings.minRestBetweenShiftsHours);
  const [maxWeekly, setMaxWeekly] = useState<number>(settings.maxWeeklyHours);
  const [gracePeriod, setGracePeriod] = useState<number>(settings.gracePeriodMinutes);

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      minRestBetweenShiftsHours: minRest,
      maxWeeklyHours: maxWeekly,
      gracePeriodMinutes: gracePeriod,
    });
    // Immediately trigger conflict recalculation on schedule store
    recomputeAllConflicts();
    addToast({
      type: 'success',
      title: 'Đã lưu cấu hình chính sách',
      message: 'Các tham số đã được cập nhật và áp dụng cho toàn bộ thuật toán phân ca.',
    });
  };

  const handleResetData = () => {
    resetDemoData();
    addToast({
      type: 'info',
      title: 'Đã khôi phục dữ liệu',
      message: 'Toàn bộ 25 nhân sự và dữ liệu lịch phân ca đã được trả về trạng thái mẫu ban đầu.',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: 840 }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Cài Đặt Hệ Thống & Tham Số Chính Sách
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 2, fontSize: '13.5px' }}>
          Cấu hình các ngưỡng kiểm tra an toàn ca làm việc, thời gian nghỉ ngơi theo Bộ luật Lao động và quản lý dữ liệu demo.
        </p>
      </div>

      {/* Policy Form Card */}
      <div className="card" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sliders size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Tham Số Kiểm Tra An Toàn Phân Ca (Conflict Engine)
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Bộ quy tắc tự động phát hiện xung đột thời gian thực (BR-001 đến BR-007)
            </div>
          </div>
        </div>

        <form onSubmit={handleSavePolicy} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Min Rest Hours Toggle */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', marginBottom: 8, color: 'var(--color-text-primary)' }}>
              Thời gian nghỉ ngơi tối thiểu giữa 2 ca làm việc (BR-006):
            </label>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <label
                style={{
                  flex: 1,
                  minWidth: 240,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-lg)',
                  border: minRest === 11.0 ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: minRest === 11.0 ? 'var(--color-primary-light)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <input
                  type="radio"
                  name="minRest"
                  checked={minRest === 11.0}
                  onChange={() => setMinRest(11.0)}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>11.0 giờ</div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    Mặc định theo đề bài (Prompt standard)
                  </div>
                </div>
              </label>

              <label
                style={{
                  flex: 1,
                  minWidth: 240,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-lg)',
                  border: minRest === 12.0 ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: minRest === 12.0 ? 'var(--color-primary-light)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <input
                  type="radio"
                  name="minRest"
                  checked={minRest === 12.0}
                  onChange={() => setMinRest(12.0)}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>12.0 giờ</div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    Điều 110 Bộ luật Lao động 2019
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Max Weekly Hours */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', marginBottom: 6, color: 'var(--color-text-primary)' }}>
              Giới hạn trần giờ làm việc kế hoạch trong tuần (BR-004):
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number"
                step="1"
                min="30"
                max="60"
                className="input-base"
                style={{ width: 120, fontWeight: 600, fontSize: 13.5 }}
                value={maxWeekly}
                onChange={(e) => setMaxWeekly(Number(e.target.value))}
              />
              <span style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)' }}>giờ / tuần (Mặc định: 48.0h)</span>
            </div>
          </div>

          {/* Grace Period */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', marginBottom: 6, color: 'var(--color-text-primary)' }}>
              Thời gian ân hạn đi muộn / về sớm không tính vi phạm:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number"
                step="1"
                min="0"
                max="30"
                className="input-base"
                style={{ width: 120, fontWeight: 600, fontSize: 13.5 }}
                value={gracePeriod}
                onChange={(e) => setGracePeriod(Number(e.target.value))}
              />
              <span style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)' }}>phút (Mặc định: 5 phút)</span>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', gap: 8 }}>
              <Check size={16} /> Lưu cài đặt tham số
            </button>
          </div>
        </form>
      </div>

      {/* Demo Reset Card */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          border: '1px solid #FECACA',
          backgroundColor: '#FEF2F2',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626', marginBottom: 10 }}>
          <ShieldAlert size={22} />
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Quản Lý Dữ Liệu Demo</h2>
        </div>

        <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Khôi phục toàn bộ 25 nhân sự, 4 mẫu ca làm việc và các tình huống xung đột mẫu theo đúng thời gian Thứ Hai tuần này.
          Thao tác này sẽ xóa sạch các ca bạn đã thêm/sửa trong phiên thử nghiệm.
        </p>

        <button
          type="button"
          className="btn btn-danger"
          onClick={handleResetData}
          style={{ display: 'inline-flex', gap: 8 }}
        >
          <RotateCcw size={16} /> Khôi phục dữ liệu mẫu ban đầu (Reset Demo)
        </button>
      </div>
    </div>
  );
};
