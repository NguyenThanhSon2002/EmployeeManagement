import React, { useState } from 'react';
import { useAttendanceStore } from './store/useAttendanceStore';
import { MOCK_EMPLOYEES } from '@/mocks/employees.mock';
import { MOCK_DEPARTMENTS } from '@/mocks/departments.mock';
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
    fetchRecords,
  } = useAttendanceStore();

  React.useEffect(() => {
    fetchRecords?.(selectedDate, departmentFilter || undefined);
  }, [fetchRecords, selectedDate, departmentFilter]);

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
      { key: 'employeeCode', header: 'MÃ£ NV' },
      { key: 'fullName', header: 'Há» vÃ  tÃªn' },
      { key: 'department', header: 'PhÃ²ng ban' },
      { key: 'workDate', header: 'NgÃ y' },
      { key: 'checkIn', header: 'Giá» vÃ o' },
      { key: 'checkOut', header: 'Giá» ra' },
      { key: 'lateMinutes', header: 'Äi muá»™n (phÃºt)' },
      { key: 'earlyMinutes', header: 'Vá» sá»›m (phÃºt)' },
      { key: 'actualHours', header: 'Giá» thá»±c táº¿' },
      { key: 'nightHours', header: 'Giá» Ä‘Ãªm' },
      { key: 'status', header: 'Tráº¡ng thÃ¡i' },
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
            ? 'CÃ³ máº·t'
            : r.status === 'LATE'
            ? 'Äi muá»™n'
            : r.status === 'MISSING_CHECKOUT'
            ? 'Thiáº¿u Check-out'
            : r.status === 'CORRECTED'
            ? 'ÄÃ£ giáº£i trÃ¬nh'
            : 'Váº¯ng',
      };
    });

    exportToCsv(
      `DiemDanh_Ngay_${selectedDate}.csv`,
      dataRows,
      columns,
      `BÃ¡o cÃ¡o Äiá»ƒm danh NgÃ y ${selectedDate}`
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Báº£ng Tá»•ng Quan Cháº¥m CÃ´ng HÃ ng NgÃ y (SCR-08)
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 2, fontSize: '13.5px' }}>
            GiÃ¡m sÃ¡t thá»i gian thá»±c giá» vÃ o/ra, cáº£nh bÃ¡o Ä‘i muá»™n, vá» sá»›m vÃ  tiáº¿p nháº­n giáº£i trÃ¬nh cÃ´ng.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-default" onClick={handleOpenAllCorrections}>
            <FileQuestion size={16} /> Quáº£n lÃ½ Giáº£i trÃ¬nh (SCR-09)
          </button>
          <button type="button" className="btn btn-primary" onClick={handleExportCsv}>
            <Download size={16} /> Xuáº¥t CSV Äiá»ƒm Danh
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
              Tá»•ng QuÃ¢n Sá»‘
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {totalRecords} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>ngÆ°á»i</span>
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
              CÃ³ Máº·t / ÄÃºng Giá»
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#047857', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {presentCount} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>ngÆ°á»i</span>
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
              Äi Muá»™n / Vá» Sá»›m
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#B45309', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {lateOrEarlyCount} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>ngÆ°á»i</span>
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
              Thiáº¿u Check-out
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#DC2626', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {missingCheckoutCount} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>ngÆ°á»i</span>
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
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>NgÃ y cháº¥m cÃ´ng:</label>
          <input
            type="date"
            className="input-base"
            style={{ width: 160, height: 36, fontSize: '12.5px' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>PhÃ²ng ban:</label>
          <select
            className="input-base"
            style={{ width: 190, height: 36, fontSize: '12.5px', fontWeight: 500 }}
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
        </div>

        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="input-base"
            placeholder="TÃ¬m theo tÃªn hoáº·c mÃ£ nhÃ¢n viÃªn..."
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
              <th>MÃ£ NV</th>
              <th>Há» vÃ  tÃªn</th>
              <th>PhÃ²ng ban</th>
              <th>Giá» vÃ o</th>
              <th>Giá» ra</th>
              <th>Äi muá»™n</th>
              <th>Vá» sá»›m</th>
              <th>Tá»•ng giá»</th>
              <th>Tráº¡ng thÃ¡i</th>
              <th style={{ textAlign: 'right' }}>Thao tÃ¡c</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--color-text-muted)' }}>
                  KhÃ´ng tÃ¬m tháº¥y báº£n ghi cháº¥m cÃ´ng nÃ o phÃ¹ há»£p.
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
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {emp?.employeeCode}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={emp?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={emp?.fullName}
                          style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', objectFit: 'cover', border: '1.5px solid var(--color-border)' }}
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
                        {dept?.departmentName}
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
                          ? 'ÄÃºng giá»'
                          : r.status === 'LATE'
                          ? 'Äi muá»™n'
                          : r.status === 'MISSING_CHECKOUT'
                          ? 'Thiáº¿u Check-out'
                          : r.status === 'CORRECTED'
                          ? 'ÄÃ£ sá»­a'
                          : 'Váº¯ng'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-default"
                        onClick={() => handleOpenCorrection(r)}
                        style={{ height: 30, padding: '0 10px', fontSize: 12 }}
                      >
                        Giáº£i trÃ¬nh
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
