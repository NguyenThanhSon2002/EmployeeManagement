import React from 'react';
import type {ShiftAssignment, ShiftTemplate, Employee, ScheduleConflict} from '@/types/domain.types';
import {Plus, X, AlertTriangle, Users, CheckCircle2, Lock, FileText, ArrowLeftRight, ChevronDown, ChevronUp, Undo2} from 'lucide-react';
import {Tooltip} from '@/shared/components/Tooltip';
import {UserAvatar} from '@/components/common/UserAvatar';
import {useAuthStore} from '@/shared/auth/useAuthStore';
import {assignmentToTimeRange, checkShiftOverlap} from '@/utils/conflict-detector.utils';
import {useScheduleStore} from "@/features/schedule/store/useScheduleStore";
import {useUIStore} from "@/shared/store/useUIStore";

export interface AssignmentHandoverInfo {
    isHandover: boolean;
    origEmployeeId?: number;
    origName: string;
    origCode?: string;
    origAvatarUrl?: string;
    reasonText?: string;
    requestCode?: string;
}

export const getAssignmentHandoverInfo = (
    assignment: ShiftAssignment,
    employees: Employee[] = []
): AssignmentHandoverInfo => {
    const rawReason = assignment.overrideReason || '';
    const hasTransferredId = Boolean(assignment.transferredFromEmployeeId);
    const hasHandoverText = /HANDOVER-/i.test(rawReason) || /nhường ca/i.test(rawReason);

    if (!hasTransferredId && !hasHandoverText) {
        return { isHandover: false, origName: '' };
    }

    // Trích xuất mã yêu cầu nếu có (ví dụ: HANDOVER-20261103-94F57)
    const codeMatch = rawReason.match(/HANDOVER-[A-Z0-9-]+/i);
    const requestCode = codeMatch ? codeMatch[0] : undefined;

    // Trích xuất lý do sạch (bỏ các tiền tố như "Nhường ca theo...", "Tên nhường ca cho...")
    let reasonText = '';
    if (rawReason.includes(':')) {
        const parts = rawReason.split(':');
        reasonText = parts.slice(1).join(':').trim();
    } else if (codeMatch) {
        const after = rawReason.slice(rawReason.indexOf(codeMatch[0]) + codeMatch[0].length).trim();
        reasonText = after.replace(/^[:\s-]+/, '').trim();
    } else {
        reasonText = rawReason;
    }

    // Nhận diện nhân sự gốc đã nhường ca
    let origEmployeeId = assignment.transferredFromEmployeeId;
    let origName = assignment.transferredFromEmployeeName;
    let origCode = assignment.transferredFromEmployeeCode;
    let origAvatarUrl: string | undefined;

    if (origEmployeeId) {
        const foundEmp = employees.find((e) => Number(e.id) === Number(origEmployeeId));
        if (foundEmp) {
            origName = origName || foundEmp.fullName;
            origCode = origCode || foundEmp.employeeCode;
            origAvatarUrl = foundEmp.avatarUrl;
        }
    }

    // Fallback nếu transferredFromEmployeeId chưa có trên bản ghi cũ:
    // Kiểm tra định dạng: "Nguyễn Tử Duy Anh (EMP-153) nhường ca cho..."
    if (!origName && rawReason) {
        const patternMatch = rawReason.match(/^([^(]+)\s*\((EMP-[^)]+)\)\s*nhường ca cho/i);
        if (patternMatch) {
            origName = patternMatch[1].trim();
            origCode = patternMatch[2].trim();
            const foundEmp = employees.find((e) => e.employeeCode === origCode || e.fullName === origName);
            if (foundEmp) {
                origEmployeeId = foundEmp.id;
                origAvatarUrl = foundEmp.avatarUrl;
            }
        }
    }

    if (!origName) {
        origName = origEmployeeId ? `NV #${origEmployeeId}` : 'Nhân sự nhường ca';
    }

    return {
        isHandover: true,
        origEmployeeId,
        origName,
        origCode,
        origAvatarUrl,
        reasonText: reasonText || undefined,
        requestCode,
    };
};

