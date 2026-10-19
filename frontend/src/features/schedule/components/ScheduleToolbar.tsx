import React from 'react';
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
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ScheduleToolbarProps {
  baseMonday: Date;
  branches: Branch[];
  selectedBranchId: number;
  scheduleStatus: ScheduleStatus;
  viewMode: 'WEEK' | 'MONTH';
  currentRole: RoleType;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onSelectBranch: (branchId: number) => void;
  onToggleViewMode: (mode: 'WEEK' | 'MONTH') => void;
  onOpenPublish: () => void;
  onOpenCopyWeek: () => void;
  onOpenBulkAssign: () => void;
  onExportCsv: () => void;
  onOpenHistory: () => void;
  onResetDemo: () => void;
}

export const ScheduleToolbar: React.FC<ScheduleToolbarProps> = ({
  baseMonday,
  branches,
  selectedBranchId,
  scheduleStatus,
  viewMode,
  currentRole,
  onPrevWeek,
  onNextWeek,
  onToday,
  onSelectBranch,
  onToggleViewMode,
  onOpenPublish,
  onOpenCopyWeek,
  onOpenBulkAssign,
  onExportCsv,
  onOpenHistory,
  onResetDemo,
}) => {
  const sunday = offsetWeeks(baseMonday, 0);
  sunday.setDate(baseMonday.getDate() + 6);

  const isEmployeeRole = currentRole === 'ROLE_EMPLOYEE';

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-md)',
        padding: '12px 18px',
        marginBottom: 'var(--space-md)',
      }}
    >
      {/* Left: Week Navigation Controls */}
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
            onClick={onPrevWeek}
            aria-label="Tuần trước"
            title="Xem tuần trước"
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
            onClick={onToday}
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
            onClick={onNextWeek}
            aria-label="Tuần sau"
            title="Xem tuần sau"
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

        {/* Current Date Range Display */}
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
            {formatDateVi(baseMonday)} — {formatDateVi(sunday)}
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
            BẢN NHÁP (DRAFT)
          </span>
        )}
      </div>

      {/* Center: Branch & Mode Selectors */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
          title="Tải bảng lịch tuần dạng file CSV (UTF-8 BOM tương thích Excel)"
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
              <button
                type="button"
                className="btn btn-default"
                onClick={onOpenPublish}
                title="Lịch đã công bố, click để xem chi tiết"
                style={{ height: 34, padding: '0 10px', fontSize: '12.5px', color: '#059669', borderColor: '#A7F3D0' }}
              >
                <Sparkles size={14} />
                Đã xuất bản
              </button>
            )}
          </>
        )}

        {/* Reset Demo Data */}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onResetDemo}
          title="Khôi phục dữ liệu mẫu ban đầu"
          style={{ height: 34, width: 34, padding: 0, color: 'var(--color-text-muted)' }}
          aria-label="Khôi phục dữ liệu demo"
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </div>
  );
};
