import React, { useState } from 'react';
import { MOCK_EMPLOYEES } from '@/mocks/employees.mock';
import { MOCK_DEPARTMENTS } from '@/mocks/departments.mock';
import { useScheduleStore } from '@/features/schedule/store/useScheduleStore';
import { useAttendanceStore } from '@/features/attendance/store/useAttendanceStore';
import { calculateShiftDurations } from '@/utils/schedule-calc.utils';
import { exportToCsv } from '@/utils/csv-exporter.utils';
import { Download, Search } from 'lucide-react';

export const ScheduledVsActualTable: React.FC = () => {
  const { assignments } = useScheduleStore();
  const { records } = useAttendanceStore();

  const [departmentFilter, setDepartmentFilter] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const comparisonData = MOCK_EMPLOYEES.map((emp) => {
    const dept = MOCK_DEPARTMENTS.find((d) => d.id === emp.departmentId);

    // Sum scheduled hours
    const empAssignments = Object.values(assignments).filter(
      (a) => a.employeeId === emp.id && a.status === 'ASSIGNED'
    );
    let scheduledHours = 0;
    for (const a of empAssignments) {
      const { netHours } = calculateShiftDurations(
        a.snapshotStartTime,
        a.snapshotEndTime,
        a.snapshotBreakMinutes,
        a.snapshotCrossMidnight
      );
      scheduledHours += netHours;
    }

    // Default to at least 40h baseline if no assignments in week
    if (scheduledHours === 0) scheduledHours = 40.0;

    // Actual hours
    const empRecords = records.filter((r) => r.employeeId === emp.id);
    const actualHours = empRecords.reduce((acc, r) => acc + (r.actualHours || 8.0), 0) || scheduledHours;

    const diffHours = actualHours - scheduledHours;
    const fulfillmentRate = scheduledHours > 0 ? (actualHours / scheduledHours) * 100 : 100;

    return {
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      departmentId: emp.departmentId,
      departmentName: dept?.departmentName || '',
      scheduledHours,
      actualHours,
      diffHours,
      fulfillmentRate,
    };
  }).filter((item) => {
    if (departmentFilter && item.departmentId !== departmentFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return item.fullName.toLowerCase().includes(q) || item.employeeCode.toLowerCase().includes(q);
    }
    return true;
  });

  const handleExportCsv = () => {
    const columns = [
      { key: 'employeeCode', header: 'MÃ£ NV' },
      { key: 'fullName', header: 'Há» vÃ  tÃªn' },
      { key: 'departmentName', header: 'PhÃ²ng ban' },
      { key: 'scheduledHours', header: 'Giá» Káº¿ Hoáº¡ch (h)' },
      { key: 'actualHours', header: 'Giá» Thá»±c Táº¿ (h)' },
      { key: 'diffHours', header: 'ChÃªnh Lá»‡ch (h)' },
      { key: 'fulfillmentRate', header: 'Tá»· Lá»‡ HoÃ n ThÃ nh (%)' },
    ];

    const dataRows = comparisonData.map((d) => ({
      employeeCode: d.employeeCode,
      fullName: d.fullName,
      departmentName: d.departmentName,
      scheduledHours: d.scheduledHours.toFixed(1),
      actualHours: d.actualHours.toFixed(1),
      diffHours: (d.diffHours > 0 ? `+${d.diffHours.toFixed(1)}` : d.diffHours.toFixed(1)),
      fulfillmentRate: `${d.fulfillmentRate.toFixed(1)}%`,
    }));

    exportToCsv(
      'DoiChieu_KeHoach_ThucTe.csv',
      dataRows,
      columns,
      'BÃ¡o cÃ¡o Äá»‘i chiáº¿u Giá» Káº¿ Hoáº¡ch vs Giá» Thá»±c Táº¿'
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filter toolbar */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="input"
            style={{ width: 200 }}
            value={departmentFilter || ''}
            onChange={(e) => setDepartmentFilter(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">-- Táº¥t cáº£ phÃ²ng ban --</option>
            {MOCK_DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.departmentName}
              </option>
            ))}
          </select>

          <div style={{ position: 'relative', width: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              className="input"
              placeholder="TÃ¬m theo tÃªn hoáº·c mÃ£ NV..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 34, width: '100%' }}
            />
          </div>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleExportCsv}>
          <Download size={16} /> Xuáº¥t CSV Äá»‘i Chiáº¿u (UTF-8 BOM)
        </button>
      </div>

      {/* Comparison Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>MÃ£ NV</th>
              <th>Há» vÃ  tÃªn</th>
              <th>PhÃ²ng ban</th>
              <th style={{ textAlign: 'right' }}>Káº¿ hoáº¡ch (Scheduled)</th>
              <th style={{ textAlign: 'right' }}>Thá»±c táº¿ (Actual)</th>
              <th style={{ textAlign: 'right' }}>ChÃªnh lá»‡ch (Diff)</th>
              <th style={{ textAlign: 'center' }}>Tá»· lá»‡ hoÃ n thÃ nh</th>
              <th>ÄÃ¡nh giÃ¡</th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((d) => {
              const isUnder = d.diffHours < -1.0;
              const isOver = d.diffHours > 1.0;

              return (
                <tr key={d.employeeId}>
                  <td>
                    <span style={{ fontWeight: 600 }}>{d.employeeCode}</span>
                  </td>
                  <td>{d.fullName}</td>
                  <td>{d.departmentName}</td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>{d.scheduledHours.toFixed(1)}h</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {d.actualHours.toFixed(1)}h
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    <span style={{ color: isUnder ? '#cf1322' : isOver ? '#0958d9' : '#389e0d' }}>
                      {d.diffHours > 0 ? `+${d.diffHours.toFixed(1)}h` : `${d.diffHours.toFixed(1)}h`}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          width: 60,
                          height: 8,
                          backgroundColor: 'var(--color-border)',
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, d.fulfillmentRate)}%`,
                            height: '100%',
                            backgroundColor: isUnder ? '#f5222d' : isOver ? '#1890ff' : '#52c41a',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>
                        {d.fulfillmentRate.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td>
                    {isUnder ? (
                      <span className="badge badge-danger">Thiáº¿u cÃ´ng</span>
                    ) : isOver ? (
                      <span className="badge badge-info">VÆ°á»£t káº¿ hoáº¡ch / OT</span>
                    ) : (
                      <span className="badge badge-success">Äáº¡t chuáº©n 100%</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
