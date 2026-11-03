import React from 'react';
import type { Employee, LeaveRequest, ShiftAssignment } from '@/types/domain.types';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Link2,
  Star,
  Info,
} from 'lucide-react';

export interface EvaluatedStaffStatus {
  emp: Employee;
  isAlreadyInThisShift: boolean;
  isAvailableForShift: boolean;
  isPreferred: boolean;
  leave?: LeaveRequest;
  hasOverlap: boolean;
  overlapMessage?: string | null;
  isHandover: boolean;
  handoverMinutes: number;
  handoverShift: ShiftAssignment | null;
  hasTravelWarning: boolean;
  travelMessage?: string | null;
  travelConflictShift?: ShiftAssignment | null;
  sameDayExternalShift?: ShiftAssignment | null;
  hasRestWarning: boolean;
  restMessage?: string | null;
  restHours: number;
  isDailyExceeded: boolean;
  totalDailyHours: number;
  weeklyHours: number;
  hasWarning: boolean;
}

interface StaffEligibilityItemProps {
  item: EvaluatedStaffStatus;
  isSelected: boolean;
  canEdit: boolean;
  overrideReason: string;
  onToggle: (empId: number, hasOverlap: boolean) => void;
  onOverrideReasonChange: (empId: number, reason: string) => void;
}

