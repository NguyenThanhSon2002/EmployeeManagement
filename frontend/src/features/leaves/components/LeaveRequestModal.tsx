import React, { useState } from 'react';
import { useLeaveStore } from '../store/useLeaveStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { MOCK_EMPLOYEES } from '@/mocks/employees.mock';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { X, Calendar, AlertCircle } from 'lucide-react';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LEAVE_TYPES = [
  { id: 1, name: 'Nghá»‰ phÃ©p nÄƒm' },
  { id: 2, name: 'Nghá»‰ viá»‡c riÃªng hÆ°á»Ÿng lÆ°Æ¡ng' },
  { id: 3, name: 'Nghá»‰ á»‘m Ä‘au / BHXH' },
  { id: 4, name: 'Nghá»‰ khÃ´ng hÆ°á»Ÿng lÆ°Æ¡ng' },
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
      setError('NgÃ y káº¿t thÃºc khÃ´ng Ä‘Æ°á»£c trÆ°á»›c ngÃ y báº¯t Ä‘áº§u.');
      return;
    }
    if (!reason.trim()) {
      setError('Vui lÃ²ng nÃªu rÃµ lÃ½ do xin nghá»‰ phÃ©p.');
      return;
    }

    const res = submitLeave({
      employeeId,
      leaveTypeId,
      leaveTypeName: selectedType?.name || 'Nghá»‰ phÃ©p nÄƒm',
      startDate,
      endDate,
      totalDays,
      reason: reason.trim(),
    });

    if (!res.success) {
      setError(res.error || 'Lá»—i gá»­i Ä‘Æ¡n xin nghá»‰.');
      return;
    }

    addToast({
      type: 'success',
      title: 'Ná»™p Ä‘Æ¡n xin nghá»‰ thÃ nh cÃ´ng',
      message: `ÄÆ¡n xin nghá»‰ ${totalDays} ngÃ y Ä‘Ã£ Ä‘Æ°á»£c gá»­i vÃ  lÆ°u vÃ o CSDL MySQL (chá» phÃª duyá»‡t).`,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 'var(--font-h2)', fontWeight: 600 }}>Táº¡o ÄÆ¡n Xin Nghá»‰ PhÃ©p (SCR-13)</h2>
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
                NhÃ¢n viÃªn Ä‘á» xuáº¥t
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
              Loáº¡i nghá»‰ phÃ©p <span style={{ color: 'red' }}>*</span>
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
              Quá»¹ phÃ©p nÄƒm cá»§a nhÃ¢n viÃªn: <strong>{balance.annualQuota} ngÃ y</strong> | ÄÃ£ dÃ¹ng:{' '}
              <strong>{balance.usedDays} ngÃ y</strong> | CÃ²n láº¡i:{' '}
              <strong>{balance.remainingDays} ngÃ y</strong>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                Tá»« ngÃ y <span style={{ color: 'red' }}>*</span>
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
                Äáº¿n ngÃ y <span style={{ color: 'red' }}>*</span>
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
            Tá»•ng sá»‘ ngÃ y nghá»‰ Ä‘Äƒng kÃ½:{' '}
            <strong style={{ color: 'var(--color-primary)' }}>{totalDays} ngÃ y</strong>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
              LÃ½ do xin nghá»‰ <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="VD: Viá»‡c gia Ä‘Ã¬nh / Äi du lá»‹ch cÃ¡ nhÃ¢n..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Há»§y
            </button>
            <button type="submit" className="btn btn-primary">
              <Calendar size={15} /> Gá»­i ÄÆ¡n Xin Nghá»‰
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
