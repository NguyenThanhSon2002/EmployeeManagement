import React from 'react';
import type { Department, ScheduleStatus, RoleType } from '@/types/domain.types';
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
} from 'lucide-react';

interface ScheduleToolbarProps {
  baseMonday: Date;
  departments: Department[];
  selectedDeptId: number;
  scheduleStatus: ScheduleStatus;
  viewMode: 'WEEK' | 'MONTH';
  currentRole: RoleType;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onSelectDept: (deptId: number) => void;
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
  departments,
  selectedDeptId,
  scheduleStatus,
  viewMode,
  currentRole,
  onPrevWeek,
  onNextWeek,
  onToday,
  onSelectDept,
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
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-md)',
        padding: '12px 16px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 'var(--space-md)',
      }}
    >
      {/* Left: Week Navigation Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <button
            type="button"
            className="btn btn-default"
            onClick={onPrevWeek}
            aria-label="Tuần trước"
            title="Xem tuần trước"
            style={{ border: 'none', height: 34, padding: '0 10px', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="btn btn-default"
            onClick={onToday}
            style={{
              borderTop: 'none',
              borderBottom: 'none',
              borderLeft: '1px solid var(--color-border)',
              borderRight: '1px solid var(--color-border)',
              height: 34,
              padding: '0 12px',
              fontSize: 'var(--font-caption)',
              fontWeight: 600,
            }}
          >
            Hôm nay
          </button>
          <button
            type="button"
            className="btn btn-default"
            onClick={onNextWeek}
            aria-label="Tuần sau"
            title="Xem tuần sau"
            style={{ border: 'none', height: 34, padding: '0 10px', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Current Date Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 'var(--font-body-md)' }}>
          <Calendar size={18} color="var(--color-primary)" />
          <span>
            {formatDateVi(baseMonday)} - {formatDateVi(sunday)}
          </span>
        </div>

        {/* Status Badge */}
        {scheduleStatus === 'PUBLISHED' ? (
          <span className="badge badge-success" title="Lịch đã được công bố chính thức cho nhân viên">
            <span className="badge-dot" /> ĐÃ CÔNG BỐ
          </span>
        ) : (
          <span className="badge badge-warning" title="Lịch đang ở trạng thái bản nháp nội bộ">
            <span className="badge-dot" /> BẢN NHÁP (DRAFT)
          </span>
        )}
      </div>

      {/* Center: Department & Mode Selectors */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Department Dropdown */}
        <select
          className="input-base"
          value={selectedDeptId}
          onChange={(e) => onSelectDept(Number(e.target.value))}
          style={{ height: 34, minWidth: 180, fontSize: 'var(--font-caption)' }}
        >
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.departmentName}
            </option>
          ))}
        </select>

        {/* View Mode Toggle */}
        <div
          style={{
            display: 'flex',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => onToggleViewMode('WEEK')}
            style={{
              height: 32,
              padding: '0 12px',
              fontSize: 'var(--font-caption)',
              fontWeight: viewMode === 'WEEK' ? 600 : 400,
              backgroundColor: viewMode === 'WEEK' ? 'var(--color-primary)' : 'var(--color-surface)',
              color: viewMode === 'WEEK' ? '#fff' : 'var(--color-text-primary)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Tuần
          </button>
          <button
            type="button"
            onClick={() => onToggleViewMode('MONTH')}
            style={{
              height: 32,
              padding: '0 12px',
              fontSize: 'var(--font-caption)',
              fontWeight: viewMode === 'MONTH' ? 600 : 400,
              backgroundColor: viewMode === 'MONTH' ? 'var(--color-primary)' : 'var(--color-surface)',
              color: viewMode === 'MONTH' ? '#fff' : 'var(--color-text-primary)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Tháng
          </button>
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Export CSV */}
        <button
          type="button"
          className="btn btn-default"
          onClick={onExportCsv}
          title="Tải bảng lịch tuần dạng file CSV (UTF-8 BOM tương thích Excel)"
          style={{ height: 34, padding: '0 10px', fontSize: 'var(--font-caption)' }}
        >
          <Download size={15} />
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
              style={{ height: 34, padding: '0 10px', fontSize: 'var(--font-caption)' }}
            >
              <History size={15} />
              Lịch sử
            </button>

            <button
              type="button"
              className="btn btn-default"
              onClick={onOpenCopyWeek}
              title="Sao chép toàn bộ ca từ tuần trước sang tuần này"
              style={{ height: 34, padding: '0 10px', fontSize: 'var(--font-caption)' }}
            >
              <Copy size={15} />
              Sao chép tuần
            </button>

            <button
              type="button"
              className="btn btn-default"
              onClick={onOpenBulkAssign}
              title="Gán ca đồng loạt cho nhiều người"
              style={{ height: 34, padding: '0 10px', fontSize: 'var(--font-caption)' }}
            >
              <Plus size={15} />
              Gán hàng loạt
            </button>

            {scheduleStatus === 'DRAFT' ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onOpenPublish}
                title="Công bố lịch chính thức cho nhân viên"
                style={{ height: 34, padding: '0 14px', fontSize: 'var(--font-caption)' }}
              >
                <Send size={15} />
                Công bố lịch
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-default"
                onClick={onOpenPublish}
                title="Lịch đã công bố, click để xem chi tiết"
                style={{ height: 34, padding: '0 10px', fontSize: 'var(--font-caption)' }}
              >
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
          style={{ height: 34, padding: '0 6px', color: 'var(--color-text-muted)' }}
          aria-label="Khôi phục dữ liệu demo"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};
