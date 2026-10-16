import React, { useState } from 'react';
import { MonthlyAttendanceReport } from './components/MonthlyAttendanceReport';
import { ScheduledVsActualTable } from './components/ScheduledVsActualTable';
import { LateEarlyReport } from './components/LateEarlyReport';
import { BarChart3, Clock, AlertTriangle } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MONTHLY' | 'SCHEDULED_VS_ACTUAL' | 'VIOLATIONS'>('MONTHLY');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Trung Tâm Báo Cáo & Thống Kê (SCR-15)
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 2, fontSize: '13.5px' }}>
          Đối soát dữ liệu công ca, phân tích tỷ lệ hoàn thành kế hoạch và xuất báo cáo CSV tiếng Việt (UTF-8 BOM).
        </p>
      </div>

      {/* Modern Tabs Navigation Bar */}
      <div
        className="card"
        style={{
          padding: '6px',
          display: 'inline-flex',
          gap: 6,
          backgroundColor: '#F1F5F9',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          alignSelf: 'flex-start',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('MONTHLY')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'MONTHLY' ? 'var(--color-surface)' : 'transparent',
            color: activeTab === 'MONTHLY' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderRadius: 'var(--radius-md)',
            boxShadow: activeTab === 'MONTHLY' ? 'var(--shadow-xs)' : 'none',
            fontWeight: activeTab === 'MONTHLY' ? 600 : 500,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all var(--transition-fast)',
          }}
        >
          <BarChart3 size={15} /> Báo Cáo Tổng Hợp Công Tháng
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SCHEDULED_VS_ACTUAL')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'SCHEDULED_VS_ACTUAL' ? 'var(--color-surface)' : 'transparent',
            color: activeTab === 'SCHEDULED_VS_ACTUAL' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderRadius: 'var(--radius-md)',
            boxShadow: activeTab === 'SCHEDULED_VS_ACTUAL' ? 'var(--shadow-xs)' : 'none',
            fontWeight: activeTab === 'SCHEDULED_VS_ACTUAL' ? 600 : 500,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all var(--transition-fast)',
          }}
        >
          <Clock size={15} /> Đối Chiếu Kế Hoạch vs Thực Tế
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('VIOLATIONS')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'VIOLATIONS' ? 'var(--color-surface)' : 'transparent',
            color: activeTab === 'VIOLATIONS' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderRadius: 'var(--radius-md)',
            boxShadow: activeTab === 'VIOLATIONS' ? 'var(--shadow-xs)' : 'none',
            fontWeight: activeTab === 'VIOLATIONS' ? 600 : 500,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all var(--transition-fast)',
          }}
        >
          <AlertTriangle size={15} /> Vi Phạm Đi Muộn / Về Sớm
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'MONTHLY' && <MonthlyAttendanceReport />}
      {activeTab === 'SCHEDULED_VS_ACTUAL' && <ScheduledVsActualTable />}
      {activeTab === 'VIOLATIONS' && <LateEarlyReport />}
    </div>
  );
};
