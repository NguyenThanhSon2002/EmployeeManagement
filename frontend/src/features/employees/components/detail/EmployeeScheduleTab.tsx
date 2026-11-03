import React, { useState, useEffect, useMemo } from 'react';
import { format, addMonths, subMonths, parse } from 'date-fns';
import type { Employee, ShiftAssignment, EmployeeMonthlySchedule } from '@/types/domain.types';
import { employeeService } from '../../api/employeeService';
import { formatDateVi } from '@/utils/date.utils';
import {
  Calendar,
  Clock,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Store,
} from 'lucide-react';

interface EmployeeScheduleTabProps {
  employee: Employee;
  onTotalShiftsChange?: (count: number) => void;
}

export const EmployeeScheduleTab: React.FC<EmployeeScheduleTabProps> = ({
  employee,
  onTotalShiftsChange,
}) => {
  const currentMonthStr = useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [monthlySchedule, setMonthlySchedule] = useState<EmployeeMonthlySchedule | null>(null);
  const [isScheduleLoading, setIsScheduleLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!employee || !employee.id) return;

    let isMounted = true;
    const fetchMonthlySchedule = async () => {
      setIsScheduleLoading(true);
      try {
        const res: any = await employeeService.getEmployeeMonthlySchedule(employee.id, selectedMonth);
        if (isMounted && res) {
          const rawShifts: any[] = res.shifts || [];
          const mappedShifts: ShiftAssignment[] = rawShifts.map((a: any) => ({
            id: a.id,
            scheduleId: a.schedule_id || a.scheduleId || 0,
            employeeId: a.employee_id || a.employeeId || employee.id,
            workShiftId: a.work_shift_id || a.workShiftId || 0,
            workDate: a.work_date || a.workDate || '',
            snapshotShiftName: a.shift_name || a.snapshotShiftName || 'Ca làm việc',
            snapshotStartTime: a.start_time || a.snapshotStartTime || '08:00',
            snapshotEndTime: a.end_time || a.snapshotEndTime || '17:00',
            snapshotBreakMinutes: a.break_minutes !== undefined ? a.break_minutes : (a.snapshotBreakMinutes || 0),
            snapshotCrossMidnight: a.is_cross_midnight !== undefined ? a.is_cross_midnight : (a.snapshotCrossMidnight || false),
            snapshotColorCode: a.color_code || a.snapshotColorCode || '#1677FF',
            plannedStartTime: a.planned_start_time || a.plannedStartTime || `${a.work_date || a.workDate}T${a.start_time || a.snapshotStartTime || '08:00'}`,
            plannedEndTime: a.planned_end_time || a.plannedEndTime || `${a.work_date || a.workDate}T${a.end_time || a.snapshotEndTime || '17:00'}`,
            status: a.status || 'ASSIGNED',
            overrideRule: a.override_rule || a.overrideRule || null,
            overrideReason: a.override_reason || a.overrideReason || null,
            version: a.version || 1,
            branchId: a.branch_id || a.branchId,
            branchName: a.branch_name || a.branchName,
            isExternal: Boolean(a.is_external || a.isExternal),
            readOnly: Boolean(a.read_only || a.readOnly),
          }));

          const totalShifts = res.total_shifts !== undefined ? res.total_shifts : (res.totalShifts ?? mappedShifts.length);
          setMonthlySchedule({
            employeeId: res.employee_id || res.employeeId || employee.id,
            month: res.month || selectedMonth,
            totalShifts,
            totalHours: res.total_hours !== undefined ? res.total_hours : (res.totalHours ?? 0),
            earliestAvailableMonth: res.earliest_available_month || res.earliestAvailableMonth || currentMonthStr,
            shifts: mappedShifts,
          });

          if (onTotalShiftsChange) {
            onTotalShiftsChange(totalShifts);
          }
        }
      } catch (err) {
        console.error('Failed to fetch monthly schedule:', err);
      } finally {
        if (isMounted) {
          setIsScheduleLoading(false);
        }
      }
    };

    fetchMonthlySchedule();
    return () => {
      isMounted = false;
    };
  }, [employee?.id, selectedMonth, currentMonthStr, onTotalShiftsChange]);

  const monthOptions = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    const nextMonth = addMonths(now, 1);
    const maxMonthStr = format(nextMonth, 'yyyy-MM');

    let minMonthStr = monthlySchedule?.earliestAvailableMonth;
    if (!minMonthStr) {
      if (employee?.hireDate) {
        minMonthStr = employee.hireDate.substring(0, 7);
      } else {
        minMonthStr = format(subMonths(now, 12), 'yyyy-MM');
      }
    }

    if (!minMonthStr || minMonthStr.length < 7) {
      minMonthStr = currentMonthStr;
    }

    if (minMonthStr > maxMonthStr) {
      minMonthStr = maxMonthStr;
    }

    try {
      const [minY, minM] = minMonthStr.split('-').map(Number);
      const [maxY, maxM] = maxMonthStr.split('-').map(Number);

      let curY = minY;
      let curM = minM;
      let safetyCount = 0;

      while ((curY < maxY || (curY === maxY && curM <= maxM)) && safetyCount < 60) {
        safetyCount++;
        const mStr = `${curY}-${String(curM).padStart(2, '0')}`;
        list.push(mStr);

        curM++;
        if (curM > 12) {
          curM = 1;
          curY++;
        }
      }
    } catch {
      list.push(currentMonthStr);
    }

    if (list.length === 0) {
      list.push(currentMonthStr);
    }

    return list.reverse();
  }, [monthlySchedule?.earliestAvailableMonth, employee?.hireDate, currentMonthStr]);

  const canGoPrev = useMemo(() => {
    if (!monthlySchedule?.earliestAvailableMonth) return true;
    return selectedMonth > monthlySchedule.earliestAvailableMonth;
  }, [selectedMonth, monthlySchedule?.earliestAvailableMonth]);

  const canGoNext = useMemo(() => {
    const nextMonthStr = format(addMonths(new Date(), 1), 'yyyy-MM');
    return selectedMonth < nextMonthStr;
  }, [selectedMonth]);

  const handlePrevMonth = () => {
    try {
      const prev = subMonths(parse(selectedMonth, 'yyyy-MM', new Date()), 1);
      const prevStr = format(prev, 'yyyy-MM');
      if (!monthlySchedule?.earliestAvailableMonth || prevStr >= monthlySchedule.earliestAvailableMonth) {
        setSelectedMonth(prevStr);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextMonth = () => {
    try {
      const next = addMonths(parse(selectedMonth, 'yyyy-MM', new Date()), 1);
      const nextStr = format(next, 'yyyy-MM');
      const maxMonthStr = format(addMonths(new Date(), 1), 'yyyy-MM');
      if (nextStr <= maxMonthStr) {
        setSelectedMonth(nextStr);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const monthlyShifts = monthlySchedule?.shifts || [];
  const totalMonthlyHours = monthlySchedule?.totalHours ?? 0;
  const totalMonthlyShifts = monthlySchedule?.totalShifts ?? 0;
  const avgHoursPerShift = totalMonthlyShifts > 0 ? (totalMonthlyHours / totalMonthlyShifts).toFixed(1) : '0';

  return (
    <div className="card" style={{ padding: '24px' }}>
      {/* Header & Month Filter Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar style={{ width: 20, height: 20, color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-main)', margin: 0 }}>
              Lịch Ca Phân Công Theo Tháng
            </h3>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
            Thống kê số giờ và các ca làm việc được điều phối trong tháng đã chọn
          </p>
        </div>

        {/* Filter Bar Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Prev Month */}
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={!canGoPrev || isScheduleLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 6,
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-container)',
              cursor: !canGoPrev || isScheduleLoading ? 'not-allowed' : 'pointer',
              opacity: !canGoPrev ? 0.4 : 1,
              color: 'var(--color-text-main)',
              transition: 'all 0.15s ease',
            }}
            title={canGoPrev ? 'Tháng trước' : 'Đã đạt giới hạn tháng sớm nhất'}
          >
            <ChevronLeft style={{ width: 18, height: 18 }} />
          </button>

          {/* Month Selector Dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            disabled={isScheduleLoading}
            style={{
              height: 34,
              padding: '0 12px',
              borderRadius: 6,
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-container)',
              color: 'var(--color-text-main)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {monthOptions.map((m) => {
              const [y, mo] = m.split('-');
              const isCurrent = m === currentMonthStr;
              return (
                <option key={m} value={m}>
                  Tháng {mo}/{y} {isCurrent ? '(Hiện tại)' : ''}
                </option>
              );
            })}
          </select>

          {/* Next Month */}
          <button
            type="button"
            onClick={handleNextMonth}
            disabled={!canGoNext || isScheduleLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 6,
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-container)',
              cursor: !canGoNext || isScheduleLoading ? 'not-allowed' : 'pointer',
              opacity: !canGoNext ? 0.4 : 1,
              color: 'var(--color-text-main)',
              transition: 'all 0.15s ease',
            }}
            title={canGoNext ? 'Tháng sau' : 'Không có dữ liệu tương lai xa hơn'}
          >
            <ChevronRight style={{ width: 18, height: 18 }} />
          </button>

          {selectedMonth !== currentMonthStr && (
            <button
              type="button"
              onClick={() => setSelectedMonth(currentMonthStr)}
              disabled={isScheduleLoading}
              style={{
                height: 34,
                padding: '0 12px',
                borderRadius: 6,
                border: '1px solid #C7D2FE',
                backgroundColor: '#EEF2FF',
                color: '#4338CA',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <RefreshCw style={{ width: 12, height: 12 }} />
              Tháng này
            </button>
          )}
        </div>
      </div>

      {/* 3 KPI Summary Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 10,
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: '#3B82F6',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)',
            }}
          >
            <Clock style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tổng số giờ làm
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1D4ED8', marginTop: 2 }}>
              {totalMonthlyHours.toFixed(1)}
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: 4 }}>giờ</span>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 10,
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: '#10B981',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
            }}
          >
            <CalendarCheck style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tổng số ca làm
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#047857', marginTop: 2 }}>
              {totalMonthlyShifts}
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: 4 }}>ca</span>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 10,
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: '#6366F1',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)',
            }}
          >
            <Sparkles style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Trung bình / Ca
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#4338CA', marginTop: 2 }}>
              {avgHoursPerShift}
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: 4 }}>giờ/ca</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shift List Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-main)', margin: 0 }}>
          Chi tiết các ca làm việc trong tháng {selectedMonth.split('-')[1]}/{selectedMonth.split('-')[0]}
        </h4>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          {monthlyShifts.length} lượt phân ca
        </span>
      </div>

      {/* Loading State or Empty State or Shift Grid */}
      {isScheduleLoading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          Đang tải dữ liệu ca làm việc tháng {selectedMonth}...
        </div>
      ) : monthlyShifts.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            borderRadius: 8,
            backgroundColor: 'var(--color-bg-subtle, #f9fafb)',
            border: '1px dashed var(--color-border)',
          }}
        >
          <Calendar style={{ width: 36, height: 36, color: 'var(--color-text-muted)', margin: '0 auto 10px', opacity: 0.5 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-main)' }}>
            Không có ca làm việc nào trong tháng {selectedMonth.split('-')[1]}/{selectedMonth.split('-')[0]}
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, maxWidth: 360, margin: '4px auto 0' }}>
            Nhân viên này chưa có lịch phân ca nào được xếp hoặc các ca đã hủy trong tháng này.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {monthlyShifts.map((a) => {
            let shiftHours = 0;
            if (a.snapshotStartTime && a.snapshotEndTime) {
              const [sh, sm] = a.snapshotStartTime.split(':').map(Number);
              const [eh, em] = a.snapshotEndTime.split(':').map(Number);
              let diff = (eh * 60 + em) - (sh * 60 + sm);
              if (diff < 0) diff += 24 * 60;
              diff = Math.max(0, diff - (a.snapshotBreakMinutes || 0));
              shiftHours = Math.round((diff / 60) * 10) / 10;
            }

            return (
              <div
                key={a.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-container)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  borderLeft: `4px solid ${a.snapshotColorCode || '#1677FF'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-main)' }}>
                      {a.snapshotShiftName}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 12,
                        backgroundColor: a.snapshotColorCode ? `${a.snapshotColorCode}15` : '#EFF6FF',
                        color: a.snapshotColorCode || '#1677FF',
                      }}
                    >
                      {shiftHours}h
                    </span>
                  </div>

                  <div style={{ fontSize: 13, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar style={{ width: 14, height: 14, color: 'var(--color-text-secondary)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                      {formatDateVi(a.workDate)}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock style={{ width: 14, height: 14, color: 'var(--color-text-muted)' }} />
                    <span>
                      {a.snapshotStartTime} - {a.snapshotEndTime}
                      {a.snapshotCrossMidnight && ' (+1 ngày)'}
                    </span>
                  </div>
                </div>

                {a.branchName && (
                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 8,
                      borderTop: '1px dashed var(--color-border)',
                      fontSize: 11,
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Store style={{ width: 12, height: 12 }} />
                    <span>{a.branchName}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
