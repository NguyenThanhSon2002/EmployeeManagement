import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Employee } from '@/types/domain.types';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  Mail,
  Phone,
  Clock,
  Eye,
  Edit2,
  Trash2,
  Building2,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

interface EmployeeTableProps {
  isLoading: boolean;
  loadError: string | null;
  employees: Employee[];
  availabilities: Record<number, Record<number, number[]>>;
  getBranchName: (branchId: number) => string;
  getPositionName: (positionId: number) => string;
  expandedEmployeeIds: number[];
  toggleExpandEmployee: (id: number) => void;
  canManageStaff: boolean;
  canDelete: boolean;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  isLoading,
  loadError,
  employees,
  availabilities,
  getBranchName,
  getPositionName,
  expandedEmployeeIds,
  toggleExpandEmployee,
  canManageStaff,
  canDelete,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

  return (
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
            <th style={{ padding: '12px 16px' }}>Hình Thức</th>
            <th style={{ padding: '12px 16px' }}>Liên Hệ</th>
            <th style={{ padding: '12px 16px' }}>Trạng Thái</th>
            <th style={{ padding: '12px 16px' }}>Lịch Khả Dụng</th>
            <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={9} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                Đang tải danh sách nhân sự từ máy chủ...
              </td>
            </tr>
          ) : loadError ? (
            <tr>
              <td colSpan={9} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--color-error)' }}>
                {loadError}
              </td>
            </tr>
          ) : employees.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Không tìm thấy nhân viên nào phù hợp với bộ lọc hiện tại.
              </td>
            </tr>
          ) : (
            employees.map((emp) => {
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
                <React.Fragment key={emp.id}>
                  <tr
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
                        <UserAvatar
                          name={emp.fullName}
                          src={emp.avatarUrl}
                          size={34}
                          style={{
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '3px 9px',
                              borderRadius: '6px',
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              fontSize: '12.5px',
                              fontWeight: 600,
                              color: '#0F172A',
                              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                            }}
                          >
                            <Building2 size={13} color="#2563EB" />
                            {getBranchName(emp.branchId)}
                          </span>
                        </div>

                        {/* Dropdown toggle button for secondary branches */}
                        {((emp.secondaryBranches && emp.secondaryBranches.length > 0) ||
                          (emp.secondaryBranchIds && emp.secondaryBranchIds.length > 0)) && (
                          <button
                            type="button"
                            onClick={() => toggleExpandEmployee(emp.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              fontSize: '11px',
                              fontWeight: 600,
                              color: expandedEmployeeIds.includes(emp.id) ? '#1E40AF' : '#2563EB',
                              backgroundColor: expandedEmployeeIds.includes(emp.id) ? '#EFF6FF' : '#F0F7FF',
                              border: expandedEmployeeIds.includes(emp.id) ? '1px solid #93C5FD' : '1px solid #BFDBFE',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: '0 1px 2px rgba(37, 99, 235, 0.05)',
                            }}
                            title="Bấm để xem danh sách chi nhánh phụ trách & chức danh tương ứng"
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: '#2563EB',
                                display: 'inline-block',
                              }}
                            />
                            <span>
                              CN phụ trách ({emp.secondaryBranches?.length || emp.secondaryBranchIds?.length || 0})
                            </span>
                            {expandedEmployeeIds.includes(emp.id) ? (
                              <ChevronUp size={13} strokeWidth={2.2} />
                            ) : (
                              <ChevronDown size={13} strokeWidth={2.2} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                      {getPositionName(emp.positionId)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {emp.employmentType === 'PART_TIME' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: '#FEF3C7',
                            color: '#B45309',
                            border: '1px solid #FDE68A',
                          }}
                        >
                          <Briefcase size={12} /> Part-time
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: '#EFF6FF',
                            color: '#1D4ED8',
                            border: '1px solid #BFDBFE',
                          }}
                        >
                          <Clock size={12} /> Full-time
                        </span>
                      )}
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
                        const empAvail = availabilities[Number(emp.id)] || {};
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
                            onClick={() => onEdit(emp)}
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
                            onClick={() => onDelete(emp)}
                            style={{ padding: '0 8px', height: 32 }}
                            title="Xóa hồ sơ nhân viên"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expandable row: secondary branches details */}
                  {expandedEmployeeIds.includes(emp.id) && (
                    <tr
                      key={`expanded-${emp.id}`}
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderBottom: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      <td colSpan={9} style={{ padding: '12px 24px 16px 48px' }}>
                        <div
                          style={{
                            padding: '14px 18px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.03)',
                            animation: 'fadeIn 0.15s ease-out',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderBottom: '1px solid #F1F5F9',
                              paddingBottom: 8,
                            }}
                          >
                            <div
                              style={{
                                fontSize: '12.5px',
                                fontWeight: 700,
                                color: '#1E293B',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 7,
                              }}
                            >
                              <Sparkles size={14} color="#2563EB" />
                              <span>Phân công phụ trách & vai trò tại cơ sở khác:</span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>
                              Nhân sự có thể được phân công làm việc và xếp ca tại các cơ sở này
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                            {(emp.secondaryBranches && emp.secondaryBranches.length > 0) ? (
                              emp.secondaryBranches.map((sb, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    backgroundColor: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div
                                      style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '6px',
                                        backgroundColor: '#EFF6FF',
                                        color: '#2563EB',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <Building2 size={15} />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px' }}>
                                        {sb.branchName || getBranchName(sb.branchId)}
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                                        Cơ sở kiêm nhiệm
                                      </div>
                                    </div>
                                  </div>

                                  <div
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: '11.5px',
                                      fontWeight: 600,
                                      color: '#1D4ED8',
                                      backgroundColor: '#EFF6FF',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid #BFDBFE',
                                    }}
                                  >
                                    <Briefcase size={12} color="#2563EB" />
                                    <span>{sb.positionName || getPositionName(sb.positionId)}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              emp.secondaryBranchIds?.map((bId) => (
                                <div
                                  key={bId}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    backgroundColor: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div
                                      style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '6px',
                                        backgroundColor: '#EFF6FF',
                                        color: '#2563EB',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <Building2 size={15} />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px' }}>
                                        {getBranchName(bId)}
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                                        Cơ sở kiêm nhiệm
                                      </div>
                                    </div>
                                  </div>

                                  <div
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: '11.5px',
                                      fontWeight: 600,
                                      color: '#1D4ED8',
                                      backgroundColor: '#EFF6FF',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid #BFDBFE',
                                    }}
                                  >
                                    <Briefcase size={12} color="#2563EB" />
                                    <span>Nhân viên kiêm nhiệm</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
