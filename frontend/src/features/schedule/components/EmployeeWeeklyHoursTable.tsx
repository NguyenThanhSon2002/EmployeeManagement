import React, { useMemo } from 'react';
import type { Employee, ShiftAssignment } from '@/types/domain.types';
import { formatDateIso, getDayOfWeekVi } from '@/utils/date.utils';
import { calculateShiftDurations } from '@/utils/schedule-calc.utils';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface EmployeeWeeklyHoursTableProps {
  employees: Employee[];
  weekDays: Date[];
  assignmentsMap: Record<string, ShiftAssignment[]>;
  searchTerm?: string;
}

export const EmployeeWeeklyHoursTable: React.FC<EmployeeWeeklyHoursTableProps> = ({
  employees,
  weekDays,
  assignmentsMap,
  searchTerm = '',
}) => {
  // Flatten assignments
  const allAssignments = useMemo(() => {
    return Object.values(assignmentsMap).flat();
  }, [assignmentsMap]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    const activeStaff = employees.filter(
      (emp) => emp.employmentStatus !== 'RESIGNED' && emp.positionId !== 1
    );
    if (!searchTerm.trim()) return activeStaff;
    const term = searchTerm.toLowerCase();
    return activeStaff.filter(
      (emp) =>
        emp.fullName.toLowerCase().includes(term) ||
        emp.employeeCode.toLowerCase().includes(term)
    );
  }, [employees, searchTerm]);

  // Compute table statistics
  const { rowData, totalWeekHoursAllEmployees, totalShiftsAllEmployees } = useMemo(() => {
    let grandTotalHours = 0;
    let grandTotalShifts = 0;

    const rows = filteredEmployees.map((emp) => {
      let empTotalHours = 0;
      let empTotalShifts = 0;

      const dailyData = weekDays.map((day) => {
        const dateStr = formatDateIso(day);
        const dayShifts = allAssignments.filter(
          (a) => a.employeeId === emp.id && a.workDate === dateStr && a.status !== 'CANCELLED'
        );

        let dayHours = 0;
        for (const s of dayShifts) {
          const { netHours } = calculateShiftDurations(
            s.snapshotStartTime,
            s.snapshotEndTime,
            s.snapshotBreakMinutes,
            s.snapshotCrossMidnight
          );
          dayHours += netHours;
        }

        empTotalHours += dayHours;
        empTotalShifts += dayShifts.length;

        return {
          dateStr,
          shiftsCount: dayShifts.length,
          hours: Math.round(dayHours * 10) / 10,
        };
      });

      grandTotalHours += empTotalHours;
      grandTotalShifts += empTotalShifts;

      // Multi-branch calculation: check if employee has shifts in other branches or flag
      const hasExternalShifts = allAssignments.some(
        (a) => a.employeeId === emp.id && a.isExternal && a.status !== 'CANCELLED'
      );
      const isMultiBranch = Boolean(emp.hasMultiBranch || hasExternalShifts);
      const branchHours = Math.round(empTotalHours * 10) / 10;
      const chainHours = emp.totalChainHours !== undefined
        ? Math.round(emp.totalChainHours * 10) / 10
        : branchHours;

      return {
        emp,
        dailyData,
        totalShifts: empTotalShifts,
        totalHours: branchHours,
        chainHours,
        isMultiBranch,
      };
    });

    return {
      rowData: rows,
      totalWeekHoursAllEmployees: Math.round(grandTotalHours * 10) / 10,
      totalShiftsAllEmployees: grandTotalShifts,
    };
  }, [filteredEmployees, weekDays, allAssignments]);

  const avgHoursPerEmp =
    filteredEmployees.length > 0
      ? (totalWeekHoursAllEmployees / filteredEmployees.length).toFixed(1)
      : '0.0';

  return (
    <div
      className="card"
      style={{
        padding: '18px 22px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        marginTop: '16px',
      }}
    >
      {/* 1. Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
          paddingBottom: 14,
          borderBottom: '1px solid #F1F5F9',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>📊</span>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
              Bảng Tổng Hợp Giờ Công Nhân Viên Trong Tuần
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 0' }}>
            Tổng hợp giờ làm theo mẫu ca thực tế và số ca làm việc từ Thứ Hai đến Chủ Nhật.
          </p>
        </div>

        {/* Quick summary stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '5px 12px',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              fontSize: '12px',
            }}
          >
            <span style={{ color: '#64748B' }}>Nhân sự: </span>
            <strong style={{ color: '#0F172A', fontWeight: 700 }}>{filteredEmployees.length}</strong>
          </div>

          <div
            style={{
              padding: '5px 12px',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              fontSize: '12px',
            }}
          >
            <span style={{ color: '#64748B' }}>Tổng ca: </span>
            <strong style={{ color: '#2563EB', fontWeight: 700 }}>{totalShiftsAllEmployees} ca</strong>
          </div>

          <div
            style={{
              padding: '5px 12px',
              backgroundColor: '#EFF6FF',
              borderRadius: '8px',
              border: '1px solid #DBEAFE',
              fontSize: '12px',
            }}
          >
            <span style={{ color: '#1E40AF' }}>Tổng giờ toàn tuần: </span>
            <strong style={{ color: '#1D4ED8', fontSize: '13px', fontWeight: 700 }}>
              {totalWeekHoursAllEmployees}h
            </strong>
            <span style={{ fontSize: '11px', color: '#64748B', marginLeft: 4 }}>
              (TB: {avgHoursPerEmp}h/người)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Responsive Table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          className="table"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
            textAlign: 'left',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid var(--color-border)' }}>
              <th style={{ padding: '10px 14px', width: 220, fontWeight: 700 }}>Nhân Viên</th>
              {weekDays.map((day) => {
                const dateStr = formatDateIso(day);
                const dayName = getDayOfWeekVi(day);
                const dayMonth = day.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                return (
                  <th
                    key={dateStr}
                    style={{
                      padding: '10px 12px',
                      textAlign: 'center',
                      fontWeight: 600,
                      minWidth: 80,
                    }}
                  >
                    <div>{dayName}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                      {dayMonth}
                    </div>
                  </th>
                );
              })}
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, width: 90 }}>
                Tổng Ca
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, width: 110 }}>
                Tổng Giờ
              </th>
              <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, width: 130 }}>
                Trạng Thái
              </th>
            </tr>
          </thead>
          <tbody>
            {rowData.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)' }}>
                  Không có nhân viên nào phù hợp.
                </td>
              </tr>
            ) : (
              rowData.map((row) => {
                const isOverLimit = row.totalHours > 48.0;
                const isPartTimeNormal = row.totalHours <= 40.0;

                return (
                  <tr
                    key={row.emp.id}
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle)',
                      transition: 'background-color 0.1s ease',
                    }}
                  >
                    {/* Employee Profile */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {row.emp.avatarUrl ? (
                          <img
                            src={row.emp.avatarUrl}
                            alt={row.emp.fullName}
                            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-primary-light)',
                              color: 'var(--color-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 11,
                            }}
                          >
                            {row.emp.fullName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {row.emp.fullName}
                            </span>
                            {row.isMultiBranch && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  backgroundColor: '#EFF6FF',
                                  color: '#1D4ED8',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  border: '1px solid #BFDBFE',
                                }}
                                title="Nhân viên làm việc luân phiên/kiêm nhiệm nhiều cơ sở"
                              >
                                Đa cơ sở
                              </span>
                            )}
                            {row.emp.employmentStatus === 'ON_LEAVE' && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  backgroundColor: '#FEF3C7',
                                  color: '#D97706',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  border: '1px solid #FDE68A',
                                }}
                              >
                                Nghỉ chế độ
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{row.emp.employeeCode}</span>
                            {row.emp.homeBranchName && (
                              <span style={{ color: '#64748B', fontSize: 10 }}>
                                • Gốc: {row.emp.homeBranchName.replace('Chi nhánh ', 'CN ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Day Columns (T2..CN) */}
                    {row.dailyData.map((day) => (
                      <td
                        key={day.dateStr}
                        style={{
                          padding: '10px 8px',
                          textAlign: 'center',
                          backgroundColor: day.hours > 0 ? 'rgba(37, 99, 235, 0.02)' : 'transparent',
                        }}
                      >
                        {day.hours > 0 ? (
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {day.hours.toFixed(1)}h
                            </span>
                            {day.shiftsCount > 1 && (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: 'var(--color-primary)',
                                  fontWeight: 600,
                                }}
                              >
                                ({day.shiftsCount} ca)
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#CBD5E1' }}>-</span>
                        )}
                      </td>
                    ))}

                    {/* Total Shifts */}
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: row.totalShifts > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                        }}
                      >
                        {row.totalShifts}{' '}
                        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)' }}>
                          ca
                        </span>
                      </span>
                    </td>

                    {/* Total Hours */}
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <div>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: isOverLimit
                              ? '#DC2626'
                              : row.totalHours > 0
                              ? 'var(--color-primary)'
                              : 'var(--color-text-muted)',
                          }}
                        >
                          {row.totalHours.toFixed(1)}h
                        </span>
                        {row.isMultiBranch && row.chainHours > row.totalHours && (
                          <div
                            style={{
                              fontSize: 11,
                              color: '#64748B',
                              fontWeight: 500,
                              marginTop: 2,
                            }}
                            title={`Tổng giờ làm việc toàn chuỗi: ${row.chainHours.toFixed(1)}h`}
                          >
                            (Chuỗi: {row.chainHours.toFixed(1)}h)
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      {row.emp.employmentStatus === 'ON_LEAVE' ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#D97706',
                            backgroundColor: '#FEF3C7',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid #FDE68A',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                          title="Nhân viên đang trong thời gian nghỉ chế độ"
                        >
                          <AlertTriangle size={11} /> Nghỉ chế độ
                        </span>
                      ) : isOverLimit ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#DC2626',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <AlertTriangle size={11} /> Vượt 48h
                        </span>
                      ) : isPartTimeNormal ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#059669',
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <CheckCircle2 size={11} /> Part-time
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#D97706',
                            backgroundColor: 'rgba(245, 158, 11, 0.14)',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                          }}
                        >
                          Làm nhiều
                        </span>
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
