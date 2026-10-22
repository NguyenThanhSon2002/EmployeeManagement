import React, {useEffect, useState} from 'react';
import {addDays, format, getISODay, parseISO} from 'date-fns';
import type {AutoAssignResult} from '@/utils/auto-assign.utils';
import {formatDateIso} from '@/utils/date.utils';
import {useModalFocusTrap} from '@/hooks/useModalFocusTrap';
import type {ShiftAssignment} from '@/types/domain.types';
import {X, Users, Check, Eye, AlertTriangle} from 'lucide-react';

interface BulkAssignDialogProps {
    isOpen: boolean;
    currentStartDate: string; // YYYY-MM-DD
    onClose: () => void;

    /** Chạy thuật toán xếp tự động (chỉ tính toán, chưa lưu). Trả về null nếu bị chặn. */
    onGenerateAuto: (fromDate: string, toDate: string) => AutoAssignResult | null;
    /** Lưu các ca đã duyệt từ bản xem trước */
    onApplyAuto: (assignments: ShiftAssignment[]) => void;
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

export const BulkAssignDialog: React.FC<BulkAssignDialogProps> = ({
                                                                      isOpen,
                                                                      currentStartDate,
                                                                      onClose,
                                                                      onGenerateAuto,
                                                                      onApplyAuto,
                                                                  }) => {
    const modalRef = useModalFocusTrap({isOpen, onClose});

    const [fromDate, setFromDate] = useState<string>(currentStartDate);
    const [toDate, setToDate] = useState<string>(addDaysIso(currentStartDate, 6));
    const [preview, setPreview] = useState<AutoAssignResult | null>(null);
    const [autoError, setAutoError] = useState<string | null>(null);

    // Mỗi lần mở dialog: đồng bộ ngày với tuần đang xem và xóa bản xem trước cũ
    useEffect(() => {
        if (isOpen) {
            setFromDate(currentStartDate);
            setToDate(addDaysIso(currentStartDate, 6));
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
        setPreview(onGenerateAuto(fromDate, toDate));
    };

    const handleApplyAuto = () => {
        if (!preview || preview.proposals.length === 0) return;
        onApplyAuto(preview.proposals.map((p) => p.assignment));
        onClose();
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
                                                <span style={{flex: 1}}>{s.employeeName}</span>
                                                <span style={{width: 150}}>
                          +{s.addedShifts} ca (+{s.addedHours}h)
                        </span>
                                                <span style={{width: 110, color: 'var(--color-text-muted)'}}>
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