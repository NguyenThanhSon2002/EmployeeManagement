import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Employee, Branch } from '@/types/domain.types';
import { EmployeeFormModal } from './components/EmployeeFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { useUIStore } from '@/shared/store/useUIStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';
import { employeeService } from './api/employeeService';
import { branchService } from '@/shared/branch/branchService';
import { isMockEnabled } from '@/config/env.config';
import { PageHeader } from '@/components/common/PageHeader';
import { Search, Plus, Eye, Edit2, Trash2, ChevronLeft, ChevronRight, X, Phone, Mail, Clock, Users } from 'lucide-react';
import { useAvailabilityStore } from './store/useAvailabilityStore';
import { useScheduleStore } from '@/features/schedule/store/useScheduleStore';

const toArray = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.content)) return res.content;
  if (res && Array.isArray(res.items)) return res.items;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
};

export const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const { employees, branches, positions } = useDirectoryStore();

  const [employeesList, setEmployeesList] = useState<Employee[]>(isMockEnabled() ? employees : []);
  const [branchesList, setBranchesList] = useState<Branch[]>(isMockEnabled() ? branches : []);
  const [isLoading, setIsLoading] = useState<boolean>(!isMockEnabled());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (isMockEnabled()) {
      if (employees.length > 0) setEmployeesList(employees);
      if (branches.length > 0) setBranchesList(branches);
    }
  }, [employees, branches]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const { currentRole, currentUser } = useAuthStore();
  const isDirector = currentRole === 'ROLE_DIRECTOR';
  const canManageStaff = isDirector || currentRole === 'ROLE_MANAGER';
  const canDelete = isDirector;
  const userBranchId = currentUser?.branchId || 1;
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isMockEnabled()) return;

    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [empRes, branchRes] = await Promise.all([
          employeeService.getEmployees({
            page: 1,
            size: 100,
            branch_id: !isDirector ? userBranchId : undefined,
          }),
          branchService.getAllBranches(),
        ]);

        if (!isMounted) return;

        const empData = toArray(empRes);
        const branchData = toArray(branchRes);

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

        const mappedEmps: Employee[] = empData.map((dto: any) => ({
          id: dto.id,
          employeeCode: dto.employee_code || dto.employeeCode,
          fullName: dto.full_name || dto.fullName,
          email: dto.email,
          phoneNumber: dto.phone_number || dto.phoneNumber || '',
          nationalId: dto.national_id || dto.nationalId || '',
          dateOfBirth: dto.date_of_birth || dto.dateOfBirth || '',
          gender: dto.gender || 'OTHER',
          address: dto.address || '',
          branchId: dto.branch_id || dto.branchId || dto.department_id || 1,
          positionId: dto.position_id || dto.positionId || 1,
          managerId: dto.manager_id || dto.managerId || null,
          employmentStatus: dto.employment_status || dto.employmentStatus || 'OFFICIAL',
          employmentType: dto.employment_type || dto.employmentType || 'FULL_TIME',
          hireDate: dto.hire_date || dto.hireDate || '2026-01-01',
          isActive: dto.is_active !== undefined ? dto.is_active : true,
          version: dto.version || 1,
        }));
        setEmployeesList(mappedEmps);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Không tải được dữ liệu nhân sự từ backend:', err);
        setEmployeesList([]);
        setLoadError('Không thể tải danh sách nhân viên từ máy chủ.');
        addToast({
          type: 'error',
          title: 'Lỗi tải dữ liệu',
          message: 'Không thể tải danh sách nhân viên từ máy chủ. Danh sách đang trống.',
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isDirector, userBranchId, addToast]);

  // Filtered List
  const filteredEmployees = useMemo(() => {
    const effectiveBranchId = !isDirector ? userBranchId : selectedBranchId;
    return employeesList.filter((emp) => {
      if (effectiveBranchId !== 0 && emp.branchId !== effectiveBranchId) {
        return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = emp.fullName.toLowerCase().includes(term);
        const matchCode = emp.employeeCode.toLowerCase().includes(term);
        const matchEmail = emp.email.toLowerCase().includes(term);
        const matchPhone = emp.phoneNumber.includes(term);
        if (!matchName && !matchCode && !matchEmail && !matchPhone) return false;
      }
      return true;
    });
  }, [employeesList, searchTerm, selectedBranchId, isDirector, userBranchId]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage]);

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setModalOpen(true);
  };

  const handleSaveEmployee = async (data: Omit<Employee, 'id'> & { id?: number }) => {
    if (!canManageStaff) {
      addToast({
        type: 'error',
        title: 'Từ chối quyền hạn',
        message: 'Tài khoản nhân viên không có quyền tạo hoặc chỉnh sửa hồ sơ nhân sự.',
      });
      return;
    }

    const payload = {
      employee_code: data.employeeCode,
      full_name: data.fullName,
      email: data.email,
      phone_number: data.phoneNumber,
      branch_id: data.branchId,
      position_id: data.positionId,
      employment_status: data.employmentStatus,
      hire_date: data.hireDate,
      is_active: data.isActive,
    } as any;

    let savedId = data.id ?? Math.max(0, ...employeesList.map((e) => e.id)) + 1;

    if (!isMockEnabled()) {
      try {
        if (data.id) {
          await employeeService.updateEmployee(data.id, payload);
        } else {
          const res = await employeeService.createEmployee({ ...payload, employment_type: 'FULL_TIME' });
          if (res && res.id) savedId = res.id;
        }
      } catch (err) {
        console.error('Lưu nhân viên thất bại:', err);
        addToast({
          type: 'error',
          title: 'Lưu thất bại',
          message: 'Không lưu được vào máy chủ. Dữ liệu chưa được thay đổi.',
        });
        return;
      }
    }

    const existingEmp = employeesList.find((e) => e.id === savedId);
    const updatedEmployee: Employee = {
      ...(existingEmp || {}),
      ...data,
      id: savedId,
    } as Employee;

    // 1. Đồng bộ tức thời vào useDirectoryStore
    useDirectoryStore.getState().upsertEmployeeInDirectory(updatedEmployee);

    // 2. Đồng bộ tức thời vào useScheduleStore
    useScheduleStore.setState((state) => {
      const idx = state.employees.findIndex((e) => e.id === savedId);
      if (idx >= 0) {
        const next = [...state.employees];
        next[idx] = { ...next[idx], ...updatedEmployee };
        return { employees: next };
      }
      return { employees: [...state.employees, updatedEmployee] };
    });
    useScheduleStore.getState().recomputeAllConflicts();

    if (data.id) {
      setEmployeesList((prev) =>
        prev.map((e) => (e.id === data.id ? updatedEmployee : e))
      );
      addToast({
        type: 'success',
        title: 'Cập nhật thành công',
        message: `Đã lưu thông tin nhân viên ${data.fullName}.`,
      });
    } else {
      setEmployeesList((prev) => [updatedEmployee, ...prev]);
      addToast({
        type: 'success',
        title: 'Thêm mới thành công',
        message: `Đã thêm nhân viên ${updatedEmployee.fullName} (${updatedEmployee.employeeCode}).`,
      });
    }
  };

  const getBranchName = (id: number) => {
    return branchesList.find((b) => b.id === id)?.branchName || '---';
  };

  const getPositionName = (id: number) => {
    return positions.find((p) => p.id === id)?.positionName || '---';
  };

  const handleConfirmDelete = async () => {
    if (!canDelete || !deletingEmployee) {
      if (!canDelete) {
        addToast({
          type: 'error',
          title: 'Từ chối quyền hạn',
          message: 'Chỉ Giám đốc mới có quyền xóa hồ sơ nhân sự.',
        });
      }
      return;
    }
    setIsDeleting(true);
    try {
      if (!isMockEnabled()) {
        await employeeService.deleteEmployee(deletingEmployee.id);
      }
      setEmployeesList((prev) => prev.filter((e) => e.id !== deletingEmployee.id));
      useDirectoryStore.getState().removeEmployeeFromDirectory(deletingEmployee.id);
      if (!isMockEnabled()) {
        useDirectoryStore.getState().refreshEmployees();
      }
      addToast({
        type: 'success',
        title: 'Xóa nhân viên thành công',
        message: `Đã xóa hồ sơ nhân viên ${deletingEmployee.fullName} (${deletingEmployee.employeeCode}).`,
      });
      setDeletingEmployee(null);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header & Add Button */}
      <PageHeader
        icon={<Users size={20} />}
        title="Quản Lý Hồ Sơ Nhân Sự"
        subtitle="Danh mục hồ sơ nhân viên, chức danh, chi nhánh làm việc và lịch khả dụng theo ma trận ca."
        action={
          canManageStaff ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenAdd}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Plus size={16} /> Thêm nhân viên mới
            </button>
          ) : undefined
        }
      />

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: '12px 18px',
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', width: 290 }}>
            <Search
              size={15}
              color="var(--color-text-muted)"
              style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="input-base"
              placeholder="Tìm theo họ tên, mã NV, email, SĐT..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                paddingLeft: 34,
                paddingRight: searchTerm ? 28 : 10,
                height: 36,
                fontSize: '12.5px',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Branch Filter */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <select
              className="input-base"
              value={!isDirector ? userBranchId : selectedBranchId}
              disabled={!isDirector}
              onChange={(e) => {
                if (!isDirector) return;
                setSelectedBranchId(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                height: 36,
                fontSize: '12.5px',
                minWidth: 220,
                fontWeight: 500,
                backgroundColor: !isDirector ? '#F1F5F9' : '#FFFFFF',
                color: !isDirector ? '#475569' : 'inherit',
                cursor: !isDirector ? 'not-allowed' : 'pointer',
                borderColor: 'var(--color-border-subtle, #E2E8F0)',
                paddingRight: 12,
              }}
              title={
                !isDirector
                  ? 'Bạn chỉ có quyền xem nhân sự thuộc chi nhánh làm việc của mình.'
                  : 'Lọc nhân viên theo chi nhánh'
              }
            >
              {isDirector && <option value={0}>Tất cả chi nhánh</option>}
              {branchesList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branchName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            backgroundColor: '#F8FAFC',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          Hiển thị <strong style={{ color: 'var(--color-primary)' }}>{filteredEmployees.length}</strong> kết quả
        </div>
      </div>

      {/* Employee Data Table */}
      <div className="card" style={{ overflowX: 'auto', borderRadius: 'var(--radius-xl)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr
              style={{
                backgroundColor: '#F8FAFC',
                borderBottom: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                fontSize: 12.5,
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              <th style={{ padding: '12px 16px' }}>Mã NV</th>
              <th style={{ padding: '12px 16px' }}>Họ và Tên</th>
              <th style={{ padding: '12px 16px' }}>Chi Nhánh</th>
              <th style={{ padding: '12px 16px' }}>Chức Danh</th>
              <th style={{ padding: '12px 16px' }}>Liên Hệ</th>
              <th style={{ padding: '12px 16px' }}>Trạng Thái</th>
              <th style={{ padding: '12px 16px' }}>Lịch Khả Dụng</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Đang tải danh sách nhân sự từ máy chủ...
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--color-error)' }}>
                  {loadError}
                </td>
              </tr>
            ) : paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Không tìm thấy nhân viên nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp) => {
                const isResigned = emp.employmentStatus === 'RESIGNED';
                let badge = (
                  <span className="badge badge-success">
                    <span className="badge-dot" /> Chính thức
                  </span>
                );
                if (emp.employmentStatus === 'PROBATION') {
                  badge = (
                    <span className="badge badge-warning">
                      <span className="badge-dot" /> Thử việc
                    </span>
                  );
                } else if (emp.employmentStatus === 'RESIGNED' || !emp.isActive) {
                  badge = (
                    <span className="badge badge-error">
                      <span className="badge-dot" /> Đã nghỉ việc
                    </span>
                  );
                } else if (emp.employmentStatus === 'ON_LEAVE') {
                  badge = (
                    <span className="badge badge-info">
                      <span className="badge-dot" /> Nghỉ chế độ
                    </span>
                  );
                }

                return (
                  <tr
                    key={emp.id}
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle)',
                      transition: 'background-color var(--transition-fast), opacity var(--transition-fast)',
                      opacity: isResigned ? 0.55 : 1,
                      backgroundColor: isResigned ? '#F8FAFC' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: isResigned ? 'var(--color-text-muted)' : 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {emp.employeeCode}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={
                            emp.avatarUrl ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                          }
                          alt={emp.fullName}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 'var(--radius-full)',
                            objectFit: 'cover',
                            border: '1.5px solid var(--color-border)',
                            filter: isResigned ? 'grayscale(100%)' : 'none',
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: isResigned ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>{emp.fullName}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={11} /> {emp.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#F1F5F9',
                          fontSize: '12px',
                        }}
                      >
                        {getBranchName(emp.branchId)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                      {getPositionName(emp.positionId)}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                        <Phone size={12} color="var(--color-text-muted)" />
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{emp.phoneNumber}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{badge}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {isResigned ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-md, 6px)',
                            fontSize: 12,
                            fontWeight: 500,
                            backgroundColor: '#F1F5F9',
                            color: '#94A3B8',
                            border: '1px solid #E2E8F0',
                            cursor: 'not-allowed',
                            userSelect: 'none',
                          }}
                          title="Nhân viên đã nghỉ việc không thể đăng ký lịch khả dụng"
                        >
                          <Clock size={13} color="#94A3B8" />
                          Đã nghỉ việc
                        </span>
                      ) : (() => {
                        const empAvail = useAvailabilityStore.getState().getAvailability(emp.id);
                        let totalAvailSlots = 0;
                        for (let d = 1; d <= 7; d++) {
                          totalAvailSlots += (empAvail[d] || []).length;
                        }
                        return (
                          <button
                            type="button"
                            onClick={() => navigate(`/employees/${emp.id}?tab=AVAILABILITY`)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-md, 6px)',
                              fontSize: 12,
                              fontWeight: 600,
                              backgroundColor: totalAvailSlots > 0 ? '#ECFDF5' : '#F8FAFC',
                              color: totalAvailSlots > 0 ? '#047857' : '#64748B',
                              border: totalAvailSlots > 0 ? '1px solid #A7F3D0' : '1px dashed #CBD5E1',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            title="Bấm để đăng ký / chỉnh sửa lịch làm việc khả dụng"
                            aria-label={`Lịch làm việc khả dụng ${emp.fullName}`}
                          >
                            <Clock size={13} color={totalAvailSlots > 0 ? '#10B981' : '#94A3B8'} />
                            {totalAvailSlots > 0 ? `${totalAvailSlots} ca rảnh/tuần` : 'Chưa đăng ký'}
                          </button>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-default"
                          onClick={() => !isResigned && navigate(`/employees/${emp.id}?tab=AVAILABILITY`)}
                          disabled={isResigned}
                          style={{
                            padding: '0 8px',
                            height: 32,
                            color: isResigned ? '#94A3B8' : 'var(--color-primary, #2563EB)',
                            backgroundColor: isResigned ? '#F1F5F9' : '#EFF6FF',
                            borderColor: isResigned ? '#E2E8F0' : '#BFDBFE',
                            cursor: isResigned ? 'not-allowed' : 'pointer',
                            opacity: isResigned ? 0.6 : 1,
                          }}
                          title={isResigned ? 'Nhân viên đã nghỉ việc không thể đăng ký lịch' : 'Khai báo lịch làm việc khả dụng'}
                        >
                          <Clock size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-default"
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          style={{ padding: '0 8px', height: 32 }}
                          title="Xem chi tiết hồ sơ"
                        >
                          <Eye size={14} />
                        </button>
                        {canManageStaff && (
                          <button
                            type="button"
                            className="btn btn-default"
                            onClick={() => handleOpenEdit(emp)}
                            style={{ padding: '0 8px', height: 32 }}
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => setDeletingEmployee(emp)}
                            style={{ padding: '0 8px', height: 32 }}
                            title="Xóa hồ sơ nhân viên"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Toolbar */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--color-border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            fontSize: '12.5px',
            color: 'var(--color-text-secondary)',
          }}
        >
          <div>
            Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong> (Tổng cộng {filteredEmployees.length} nhân viên)
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="btn btn-default"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{ height: 32, padding: '0 10px' }}
            >
              <ChevronLeft size={15} /> Trước
            </button>
            <button
              type="button"
              className="btn btn-default"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{ height: 32, padding: '0 10px' }}
            >
              Sau <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Employee Modal Form */}
      <EmployeeFormModal
        isOpen={modalOpen}
        initialData={editingEmployee}
        branches={branchesList}
        positions={positions}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveEmployee}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingEmployee}
        employee={deletingEmployee}
        branchName={deletingEmployee ? getBranchName(deletingEmployee.branchId) : undefined}
        isDeleting={isDeleting}
        onClose={() => setDeletingEmployee(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
