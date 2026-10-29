import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import type { ShiftSwapItem } from '../types/swap.types';
import { shiftSwapService } from '../api/shiftSwapService';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { useUIStore } from '@/shared/store/useUIStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useScheduleStore } from '../store/useScheduleStore';
import {
  ArrowLeftRight,
  ArrowRight,
  X,
  Check,
  CheckCheck,
  Filter,
  Calendar,
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
  const currentStartDate = useScheduleStore((s) => s.currentStartDate);
  const defaultMonth = useMemo(() => {
    return currentStartDate ? currentStartDate.substring(0, 7) : format(new Date(), 'yyyy-MM');
  }, [currentStartDate]);

  // Bộ lọc theo tháng (định dạng YYYY-MM hoặc 'ALL')
  const [selectedMonth, setSelectedMonth] = useState<string>(() => defaultMonth);

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

  useEffect(() => {
    if (isOpen) {
      setSelectedMonth((prev) => prev || defaultMonth);
    }
  }, [isOpen, defaultMonth]);

  if (!isOpen) return null;

  // Lọc theo Tab người dùng & Tháng
  const displayItems = items.filter((item) => {
    if (activeTab === 'INBOX') {
      if (item.targetId !== currentEmpId) return false;
    } else if (activeTab === 'SENT') {
      if (item.requesterId !== currentEmpId) return false;
    } else {
      // Tab MANAGER: Áp dụng managerSubFilter
      if (managerSubFilter === 'PENDING') {
        if (item.status !== 'PENDING_PEER' && item.status !== 'PEER_ACCEPTED') return false;
      } else if (managerSubFilter === 'APPROVED') {
        if (item.status !== 'APPROVED') return false;
      } else if (managerSubFilter === 'REJECTED') {
        if (item.status !== 'REJECTED' && item.status !== 'PEER_REJECTED' && item.status !== 'CANCELLED') return false;
      }
    }

    // Lọc theo tháng
    if (selectedMonth && selectedMonth !== 'ALL') {
      const itemMonth = item.requesterWorkDate
        ? item.requesterWorkDate.substring(0, 7)
        : (item.createdAt ? item.createdAt.substring(0, 7) : '');
      if (itemMonth !== selectedMonth) return false;
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

        {/* Sub-filter cho trạng thái & tháng */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '8px 20px',
            backgroundColor: '#F1F5F9',
            borderBottom: '1px solid #E2E8F0',
            flexWrap: 'wrap',
          }}
        >
          {activeTab === 'MANAGER' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
              <Filter size={13} />
              <span>{activeTab === 'INBOX' ? 'Yêu cầu đồng nghiệp gửi đến bạn' : 'Yêu cầu nhường ca bạn đã gửi'}</span>
            </div>
          )}

          {/* Ô lọc theo tháng */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={13} color="#475569" /> Lọc theo tháng:
            </span>
            <input
              type="month"
              value={selectedMonth === 'ALL' ? '' : selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value || 'ALL')}
              style={{
                height: 28,
                padding: '2px 8px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#1E293B',
                cursor: 'pointer',
                outline: 'none',
              }}
              title="Chọn tháng để lọc danh sách ca làm việc"
            />
            {selectedMonth && selectedMonth !== 'ALL' ? (
              <button
                type="button"
                onClick={() => setSelectedMonth('ALL')}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  fontSize: 11.5,
                  fontWeight: 500,
                  backgroundColor: '#FFFFFF',
                  color: '#64748B',
                  cursor: 'pointer',
                }}
                title="Xem toàn bộ yêu cầu của tất cả các tháng"
              >
                Tất cả tháng
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedMonth(defaultMonth)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid #93C5FD',
                  fontSize: 11.5,
                  fontWeight: 600,
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  cursor: 'pointer',
                }}
                title="Quay lại lọc theo tháng của lịch hiện tại"
              >
                Tháng này
              </button>
            )}
          </div>
        </div>

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
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>
                {selectedMonth && selectedMonth !== 'ALL'
                  ? `Không có yêu cầu nhường ca nào trong tháng ${selectedMonth.split('-')[1]}/${selectedMonth.split('-')[0]}.`
                  : 'Không có yêu cầu nhường ca nào trong mục này.'}
              </span>
              {selectedMonth && selectedMonth !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedMonth('ALL')}
                  style={{
                    marginTop: 4,
                    padding: '4px 12px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#2563EB',
                    cursor: 'pointer',
                  }}
                >
                  Xem tất cả các tháng
                </button>
              )}
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
                        {(() => {
                          if (!item.requesterWorkDate || !item.requesterStartTime) return null;
                          const shiftStart = new Date(`${item.requesterWorkDate}T${item.requesterStartTime}`).getTime();
                          const createdTime = item.createdAt ? new Date(item.createdAt).getTime() : Date.now();
                          const hoursUntil = (shiftStart - createdTime) / (1000 * 60 * 60);
                          if (hoursUntil < 24) {
                            return (
                              <span style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#B45309',
                                backgroundColor: '#FEF3C7',
                                border: '1px solid #FCD34D',
                                padding: '1px 8px',
                                borderRadius: 12
                              }}>
                                ⚠️ Sát giờ ({Math.max(0, Math.round(hoursUntil))}h)
                              </span>
                            );
                          }
                          return null;
                        })()}
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
