import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { Employee, Branch } from '@/types/domain.types';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { EmployeeAvailabilityTab } from './components/EmployeeAvailabilityTab';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { EmployeeProfileTab } from './components/detail/EmployeeProfileTab';
import { EmployeeScheduleTab } from './components/detail/EmployeeScheduleTab';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';
import { useScheduleStore } from '@/features/schedule/store/useScheduleStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { employeeService } from './api/employeeService';
import { mapDtoToEmployee, mapDtoToBranch } from './api/employeeMapper';
import { branchService } from '@/shared/branch/branchService';
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
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { approvedLeaves } = useScheduleStore();
  const { getEmployeeById, branches, positions } = useDirectoryStore();
  const cachedEmployee = id ? getEmployeeById(Number(id)) : undefined;

  const [employee, setEmployee] = useState<Employee | null>(cachedEmployee || null);

  const isSelf = Boolean(currentUser && employee && currentUser.id === employee.id);
  const canManagePassword = isSelf || currentRole === 'ROLE_DIRECTOR';
  const [branchesList, setBranchesList] = useState<Branch[]>(branches);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedEmployee);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

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
          setBranchesList(branchData.map(mapDtoToBranch));
        }

        if (empData) {
          setEmployee(mapDtoToEmployee(empData));
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

  // Monthly Schedule count state (updated by EmployeeScheduleTab)
  const [totalMonthlyShifts, setTotalMonthlyShifts] = useState<number>(0);

  // Leaves of this employee
  const employeeLeaves = employee
    ? approvedLeaves.filter((l) => l.employeeId === employee.id)
    : [];

  const handleConfirmDelete = async () => {
    if (!employee || !employee.id) return;
    setIsDeleting(true);
    try {
      await employeeService.deleteEmployee(employee.id);
      useDirectoryStore.getState().removeEmployeeFromDirectory(employee.id);
      useDirectoryStore.getState().refreshEmployees();
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
      const updatedEmp = await employeeService.uploadAvatar(employee.id, file);
      const updatedAvatarUrl = updatedEmp.avatar_url || (updatedEmp as any).avatarUrl || '';

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

  const handleDeleteAvatar = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!employee || !employee.avatarUrl || isDeletingAvatar) return;

    if (!window.confirm(`Bạn có chắc chắn muốn xóa ảnh đại diện của ${employee.fullName} không?`)) {
      return;
    }

    setIsDeletingAvatar(true);
    try {
      await employeeService.deleteAvatar(employee.id);

      setEmployee((prev) => (prev ? { ...prev, avatarUrl: '' } : null));

      if (currentUser && currentUser.id === employee.id) {
        setUser({ ...currentUser, avatarUrl: '' });
      }

      useDirectoryStore.getState().upsertEmployeeInDirectory({ ...employee, avatarUrl: '' });

      addToast({
        type: 'success',
        title: 'Đã xóa ảnh đại diện',
        message: 'Ảnh đại diện đã được gỡ bỏ và trở về biểu tượng chữ cái mặc định.',
      });
    } catch (err: any) {
      console.error('Lỗi khi xóa ảnh đại diện:', err);
      const msg = err?.message || err?.error?.message || 'Không thể xóa ảnh đại diện trên máy chủ';
      addToast({
        type: 'error',
        title: 'Xóa ảnh thất bại',
        message: msg,
      });
    } finally {
      setIsDeletingAvatar(false);
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
          {/* Avatar with Camera upload overlay & Delete button */}
          <div style={{ position: 'relative', width: 68, height: 68, flexShrink: 0 }}>
            <div
              style={{
                position: 'relative',
                width: 68,
                height: 68,
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
                cursor: 'pointer',
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
                  opacity: isUploadingAvatar || isDeletingAvatar ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isUploadingAvatar && !isDeletingAvatar) e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  if (!isUploadingAvatar && !isDeletingAvatar) e.currentTarget.style.opacity = '0';
                }}
              >
                {isUploadingAvatar || isDeletingAvatar ? (
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
                disabled={isUploadingAvatar || isDeletingAvatar}
              />
            </div>

            {/* Nút xóa ảnh đại diện nếu đang có ảnh */}
            {Boolean(employee.avatarUrl && employee.avatarUrl.trim()) && (
              <button
                type="button"
                onClick={handleDeleteAvatar}
                disabled={isDeletingAvatar || isUploadingAvatar}
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  border: '2px solid #FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isDeletingAvatar ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  transition: 'all 0.15s ease',
                  zIndex: 10,
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isDeletingAvatar) {
                    e.currentTarget.style.transform = 'scale(1.15)';
                    e.currentTarget.style.backgroundColor = '#DC2626';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeletingAvatar) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.backgroundColor = '#EF4444';
                  }
                }}
                title="Xóa ảnh đại diện này"
                aria-label="Xóa ảnh đại diện"
              >
                {isDeletingAvatar ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Trash2 size={12} strokeWidth={2.5} />
                )}
              </button>
            )}
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
          <Calendar size={16} /> Lịch Ca {totalMonthlyShifts > 0 ? `(${totalMonthlyShifts})` : ''}
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
        <EmployeeProfileTab
          employee={employee}
          branch={branch}
          position={position}
          branchesList={branchesList}
          branches={branches}
          positions={positions}
        />
      )}

      {/* Tab 2: Shift Schedule */}
      {activeTab === 'SCHEDULE' && (
        <EmployeeScheduleTab
          employee={employee}
          onTotalShiftsChange={setTotalMonthlyShifts}
        />
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
