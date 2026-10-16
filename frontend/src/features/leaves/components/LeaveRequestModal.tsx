import React, { useState } from 'react';
import { useLeaveStore } from '@/store/useLeaveStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { MOCK_EMPLOYEES } from '@/data/mock/employees.mock';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { X, Calendar, AlertCircle } from 'lucide-react';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LEAVE_TYPES = [
  { id: 1, name: 'Nghỉ phép năm' },
  { id: 2, name: 'Nghỉ việc riêng hưởng lương' },
  { id: 3, name: 'Nghỉ ốm đau / BHXH' },
  { id: 4, name: 'Nghỉ không hưởng lương' },
];

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({ isOpen, onClose }) => {
  const { submitLeave, getBalance } = useLeaveStore();
  const { currentUser, currentRole } = useAuthStore();
  const { addToast } = useUIStore();

  const isManagerOrAdmin = currentRole === 'ROLE_ADMIN' || currentRole === 'ROLE_HR_MANAGER' || currentRole === 'ROLE_DEPT_MANAGER';

  const [employeeId, setEmployeeId] = useState<number>(currentUser.id);
  const [leaveTypeId, setLeaveTypeId] = useState<number>(1);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const balance = getBalance(employeeId);
  const selectedType = LEAVE_TYPES.find((t) => t.id === leaveTypeId);

  const calculateDays = () => {
    try {
      const s = parseISO(startDate);
      const e = parseISO(endDate);
      const diff = differenceInCalendarDays(e, s) + 1;
      return Math.max(1, diff);
    } catch {
      return 1;
    }
  };

  const totalDays = calculateDays();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (endDate < startDate) {
      setError('Ngày kết thúc không được trước ngày bắt đầu.');
      return;
    }
    if (!reason.trim()) {
      setError('Vui lòng nêu rõ lý do xin nghỉ phép.');
      return;
    }

    const res = submitLeave({
      employeeId,
      leaveTypeId,
      leaveTypeName: selectedType?.name || 'Nghỉ phép năm',
      startDate,
      endDate,
      totalDays,
      reason: reason.trim(),
    });

    if (!res.success) {
      setError(res.error || 'Lỗi gửi đơn xin nghỉ.');
      return;
    }

    addToast({
      type: 'success',
      title: 'Nộp đơn xin nghỉ thành công',
      message: `Đơn xin nghỉ ${totalDays} ngày đã được gửi và lưu vào CSDL MySQL (chờ phê duyệt).`,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 'var(--font-h2)', fontWeight: 600 }}>Tạo Đơn Xin Nghỉ Phép (SCR-13)</h2>
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
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isManagerOrAdmin && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                Nhân viên đề xuất
              </label>
              <select
                className="input"
                value={employeeId}
                onChange={(e) => {
                  setEmployeeId(Number(e.target.value));
                  setError(null);
                }}
              >
                {MOCK_EMPLOYEES.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
              Loại nghỉ phép <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              className="input"
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(Number(e.target.value))}
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {leaveTypeId === 1 && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                color: '#389e0d',
              }}
            >
              Quỹ phép năm của nhân viên: <strong>{balance.annualQuota} ngày</strong> | Đã dùng:{' '}
              <strong>{balance.usedDays} ngày</strong> | Còn lại:{' '}
              <strong>{balance.remainingDays} ngày</strong>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                Từ ngày <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                Đến ngày <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="date"
                className="input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Tổng số ngày nghỉ đăng ký:{' '}
            <strong style={{ color: 'var(--color-primary)' }}>{totalDays} ngày</strong>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
              Lý do xin nghỉ <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="VD: Việc gia đình / Đi du lịch cá nhân..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              <Calendar size={15} /> Gửi Đơn Xin Nghỉ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
