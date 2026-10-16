import React, { useState } from 'react';
import { MOCK_EMPLOYEES } from '@/mocks/employees.mock';
import { MOCK_DEPARTMENTS } from '@/mocks/departments.mock';
import { useAttendanceStore } from '@/features/attendance/store/useAttendanceStore';
import { exportToCsv } from '@/utils/csv-exporter.utils';
import { Download, Search } from 'lucide-react';

export const LateEarlyReport: React.FC = () => {
  const { records } = useAttendanceStore();

  const [searchTerm, setSearchTerm] = useState('');

  // Collect records with infractions
  const violationRecords = records.filter(
    (r) => r.lateMinutes > 0 || r.earlyLeaveMinutes > 0 || r.status === 'MISSING_CHECKOUT' || r.status === 'LATE'
  );

  const filteredViolations = violationRecords.filter((r) => {
    const emp = MOCK_EMPLOYEES.find((e) => e.id === r.employeeId);
    if (!emp) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return emp.fullName.toLowerCase().includes(q) || emp.employeeCode.toLowerCase().includes(q);
    }
    return true;
  });

  const handleExportCsv = () => {
    const columns = [
      { key: 'employeeCode', header: 'MÃ£ NV' },
      { key: 'fullName', header: 'Há» vÃ  tÃªn' },
      { key: 'departmentName', header: 'PhÃ²ng ban' },
      { key: 'workDate', header: 'NgÃ y vi pháº¡m' },
      { key: 'violationType', header: 'HÃ nh vi vi pháº¡m' },
      { key: 'minutes', header: 'Thá»i lÆ°á»£ng (phÃºt)' },
      { key: 'checkIn', header: 'Giá» vÃ o' },
      { key: 'checkOut', header: 'Giá» ra' },
      { key: 'isResolved', header: 'Tráº¡ng thÃ¡i giáº£i trÃ¬nh' },
    ];

    const dataRows = filteredViolations.map((r) => {
      const emp = MOCK_EMPLOYEES.find((e) => e.id === r.employeeId);
      const dept = MOCK_DEPARTMENTS.find((d) => d.id === emp?.departmentId);

      let vType = 'Äi muá»™n';
      let mins = r.lateMinutes;
      if (r.status === 'MISSING_CHECKOUT') {
        vType = 'Thiáº¿u Check-out';
        mins = 0;
      } else if (r.earlyLeaveMinutes > 0) {
        vType = 'Vá» sá»›m';
        mins = r.earlyLeaveMinutes;
      }

      return {
        employeeCode: emp?.employeeCode || '',
        fullName: emp?.fullName || '',
        departmentName: dept?.departmentName || '',
        workDate: r.workDate,
        violationType: vType,
        minutes: mins > 0 ? mins.toString() : '-',
        checkIn: r.checkInTime ? r.checkInTime.split('T')[1]?.substring(0, 5) || '' : '',
        checkOut: r.checkOutTime ? r.checkOutTime.split('T')[1]?.substring(0, 5) || '' : '',
        isResolved: r.isManuallyCorrected ? 'ÄÃ£ giáº£i trÃ¬nh há»£p lá»‡' : 'ChÆ°a giáº£i trÃ¬nh',
      };
    });

    exportToCsv(
      'BaoCao_ViPham_DiMuon_VeSom.csv',
      dataRows,
      columns,
      'BÃ¡o cÃ¡o Vi pháº¡m Thá»i gian Lao Ä‘á»™ng (Äi muá»™n / Vá» sá»›m / Thiáº¿u quÃ©t tháº»)'
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
            placeholder="TÃ¬m theo tÃªn hoáº·c mÃ£ NV..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 34, width: '100%' }}
          />
        </div>

        <button type="button" className="btn btn-primary" onClick={handleExportCsv}>
          <Download size={16} /> Xuáº¥t CSV Vi Pháº¡m (UTF-8 BOM)
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>MÃ£ NV</th>
              <th>Há» vÃ  tÃªn</th>
              <th>PhÃ²ng ban</th>
              <th>NgÃ y</th>
              <th>Giá» vÃ o / ra</th>
              <th>HÃ nh vi</th>
              <th style={{ textAlign: 'right' }}>Thá»i lÆ°á»£ng</th>
              <th>Tráº¡ng thÃ¡i giáº£i trÃ¬nh</th>
            </tr>
          </thead>
          <tbody>
            {filteredViolations.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-secondary)' }}>
                  KhÃ´ng cÃ³ trÆ°á»ng há»£p vi pháº¡m Ä‘i muá»™n hoáº·c thiáº¿u check-out nÃ o.
                </td>
              </tr>
            ) : (
              filteredViolations.map((r) => {
                const emp = MOCK_EMPLOYEES.find((e) => e.id === r.employeeId);
                const dept = MOCK_DEPARTMENTS.find((d) => d.id === emp?.departmentId);

                const inStr = r.checkInTime ? r.checkInTime.split('T')[1]?.substring(0, 5) : '--:--';
                const outStr = r.checkOutTime ? r.checkOutTime.split('T')[1]?.substring(0, 5) : '--:--';

                const isMissing = r.status === 'MISSING_CHECKOUT';

                return (
                  <tr key={r.id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{emp?.employeeCode}</span>
                    </td>
                    <td>{emp?.fullName}</td>
                    <td>{dept?.departmentName}</td>
                    <td>{r.workDate}</td>
                    <td>
                      <span>{inStr} - {outStr}</span>
                    </td>
                    <td>
                      <span className={`badge ${isMissing ? 'badge-danger' : 'badge-warning'}`}>
                        {isMissing ? 'Thiáº¿u Check-out' : r.lateMinutes > 0 ? 'Äi muá»™n' : 'Vá» sá»›m'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#cf1322' }}>
                      {r.lateMinutes > 0 ? `+${r.lateMinutes} phÃºt` : r.earlyLeaveMinutes > 0 ? `-${r.earlyLeaveMinutes} phÃºt` : '-'}
                    </td>
                    <td>
                      {r.isManuallyCorrected ? (
                        <span className="badge badge-success">ÄÃ£ giáº£i trÃ¬nh</span>
                      ) : (
                        <span className="badge badge-warning">Chá» giáº£i trÃ¬nh</span>
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
