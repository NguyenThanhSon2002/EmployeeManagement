import React, { useState } from 'react';
import { useAttendanceStore } from '../store/useAttendanceStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';
import type { AttendanceRecord } from '@/types/domain.types';
import { X, CheckCircle, XCircle } from 'lucide-react';

interface AttendanceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRecord?: AttendanceRecord | null;
}

export const AttendanceCorrectionModal: React.FC<AttendanceCorrectionModalProps> = ({
  isOpen,
  onClose,
  targetRecord,
}) => {
  const { corrections, approveCorrection, rejectCorrection, submitCorrection } =
    useAttendanceStore();
  const { currentUser, currentRole } = useAuthStore();
  const { addToast } = useUIStore();
  const { employees } = useDirectoryStore();

  const [activeTab, setActiveTab] = useState<'NEW' | 'PENDING'>(
    targetRecord ? 'NEW' : 'PENDING'
  );

  // New correction form states
  const [requestedCheckIn, setRequestedCheckIn] = useState('08:00');
  const [requestedCheckOut, setRequestedCheckOut] = useState('17:00');
  const [reason, setReason] = useState('');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectingCorrectionId, setRejectingCorrectionId] = useState<number | null>(null);

  if (!isOpen) return null;

  const isManagerOrAdmin = currentRole === 'ROLE_DIRECTOR' || currentRole === 'ROLE_MANAGER';

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRecord) return;
    if (!reason.trim()) {
      addToast({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng cung cấp lý do giải trình chi tiết.',
      });
      return;
    }

    submitCorrection({
      attendanceRecordId: targetRecord.id,
      employeeId: targetRecord.employeeId,
      originalCheckIn: targetRecord.checkInTime ? targetRecord.checkInTime.split('T')[1]?.substring(0, 5) || null : null,
      originalCheckOut: targetRecord.checkOutTime ? targetRecord.checkOutTime.split('T')[1]?.substring(0, 5) || null : null,
      requestedCheckIn: requestedCheckIn + ':00',
      requestedCheckOut: requestedCheckOut + ':00',
      reason: reason.trim(),
    });

    addToast({
      type: 'success',
      title: 'Đã gửi đơn giải trình',
      message: 'Đơn giải trình giờ công đã được chuyển đến Quản lý bộ phận phê duyệt.',
    });
    setReason('');
    onClose();
  };

  const handleApprove = (id: number) => {
    approveCorrection(id, currentUser.id);
    addToast({
      type: 'success',
      title: 'Đã phê duyệt giải trình',
      message: 'Dữ liệu chấm công đã được cập nhật chính xác theo giờ đề xuất.',
    });
  };

  const handleReject = (id: number) => {
    if (!rejectionReasonInput.trim()) {
      addToast({
        type: 'warning',
        title: 'Yêu cầu lý do',
        message: 'Vui lòng nhập lý do từ chối giải trình.',
      });
      return;
    }
    rejectCorrection(id, currentUser.id, rejectionReasonInput.trim());
    setRejectingCorrectionId(null);
    setRejectionReasonInput('');
    addToast({
      type: 'info',
      title: 'Đã từ chối đơn giải trình',
      message: 'Hệ thống đã ghi nhận lý do từ chối.',
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: 650 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-h2)', fontWeight: 600 }}>
              Giải Trình Bổ Sung Giờ Công (SCR-09)
            </h2>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Xử lý các sự cố quên quét thẻ, máy lỗi hoặc sự cố chấm công ngoài văn phòng
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Tab selection */}
        <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--color-border)', marginBottom: 16 }}>
          {targetRecord && (
            <button
              type="button"
              onClick={() => setActiveTab('NEW')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'NEW' ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: activeTab === 'NEW' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Nộp Đơn Cho Bản Ghi Này
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'PENDING' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'PENDING' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Danh Sách Chờ Duyệt ({corrections.filter((c) => c.status === 'PENDING').length})
          </button>
        </div>

        {activeTab === 'NEW' && targetRecord && (
          <form onSubmit={handleSubmitNew} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Bản ghi chấm công: <strong>{targetRecord.workDate}</strong>
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Hiện tại: Check-in [<strong>{targetRecord.checkInTime?.split('T')[1]?.substring(0, 5) || 'Chưa có'}</strong>] - Check-out [<strong>{targetRecord.checkOutTime?.split('T')[1]?.substring(0, 5) || 'Thiếu'}</strong>]
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                  Giờ vào đề xuất <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="time"
                  className="input"
                  value={requestedCheckIn}
                  onChange={(e) => setRequestedCheckIn(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                  Giờ ra đề xuất <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="time"
                  className="input"
                  value={requestedCheckOut}
                  onChange={(e) => setRequestedCheckOut(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                Lý do giải trình cụ thể <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="VD: Máy chấm công bị lỗi không nhận vân tay lúc 17:00, đã báo bảo vệ..."
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
                Gửi Đơn Giải Trình
              </button>
            </div>
          </form>
        )}

        {activeTab === 'PENDING' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 420, overflowY: 'auto' }}>
            {corrections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-secondary)' }}>
                Không có đơn giải trình nào trong hệ thống.
              </div>
            ) : (
              corrections.map((corr) => {
                const emp = employees.find((e) => e.id === corr.employeeId);
                const isPending = corr.status === 'PENDING';

                return (
                  <div
                    key={corr.id}
                    className="card"
                    style={{
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      borderLeft: isPending ? '4px solid #faad14' : corr.status === 'APPROVED' ? '4px solid #52c41a' : '4px solid #f5222d',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {emp?.fullName || `Nhân viên #${corr.employeeId}`} ({emp?.employeeCode})
                      </div>
                      <span className={`badge ${isPending ? 'badge-warning' : corr.status === 'APPROVED' ? 'badge-success' : 'badge-danger'}`}>
                        {isPending ? 'Chờ duyệt' : corr.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                      </span>
                    </div>

                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', gap: 16 }}>
                      <span>Ban đầu: {corr.originalCheckIn || '--:--'} - {corr.originalCheckOut || '--:--'}</span>
                      <span>👉 Đề xuất: <strong style={{ color: 'var(--color-primary)' }}>{corr.requestedCheckIn} - {corr.requestedCheckOut}</strong></span>
                    </div>

                    <div style={{ fontSize: 13, backgroundColor: 'var(--color-bg-subtle)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                      <strong>Lý do:</strong> {corr.reason}
                    </div>

                    {isPending && isManagerOrAdmin && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                        {rejectingCorrectionId === corr.id ? (
                          <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                            <input
                              type="text"
                              className="input"
                              placeholder="Lý do từ chối giải trình..."
                              value={rejectionReasonInput}
                              onChange={(e) => setRejectionReasonInput(e.target.value)}
                              style={{ flex: 1, height: 32, fontSize: 12 }}
                            />
                            <button
                              type="button"
                              className="btn btn-danger"
                              style={{ height: 32, padding: '0 10px', fontSize: 12 }}
                              onClick={() => handleReject(corr.id)}
                            >
                              Xác nhận từ chối
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ height: 32, padding: '0 10px', fontSize: 12 }}
                              onClick={() => setRejectingCorrectionId(null)}
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn-danger"
                              style={{ height: 30, padding: '0 10px', fontSize: 12 }}
                              onClick={() => setRejectingCorrectionId(corr.id)}
                            >
                              <XCircle size={13} /> Từ chối
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ height: 30, padding: '0 10px', fontSize: 12, backgroundColor: '#52c41a' }}
                              onClick={() => handleApprove(corr.id)}
                            >
                              <CheckCircle size={13} /> Chấp thuận
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
