import React, {useEffect, useState} from 'react';
import {addDays, format, getISODay, parseISO} from 'date-fns';
import {
    AutoAssignResult,
    findEligibleUnfilledSlot,
    pickShiftToRemove,
    recalculateAutoSummaries
} from '@/utils/auto-assign.utils';
import {formatDateIso} from '@/utils/date.utils';
import {useModalFocusTrap} from '@/hooks/useModalFocusTrap';
import type {
    CompanyHoliday,
    DemoSettings,
    Employee,
    LeaveRequest,
    ShiftAssignment,
    ShiftTemplate
} from '@/types/domain.types';
import {X, Users, Check, Eye, AlertTriangle, Minus, Plus} from 'lucide-react';

interface BulkAssignDialogProps {
    isOpen: boolean;
    currentStartDate: string; // YYYY-MM-DD
    onClose: () => void;

    /** Chạy thuật toán xếp tự động (chỉ tính toán, chưa lưu). Trả về null nếu bị chặn. */
    onGenerateAuto: (fromDate: string, toDate: string, mode: 'REPLACE_ALL' | 'FILL_MISSING') => AutoAssignResult | null;
    /** Lưu các ca đã duyệt từ bản xem trước */
    onApplyAuto: (assignments: ShiftAssignment[], mode: 'REPLACE_ALL' | 'FILL_MISSING', fromDate: string, toDate: string) => void;

    employees: Employee[];
    shiftTemplates: ShiftTemplate[];
    existingAssignments: ShiftAssignment[];
    approvedLeaves: LeaveRequest[];
    holidays: CompanyHoliday[];
    settings: DemoSettings;
    scheduleId: number;
    isAvailable: (employeeId: number, dayOfWeek: number, shiftTemplateId: number) => boolean;
    onToast: (toast: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
}

const DAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const addDaysIso = (start: string, days: number): string =>
    formatDateIso(addDays(parseISO(start), days));

const formatDayLabel = (dateStr: string): string => {
    const d = parseISO(dateStr);
    return `${DAY_SHORT[getISODay(d) - 1]} ${format(d, 'dd/MM')}`;
};

const listBoxStyle: React.CSSProperties = {
    maxHeight: 190,
    overflowY: 'auto',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: 4,
    marginBottom: 10,
};

const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '5px 8px',
    fontSize: 'var(--font-caption)',
};

const sectionTitleStyle: React.CSSProperties = {
    fontSize: 'var(--font-caption)',
    fontWeight: 600,
    marginBottom: 4,
};

const stepperButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: 4,
    border: '1px solid var(--color-border)',
    background: '#FFFFFF',
    color: 'var(--color-text-main)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    padding: 0,
};

