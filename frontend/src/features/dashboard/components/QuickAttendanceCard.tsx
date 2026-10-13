import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { LogIn, LogOut, CheckCircle, Clock } from 'lucide-react';

export const QuickAttendanceCard: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { addToast } = useUIStore();

  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [checkInTime, setCheckInTime] = useState('07:55:12');
  const [elapsedSeconds, setElapsedSeconds] = useState(2 * 3600 + 15 * 60); // 2h 15m

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isCheckedIn) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCheckedIn]);

  const formatElapsed = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleCheck = () => {
    if (!isCheckedIn) {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setIsCheckedIn(true);
      setCheckInTime(timeStr);
      setElapsedSeconds(0);
      addToast({
        type: 'success',
        title: 'Điểm danh vào ca thành công',
        message: `Đã ghi nhận check-in lúc ${timeStr}. Chúc bạn một ngày làm việc hiệu quả!`,
      });
    } else {
      setIsCheckedIn(false);
      addToast({
        type: 'info',
        title: 'Check-out hoàn tất',
        message: `Đã kết thúc ca làm việc. Tổng thời gian: ${formatElapsed(elapsedSeconds)}.`,
      });
    }
  };

  return (
    <div className="card" style={{ padding: '16px 20px', minWidth: 300, flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 'var(--font-h3)', fontWeight: 600 }}>
          Điểm Danh Nhanh Hôm Nay
        </h3>
        <span className={`badge ${isCheckedIn ? 'badge-success' : 'badge-warning'}`}>
          <span className="badge-dot" /> {isCheckedIn ? 'Đang làm việc' : 'Chưa vào ca'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <img
          src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
          alt={currentUser.fullName}
          style={{ width: 44, height: 44, borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: 'var(--font-body-md)' }}>{currentUser.fullName}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{currentUser.employeeCode} • Ca Sáng (08:00 - 17:00)</div>
        </div>
      </div>

      {isCheckedIn ? (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: 'var(--radius-md)',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#389e0d', fontSize: 'var(--font-caption)', fontWeight: 600 }}>
            <CheckCircle size={15} />
            Đã check-in lúc {checkInTime} (Đúng giờ)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            <Clock size={13} />
            Thời gian làm việc: <strong style={{ color: 'var(--color-text-primary)' }}>{formatElapsed(elapsedSeconds)}</strong>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#fffbe6',
            border: '1px solid #ffe58f',
            borderRadius: 'var(--radius-md)',
            marginBottom: 14,
            fontSize: 'var(--font-caption)',
            color: '#ad6800',
          }}
        >
          Bạn chưa điểm danh vào ca làm việc hôm nay.
        </div>
      )}

      <button
        type="button"
        onClick={handleToggleCheck}
        className={`btn ${isCheckedIn ? 'btn-danger' : 'btn-primary'}`}
        style={{ width: '100%', height: 40, fontWeight: 600 }}
      >
        {isCheckedIn ? (
          <>
            <LogOut size={16} /> Check-out kết thúc ca
          </>
        ) : (
          <>
            <LogIn size={16} /> Check-in vào ca
          </>
        )}
      </button>
    </div>
  );
};
