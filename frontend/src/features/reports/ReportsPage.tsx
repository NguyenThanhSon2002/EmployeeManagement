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
        <h1 style={{ fontSize: 'var(--font-h1)', fontWeight: 700 }}>Trung Tâm Báo Cáo & Thống Kê (SCR-15)</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}>
          Đối soát dữ liệu công ca, phân tích tỷ lệ hoàn thành kế hoạch và xuất báo cáo CSV tiếng Việt (UTF-8 BOM)
        </p>
      </div>

      {/* Tabs navigation */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 2,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('MONTHLY')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'MONTHLY' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'MONTHLY' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <BarChart3 size={16} /> Báo Cáo Tổng Hợp Công Tháng
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SCHEDULED_VS_ACTUAL')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'SCHEDULED_VS_ACTUAL' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'SCHEDULED_VS_ACTUAL' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Clock size={16} /> Đối Chiếu Kế Hoạch vs Thực Tế
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('VIOLATIONS')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'VIOLATIONS' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'VIOLATIONS' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={16} /> Vi Phạm Đi Muộn / Về Sớm
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'MONTHLY' && <MonthlyAttendanceReport />}
      {activeTab === 'SCHEDULED_VS_ACTUAL' && <ScheduledVsActualTable />}
      {activeTab === 'VIOLATIONS' && <LateEarlyReport />}
    </div>
  );
};
