import React, { useState, useEffect } from 'react';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { exportToCsv } from '@/utils/csv-exporter.utils';
import { reportService, type AttendanceSummary } from '../api/reportService';
import { Download, Search, Calendar, Loader2, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export const LateEarlyReport: React.FC = () => {
  const { employees, branches } = useDirectoryStore();
  const { currentRole, currentUser } = useAuthStore();

  const isDirector = currentRole === 'ROLE_DIRECTOR';
  const userBranchId = currentUser?.branchId || 1;

  const [branchFilter, setBranchFilter] = useState<number | null>(!isDirector ? userBranchId : null);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyViolations, setOnlyViolations] = useState<boolean>(true);

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);

  const [summaryList, setSummaryList] = useState<AttendanceSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const effectiveBranchId = !isDirector ? userBranchId : branchFilter;

  // Fetch real summary data from backend
  useEffect(() => {
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
        console.warn('Backend attendance-summary failed in LateEarlyReport:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveBranchId, selectedYear, selectedMonth]);

  const reportData = (summaryList.length > 0
    ? summaryList.map((item) => {
        const lateCount = item.late_count || 0;
        const earlyCount = item.early_leave_count || 0;
        const totalViolations = lateCount + earlyCount;

        return {
          employeeId: item.employee_id,
          employeeCode: item.employee_code,
          fullName: item.full_name,
          branchName: item.branch_name,
          workingDays: item.total_working_days || 0,
          lateCount,
          earlyCount,
          totalViolations,
        };
      })
    : employees.map((emp) => {
        const branch = branches.find((b) => b.id === emp.branchId);
        return {
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          fullName: emp.fullName,
          branchName: branch?.branchName || '',
          workingDays: 0,
          lateCount: 0,
          earlyCount: 0,
          totalViolations: 0,
        };
      })
  ).filter((item) => {
    if (onlyViolations && item.totalViolations === 0) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return item.fullName.toLowerCase().includes(q) || item.employeeCode.toLowerCase().includes(q);
    }
    return true;
  });

  const totalLateCount = summaryList.reduce((sum, item) => sum + (item.late_count || 0), 0);
  const totalEarlyCount = summaryList.reduce((sum, item) => sum + (item.early_leave_count || 0), 0);
  const totalViolatingEmployees = summaryList.filter(
    (item) => (item.late_count || 0) > 0 || (item.early_leave_count || 0) > 0
  ).length;

  const handleExportCsv = () => {
    const columns = [
      { key: 'employeeCode', header: 'Mã NV' },
      { key: 'fullName', header: 'Họ và tên' },
      { key: 'branchName', header: 'Chi nhánh' },
      { key: 'workingDays', header: 'Số ngày làm việc' },
      { key: 'lateCount', header: 'Số lần đi muộn' },
      { key: 'earlyCount', header: 'Số lần về sớm' },
      { key: 'totalViolations', header: 'Tổng vi phạm' },
      { key: 'warningLevel', header: 'Mức cảnh báo' },
    ];

    const dataRows = reportData.map((d) => ({
      employeeCode: d.employeeCode,
      fullName: d.fullName,
      branchName: d.branchName,
      workingDays: d.workingDays.toString(),
      lateCount: d.lateCount.toString(),
      earlyCount: d.earlyCount.toString(),
      totalViolations: d.totalViolations.toString(),
      warningLevel:
        d.totalViolations === 0
          ? 'Tốt (0 vi phạm)'
          : d.totalViolations < 3
          ? 'Nhắc nhở (1-2 lần)'
          : 'Kỷ luật (>= 3 lần)',
    }));

    exportToCsv(
      `BaoCao_ViPham_DiMuon_VeSom_${selectedMonth}_${selectedYear}.csv`,
      dataRows,
      columns,
      `Báo cáo Thống kê Vi phạm Đi muộn / Về sớm (Tháng ${selectedMonth}/${selectedYear})`
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: '#FFF1F0',
              color: '#F5222D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Nhân sự có vi phạm</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#CF1322' }}>{totalViolatingEmployees}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: '#FFF7E6',
              color: '#FA8C16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Tổng lượt đi muộn</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#D46B08' }}>{totalLateCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: '#F6FFED',
              color: '#52C41A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Tổng lượt về sớm</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#389E0D' }}>{totalEarlyCount}</div>
          </div>
        </div>
      </div>

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
          {/* Month / Year selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} style={{ color: 'var(--color-text-secondary)' }} />
            <select
              className="input"
              style={{ width: 110, padding: '6px 10px', fontSize: '13px' }}
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
              style={{ width: 100, padding: '6px 10px', fontSize: '13px' }}
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

          <div style={{ position: 'relative', width: 240 }}>
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

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={onlyViolations}
              onChange={(e) => setOnlyViolations(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Chỉ hiện NV có vi phạm</span>
          </label>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleExportCsv} disabled={isLoading}>
          <Download size={16} /> Xuất Báo Cáo Vi Phạm
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px' }} />
            <p>Đang tải dữ liệu vi phạm chấm công...</p>
          </div>
        ) : (
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Họ và tên</th>
                <th>Chi nhánh</th>
                <th style={{ textAlign: 'right' }}>Ngày làm việc</th>
                <th style={{ textAlign: 'right' }}>Đi muộn (lần)</th>
                <th style={{ textAlign: 'right' }}>Về sớm (lần)</th>
                <th style={{ textAlign: 'right' }}>Tổng vi phạm</th>
                <th>Mức độ cảnh báo</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-secondary)' }}>
                    {onlyViolations
                      ? 'Không có trường hợp vi phạm đi muộn hoặc về sớm nào trong kỳ này.'
                      : 'Không có dữ liệu nhân sự phù hợp.'}
                  </td>
                </tr>
              ) : (
                reportData.map((d) => {
                  const isSevere = d.totalViolations >= 3;
                  const isWarning = d.totalViolations > 0 && d.totalViolations < 3;

                  return (
                    <tr key={d.employeeId}>
                      <td>
                        <span style={{ fontWeight: 600 }}>{d.employeeCode}</span>
                      </td>
                      <td>{d.fullName}</td>
                      <td>{d.branchName}</td>
                      <td style={{ textAlign: 'right' }}>{d.workingDays} ngày</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: d.lateCount > 0 ? '#CF1322' : 'inherit' }}>
                        {d.lateCount > 0 ? `${d.lateCount} lần` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: d.earlyCount > 0 ? '#FA8C16' : 'inherit' }}>
                        {d.earlyCount > 0 ? `${d.earlyCount} lần` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {d.totalViolations > 0 ? (
                          <span style={{ color: isSevere ? '#CF1322' : '#D46B08' }}>{d.totalViolations}</span>
                        ) : (
                          <span style={{ color: '#389E0D' }}>0</span>
                        )}
                      </td>
                      <td>
                        {isSevere ? (
                          <span className="badge badge-danger">Kỷ luật (≥ 3 lần)</span>
                        ) : isWarning ? (
                          <span className="badge badge-warning">Nhắc nhở</span>
                        ) : (
                          <span className="badge badge-success">Tốt (Tuân thủ)</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
