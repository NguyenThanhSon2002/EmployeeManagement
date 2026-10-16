import React, { useState } from 'react';
import { useAttendanceStore } from '../store/useAttendanceStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { MOCK_EMPLOYEES } from '@/mocks/employees.mock';
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

  const isManagerOrAdmin = currentRole === 'ROLE_ADMIN' || currentRole === 'ROLE_HR_MANAGER' || currentRole === 'ROLE_DEPT_MANAGER';

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRecord) return;
    if (!reason.trim()) {
      addToast({
        type: 'warning',
        title: 'Thiáº¿u thÃ´ng tin',
        message: 'Vui lÃ²ng cung cáº¥p lÃ½ do giáº£i trÃ¬nh chi tiáº¿t.',
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
      title: 'ÄÃ£ gá»­i Ä‘Æ¡n giáº£i trÃ¬nh',
      message: 'ÄÆ¡n giáº£i trÃ¬nh giá» cÃ´ng Ä‘Ã£ Ä‘Æ°á»£c chuyá»ƒn Ä‘áº¿n Quáº£n lÃ½ bá»™ pháº­n phÃª duyá»‡t.',
    });
    setReason('');
    onClose();
  };

  const handleApprove = (id: number) => {
    approveCorrection(id, currentUser.id);
    addToast({
      type: 'success',
      title: 'ÄÃ£ phÃª duyá»‡t giáº£i trÃ¬nh',
      message: 'Dá»¯ liá»‡u cháº¥m cÃ´ng Ä‘Ã£ Ä‘Æ°á»£c cáº­p nháº­t chÃ­nh xÃ¡c theo giá» Ä‘á» xuáº¥t.',
    });
  };

  const handleReject = (id: number) => {
    if (!rejectionReasonInput.trim()) {
      addToast({
        type: 'warning',
        title: 'YÃªu cáº§u lÃ½ do',
        message: 'Vui lÃ²ng nháº­p lÃ½ do tá»« chá»‘i giáº£i trÃ¬nh.',
      });
      return;
    }
    rejectCorrection(id, currentUser.id, rejectionReasonInput.trim());
    setRejectingCorrectionId(null);
    setRejectionReasonInput('');
    addToast({
      type: 'info',
      title: 'ÄÃ£ tá»« chá»‘i Ä‘Æ¡n giáº£i trÃ¬nh',
      message: 'Há»‡ thá»‘ng Ä‘Ã£ ghi nháº­n lÃ½ do tá»« chá»‘i.',
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: 650 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-h2)', fontWeight: 600 }}>
              Giáº£i TrÃ¬nh Bá»• Sung Giá» CÃ´ng (SCR-09)
            </h2>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Xá»­ lÃ½ cÃ¡c sá»± cá»‘ quÃªn quÃ©t tháº», mÃ¡y lá»—i hoáº·c sá»± cá»‘ cháº¥m cÃ´ng ngoÃ i vÄƒn phÃ²ng
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
              Ná»™p ÄÆ¡n Cho Báº£n Ghi NÃ y
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
            Danh SÃ¡ch Chá» Duyá»‡t ({corrections.filter((c) => c.status === 'PENDING').length})
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
                Báº£n ghi cháº¥m cÃ´ng: <strong>{targetRecord.workDate}</strong>
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Hiá»‡n táº¡i: Check-in [<strong>{targetRecord.checkInTime?.split('T')[1]?.substring(0, 5) || 'ChÆ°a cÃ³'}</strong>] - Check-out [<strong>{targetRecord.checkOutTime?.split('T')[1]?.substring(0, 5) || 'Thiáº¿u'}</strong>]
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                  Giá» vÃ o Ä‘á» xuáº¥t <span style={{ color: 'red' }}>*</span>
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
                  Giá» ra Ä‘á» xuáº¥t <span style={{ color: 'red' }}>*</span>
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
                LÃ½ do giáº£i trÃ¬nh cá»¥ thá»ƒ <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="VD: MÃ¡y cháº¥m cÃ´ng bá»‹ lá»—i khÃ´ng nháº­n vÃ¢n tay lÃºc 17:00, Ä‘Ã£ bÃ¡o báº£o vá»‡..."
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
                Gá»­i ÄÆ¡n Giáº£i TrÃ¬nh
              </button>
            </div>
          </form>
        )}

        {activeTab === 'PENDING' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 420, overflowY: 'auto' }}>
            {corrections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-secondary)' }}>
                KhÃ´ng cÃ³ Ä‘Æ¡n giáº£i trÃ¬nh nÃ o trong há»‡ thá»‘ng.
              </div>
            ) : (
              corrections.map((corr) => {
                const emp = MOCK_EMPLOYEES.find((e) => e.id === corr.employeeId);
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
                        {emp?.fullName || `NhÃ¢n viÃªn #${corr.employeeId}`} ({emp?.employeeCode})
                      </div>
                      <span className={`badge ${isPending ? 'badge-warning' : corr.status === 'APPROVED' ? 'badge-success' : 'badge-danger'}`}>
                        {isPending ? 'Chá» duyá»‡t' : corr.status === 'APPROVED' ? 'ÄÃ£ duyá»‡t' : 'Tá»« chá»‘i'}
                      </span>
                    </div>

                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', gap: 16 }}>
                      <span>Ban Ä‘áº§u: {corr.originalCheckIn || '--:--'} - {corr.originalCheckOut || '--:--'}</span>
                      <span>ðŸ‘‰ Äá» xuáº¥t: <strong style={{ color: 'var(--color-primary)' }}>{corr.requestedCheckIn} - {corr.requestedCheckOut}</strong></span>
                    </div>

                    <div style={{ fontSize: 13, backgroundColor: 'var(--color-bg-subtle)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                      <strong>LÃ½ do:</strong> {corr.reason}
                    </div>

                    {isPending && isManagerOrAdmin && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                        {rejectingCorrectionId === corr.id ? (
                          <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                            <input
                              type="text"
                              className="input"
                              placeholder="LÃ½ do tá»« chá»‘i giáº£i trÃ¬nh..."
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
                              XÃ¡c nháº­n tá»« chá»‘i
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ height: 32, padding: '0 10px', fontSize: 12 }}
                              onClick={() => setRejectingCorrectionId(null)}
                            >
                              Há»§y
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
                              <XCircle size={13} /> Tá»« chá»‘i
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ height: 30, padding: '0 10px', fontSize: 12, backgroundColor: '#52c41a' }}
                              onClick={() => handleApprove(corr.id)}
                            >
                              <CheckCircle size={13} /> Cháº¥p thuáº­n
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
