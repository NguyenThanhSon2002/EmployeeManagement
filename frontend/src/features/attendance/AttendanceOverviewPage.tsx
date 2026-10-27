import React, { useState } from 'react';
import { useAttendanceStore } from './store/useAttendanceStore';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';
import { AttendanceCorrectionModal } from './components/AttendanceCorrectionModal';
import { PageHeader } from '@/components/common/PageHeader';
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
import { UserAvatar } from '@/components/common/UserAvatar';

export const AttendanceOverviewPage: React.FC = () => {
  const {
    records,
    selectedDate,
    branchFilter,
    setSelectedDate,
    setBranchFilter,
    fetchRecords,
  } = useAttendanceStore();
  const { employees, branches } = useDirectoryStore();

  React.useEffect(() => {
    fetchRecords?.(selectedDate, branchFilter || undefined);
  }, [fetchRecords, selectedDate, branchFilter]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Filtered records
  const filteredRecords = records.filter((rec) => {
    const emp = employees.find((e) => e.id === rec.employeeId);
    if (!emp) return false;

    if (branchFilter && emp.branchId !== branchFilter) return false;

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
      { key: 'branch', header: 'Chi nhánh' },
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
      const emp = employees.find((e) => e.id === r.employeeId);
      const branch = branches.find((b) => b.id === emp?.branchId);
      return {
        employeeCode: emp?.employeeCode || '',
        fullName: emp?.fullName || '',
        branch: branch?.branchName || '',
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
      <PageHeader
        icon={<Clock size={20} />}
        title="Bảng Tổng Quan Chấm Công Hàng Ngày"
        subtitle="Giám sát thời gian thực giờ vào/ra, cảnh báo đi muộn, về sớm và tiếp nhận giải trình công."
        action={
          <>
            <button type="button" className="btn btn-default" onClick={handleOpenAllCorrections}>
              <FileQuestion size={16} /> Quản lý Giải trình
            </button>
            <button type="button" className="btn btn-primary" onClick={handleExportCsv}>
              <Download size={16} /> Xuất CSV Điểm Danh
            </button>
          </>
        }
      />

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
        }}
      >
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tổng Quân Số
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {totalRecords} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>người</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#ECFDF5',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Có Mặt / Đúng Giờ
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#047857', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {presentCount} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>người</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#FFFBEB',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Đi Muộn / Về Sớm
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#B45309', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {lateOrEarlyCount} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>người</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#FEF2F2',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Thiếu Check-out
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#DC2626', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {missingCheckoutCount} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>người</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: '12px 18px',
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>Ngày chấm công:</label>
          <input
            type="date"
            className="input-base"
            style={{ width: 160, height: 36, fontSize: '12.5px' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>Chi nhánh:</label>
          <select
            className="input-base"
            style={{ width: 210, height: 36, fontSize: '12.5px', fontWeight: 500 }}
            value={branchFilter || ''}
            onChange={(e) => setBranchFilter(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">-- Tất cả cơ sở / chi nhánh --</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branchName}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="input-base"
            placeholder="Tìm theo tên hoặc mã nhân viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 34, width: '100%', height: 36, fontSize: '12.5px' }}
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto', borderRadius: 'var(--radius-xl)' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Họ và tên</th>
              <th>Chi nhánh</th>
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
                <td colSpan={10} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--color-text-muted)' }}>
                  Không tìm thấy bản ghi chấm công nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => {
                const emp = employees.find((e) => e.id === r.employeeId);
                const branch = branches.find((b) => b.id === emp?.branchId);

                const inStr = r.checkInTime ? r.checkInTime.split('T')[1]?.substring(0, 5) : '--:--';
                const outStr = r.checkOutTime ? r.checkOutTime.split('T')[1]?.substring(0, 5) : '--:--';

                const isWarning = r.status === 'MISSING_CHECKOUT' || r.status === 'LATE';

                return (
                  <tr key={r.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {emp?.employeeCode}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <UserAvatar
                          name={emp?.fullName || 'Nhân viên'}
                          src={emp?.avatarUrl}
                          size={32}
                        />
                        <span style={{ fontWeight: 600 }}>{emp?.fullName}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#F1F5F9',
                          fontSize: '12px',
                        }}
                      >
                        {branch?.branchName}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: r.lateMinutes > 0 ? '#DC2626' : 'inherit', fontVariantNumeric: 'tabular-nums' }}>
                        {inStr}
                      </strong>
                    </td>
                    <td>
                      <strong style={{ color: r.status === 'MISSING_CHECKOUT' ? '#DC2626' : 'inherit', fontVariantNumeric: 'tabular-nums' }}>
                        {outStr}
                      </strong>
                    </td>
                    <td>
                      {r.lateMinutes > 0 ? (
                        <span style={{ color: '#DC2626', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>+{r.lateMinutes}p</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                      )}
                    </td>
                    <td>
                      {r.earlyLeaveMinutes > 0 ? (
                        <span style={{ color: '#DC2626', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>-{r.earlyLeaveMinutes}p</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{r.actualHours.toFixed(1)}h</span>
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
                        className="btn btn-default"
                        onClick={() => handleOpenCorrection(r)}
                        style={{ height: 30, padding: '0 10px', fontSize: 12 }}
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
