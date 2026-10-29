import React, { useState, useEffect } from 'react';
import type { ShiftSwapItem } from '../types/swap.types';
import { shiftSwapService } from '../api/shiftSwapService';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { useUIStore } from '@/shared/store/useUIStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import {
  ArrowLeftRight,
  ArrowRight,
  X,
  Check,
  CheckCheck,
  Filter,
  Loader2,
  Trash2,
  ShieldCheck,
  Inbox,
  Send,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export interface ShiftSwapManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: number;
  onScheduleUpdated: () => void;
}

export const ShiftSwapManagementModal: React.FC<ShiftSwapManagementModalProps> = ({
  isOpen,
  onClose,
  branchId,
  onScheduleUpdated,
}) => {
  const modalRef = useModalFocusTrap({ isOpen, onClose });
  const { addToast } = useUIStore();
  const { currentRole, currentUser } = useAuthStore();
  const isManagerOrDirector = currentRole === 'ROLE_DIRECTOR' || currentRole === 'ROLE_MANAGER';
  const currentEmpId = currentUser?.id || 1;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'INBOX' | 'SENT' | 'MANAGER'>(() =>
    isManagerOrDirector ? 'MANAGER' : 'INBOX'
  );

  // Sub-filter cho tab Quản lý
  const [managerSubFilter, setManagerSubFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const [items, setItems] = useState<ShiftSwapItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'MANAGER') {
        const res = await shiftSwapService.getAllBranchRequests(branchId);
        setItems(res || []);
      } else {
        const res = await shiftSwapService.getMyRequests();
        setItems(res || []);
      }
    } catch (err: any) {
      console.warn('Failed to load swap requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab, branchId]);

  if (!isOpen) return null;

  // Lọc theo Tab người dùng
  const displayItems = items.filter((item) => {
    if (activeTab === 'INBOX') {
      return item.targetId === currentEmpId;
    }
    if (activeTab === 'SENT') {
      return item.requesterId === currentEmpId;
    }
    // Tab MANAGER: Áp dụng managerSubFilter
    if (managerSubFilter === 'PENDING') {
      return item.status === 'PENDING_PEER' || item.status === 'PEER_ACCEPTED';
    }
    if (managerSubFilter === 'APPROVED') {
      return item.status === 'APPROVED';
    }
    if (managerSubFilter === 'REJECTED') {
      return item.status === 'REJECTED' || item.status === 'PEER_REJECTED' || item.status === 'CANCELLED';
    }
    return true; // ALL
  });

  // Xử lý Đồng nghiệp chấp nhận / từ chối
  const handlePeerRespond = async (id: number, action: 'ACCEPT' | 'REJECT') => {
    setProcessingId(id);
    try {
      await shiftSwapService.peerRespond(id, action);
      addToast({
        type: 'success',
        title: action === 'ACCEPT' ? 'Đã đồng ý nhận ca' : 'Đã từ chối nhận ca',
        message:
          action === 'ACCEPT'
            ? 'Đơn nhường ca đã được chuyển sang cho Quản lý chi nhánh xét duyệt.'
            : 'Đã gửi phản hồi từ chối đến đồng nghiệp.',
      });
      loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: err?.response?.data?.error?.message || err?.message || 'Không thể xử lý yêu cầu.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Xử lý Quản lý phê duyệt / bác bỏ
  const handleManagerReview = async (id: number, action: 'APPROVE' | 'REJECT') => {
    let note: string | undefined = undefined;
    if (action === 'REJECT') {
      const reason = window.prompt('Nhập lý do bác bỏ đơn nhường ca (nếu có):');
      if (reason === null) return;
      note = reason.trim();
    }

    setProcessingId(id);
    try {
      await shiftSwapService.managerReview(id, action, note);
      addToast({
        type: 'success',
        title: action === 'APPROVE' ? 'Phê duyệt thành công' : 'Đã từ chối đơn',
        message:
          action === 'APPROVE'
            ? 'Lịch phân ca tuần đã được tự động chuyển giao và cập nhật trên toàn hệ thống.'
            : 'Đã từ chối yêu cầu nhường ca.',
      });
      loadData();
      if (action === 'APPROVE') {
        onScheduleUpdated();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Lỗi phê duyệt',
        message: err?.response?.data?.error?.message || err?.message || 'Không thể phê duyệt đơn.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Xử lý Người tạo hủy đơn
  const handleCancelRequest = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy yêu cầu nhường ca này không?')) return;
    setProcessingId(id);
    try {
      await shiftSwapService.cancelRequest(id);
      addToast({
        type: 'info',
        title: 'Đã hủy yêu cầu',
        message: 'Yêu cầu nhường ca đã được hủy bỏ thành công.',
      });
      loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: err?.response?.data?.error?.message || err?.message || 'Không thể hủy yêu cầu.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PEER':
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              backgroundColor: '#FEF3C7',
              color: '#D97706',
            }}
            title="Đang chờ đồng nghiệp phản hồi hoặc Quản lý có thể duyệt trực tiếp"
          >
            Chờ đồng nghiệp (Có thể duyệt thẳng)
          </span>
        );
      case 'PEER_ACCEPTED':
        return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>Chờ Quản lý duyệt</span>;
      case 'PEER_REJECTED':
        return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, backgroundColor: '#FEE2E2', color: '#DC2626' }}>Đồng nghiệp từ chối</span>;
      case 'APPROVED':
        return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, backgroundColor: '#DCFCE7', color: '#15803D' }}>Đã phê duyệt</span>;
      case 'REJECTED':
        return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, backgroundColor: '#F1F5F9', color: '#64748B' }}>Quản lý từ chối</span>;
      case 'CANCELLED':
        return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, backgroundColor: '#F1F5F9', color: '#94A3B8' }}>Đã hủy</span>;
      default:
        return null;
    }
  };

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
        aria-labelledby="swap-manage-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          top: 'auto',
          left: 'auto',
          transform: 'none',
          width: 720,
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
              <h3 id="swap-manage-title" style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', margin: 0 }}>
                Quản Lý Yêu Cầu Nhường Ca
              </h3>
              <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
                Theo dõi tiến độ, phản hồi đề xuất và phê duyệt chuyển giao ca làm việc.
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

        {/* Tab Controls */}
        <div
          style={{
            display: 'flex',
            padding: '0 20px',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            gap: 20,
          }}
        >
          {isManagerOrDirector && (
            <button
              type="button"
              onClick={() => setActiveTab('MANAGER')}
              style={{
                padding: '12px 4px',
                border: 'none',
                background: 'none',
                fontSize: 13,
                fontWeight: activeTab === 'MANAGER' ? 700 : 500,
                color: activeTab === 'MANAGER' ? '#2563EB' : '#64748B',
                borderBottom: activeTab === 'MANAGER' ? '2px solid #2563EB' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ShieldCheck size={16} /> Chờ Quản lý duyệt
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('INBOX')}
            style={{
              padding: '12px 4px',
              border: 'none',
              background: 'none',
              fontSize: 13,
              fontWeight: activeTab === 'INBOX' ? 700 : 500,
              color: activeTab === 'INBOX' ? '#2563EB' : '#64748B',
              borderBottom: activeTab === 'INBOX' ? '2px solid #2563EB' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Inbox size={16} /> Đồng nghiệp nhờ tôi
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SENT')}
            style={{
              padding: '12px 4px',
              border: 'none',
              background: 'none',
              fontSize: 13,
              fontWeight: activeTab === 'SENT' ? 700 : 500,
              color: activeTab === 'SENT' ? '#2563EB' : '#64748B',
              borderBottom: activeTab === 'SENT' ? '2px solid #2563EB' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Send size={16} /> Đơn tôi đã gửi
          </button>
        </div>

        {/* Sub-filter cho tab Quản lý */}
        {activeTab === 'MANAGER' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 20px',
              backgroundColor: '#F1F5F9',
              borderBottom: '1px solid #E2E8F0',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
              <Filter size={13} /> Lọc trạng thái:
            </span>
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'PENDING', label: 'Chờ xử lý' },
              { id: 'APPROVED', label: 'Đã phê duyệt' },
              { id: 'REJECTED', label: 'Đã từ chối / Hủy' },
            ].map((f) => {
              const isActive = managerSubFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setManagerSubFilter(f.id as any)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 6,
                    border: '1px solid',
                    fontSize: 11.5,
                    fontWeight: isActive ? 700 : 500,
                    backgroundColor: isActive ? '#2563EB' : '#FFFFFF',
                    borderColor: isActive ? '#1D4ED8' : '#CBD5E1',
                    color: isActive ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', minHeight: 320, backgroundColor: '#F8FAFC' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260, color: '#64748B', gap: 10 }}>
              <Loader2 size={24} className="animate-spin" color="#2563EB" />
              <span>Đang tải danh sách đơn nhường ca...</span>
            </div>
          ) : displayItems.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 260,
                color: '#94A3B8',
                gap: 8,
              }}
            >
              <ArrowLeftRight size={36} color="#CBD5E1" />
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>Không có yêu cầu nhường ca nào trong mục này.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {displayItems.map((item) => {
                const isProcessing = processingId === item.id;
                const canPeerAction = activeTab === 'INBOX' && item.status === 'PENDING_PEER';
                const canManagerDirectApprove = activeTab === 'MANAGER' && item.status === 'PENDING_PEER';
                const canManagerAction = activeTab === 'MANAGER' && item.status === 'PEER_ACCEPTED';
                const canCancelAction = activeTab === 'SENT' && item.status === 'PENDING_PEER';

                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 12,
                      border: '1px solid #E2E8F0',
                      padding: '14px 16px',
                      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                    }}
                  >
                    {/* Header đơn */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: 6 }}>
                          {item.requestCode}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                          🎁 Nhường ca 1 chiều
                        </span>
                      </div>
                      <div>{getStatusBadge(item.status)}</div>
                    </div>

                    {/* Chi tiết chuyển giao */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto 1fr',
                        gap: 12,
                        alignItems: 'center',
                        backgroundColor: '#F8FAFC',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid #F1F5F9',
                        marginBottom: 10,
                      }}
                    >
                      {/* Bên người gửi (Người xin nhường) */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                          Người xin nhường: {item.requesterName}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginTop: 2 }}>
                          {item.requesterShiftName}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>
                          📅 {item.requesterWorkDate} ({item.requesterStartTime} - {item.requesterEndTime})
                        </div>
                      </div>

                      {/* Mũi tên chuyển giao */}
                      <div style={{ color: '#2563EB', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <ArrowRight size={20} />
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B' }}>chuyển giao</span>
                      </div>

                      {/* Bên nhận ca */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                          Đồng nghiệp nhận ca: {item.targetName}
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: item.status === 'PENDING_PEER' ? '#D97706' : '#059669', marginTop: 4 }}>
                          {item.status === 'PENDING_PEER' ? '⏳ Đang chờ xác nhận' : '✓ Đồng ý nhận làm thay'}
                        </div>
                      </div>
                    </div>

                    {/* Lý do & ghi chú */}
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 10 }}>
                      <strong>Lý do:</strong> {item.reason}
                      {item.peerNote && (
                        <div style={{ marginTop: 2, color: '#64748B' }}>
                          <strong>Ghi chú đồng nghiệp:</strong> {item.peerNote}
                        </div>
                      )}
                      {item.managerNote && (
                        <div style={{ marginTop: 2, color: item.status === 'REJECTED' ? '#DC2626' : '#16A34A' }}>
                          <strong>{item.status === 'REJECTED' ? 'Lý do quản lý từ chối:' : 'Ghi chú quản lý / phê duyệt:'}</strong> {item.managerNote}
                        </div>
                      )}
                    </div>

                    {/* Actions bar */}
                    {(canPeerAction || canManagerDirectApprove || canManagerAction || canCancelAction) && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 8,
                          paddingTop: 10,
                          borderTop: '1px solid #F1F5F9',
                        }}
                      >
                        {/* Hành động đồng nghiệp */}
                        {canPeerAction && (
                          <>
                            <button
                              type="button"
                              className="btn btn-default"
                              style={{ height: 32, fontSize: 12, color: '#DC2626', borderColor: '#FECACA' }}
                              onClick={() => handlePeerRespond(item.id, 'REJECT')}
                              disabled={isProcessing}
                            >
                              <XCircle size={14} /> Từ chối nhận
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ height: 32, fontSize: 12, backgroundColor: '#16A34A', borderColor: '#15803D' }}
                              onClick={() => handlePeerRespond(item.id, 'ACCEPT')}
                              disabled={isProcessing}
                            >
                              <CheckCircle2 size={14} /> Đồng ý nhận ca
                            </button>
                          </>
                        )}

                        {/* Hành động quản lý duyệt trực tiếp khi đang ở PENDING_PEER */}
                        {canManagerDirectApprove && (
                          <>
                            <button
                              type="button"
                              className="btn btn-default"
                              style={{ height: 32, fontSize: 12, color: '#DC2626', borderColor: '#FECACA' }}
                              onClick={() => handleManagerReview(item.id, 'REJECT')}
                              disabled={isProcessing}
                            >
                              <XCircle size={14} /> Bác bỏ
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ height: 32, fontSize: 12, backgroundColor: '#16A34A', borderColor: '#15803D' }}
                              onClick={() => handleManagerReview(item.id, 'APPROVE')}
                              disabled={isProcessing}
                              title="Phê duyệt trực tiếp chuyển giao ca mà không cần chờ đồng nghiệp đồng ý"
                            >
                              <CheckCheck size={14} /> Duyệt trực tiếp
                            </button>
                          </>
                        )}

                        {/* Hành động quản lý khi đã PEER_ACCEPTED */}
                        {canManagerAction && (
                          <>
                            <button
                              type="button"
                              className="btn btn-default"
                              style={{ height: 32, fontSize: 12, color: '#DC2626', borderColor: '#FECACA' }}
                              onClick={() => handleManagerReview(item.id, 'REJECT')}
                              disabled={isProcessing}
                            >
                              <XCircle size={14} /> Bác bỏ
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ height: 32, fontSize: 12 }}
                              onClick={() => handleManagerReview(item.id, 'APPROVE')}
                              disabled={isProcessing}
                            >
                              <Check size={14} /> Phê duyệt chuyển giao
                            </button>
                          </>
                        )}

                        {/* Người tạo tự hủy */}
                        {canCancelAction && (
                          <button
                            type="button"
                            className="btn btn-default"
                            style={{ height: 32, fontSize: 12, color: '#64748B' }}
                            onClick={() => handleCancelRequest(item.id)}
                            disabled={isProcessing}
                          >
                            <Trash2 size={13} /> Hủy đề xuất
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: '#FFFFFF',
          }}
        >
          <button type="button" className="btn btn-default" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
