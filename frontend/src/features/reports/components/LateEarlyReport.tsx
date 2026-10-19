import React, { useState } from 'react';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';
import { useAttendanceStore } from '@/features/attendance/store/useAttendanceStore';
import { exportToCsv } from '@/utils/csv-exporter.utils';
import { Download, Search } from 'lucide-react';

export const LateEarlyReport: React.FC = () => {
  const { records } = useAttendanceStore();
  const { employees, branches } = useDirectoryStore();

  const [searchTerm, setSearchTerm] = useState('');

  // Collect records with infractions
  const violationRecords = records.filter(
    (r) => r.lateMinutes > 0 || r.earlyLeaveMinutes > 0 || r.status === 'MISSING_CHECKOUT' || r.status === 'LATE'
  );

  const filteredViolations = violationRecords.filter((r) => {
    const emp = employees.find((e) => e.id === r.employeeId);
    if (!emp) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return emp.fullName.toLowerCase().includes(q) || emp.employeeCode.toLowerCase().includes(q);
    }
    return true;
  });

  const handleExportCsv = () => {
    const columns = [
      { key: 'employeeCode', header: 'Mã NV' },
      { key: 'fullName', header: 'Họ và tên' },
      { key: 'branchName', header: 'Chi nhánh' },
      { key: 'workDate', header: 'Ngày vi phạm' },
      { key: 'violationType', header: 'Hành vi vi phạm' },
      { key: 'minutes', header: 'Thời lượng (phút)' },
      { key: 'checkIn', header: 'Giờ vào' },
      { key: 'checkOut', header: 'Giờ ra' },
      { key: 'isResolved', header: 'Trạng thái giải trình' },
    ];

    const dataRows = filteredViolations.map((r) => {
      const emp = employees.find((e) => e.id === r.employeeId);
      const branch = branches.find((b) => b.id === emp?.branchId);

      let vType = 'Đi muộn';
      let mins = r.lateMinutes;
      if (r.status === 'MISSING_CHECKOUT') {
        vType = 'Thiếu Check-out';
        mins = 0;
      } else if (r.earlyLeaveMinutes > 0) {
        vType = 'Về sớm';
        mins = r.earlyLeaveMinutes;
      }

      return {
        employeeCode: emp?.employeeCode || '',
        fullName: emp?.fullName || '',
        branchName: branch?.branchName || '',
        workDate: r.workDate,
        violationType: vType,
        minutes: mins > 0 ? mins.toString() : '-',
        checkIn: r.checkInTime ? r.checkInTime.split('T')[1]?.substring(0, 5) || '' : '',
        checkOut: r.checkOutTime ? r.checkOutTime.split('T')[1]?.substring(0, 5) || '' : '',
        isResolved: r.isManuallyCorrected ? 'Đã giải trình hợp lệ' : 'Chưa giải trình',
      };
    });

    exportToCsv(
      'BaoCao_ViPham_DiMuon_VeSom.csv',
      dataRows,
      columns,
      'Báo cáo Vi phạm Thời gian Lao động (Đi muộn / Về sớm / Thiếu quét thẻ)'
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
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
        <div style={{ position: 'relative', width: 280 }}>
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

        <button type="button" className="btn btn-primary" onClick={handleExportCsv}>
          <Download size={16} /> Xuất Báo Cáo Vi Phạm
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Họ và tên</th>
              <th>Chi nhánh</th>
              <th>Ngày</th>
              <th>Giờ vào / ra</th>
              <th>Hành vi</th>
              <th style={{ textAlign: 'right' }}>Thời lượng</th>
              <th>Trạng thái giải trình</th>
            </tr>
          </thead>
          <tbody>
            {filteredViolations.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-secondary)' }}>
                  Không có trường hợp vi phạm đi muộn hoặc thiếu check-out nào.
                </td>
              </tr>
            ) : (
              filteredViolations.map((r) => {
                const emp = employees.find((e) => e.id === r.employeeId);
                const branch = branches.find((b) => b.id === emp?.branchId);

                const inStr = r.checkInTime ? r.checkInTime.split('T')[1]?.substring(0, 5) : '--:--';
                const outStr = r.checkOutTime ? r.checkOutTime.split('T')[1]?.substring(0, 5) : '--:--';

                const isMissing = r.status === 'MISSING_CHECKOUT';

                return (
                  <tr key={r.id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{emp?.employeeCode}</span>
                    </td>
                    <td>{emp?.fullName}</td>
                    <td>{branch?.branchName}</td>
                    <td>{r.workDate}</td>
                    <td>
                      <span>{inStr} - {outStr}</span>
                    </td>
                    <td>
                      <span className={`badge ${isMissing ? 'badge-danger' : 'badge-warning'}`}>
                        {isMissing ? 'Thiếu Check-out' : r.lateMinutes > 0 ? 'Đi muộn' : 'Về sớm'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#cf1322' }}>
                      {r.lateMinutes > 0 ? `+${r.lateMinutes} phút` : r.earlyLeaveMinutes > 0 ? `-${r.earlyLeaveMinutes} phút` : '-'}
                    </td>
                    <td>
                      {r.isManuallyCorrected ? (
                        <span className="badge badge-success">Đã giải trình</span>
                      ) : (
                        <span className="badge badge-warning">Chờ giải trình</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