export const StaffEligibilityItem: React.FC<StaffEligibilityItemProps> = ({
  item,
  isSelected,
  canEdit,
  overrideReason,
  onToggle,
  onOverrideReasonChange,
}) => {
  const isOverlapped = item.hasOverlap;
  const isDisabled = isOverlapped;

  return (
    <div
      onClick={() => onToggle(item.emp.id, item.hasOverlap)}
      title={isOverlapped ? item.overlapMessage || 'Trùng giờ với ca khác' : undefined}
      style={{
        borderRadius: 'var(--radius-md)',
        border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
        backgroundColor: isSelected
          ? 'rgba(37, 99, 235, 0.04)'
          : isOverlapped
          ? '#F8FAFC'
          : '#FFFFFF',
        padding: '12px 14px',
        transition: 'all 0.15s ease',
        opacity: isDisabled ? 0.65 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        {/* Checkbox and employee details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={isSelected}
            disabled={isDisabled || !canEdit}
            onChange={(e) => {
              e.stopPropagation();
              onToggle(item.emp.id, item.hasOverlap);
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 18,
              height: 18,
              cursor: isDisabled || !canEdit ? 'not-allowed' : 'pointer',
              accentColor: 'var(--color-primary)',
            }}
          />

          <UserAvatar name={item.emp.fullName} src={item.emp.avatarUrl} size={34} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>
                {item.emp.fullName}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                ({item.emp.employeeCode})
              </span>
              {item.emp.hasMultiBranch && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    backgroundColor: '#EFF6FF',
                    color: '#1D4ED8',
                    padding: '1px 5px',
                    borderRadius: 4,
                    border: '1px solid #BFDBFE',
                  }}
                  title="Nhân viên làm việc luân phiên/kiêm nhiệm nhiều cơ sở"
                >
                  Đa cơ sở
                </span>
              )}
              {item.emp.employmentStatus === 'ON_LEAVE' && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    backgroundColor: '#FEF3C7',
                    color: '#D97706',
                    padding: '1px 6px',
                    borderRadius: 4,
                    border: '1px solid #FDE68A',
                  }}
                  title="Nhân viên đang trong thời gian nghỉ chế độ / tạm hoãn"
                >
                  Nghỉ chế độ
                </span>
              )}
              {item.isPreferred && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    backgroundColor: '#FEF3C7',
                    color: '#B45309',
                    padding: '1px 6px',
                    borderRadius: 4,
                    border: '1px solid #FDE68A',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                  title="Nhân viên đã đăng ký ưu tiên nhận làm ca này"
                >
                  <Star size={10} fill="#B45309" color="#B45309" />
                  Ưu tiên ca này
                </span>
              )}
              <a
                href={`/employees/${item.emp.id}?tab=AVAILABILITY`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: 11,
                  color: 'var(--color-primary, #2563EB)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  padding: '1px 4px',
                  borderRadius: 4,
                  backgroundColor: '#EFF6FF',
                }}
                title="Mở tab đăng ký lịch khả dụng của nhân viên này"
              >
                Lịch rảnh ↗
              </a>
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                marginTop: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
              }}
            >
              <span>
                Đã xếp tuần: <strong>{item.weeklyHours.toFixed(1)}h / 48h</strong>
              </span>
              {item.emp.homeBranchName && (
                <span style={{ color: '#64748B' }}>
                  • Cơ sở gốc: {item.emp.homeBranchName.replace('Chi nhánh ', 'CN ')}
                </span>
              )}
            </div>
            {item.sameDayExternalShift && (
              <div
                style={{
                  fontSize: 11,
                  color: '#1E40AF',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #DBEAFE',
                  padding: '2px 6px',
                  borderRadius: 4,
                  marginTop: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>📍</span>
                <span>
                  Đang có ca tại <strong>{item.sameDayExternalShift.branchName || 'cơ sở khác'}</strong> (
                  {item.sameDayExternalShift.snapshotStartTime.slice(0, 5)} -{' '}
                  {item.sameDayExternalShift.snapshotEndTime.slice(0, 5)})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {item.isAvailableForShift ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#059669',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                padding: '2px 6px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <CheckCircle2 size={11} color="#059669" /> Phù hợp ca
            </span>
          ) : (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#B45309',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FDE68A',
                padding: '2px 6px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
              title="Nhân viên chưa khai báo sẵn sàng cho ca này"
            >
              <AlertTriangle size={11} color="#B45309" /> Ngoài lịch đăng ký
            </span>
          )}

          {item.leave && (
            <span
              className="badge badge-success"
              style={{ fontSize: 11, padding: '2px 6px' }}
              title={`Đã duyệt nghỉ phép: ${item.leave.leaveTypeName}`}
            >
              🏖️ Nghỉ phép
            </span>
          )}

          {isOverlapped && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#DC2626',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                padding: '2px 6px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
              title={item.overlapMessage || 'Trùng giờ ca khác'}
            >
              <AlertCircle size={11} /> Trùng ca khác
            </span>
          )}

          {!isOverlapped && item.isHandover && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#0D9488',
                backgroundColor: '#F0FDFA',
                border: '1px solid #99F6E4',
                padding: '2px 6px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
              title={`Gối đầu ca hợp lệ với ${
                item.handoverShift?.snapshotShiftName || 'ca liền kề'
              } (Giao ca ${item.handoverMinutes}p). Giờ công thực tế được tự động khử trùng lặp.`}
            >
              <Link2 size={11} color="#0D9488" /> Ca nối tiếp ({item.handoverMinutes}p)
            </span>
          )}

          {!isOverlapped && item.hasTravelWarning && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#D97706',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FDE68A',
                padding: '2px 6px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
              title={item.travelMessage || 'Khoảng đệm di chuyển giữa 2 cơ sở dưới 45 phút'}
            >
              <AlertTriangle size={11} color="#D97706" /> Di chuyển &lt;45p
            </span>
          )}

          {!isOverlapped && item.hasRestWarning && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#D97706',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                padding: '2px 6px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
              title={item.restMessage || 'Nghỉ giữa ca dưới 12h'}
            >
              <AlertTriangle size={11} /> Nghỉ {item.restHours.toFixed(1)}h (&lt;12h)
            </span>
          )}

          {!isOverlapped && item.isDailyExceeded && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#D97706',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              &gt;12h/ngày ({item.totalDailyHours.toFixed(1)}h)
            </span>
          )}
        </div>
      </div>

      {/* Override justification input (optional for part-time, helpful for manager) */}
      {isSelected && item.hasWarning && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px dashed #FDE68A',
            backgroundColor: '#FEFCE8',
            padding: 8,
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              color: '#B45309',
              fontWeight: 600,
            }}
          >
            <Info size={12} />
            Ghi chú đặc cách / Ca 2 (Không bắt buộc):
          </div>
          <input
            type="text"
            className="form-control"
            placeholder="Nhập ghi chú đặc cách nếu có (hoặc để trống)..."
            value={overrideReason || ''}
            onChange={(e) => onOverrideReasonChange(item.emp.id, e.target.value)}
            style={{
              marginTop: 4,
              fontSize: 12,
              padding: '4px 8px',
              borderColor: '#FCD34D',
            }}
          />
        </div>
      )}
    </div>
  );
};
