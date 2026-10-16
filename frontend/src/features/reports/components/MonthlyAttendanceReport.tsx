import React, { useState } from 'react';
import { MOCK_EMPLOYEES } from '@/data/mock/employees.mock';
import { MOCK_DEPARTMENTS } from '@/data/mock/departments.mock';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useAttendanceStore } from '@/store/useAttendanceStore';
import { useLeaveStore } from '@/store/useLeaveStore';
import { exportToCsv } from '@/utils/csv-exporter.utils';
import { reportService } from '@/services/reportService';
import { isMockEnabled } from '@/config/env.config';
import { Download, Search } from 'lucide-react';

export const MonthlyAttendanceReport: React.FC = () => {
  const { assignments } = useScheduleStore();
  const { records } = useAttendanceStore();
  const { leaves } = useLeaveStore();

  const [departmentFilter, setDepartmentFilter] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const reportData = MOCK_EMPLOYEES.map((emp) => {
    const dept = MOCK_DEPARTMENTS.find((d) => d.id === emp.departmentId);

    // Count assigned shifts
    const empAssignments = Object.values(assignments).filter(
      (a) => a.employeeId === emp.id && a.status === 'ASSIGNED'
    );
    const scheduledShifts = empAssignments.length;

    // Attendance stats
    const empRecords = records.filter((r) => r.employeeId === emp.id);
    const actualHours = empRecords.reduce((acc, r) => acc + (r.actualHours || 8.0), 0) || (scheduledShifts * 8.0);
    const otHours = empRecords.reduce((acc, r) => acc + (r.overtimeHours || 0), 0);
    const nightHours = empRecords.reduce((acc, r) => acc + (r.nightHours || 0), 0);
    const lateCount = empRecords.filter((r) => r.lateMinutes > 0).length;
    const earlyCount = empRecords.filter((r) => r.earlyLeaveMinutes > 0).length;

    // Leave stats
    const empApprovedLeaves = leaves.filter((l) => l.employeeId === emp.id && l.status === 'APPROVED');
    const leaveDays = empApprovedLeaves.reduce((acc, l) => acc + l.totalDays, 0);

    return {
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      departmentId: emp.departmentId,
      departmentName: dept?.departmentName || '',
      scheduledShifts,
      actualHours,
      otHours,
      nightHours,
      lateCount,
      earlyCount,
      leaveDays,
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
      { key: 'employeeCode', header: 'Mã NV' },
      { key: 'fullName', header: 'Họ và tên' },
      { key: 'departmentName', header: 'Phòng ban' },
      { key: 'scheduledShifts', header: 'Số ca kế hoạch' },
      { key: 'actualHours', header: 'Giờ làm thực tế' },
      { key: 'otHours', header: 'Giờ làm thêm (OT)' },
      { key: 'nightHours', header: 'Giờ làm đêm' },
      { key: 'lateCount', header: 'Số lần đi muộn' },
      { key: 'earlyCount', header: 'Số lần về sớm' },
      { key: 'leaveDays', header: 'Nghỉ phép (ngày)' },
    ];

    const dataRows = reportData.map((d) => ({
      employeeCode: d.employeeCode,
      fullName: d.fullName,
      departmentName: d.departmentName,
      scheduledShifts: d.scheduledShifts.toString(),
      actualHours: d.actualHours.toFixed(1),
      otHours: d.otHours.toFixed(1),
      nightHours: d.nightHours.toFixed(1),
      lateCount: d.lateCount.toString(),
      earlyCount: d.earlyCount.toString(),
      leaveDays: d.leaveDays.toString(),
    }));

    if (!isMockEnabled()) {
      reportService.downloadCsv(departmentFilter || undefined, 2026, 10).catch(() => {
        exportToCsv(
          'BaoCao_TongHopCong_Thang10_2026.csv',
          dataRows,
          columns,
          'Báo cáo Tổng hợp Công Tháng 10/2026'
        );
      });
      return;
    }

    exportToCsv(
      'BaoCao_TongHopCong_Thang10_2026.csv',
      dataRows,
      columns,
      'Báo cáo Tổng hợp Công Tháng 10/2026'
    );
  };

  const handleExportExcel = async () => {
    if (!isMockEnabled()) {
      try {
        await reportService.downloadExcel(departmentFilter || undefined, 2026, 10);
      } catch (err) {
        console.warn('Backend Excel export failed:', err);
      }
    } else {
      handleExportCsv();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filter Toolbar */}
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
            <option value="">-- Tất cả phòng ban --</option>
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
              placeholder="Tìm theo tên hoặc mã NV..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 34, width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-default" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={16} /> Xuất Excel (.xlsx)
          </button>
          <button type="button" className="btn btn-primary" onClick={handleExportCsv} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={16} /> Xuất CSV (UTF-8 BOM)
          </button>
        </div>
      </div>

      {/* Report Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Họ và tên</th>
              <th>Phòng ban</th>
              <th style={{ textAlign: 'right' }}>Số ca chuẩn</th>
              <th style={{ textAlign: 'right' }}>Giờ thực tế</th>
              <th style={{ textAlign: 'right' }}>Tăng ca (OT)</th>
              <th style={{ textAlign: 'right' }}>Giờ đêm</th>
              <th style={{ textAlign: 'center' }}>Đi muộn/sớm</th>
              <th style={{ textAlign: 'center' }}>Nghỉ phép</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((d) => (
              <tr key={d.employeeId}>
                <td>
                  <span style={{ fontWeight: 600 }}>{d.employeeCode}</span>
                </td>
                <td>{d.fullName}</td>
                <td>{d.departmentName}</td>
                <td style={{ textAlign: 'right', fontWeight: 500 }}>{d.scheduledShifts} ca</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                  {d.actualHours.toFixed(1)}h
                </td>
                <td style={{ textAlign: 'right' }}>{d.otHours > 0 ? `+${d.otHours.toFixed(1)}h` : '-'}</td>
                <td style={{ textAlign: 'right' }}>{d.nightHours > 0 ? `${d.nightHours.toFixed(1)}h` : '-'}</td>
                <td style={{ textAlign: 'center' }}>
                  {d.lateCount > 0 || d.earlyCount > 0 ? (
                    <span style={{ color: '#cf1322', fontWeight: 600 }}>
                      {d.lateCount + d.earlyCount} lần
                    </span>
                  ) : (
                    <span style={{ color: '#52c41a' }}>0</span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {d.leaveDays > 0 ? (
                    <span className="badge badge-success">{d.leaveDays} ngày</span>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
