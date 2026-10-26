import React from 'react';
import { format } from 'date-fns';
import type { ScheduleStatus, RoleType } from '@/types/domain.types';
import { formatDateVi, offsetWeeks } from '@/utils/date.utils';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    Send,
    Copy,
    Plus,
    Download,
    Sparkles,
    RotateCcw,
} from 'lucide-react';
import { DatePickerPopover } from './DatePickerPopover';

interface ScheduleToolbarProps {
    baseMonday: Date;
    monthDate?: Date;
    scheduleStatus: ScheduleStatus;
    viewMode: 'WEEK' | 'MONTH';
    currentRole: RoleType;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onToday: () => void;
    onPrevMonth?: () => void;
    onNextMonth?: () => void;
    onCurrentMonth?: () => void;
    onSelectDate?: (date: Date) => void;
    onToggleViewMode: (mode: 'WEEK' | 'MONTH') => void;
    onOpenPublish: () => void;
    onOpenUnpublish?: () => void;
    onOpenCopyWeek: () => void;
    onOpenBulkAssign: () => void;
    onResetSchedule?: () => void;
    onExportCsv: () => void;
}

export const ScheduleToolbar: React.FC<ScheduleToolbarProps> = ({
                                                                    baseMonday,
                                                                    monthDate,
                                                                    scheduleStatus,
                                                                    viewMode,
                                                                    currentRole,
                                                                    onPrevWeek,
                                                                    onNextWeek,
                                                                    onToday,
                                                                    onPrevMonth,
                                                                    onNextMonth,
                                                                    onCurrentMonth,
                                                                    onSelectDate,
                                                                    onToggleViewMode,
                                                                    onOpenPublish,
                                                                    onOpenUnpublish,
                                                                    onOpenCopyWeek,
                                                                    onOpenBulkAssign,
                                                                    onResetSchedule,
                                                                    onExportCsv,
                                                                }) => {
    const [isPickerOpen, setIsPickerOpen] = React.useState(false);
    const sunday = offsetWeeks(baseMonday, 0);
    sunday.setDate(baseMonday.getDate() + 6);

    const isEmployeeRole = currentRole === 'ROLE_EMPLOYEE';

    return (
        <div
            className="card"
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                padding: '14px 18px',
                marginBottom: '16px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
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
                            position: 'relative',
                            display: 'inline-flex',
                            alignItems: 'center',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            borderRadius: '8px',
                            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
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
                                borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
                                transition: 'background-color var(--transition-fast)',
                            }}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsPickerOpen((prev) => !prev)}
                            title="Click để chọn nhanh mốc thời gian"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                borderTop: 'none',
                                borderBottom: 'none',
                                borderLeft: '1px solid var(--color-border)',
                                borderRight: '1px solid var(--color-border)',
                                backgroundColor: isPickerOpen ? '#F1F5F9' : 'var(--color-surface)',
                                height: 34,
                                padding: '0 14px',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: 'var(--color-text-primary)',
                                cursor: 'pointer',
                                transition: 'background-color var(--transition-fast)',
                            }}
                        >
                            <Calendar size={15} color="var(--color-primary)" />
                            <span>
                {viewMode === 'MONTH'
                    ? `Tháng ${format(monthDate || baseMonday, 'MM/yyyy')}`
                    : `${formatDateVi(baseMonday)} — ${formatDateVi(sunday)}`}
              </span>
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
                                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                                transition: 'background-color var(--transition-fast)',
                            }}
                        >
                            <ChevronRight size={16} />
                        </button>

                        {/* Mini Calendar DatePicker Popover */}
                        <DatePickerPopover
                            isOpen={isPickerOpen}
                            onClose={() => setIsPickerOpen(false)}
                            currentDate={viewMode === 'MONTH' ? (monthDate || baseMonday) : baseMonday}
                            viewMode={viewMode}
                            onSelectDate={(selectedDate) => {
                                onSelectDate?.(selectedDate);
                                setIsPickerOpen(false);
                            }}
                            onToday={() => {
                                if (viewMode === 'MONTH') {
                                    (onCurrentMonth || onToday)();
                                } else {
                                    onToday();
                                }
                                setIsPickerOpen(false);
                            }}
                        />
                    </div>

                    {/* Status Badge */}
                    {scheduleStatus === 'PUBLISHED' ? (
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                                color: '#047857',
                                backgroundColor: '#ECFDF5',
                                border: '1px solid #A7F3D0',
                                borderRadius: '9999px',
                            }}
                            title="Lịch đã được công bố chính thức cho nhân viên"
                        >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
                            ĐÃ CÔNG BỐ
                        </span>
                    ) : (
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                                color: '#B45309',
                                backgroundColor: '#FFFBEB',
                                border: '1px solid #FDE68A',
                                borderRadius: '9999px',
                            }}
                            title="Lịch đang ở trạng thái bản nháp nội bộ"
                        >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                            BẢN NHÁP
                        </span>
                    )}
                </div>
            </div>

            {/* Row 2: Selectors & Action Buttons */}
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
                {/* Left: View Mode Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            padding: 3,
                            backgroundColor: '#F1F5F9',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => onToggleViewMode('WEEK')}
                            style={{
                                height: 28,
                                padding: '0 14px',
                                fontSize: '12px',
                                fontWeight: viewMode === 'WEEK' ? 700 : 500,
                                backgroundColor: viewMode === 'WEEK' ? '#FFFFFF' : 'transparent',
                                color: viewMode === 'WEEK' ? '#2563EB' : '#64748B',
                                borderRadius: '6px',
                                boxShadow: viewMode === 'WEEK' ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            Tuần
                        </button>
                        <button
                            type="button"
                            onClick={() => onToggleViewMode('MONTH')}
                            style={{
                                height: 28,
                                padding: '0 14px',
                                fontSize: '12px',
                                fontWeight: viewMode === 'MONTH' ? 700 : 500,
                                backgroundColor: viewMode === 'MONTH' ? '#FFFFFF' : 'transparent',
                                color: viewMode === 'MONTH' ? '#2563EB' : '#64748B',
                                borderRadius: '6px',
                                boxShadow: viewMode === 'MONTH' ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
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
                        style={{ height: 34, padding: '0 12px', fontSize: '12.5px', borderRadius: '8px', gap: 6 }}
                    >
                        <Download size={14} color="#64748B" />
                        Xuất CSV
                    </button>

                    {/* Manager/Admin Actions */}
                    {!isEmployeeRole && (
                        <>
                            <button
                                type="button"
                                className="btn btn-default"
                                onClick={onOpenCopyWeek}
                                title="Sao chép toàn bộ ca từ tuần trước sang tuần này"
                                style={{ height: 34, padding: '0 12px', fontSize: '12.5px', borderRadius: '8px', gap: 6 }}
                            >
                                <Copy size={14} color="#64748B" />
                                Sao chép tuần
                            </button>

                            {/* Nút Reset lịch */}
                            {onResetSchedule && (
                                <button
                                    type="button"
                                    className="btn btn-default"
                                    onClick={onResetSchedule}
                                    disabled={scheduleStatus === 'PUBLISHED'}
                                    title={
                                        scheduleStatus === 'PUBLISHED'
                                            ? 'Lịch đã công bố, vui lòng chuyển về bản nháp trước khi reset'
                                             : 'Xóa toàn bộ phân ca trong tuần hiện tại'
                                    }
                                    style={{
                                        height: 34,
                                        padding: '0 12px',
                                        fontSize: '12.5px',
                                        borderRadius: '8px',
                                        color: scheduleStatus === 'PUBLISHED' ? '#94A3B8' : '#DC2626',
                                        borderColor: scheduleStatus === 'PUBLISHED' ? '#E2E8F0' : '#FECACA',
                                        backgroundColor: scheduleStatus === 'PUBLISHED' ? '#F8FAFC' : '#FEF2F2',
                                        cursor: scheduleStatus === 'PUBLISHED' ? 'not-allowed' : 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}
                                >
                                    <RotateCcw size={14} />
                                    Reset tuần
                                </button>
                            )}

                            <button
                                type="button"
                                className="btn btn-default"
                                onClick={onOpenBulkAssign}
                                title="Gán ca đồng loạt cho nhiều người"
                                style={{ height: 34, padding: '0 12px', fontSize: '12.5px', borderRadius: '8px', gap: 6 }}
                            >
                                <Plus size={14} color="#64748B" />
                                Gán hàng loạt
                            </button>

                            {scheduleStatus === 'DRAFT' ? (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={onOpenPublish}
                                    title="Công bố lịch chính thức cho nhân viên"
                                    style={{ height: 34, padding: '0 16px', fontSize: '12.5px', borderRadius: '8px', gap: 6, fontWeight: 600 }}
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
                                            padding: '0 12px',
                                            fontSize: '12.5px',
                                            borderRadius: '8px',
                                            color: '#059669',
                                            borderColor: '#A7F3D0',
                                            backgroundColor: '#ECFDF5',
                                            gap: 6,
                                            fontWeight: 600,
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
                                                padding: '0 12px',
                                                fontSize: '12.5px',
                                                borderRadius: '8px',
                                                color: '#D97706',
                                                borderColor: '#FDE68A',
                                                backgroundColor: '#FFFBEB',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                fontWeight: 600,
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