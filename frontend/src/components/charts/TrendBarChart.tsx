import React, { useState, useEffect } from 'react';
import { dashboardService, type AttendanceTrendItem } from '@/features/dashboard/api/dashboardService';
import { isMockEnabled } from '@/config/env.config';

interface TrendBarChartProps {
  branchId?: number;
}

const DEFAULT_DAYS: AttendanceTrendItem[] = [
  { date: '2026-10-21', day_name: 'T2', on_time_percent: 88, late_percent: 8, absent_percent: 4 },
  { date: '2026-10-22', day_name: 'T3', on_time_percent: 92, late_percent: 5, absent_percent: 3 },
  { date: '2026-10-23', day_name: 'T4', on_time_percent: 90, late_percent: 6, absent_percent: 4 },
  { date: '2026-10-24', day_name: 'T5', on_time_percent: 85, late_percent: 10, absent_percent: 5 },
  { date: '2026-10-25', day_name: 'T6', on_time_percent: 87, late_percent: 8, absent_percent: 5 },
  { date: '2026-10-26', day_name: 'T7', on_time_percent: 94, late_percent: 4, absent_percent: 2 },
  { date: '2026-10-27', day_name: 'CN', on_time_percent: 96, late_percent: 2, absent_percent: 2 },
];

export const TrendBarChart: React.FC<TrendBarChartProps> = ({ branchId }) => {
  const [data, setData] = useState<AttendanceTrendItem[]>(DEFAULT_DAYS);

  useEffect(() => {
    if (isMockEnabled()) return;

    let isMounted = true;
    dashboardService
      .getAttendanceTrends(branchId)
      .then((res) => {
        if (isMounted && res && res.length > 0) {
          setData(res);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch attendance trends:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [branchId]);

  const chartHeight = 180;
  const chartWidth = 460;
  const barWidth = 36;
  const gap = 24;
  const startX = 40;

  return (
    <div className="card" style={{ padding: '16px 20px', flex: 1, minWidth: 320 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 'var(--font-h3)', fontWeight: 600 }}>
          Xu Hướng Đi Làm 7 Ngày Gần Nhất
        </h3>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--color-text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#52c41a' }} />
            <span>Đúng giờ</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#faad14' }} />
            <span>Đi muộn</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#ff4d4f' }} />
            <span>Vắng mặt</span>
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight + 35}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Biểu đồ tỷ lệ chuyên cần 7 ngày qua"
      >
        {/* Horizontal gridlines */}
        {[0, 25, 50, 75, 100].map((level) => {
          const y = chartHeight - (level / 100) * chartHeight;
          return (
            <g key={level}>
              <line
                x1={30}
                y1={y}
                x2={chartWidth - 10}
                y2={y}
                stroke="var(--color-border-subtle)"
                strokeDasharray="3 3"
              />
              <text
                x={24}
                y={y + 4}
                fontSize={10}
                fill="var(--color-text-muted)"
                textAnchor="end"
              >
                {level}%
              </text>
            </g>
          );
        })}

        {/* Stacked Bars */}
        {data.map((d, index) => {
          const x = startX + index * (barWidth + gap);

          const onTimeH = (d.on_time_percent / 100) * chartHeight;
          const lateH = (d.late_percent / 100) * chartHeight;
          const absentH = (d.absent_percent / 100) * chartHeight;

          const onTimeY = chartHeight - onTimeH;
          const lateY = onTimeY - lateH;
          const absentY = lateY - absentH;

          return (
            <g key={`${d.date}_${d.day_name}`}>
              {/* On-time bar segment */}
              <rect
                x={x}
                y={onTimeY}
                width={barWidth}
                height={onTimeH}
                fill="#52c41a"
                rx={2}
              >
                <title>{`${d.day_name} (${d.date}): ${d.on_time_percent}% Đúng giờ`}</title>
              </rect>

              {/* Late bar segment */}
              <rect
                x={x}
                y={lateY}
                width={barWidth}
                height={lateH}
                fill="#faad14"
              >
                <title>{`${d.day_name} (${d.date}): ${d.late_percent}% Đi muộn`}</title>
              </rect>

              {/* Absent bar segment */}
              <rect
                x={x}
                y={absentY}
                width={barWidth}
                height={absentH}
                fill="#ff4d4f"
                rx={2}
              >
                <title>{`${d.day_name} (${d.date}): ${d.absent_percent}% Vắng mặt`}</title>
              </rect>

              {/* Day label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 18}
                fontSize={11}
                fontWeight={600}
                fill="var(--color-text-secondary)"
                textAnchor="middle"
              >
                {d.day_name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
