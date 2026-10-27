import React, { useState, useEffect } from 'react';
import { useUIStore } from '@/shared/store/useUIStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { dashboardService, type PendingApprovalItem } from '../api/dashboardService';
import { leaveService } from '@/features/leaves/api/leaveService';
import { attendanceService } from '@/features/attendance/api/attendanceService';
import { isMockEnabled } from '@/config/env.config';
import { Check, X, FileText, Palmtree, Loader2 } from 'lucide-react';

export const PendingApprovalsWidget: React.FC = () => {
  const [items, setItems] = useState<PendingApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { addToast } = useUIStore();
  const { currentUser, currentRole } = useAuthStore();

  const isDirector = currentRole === 'ROLE_DIRECTOR';
  const effectiveBranchId = !isDirector ? currentUser?.branchId : undefined;

  const loadPending = async () => {
    if (isMockEnabled()) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await dashboardService.getPendingApprovals(effectiveBranchId);
      setItems(data || []);
    } catch (err) {
      console.warn('Could not fetch pending approvals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, [effectiveBranchId]);

  const handleApprove = async (item: PendingApprovalItem) => {
    try {
      if (!isMockEnabled()) {
        if (item.type === 'LEAVE') {
          await leaveService.reviewLeaveRequest(item.id, 'APPROVE');
        } else {
          await attendanceService.reviewCorrection(item.id, { action: 'APPROVE' });
        }
      }
      setItems((prev) => prev.filter((i) => !(i.id === item.id && i.type === item.type)));
      addToast({
        type: 'success',
        title: 'Đã phê duyệt đơn',
        message: `Đơn của nhân viên ${item.employee_name} đã được phê duyệt thành công.`,
      });
    } catch (err) {
      console.error('Lỗi khi phê duyệt đơn:', err);
      addToast({
        type: 'error',
        title: 'Phê duyệt thất bại',
        message: 'Không thể phê duyệt đơn này, vui lòng thử lại sau.',
      });
    }
  };

  const handleReject = async (item: PendingApprovalItem) => {
    try {
      if (!isMockEnabled()) {
        if (item.type === 'LEAVE') {
          await leaveService.reviewLeaveRequest(item.id, 'REJECT', 'Từ chối trên Dashboard');
        } else {
          await attendanceService.reviewCorrection(item.id, {
            action: 'REJECT',
            rejection_reason: 'Từ chối trên Dashboard',
          });
        }
      }
      setItems((prev) => prev.filter((i) => !(i.id === item.id && i.type === item.type)));
      addToast({
        type: 'info',
        title: 'Đã từ chối đơn',
        message: `Đã từ chối yêu cầu của ${item.employee_name}.`,
      });
    } catch (err) {
      console.error('Lỗi khi từ chối đơn:', err);
      addToast({
        type: 'error',
        title: 'Từ chối thất bại',
        message: 'Không thể cập nhật trạng thái đơn, vui lòng thử lại sau.',
      });
    }
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

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 8, color: 'var(--color-text-muted)' }}>
          <Loader2 size={18} className="animate-spin" />
          <span>Đang tải danh sách đơn chờ duyệt...</span>
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-lg) 0', color: 'var(--color-text-muted)' }}>
          Tuyệt vời! Không còn đơn từ nào đang chờ phê duyệt.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item) => (
            <div
              key={`${item.type}_${item.id}`}
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
                      {item.employee_name}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      ({item.employee_code})
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 500 }}>
                      • {item.date_str}
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
                  onClick={() => handleReject(item)}
                  style={{ height: 32, padding: '0 10px', fontSize: 12, color: 'var(--color-error)' }}
                  title="Từ chối đơn"
                >
                  <X size={14} /> Từ chối
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleApprove(item)}
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
