import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Employee } from '@/types/domain.types';
import { MOCK_EMPLOYEES } from '@/data/mock/employees.mock';
import { MOCK_DEPARTMENTS } from '@/data/mock/departments.mock';
import { MOCK_POSITIONS } from '@/data/mock/positions.mock';
import { EmployeeFormModal } from './components/EmployeeFormModal';
import { useUIStore } from '@/store/useUIStore';
import { Search, Plus, Eye, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';

export const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useUIStore();

  const [employeesList, setEmployeesList] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

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

  const handleSaveEmployee = (data: Omit<Employee, 'id'> & { id?: number }) => {
    if (data.id) {
      // Edit
      setEmployeesList((prev) =>
        prev.map((e) => (e.id === data.id ? ({ ...e, ...data } as Employee) : e))
      );
      addToast({
        type: 'success',
        title: 'Cập nhật thành công',
        message: `Đã lưu thông tin nhân viên ${data.fullName}.`,
      });
    } else {
      // Add
      const newEmp: Employee = {
        ...data,
        id: Math.max(...employeesList.map((e) => e.id)) + 1,
      };
      setEmployeesList((prev) => [newEmp, ...prev]);
      addToast({
        type: 'success',
        title: 'Thêm mới thành công',
        message: `Đã thêm nhân viên ${newEmp.fullName} (${newEmp.employeeCode}).`,
      });
    }
  };

  const getDeptName = (id: number) => {
    return MOCK_DEPARTMENTS.find((d) => d.id === id)?.departmentName || '---';
  };

  const getPositionName = (id: number) => {
    return MOCK_POSITIONS.find((p) => p.id === id)?.positionName || '---';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header & Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-h1)', fontWeight: 600 }}>Quản Lý Hồ Sơ Nhân Sự</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 2, fontSize: 'var(--font-body)' }}>
            Danh sách toàn bộ 25 nhân sự công ty, quản lý chức danh, phòng ban và hợp đồng.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleOpenAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> Thêm nhân viên
        </button>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: '10px 16px',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', width: 280 }}>
            <Search
              size={16}
              color="var(--color-text-muted)"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
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
              style={{ width: '100%', paddingLeft: 32, height: 34, fontSize: 'var(--font-caption)' }}
            />
          </div>

          {/* Department Filter */}
          <select
            className="input-base"
            value={selectedDeptId}
            onChange={(e) => {
              setSelectedDeptId(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{ height: 34, fontSize: 'var(--font-caption)', minWidth: 200 }}
          >
            <option value={0}>Tất cả phòng ban</option>
            {MOCK_DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.departmentName}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: 'var(--font-caption)', color: 'var(--color-text-muted)' }}>
          Hiển thị <strong>{filteredEmployees.length}</strong> kết quả
        </div>
      </div>

      {/* Employee Data Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-body)' }}>
          <thead>
            <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 13 }}>
              <th style={{ padding: '12px 16px' }}>Mã NV</th>
              <th style={{ padding: '12px 16px' }}>Họ và Tên</th>
              <th style={{ padding: '12px 16px' }}>Phòng Ban</th>
              <th style={{ padding: '12px 16px' }}>Chức Danh</th>
              <th style={{ padding: '12px 16px' }}>Số Điện Thoại</th>
              <th style={{ padding: '12px 16px' }}>Trạng Thái</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Không tìm thấy nhân viên nào phù hợp.
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp) => {
                let badge = <span className="badge badge-success"><span className="badge-dot" /> Chính thức</span>;
                if (emp.employmentStatus === 'PROBATION') {
                  badge = <span className="badge badge-warning"><span className="badge-dot" /> Thử việc</span>;
                } else if (emp.employmentStatus === 'RESIGNED' || !emp.isActive) {
                  badge = <span className="badge badge-error"><span className="badge-dot" /> Đã nghỉ việc</span>;
                } else if (emp.employmentStatus === 'ON_LEAVE') {
                  badge = <span className="badge badge-info"><span className="badge-dot" /> Nghỉ chế độ</span>;
                }

                return (
                  <tr
                    key={emp.id}
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle)',
                      transition: 'background-color 0.1s ease',
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {emp.employeeCode}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                          alt={emp.fullName}
                          style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>{emp.fullName}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                      {getDeptName(emp.departmentId)}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                      {getPositionName(emp.positionId)}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                      {emp.phoneNumber}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{badge}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-default"
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          style={{ padding: '0 8px', height: 30 }}
                          title="Xem chi tiết hồ sơ 360 độ"
                          aria-label={`Xem chi tiết ${emp.fullName}`}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-default"
                          onClick={() => handleOpenEdit(emp)}
                          style={{ padding: '0 8px', height: 30 }}
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
            padding: '12px 16px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--font-caption)',
            color: 'var(--color-text-secondary)',
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
              style={{ height: 30, padding: '0 8px' }}
            >
              <ChevronLeft size={16} /> Trước
            </button>
            <button
              type="button"
              className="btn btn-default"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{ height: 30, padding: '0 8px' }}
            >
              Sau <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Employee Modal Form */}
      <EmployeeFormModal
        isOpen={modalOpen}
        initialData={editingEmployee}
        departments={MOCK_DEPARTMENTS}
        positions={MOCK_POSITIONS}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveEmployee}
      />
    </div>
  );
};
