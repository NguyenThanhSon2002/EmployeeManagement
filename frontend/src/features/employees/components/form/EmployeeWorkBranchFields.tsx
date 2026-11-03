import React from 'react';
import type { Employee, Branch, Position } from '@/types/domain.types';
import type { EmployeeFormData } from '../../hooks/useEmployeeForm';
import {
  Building2,
  Briefcase,
  Lock,
  ShieldCheck,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';

interface EmployeeWorkBranchFieldsProps {
  formData: EmployeeFormData;
  branches: Branch[];
  positions: Position[];
  isDirector: boolean;
  initialData: Employee | null;
  availableBranchesForSecondary: Branch[];
  updateField: <K extends keyof EmployeeFormData>(field: K, value: EmployeeFormData[K]) => void;
  addSecondaryBranch: (branchId: number, positionId?: number) => void;
  updateSecondaryBranch: (index: number, branchId: number, positionId: number) => void;
  removeSecondaryBranch: (index: number) => void;
}

export const EmployeeWorkBranchFields: React.FC<EmployeeWorkBranchFieldsProps> = ({
  formData,
  branches,
  positions,
  isDirector,
  initialData,
  availableBranchesForSecondary,
  updateField,
  addSecondaryBranch,
  updateSecondaryBranch,
  removeSecondaryBranch,
}) => {
  return (
    <>
      {/* Group 2: Cơ sở chính & Chức danh chính */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '16px 18px',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748B',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Building2 size={14} color="#2563EB" />
          Cơ Sở Trực Thuộc & Chức Danh Chính
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
          {/* Primary Branch */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#334155',
                  margin: 0,
                }}
              >
                <Building2 size={13} color="#64748B" /> Cơ Sở Làm Việc Chính <span style={{ color: '#DC2626' }}>*</span>
              </label>
              {!isDirector ? (
                <span
                  style={{
                    fontSize: '10.5px',
                    color: '#B45309',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    padding: '1px 6px',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    fontWeight: 600,
                  }}
                >
                  <Lock size={10} /> Cố định (Giám đốc phê duyệt)
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '10.5px',
                    color: '#15803D',
                    backgroundColor: '#DCFCE7',
                    border: '1px solid #BBF7D0',
                    padding: '1px 6px',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    fontWeight: 600,
                  }}
                >
                  <ShieldCheck size={10} /> Thẩm quyền Giám đốc
                </span>
              )}
            </div>

            {!isDirector ? (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    color: '#1E293B',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={14} color="#64748B" />
                    <span>
                      {branches.find((b) => b.id === (initialData?.branchId || formData.branchId))?.branchName || 'Cơ sở hiện tại'}
                    </span>
                  </div>
                  <Lock size={13} color="#94A3B8" />
                </div>
                <p style={{ fontSize: '11px', color: '#64748B', margin: '5px 0 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={12} color="#D97706" />
                  <span>Chỉ Giám đốc mới có thẩm quyền điều chuyển cơ sở làm việc chính của nhân sự.</span>
                </p>
              </div>
            ) : (
              <div>
                <select
                  className="input-base"
                  value={formData.branchId}
                  onChange={(e) => updateField('branchId', Number(e.target.value))}
                  style={{
                    width: '100%',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branchName}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0 0' }}>
                  Điều chuyển cơ sở chính sẽ tự động chuyển các phân ca và lịch khả dụng sang cơ sở mới.
                </p>
              </div>
            )}
          </div>

          {/* Primary Position */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '12.5px',
                fontWeight: 600,
                marginBottom: 6,
                color: '#334155',
              }}
            >
              <Briefcase size={13} color="#64748B" /> Chức Danh Chính <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <select
              className="input-base"
              value={formData.positionId}
              onChange={(e) => updateField('positionId', Number(e.target.value))}
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.positionName}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '11px', color: '#94A3B8', margin: '4px 0 0 0' }}>
              Áp dụng cho ca làm việc tại cơ sở chính
            </p>
          </div>
        </div>
      </div>

      {/* Group 3: Dynamic Secondary Branches Assignment */}
      <div
        style={{
          backgroundColor: '#F8FAFC',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Building2 size={14} color="#2563EB" />
            Cơ Sở Phụ Trách Thêm & Chức Danh
          </div>

          <button
            type="button"
            onClick={() => {
              const availableBranch = availableBranchesForSecondary[0];
              if (!availableBranch) return;
              addSecondaryBranch(availableBranch.id, 3);
            }}
            disabled={availableBranchesForSecondary.length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '12.5px',
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #BFDBFE',
              background: availableBranchesForSecondary.length > 0 ? '#FFFFFF' : '#F1F5F9',
              color: availableBranchesForSecondary.length > 0 ? '#2563EB' : '#94A3B8',
              cursor: availableBranchesForSecondary.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: availableBranchesForSecondary.length > 0 ? '0 1px 2px rgba(37, 99, 235, 0.08)' : 'none',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (availableBranchesForSecondary.length > 0) {
                e.currentTarget.style.backgroundColor = '#EFF6FF';
                e.currentTarget.style.borderColor = '#2563EB';
              }
            }}
            onMouseLeave={(e) => {
              if (availableBranchesForSecondary.length > 0) {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#BFDBFE';
              }
            }}
          >
            <Plus size={14} strokeWidth={2.5} /> Thêm chi nhánh phụ trách
          </button>
        </div>

        {formData.secondaryBranches.length === 0 ? (
          <div
            style={{
              padding: '20px 16px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px dashed #CBD5E1',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#F1F5F9',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={18} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
              Chưa phân công chi nhánh phụ trách
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', maxWidth: '380px' }}>
              Bấm nút <strong>"+ Thêm chi nhánh phụ trách"</strong> ở góc trên để phân công nhân sự làm việc hoặc hỗ trợ ca tại các cơ sở khác.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {formData.secondaryBranches.map((item, index) => {
              return (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr auto',
                    gap: '12px',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  {/* Dropdown 1: Secondary Branch */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        marginBottom: 5,
                        color: '#475569',
                      }}
                    >
                      Cơ sở phụ trách <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select
                      className="input-base"
                      value={item.branchId}
                      onChange={(e) => {
                        const newBranchId = Number(e.target.value);
                        updateSecondaryBranch(index, newBranchId, item.positionId);
                      }}
                      style={{
                        width: '100%',
                        height: '38px',
                        fontSize: '13px',
                        borderColor: '#CBD5E1',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      {branches
                        .filter(
                          (b) =>
                            b.id !== formData.branchId &&
                            (!formData.secondaryBranches.some((sb, i) => i !== index && sb.branchId === b.id) ||
                              b.id === item.branchId)
                        )
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.branchName}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Dropdown 2: Position at Secondary Branch */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        marginBottom: 5,
                        color: '#475569',
                      }}
                    >
                      Chức danh bên cơ sở đó <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select
                      className="input-base"
                      value={item.positionId}
                      onChange={(e) => {
                        const newPosId = Number(e.target.value);
                        updateSecondaryBranch(index, item.branchId, newPosId);
                      }}
                      style={{
                        width: '100%',
                        height: '38px',
                        fontSize: '13px',
                        borderColor: '#CBD5E1',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.positionName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Delete Action Button */}
                  <div style={{ paddingTop: 20 }}>
                    <button
                      type="button"
                      onClick={() => removeSecondaryBranch(index)}
                      title="Xóa phân công chi nhánh này"
                      style={{
                        border: '1px solid #FCA5A5',
                        backgroundColor: '#FEF2F2',
                        color: '#DC2626',
                        borderRadius: '8px',
                        width: '38px',
                        height: '38px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#FEE2E2';
                        e.currentTarget.style.borderColor = '#EF4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FEF2F2';
                        e.currentTarget.style.borderColor = '#FCA5A5';
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
