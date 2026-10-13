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
        <h1 style={{ fontSize: 'var(--font-h1)', fontWeight: 600 }}>Cài Đặt Hệ Thống & Tham Số Chính Sách</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 2, fontSize: 'var(--font-body)' }}>
          Cấu hình các ngưỡng kiểm tra an toàn ca làm việc, thời gian nghỉ ngơi theo Bộ luật Lao động và quản lý dữ liệu demo.
        </p>
      </div>

      {/* Policy Form Card */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Sliders size={20} color="var(--color-primary)" />
          <h2 style={{ fontSize: 'var(--font-h3)', fontWeight: 600 }}>Tham Số Kiểm Tra An Toàn Phân Ca (Conflict Engine)</h2>
        </div>

        <form onSubmit={handleSavePolicy} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Min Rest Hours Toggle */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-body-md)', marginBottom: 6 }}>
              Thời gian nghỉ ngơi tối thiểu giữa 2 ca làm việc (BR-006):
            </label>
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: minRest === 11.0 ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: minRest === 11.0 ? 'var(--color-info-bg)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-body)',
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
                  <div style={{ fontWeight: 600 }}>11.0 giờ</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Mặc định theo đề bài (Prompt standard)</div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: minRest === 12.0 ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: minRest === 12.0 ? 'var(--color-info-bg)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-body)',
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
                  <div style={{ fontWeight: 600 }}>12.0 giờ</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Điều 110 Bộ luật Lao động 2019</div>
                </div>
              </label>
            </div>
          </div>

          {/* Max Weekly Hours */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-body-md)', marginBottom: 4 }}>
              Giới hạn trần giờ làm việc kế hoạch trong tuần (BR-004):
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number"
                step="1"
                min="30"
                max="60"
                className="input-base"
                style={{ width: 120 }}
                value={maxWeekly}
                onChange={(e) => setMaxWeekly(Number(e.target.value))}
              />
              <span style={{ fontSize: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>giờ / tuần (Mặc định: 48.0h)</span>
            </div>
          </div>

          {/* Grace Period */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-body-md)', marginBottom: 4 }}>
              Thời gian ân hạn đi muộn / về sớm không tính vi phạm:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number"
                step="1"
                min="0"
                max="30"
                className="input-base"
                style={{ width: 120 }}
                value={gracePeriod}
                onChange={(e) => setGracePeriod(Number(e.target.value))}
              />
              <span style={{ fontSize: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>phút (Mặc định: 5 phút)</span>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', gap: 6 }}>
              <Check size={16} /> Lưu cài đặt tham số
            </button>
          </div>
        </form>
      </div>

      {/* Demo Reset Card */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          border: '1px solid var(--color-error-border)',
          backgroundColor: '#fff1f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-error)', marginBottom: 8 }}>
          <ShieldAlert size={20} />
          <h2 style={{ fontSize: 'var(--font-h3)', fontWeight: 600 }}>Quản Lý Dữ Liệu Demo</h2>
        </div>

        <p style={{ fontSize: 'var(--font-body)', color: 'var(--color-text-secondary)', marginBottom: 14 }}>
          Khôi phục toàn bộ 25 nhân sự, 4 mẫu ca làm việc và các tình huống xung đột mẫu theo đúng thời gian Thứ Hai tuần này.
          Thao tác này sẽ xóa sạch các ca bạn đã thêm/sửa trong phiên thử nghiệm.
        </p>

        <button
          type="button"
          className="btn btn-danger"
          onClick={handleResetData}
          style={{ display: 'inline-flex', gap: 6 }}
        >
          <RotateCcw size={16} /> Khôi phục dữ liệu mẫu ban đầu (Reset Demo)
        </button>
      </div>
    </div>
  );
};
