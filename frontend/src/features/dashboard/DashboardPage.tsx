import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { TrendBarChart } from '@/components/charts/TrendBarChart';
import { QuickAttendanceCard } from './components/QuickAttendanceCard';
import { PendingApprovalsWidget } from './components/PendingApprovalsWidget';
import { Users, UserCheck, Clock, Palmtree, Calendar } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { currentRole } = useAuthStore();

  const isEmployeeRole = currentRole === 'ROLE_EMPLOYEE';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: 'var(--font-h1)', fontWeight: 600 }}>
          {isEmployeeRole
            ? 'Bảng Điều Khiển Cá Nhân - Điểm Danh & Lịch Ca'
            : 'Tổng Quan Hệ Thống - Phòng Vận Hành Dịch Vụ'}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 4, fontSize: 'var(--font-body)' }}>
          Cập nhật tình hình quân số thực tế, lịch trực hôm nay và đơn từ đang chờ phê duyệt.
        </p>
      </div>

      {/* 4 KPI Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-md)',
        }}
      >
        {/* KPI 1 */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-info-bg)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              TỔNG QUÂN SỐ
            </div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>45 người</div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#f6ffed',
              color: '#52c41a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              ĐANG CÓ MẶT
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#389e0d' }}>38 người</div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#fffbe6',
              color: '#faad14',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              ĐI MUỘN / VỀ SỚM
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#d46b08' }}>2 người</div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#fff0f6',
              color: '#eb2f96',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Palmtree size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              ĐANG NGHỈ PHÉP
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#c41d7f' }}>3 người</div>
          </div>
        </div>
      </div>

      {/* Middle Row: Trend Chart & Quick Attendance */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <TrendBarChart />
        <QuickAttendanceCard />
      </div>

      {/* Bottom Row: Pending Approvals Widget (if Admin or Manager) */}
      {!isEmployeeRole && <PendingApprovalsWidget />}

      {/* Today's Shift schedule reminder for Employee */}
      {isEmployeeRole && (
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Calendar size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: 'var(--font-h3)', fontWeight: 600 }}>Ca Trực Tiếp Theo Của Bạn</h3>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div
              style={{
                flex: 1,
                minWidth: 200,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--shift-morning-bg)',
                border: '1px solid var(--shift-morning-border)',
                color: 'var(--shift-morning-text)',
              }}
            >
              <div style={{ fontWeight: 600 }}>Hôm nay (Thứ Ba)</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Ca Sáng: 08:00 - 17:00 (8.0h)</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>Trực vận hành cổng thanh toán</div>
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 200,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--shift-afternoon-bg)',
                border: '1px solid var(--shift-afternoon-border)',
                color: 'var(--shift-afternoon-text)',
              }}
            >
              <div style={{ fontWeight: 600 }}>Ngày mai (Thứ Tư)</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Ca Chiều: 14:00 - 22:00 (8.0h)</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>Trực xử lý sự cố khách hàng</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
