import React, { useState } from 'react';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';
import { useScheduleStore } from '@/features/schedule/store/useScheduleStore';
import { useAttendanceStore } from '@/features/attendance/store/useAttendanceStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { calculateShiftDurations } from '@/utils/schedule-calc.utils';
import { exportToCsv } from '@/utils/csv-exporter.utils';
import { Download, Search } from 'lucide-react';

export const ScheduledVsActualTable: React.FC = () => {
  const { assignments } = useScheduleStore();
  const { records } = useAttendanceStore();
  const { employees, branches } = useDirectoryStore();
  const { currentRole, currentUser } = useAuthStore();

  const isDirector = currentRole === 'ROLE_DIRECTOR';
  const userBranchId = currentUser?.branchId || 1;

  const [branchFilter, setBranchFilter] = useState<number | null>(!isDirector ? userBranchId : null);
  const [searchTerm, setSearchTerm] = useState('');

  const effectiveBranchId = !isDirector ? userBranchId : branchFilter;

  const comparisonData = employees.map((emp) => {
    const branch = branches.find((b) => b.id === emp.branchId);

    // Sum scheduled hours
    const empAssignments = Object.values(assignments).flat().filter(
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
      branchId: emp.branchId,
      branchName: branch?.branchName || '',
      scheduledHours,
      actualHours,
      diffHours,
      fulfillmentRate,
    };
  }).filter((item) => {
    if (effectiveBranchId && item.branchId !== effectiveBranchId) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return item.fullName.toLowerCase().includes(q) || item.employeeCode.toLowerCase().includes(q);
    }
    return true;
  });

  const handleExportCsv = () => {
    const columns = [
      { key: 'employeeCode', header: 'Mã NV' },
      { key: 'fullName', header: 'Họ và tên' },
      { key: 'branchName', header: 'Chi nhánh' },
      { key: 'scheduledHours', header: 'Giờ Kế Hoạch (h)' },
      { key: 'actualHours', header: 'Giờ Thực Tế (h)' },
      { key: 'diffHours', header: 'Chênh Lệch (h)' },
      { key: 'fulfillmentRate', header: 'Tỷ Lệ Hoàn Thành (%)' },
    ];

    const dataRows = comparisonData.map((d) => ({
      employeeCode: d.employeeCode,
      fullName: d.fullName,
      branchName: d.branchName,
      scheduledHours: d.scheduledHours.toFixed(1),
      actualHours: d.actualHours.toFixed(1),
      diffHours: (d.diffHours > 0 ? `+${d.diffHours.toFixed(1)}` : d.diffHours.toFixed(1)),
      fulfillmentRate: `${d.fulfillmentRate.toFixed(1)}%`,
    }));

    exportToCsv(
      'DoiChieu_KeHoach_ThucTe.csv',
      dataRows,
      columns,
      'Báo cáo Đối chiếu Giờ Kế Hoạch vs Giờ Thực Tế'
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
            style={{
              width: 220,
              backgroundColor: !isDirector ? '#F1F5F9' : '#FFFFFF',
              color: !isDirector ? '#475569' : 'inherit',
              cursor: !isDirector ? 'not-allowed' : 'pointer',
              borderColor: 'var(--color-border-subtle, #E2E8F0)',
            }}
            value={effectiveBranchId || ''}
            disabled={!isDirector}
            title={
              !isDirector
                ? 'Bạn chỉ có quyền xem báo cáo nhân sự thuộc chi nhánh làm việc của mình.'
                : 'Lọc báo cáo theo chi nhánh'
            }
            onChange={(e) => {
              if (!isDirector) return;
              setBranchFilter(e.target.value ? Number(e.target.value) : null);
            }}
          >
            {isDirector && <option value="">-- Tất cả cơ sở / chi nhánh --</option>}
            {(!isDirector ? branches.filter((b) => b.id === userBranchId) : branches).map((b) => (
              <option key={b.id} value={b.id}>
                {b.branchName}
              </option>
            ))}
          </select>

          <div style={{ position: 'relative', width: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              className="input"
              placeholder="Tìm theo tên hoặc mã NV..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 34, width: '100%' }}
            />
          </div>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleExportCsv}>
          <Download size={16} /> Xuất Báo Cáo Đối Chiếu
        </button>
      </div>

      {/* Comparison Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Họ và tên</th>
              <th>Chi nhánh</th>
              <th style={{ textAlign: 'right' }}>Kế hoạch (Scheduled)</th>
              <th style={{ textAlign: 'right' }}>Thực tế (Actual)</th>
              <th style={{ textAlign: 'right' }}>Chênh lệch (Diff)</th>
              <th style={{ textAlign: 'center' }}>Tỷ lệ hoàn thành</th>
              <th>Đánh giá</th>
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
                  <td>{d.branchName}</td>
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
                      <span className="badge badge-danger">Thiếu công</span>
                    ) : isOver ? (
                      <span className="badge badge-info">Vượt kế hoạch / OT</span>
                    ) : (
                      <span className="badge badge-success">Đạt chuẩn 100%</span>
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
