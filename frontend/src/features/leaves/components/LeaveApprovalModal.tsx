import React, { useState } from 'react';
import { useLeaveStore } from '../store/useLeaveStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { MOCK_EMPLOYEES } from '@/mocks/employees.mock';
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

  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!isOpen || !leaveRequest) return null;

  const emp = MOCK_EMPLOYEES.find((e) => e.id === leaveRequest.employeeId);
  const balance = getBalance(leaveRequest.employeeId);

  const handleApprove = () => {
    approveLeave(leaveRequest.id, currentUser.id);
    addToast({
      type: 'success',
      title: 'ÄÃ£ duyá»‡t Ä‘Æ¡n nghá»‰ phÃ©p',
      message: `ÄÆ¡n cá»§a ${emp?.fullName} Ä‘Ã£ Ä‘Æ°á»£c cháº¥p thuáº­n vÃ  lÆ°u vÃ o CSDL MySQL. Tháº» [ðŸ–ï¸ PHÃ‰P NÄ‚M] Ä‘Ã£ tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sang Báº£ng Lá»‹ch Tuáº§n.`,
    });
    onClose();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      addToast({
        type: 'warning',
        title: 'Thiáº¿u lÃ½ do tá»« chá»‘i',
        message: 'Vui lÃ²ng nÃªu rÃµ lÃ½ do khÃ´ng thá»ƒ duyá»‡t Ä‘Æ¡n.',
      });
      return;
    }
    rejectLeave(leaveRequest.id, currentUser.id, rejectionReason.trim());
    addToast({
      type: 'info',
      title: 'ÄÃ£ tá»« chá»‘i Ä‘Æ¡n nghá»‰ phÃ©p',
      message: 'Há»‡ thá»‘ng Ä‘Ã£ cáº­p nháº­t tráº¡ng thÃ¡i Ä‘Æ¡n thÃ nh Tá»ª CHá»I trong CSDL MySQL.',
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 'var(--font-h2)', fontWeight: 600 }}>PhÃª Duyá»‡t ÄÆ¡n Nghá»‰ PhÃ©p (SCR-14)</h2>
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
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Thá»i gian nghá»‰</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 4 }}>
                {leaveRequest.startDate} ðŸ‘‰ {leaveRequest.endDate}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-primary)', marginTop: 2 }}>
                Tá»•ng: {leaveRequest.totalDays} ngÃ y
              </div>
            </div>

            <div style={{ padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Quá»¹ phÃ©p cÃ²n láº¡i</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 4, color: '#389e0d' }}>
                {balance.remainingDays} / {balance.annualQuota} ngÃ y
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                ÄÃ£ dÃ¹ng {balance.usedDays} ngÃ y
              </div>
            </div>
          </div>

          <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>LÃ½ do xin nghá»‰:</div>
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
              <strong>Tá»± Ä‘á»™ng Ä‘á»“ng bá»™:</strong> Khi báº¥m Cháº¥p thuáº­n, há»‡ thá»‘ng tá»± Ä‘á»™ng gÃ¡n tháº» phÃ©p mÃ u xanh lÃ¡ lÃªn Báº£ng Lá»‹ch Tuáº§n (SCR-11) vÃ  kiá»ƒm tra láº¡i xung Ä‘á»™t ca.
            </span>
          </div>

          {showRejectForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#cf1322' }}>
                LÃ½ do tá»« chá»‘i Ä‘Æ¡n:
              </label>
              <textarea
                className="input"
                rows={2}
                placeholder="Nháº­p lÃ½ do tá»« chá»‘i..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRejectForm(false)}
                >
                  Quay láº¡i
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleReject}
                >
                  XÃ¡c nháº­n tá»« chá»‘i
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
                ÄÃ³ng
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setShowRejectForm(true)}
              >
                <XCircle size={15} /> Tá»« chá»‘i
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: '#52c41a' }}
                onClick={handleApprove}
              >
                <CheckCircle size={15} /> Cháº¥p thuáº­n (Duyá»‡t)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
