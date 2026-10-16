import React from 'react';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { TrendBarChart } from '@/components/charts/TrendBarChart';
import { QuickAttendanceCard } from './components/QuickAttendanceCard';
import { PendingApprovalsWidget } from './components/PendingApprovalsWidget';
import { Users, UserCheck, Clock, Palmtree, Calendar, Sparkles } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { currentUser, currentRole } = useAuthStore();

  const isEmployeeRole = currentRole === 'ROLE_EMPLOYEE';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)',
          border: '1px solid #BFDBFE',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Xin chào, {currentUser.fullName}! 👋
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#DBEAFE',
                color: '#1D4ED8',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <Sparkles size={11} color="#F59E0B" />
              {isEmployeeRole ? 'Giao Diện Nhân Viên' : 'Trung Tâm Chỉ Huy Vận Hành'}
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 4, fontSize: '13.5px' }}>
            {isEmployeeRole
              ? 'Theo dõi nhanh giờ công, trạng thái điểm danh và lịch phân ca tuần này của bạn.'
              : 'Giám sát quân số thực tế tại ca làm việc, đối soát vi phạm đi muộn và xử lý phê duyệt đơn từ.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="pulse-dot-green" />
            <span>38/45 Nhân sự đang trực</span>
          </div>
        </div>
      </div>

      {/* 4 Executive KPI Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-md)',
        }}
      >
        {/* KPI 1: Tổng Quân Số */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tổng Quân Số Bộ Phận
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              45 <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>người</span>
            </div>
            <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 2 }}>
              100% hợp đồng hoạt động
            </div>
          </div>
        </div>

        {/* KPI 2: Đang Có Mặt */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#ECFDF5',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Đang Có Mặt / Check-in
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#047857', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              38 <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>người</span>
            </div>
            <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 2 }}>
              84.4% tỷ lệ hiện diện
            </div>
          </div>
        </div>

        {/* KPI 3: Đi Muộn / Về Sớm */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#FFFBEB',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Đi Muộn / Về Sớm
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#B45309', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              2 <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>người</span>
            </div>
            <div style={{ fontSize: 11, color: '#B45309', fontWeight: 600, marginTop: 2 }}>
              Giảm 1 trường hợp so với hôm qua
            </div>
          </div>
        </div>

        {/* KPI 4: Đang Nghỉ Phép */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#FDF2F8',
              color: '#EC4899',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Palmtree size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Đang Nghỉ Phép Hợp Lệ
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#BE185D', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              3 <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>người</span>
            </div>
            <div style={{ fontSize: 11, color: '#BE185D', fontWeight: 600, marginTop: 2 }}>
              Đã duyệt quỹ phép năm
            </div>
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
        <div className="card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Calendar size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: 'var(--font-h3)', fontWeight: 600 }}>Ca Trực Tiếp Theo Của Bạn</h3>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <div
              style={{
                flex: 1,
                minWidth: 220,
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--shift-morning-bg)',
                border: '1px solid var(--shift-morning-border)',
                color: 'var(--shift-morning-text)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14 }}>Hôm nay (Thứ Ba)</div>
              <div style={{ fontSize: 13.5, marginTop: 4, fontWeight: 600 }}>
                Ca Sáng Tiêu Chuẩn: 08:00 — 17:00 (8.0h)
              </div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                Trực vận hành cổng thanh toán dịch vụ & CSKH
              </div>
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 220,
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--shift-afternoon-bg)',
                border: '1px solid var(--shift-afternoon-border)',
                color: 'var(--shift-afternoon-text)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14 }}>Ngày mai (Thứ Tư)</div>
              <div style={{ fontSize: 13.5, marginTop: 4, fontWeight: 600 }}>
                Ca Chiều: 14:00 — 22:00 (8.0h)
              </div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                Trực xử lý sự cố khách hàng & đối soát giao dịch
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