export const BulkAssignDialog: React.FC<BulkAssignDialogProps> = ({
                                                                      isOpen,
                                                                      currentStartDate,
                                                                      onClose,
                                                                      onGenerateAuto,
                                                                      onApplyAuto,
                                                                      employees,
                                                                      shiftTemplates,
                                                                      existingAssignments,
                                                                      approvedLeaves,
                                                                      holidays,
                                                                      settings,
                                                                      scheduleId,
                                                                      isAvailable,
                                                                      onToast,
                                                                  }) => {
    const modalRef = useModalFocusTrap({isOpen, onClose});

    const [fromDate, setFromDate] = useState<string>(currentStartDate);
    const [toDate, setToDate] = useState<string>(addDaysIso(currentStartDate, 6));
    const [mode, setMode] = useState<'REPLACE_ALL' | 'FILL_MISSING'>('REPLACE_ALL');
    const [preview, setPreview] = useState<AutoAssignResult | null>(null);
    const [autoError, setAutoError] = useState<string | null>(null);

    // Mỗi lần mở dialog: đồng bộ ngày với tuần đang xem và xóa bản xem trước cũ
    useEffect(() => {
        if (isOpen) {
            setFromDate(currentStartDate);
            setToDate(addDaysIso(currentStartDate, 6));
            setMode('REPLACE_ALL');
            setPreview(null);
            setAutoError(null);
        }
    }, [isOpen, currentStartDate]);

    if (!isOpen) return null;

    const handlePreviewAuto = () => {
        setAutoError(null);
        if (fromDate > toDate) {
            setAutoError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
            return;
        }
        // null nghĩa là bị chặn (ví dụ lịch đã công bố), SchedulePage sẽ hiện thông báo
        setPreview(onGenerateAuto(fromDate, toDate, mode));
    };

    const handleApplyAuto = () => {
        if (!preview || preview.proposals.length === 0) return;
        onApplyAuto(preview.proposals.map((p) => p.assignment), mode, fromDate, toDate);
        onClose();
    };

    const effectiveExisting = mode === 'REPLACE_ALL'
        ? existingAssignments.filter((a) => a.workDate < fromDate || a.workDate > toDate)
        : existingAssignments;

    const handleDecrementShift = (employeeId: number) => {
        if (!preview) return;

        const shiftToRemove = pickShiftToRemove(
            employeeId,
            preview.proposals,
            employees,
            isAvailable,
            effectiveExisting
        );

        if (!shiftToRemove) {
            onToast({
                type: 'warning',
                title: 'Không thể giảm',
                message: 'Nhân viên này chưa có ca nào trong bản xem trước.',
            });
            return;
        }

        // 1. Gỡ ca khỏi proposals
        const nextProposals = preview.proposals.filter((p) => p.assignment.id !== shiftToRemove.assignment.id);

        // 2. Thêm vào unfilled slots
        const targetDate = shiftToRemove.assignment.workDate;
        const targetShiftId = shiftToRemove.assignment.workShiftId;
        const existingUnfilledIdx = preview.unfilled.findIndex(
            (u) => u.workDate === targetDate && u.workShiftId === targetShiftId
        );

        let nextUnfilled = [...preview.unfilled];
        if (existingUnfilledIdx >= 0) {
            nextUnfilled[existingUnfilledIdx] = {
                ...nextUnfilled[existingUnfilledIdx],
                missing: nextUnfilled[existingUnfilledIdx].missing + 1,
            };
        } else {
            nextUnfilled.push({
                workDate: targetDate,
                workShiftId: targetShiftId,
                shiftName: shiftToRemove.assignment.snapshotShiftName,
                missing: 1,
                reason: 'Quản lý chủ động giảm ca (sẵn sàng điều chuyển)',
            });
        }

        // Sắp xếp lại unfilled theo ngày và giờ ca
        nextUnfilled.sort((a, b) => a.workDate.localeCompare(b.workDate) || a.workShiftId - b.workShiftId);

        // 3. Tính lại summaries
        const nextSummaries = recalculateAutoSummaries(
            employees,
            nextProposals,
            existingAssignments,
            fromDate,
            toDate,
            mode
        );

        setPreview({
            proposals: nextProposals,
            unfilled: nextUnfilled,
            summaries: nextSummaries,
        });

        onToast({
            type: 'info',
            title: 'Đã giảm 1 ca',
            message: `Đã giảm ca ${shiftToRemove.assignment.snapshotShiftName} (${formatDayLabel(targetDate)}) của ${shiftToRemove.employeeName}.`,
        });
    };

    const handleIncrementShift = (employeeId: number) => {
        if (!preview) return;

        const candidate = findEligibleUnfilledSlot(
            employeeId,
            preview.unfilled,
            preview.proposals,
            effectiveExisting,
            shiftTemplates,
            isAvailable,
            approvedLeaves,
            holidays,
            settings,
            employees,
            scheduleId
        );

        if (!candidate) {
            onToast({
                type: 'warning',
                title: 'Không có ca trống phù hợp',
                message: 'Không còn ca trống phù hợp cho nhân viên này. Hãy bấm [-] ở nhân viên khác để nhả ca trước.',
            });
            return;
        }

        const { slot, proposal } = candidate;

        // 1. Bổ sung proposal
        const nextProposals = [...preview.proposals, proposal];

        // 2. Giảm hoặc xóa slot khỏi unfilled
        const nextUnfilled = preview.unfilled
            .map((u) => {
                if (u.workDate === slot.workDate && u.workShiftId === slot.workShiftId) {
                    return { ...u, missing: u.missing - 1 };
                }
                return u;
            })
            .filter((u) => u.missing > 0);

        // 3. Tính lại summaries
        const nextSummaries = recalculateAutoSummaries(
            employees,
            nextProposals,
            existingAssignments,
            fromDate,
            toDate,
            mode
        );

        setPreview({
            proposals: nextProposals,
            unfilled: nextUnfilled,
            summaries: nextSummaries,
        });

        onToast({
            type: 'success',
            title: 'Đã thêm ca thành công',
            message: `Đã gán ca ${proposal.assignment.snapshotShiftName} (${formatDayLabel(slot.workDate)}) cho ${proposal.employeeName}.`,
        });
    };

    const sortedProposals = preview
        ? [...preview.proposals].sort(
            (a, b) =>
                a.assignment.workDate.localeCompare(b.assignment.workDate) ||
                a.assignment.snapshotStartTime.localeCompare(b.assignment.snapshotStartTime) ||
                a.employeeName.localeCompare(b.employeeName)
        )
        : [];
    const warningCount = sortedProposals.filter((p) => p.tier > 1).length;

    return (
        <>
            <div className="drawer-backdrop" onClick={onClose} aria-hidden="true"/>
            <div
                ref={modalRef}
                className="modal-dialog"
                role="dialog"
                aria-labelledby="bulk-dialog-heading"
                aria-modal="true"
                style={{width: 680}}
            >
                <div
                    style={{
                        padding: 'var(--space-md) var(--space-lg)',
                        borderBottom: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                        <Users size={20} color="var(--color-primary)"/>
                        <h2 id="bulk-dialog-heading" style={{fontSize: 'var(--font-h3)', fontWeight: 600}}>
                            Gán Ca Làm Việc Hàng Loạt
                        </h2>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Đóng hộp thoại">
                        <X size={20}/>
                    </button>
                </div>

                <div
                    style={{
                        padding: 'var(--space-lg)',
                        overflowY: 'auto',
                        maxHeight: 'calc(100vh - 220px)',
                    }}
                >

                    {/* Khoảng ngày cần xếp */}
                    <div style={{display: 'flex', gap: 12, marginBottom: 'var(--space-md)'}}>
                        <div style={{flex: 1}}>
                            <label
                                style={{
                                    display: 'block',
                                    fontWeight: 600,
                                    fontSize: 'var(--font-caption)',
                                    marginBottom: 4,
                                }}
                            >
                                Từ ngày:
                            </label>
                            <input
                                type="date"
                                className="input-base"
                                style={{width: '100%'}}
                                value={fromDate}
                                onChange={(e) => {
                                    setFromDate(e.target.value);
                                    setPreview(null);
                                }}
                            />
                        </div>
                        <div style={{flex: 1}}>
                            <label
                                style={{
                                    display: 'block',
                                    fontWeight: 600,
                                    fontSize: 'var(--font-caption)',
                                    marginBottom: 4,
                                }}
                            >
                                Đến ngày:
                            </label>
                            <input
                                type="date"
                                className="input-base"
                                style={{width: '100%'}}
                                value={toDate}
                                onChange={(e) => {
                                    setToDate(e.target.value);
                                    setPreview(null);
                                }}
                            />
                        </div>
                    </div>

                    {/* Chế độ xếp ca */}
                    <div style={{marginBottom: 'var(--space-md)', padding: '10px 12px', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)'}}>
                        <div style={{fontWeight: 600, fontSize: 'var(--font-caption)', marginBottom: 8}}>
                            Chế độ xếp ca:
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                            <label style={{display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 'var(--font-caption)'}}>
                                <input
                                    type="radio"
                                    name="assignMode"
                                    value="REPLACE_ALL"
                                    checked={mode === 'REPLACE_ALL'}
                                    onChange={() => {
                                        setMode('REPLACE_ALL');
                                        setPreview(null);
                                    }}
                                    style={{marginTop: 2}}
                                />
                                <div>
                                    <span style={{fontWeight: 600, color: '#1E293B'}}>Xếp lại toàn bộ (Khuyên dùng)</span>
                                    <p style={{margin: '2px 0 0 0', color: 'var(--color-text-muted)', fontSize: 12}}>
                                        Xóa các ca đã gán trong khoảng ngày này và tự động phân bổ lại toàn bộ, đảm bảo chuẩn định biên nhân sự trên từng ca (không bị vượt giới hạn).
                                    </p>
                                </div>
                            </label>
                            <label style={{display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 'var(--font-caption)'}}>
                                <input
                                    type="radio"
                                    name="assignMode"
                                    value="FILL_MISSING"
                                    checked={mode === 'FILL_MISSING'}
                                    onChange={() => {
                                        setMode('FILL_MISSING');
                                        setPreview(null);
                                    }}
                                    style={{marginTop: 2}}
                                />
                                <div>
                                    <span style={{fontWeight: 600, color: '#1E293B'}}>Giữ ca hiện có, chỉ điền vào ca còn thiếu</span>
                                    <p style={{margin: '2px 0 0 0', color: 'var(--color-text-muted)', fontSize: 12}}>
                                        Giữ nguyên những ca đã xếp thủ công, chỉ tự động bổ sung nhân sự cho các ca chưa đủ định biên tối thiểu.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Bản xem trước (tự động) */}
                    {autoError && (
                        <div style={{color: '#DC2626', fontSize: 'var(--font-caption)'}}>{autoError}</div>
                    )}

                    {preview && (
                        <div>
                            <div style={{...sectionTitleStyle, fontSize: 'var(--font-body-md)', marginBottom: 8}}>
                                Đề xuất {preview.proposals.length} ca
                                {warningCount > 0 && (
                                    <span style={{color: '#D97706'}}> · {warningCount} ca có cảnh báo</span>
                                )}
                                {preview.unfilled.length > 0 && (
                                    <span style={{color: '#DC2626'}}>
                    {' '}
                                        · {preview.unfilled.length} ô chưa lấp được
                  </span>
                                )}
                            </div>

                            {preview.proposals.length === 0 && preview.unfilled.length === 0 && (
                                <div style={{fontSize: 'var(--font-caption)', color: 'var(--color-text-muted)'}}>
                                    Không có ô nào cần xếp thêm trong khoảng ngày này (đã đủ định biên).
                                </div>
                            )}

                            {sortedProposals.length > 0 && (
                                <div style={listBoxStyle}>
                                    {sortedProposals.map((p) => {
                                        const tooltip = [...p.notes, ...p.warnings.map((w) => w.message)].join('\n');
                                        return (
                                            <div key={p.assignment.id} style={rowStyle} title={tooltip || undefined}>
                        <span style={{width: 84, color: 'var(--color-text-muted)'}}>
                          {formatDayLabel(p.assignment.workDate)}
                        </span>
                                                <span style={{width: 90, fontWeight: 600}}>
                          {p.assignment.snapshotShiftName}
                        </span>
                                                <span style={{flex: 1}}>
                          {p.employeeName}{' '}
                                                    <span style={{color: 'var(--color-text-muted)'}}>
                            ({p.employeeCode})
                          </span>
                        </span>
                                                {p.tier > 1 && (
                                                    <span
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 3,
                                                            fontSize: 10,
                                                            fontWeight: 600,
                                                            backgroundColor: '#FEF3C7',
                                                            color: '#D97706',
                                                            padding: '1px 6px',
                                                            borderRadius: 4,
                                                        }}
                                                    >
                            <AlertTriangle size={11}/>
                                                        {p.tier === 3 ? 'Vượt ca/ngày' : 'Cảnh báo'}
                          </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {preview.unfilled.length > 0 && (
                                <>
                                    <div style={sectionTitleStyle}>Chưa lấp được</div>
                                    <div style={listBoxStyle}>
                                        {preview.unfilled.map((u) => (
                                            <div key={`${u.workDate}_${u.workShiftId}`} style={rowStyle}>
                        <span style={{width: 84, color: 'var(--color-text-muted)'}}>
                          {formatDayLabel(u.workDate)}
                        </span>
                                                <span style={{width: 90, fontWeight: 600}}>{u.shiftName}</span>
                                                <span style={{flex: 1, color: '#DC2626'}}>
                          Thiếu {u.missing} · {u.reason}
                        </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {preview.summaries.length > 0 && (
                                <>
                                    <div style={sectionTitleStyle}>Mức độ chia đều giờ làm</div>
                                    <div style={listBoxStyle}>
                                        {preview.summaries.map((s) => (
                                            <div key={s.employeeId} style={rowStyle}>
                                                <span style={{flex: 1, fontWeight: 500}}>{s.employeeName}</span>
                                                <div style={{display: 'flex', alignItems: 'center', gap: 6, width: 140}}>
                                                    <button
                                                        type="button"
                                                        style={stepperButtonStyle}
                                                        onClick={() => handleDecrementShift(s.employeeId)}
                                                        disabled={s.addedShifts <= 0}
                                                        title="Giảm 1 ca của nhân viên này"
                                                        aria-label={`Giảm 1 ca của ${s.employeeName}`}
                                                    >
                                                        <Minus size={13}/>
                                                    </button>
                                                    <span
                                                        style={{
                                                            minWidth: 42,
                                                            textAlign: 'center',
                                                            fontWeight: 600,
                                                            color: 'var(--color-primary)',
                                                        }}
                                                    >
                                                        {s.addedShifts} ca
                                                    </span>
                                                    <button
                                                        type="button"
                                                        style={stepperButtonStyle}
                                                        onClick={() => handleIncrementShift(s.employeeId)}
                                                        title="Tăng 1 ca cho nhân viên này"
                                                        aria-label={`Tăng 1 ca cho ${s.employeeName}`}
                                                    >
                                                        <Plus size={13}/>
                                                    </button>
                                                </div>
                                                <span style={{width: 100, textAlign: 'right', color: 'var(--color-text-muted)'}}>
                                                    Tổng {s.totalHours}h
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div
                    style={{
                        padding: 'var(--space-md) var(--space-lg)',
                        borderTop: '1px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 8,
                        backgroundColor: '#fafafa',
                    }}
                >
                    <button type="button" className="btn btn-default" onClick={onClose}>
                        Hủy bỏ
                    </button>
                    <>
                        <button
                            type="button"
                            className="btn btn-default"
                            onClick={handlePreviewAuto}
                            style={{display: 'flex', alignItems: 'center', gap: 6}}
                        >
                            <Eye size={16}/>
                            Xem trước
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            disabled={!preview || preview.proposals.length === 0}
                            onClick={handleApplyAuto}
                            style={{display: 'flex', alignItems: 'center', gap: 6}}
                        >
                            <Check size={16}/>
                            Áp dụng{preview && preview.proposals.length > 0 ? ` ${preview.proposals.length} ca` : ''}
                        </button>
                    </>
                </div>
            </div>
        </>
    );
};