/**
 * Rút gọn tên nhân viên hiển thị trên chip ô ca:
 * Nếu tên dài từ 3 từ trở lên: Rút gọn phần đầu (họ), giữ lại phần đệm + tên chính ở cuối.
 * Ví dụ: "Nguyễn Xuân Tài" -> "...Xuân Tài", "Nguyễn Tử Duy Anh" -> "...Duy Anh"
 * Với tên 1-2 từ (ví dụ: "Gia Linh", "Sơn Núi", "NV #2") -> giữ nguyên.
 */
export const formatShiftChipName = (fullName: string): string => {
    if (!fullName) return '';
    const trimmed = fullName.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length <= 2) {
        return trimmed;
    }
    const lastTwo = parts.slice(-2).join(' ');
    return `...${lastTwo}`;
};

interface ShiftGridCellProps {
    template: ShiftTemplate;
    workDate: string;
    assignments: ShiftAssignment[];
    allAssignments?: ShiftAssignment[];
    employees: Employee[];
    conflictsMap: Record<string, ScheduleConflict[]>;
    isToday: boolean;
    canEdit: boolean;
    onlyShowConflicts?: boolean;
    onlyShowUnderstaffed?: boolean;
    onOpenAssignDrawer: () => void;
    onRemoveAssignment: (assignmentId: number, e: React.MouseEvent) => void;
    onOpenOverrideModal?: (assignment: ShiftAssignment) => void;
    onOpenSwapModal?: (assignment: ShiftAssignment) => void;
    onOpenSwapWithColleague?: (targetAssignment: ShiftAssignment) => void;
    onClaimShift?: (template: ShiftTemplate, workDate: string) => void;
}

