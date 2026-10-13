import React, { useState } from 'react';
import { useAttendanceStore } from '@/store/useAttendanceStore';
import { MOCK_EMPLOYEES } from '@/data/mock/employees.mock';
import { MOCK_DEPARTMENTS } from '@/data/mock/departments.mock';
import { AttendanceCorrectionModal } from './components/AttendanceCorrectionModal';
import { exportToCsv } from '@/utils/csv-exporter.utils';
import type { AttendanceRecord } from '@/types/domain.types';
import {
  Download,
  FileQuestion,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  UserCheck,
} from 'lucide-react';

export const AttendanceOverviewPage: React.FC = () => {
  const {
    records,
    selectedDate,
    departmentFilter,
    setSelectedDate,
    setDepartmentFilter,
  } = useAttendanceStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Filtered records
  const filteredRecords = records.filter((rec) => {
    const emp = MOCK_EMPLOYEES.find((e) => e.id === rec.employeeId);
    if (!emp) return false;

    if (departmentFilter && emp.departmentId !== departmentFilter) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = emp.fullName.toLowerCase().includes(q);
      const matchCode = emp.employeeCode.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }

    return true;
  });

  // Calculate statistics
  const totalRecords = filteredRecords.length;
  const presentCount = filteredRecords.filter((r) => r.status === 'PRESENT' || r.status === 'CORRECTED').length;
  const lateOrEarlyCount = filteredRecords.filter((r) => r.lateMinutes > 0 || r.earlyLeaveMinutes > 0).length;
  const missingCheckoutCount = filteredRecords.filter((r) => r.status === 'MISSING_CHECKOUT').length;

  const handleOpenCorrection = (rec: AttendanceRecord) => {
    setSelectedRecord(rec);
    setIsModalOpen(true);
  };

  const handleOpenAllCorrections = () => {
    setSelectedRecord(null);
    setIsModalOpen(true);
  };

  const handleExportCsv = () => {
    const columns = [
      { key: 'employeeCode', header: 'Mã NV' },
      { key: 'fullName', header: 'Họ và tên' },
      { key: 'department', header: 'Phòng ban' },
      { key: 'workDate', header: 'Ngày' },
      { key: 'checkIn', header: 'Giờ vào' },
      { key: 'checkOut', header: 'Giờ ra' },
      { key: 'lateMinutes', header: 'Đi muộn (phút)' },
      { key: 'earlyMinutes', header: 'Về sớm (phút)' },
      { key: 'actualHours', header: 'Giờ thực tế' },
      { key: 'nightHours', header: 'Giờ đêm' },
      { key: 'status', header: 'Trạng thái' },
    ];

    const dataRows = filteredRecords.map((r) => {
      const emp = MOCK_EMPLOYEES.find((e) => e.id === r.employeeId);
      const dept = MOCK_DEPARTMENTS.find((d) => d.id === emp?.departmentId);
      return {
        employeeCode: emp?.employeeCode || '',
        fullName: emp?.fullName || '',
        department: dept?.departmentName || '',
        workDate: r.workDate,
        checkIn: r.checkInTime ? r.checkInTime.split('T')[1]?.substring(0, 5) || '' : '',
        checkOut: r.checkOutTime ? r.checkOutTime.split('T')[1]?.substring(0, 5) || '' : '',
        lateMinutes: r.lateMinutes.toString(),
        earlyMinutes: r.earlyLeaveMinutes.toString(),
        actualHours: r.actualHours.toFixed(1),
        nightHours: r.nightHours.toFixed(1),
        status:
          r.status === 'PRESENT'
            ? 'Có mặt'
            : r.status === 'LATE'
            ? 'Đi muộn'
            : r.status === 'MISSING_CHECKOUT'
            ? 'Thiếu Check-out'
            : r.status === 'CORRECTED'
            ? 'Đã giải trình'
            : 'Vắng',
      };
    });

    exportToCsv(
      `DiemDanh_Ngay_${selectedDate}.csv`,
      dataRows,
      columns,
      `Báo cáo Điểm danh Ngày ${selectedDate}`
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-h1)', fontWeight: 700 }}>Bảng Tổng Quan Chấm Công Hàng Ngày (SCR-08)</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Giám sát thời gian thực giờ vào/ra, cảnh báo đi muộn, về sớm và tiếp nhận giải trình công
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={handleOpenAllCorrections}>
            <FileQuestion size={16} /> Quản lý Giải trình (SCR-09)
          </button>
          <button type="button" className="btn btn-primary" onClick={handleExportCsv}>
            <Download size={16} /> Xuất CSV Điểm Danh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
        }}
      >
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #1890ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Tổng Quân Số</span>
            <UserCheck size={18} color="#1890ff" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{totalRecords}</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #52c41a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Có Mặt / Đúng Giờ</span>
            <CheckCircle size={18} color="#52c41a" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: '#389e0d' }}>{presentCount}</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #faad14' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Đi Muộn / Về Sớm</span>
            <Clock size={18} color="#faad14" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: '#d46b08' }}>{lateOrEarlyCount}</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #f5222d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Thiếu Check-out</span>
            <AlertTriangle size={18} color="#f5222d" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: '#cf1322' }}>{missingCheckoutCount}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 500 }}>Ngày chấm công:</label>
          <input
            type="date"
            className="input"
            style={{ width: 160 }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 500 }}>Phòng ban:</label>
          <select
            className="input"
            style={{ width: 180 }}
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
        </div>

        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Tìm theo tên hoặc mã nhân viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 34, width: '100%' }}
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Họ và tên</th>
              <th>Phòng ban</th>
              <th>Giờ vào</th>
              <th>Giờ ra</th>
              <th>Đi muộn</th>
              <th>Về sớm</th>
              <th>Tổng giờ</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-secondary)' }}>
                  Không tìm thấy bản ghi chấm công nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => {
                const emp = MOCK_EMPLOYEES.find((e) => e.id === r.employeeId);
                const dept = MOCK_DEPARTMENTS.find((d) => d.id === emp?.departmentId);

                const inStr = r.checkInTime ? r.checkInTime.split('T')[1]?.substring(0, 5) : '--:--';
                const outStr = r.checkOutTime ? r.checkOutTime.split('T')[1]?.substring(0, 5) : '--:--';

                const isWarning = r.status === 'MISSING_CHECKOUT' || r.status === 'LATE';

                return (
                  <tr key={r.id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{emp?.employeeCode}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img
                          src={emp?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={emp?.fullName}
                          style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span>{emp?.fullName}</span>
                      </div>
                    </td>
                    <td>{dept?.departmentName}</td>
                    <td>
                      <strong style={{ color: r.lateMinutes > 0 ? '#cf1322' : 'inherit' }}>{inStr}</strong>
                    </td>
                    <td>
                      <strong style={{ color: r.status === 'MISSING_CHECKOUT' ? '#cf1322' : 'inherit' }}>{outStr}</strong>
                    </td>
                    <td>
                      {r.lateMinutes > 0 ? (
                        <span style={{ color: '#cf1322', fontWeight: 600 }}>+{r.lateMinutes}p</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {r.earlyLeaveMinutes > 0 ? (
                        <span style={{ color: '#cf1322', fontWeight: 600 }}>-{r.earlyLeaveMinutes}p</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{r.actualHours.toFixed(1)}h</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          r.status === 'PRESENT'
                            ? 'badge-success'
                            : r.status === 'CORRECTED'
                            ? 'badge-info'
                            : isWarning
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        <span className="badge-dot" />
                        {r.status === 'PRESENT'
                          ? 'Đúng giờ'
                          : r.status === 'LATE'
                          ? 'Đi muộn'
                          : r.status === 'MISSING_CHECKOUT'
                          ? 'Thiếu Check-out'
                          : r.status === 'CORRECTED'
                          ? 'Đã sửa'
                          : 'Vắng'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleOpenCorrection(r)}
                        style={{ height: 28, padding: '0 8px', fontSize: 12 }}
                      >
                        Giải trình
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Correction Modal */}
      <AttendanceCorrectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetRecord={selectedRecord}
      />
    </div>
  );
};
