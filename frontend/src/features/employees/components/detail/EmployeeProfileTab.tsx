import React from 'react';
import type { Employee, Branch, Position } from '@/types/domain.types';
import { EmploymentStatusBadge } from '@/components/common/EmploymentStatusBadge';
import { formatDateVi } from '@/utils/date.utils';
import {
  FileText,
  User,
  Clock,
  Briefcase,
  Building2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ShieldCheck,
  Coins,
  AlertCircle,
} from 'lucide-react';

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
  const isPartTime = employee.employmentType === 'PART_TIME';
  const hourlyRate = employee.hourlyRate || 35000;

  const getPositionBaseSalaryText = (positionId: number | undefined): string => {
    if (positionId === 1) return '25.000.000 đ/tháng';
    if (positionId === 2) return '15.000.000 đ/tháng';
    return '8.500.000 đ/tháng';
  };

  const getGenderText = (gender: string | undefined): string => {
    if (!gender) return 'Chưa cập nhật';
    const g = gender.toUpperCase();
    if (g === 'MALE') return 'Nam';
    if (g === 'FEMALE') return 'Nữ';
    return 'Khác';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KHỐI 1: THÔNG TIN HỢP ĐỒNG & CHẾ ĐỘ LÀM VIỆC */}
      <div className="card" style={{ padding: '22px 24px', borderRadius: 'var(--radius-xl, 12px)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 18,
            paddingBottom: 12,
            borderBottom: '1px solid #F1F5F9',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={18} color="#2563EB" />
          </div>
          <div>
            <h3 style={{ fontSize: '15.5px', fontWeight: 700, margin: 0, color: '#0F172A' }}>
              Thông Tin Hợp Đồng & Chế Độ Làm Việc
            </h3>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Hình thức làm việc, hợp đồng lao động, mức lương và địa bàn công tác
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px 24px' }}>
          {/* 1. Hình thức làm việc */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Hình Thức Làm Việc</div>
            <div style={{ marginTop: 6 }}>
              {isPartTime ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: '12.5px',
                    fontWeight: 600,
                    backgroundColor: '#FEF3C7',
                    color: '#B45309',
                    border: '1px solid #FDE68A',
                  }}
                >
                  <Briefcase size={13} /> Bán thời gian (Part-time)
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: '12.5px',
                    fontWeight: 600,
                    backgroundColor: '#EFF6FF',
                    color: '#1D4ED8',
                    border: '1px solid #BFDBFE',
                  }}
                >
                  <Clock size={13} /> Toàn thời gian (Full-time)
                </span>
              )}
            </div>
          </div>

          {/* 2. Loại hình hợp đồng */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Trạng Thái Hợp Đồng</div>
            <div style={{ marginTop: 6 }}>
              <EmploymentStatusBadge status={employee.employmentStatus} />
            </div>
          </div>

          {/* 3. Chế độ lương & Đãi ngộ */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Chế Độ Lương & Đơn Giá
            </div>
            <div style={{ marginTop: 4 }}>
              {isPartTime ? (
                <div>
                  <div style={{ fontWeight: 700, color: '#D97706', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Coins size={15} />
                    {hourlyRate.toLocaleString('vi-VN')} đ/giờ
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    💡 Lương tính theo số giờ làm thực tế từ lịch phân ca
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 700, color: '#2563EB', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Coins size={15} />
                    Lương cứng {getPositionBaseSalaryText(employee.positionId)}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    💼 Mặc định 8h/ngày, 26 ngày công chuẩn (208h/tháng)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Ngày ký hợp đồng / Vào làm */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Ngày Ký Hợp Đồng / Vào Làm
            </div>
            <div style={{ fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, color: '#1E293B' }}>
              <Calendar size={14} color="#64748B" />
              {formatDateVi(employee.hireDate)}
            </div>
          </div>

          {/* 5. Ngày thôi việc (nếu có) */}
          {(employee.employmentStatus === 'RESIGNED' || employee.resignationDate) && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>
                Ngày Nghỉ Việc (Chấm Dứt HĐ)
              </div>
              <div style={{ fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, color: '#DC2626' }}>
                <AlertCircle size={14} color="#DC2626" />
                {employee.resignationDate ? formatDateVi(employee.resignationDate) : 'Đã xác nhận nghỉ việc'}
              </div>
              <div style={{ fontSize: 11, color: '#DC2626', marginTop: 2 }}>
                Nhân sự đã thanh lý hợp đồng
              </div>
            </div>
          )}

          {/* 6. Chi nhánh / Cơ sở chính */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Cơ Sở Làm Việc Chính (Home Branch)
            </div>
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
                <span style={{ fontWeight: 600, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Building2 size={13} color="#2563EB" />
                  {branch?.branchName || 'Chưa gán'}
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

          {/* 7. Cơ sở kiêm nhiệm */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Cơ Sở Kiêm Nhiệm / Chức Danh Phụ Trách
            </div>
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
                        <span style={{ fontWeight: 600, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Building2 size={13} color="#2563EB" />
                          {sb.branchName || secBranch?.branchName || `Cơ sở #${sb.branchId}`}
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
                <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Chưa đăng ký cơ sở kiêm nhiệm</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KHỐI 2: THÔNG TIN LÝ LỊCH & CÁ NHÂN */}
      <div className="card" style={{ padding: '22px 24px', borderRadius: 'var(--radius-xl, 12px)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 18,
            paddingBottom: 12,
            borderBottom: '1px solid #F1F5F9',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={18} color="#2563EB" />
          </div>
          <div>
            <h3 style={{ fontSize: '15.5px', fontWeight: 700, margin: 0, color: '#0F172A' }}>
              Thông Tin Lý Lịch & Cá Nhân
            </h3>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Thông tin định danh, ngày sinh, giới tính và liên hệ cá nhân
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px 24px' }}>
          {/* Mã nhân viên */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Mã Nhân Viên</div>
            <div style={{ fontWeight: 700, marginTop: 4, color: 'var(--color-primary)', fontSize: 14 }}>
              {employee.employeeCode}
            </div>
          </div>

          {/* Họ và tên */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Họ Và Tên</div>
            <div style={{ fontWeight: 700, marginTop: 4, color: '#0F172A', fontSize: 14 }}>
              {employee.fullName}
            </div>
          </div>

          {/* Số CCCD / CMND */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Số CCCD / CMND</div>
            <div style={{ fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, color: '#1E293B' }}>
              <CreditCard size={14} color="#64748B" />
              {employee.nationalId || 'Chưa cập nhật'}
            </div>
          </div>

          {/* Ngày sinh */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Ngày Sinh</div>
            <div style={{ fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, color: '#1E293B' }}>
              <Calendar size={14} color="#64748B" />
              {employee.dateOfBirth ? formatDateVi(employee.dateOfBirth) : 'Chưa cập nhật'}
            </div>
          </div>

          {/* Giới tính */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Giới Tính</div>
            <div style={{ fontWeight: 600, marginTop: 4, color: '#1E293B' }}>
              {getGenderText(employee.gender)}
            </div>
          </div>

          {/* Số điện thoại */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Số Điện Thoại</div>
            <div style={{ fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, color: '#1E293B' }}>
              <Phone size={14} color="#64748B" />
              {employee.phoneNumber || 'Chưa cập nhật'}
            </div>
          </div>

          {/* Email công việc */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Email Liên Hệ</div>
            <div style={{ fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, color: '#1E293B' }}>
              <Mail size={14} color="#64748B" />
              {employee.email || 'Chưa cập nhật'}
            </div>
          </div>

          {/* Trạng thái hoạt động */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Trạng Thái Tài Khoản</div>
            <div style={{ marginTop: 4 }}>
              {employee.isActive ? (
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={12} /> Đang hoạt động
                </span>
              ) : (
                <span className="badge badge-error" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  ● Ngừng hoạt động
                </span>
              )}
            </div>
          </div>

          {/* Địa chỉ liên hệ / Nơi ở */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Địa Chỉ Thường Trú / Nơi Ở Hiện Tại
            </div>
            <div style={{ fontWeight: 500, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, color: '#334155' }}>
              <MapPin size={14} color="#64748B" />
              <span>{employee.address || 'Chưa cập nhật địa chỉ'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
