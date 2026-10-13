import React from 'react';

interface DayAttendanceData {
  dayName: string;
  onTimePercent: number;
  latePercent: number;
  absentPercent: number;
}

const SAMPLE_7DAYS: DayAttendanceData[] = [
  { dayName: 'T2', onTimePercent: 88, latePercent: 8, absentPercent: 4 },
  { dayName: 'T3', onTimePercent: 92, latePercent: 5, absentPercent: 3 },
  { dayName: 'T4', onTimePercent: 90, latePercent: 6, absentPercent: 4 },
  { dayName: 'T5', onTimePercent: 85, latePercent: 10, absentPercent: 5 },
  { dayName: 'T6', onTimePercent: 87, latePercent: 8, absentPercent: 5 },
  { dayName: 'T7', onTimePercent: 94, latePercent: 4, absentPercent: 2 },
  { dayName: 'CN', onTimePercent: 96, latePercent: 2, absentPercent: 2 },
];

export const TrendBarChart: React.FC = () => {
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
        {SAMPLE_7DAYS.map((d, index) => {
          const x = startX + index * (barWidth + gap);

          const onTimeH = (d.onTimePercent / 100) * chartHeight;
          const lateH = (d.latePercent / 100) * chartHeight;
          const absentH = (d.absentPercent / 100) * chartHeight;

          const onTimeY = chartHeight - onTimeH;
          const lateY = onTimeY - lateH;
          const absentY = lateY - absentH;

          return (
            <g key={d.dayName}>
              {/* On-time bar segment */}
              <rect
                x={x}
                y={onTimeY}
                width={barWidth}
                height={onTimeH}
                fill="#52c41a"
                rx={2}
              >
                <title>{`${d.dayName}: ${d.onTimePercent}% Đúng giờ`}</title>
              </rect>

              {/* Late bar segment */}
              <rect
                x={x}
                y={lateY}
                width={barWidth}
                height={lateH}
                fill="#faad14"
              >
                <title>{`${d.dayName}: ${d.latePercent}% Đi muộn`}</title>
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
                <title>{`${d.dayName}: ${d.absentPercent}% Vắng mặt`}</title>
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
                {d.dayName}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