export const ShiftGridCell: React.FC<ShiftGridCellProps> = React.memo(({
                                                                           template,
                                                                           workDate,
                                                                           assignments = [],
                                                                           allAssignments = [],
                                                                           employees = [],
                                                                           conflictsMap = {},
                                                                           isToday,
                                                                           canEdit,
                                                                           onlyShowConflicts = false,
                                                                           onlyShowUnderstaffed = false,
                                                                           onOpenAssignDrawer,
                                                                           onRemoveAssignment,
                                                                           onOpenOverrideModal,
                                                                           onOpenSwapModal,
    onOpenSwapWithColleague,
    onClaimShift,
}) => {
    const {currentRole, currentUser} = useAuthStore();
    const isDirectorOrAdmin = currentRole === 'ROLE_DIRECTOR';
    const isManager = currentRole === 'ROLE_MANAGER';
    const isManagerOrAdmin = isDirectorOrAdmin || isManager;
    const isEmployee = currentRole === 'ROLE_EMPLOYEE';
    const [showTransferred, setShowTransferred] = React.useState(false);
    const scheduleStatus = useScheduleStore((s) => s.scheduleStatus);
    const cancelClaimedShift = useScheduleStore((s) => s.cancelClaimedShift);
    const addToast = useUIStore((s) => s.addToast);
    const isDraft = scheduleStatus !== 'PUBLISHED';

    const handleCancelOwnClaim = async (assignment: ShiftAssignment) => {
        if (!window.confirm(`Hủy đăng ký ${template.shiftName} ngày ${workDate}?`)) return;
        const res = await cancelClaimedShift(assignment.id);
        if (res.success) {
            addToast({type: 'success', title: 'Đã hủy đăng ký ca', message: `${template.shiftName} ngày ${workDate}.`});
        } else {
            addToast({type: 'error', title: 'Không thể hủy ca', message: res.error || 'Vui lòng thử lại.'});
        }
    };

    const currentCount = assignments.length;
    const minRequired = template.minStaffing || 1;
    const maxCapacity = template.maxStaffing || minRequired;
    const isOverCapacity = currentCount > maxCapacity;
    const isSufficient = currentCount >= minRequired && !isOverCapacity;
    const isAlreadyAssignedInCell = Boolean(
        currentUser?.id && assignments.some((a) => Number(a.employeeId) === Number(currentUser.id))
    );

    // Helper to calculate effective conflicts for an assignment in this specific shift cell
    const getEffectiveConflicts = (assignment: ShiftAssignment, index: number): ScheduleConflict[] => {
        const employeeKey = `${assignment.employeeId}_${workDate}`;
        const rawConflicts = conflictsMap[employeeKey] ?? [];

        // Phân công từ vị trí maxCapacity trở đi trong ô là nhân sự vượt định biên
        const isOverStaffing = isOverCapacity && index >= maxCapacity;

        // Lọc các cảnh báo thuộc về đúng ca làm việc hiện tại
        const chipConflicts = rawConflicts.filter((c) => {
            // Cảnh báo vượt định biên chỉ áp dụng cho đúng ca/phân ca bị vượt
            if (c.ruleCode === 'WARN_STAFFING_CAPACITY') {
                if (c.workShiftId && Number(c.workShiftId) !== Number(template.id)) {
                    return false;
                }
                if (c.assignmentId && assignment.id) {
                    return Number(c.assignmentId) === Number(assignment.id);
                }
                return true;
            }
            // Các cảnh báo khác nếu có workShiftId chỉ áp dụng cho ca đó
            if (c.workShiftId !== undefined && Number(c.workShiftId) !== Number(template.id)) {
                return false;
            }
            return true;
        });

        const effectiveConflicts = [...chipConflicts];
        if (isOverStaffing && !effectiveConflicts.some((c) => c.ruleCode === 'WARN_STAFFING_CAPACITY')) {
            effectiveConflicts.push({
                id: `WARN_CAPACITY_${assignment.employeeId}_${workDate}_${template.id}`,
                ruleCode: 'WARN_STAFFING_CAPACITY',
                severity: 'WARNING',
                employeeId: assignment.employeeId,
                workDate,
                workShiftId: Number(template.id),
                assignmentId: assignment.id,
                message: `${template.shiftName} đã vượt định biên tối đa (${currentCount}/${maxCapacity} NV). Bổ sung nhân sự tăng cường.`,
                canOverride: true,
            });
        }

        return effectiveConflicts;
    };

    // Check if this specific cell contains any assigned employee with a conflict BELONGING TO THIS SHIFT
    const hasCellConflict = assignments.some((a, idx) => getEffectiveConflicts(a, idx).length > 0);

    const isUnderstaffed = currentCount < minRequired;
    const anyFilterActive = onlyShowConflicts || onlyShowUnderstaffed;
    const matchesFilter =
        (onlyShowConflicts && hasCellConflict) || (onlyShowUnderstaffed && isUnderstaffed);
    const isDimmed = anyFilterActive && !matchesFilter;
    const isFocusedConflict = anyFilterActive && matchesFilter;

    let cellClass = 'schedule-cell shift-grid-cell';
    if (isToday) cellClass += ' today-cell';

    return (
        <div
            id={hasCellConflict ? `shift-cell-conflict-${template.id}-${workDate}` : undefined}
            role="gridcell"
            data-understaffed={isUnderstaffed ? 'true' : undefined}
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
                        <Users size={11} strokeWidth={2.5}/>
                    ) : isSufficient ? (
                        <CheckCircle2 size={11} strokeWidth={2.5}/>
                    ) : (
                        <AlertTriangle size={11} strokeWidth={2.5}/>
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
                        <Plus size={12} strokeWidth={2.5}/>
                        Thêm
                    </button>
                )}
                {/* Quick Claim Button for Employee */}
                {isEmployee && onClaimShift && currentCount < maxCapacity && !isAlreadyAssignedInCell && (
                    <button
                        type="button"
                        className="shift-cell-quick-claim-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClaimShift(template, workDate);
                        }}
                        title="Đăng ký thêm tên bạn vào ca còn chỗ này"
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
                        <Plus size={12} strokeWidth={2.5}/>
                        Nhận ca
                    </button>
                )}
            </div>

            {/* 2. Staff Chips List */}
            {assignments.length === 0 ? (
                isEmployee && onClaimShift ? (
                    <div
                        onClick={() => onClaimShift(template, workDate)}
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
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease',
                        }}
                        className="shift-claim-empty-btn"
                        title="Bấm để đăng ký nhận ca trống này"
                    >
                        <Users size={15} style={{opacity: 0.6, marginBottom: 2}}/>
                        <span style={{fontSize: '11px', fontWeight: 500}}>Chưa phân ca</span>
                    </div>
                ) : (
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
                        <Users size={15} style={{opacity: 0.6, marginBottom: 2}}/>
                        <span style={{fontSize: '11px', fontWeight: 500}}>Chưa phân ca</span>
                    </div>
                )
            ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: 4, flex: 1}}>
                    {assignments.map((assignment, index) => {
                        const emp = employees.find((e) => e.id === assignment.employeeId);
                        const effectiveConflicts = getEffectiveConflicts(assignment, index);
                        const hasConflict = effectiveConflicts.length > 0;
                        const isExternal = Boolean(assignment.isExternal);
                        const canCancelOwnClaim =
                            isEmployee &&
                            isDraft &&
                            assignment.source === 'SELF_CLAIM' &&
                            Number(assignment.employeeId) === Number(currentUser?.id);

                        // Check if this assignment has consecutive handover connection with another shift of this employee
                        const otherEmpAssignments = allAssignments.filter(
                            (a) => a.employeeId === assignment.employeeId && a.id !== assignment.id && a.status !== 'CANCELLED'
                        );
                        const handoverResult = otherEmpAssignments.length > 0
                            ? checkShiftOverlap(assignmentToTimeRange(assignment), otherEmpAssignments, assignment.branchId)
                            : null;
                        const isHandover = Boolean(handoverResult?.isHandover);

                        const displayName = emp ? emp.fullName : `NV #${assignment.employeeId}`;
                        const avatarUrl = emp?.avatarUrl;

                        const handoverInfo = getAssignmentHandoverInfo(assignment, employees);

                        // Chỉ cho phép giải trình nếu ca có cảnh báo HOẶC đã có giải trình trước đó
                        const isEligibleForOverride = Boolean(hasConflict || assignment.overrideReason);
                        const canClickToOverride = canEdit && !isExternal && !assignment.readOnly && isEligibleForOverride;

                        const tooltipContent = (
                            <div>
                                <div style={{fontWeight: 600}}>
                                    {displayName}
                                    {emp?.employeeCode ? ` (${emp.employeeCode})` : ''}
                                </div>
                                {isExternal && (
                                    <div style={{color: '#93C5FD', fontSize: 11, fontWeight: 600, marginTop: 2}}>
                                        📍 Ca ngoại vi tại {assignment.branchName || 'Cơ sở khác'} (Chỉ đọc)
                                    </div>
                                )}
                                {handoverInfo.isHandover && (
                                    <div style={{color: '#93C5FD', fontSize: 11, fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4}}>
                                        <ArrowLeftRight size={11} />
                                        <span>Nhận nhường ca từ: {handoverInfo.origName}{handoverInfo.origCode ? ` (${handoverInfo.origCode})` : ''}</span>
                                    </div>
                                )}
                                {!handoverInfo.isHandover && assignment.overrideReason && (
                                    <div style={{
                                        color: '#86EFAC',
                                        fontSize: 11,
                                        marginTop: 4,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4
                                    }}>
                                        <FileText size={12}/>
                                        <span>Đã giải trình: {assignment.overrideReason}</span>
                                    </div>
                                )}
                                {effectiveConflicts.map((c, i) => (
                                    <div key={i} style={{color: '#FCD34D', marginTop: 4}}>
                                        ⚠ {c.message}
                                    </div>
                                ))}
                            </div>
                        );

                        return (
                            <Tooltip key={assignment.id} content={tooltipContent}>
                                <div
                                    className={`staff-shift-chip ${isExternal ? 'staff-shift-chip-external' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (canClickToOverride && onOpenOverrideModal) {
                                            onOpenOverrideModal(assignment);
                                        }
                                    }}
                                    title={
                                        canClickToOverride
                                            ? (assignment.overrideReason
                                                ? 'Bấm để xem hoặc chỉnh sửa giải trình'
                                                : 'Bấm để giải trình lý do phân ca đặc cách')
                                            : undefined
                                    }
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
                                            : (hasConflict ? '1px solid #F59E0B' : (assignment.overrideReason ? '1px solid #93C5FD' : (isHandover ? '1px solid #5EEAD4' : '1px solid #E2E8F0'))),
                                        boxShadow: isExternal ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)',
                                        opacity: isExternal ? 0.95 : 1,
                                        fontSize: '12px',
                                        cursor: canClickToOverride ? 'pointer' : 'default',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    {/* Employee info */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        overflow: 'hidden',
                                        flex: 1,
                                        minWidth: 0
                                    }}>
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
                                            title={displayName}
                                            style={{
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                lineHeight: 1.3,
                                                fontWeight: isExternal ? 500 : 600,
                                                color: isExternal ? '#475569' : '#0F172A',
                                                flex: 1,
                                                minWidth: 0,
                                            }}
                                        >
                                            {formatShiftChipName(displayName)}
                                        </span>


                                        {hasConflict && (
                                            <span title="Có cảnh báo xung đột"
                                                  style={{display: 'inline-flex', flexShrink: 0}}>
                                                <AlertTriangle size={12} color="#D97706"/>
                                            </span>
                                        )}

                                        {!handoverInfo.isHandover && assignment.overrideReason && (
                                            <span
                                                title={`Đã giải trình: ${assignment.overrideReason}`}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#2563EB',
                                                    backgroundColor: '#EFF6FF',
                                                    border: '1px solid #BFDBFE',
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: '4px',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <FileText size={11}/>
                                            </span>
                                        )}
                                    </div>

                                    {/* Action button */}
                                    <div style={{display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0}}>
                                        {(() => {
                                            const isOwner = Number(assignment.employeeId) === Number(currentUser?.id);
                                            const canRequestSwapOwn = Boolean(
                                                onOpenSwapModal &&
                                                !isExternal &&
                                                !assignment.readOnly &&
                                                (isManagerOrAdmin || isOwner)
                                            );
                                            const canRequestSwapColleague = Boolean(
                                                onOpenSwapWithColleague &&
                                                !isExternal &&
                                                !assignment.readOnly &&
                                                isEmployee &&
                                                !isOwner
                                            );

                                            if (canRequestSwapOwn) {
                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onOpenSwapModal?.(assignment);
                                                        }}
                                                        className="staff-chip-swap-btn"
                                                        title="Đề xuất nhường ca hoặc đổi ca này"
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: 2,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#6366F1',
                                                            borderRadius: 3,
                                                            transition: 'color 0.15s ease',
                                                        }}
                                                    >
                                                        <ArrowLeftRight size={12}/>
                                                    </button>
                                                );
                                            }

                                            if (canRequestSwapColleague) {
                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onOpenSwapWithColleague?.(assignment);
                                                        }}
                                                        className="staff-chip-colleague-swap-btn"
                                                        title={`Đề xuất đổi ca với đồng nghiệp ${displayName}`}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: 2,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#0284C7',
                                                            borderRadius: 3,
                                                            transition: 'color 0.15s ease',
                                                        }}
                                                    >
                                                        <ArrowLeftRight size={12}/>
                                                    </button>
                                                );
                                            }

                                            return null;
                                        })()}
                                        {isExternal || assignment.readOnly ? (
                                            <span
                                                title={`Ca làm việc tại ${assignment.branchName || 'chi nhánh khác'} (Chỉ đọc)`}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    color: '#94A3B8',
                                                    padding: 2,
                                                }}
                                            >
                                                <Lock size={12}/>
                                            </span>
                                        ) : (
                                            (canEdit || canCancelOwnClaim) && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (canEdit) {
                                                            onRemoveAssignment(assignment.id, e);
                                                        } else {
                                                            handleCancelOwnClaim(assignment);
                                                        }
                                                    }}
                                                    className="staff-chip-remove-btn"
                                                    title={canEdit ? `Gỡ ${displayName} khỏi ca này` : 'Hủy đăng ký ca này'}
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
                                                    }}
                                                >
                                                    <X size={12}/>
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            </Tooltip>
                        );
                    })}

                    {(() => {
                        const transferredList = assignments
                            .map((a) => ({ assignment: a, info: getAssignmentHandoverInfo(a, employees) }))
                            .filter((item) => item.info.isHandover);

                        if (transferredList.length === 0) return null;

                        return (
                            <div style={{marginTop: 3, borderTop: '1px dashed #CBD5E1', paddingTop: 3}}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowTransferred((prev) => !prev);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        background: showTransferred ? '#F1F5F9' : 'transparent',
                                        border: 'none',
                                        padding: '2px 5px',
                                        fontSize: '10.5px',
                                        color: '#64748B',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        fontWeight: 600,
                                        transition: 'all 0.15s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!showTransferred) e.currentTarget.style.backgroundColor = '#F8FAFC';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!showTransferred) e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                    title={showTransferred ? 'Thu gọn danh sách ca đã nhường' : 'Bấm để xem nhân sự ban đầu đã nhường ca'}
                                >
                                    <span style={{display: 'flex', alignItems: 'center', gap: 4}}>
                                        <Undo2 size={11} color="#64748B"/>
                                        <span>{transferredList.length} NV đã nhường ca</span>
                                    </span>
                                    {showTransferred ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
                                </button>

                                {showTransferred && (
                                    <div style={{display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4}}>
                                        {transferredList.map(({ assignment, info }) => {
                                            const activeEmp = employees.find((e) => e.id === assignment.employeeId);
                                            const activeName = activeEmp?.fullName || `NV #${assignment.employeeId}`;

                                            const origTooltip = (
                                                <div>
                                                    <div style={{fontWeight: 600}}>
                                                        {info.origName} {info.origCode ? `(${info.origCode})` : ''}
                                                    </div>
                                                    <div style={{color: '#FCD34D', fontSize: 11, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4}}>
                                                        <ArrowLeftRight size={11} />
                                                        <span>Đã nhường ca này cho {activeName}</span>
                                                    </div>
                                                    {info.reasonText && (
                                                        <div style={{
                                                            color: '#86EFAC',
                                                            fontSize: 11,
                                                            marginTop: 3,
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: 4
                                                        }}>
                                                            <FileText size={11} style={{flexShrink: 0, marginTop: 2}}/>
                                                            <span>Lý do giải trình: <strong>{info.reasonText}</strong></span>
                                                        </div>
                                                    )}
                                                    {info.requestCode && (
                                                        <div style={{color: '#94A3B8', fontSize: 10, marginTop: 2}}>
                                                            Mã đơn: {info.requestCode}
                                                        </div>
                                                    )}
                                                    {onOpenOverrideModal && (
                                                        <div style={{color: '#93C5FD', fontSize: 10.5, marginTop: 4, fontStyle: 'italic'}}>
                                                            Bấm để xem chi tiết giải trình
                                                        </div>
                                                    )}
                                                </div>
                                            );

                                            return (
                                                <Tooltip key={`transferred-${assignment.id}`} content={origTooltip}>
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onOpenOverrideModal) {
                                                                onOpenOverrideModal(assignment);
                                                            }
                                                        }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            gap: 5,
                                                            padding: '3px 6px',
                                                            borderRadius: '5px',
                                                            backgroundColor: '#F8FAFC',
                                                            border: '1px dashed #CBD5E1',
                                                            opacity: 0.85,
                                                            fontSize: '11px',
                                                            cursor: onOpenOverrideModal ? 'pointer' : 'default',
                                                            transition: 'all 0.15s ease',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#EFF6FF';
                                                            e.currentTarget.style.borderColor = '#93C5FD';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#F8FAFC';
                                                            e.currentTarget.style.borderColor = '#CBD5E1';
                                                        }}
                                                    >
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                            overflow: 'hidden',
                                                            flex: 1,
                                                            minWidth: 0
                                                        }}>
                                                            <UserAvatar name={info.origName} src={info.origAvatarUrl} size={16}/>
                                                            <span
                                                                title={info.origName}
                                                                style={{
                                                                    textDecoration: 'line-through',
                                                                    color: '#64748B',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    fontWeight: 500,
                                                                    flex: 1,
                                                                }}
                                                            >
                                                                {formatShiftChipName(info.origName)}
                                                            </span>
                                                        </div>
                                                        <span
                                                            style={{
                                                                fontSize: '9px',
                                                                fontWeight: 600,
                                                                color: '#DC2626',
                                                                backgroundColor: '#FEE2E2',
                                                                border: '1px solid #FECACA',
                                                                padding: '1px 4px',
                                                                borderRadius: '3px',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            Đã nhường
                                                        </span>
                                                    </div>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
});

ShiftGridCell.displayName = 'ShiftGridCell';
