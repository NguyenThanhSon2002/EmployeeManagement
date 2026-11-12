import React, { useState, useEffect } from 'react';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { exportToCsv } from '@/utils/csv-exporter.utils';
import { reportService, type AttendanceSummary } from '../api/reportService';
import { Download, Search, Calendar, Loader2 } from 'lucide-react';

export const ScheduledVsActualTable: React.FC = () => {
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
        console.warn('Backend attendance-summary failed in ScheduledVsActualTable:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveBranchId, selectedYear, selectedMonth]);

  const comparisonData = (summaryList.length > 0
    ? summaryList.map((item) => {
        const scheduledHours = item.total_scheduled_hours || 0;
        const actualHours = item.total_actual_hours || 0;
        const diffHours = actualHours - scheduledHours;
        const fulfillmentRate =
          scheduledHours > 0 ? (actualHours / scheduledHours) * 100 : (actualHours > 0 ? 100 : 0);

        return {
          employeeId: item.employee_id,
          employeeCode: item.employee_code,
          fullName: item.full_name,
          branchName: item.branch_name,
          scheduledHours,
          actualHours,
          diffHours,
          fulfillmentRate,
        };
      })
    : employees.map((emp) => {
        const branch = branches.find((b) => b.id === emp.branchId);
        return {
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          fullName: emp.fullName,
          branchName: branch?.branchName || '',
          scheduledHours: 0,
          actualHours: 0,
          diffHours: 0,
          fulfillmentRate: 0,
        };
      })
  ).filter((item) => {
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
      diffHours: d.diffHours > 0 ? `+${d.diffHours.toFixed(1)}` : d.diffHours.toFixed(1),
      fulfillmentRate: `${d.fulfillmentRate.toFixed(1)}%`,
    }));

    exportToCsv(
      `DoiChieu_KeHoach_ThucTe_${selectedMonth}_${selectedYear}.csv`,
      dataRows,
      columns,
      `Báo cáo Đối chiếu Giờ Kế Hoạch vs Giờ Thực Tế (Tháng ${selectedMonth}/${selectedYear})`
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

        <button type="button" className="btn btn-primary" onClick={handleExportCsv} disabled={isLoading}>
          <Download size={16} /> Xuất Báo Cáo Đối Chiếu
        </button>
      </div>

      {/* Comparison Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px' }} />
            <p>Đang tải dữ liệu đối chiếu kế hoạch vs thực tế...</p>
          </div>
        ) : (
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
              {comparisonData.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-secondary)' }}>
                    Không có dữ liệu nhân sự phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                comparisonData.map((d) => {
                  const isUnder = d.scheduledHours > 0 && d.diffHours < -1.0;
                  const isOver = d.scheduledHours > 0 && d.diffHours > 1.0;
                  const isZeroPlan = d.scheduledHours === 0;

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
                        {isZeroPlan ? (
                          <span className="badge badge-secondary">Chưa xếp ca</span>
                        ) : isUnder ? (
                          <span className="badge badge-danger">Thiếu công</span>
                        ) : isOver ? (
                          <span className="badge badge-info">Vượt kế hoạch / OT</span>
                        ) : (
                          <span className="badge badge-success">Đạt chuẩn 100%</span>
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
