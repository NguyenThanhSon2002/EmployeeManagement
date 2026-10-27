import React from 'react';
import type { ShiftAssignment, ShiftTemplate, Employee, ScheduleConflict } from '@/types/domain.types';
import { Plus, X, AlertTriangle, Users, CheckCircle2, Lock } from 'lucide-react';
import { Tooltip } from '@/shared/components/Tooltip';
import { UserAvatar } from '@/components/common/UserAvatar';

interface ShiftGridCellProps {
    template: ShiftTemplate;
    workDate: string;
    assignments: ShiftAssignment[];
    employees: Employee[];
    conflictsMap: Record<string, ScheduleConflict[]>;
    isToday: boolean;
    canEdit: boolean;
    onlyShowConflicts?: boolean;
    onOpenAssignDrawer: () => void;
    onRemoveAssignment: (assignmentId: number, e: React.MouseEvent) => void;
}

export const ShiftGridCell: React.FC<ShiftGridCellProps> = React.memo(({
                                                                           template,
                                                                           workDate,
                                                                           assignments = [],
                                                                           employees = [],
                                                                           conflictsMap = {},
                                                                           isToday,
                                                                           canEdit,
                                                                           onlyShowConflicts = false,
                                                                           onOpenAssignDrawer,
                                                                           onRemoveAssignment,
                                                                       }) => {
    const currentCount = assignments.length;
    const minRequired = template.minStaffing || 1;
    const maxCapacity = template.maxStaffing || minRequired;
    const isOverCapacity = currentCount > maxCapacity;
    const isSufficient = currentCount >= minRequired && !isOverCapacity;

    // Check if this specific cell contains any assigned employee with a conflict
    const hasCellConflict = assignments.some((a) => {
        const key = `${a.employeeId}_${workDate}`;
        return (conflictsMap[key]?.length || 0) > 0;
    });

    const isDimmed = onlyShowConflicts && !hasCellConflict;
    const isFocusedConflict = onlyShowConflicts && hasCellConflict;

    let cellClass = 'schedule-cell shift-grid-cell';
    if (isToday) cellClass += ' today-cell';

    return (
        <div
            id={hasCellConflict ? `shift-cell-conflict-${template.id}-${workDate}` : undefined}
            role="gridcell"
            className={cellClass}
            tabIndex={canEdit && !isDimmed ? 0 : -1}
            aria-label={`${template.shiftName} ngày ${workDate}: ${currentCount}/${minRequired} nhân viên`}
            style={{
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                justifyContent: 'flex-start',
                minHeight: 110,
                position: 'relative',
                opacity: isDimmed ? 0.25 : 1,
                filter: isDimmed ? 'grayscale(0.35)' : 'none',
                transition: 'all 0.25s ease',
                pointerEvents: isDimmed ? 'none' : 'auto',
                border: isFocusedConflict ? '2px solid #F59E0B' : undefined,
                boxShadow: isFocusedConflict
                    ? '0 0 0 2px rgba(245, 158, 11, 0.25), 0 4px 14px rgba(245, 158, 11, 0.2)'
                    : undefined,
                backgroundColor: isFocusedConflict ? '#FFFDF5' : undefined,
            }}
        >
            {/* 1. Quota & Staff Count Header Pill */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 4,
                    marginBottom: 4,
                }}
            >
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: isOverCapacity
                            ? '#EFF6FF'
                            : isSufficient
                            ? '#ECFDF5'
                            : '#FFFBEB',
                        color: isOverCapacity
                            ? '#1D4ED8'
                            : isSufficient
                            ? '#047857'
                            : '#B45309',
                        border: isOverCapacity
                            ? '1px solid #BFDBFE'
                            : isSufficient
                            ? '1px solid #A7F3D0'
                            : '1px solid #FDE68A',
                        letterSpacing: '0.02em',
                    }}
                    title={
                        isOverCapacity
                            ? `Ca được bổ sung tăng cường (${currentCount}/${minRequired} nhân sự)`
                            : isSufficient
                            ? `Đạt định biên ca (${currentCount}/${minRequired} nhân sự)`
                            : `Thiếu ${minRequired - currentCount} nhân sự theo định biên (${currentCount}/${minRequired})`
                    }
                >
                    {isOverCapacity ? (
                        <Users size={11} strokeWidth={2.5} />
                    ) : isSufficient ? (
                        <CheckCircle2 size={11} strokeWidth={2.5} />
                    ) : (
                        <AlertTriangle size={11} strokeWidth={2.5} />
                    )}
                    <span>{currentCount}/{minRequired} NV</span>
                </span>

                {/* Quick Assign Button in header */}
                {canEdit && (
                    <button
                        type="button"
                        className="shift-cell-quick-add-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenAssignDrawer();
                        }}
                        title="Gán thêm nhân viên vào ca này"
                        style={{
                            background: 'none',
                            border: '1px solid #DBEAFE',
                            backgroundColor: '#EFF6FF',
                            cursor: 'pointer',
                            color: '#2563EB',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: '11px',
                            fontWeight: 600,
                            gap: 3,
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <Plus size={12} strokeWidth={2.5} />
                        Thêm
                    </button>
                )}
            </div>

            {/* 2. Staff Chips List */}
            {assignments.length === 0 ? (
                <div
                    onClick={canEdit ? onOpenAssignDrawer : undefined}
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px 6px',
                        border: '1px dashed #E2E8F0',
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC',
                        color: '#94A3B8',
                        cursor: canEdit ? 'pointer' : 'default',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                    }}
                    title={canEdit ? 'Bấm để phân bổ nhân sự vào ca' : 'Chưa có nhân viên'}
                >
                    <Users size={15} style={{ opacity: 0.6, marginBottom: 2 }} />
                    <span style={{ fontSize: '11px', fontWeight: 500 }}>Chưa phân ca</span>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                    {assignments.map((assignment) => {
                        const emp = employees.find((e) => e.id === assignment.employeeId);
                        const employeeKey = `${assignment.employeeId}_${workDate}`;
                        const hasConflict = Boolean(conflictsMap[employeeKey]?.length);
                        const isExternal = Boolean(assignment.isExternal);

                        const displayName = emp ? emp.fullName : `NV #${assignment.employeeId}`;
                        const avatarUrl = emp?.avatarUrl;

                        const chipConflicts = conflictsMap[employeeKey] ?? [];
                        const tooltipContent = (
                            <div>
                                <div style={{ fontWeight: 600 }}>
                                    {displayName}
                                    {emp?.employeeCode ? ` (${emp.employeeCode})` : ''}
                                </div>
                                {isExternal && (
                                    <div style={{ color: '#93C5FD', fontSize: 11, fontWeight: 600, marginTop: 2 }}>
                                        📍 Ca ngoại vi tại {assignment.branchName || 'Cơ sở khác'} (Chỉ đọc)
                                    </div>
                                )}
                                {chipConflicts.map((c, i) => (
                                    <div key={i} style={{ color: '#FCD34D', marginTop: 4 }}>
                                        ⚠ {c.message}
                                    </div>
                                ))}
                            </div>
                        );

                        return (
                            <Tooltip key={assignment.id} content={tooltipContent}>
                                <div
                                    className={`staff-shift-chip ${isExternal ? 'staff-shift-chip-external' : ''}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 6,
                                        padding: '5px 8px',
                                        borderRadius: '7px',
                                        backgroundColor: isExternal ? '#F8FAFC' : '#FFFFFF',
                                        border: isExternal
                                            ? (hasConflict ? '1px dashed #EF4444' : '1px dashed #CBD5E1')
                                            : (hasConflict ? '1px solid #F59E0B' : '1px solid #E2E8F0'),
                                        boxShadow: isExternal ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)',
                                        opacity: isExternal ? 0.95 : 1,
                                        fontSize: '12px',
                                    }}
                                >
                                    {/* Employee info */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                                        <UserAvatar
                                            name={displayName}
                                            src={avatarUrl}
                                            size={20}
                                        />

                                        {isExternal && (
                                            <span
                                                style={{
                                                    fontSize: '9.5px',
                                                    fontWeight: 700,
                                                    color: '#1D4ED8',
                                                    backgroundColor: '#EFF6FF',
                                                    border: '1px solid #BFDBFE',
                                                    padding: '1px 5px',
                                                    borderRadius: '4px',
                                                    flexShrink: 0,
                                                    whiteSpace: 'nowrap',
                                                }}
                                                title={`Ca làm việc tại ${assignment.branchName || 'chi nhánh khác'}`}
                                            >
                                                {assignment.branchName ? assignment.branchName.replace('Chi nhánh ', 'CN ') : 'CS khác'}
                                            </span>
                                        )}

                                        <span
                                            style={{
                                                whiteSpace: 'normal',
                                                wordBreak: 'break-word',
                                                lineHeight: 1.3,
                                                fontWeight: isExternal ? 500 : 600,
                                                color: isExternal ? '#475569' : '#0F172A',
                                            }}
                                        >
                                            {displayName}
                                        </span>

                                        {hasConflict && (
                                            <span title="Có cảnh báo xung đột" style={{ display: 'inline-flex', flexShrink: 0 }}>
                                                <AlertTriangle size={12} color="#D97706" />
                                            </span>
                                        )}
                                    </div>

                                    {/* Action button */}
                                    {isExternal || assignment.readOnly ? (
                                        <span
                                            title={`Ca làm việc tại ${assignment.branchName || 'chi nhánh khác'} (Chỉ đọc)`}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                color: '#94A3B8',
                                                padding: 2,
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Lock size={12} />
                                        </span>
                                    ) : (
                                        canEdit && (
                                            <button
                                                type="button"
                                                onClick={(e) => onRemoveAssignment(assignment.id, e)}
                                                className="staff-chip-remove-btn"
                                                title={`Gỡ ${displayName} khỏi ca này`}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--color-text-muted)',
                                                    borderRadius: 3,
                                                    transition: 'color 0.15s ease',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <X size={12} />
                                            </button>
                                        )
                                    )}
                                </div>
                            </Tooltip>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

ShiftGridCell.displayName = 'ShiftGridCell';