import React from 'react';
import type {
    Employee,
    ShiftTemplate,
    ShiftAssignment,
    ScheduleConflict,
    CompanyHoliday,
} from '@/types/domain.types';
import {GridHeader} from './GridHeader';
import {ShiftRow} from './ShiftRow';
import {getWeekDays, formatDateIso} from '@/utils/date.utils';

interface WeeklyGridProps {
    baseMonday: Date;
    shiftTemplates: ShiftTemplate[];
    employees: Employee[];
    assignmentsMap: Record<string, ShiftAssignment[]>;
    conflictsMap: Record<string, ScheduleConflict[]>;
    holidays: CompanyHoliday[];
    canEdit: boolean;
    onlyShowConflicts?: boolean;
    onlyShowUnderstaffed?: boolean;
    onOpenAssignStaff: (shiftTemplateId: number, workDate: string) => void;
    onRemoveAssignment: (assignmentId: number) => void;
    onOpenOverrideModal?: (assignment: ShiftAssignment) => void;
    onOpenSwapModal?: (assignment: ShiftAssignment) => void;
    onOpenSwapWithColleague?: (targetAssignment: ShiftAssignment) => void;
    onClaimShift?: (template: ShiftTemplate, workDate: string) => void;
}

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({
                                                          baseMonday,
                                                          shiftTemplates,
                                                          employees,
                                                          assignmentsMap,
                                                          conflictsMap,
                                                          holidays,
                                                          canEdit,
                                                          onlyShowConflicts = false,
                                                          onlyShowUnderstaffed = false,
                                                          onOpenAssignStaff,
                                                          onRemoveAssignment,
                                                          onOpenOverrideModal,
                                                          onOpenSwapModal,
                                                          onOpenSwapWithColleague,
                                                          onClaimShift,
                                                      }) => {
    const weekDays = getWeekDays(baseMonday);
    const todayDateStr = formatDateIso(new Date());

    const displayTemplates = React.useMemo(() => {
        return shiftTemplates.filter((t) => t.isActive);
    }, [shiftTemplates]);

    if (displayTemplates.length === 0) {
        return (
            <div
                className="card"
                style={{
                    padding: 'var(--space-xxl) var(--space-lg)',
                    textAlign: 'center',
                    color: 'var(--color-text-secondary)',
                }}
            >
                <div style={{fontSize: 32, marginBottom: 'var(--space-sm)'}}>⏱️</div>
                <h3 style={{fontSize: 'var(--font-h3)', marginBottom: 'var(--space-xs)'}}>
                    Không tìm thấy ca làm việc phù hợp
                </h3>
                <p style={{fontSize: 'var(--font-body)'}}>
                    Không có ca làm việc nào khớp với bộ lọc hiện tại hoặc chưa có mẫu ca nào được kích hoạt.
                </p>
            </div>
        );
    }

    return (
        <div
            role="grid"
            aria-label="Bảng phân ca làm việc theo mẫu ca tuần"
            aria-rowcount={displayTemplates.length + 1}
            aria-colcount={8}
            className="schedule-grid-container"
        >
            {/* 8-Column Matrix Header */}
            <GridHeader
                weekDays={weekDays}
                todayDateStr={todayDateStr}
                holidays={holidays}
                assignmentsMap={assignmentsMap}
            />

            {/* Shift Rows */}
            {displayTemplates.map((template) => (
                <ShiftRow
                    key={template.id}
                    template={template}
                    weekDays={weekDays}
                    assignmentsMap={assignmentsMap}
                    employees={employees}
                    conflictsMap={conflictsMap}
                    todayDateStr={todayDateStr}
                    canEdit={canEdit}
                    onlyShowConflicts={onlyShowConflicts}
                    onlyShowUnderstaffed={onlyShowUnderstaffed}
                    onOpenAssignDrawer={onOpenAssignStaff}
                    onRemoveAssignment={onRemoveAssignment}
                    onOpenOverrideModal={onOpenOverrideModal}
                    onOpenSwapModal={onOpenSwapModal}
                    onOpenSwapWithColleague={onOpenSwapWithColleague}
                    onClaimShift={onClaimShift}
                />
            ))}
        </div>
    );
};
