import React, { useState } from 'react';
import { useLeaveStore } from './store/useLeaveStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { MOCK_EMPLOYEES } from '@/mocks/employees.mock';
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
  const { leaves, getBalance, cancelLeave, fetchLeaves } = useLeaveStore();
  const { currentUser, currentRole } = useAuthStore();
  const { addToast } = useUIStore();

  React.useEffect(() => {
    fetchLeaves?.();
  }, [fetchLeaves]);

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
      title: 'ÄÃ£ há»§y Ä‘Æ¡n nghá»‰ phÃ©p',
      message: 'ÄÆ¡n xin nghá»‰ phÃ©p Ä‘Ã£ Ä‘Æ°á»£c chuyá»ƒn sang tráº¡ng thÃ¡i ÄÃƒ Há»¦Y.',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Quáº£n LÃ½ ÄÆ¡n Xin Nghá»‰ PhÃ©p (SCR-13)
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 2, fontSize: '13.5px' }}>
            Tiáº¿p nháº­n, tháº©m tra quá»¹ phÃ©p nÄƒm vÃ  phÃª duyá»‡t phÃ¢n cáº¥p Ä‘á»“ng bá»™ trá»±c tiáº¿p sang Báº£ng Lá»‹ch Tuáº§n.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={16} /> Ná»™p ÄÆ¡n Xin Nghá»‰ Má»›i
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
          background: 'linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%)',
          border: '1px solid #A7F3D0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#10B981',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Calendar size={22} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#047857', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Quá»¹ PhÃ©p NÄƒm 2026 â€¢ {currentUser.fullName}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Äá»‹nh má»©c: <strong>{myBalance.annualQuota} ngÃ y</strong> | ÄÃ£ nghá»‰: <strong>{myBalance.usedDays} ngÃ y</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            Sá»‘ ngÃ y phÃ©p cÃ²n láº¡i:
          </span>
          <span style={{ fontSize: 26, fontWeight: 700, color: '#047857', fontVariantNumeric: 'tabular-nums' }}>
            {myBalance.remainingDays} ngÃ y
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div
        className="card"
        style={{
          padding: '12px 18px',
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 6, backgroundColor: '#F1F5F9', padding: 3, borderRadius: 'var(--radius-md)' }}>
          {[
            { id: 'ALL', label: 'Táº¥t cáº£ Ä‘Æ¡n' },
            { id: 'SUBMITTED', label: 'Chá» duyá»‡t' },
            { id: 'APPROVED', label: 'ÄÃ£ cháº¥p thuáº­n' },
            { id: 'REJECTED', label: 'Tá»« chá»‘i' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className="btn"
              style={{
                height: 30,
                padding: '0 12px',
                fontSize: 12,
                fontWeight: statusFilter === tab.id ? 600 : 500,
                backgroundColor: statusFilter === tab.id ? '#FFFFFF' : 'transparent',
                color: statusFilter === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                boxShadow: statusFilter === tab.id ? 'var(--shadow-xs)' : 'none',
              }}
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="input-base"
            placeholder="TÃ¬m theo tÃªn nhÃ¢n viÃªn, mÃ£ hoáº·c lÃ½ do..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 34, width: '100%', height: 36, fontSize: '12.5px' }}
          />
        </div>
      </div>

      {/* Leave Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto', borderRadius: 'var(--radius-xl)' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>MÃ£ Ä‘Æ¡n</th>
              <th>NhÃ¢n viÃªn</th>
              <th>Loáº¡i phÃ©p</th>
              <th>Khoáº£ng thá»i gian</th>
              <th>Sá»‘ ngÃ y</th>
              <th>LÃ½ do</th>
              <th>Tráº¡ng thÃ¡i</th>
              <th style={{ textAlign: 'right' }}>Thao tÃ¡c</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--color-text-muted)' }}>
                  KhÃ´ng cÃ³ Ä‘Æ¡n xin nghá»‰ phÃ©p nÃ o phÃ¹ há»£p bá»™ lá»c hiá»‡n táº¡i.
                </td>
              </tr>
            ) : (
              filteredLeaves.map((leave) => {
                const emp = MOCK_EMPLOYEES.find((e) => e.id === leave.employeeId);
                const isPending = leave.status === 'SUBMITTED';

                return (
                  <tr key={leave.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        LV-{leave.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={emp?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={emp?.fullName}
                          style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', objectFit: 'cover', border: '1.5px solid var(--color-border)' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>{emp?.fullName}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{emp?.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{leave.leaveTypeName}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12.5, fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-secondary)' }}>
                        {leave.startDate} â†’ {leave.endDate}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {leave.totalDays} ngÃ y
                      </span>
                    </td>
                    <td>
                      <div style={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text-secondary)', fontSize: 12 }}>
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
                          ? 'Chá» duyá»‡t'
                          : leave.status === 'APPROVED'
                          ? 'ÄÃ£ duyá»‡t'
                          : leave.status === 'REJECTED'
                          ? 'Tá»« chá»‘i'
                          : 'ÄÃ£ há»§y'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isPending && isManagerOrAdmin ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ height: 30, padding: '0 12px', fontSize: 12, background: 'linear-gradient(180deg, #10B981 0%, #059669 100%)', borderColor: '#059669' }}
                          onClick={() => setApprovalModalLeave(leave)}
                        >
                          <CheckCircle size={13} /> Duyá»‡t Ä‘Æ¡n
                        </button>
                      ) : isPending && leave.employeeId === currentUser.id ? (
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ height: 30, padding: '0 10px', fontSize: 12 }}
                          onClick={() => handleCancel(leave.id)}
                        >
                          Há»§y Ä‘Æ¡n
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
