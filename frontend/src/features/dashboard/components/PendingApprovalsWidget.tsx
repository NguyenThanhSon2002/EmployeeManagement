import React, { useState } from 'react';
import { useUIStore } from '@/shared/store/useUIStore';
import { Check, X, FileText, Palmtree } from 'lucide-react';

interface PendingItem {
  id: number;
  type: 'LEAVE' | 'ATTENDANCE_CORRECTION';
  employeeName: string;
  employeeCode: string;
  title: string;
  reason: string;
  dateStr: string;
}

const INITIAL_PENDING: PendingItem[] = [
  {
    id: 1,
    type: 'LEAVE',
    employeeName: 'Hoàng Thị Mai',
    employeeCode: 'EMP-005',
    title: 'Nghỉ việc riêng hưởng lương (1 ngày)',
    reason: 'Đám cưới người thân trong gia đình',
    dateStr: 'Thứ Năm tuần sau',
  },
  {
    id: 2,
    type: 'ATTENDANCE_CORRECTION',
    employeeName: 'Lê Văn Cường',
    employeeCode: 'EMP-003',
    title: 'Giải trình quên check-out',
    reason: 'Máy tính bị sập nguồn cuối giờ, không kịp bấm check-out',
    dateStr: 'Hôm qua (17:00)',
  },
  {
    id: 3,
    type: 'LEAVE',
    employeeName: 'Vũ Thị Lan',
    employeeCode: 'EMP-007',
    title: 'Nghỉ phép năm (1 ngày)',
    reason: 'Khám sức khỏe định kỳ',
    dateStr: 'Thứ Sáu tuần này',
  },
];

export const PendingApprovalsWidget: React.FC = () => {
  const [items, setItems] = useState<PendingItem[]>(INITIAL_PENDING);
  const { addToast } = useUIStore();

  const handleApprove = (id: number, name: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    addToast({
      type: 'success',
      title: 'Đã phê duyệt đơn',
      message: `Đơn của nhân viên ${name} đã được phê duyệt thành công.`,
    });
  };

  const handleReject = (id: number, name: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    addToast({
      type: 'info',
      title: 'Đã từ chối đơn',
      message: `Đã từ chối yêu cầu của ${name}.`,
    });
  };

  return (
    <div className="card" style={{ padding: '16px 20px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontSize: 'var(--font-h3)', fontWeight: 600 }}>
            Đơn Chờ Phê Duyệt Của Bộ Phận
          </h3>
          <span className="badge badge-warning">{items.length} đơn</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-lg) 0', color: 'var(--color-text-muted)' }}>
          Tuyệt vời! Không còn đơn từ nào đang chờ phê duyệt.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface)',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: item.type === 'LEAVE' ? 'var(--shift-leave-bg)' : 'var(--color-info-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                  }}
                >
                  {item.type === 'LEAVE' ? (
                    <Palmtree size={18} color="var(--shift-leave-text)" />
                  ) : (
                    <FileText size={18} color="var(--color-primary)" />
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-body-md)' }}>
                      {item.employeeName}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      ({item.employeeCode})
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 500 }}>
                      • {item.dateStr}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    Lý do: {item.reason}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-default"
                  onClick={() => handleReject(item.id, item.employeeName)}
                  style={{ height: 32, padding: '0 10px', fontSize: 12, color: 'var(--color-error)' }}
                  title="Từ chối đơn"
                >
                  <X size={14} /> Từ chối
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleApprove(item.id, item.employeeName)}
                  style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                  title="Phê duyệt đơn"
                >
                  <Check size={14} /> Duyệt
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
