import React, { useState, useEffect } from 'react';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { exportToCsv } from '@/utils/csv-exporter.utils';
import { reportService, type AttendanceSummary } from '../api/reportService';
import { isMockEnabled } from '@/config/env.config';
import { Download, Search, Calendar, Loader2 } from 'lucide-react';

export const MonthlyAttendanceReport: React.FC = () => {
  const { employees, branches } = useDirectoryStore();
  const { currentRole, currentUser } = useAuthStore();

  const isDirector = currentRole === 'ROLE_DIRECTOR';
  const userBranchId = currentUser?.branchId || 1;

  const [branchFilter, setBranchFilter] = useState<number | null>(!isDirector ? userBranchId : null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);

  const [summaryList, setSummaryList] = useState<AttendanceSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const effectiveBranchId = !isDirector ? userBranchId : branchFilter;

  // Fetch real summary data from backend
  useEffect(() => {
    if (isMockEnabled()) return;

    let isMounted = true;
    setIsLoading(true);
    reportService
      .getAttendanceSummary(effectiveBranchId || undefined, selectedYear, selectedMonth)
      .then((res) => {
        if (isMounted) {
          setSummaryList(res || []);
        }
      })
      .catch((err) => {
        console.warn('Backend attendance-summary failed, keeping local fallback:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveBranchId, selectedYear, selectedMonth]);

  // Combine real backend summary with directory employee list
  const reportData = (summaryList.length > 0 ? summaryList.map((item) => {
    return {
      employeeId: item.employee_id,
      employeeCode: item.employee_code,
      fullName: item.full_name,
      branchName: item.branch_name,
      workingDays: item.total_working_days || 0,
      actualHours: item.total_actual_hours || 0,
      regularHours: item.total_regular_hours || 0,
      otHours: item.total_overtime_hours || 0,
      nightHours: item.total_night_hours || 0,
      lateCount: item.late_count || 0,
      earlyCount: item.early_leave_count || 0,
    };
  }) : employees.map((emp) => {
    const branch = branches.find((b) => b.id === emp.branchId);
    return {
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      branchName: branch?.branchName || '',
      workingDays: 0,
      actualHours: 0,
      regularHours: 0,
      otHours: 0,
      nightHours: 0,
      lateCount: 0,
      earlyCount: 0,
    };
  })).filter((item) => {
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
      { key: 'workingDays', header: 'Số ngày làm việc' },
      { key: 'actualHours', header: 'Giờ làm thực tế' },
      { key: 'regularHours', header: 'Giờ tiêu chuẩn' },
      { key: 'otHours', header: 'Giờ làm thêm (OT)' },
      { key: 'nightHours', header: 'Giờ làm đêm' },
      { key: 'lateCount', header: 'Số lần đi muộn' },
      { key: 'earlyCount', header: 'Số lần về sớm' },
    ];

    const dataRows = reportData.map((d) => ({
      employeeCode: d.employeeCode,
      fullName: d.fullName,
      branchName: d.branchName,
      workingDays: d.workingDays.toString(),
      actualHours: d.actualHours.toFixed(1),
      regularHours: d.regularHours.toFixed(1),
      otHours: d.otHours.toFixed(1),
      nightHours: d.nightHours.toFixed(1),
      lateCount: d.lateCount.toString(),
      earlyCount: d.earlyCount.toString(),
    }));

    if (!isMockEnabled()) {
      reportService.downloadCsv(effectiveBranchId || undefined, selectedYear, selectedMonth).catch(() => {
        exportToCsv(
          `BaoCao_TongHopCong_Thang${selectedMonth}_${selectedYear}.csv`,
          dataRows,
          columns,
          `Báo cáo Tổng hợp Công Tháng ${selectedMonth}/${selectedYear}`
        );
      });
      return;
    }

    exportToCsv(
      `BaoCao_TongHopCong_Thang${selectedMonth}_${selectedYear}.csv`,
      dataRows,
      columns,
      `Báo cáo Tổng hợp Công Tháng ${selectedMonth}/${selectedYear}`
    );
  };

  const handleExportExcel = async () => {
    if (!isMockEnabled()) {
      try {
        await reportService.downloadExcel(effectiveBranchId || undefined, selectedYear, selectedMonth);
      } catch (err) {
        console.warn('Backend Excel export failed:', err);
        handleExportCsv();
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
          {/* Branch Filter */}
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

          {/* Month Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={16} color="var(--color-text-muted)" />
            <select
              className="input"
              style={{ width: 130 }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
            <select
              className="input"
              style={{ width: 100 }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: 220 }}>
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
            <Download size={16} /> Xuất CSV
          </button>
        </div>
      </div>

      {/* Report Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0', gap: 10, color: 'var(--color-text-muted)' }}>
            <Loader2 size={20} className="animate-spin" />
            <span>Đang tổng hợp dữ liệu chấm công từ hệ thống...</span>
          </div>
        ) : (
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Họ và tên</th>
                <th>Chi nhánh</th>
                <th style={{ textAlign: 'right' }}>Ngày công</th>
                <th style={{ textAlign: 'right' }}>Giờ thực tế</th>
                <th style={{ textAlign: 'right' }}>Giờ chuẩn</th>
                <th style={{ textAlign: 'right' }}>Tăng ca (OT)</th>
                <th style={{ textAlign: 'right' }}>Giờ đêm</th>
                <th style={{ textAlign: 'center' }}>Đi muộn/sớm</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-muted)' }}>
                    Không có dữ liệu chấm công cho Tháng {selectedMonth}/{selectedYear}.
                  </td>
                </tr>
              ) : (
                reportData.map((d) => (
                  <tr key={d.employeeId}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{d.employeeCode}</span>
                    </td>
                    <td>{d.fullName}</td>
                    <td>{d.branchName}</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{d.workingDays} ngày</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {d.actualHours.toFixed(1)}h
                    </td>
                    <td style={{ textAlign: 'right' }}>{d.regularHours.toFixed(1)}h</td>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
