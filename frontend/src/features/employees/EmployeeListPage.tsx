import React, { useState, useMemo, useEffect } from 'react';
import type { Employee, Branch } from '@/types/domain.types';
import { EmployeeFormModal } from './components/EmployeeFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { EmployeeFiltersBar } from './components/list/EmployeeFiltersBar';
import { EmployeeTable } from './components/list/EmployeeTable';
import { EmployeePagination } from './components/list/EmployeePagination';
import { useUIStore } from '@/shared/store/useUIStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';
import { employeeService } from './api/employeeService';
import { mapDtoToEmployee, mapDtoToBranch, mapEmployeeToPayload } from './api/employeeMapper';
import { branchService } from '@/shared/branch/branchService';
import { PageHeader } from '@/components/common/PageHeader';
import { Plus, Users } from 'lucide-react';
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
  const { addToast } = useUIStore();
  const { positions } = useDirectoryStore();
  const { fetchBranchAvailabilities, availabilities } = useAvailabilityStore();

  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [branchesList, setBranchesList] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [expandedEmployeeIds, setExpandedEmployeeIds] = useState<number[]>([]);

  const toggleExpandEmployee = (id: number) => {
    setExpandedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

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

        const mappedBranches: Branch[] = branchData.map(mapDtoToBranch);
        setBranchesList(mappedBranches);

        const mappedEmps: Employee[] = empData.map(mapDtoToEmployee);
        setEmployeesList(mappedEmps);

        // Nạp ngay lịch khả dụng sau khi lấy danh sách chi nhánh
        if (!isDirector) {
          fetchBranchAvailabilities(userBranchId);
        } else if (selectedBranchId !== 0) {
          fetchBranchAvailabilities(selectedBranchId);
        } else if (mappedBranches.length > 0) {
          mappedBranches.forEach((b) => {
            fetchBranchAvailabilities(b.id);
          });
        }
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
  }, [isDirector, userBranchId, selectedBranchId, fetchBranchAvailabilities, addToast]);

  // Cập nhật khi thay đổi dropdown lọc chi nhánh
  useEffect(() => {
    if (selectedBranchId !== 0) {
      fetchBranchAvailabilities(selectedBranchId);
    } else if (branchesList.length > 0) {
      branchesList.forEach((b) => fetchBranchAvailabilities(b.id));
    }
  }, [selectedBranchId, branchesList, fetchBranchAvailabilities]);

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

    const payload = mapEmployeeToPayload(data);

    let savedId = data.id ?? 0;
    let serverRes: any = null;

    try {
      if (data.id) {
        serverRes = await employeeService.updateEmployee(data.id, payload);
      } else {
        const res = await employeeService.createEmployee({ ...payload, employment_type: 'FULL_TIME' });
        if (res && res.id) savedId = res.id;
        serverRes = res;
      }
    } catch (err: any) {
      console.error('Lưu nhân viên thất bại:', err);
      const errorMsg = err?.message || 'Không lưu được vào máy chủ. Dữ liệu chưa được thay đổi.';
      addToast({
        type: 'error',
        title: 'Lưu thất bại',
        message: errorMsg,
      });
      return;
    }

    const effectiveBranchId = serverRes?.branch_id || serverRes?.branchId || data.branchId;
    const existingEmp = employeesList.find((e) => e.id === savedId);
    const updatedEmployee: Employee = {
      ...(existingEmp || {}),
      ...data,
      id: savedId,
      branchId: effectiveBranchId,
    } as Employee;

    // Đồng bộ tức thời vào useDirectoryStore
    useDirectoryStore.getState().upsertEmployeeInDirectory(updatedEmployee);

    // Đồng bộ tức thời vào useScheduleStore
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

    // Làm mới danh bạ Directory Store từ máy chủ để toàn bộ các màn hình khác cập nhật ngay tức thì
    useDirectoryStore.getState().refreshEmployees().catch((err) => {
      console.warn('Lỗi làm mới Directory Store sau khi cập nhật nhân viên:', err);
    });
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
      await employeeService.deleteEmployee(deletingEmployee.id);
      setEmployeesList((prev) => prev.filter((e) => e.id !== deletingEmployee.id));
      useDirectoryStore.getState().removeEmployeeFromDirectory(deletingEmployee.id);
      useDirectoryStore.getState().refreshEmployees();
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
            subtitle="Danh mục hồ sơ nhân viên, chức danh, chi nhánh làm việc và lịch khả dụng theo ca."
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
        <EmployeeFiltersBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setCurrentPage={setCurrentPage}
          branchesList={branchesList}
          selectedBranchId={selectedBranchId}
          setSelectedBranchId={setSelectedBranchId}
          isDirector={isDirector}
          userBranchId={userBranchId}
          totalResults={filteredEmployees.length}
        />

        {/* Employee Data Table */}
        <EmployeeTable
          isLoading={isLoading}
          loadError={loadError}
          employees={paginatedEmployees}
          availabilities={availabilities}
          getBranchName={getBranchName}
          getPositionName={getPositionName}
          expandedEmployeeIds={expandedEmployeeIds}
          toggleExpandEmployee={toggleExpandEmployee}
          canManageStaff={canManageStaff}
          canDelete={canDelete}
          onEdit={handleOpenEdit}
          onDelete={setDeletingEmployee}
        />

        {/* Pagination Toolbar */}
        {filteredEmployees.length > 0 && (
          <EmployeePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={filteredEmployees.length}
            setCurrentPage={setCurrentPage}
          />
        )}

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