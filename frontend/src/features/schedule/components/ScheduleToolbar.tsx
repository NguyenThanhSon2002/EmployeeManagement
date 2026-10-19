import React from 'react';
import { format } from 'date-fns';
import type { Branch, ScheduleStatus, RoleType } from '@/types/domain.types';
import { formatDateVi, offsetWeeks } from '@/utils/date.utils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Send,
  Copy,
  Plus,
  Download,
  History,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface ScheduleToolbarProps {
  baseMonday: Date;
  monthDate?: Date;
  branches: Branch[];
  selectedBranchId: number;
  scheduleStatus: ScheduleStatus;
  viewMode: 'WEEK' | 'MONTH';
  currentRole: RoleType;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onCurrentMonth?: () => void;
  onSelectBranch: (branchId: number) => void;
  onToggleViewMode: (mode: 'WEEK' | 'MONTH') => void;
  onOpenPublish: () => void;
  onOpenUnpublish?: () => void;
  onOpenCopyWeek: () => void;
  onOpenBulkAssign: () => void;
  onExportCsv: () => void;
  onOpenHistory: () => void;
}

export const ScheduleToolbar: React.FC<ScheduleToolbarProps> = ({
  baseMonday,
  monthDate,
  branches,
  selectedBranchId,
  scheduleStatus,
  viewMode,
  currentRole,
  onPrevWeek,
  onNextWeek,
  onToday,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
  onSelectBranch,
  onToggleViewMode,
  onOpenPublish,
  onOpenUnpublish,
  onOpenCopyWeek,
  onOpenBulkAssign,
  onExportCsv,
  onOpenHistory,
}) => {
  const sunday = offsetWeeks(baseMonday, 0);
  sunday.setDate(baseMonday.getDate() + 6);

  const isEmployeeRole = currentRole === 'ROLE_EMPLOYEE';

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '14px 18px',
        marginBottom: 'var(--space-md)',
      }}
    >
      {/* Row 1: Week/Month Navigation Controls & Schedule Status Badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Navigation Button Group */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-xs)',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={viewMode === 'MONTH' ? (onPrevMonth || onPrevWeek) : onPrevWeek}
              aria-label={viewMode === 'MONTH' ? 'Tháng trước' : 'Tuần trước'}
              title={viewMode === 'MONTH' ? 'Xem tháng trước' : 'Xem tuần trước'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 34,
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'background-color var(--transition-fast)',
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={viewMode === 'MONTH' ? (onCurrentMonth || onToday) : onToday}
              title={viewMode === 'MONTH' ? 'Về tháng hiện tại' : 'Về tuần hiện tại'}
              style={{
                borderTop: 'none',
                borderBottom: 'none',
                borderLeft: '1px solid var(--color-border)',
                borderRight: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                height: 34,
                padding: '0 12px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                transition: 'background-color var(--transition-fast)',
              }}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={viewMode === 'MONTH' ? (onNextMonth || onNextWeek) : onNextWeek}
              aria-label={viewMode === 'MONTH' ? 'Tháng sau' : 'Tuần sau'}
              title={viewMode === 'MONTH' ? 'Xem tháng sau' : 'Xem tuần sau'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 34,
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'background-color var(--transition-fast)',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Current Date Range / Month Display */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 600,
              fontSize: '13.5px',
              color: 'var(--color-text-primary)',
              padding: '4px 10px',
              backgroundColor: '#F8FAFC',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <Calendar size={16} color="var(--color-primary)" />
            <span>
              {viewMode === 'MONTH'
                ? `Tháng ${format(monthDate || baseMonday, 'MM/yyyy')}`
                : `${formatDateVi(baseMonday)} — ${formatDateVi(sunday)}`}
            </span>
          </div>

          {/* Status Badge */}
          {scheduleStatus === 'PUBLISHED' ? (
            <span
              className="badge badge-success"
              title="Lịch đã được công bố chính thức cho nhân viên"
              style={{ padding: '4px 10px', fontSize: 11.5 }}
            >
              <span className="badge-dot" style={{ backgroundColor: '#10B981' }} />
              ĐÃ CÔNG BỐ
            </span>
          ) : (
            <span
              className="badge badge-warning"
              title="Lịch đang ở trạng thái bản nháp nội bộ"
              style={{ padding: '4px 10px', fontSize: 11.5 }}
            >
              <span className="badge-dot" style={{ backgroundColor: '#F59E0B' }} />
              BẢN NHÁP
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Selectors & Action Buttons (Moved down per user request) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {/* Left: Branch & Mode Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Branch Dropdown */}
          <select
            className="input-base"
            value={selectedBranchId}
            onChange={(e) => onSelectBranch(Number(e.target.value))}
            style={{ height: 34, minWidth: 200, fontSize: '12.5px', fontWeight: 500 }}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branchName}
              </option>
            ))}
          </select>

          {/* View Mode Toggle Pill */}
          <div
            style={{
              display: 'inline-flex',
              padding: 3,
              backgroundColor: '#F1F5F9',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => onToggleViewMode('WEEK')}
              style={{
                height: 28,
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: viewMode === 'WEEK' ? 600 : 500,
                backgroundColor: viewMode === 'WEEK' ? 'var(--color-surface)' : 'transparent',
                color: viewMode === 'WEEK' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: viewMode === 'WEEK' ? 'var(--shadow-xs)' : 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              Tuần
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode('MONTH')}
              style={{
                height: 28,
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: viewMode === 'MONTH' ? 600 : 500,
                backgroundColor: viewMode === 'MONTH' ? 'var(--color-surface)' : 'transparent',
                color: viewMode === 'MONTH' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: viewMode === 'MONTH' ? 'var(--shadow-xs)' : 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              Tháng
            </button>
          </div>
        </div>

        {/* Right: Action Buttons Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Export CSV */}
          <button
            type="button"
            className="btn btn-default"
            onClick={onExportCsv}
            title="Tải bảng lịch tuần dạng file CSV"
            style={{ height: 34, padding: '0 10px', fontSize: '12.5px' }}
          >
            <Download size={14} />
            Xuất CSV
          </button>

          {/* Manager/Admin Actions */}
          {!isEmployeeRole && (
            <>
              <button
                type="button"
                className="btn btn-default"
                onClick={onOpenHistory}
                title="Xem nhật ký kiểm toán thay đổi"
                style={{ height: 34, padding: '0 10px', fontSize: '12.5px' }}
              >
                <History size={14} />
                Lịch sử
              </button>

              <button
                type="button"
                className="btn btn-default"
                onClick={onOpenCopyWeek}
                title="Sao chép toàn bộ ca từ tuần trước sang tuần này"
                style={{ height: 34, padding: '0 10px', fontSize: '12.5px' }}
              >
                <Copy size={14} />
                Sao chép tuần
              </button>

              <button
                type="button"
                className="btn btn-default"
                onClick={onOpenBulkAssign}
                title="Gán ca đồng loạt cho nhiều người"
                style={{ height: 34, padding: '0 10px', fontSize: '12.5px' }}
              >
                <Plus size={14} />
                Gán hàng loạt
              </button>

              {scheduleStatus === 'DRAFT' ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onOpenPublish}
                  title="Công bố lịch chính thức cho nhân viên"
                  style={{ height: 34, padding: '0 14px', fontSize: '12.5px', gap: 6 }}
                >
                  <Send size={14} />
                  Công bố lịch
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-default"
                    onClick={onOpenPublish}
                    title="Lịch đã công bố, click để xem chi tiết"
                    style={{
                      height: 34,
                      padding: '0 10px',
                      fontSize: '12.5px',
                      color: '#059669',
                      borderColor: '#A7F3D0',
                      backgroundColor: '#ECFDF5',
                    }}
                  >
                    <Sparkles size={14} />
                    Đã xuất bản
                  </button>
                  {onOpenUnpublish && (
                    <button
                      type="button"
                      className="btn btn-default"
                      onClick={onOpenUnpublish}
                      title="Thu hồi lịch về trạng thái bản nháp nếu bạn bấm nhầm"
                      style={{
                        height: 34,
                        padding: '0 10px',
                        fontSize: '12.5px',
                        color: 'var(--color-warning, #D97706)',
                        borderColor: '#FDE68A',
                        backgroundColor: '#FFFBEB',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <RotateCcw size={14} />
                      Quay lại bản nháp
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
