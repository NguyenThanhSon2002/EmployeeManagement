import React, { useState, useMemo, useEffect } from 'react';
import type { Branch } from '@/types/domain.types';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { BranchFormModal } from './components/BranchFormModal';
import { DeleteBranchModal } from './components/DeleteBranchModal';
import {
  Building2,
  Plus,
  Search,
  X,
  Phone,
  MapPin,
  Users,
  CheckCircle2,
  ShieldCheck,
  Edit2,
  Trash2,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

export const BranchesPage: React.FC = () => {
  const { addToast } = useUIStore();
  const { currentRole } = useAuthStore();
  const {
    branches,
    employees,
    isLoaded,
    isLoading: isStoreLoading,
    fetchDirectory,
    createBranch,
    updateBranch,
    deleteBranch,
  } = useDirectoryStore();

  const isDirector = currentRole === 'ROLE_DIRECTOR';

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize data if not yet loaded
  useEffect(() => {
    if (!isLoaded) {
      fetchDirectory().catch((err) => {
        console.error('Failed to load directory data:', err);
      });
    }
  }, [isLoaded, fetchDirectory]);

  // List of potential managers (Directors & Managers)
  const managers = useMemo(() => {
    return employees.filter(
      (e) => e.isActive && e.employmentStatus !== 'RESIGNED' && (e.positionId === 1 || e.positionId === 2)
    );
  }, [employees]);

  // Map employee count per branch
  const branchEmployeeCountMap = useMemo(() => {
    const map = new Map<number, number>();
    employees.forEach((emp) => {
      if (emp.isActive && emp.employmentStatus !== 'RESIGNED' && emp.branchId) {
        map.set(emp.branchId, (map.get(emp.branchId) || 0) + 1);
      }
    });
    return map;
  }, [employees]);

  // KPI calculations
  const totalBranches = branches.length;
  const activeBranches = useMemo(() => branches.filter((b) => b.isActive), [branches]);
  const activeRate = totalBranches > 0 ? Math.round((activeBranches.length / totalBranches) * 100) : 0;

  const largestBranch = useMemo(() => {
    if (branches.length === 0) return null;
    let maxBranch: Branch = branches[0];
    let maxCount = branchEmployeeCountMap.get(branches[0].id) || 0;

    for (let i = 1; i < branches.length; i++) {
      const b = branches[i];
      const count = branchEmployeeCountMap.get(b.id) || 0;
      if (count > maxCount) {
        maxCount = count;
        maxBranch = b;
      }
    }
    return { branch: maxBranch, count: maxCount };
  }, [branches, branchEmployeeCountMap]);

  // Filtered branches
  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      // Status filter
      if (statusFilter === 'ACTIVE' && !branch.isActive) return false;
      if (statusFilter === 'INACTIVE' && branch.isActive) return false;

      // Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const codeMatch = branch.branchCode.toLowerCase().includes(query);
        const nameMatch = branch.branchName.toLowerCase().includes(query);
        const addrMatch = (branch.address || '').toLowerCase().includes(query);
        const phoneMatch = (branch.phoneNumber || '').toLowerCase().includes(query);

        const manager = employees.find((e) => e.id === branch.managerId);
        const managerMatch = manager ? manager.fullName.toLowerCase().includes(query) : false;

        return codeMatch || nameMatch || addrMatch || phoneMatch || managerMatch;
      }

      return true;
    });
  }, [branches, statusFilter, searchTerm, employees]);

  // Actions
  const handleOpenCreate = () => {
    setFormMode('create');
    setSelectedBranch(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setFormMode('edit');
    setSelectedBranch(branch);
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (branch: Branch) => {
    setBranchToDelete(branch);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (data: Partial<Branch>) => {
    setIsSaving(true);
    try {
      if (formMode === 'create') {
        const created = await createBranch(data);
        addToast({
          type: 'success',
          title: 'Tạo chi nhánh thành công',
          message: `Đã thêm chi nhánh ${created.branchName} (${created.branchCode}) vào hệ thống.`,
        });
      } else if (formMode === 'edit' && selectedBranch) {
        const updated = await updateBranch(selectedBranch.id, data);
        addToast({
          type: 'success',
          title: 'Cập nhật thành công',
          message: `Đã lưu thay đổi cho chi nhánh ${updated.branchName}.`,
        });
      }
      setIsFormModalOpen(false);
    } catch (err: any) {
      console.error('Error saving branch:', err);
      addToast({
        type: 'error',
        title: 'Thao tác thất bại',
        message: err.message || 'Không thể lưu thông tin chi nhánh. Vui lòng thử lại.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!branchToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBranch(branchToDelete.id);
      addToast({
        type: 'success',
        title: 'Đã xóa chi nhánh',
        message: `Chi nhánh ${branchToDelete.branchName} đã được xóa thành công.`,
      });
      setIsDeleteModalOpen(false);
      setBranchToDelete(null);
    } catch (err: any) {
      console.error('Error deleting branch:', err);
      addToast({
        type: 'error',
        title: 'Không thể xóa chi nhánh',
        message: err.message || 'Có lỗi xảy ra trong quá trình xóa chi nhánh.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--color-text-primary, #0F172A)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Building2 size={28} style={{ color: 'var(--color-primary, #2563EB)' }} />
              Quản Lý Chi Nhánh & Cơ Sở
            </h1>
            {isDirector ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  border: '1px solid #BFDBFE',
                }}
              >
                <ShieldCheck size={13} /> Quyền Giám Đốc
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  backgroundColor: '#F1F5F9',
                  color: '#64748B',
                  border: '1px solid #E2E8F0',
                }}
              >
                <ShieldAlert size={13} /> Chế Độ Chỉ Xem
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary, #64748B)',
              marginTop: '4px',
              marginBottom: 0,
            }}
          >
            Quản trị mạng lưới các cơ sở, phân bổ nhân sự và thông tin liên hệ toàn doanh nghiệp
          </p>
        </div>

        {/* Action Button */}
        {isDirector && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              fontWeight: 600,
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            <Plus size={18} />
            Thêm Chi Nhánh Mới
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* KPI 1 */}
        <div
          className="card"
          style={{
            padding: '18px 20px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg, 12px)',
            border: '1px solid var(--color-border-subtle, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Building2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
              Tổng Số Chi Nhánh
            </span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
              {totalBranches}
            </div>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Mạng lưới cơ sở toàn quốc</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div
          className="card"
          style={{
            padding: '18px 20px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg, 12px)',
            border: '1px solid var(--color-border-subtle, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '10px',
              backgroundColor: '#F0FDF4',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
              Đang Hoạt Động
            </span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#16A34A', marginTop: 2 }}>
              {activeBranches.length}{' '}
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>
                ({activeRate}%)
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Đang tiếp nhận lịch làm việc</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div
          className="card"
          style={{
            padding: '18px 20px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg, 12px)',
            border: '1px solid var(--color-border-subtle, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '10px',
              backgroundColor: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
              Cơ Sở Quy Mô Lớn Nhất
            </span>
            <div
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: '#0F172A',
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '200px',
              }}
              title={largestBranch ? largestBranch.branch.branchName : '---'}
            >
              {largestBranch ? largestBranch.branch.branchName : '---'}
            </div>
            <span style={{ fontSize: '12px', color: '#D97706', fontWeight: 600 }}>
              {largestBranch ? `${largestBranch.count} nhân sự trực thuộc` : '0 nhân sự'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
              }}
            />
            <input
              type="text"
              className="input"
              placeholder="Tìm theo tên, mã CN, địa chỉ, quản lý..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', paddingRight: searchTerm ? '32px' : '12px', width: '100%' }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: 2,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{ width: '170px', backgroundColor: '#FFFFFF' }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Tạm ngừng</option>
          </select>
        </div>

        <div style={{ fontSize: '13px', color: '#64748B' }}>
          Hiển thị <strong>{filteredBranches.length}</strong> / <strong>{totalBranches}</strong> chi nhánh
        </div>
      </div>

      {/* Main Branches Table */}
      <div
        className="card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          overflow: 'hidden',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        {isStoreLoading && branches.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#2563EB' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>Đang tải danh sách chi nhánh...</p>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
            <Building2 size={44} style={{ margin: '0 auto 12px', color: '#CBD5E1' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#334155', margin: '0 0 6px' }}>
              Không tìm thấy chi nhánh
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>
              {searchTerm || statusFilter !== 'ALL'
                ? 'Thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm.'
                : 'Chưa có dữ liệu chi nhánh. Hãy tạo chi nhánh mới đầu tiên!'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)',
                    textAlign: 'left',
                  }}
                >
                  <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>
                    Mã Cơ Sở
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>
                    Tên Chi Nhánh & Địa Chỉ
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>
                    Hotline
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>
                    Quản Lý Cơ Sở
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: 600, color: '#475569', textAlign: 'center' }}>
                    Nhân Sự
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: 600, color: '#475569', textAlign: 'center' }}>
                    Trạng Thái
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.map((branch) => {
                  const manager = employees.find((e) => e.id === branch.managerId);
                  const staffCount = branchEmployeeCountMap.get(branch.id) || 0;

                  return (
                    <tr
                      key={branch.id}
                      style={{
                        borderBottom: '1px solid var(--color-border-subtle, #F1F5F9)',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Branch Code */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '12.5px',
                            backgroundColor: '#F1F5F9',
                            color: '#1E293B',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          {branch.branchCode}
                        </span>
                      </td>

                      {/* Name & Address */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>
                          {branch.branchName}
                        </div>
                        {branch.address ? (
                          <div
                            style={{
                              fontSize: '12.5px',
                              color: '#64748B',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              marginTop: 2,
                            }}
                          >
                            <MapPin size={13} style={{ flexShrink: 0, color: '#94A3B8' }} />
                            <span>{branch.address}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                            Chưa cập nhật địa chỉ
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        {branch.phoneNumber ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#334155' }}>
                            <Phone size={13} style={{ color: '#2563EB' }} />
                            <span>{branch.phoneNumber}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94A3B8' }}>---</span>
                        )}
                      </td>

                      {/* Manager */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        {manager ? (
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                              {manager.fullName}
                            </div>
                            <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                              {manager.employeeCode}
                            </span>
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: '11.5px',
                              color: '#94A3B8',
                              backgroundColor: '#F8FAFC',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid #E2E8F0',
                            }}
                          >
                            Chưa chỉ định
                          </span>
                        )}
                      </td>

                      {/* Staff Count */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '3px 9px',
                            borderRadius: '12px',
                            backgroundColor: staffCount > 0 ? '#EFF6FF' : '#F8FAFC',
                            color: staffCount > 0 ? '#2563EB' : '#94A3B8',
                            border: `1px solid ${staffCount > 0 ? '#BFDBFE' : '#E2E8F0'}`,
                          }}
                        >
                          <Users size={12} />
                          {staffCount} nhân sự
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            backgroundColor: branch.isActive ? '#DCFCE7' : '#F1F5F9',
                            color: branch.isActive ? '#15803D' : '#64748B',
                            border: `1px solid ${branch.isActive ? '#BBF7D0' : '#E2E8F0'}`,
                          }}
                        >
                          {branch.isActive ? 'Hoạt động' : 'Tạm ngừng'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                        {isDirector ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-default"
                              onClick={() => handleOpenEdit(branch)}
                              style={{
                                padding: '6px 10px',
                                height: 32,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: '12.5px',
                                color: '#1E293B',
                              }}
                              title="Chỉnh sửa chi nhánh"
                            >
                              <Edit2 size={13} /> Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(branch)}
                              style={{
                                border: '1px solid #FECACA',
                                background: '#FEF2F2',
                                color: '#DC2626',
                                borderRadius: 'var(--radius-md, 6px)',
                                padding: '6px 10px',
                                height: 32,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: '12.5px',
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                              title="Xóa chi nhánh"
                            >
                              <Trash2 size={13} /> Xóa
                            </button>
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: '11.5px',
                              color: '#94A3B8',
                              backgroundColor: '#F8FAFC',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              border: '1px solid #E2E8F0',
                            }}
                          >
                            Chỉ xem
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <BranchFormModal
        isOpen={isFormModalOpen}
        mode={formMode}
        branch={selectedBranch}
        managers={managers}
        isSaving={isSaving}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <DeleteBranchModal
        isOpen={isDeleteModalOpen}
        branch={branchToDelete}
        employeeCount={branchToDelete ? branchEmployeeCountMap.get(branchToDelete.id) || 0 : 0}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false);
            setBranchToDelete(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
