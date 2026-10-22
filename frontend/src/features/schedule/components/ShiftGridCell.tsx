import React from 'react';
import type { ShiftAssignment, ShiftTemplate, Employee, ScheduleConflict } from '@/types/domain.types';
import { Plus, X, AlertTriangle, Users, CheckCircle2 } from 'lucide-react';
import { Tooltip } from '@/shared/components/Tooltip';

interface ShiftGridCellProps {
    template: ShiftTemplate;
    workDate: string;
    assignments: ShiftAssignment[];
    employees: Employee[];
    conflictsMap: Record<string, ScheduleConflict[]>;
    isToday: boolean;
    canEdit: boolean;
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
                                                                           onOpenAssignDrawer,
                                                                           onRemoveAssignment,
                                                                       }) => {
    const currentCount = assignments.length;
    const minRequired = template.minStaffing || 1;
    const isSufficient = currentCount >= minRequired;

    let cellClass = 'schedule-cell shift-grid-cell';
    if (isToday) cellClass += ' today-cell';

    return (
        <div
            role="gridcell"
            className={cellClass}
            tabIndex={canEdit ? 0 : -1}
            aria-label={`${template.shiftName} ngày ${workDate}: ${currentCount}/${minRequired} nhân viên`}
            style={{
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                justifyContent: 'flex-start',
                minHeight: 110,
                position: 'relative',
            }}
        >
            {/* 1. Quota & Staff Count Header Pill */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 4,
                    marginBottom: 2,
                }}
            >
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isSufficient
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(245, 158, 11, 0.14)',
                color: isSufficient ? '#059669' : '#D97706',
                border: isSufficient
                    ? '1px solid rgba(16, 185, 129, 0.25)'
                    : '1px solid rgba(245, 158, 11, 0.3)',
            }}
            title={
                isSufficient
                    ? `Đạt định biên ca (${currentCount}/${minRequired} nhân sự)`
                    : `Thiếu ${minRequired - currentCount} nhân sự theo định biên (${currentCount}/${minRequired})`
            }
        >
          {isSufficient ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
            <span>
            {currentCount}/{minRequired} NV
          </span>
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
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-primary)',
                            padding: '2px 4px',
                            borderRadius: 4,
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: 11,
                            fontWeight: 600,
                        }}
                    >
                        <Plus size={13} style={{ marginRight: 2 }} />
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
                        padding: '8px 4px',
                        border: '1px dashed #CBD5E1',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#FAFAFA',
                        color: 'var(--color-text-muted)',
                        cursor: canEdit ? 'pointer' : 'default',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                    }}
                    title={canEdit ? 'Bấm để phân bổ nhân sự vào ca' : 'Chưa có nhân viên'}
                >
                    <Users size={16} style={{ opacity: 0.5, marginBottom: 2 }} />
                    <span style={{ fontSize: 11 }}>Trống ca</span>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                    {assignments.map((assignment) => {
                        const emp = employees.find((e) => e.id === assignment.employeeId);
                        const employeeKey = `${assignment.employeeId}_${workDate}`;
                        const hasConflict = Boolean(conflictsMap[employeeKey]?.length);

                        const displayName = emp ? emp.fullName : `NV #${assignment.employeeId}`;
                        const avatarUrl = emp?.avatarUrl;

                        const chipConflicts = conflictsMap[employeeKey] ?? [];
                        const tooltipContent = (
                            <div>
                                <div style={{ fontWeight: 600 }}>
                                    {displayName}
                                    {emp?.employeeCode ? ` (${emp.employeeCode})` : ''}
                                </div>
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
                                    className="staff-shift-chip"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 6,
                                        padding: '4px 8px',
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: '#FFFFFF',
                                        border: hasConflict
                                            ? '1px solid #F59E0B'
                                            : '1px solid var(--color-border)',
                                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                                        fontSize: 12,
                                    }}
                                >
                                    {/* Employee info */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt={displayName}
                                                style={{
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    flexShrink: 0,
                                                }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: '50%',
                                                    backgroundColor: 'var(--color-primary-light)',
                                                    color: 'var(--color-primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {displayName.charAt(0)}
                                            </div>
                                        )}

                                        <span
                                            style={{
                                                whiteSpace: 'normal',
                                                wordBreak: 'break-word',
                                                lineHeight: 1.25,
                                                fontWeight: 500,
                                                color: 'var(--color-text-primary)',
                                            }}
                                        >
                      {displayName}
                    </span>

                                        {hasConflict && (
                                            <span title="Có cảnh báo xung đột" style={{ display: 'inline-flex', flexShrink: 0 }}>
                        <AlertTriangle size={12} style={{ color: '#D97706' }} />
                      </span>
                                        )}
                                    </div>

                                    {/* Remove button */}
                                    {canEdit && (
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