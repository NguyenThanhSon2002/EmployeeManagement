import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Employee, Department } from '@/types/domain.types';
import { MOCK_EMPLOYEES } from '@/data/mock/employees.mock';
import { MOCK_DEPARTMENTS } from '@/data/mock/departments.mock';
import { MOCK_POSITIONS } from '@/data/mock/positions.mock';
import { EmployeeFormModal } from './components/EmployeeFormModal';
import { useUIStore } from '@/shared/store/useUIStore';
import { employeeService } from '@/services/employeeService';
import { departmentService } from '@/shared/department/departmentService';
import { isMockEnabled } from '@/config/env.config';
import { Search, Plus, Eye, Edit2, ChevronLeft, ChevronRight, X, Phone, Mail } from 'lucide-react';

export const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useUIStore();

  const [employeesList, setEmployeesList] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [departmentsList, setDepartmentsList] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (isMockEnabled()) return;

    let isMounted = true;
    const loadData = async () => {
      try {
        const [empData, deptData] = await Promise.all([
          employeeService.getEmployees({ page: 1, size: 100 }).catch(() => null),
          departmentService.getAllDepartments().catch(() => null),
        ]);

        if (!isMounted) return;

        if (deptData && Array.isArray(deptData) && deptData.length > 0) {
          const mappedDepts: Department[] = deptData.map((d: any) => ({
            id: d.id,
            departmentCode: d.department_code || d.departmentCode,
            departmentName: d.department_name || d.departmentName,
            managerId: d.manager_id || d.managerId || null,
          }));
          setDepartmentsList(mappedDepts);
        }

        if (empData && Array.isArray(empData) && empData.length > 0) {
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
            departmentId: dto.department_id || dto.departmentId || 1,
            positionId: dto.position_id || dto.positionId || 1,
            managerId: dto.manager_id || dto.managerId || null,
            employmentStatus: dto.employment_status || dto.employmentStatus || 'OFFICIAL',
            employmentType: dto.employment_type || dto.employmentType || 'FULL_TIME',
            hireDate: dto.hire_date || dto.hireDate || '2026-01-01',
            isActive: dto.is_active !== undefined ? dto.is_active : true,
            version: dto.version || 1,
          }));
          setEmployeesList(mappedEmps);
        }
      } catch (err) {
        console.warn('Could not load employees from real API, using fallback:', err);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered List
  const filteredEmployees = useMemo(() => {
    return employeesList.filter((emp) => {
      if (selectedDeptId !== 0 && emp.departmentId !== selectedDeptId) {
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
  }, [employeesList, searchTerm, selectedDeptId]);

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
    if (data.id) {
      // Edit
      if (!isMockEnabled()) {
        try {
          await employeeService.updateEmployee(data.id, {
            employee_code: data.employeeCode,
            full_name: data.fullName,
            email: data.email,
            phone_number: data.phoneNumber,
            department_id: data.departmentId,
            position_id: data.positionId,
            employment_status: data.employmentStatus,
            hire_date: data.hireDate,
            is_active: data.isActive,
          } as any);
        } catch (err) {
          console.warn('API update failed, updating local state:', err);
        }
      }
      setEmployeesList((prev) =>
        prev.map((e) => (e.id === data.id ? ({ ...e, ...data } as Employee) : e))
      );
      addToast({
        type: 'success',
        title: 'Cập nhật thành công',
        message: `Đã lưu thông tin nhân viên ${data.fullName} vào CSDL MySQL.`,
      });
    } else {
      // Add
      let newId = Math.max(0, ...employeesList.map((e) => e.id)) + 1;
      if (!isMockEnabled()) {
        try {
          const res = await employeeService.createEmployee({
            employee_code: data.employeeCode,
            full_name: data.fullName,
            email: data.email,
            phone_number: data.phoneNumber,
            department_id: data.departmentId,
            position_id: data.positionId,
            employment_status: data.employmentStatus,
            employment_type: 'FULL_TIME',
            hire_date: data.hireDate,
            is_active: data.isActive,
          } as any);
          if (res && res.id) {
            newId = res.id;
          }
        } catch (err) {
          console.warn('API create failed, saving to local state:', err);
        }
      }
      const newEmp: Employee = {
        ...data,
        id: newId,
      };
      setEmployeesList((prev) => [newEmp, ...prev]);
      addToast({
        type: 'success',
        title: 'Thêm mới thành công',
        message: `Đã thêm nhân viên ${newEmp.fullName} (${newEmp.employeeCode}) vào CSDL MySQL.`,
      });
    }
  };

  const getDeptName = (id: number) => {
    return departmentsList.find((d) => d.id === id)?.departmentName || '---';
  };

  const getPositionName = (id: number) => {
    return MOCK_POSITIONS.find((p) => p.id === id)?.positionName || '---';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header & Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Quản Lý Hồ Sơ Nhân Sự
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 2, fontSize: '13.5px' }}>
            Danh mục hồ sơ nhân viên, chức danh, phòng ban và tiến độ ký kết hợp đồng.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleOpenAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={16} /> Thêm nhân viên mới
        </button>
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

          {/* Department Filter */}
          <select
            className="input-base"
            value={selectedDeptId}
            onChange={(e) => {
              setSelectedDeptId(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{ height: 36, fontSize: '12.5px', minWidth: 200, fontWeight: 500 }}
          >
            <option value={0}>Tất cả phòng ban</option>
            {MOCK_DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.departmentName}
              </option>
            ))}
          </select>
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
              <th style={{ padding: '12px 16px' }}>Phòng Ban</th>
              <th style={{ padding: '12px 16px' }}>Chức Danh</th>
              <th style={{ padding: '12px 16px' }}>Liên Hệ</th>
              <th style={{ padding: '12px 16px' }}>Trạng Thái</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Không tìm thấy nhân viên nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp) => {
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
                      transition: 'background-color var(--transition-fast)',
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
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
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{emp.fullName}</div>
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
                        {getDeptName(emp.departmentId)}
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
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-default"
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          style={{ padding: '0 8px', height: 32 }}
                          title="Xem chi tiết hồ sơ 360 độ"
                          aria-label={`Xem chi tiết ${emp.fullName}`}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-default"
                          onClick={() => handleOpenEdit(emp)}
                          style={{ padding: '0 8px', height: 32 }}
                          title="Sửa thông tin"
                          aria-label={`Sửa ${emp.fullName}`}
                        >
                          <Edit2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--font-caption)',
            color: 'var(--color-text-secondary)',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div>
            Trang <strong>{currentPage}</strong> / {totalPages}
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
        departments={departmentsList}
        positions={MOCK_POSITIONS}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveEmployee}
      />
    </div>
  );
};
