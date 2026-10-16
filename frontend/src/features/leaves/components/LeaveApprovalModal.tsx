import React, { useState } from 'react';
import { useLeaveStore } from '../store/useLeaveStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';
import type { LeaveRequest } from '@/types/domain.types';
import { X, CheckCircle, XCircle, Calendar } from 'lucide-react';

interface LeaveApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveRequest: LeaveRequest | null;
}

export const LeaveApprovalModal: React.FC<LeaveApprovalModalProps> = ({
  isOpen,
  onClose,
  leaveRequest,
}) => {
  const { approveLeave, rejectLeave, getBalance } = useLeaveStore();
  const { currentUser } = useAuthStore();
  const { addToast } = useUIStore();
  const { employees } = useDirectoryStore();

  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!isOpen || !leaveRequest) return null;

  const emp = employees.find((e) => e.id === leaveRequest.employeeId);
  const balance = getBalance(leaveRequest.employeeId);

  const handleApprove = () => {
    approveLeave(leaveRequest.id, currentUser.id);
    addToast({
      type: 'success',
      title: 'Đã duyệt đơn nghỉ phép',
      message: `Đơn của ${emp?.fullName} đã được chấp thuận và lưu vào CSDL MySQL. Thẻ [🏖️ PHÉP NĂM] đã tự động đồng bộ sang Bảng Lịch Tuần.`,
    });
    onClose();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      addToast({
        type: 'warning',
        title: 'Thiếu lý do từ chối',
        message: 'Vui lòng nêu rõ lý do không thể duyệt đơn.',
      });
      return;
    }
    rejectLeave(leaveRequest.id, currentUser.id, rejectionReason.trim());
    addToast({
      type: 'info',
      title: 'Đã từ chối đơn nghỉ phép',
      message: 'Hệ thống đã cập nhật trạng thái đơn thành TỪ CHỐI trong CSDL MySQL.',
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 'var(--font-h2)', fontWeight: 600 }}>Phê Duyệt Đơn Nghỉ Phép (SCR-14)</h2>
          <button type="button" onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Employee & Leave info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <img
              src={emp?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={emp?.fullName}
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{emp?.fullName}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                {emp?.employeeCode} â€¢ {leaveRequest.leaveTypeName}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Thời gian nghỉ</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 4 }}>
                {leaveRequest.startDate} ðŸ‘‰ {leaveRequest.endDate}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-primary)', marginTop: 2 }}>
                Tổng: {leaveRequest.totalDays} ngày
              </div>
            </div>

            <div style={{ padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Quỹ phép còn lại</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 4, color: '#389e0d' }}>
                {balance.remainingDays} / {balance.annualQuota} ngày
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                Đã dùng {balance.usedDays} ngày
              </div>
            </div>
          </div>

          <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Lý do xin nghỉ:</div>
            <div style={{ fontSize: 13, fontStyle: 'italic' }}>"{leaveRequest.reason}"</div>
          </div>

          {/* Sync Highlight */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#e6f7ff',
              border: '1px solid #91d5ff',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              color: '#0050b3',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <Calendar size={16} style={{ flexShrink: 0 }} />
            <span>
              <strong>Tự động đồng bộ:</strong> Khi bấm Chấp thuận, hệ thống tự động gán thẻ phép màu xanh lá lên Bảng Lịch Tuần (SCR-11) và kiểm tra lại xung đột ca.
            </span>
          </div>

          {showRejectForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#cf1322' }}>
                Lý do từ chối đơn:
              </label>
              <textarea
                className="input"
                rows={2}
                placeholder="Nhập lý do từ chối..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRejectForm(false)}
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleReject}
                >
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setShowRejectForm(true)}
              >
                <XCircle size={15} /> Từ chối
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: '#52c41a' }}
                onClick={handleApprove}
              >
                <CheckCircle size={15} /> Chấp thuận (Duyệt)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
