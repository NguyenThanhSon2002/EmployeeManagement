import React from 'react';
import type { Employee, Branch, Position } from '@/types/domain.types';
import { EmploymentStatusBadge } from '@/components/common/EmploymentStatusBadge';
import { formatDateVi } from '@/utils/date.utils';

interface EmployeeProfileTabProps {
  employee: Employee;
  branch: Branch | undefined;
  position: Position | undefined;
  branchesList: Branch[];
  branches: Branch[];
  positions: Position[];
}

export const EmployeeProfileTab: React.FC<EmployeeProfileTabProps> = ({
  employee,
  branch,
  position,
  branchesList,
  branches,
  positions,
}) => {
  return (
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
  );
};
