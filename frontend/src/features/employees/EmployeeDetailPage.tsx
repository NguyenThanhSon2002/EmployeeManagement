import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format, addMonths, subMonths, parse } from 'date-fns';
import type { Employee, Branch, ShiftAssignment, EmployeeMonthlySchedule } from '@/types/domain.types';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { EmployeeAvailabilityTab } from './components/EmployeeAvailabilityTab';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';
import { useScheduleStore } from '@/features/schedule/store/useScheduleStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { employeeService } from './api/employeeService';
import { branchService } from '@/shared/branch/branchService';
import { isMockEnabled } from '@/config/env.config';
import { formatDateVi } from '@/utils/date.utils';
import { UserAvatar } from '@/components/common/UserAvatar';
import { EmploymentStatusBadge } from '@/components/common/EmploymentStatusBadge';


import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Palmtree,
  Mail,
  Phone,
  Briefcase,
  Store,
  Trash2,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Camera,
  KeyRound,
  Loader2,
} from 'lucide-react';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const initialTab =
    tabParam === 'AVAILABILITY'
      ? 'AVAILABILITY'
      : tabParam === 'SCHEDULE'
      ? 'SCHEDULE'
      : tabParam === 'ATTENDANCE'
      ? 'ATTENDANCE'
      : tabParam === 'LEAVE'
      ? 'LEAVE'
      : 'PROFILE';

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SCHEDULE' | 'ATTENDANCE' | 'LEAVE' | 'AVAILABILITY'>(initialTab);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'AVAILABILITY' || t === 'SCHEDULE' || t === 'ATTENDANCE' || t === 'LEAVE' || t === 'PROFILE') {
      setActiveTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: 'PROFILE' | 'SCHEDULE' | 'ATTENDANCE' | 'LEAVE' | 'AVAILABILITY') => {
    setActiveTab(newTab);
    navigate(`/employees/${id}?tab=${newTab}`, { replace: true });
  };

  const { currentRole, currentUser, setUser } = useAuthStore();
  const { addToast } = useUIStore();
  const canDelete = currentRole === 'ROLE_DIRECTOR';
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Change Password & Avatar Upload States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { assignments, approvedLeaves } = useScheduleStore();
  const { getEmployeeById, branches, positions } = useDirectoryStore();
  const cachedEmployee = id ? getEmployeeById(Number(id)) : undefined;

  const fallbackEmp: Employee = {
    id: Number(id) || 1,
    employeeCode: `EMP-${id || '001'}`,
    fullName: 'Đang tải thông tin...',
    email: '',
    phoneNumber: '',
    branchId: 1,
    positionId: 1,
    managerId: null,
    employmentStatus: 'OFFICIAL',
    hireDate: '2026-01-01',
    isActive: true,
  };

  const [employee, setEmployee] = useState<Employee | null>(
    isMockEnabled() ? (cachedEmployee || fallbackEmp) : null
  );

  const isSelf = Boolean(currentUser && employee && currentUser.id === employee.id);
  const canManagePassword = isSelf || currentRole === 'ROLE_DIRECTOR';
  const [branchesList, setBranchesList] = useState<Branch[]>(isMockEnabled() ? branches : []);
  const [isLoading, setIsLoading] = useState<boolean>(!isMockEnabled());
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isMockEnabled() || !id) return;

    let isMounted = true;
    const fetchEmployee = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [empData, branchData] = await Promise.all([
          employeeService.getEmployeeById(Number(id)),
          branchService.getAllBranches().catch(() => null),
        ]);

        if (!isMounted) return;

        if (branchData && Array.isArray(branchData) && branchData.length > 0) {
          const mappedBranches: Branch[] = branchData.map((b: any) => ({
            id: b.id,
            branchCode: b.branch_code || b.branchCode,
            branchName: b.branch_name || b.branchName,
            address: b.address || '',
            phoneNumber: b.phone_number || b.phoneNumber || '',
            managerId: b.manager_id || b.managerId || null,
            isActive: b.is_active !== undefined ? b.is_active : true,
          }));
          setBranchesList(mappedBranches);
        }

        if (empData) {
          const secBranches = (empData.secondary_branches || (empData as any).secondaryBranches || []).map((sb: any) => ({
            branchId: sb.branch_id || sb.branchId,
            positionId: sb.position_id || sb.positionId,
            branchName: sb.branch_name || sb.branchName,
            positionName: sb.position_name || sb.positionName,
          }));
          const secBranchIds: number[] = empData.secondary_branch_ids || (empData as any).secondaryBranchIds || secBranches.map((sb: any) => sb.branchId);

          setEmployee({
            id: empData.id,
            employeeCode: empData.employee_code || (empData as any).employeeCode,
            fullName: empData.full_name || (empData as any).fullName,
            email: empData.email,
            phoneNumber: empData.phone_number || (empData as any).phoneNumber || '',
            nationalId: empData.national_id || (empData as any).nationalId || '',
            dateOfBirth: empData.date_of_birth || (empData as any).dateOfBirth || '',
            gender: empData.gender || 'OTHER',
            address: empData.address || '',
            branchId: empData.branch_id || (empData as any).branchId || 1,
            positionId: empData.position_id || (empData as any).positionId || 1,
            managerId: empData.manager_id || (empData as any).managerId || null,
            employmentStatus: empData.employment_status || (empData as any).employmentStatus || 'OFFICIAL',
            employmentType: empData.employment_type || (empData as any).employmentType || 'FULL_TIME',
            hireDate: empData.hire_date || (empData as any).hireDate || '2026-01-01',
            avatarUrl: empData.avatar_url || (empData as any).avatarUrl,
            isActive: empData.is_active !== undefined ? empData.is_active : true,
            version: empData.version || 1,
            secondaryBranchIds: secBranchIds,
            secondaryBranches: secBranches,
            hasMultiBranch: secBranchIds.length > 0,
          });
        } else {
          setEmployee(null);
          setLoadError('Không tìm thấy thông tin nhân viên.');
          addToast({
            type: 'error',
            title: 'Lỗi tải dữ liệu',
            message: 'Không tìm thấy thông tin nhân viên trên hệ thống.',
          });
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Could not fetch employee by id from API:', err);
        setEmployee(null);
        setLoadError('Không thể tải thông tin nhân sự từ máy chủ.');
        addToast({
          type: 'error',
          title: 'Lỗi tải dữ liệu',
          message: 'Không thể kết nối máy chủ để tải thông tin nhân viên.',
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchEmployee();
    return () => {
      isMounted = false;
    };
  }, [id, addToast]);

  const branch = employee ? (branchesList.length > 0 ? branchesList : branches).find((b) => b.id === employee.branchId) : undefined;
  const position = employee ? positions.find((p) => p.id === employee.positionId) : undefined;

  const assignedBranches = useMemo(() => {
    if (!employee) return [];
    const list: { id: number; branchName: string; isPrimary: boolean }[] = [];
    const allBranches = branchesList.length > 0 ? branchesList : branches;

    if (employee.branchId) {
      const b = allBranches.find((item) => item.id === employee.branchId);
      list.push({
        id: employee.branchId,
        branchName: b?.branchName || `Chi nhánh #${employee.branchId}`,
        isPrimary: true,
      });
    }

    if (employee.secondaryBranches && employee.secondaryBranches.length > 0) {
      employee.secondaryBranches.forEach((sb) => {
        if (sb.branchId && !list.some((item) => item.id === sb.branchId)) {
          const b = allBranches.find((item) => item.id === sb.branchId);
          list.push({
            id: sb.branchId,
            branchName: sb.branchName || b?.branchName || `Chi nhánh #${sb.branchId}`,
            isPrimary: false,
          });
        }
      });
    } else if (employee.secondaryBranchIds && employee.secondaryBranchIds.length > 0) {
      employee.secondaryBranchIds.forEach((bId) => {
        if (bId && !list.some((item) => item.id === bId)) {
          const b = allBranches.find((item) => item.id === bId);
          list.push({
            id: bId,
            branchName: b?.branchName || `Chi nhánh #${bId}`,
            isPrimary: false,
          });
        }
      });
    }

    return list;
  }, [employee, branchesList, branches]);

  // Monthly Schedule Filter & State
  const currentMonthStr = useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [monthlySchedule, setMonthlySchedule] = useState<EmployeeMonthlySchedule | null>(null);
  const [isScheduleLoading, setIsScheduleLoading] = useState<boolean>(false);

  // Fetch monthly schedule whenever employee.id or selectedMonth changes
  useEffect(() => {
    if (!employee || !employee.id) return;
    if (activeTab !== 'SCHEDULE') return;

    let isMounted = true;
    const fetchMonthlySchedule = async () => {
      setIsScheduleLoading(true);
      try {
        if (!isMockEnabled()) {
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

            setMonthlySchedule({
              employeeId: res.employee_id || res.employeeId || employee.id,
              month: res.month || selectedMonth,
              totalShifts: res.total_shifts !== undefined ? res.total_shifts : (res.totalShifts ?? mappedShifts.length),
              totalHours: res.total_hours !== undefined ? res.total_hours : (res.totalHours ?? 0),
              earliestAvailableMonth: res.earliest_available_month || res.earliestAvailableMonth || currentMonthStr,
              shifts: mappedShifts,
            });
          }
        } else {
          // Mock mode fallback
          const filtered = Object.values(assignments)
            .flat()
            .filter((a) => a.employeeId === employee.id && a.status !== 'CANCELLED' && a.workDate.startsWith(selectedMonth));
          let totalHrs = 0;
          filtered.forEach((a) => {
            if (a.snapshotStartTime && a.snapshotEndTime) {
              const [sh, sm] = a.snapshotStartTime.split(':').map(Number);
              const [eh, em] = a.snapshotEndTime.split(':').map(Number);
              let diff = (eh * 60 + em) - (sh * 60 + sm);
              if (diff < 0) diff += 24 * 60;
              diff = Math.max(0, diff - (a.snapshotBreakMinutes || 0));
              totalHrs += diff / 60;
            }
          });
          if (isMounted) {
            setMonthlySchedule({
              employeeId: employee.id,
              month: selectedMonth,
              totalShifts: filtered.length,
              totalHours: Math.round(totalHrs * 10) / 10,
              earliestAvailableMonth: employee.hireDate ? employee.hireDate.substring(0, 7) : currentMonthStr,
              shifts: filtered,
            });
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
  }, [employee?.id, selectedMonth, activeTab, assignments, currentMonthStr]);

  // Compute available months dropdown list: from earliestAvailableMonth up to nextMonth
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

    // Ensure minMonth is not after maxMonth
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

    return list.reverse(); // latest first
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

  // Active shifts displayed for selected month
  const monthlyShifts = monthlySchedule?.shifts || [];
  const totalMonthlyHours = monthlySchedule?.totalHours ?? 0;
  const totalMonthlyShifts = monthlySchedule?.totalShifts ?? 0;
  const avgHoursPerShift = totalMonthlyShifts > 0 ? (totalMonthlyHours / totalMonthlyShifts).toFixed(1) : '0';

  // Leaves of this employee
  const employeeLeaves = employee
    ? approvedLeaves.filter((l) => l.employeeId === employee.id)
    : [];

  const handleConfirmDelete = async () => {
    if (!employee || !employee.id) return;
    setIsDeleting(true);
    try {
      if (!isMockEnabled()) {
        await employeeService.deleteEmployee(employee.id);
      }
      useDirectoryStore.getState().removeEmployeeFromDirectory(employee.id);
      if (!isMockEnabled()) {
        useDirectoryStore.getState().refreshEmployees();
      }
      addToast({
        type: 'success',
        title: 'Xóa nhân viên thành công',
        message: `Đã xóa hồ sơ nhân viên ${employee.fullName} (${employee.employeeCode}).`,
      });
      setIsDeleteModalOpen(false);
      navigate('/employees');
    } catch (err: any) {
      console.error('Xóa nhân viên thất bại:', err);
      const errorMsg =
        err?.response?.data?.error?.message ||
        err?.data?.error?.message ||
        err?.message ||
        'Không thể xóa nhân viên. Vui lòng kiểm tra lại quyền hạn hoặc ràng buộc.';
      addToast({
        type: 'error',
        title: 'Xóa nhân viên thất bại',
        message: errorMsg,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employee) return;

    // Check size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        type: 'error',
        title: 'Tập tin quá lớn',
        message: 'Kích thước ảnh tối đa cho phép là 5MB.',
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      let updatedAvatarUrl = '';
      if (!isMockEnabled()) {
        const updatedEmp = await employeeService.uploadAvatar(employee.id, file);
        updatedAvatarUrl = updatedEmp.avatar_url || (updatedEmp as any).avatarUrl || '';
      } else {
        // Mock fallback: create local object URL
        updatedAvatarUrl = URL.createObjectURL(file);
      }

      setEmployee((prev) => (prev ? { ...prev, avatarUrl: updatedAvatarUrl } : null));

      // If user is viewing their own profile, sync with useAuthStore and directory store
      if (currentUser && currentUser.id === employee.id) {
        setUser({ ...currentUser, avatarUrl: updatedAvatarUrl });
      }

      useDirectoryStore.getState().upsertEmployeeInDirectory({ ...employee, avatarUrl: updatedAvatarUrl });

      addToast({
        type: 'success',
        title: 'Cập nhật ảnh thành công',
        message: 'Ảnh đại diện đã được lưu và cập nhật trên toàn hệ thống.',
      });
    } catch (err: any) {
      console.error('Lỗi khi tải ảnh đại diện:', err);
      const msg = err?.message || err?.error?.message || 'Không thể tải ảnh đại diện lên máy chủ';
      addToast({
        type: 'error',
        title: 'Tải ảnh thất bại',
        message: msg,
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Back button */}
      <div>
        <button
          type="button"
          className="btn btn-default"
          onClick={() => navigate('/employees')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32 }}
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>
      </div>

      {isLoading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Đang tải thông tin nhân sự...
        </div>
      ) : !employee ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--color-error)', marginBottom: 16 }}>
            {loadError || 'Không tìm thấy hồ sơ nhân sự trên hệ thống.'}
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/employees')}>
            Quay lại danh sách nhân viên
          </button>
        </div>
      ) : (
        <>
          {/* Profile Header Banner */}
          <div
            className="card"
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {/* Avatar with Camera upload overlay */}
          <div
            style={{
              position: 'relative',
              width: 68,
              height: 68,
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onClick={() => fileInputRef.current?.click()}
            title="Nhấp để thay đổi ảnh đại diện"
          >
            <UserAvatar
              name={employee.fullName}
              src={employee.avatarUrl}
              size={68}
              border="3px solid var(--color-border)"
            />
            {/* Hover overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.45)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                opacity: isUploadingAvatar ? 1 : 0,
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isUploadingAvatar) e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                if (!isUploadingAvatar) e.currentTarget.style.opacity = '0';
              }}
            >
              {isUploadingAvatar ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <Camera size={18} />
                  <span style={{ fontSize: 9, fontWeight: 600, marginTop: 2 }}>Đổi ảnh</span>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              style={{ display: 'none' }}
              onChange={handleAvatarFileSelected}
              disabled={isUploadingAvatar}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 'var(--font-h2)', fontWeight: 700 }}>{employee.fullName}</h1>
              <span className="badge badge-info">{employee.employeeCode}</span>
              <EmploymentStatusBadge status={employee.employmentStatus} />
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 'var(--font-caption)', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Store size={14} color="var(--color-primary)" /> {branch?.branchName}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Briefcase size={14} color="var(--color-primary)" /> {position?.positionName}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Mail size={14} /> {employee.email}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={14} /> {employee.phoneNumber}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Nút Cập nhật / Đổi mật khẩu */}
          {canManagePassword && (
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                backgroundColor: '#F8FAFC',
                color: '#334155',
                border: '1.5px solid #CBD5E1',
                borderRadius: 'var(--radius-md, 6px)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={isSelf ? 'Đổi mật khẩu tài khoản của bạn' : 'Quản trị viên đặt lại mật khẩu cho nhân viên'}
            >
              <KeyRound size={15} color="var(--color-primary)" />
              {isSelf ? 'Đổi mật khẩu' : 'Đặt lại mật khẩu'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('AVAILABILITY')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              backgroundColor: activeTab === 'AVAILABILITY' ? '#EFF6FF' : '#FFFFFF',
              color: 'var(--color-primary, #2563EB)',
              border: '1.5px solid var(--color-primary, #2563EB)',
              borderRadius: 'var(--radius-md, 6px)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'AVAILABILITY' ? '0 1px 3px rgba(37,99,235,0.2)' : 'none',
            }}
            title="Đăng ký hoặc chỉnh sửa lịch làm việc khả dụng trong tuần"
          >
            <CalendarCheck size={16} /> Đăng Ký Lịch Làm Việc
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FECACA',
                borderRadius: 'var(--radius-md, 6px)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Xóa hồ sơ nhân viên"
              aria-label={`Xóa hồ sơ ${employee.fullName}`}
            >
              <Trash2 size={15} /> Xóa hồ sơ
            </button>
          )}
        </div>
      </div>

      {/* 5 Tabs Bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid var(--color-border-subtle)',
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={() => handleTabChange('PROFILE')}
          style={{
            padding: '10px 16px',
            fontSize: 'var(--font-body-md)',
            fontWeight: activeTab === 'PROFILE' ? 600 : 500,
            color: activeTab === 'PROFILE' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'PROFILE' ? '3px solid var(--color-primary)' : '3px solid transparent',
            marginBottom: -2,
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <User size={16} /> Lý Lịch & Hợp Đồng
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('SCHEDULE')}
          style={{
            padding: '10px 16px',
            fontSize: 'var(--font-body-md)',
            fontWeight: activeTab === 'SCHEDULE' ? 600 : 500,
            color: activeTab === 'SCHEDULE' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'SCHEDULE' ? '3px solid var(--color-primary)' : '3px solid transparent',
            marginBottom: -2,
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Calendar size={16} /> Lịch Ca {monthlySchedule ? `(${totalMonthlyShifts})` : ''}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('ATTENDANCE')}
          style={{
            padding: '10px 16px',
            fontSize: 'var(--font-body-md)',
            fontWeight: activeTab === 'ATTENDANCE' ? 600 : 500,
            color: activeTab === 'ATTENDANCE' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'ATTENDANCE' ? '3px solid var(--color-primary)' : '3px solid transparent',
            marginBottom: -2,
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Clock size={16} /> Bảng Chấm Công
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('LEAVE')}
          style={{
            padding: '10px 16px',
            fontSize: 'var(--font-body-md)',
            fontWeight: activeTab === 'LEAVE' ? 600 : 500,
            color: activeTab === 'LEAVE' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'LEAVE' ? '3px solid var(--color-primary)' : '3px solid transparent',
            marginBottom: -2,
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Palmtree size={16} /> Nghỉ Phép ({employeeLeaves.length})
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('AVAILABILITY')}
          style={{
            padding: '10px 16px',
            fontSize: 'var(--font-body-md)',
            fontWeight: activeTab === 'AVAILABILITY' ? 600 : 500,
            color: activeTab === 'AVAILABILITY' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'AVAILABILITY' ? '3px solid var(--color-primary)' : '3px solid transparent',
            marginBottom: -2,
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <CalendarCheck size={16} /> Lịch Khả Dụng / Đăng Ký Ca
        </button>
      </div>

      {/* Tab 1: Profile & Organization */}
      {activeTab === 'PROFILE' && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: 'var(--font-h3)', fontWeight: 600, marginBottom: 16 }}>
            Thông Tin Hợp Đồng & Nhân Sự
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Mã nhân viên</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{employee.employeeCode}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Họ và tên</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{employee.fullName}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Chi nhánh / Cơ sở chính (Home Branch)</div>
              <div style={{ marginTop: 4 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#1E293B' }}>
                    🏢 {branch?.branchName || 'Chưa gán'}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#4338CA',
                      backgroundColor: '#EEF2FF',
                      padding: '1px 6px',
                      borderRadius: 4,
                      border: '1px solid #C7D2FE',
                    }}
                  >
                    💼 {position?.positionName || 'Chưa gán'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Cơ sở kiêm nhiệm / Chức danh phụ trách</div>
              <div style={{ fontWeight: 500, marginTop: 4 }}>
                {employee.secondaryBranches && employee.secondaryBranches.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                    {employee.secondaryBranches.map((sb, idx) => {
                      const secBranch = (branchesList.length > 0 ? branchesList : branches).find((b) => b.id === sb.branchId);
                      const secPos = positions.find((p) => p.id === sb.positionId);
                      return (
                        <div
                          key={`${sb.branchId}-${idx}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: 6,
                            fontSize: 12,
                          }}
                        >
                          <span style={{ fontWeight: 600, color: '#1E293B' }}>
                            🏢 {sb.branchName || secBranch?.branchName || `Cơ sở #${sb.branchId}`}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#4338CA',
                              backgroundColor: '#EEF2FF',
                              padding: '1px 6px',
                              borderRadius: 4,
                              border: '1px solid #C7D2FE',
                            }}
                          >
                            💼 {sb.positionName || secPos?.positionName || 'Chưa gán'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : employee.secondaryBranchIds && employee.secondaryBranchIds.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                    {employee.secondaryBranchIds.map((bId) => {
                      const secBranch = (branchesList.length > 0 ? branchesList : branches).find((b) => b.id === bId);
                      return (
                        <span
                          key={bId}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                            padding: '2px 8px',
                            borderRadius: 4,
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          🏢 {secBranch?.branchName || `Chi nhánh #${bId}`}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span style={{ color: 'var(--color-text-muted)' }}>Chưa đăng ký cơ sở kiêm nhiệm</span>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Loại hình hợp đồng</div>
              <div style={{ marginTop: 4 }}>
                <EmploymentStatusBadge status={employee.employmentStatus} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Ngày ký hợp đồng / Vào làm</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{formatDateVi(employee.hireDate)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Shift Schedule */}
      {activeTab === 'SCHEDULE' && (
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

              {/* Reset to current month button if not currently on current month */}
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
            {/* KPI 1: Total Working Hours */}
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

            {/* KPI 2: Total Shifts */}
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

            {/* KPI 3: Average Hours per Shift */}
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
                // Calculate shift duration in hours
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
      )}

      {/* Tab 3: Attendance History */}
      {activeTab === 'ATTENDANCE' && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: 'var(--font-h3)', fontWeight: 600, marginBottom: 14 }}>
            Bảng Chấm Công Gần Nhất
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: '#fafafa',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>Hôm nay (Ca Sáng)</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Vào ca: 07:55:12 • Chưa ra ca</div>
              </div>
              <span className="badge badge-success"><span className="badge-dot" /> Có mặt</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Leave Quotas & History */}
      {activeTab === 'LEAVE' && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 'var(--font-h3)', fontWeight: 600 }}>Quỹ Phép & Đơn Nghỉ Phép</h3>
            <div style={{ padding: '6px 12px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 'var(--radius-md)', color: '#389e0d', fontWeight: 600, fontSize: 13 }}>
              Quỹ phép năm: 8.5 / 12.0 ngày còn lại
            </div>
          </div>

          {employeeLeaves.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Nhân viên chưa có đơn nghỉ phép nào trong kỳ này.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {employeeLeaves.map((l) => (
                <div
                  key={l.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--shift-leave-border)',
                    backgroundColor: 'var(--shift-leave-bg)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--shift-leave-text)' }}>{l.leaveTypeName}</div>
                    <div style={{ fontSize: 12, marginTop: 2 }}>
                      Ngày nghỉ: {formatDateVi(l.startDate)} • Lý do: {l.reason}
                    </div>
                  </div>
                  <span className="badge badge-success"><span className="badge-dot" /> Đã duyệt</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Availability / Shift Registration */}
      {activeTab === 'AVAILABILITY' && (
        <EmployeeAvailabilityTab
          employeeId={employee.id}
          employeeName={employee.fullName}
          canEdit={true}
          branchId={employee.branchId}
          assignedBranches={assignedBranches}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        employee={employee}
        branchName={branch?.branchName}
        isDeleting={isDeleting}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* Change / Reset Password Modal */}
      {employee && (
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          employeeId={employee.id}
          employeeName={employee.fullName}
          isSelf={isSelf}
          isDirectorReset={currentRole === 'ROLE_DIRECTOR'}
        />
      )}
    </>
  )}
</div>
  );
};
