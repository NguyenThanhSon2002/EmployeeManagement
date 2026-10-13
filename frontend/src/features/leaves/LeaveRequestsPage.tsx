import React, { useState } from 'react';
import { useLeaveStore } from '@/store/useLeaveStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { MOCK_EMPLOYEES } from '@/data/mock/employees.mock';
import type { LeaveRequest } from '@/types/domain.types';
import { LeaveRequestModal } from './components/LeaveRequestModal';
import { LeaveApprovalModal } from './components/LeaveApprovalModal';
import {
  Plus,
  Calendar,
  Search,
  CheckCircle,
} from 'lucide-react';

export const LeaveRequestsPage: React.FC = () => {
  const { leaves, getBalance, cancelLeave } = useLeaveStore();
  const { currentUser, currentRole } = useAuthStore();
  const { addToast } = useUIStore();

  const isManagerOrAdmin = currentRole === 'ROLE_ADMIN' || currentRole === 'ROLE_HR_MANAGER' || currentRole === 'ROLE_DEPT_MANAGER';

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [approvalModalLeave, setApprovalModalLeave] = useState<LeaveRequest | null>(null);

  const myBalance = getBalance(currentUser.id);

  const filteredLeaves = leaves.filter((leave) => {
    if (statusFilter !== 'ALL' && leave.status !== statusFilter) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const emp = MOCK_EMPLOYEES.find((e) => e.id === leave.employeeId);
      const matchName = emp?.fullName.toLowerCase().includes(q);
      const matchCode = emp?.employeeCode.toLowerCase().includes(q);
      const matchReason = leave.reason.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchReason) return false;
    }

    return true;
  });

  const handleCancel = (leaveId: number) => {
    cancelLeave(leaveId);
    addToast({
      type: 'info',
      title: 'Đã hủy đơn nghỉ phép',
      message: 'Đơn xin nghỉ phép đã được chuyển sang trạng thái ĐÃ HỦY.',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-h1)', fontWeight: 700 }}>Quản Lý Đơn Xin Nghỉ Phép (SCR-13)</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Tiếp nhận, thẩm tra quỹ phép năm và phê duyệt phân cấp đồng bộ trực tiếp sang Bảng Lịch Tuần
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={16} /> Nộp Đơn Xin Nghỉ
        </button>
      </div>

      {/* Leave Balance Summary Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          backgroundColor: '#f6ffed',
          border: '1px solid #b7eb8f',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: '#52c41a',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={22} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#389e0d', fontWeight: 600 }}>
              QUỸ PHÉP NĂM 2026 • {currentUser.fullName}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Định mức: <strong>{myBalance.annualQuota} ngày</strong> | Đã nghỉ: <strong>{myBalance.usedDays} ngày</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Số ngày phép còn lại:</span>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#389e0d' }}>
            {myBalance.remainingDays} ngày
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'ALL', label: 'Tất cả đơn' },
            { id: 'SUBMITTED', label: 'Chờ duyệt' },
            { id: 'APPROVED', label: 'Đã chấp thuận' },
            { id: 'REJECTED', label: 'Từ chối' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`btn ${statusFilter === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ height: 32, padding: '0 12px', fontSize: 13 }}
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Tìm theo tên nhân viên, mã hoặc lý do..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 34, width: '100%' }}
          />
        </div>
      </div>

      {/* Leave Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Nhân viên</th>
              <th>Loại phép</th>
              <th>Khoảng thời gian</th>
              <th>Số ngày</th>
              <th>Lý do</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-secondary)' }}>
                  Không có đơn xin nghỉ phép nào phù hợp bộ lọc.
                </td>
              </tr>
            ) : (
              filteredLeaves.map((leave) => {
                const emp = MOCK_EMPLOYEES.find((e) => e.id === leave.employeeId);
                const isPending = leave.status === 'SUBMITTED';

                return (
                  <tr key={leave.id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>LV-{leave.id}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img
                          src={emp?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={emp?.fullName}
                          style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 500 }}>{emp?.fullName}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{emp?.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{leave.leaveTypeName}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>
                        {leave.startDate} 👉 {leave.endDate}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                        {leave.totalDays} ngày
                      </span>
                    </td>
                    <td>
                      <div style={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {leave.reason}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          isPending
                            ? 'badge-warning'
                            : leave.status === 'APPROVED'
                            ? 'badge-success'
                            : leave.status === 'REJECTED'
                            ? 'badge-danger'
                            : 'badge-default'
                        }`}
                      >
                        <span className="badge-dot" />
                        {isPending
                          ? 'Chờ duyệt'
                          : leave.status === 'APPROVED'
                          ? 'Đã duyệt'
                          : leave.status === 'REJECTED'
                          ? 'Từ chối'
                          : 'Đã hủy'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isPending && isManagerOrAdmin ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ height: 28, padding: '0 10px', fontSize: 12, backgroundColor: '#52c41a' }}
                          onClick={() => setApprovalModalLeave(leave)}
                        >
                          <CheckCircle size={13} /> Duyệt đơn
                        </button>
                      ) : isPending && leave.employeeId === currentUser.id ? (
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ height: 28, padding: '0 10px', fontSize: 12 }}
                          onClick={() => handleCancel(leave.id)}
                        >
                          Hủy đơn
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Creation Modal */}
      <LeaveRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Approval Modal */}
      <LeaveApprovalModal
        isOpen={!!approvalModalLeave}
        onClose={() => setApprovalModalLeave(null)}
        leaveRequest={approvalModalLeave}
      />
    </div>
  );
};
