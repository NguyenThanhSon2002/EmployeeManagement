import React, { useState, useEffect, useMemo } from 'react';
import type { ShiftAssignment, Employee } from '@/types/domain.types';
import type { SimulateSwapResult } from '../types/swap.types';
import { shiftSwapService } from '../api/shiftSwapService';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { useUIStore } from '@/shared/store/useUIStore';
import {
  ArrowLeftRight,
  X,
  CheckCircle,
  Clock,
  Calendar,
  Loader2,
  Send,
  ShieldAlert,
} from 'lucide-react';

export interface ShiftSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceAssignment: ShiftAssignment | null;
  employees: Employee[];
  allAssignments?: ShiftAssignment[];
  currentUserId: number;
  onSuccess: () => void;
}

export const ShiftSwapModal: React.FC<ShiftSwapModalProps> = ({
  isOpen,
  onClose,
  sourceAssignment,
  employees,
  currentUserId,
  onSuccess,
}) => {
  const modalRef = useModalFocusTrap({ isOpen, onClose });
  const { addToast } = useUIStore();

  const [targetEmployeeId, setTargetEmployeeId] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulateSwapResult | null>(null);

  // Đồng nghiệp hợp lệ để nhường ca (cùng chi nhánh, loại trừ nhân sự của ca nguồn và Giám đốc)
  const sourceEmpId = sourceAssignment ? Number(sourceAssignment.employeeId) : Number(currentUserId);
  const candidateEmployees = useMemo(() => {
    return employees.filter(
      (e) =>
        Number(e.id) !== sourceEmpId &&
        e.isActive &&
        e.employmentStatus !== 'RESIGNED' &&
        e.positionId !== 1
    );
  }, [employees, sourceEmpId]);

  // Reset form khi mở modal với assignment mới
  useEffect(() => {
    if (isOpen) {
      setTargetEmployeeId(0);
      setReason('');
      setSimulationResult(null);
    }
  }, [isOpen, sourceAssignment]);

  // Tự động kiểm tra xung đột luật lao động 1 chiều cho người nhận ca
  useEffect(() => {
    if (!sourceAssignment || !targetEmployeeId) {
      setSimulationResult(null);
      return;
    }

    let isMounted = true;
    setIsSimulating(true);

    const timer = setTimeout(async () => {
      try {
        const result = await shiftSwapService.simulateSwap({
          requesterAssignmentId: sourceAssignment.id,
          targetEmployeeId: targetEmployeeId,
          type: 'HANDOVER',
        });
        if (isMounted) {
          setSimulationResult(result);
        }
      } catch (err: any) {
        if (isMounted) {
          setSimulationResult({
            valid: false,
            hasError: true,
            hasWarning: false,
            isServerError: true,
            requesterConflicts: [],
            targetConflicts: [],
            message: err?.response?.data?.error?.message || err?.message || 'Lỗi khi kiểm tra xung đột',
          });
        }
      } finally {
        if (isMounted) {
          setIsSimulating(false);
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [sourceAssignment, targetEmployeeId]);

  if (!isOpen || !sourceAssignment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      addToast({
        type: 'error',
        title: 'Thiếu lý do',
        message: 'Vui lòng cung cấp lý do đề xuất nhường ca.',
      });
      return;
    }

    const isTimeNotice = simulationResult?.targetConflicts.some(
      (c) =>
        c.ruleCode === 'WARN_SHORT_NOTICE_SWAP' ||
        (c as any).conflictType === 'WARN_SHORT_NOTICE_SWAP' ||
        c.ruleCode === 'PAST_SHIFT' ||
        (c as any).conflictType === 'PAST_SHIFT'
    );
    if (isTimeNotice && reason.trim().length < 6) {
      addToast({
        type: 'warning',
        title: 'Lý do đổi ca',
        message: 'Đổi ca sát giờ (< 24h) hoặc đổi ca hồi tố bắt buộc phải ghi rõ lý do để Quản lý thẩm định.',
      });
      return;
    }

    if (simulationResult?.hasError) {
      addToast({
        type: 'error',
        title: simulationResult.isServerError ? 'Lỗi hệ thống' : 'Vi phạm quy định',
        message: simulationResult.message || 'Không thể tạo đơn nhường ca.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await shiftSwapService.createSwapRequest({
        requesterAssignmentId: sourceAssignment.id,
        targetEmployeeId,
        type: 'HANDOVER',
        reason: reason.trim(),
      });

      addToast({
        type: 'success',
        title: 'Đã gửi đề xuất nhường ca',
        message: 'Đã gửi yêu cầu đến đồng nghiệp thành công. Chờ đồng nghiệp phản hồi trước khi Quản lý duyệt.',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Lỗi gửi yêu cầu',
        message: err?.response?.data?.error?.message || err?.message || 'Không thể tạo yêu cầu nhường ca.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    Boolean(targetEmployeeId) &&
    Boolean(reason.trim()) &&
    !isSimulating &&
    !simulationResult?.hasError;

  return (
    <div
      className="drawer-backdrop"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 1100,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="swap-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          top: 'auto',
          left: 'auto',
          transform: 'none',
          width: 540,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <h3 id="swap-modal-title" style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', margin: 0 }}>
                Đề Xuất Nhường Ca
              </h3>
              <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
                Gửi yêu cầu nhường ca làm việc cho đồng nghiệp và tự động kiểm tra quy định làm việc.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
            }}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 1. Ca làm việc cần nhường của bạn */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#F1F5F9',
              borderRadius: 10,
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
              Ca làm việc của bạn (Cần nhường)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
                  {sourceAssignment.snapshotShiftName}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#475569', marginTop: 4 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={13} color="#64748B" /> {sourceAssignment.workDate}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={13} color="#64748B" /> {sourceAssignment.snapshotStartTime} - {sourceAssignment.snapshotEndTime}
                  </span>
                </div>
              </div>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  backgroundColor: sourceAssignment.snapshotColorCode || '#2563EB',
                }}
              />
            </div>
          </div>

          {/* 2. Chọn đồng nghiệp nhận ca */}
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
              Chọn đồng nghiệp nhận đề xuất <span style={{ color: '#DC2626' }}>*</span>
            </label>
            {candidateEmployees.length === 0 ? (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  fontSize: 12,
                  color: '#B45309',
                }}
              >
                Không có nhân sự nào khác trong chi nhánh này khả dụng để nhận ca.
              </div>
            ) : (
              <select
                className="input-base"
                value={targetEmployeeId}
                onChange={(e) => setTargetEmployeeId(Number(e.target.value))}
                style={{ width: '100%', height: 38, fontSize: 13 }}
                required
              >
                <option value={0}>-- Chọn đồng nghiệp trong chi nhánh --</option>
                {candidateEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 3. Lý do nhường ca */}
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
              Lý do xin nhường ca <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <textarea
              className="input-base"
              rows={2}
              placeholder="Ví dụ: Bận việc gia đình đột xuất, nhờ đồng nghiệp đi làm thay..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                height: 64,
                padding: '8px 12px',
                fontSize: 13,
                resize: 'none',
              }}
              required
            />
          </div>

          {/* 4. Hộp Kiểm Tra Xung Đột Thời Gian Thực (Conflict Pre-check) */}
          {(isSimulating || simulationResult) && (
            <div
              style={{
                borderRadius: 10,
                padding: '12px 14px',
                backgroundColor: isSimulating
                  ? '#F8FAFC'
                  : simulationResult?.hasError
                  ? '#FEF2F2'
                  : simulationResult?.hasWarning
                  ? '#FFFBEB'
                  : '#F0FDF4',
                border: isSimulating
                  ? '1px solid #E2E8F0'
                  : simulationResult?.hasError
                  ? '1px solid #FECACA'
                  : simulationResult?.hasWarning
                  ? '1px solid #FDE68A'
                  : '1px solid #BBF7D0',
                transition: 'all 0.2s ease',
              }}
            >
              {isSimulating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B' }}>
                  <Loader2 size={16} className="animate-spin" color="#2563EB" />
                  <span>Đang phân tích tuân thủ luật lao động & thời gian nghỉ của đồng nghiệp...</span>
                </div>
              ) : simulationResult?.hasError ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#DC2626', fontWeight: 700, fontSize: 12.5 }}>
                    <ShieldAlert size={16} /> {simulationResult.isServerError ? 'Lỗi kết nối / Máy chủ nội bộ' : 'Vi phạm quy định làm việc (Bị chặn)'}
                  </div>
                  <div style={{ fontSize: 12, color: '#991B1B', marginTop: 4 }}>
                    {simulationResult.message}
                  </div>
                  {simulationResult.targetConflicts.map((c, idx) => (
                    <div key={idx} style={{ fontSize: 11.5, color: '#B91C1C', marginTop: 3 }}>
                      • <strong>Đồng nghiệp:</strong> {c.message}
                    </div>
                  ))}
                </div>
              ) : simulationResult?.hasWarning ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#D97706', fontWeight: 700, fontSize: 12.5 }}>
                    <ShieldAlert size={16} /> Cảnh báo quy định làm việc
                  </div>
                  <div style={{ fontSize: 12, color: '#92400E', marginTop: 4 }}>
                    {simulationResult.message}
                  </div>
                  {simulationResult.targetConflicts.map((c, idx) => {
                    const isTimeNotice =
                      c.ruleCode === 'WARN_SHORT_NOTICE_SWAP' ||
                      (c as any).conflictType === 'WARN_SHORT_NOTICE_SWAP' ||
                      c.ruleCode === 'PAST_SHIFT' ||
                      (c as any).conflictType === 'PAST_SHIFT';
                    return (
                      <div key={idx} style={{ fontSize: 11.5, color: '#B45309', marginTop: 3, fontWeight: isTimeNotice ? 600 : 400 }}>
                        {isTimeNotice ? '⚠️ Lưu ý thời gian: ' : '• Đồng nghiệp: '}{c.message}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803D', fontSize: 12.5, fontWeight: 600 }}>
                  <CheckCircle size={16} color="#16A34A" />
                  <span>Đồng nghiệp hoàn toàn hợp lệ để nhận ca! Đảm bảo thời gian nghỉ tối thiểu và trần giờ làm việc.</span>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div
            style={{
              paddingTop: 12,
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ height: 38, padding: '0 16px', fontSize: 13 }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isFormValid || isSubmitting}
              style={{
                height: 38,
                padding: '0 18px',
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Gửi đề xuất nhường ca</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
