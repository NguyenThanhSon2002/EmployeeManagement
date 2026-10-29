import React, { useState, useEffect, useMemo } from 'react';
import type { ShiftTemplate } from '@/types/domain.types';
import { useAvailabilityStore } from '../store/useAvailabilityStore';
import { useScheduleStore } from '@/features/schedule/store/useScheduleStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { calculateShiftDurations } from '@/utils/schedule-calc.utils';
import {
    CheckCircle2,
    Save,
    RotateCcw,
    Trash2,
    Clock,
    Loader2,
    Star,
} from 'lucide-react';

interface EmployeeAvailabilityTabProps {
    employeeId: number;
    employeeName: string;
    canEdit?: boolean;
    branchId?: number;
}

const DAYS_OF_WEEK = [
    { day: 1, label: 'Thứ Hai', short: 'T2' },
    { day: 2, label: 'Thứ Ba', short: 'T3' },
    { day: 3, label: 'Thứ Tư', short: 'T4' },
    { day: 4, label: 'Thứ Năm', short: 'T5' },
    { day: 5, label: 'Thứ Sáu', short: 'T6' },
    { day: 6, label: 'Thứ Bảy', short: 'T7' },
    { day: 7, label: 'Chủ Nhật', short: 'CN' },
];

const DEFAULT_FALLBACK_TEMPLATES: ShiftTemplate[] = [
    {
        id: 1,
        shiftCode: 'SANG',
        shiftName: 'Ca Sáng',
        startTime: '08:00',
        endTime: '12:00',
        breakMinutes: 0,
        isCrossMidnight: false,
        colorCode: '#2563EB',
        textColor: '#FFFFFF',
        minStaffing: 3,
        maxStaffing: 5,
        applicableDays: '1,2,3,4,5,6,7',
        isActive: true,
    },
    {
        id: 2,
        shiftCode: 'CHIEU',
        shiftName: 'Ca Chiều',
        startTime: '13:00',
        endTime: '17:00',
        breakMinutes: 0,
        isCrossMidnight: false,
        colorCode: '#10B981',
        textColor: '#FFFFFF',
        minStaffing: 3,
        maxStaffing: 5,
        applicableDays: '1,2,3,4,5,6,7',
        isActive: true,
    },
    {
        id: 3,
        shiftCode: 'TOI',
        shiftName: 'Ca Tối',
        startTime: '18:00',
        endTime: '22:00',
        breakMinutes: 0,
        isCrossMidnight: false,
        colorCode: '#8B5CF6',
        textColor: '#FFFFFF',
        minStaffing: 2,
        maxStaffing: 4,
        applicableDays: '1,2,3,4,5,6,7',
        isActive: true,
    },
];

export const EmployeeAvailabilityTab: React.FC<EmployeeAvailabilityTabProps> = ({
                                                                                    employeeId,
                                                                                    employeeName,
                                                                                    canEdit = true,
                                                                                    branchId,
                                                                                }) => {
    const { addToast } = useUIStore();
    const {
        getAvailability,
        getPreferredShiftIds,
        saveAvailability,
        fetchEmployeeAvailability,
    } = useAvailabilityStore();
    const { shiftTemplates, fetchShiftTemplates } = useScheduleStore();

    const [localGrid, setLocalGrid] = useState<Record<number, number[]>>(() =>
        getAvailability(employeeId)
    );
    const [localPreferredShifts, setLocalPreferredShifts] = useState<number[]>(() =>
        getPreferredShiftIds(employeeId)
    );
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchShiftTemplates(branchId);
    }, [branchId, fetchShiftTemplates]);

    // Tự động tải dữ liệu khả dụng từ backend khi mở tab nhân viên
    useEffect(() => {
        let isMounted = true;
        const loadAvailability = async () => {
            if (!employeeId) return;
            setIsLoading(true);
            try {
                const res = await fetchEmployeeAvailability(employeeId);
                if (isMounted) {
                    setLocalGrid(res.availabilities);
                    setLocalPreferredShifts(res.preferredShiftIds);
                    setIsDirty(false);
                }
            } catch (err) {
                console.error('Lỗi khi tải lịch khả dụng:', err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadAvailability();
        return () => {
            isMounted = false;
        };
    }, [employeeId, fetchEmployeeAvailability]);

    const activeTemplates = useMemo(() => {
        const list = shiftTemplates && shiftTemplates.length > 0 ? shiftTemplates : DEFAULT_FALLBACK_TEMPLATES;
        return list.filter((t) => t.isActive);
    }, [shiftTemplates]);

    // Toggle single cell
    const handleToggleCell = (shiftId: number, dayOfWeek: number) => {
        if (!canEdit) return;
        setLocalGrid((prev) => {
            const currentList = prev[dayOfWeek] ? [...prev[dayOfWeek]] : [];
            const idx = currentList.indexOf(shiftId);
            if (idx >= 0) {
                currentList.splice(idx, 1);
            } else {
                currentList.push(shiftId);
            }
            return {
                ...prev,
                [dayOfWeek]: currentList,
            };
        });
        setIsDirty(true);
    };

    // Toggle entire shift across 7 days
    const handleToggleShiftRow = (shiftId: number) => {
        if (!canEdit) return;
        const isAllSelected = DAYS_OF_WEEK.every((d) => (localGrid[d.day] || []).includes(shiftId));

        setLocalGrid((prev) => {
            const next = { ...prev };
            for (const d of DAYS_OF_WEEK) {
                const set = new Set(next[d.day] || []);
                if (isAllSelected) {
                    set.delete(shiftId);
                } else {
                    set.add(shiftId);
                }
                next[d.day] = Array.from(set);
            }
            return next;
        });
        setIsDirty(true);
    };

    // Toggle preferred shift
    const handleTogglePreferredShift = (shiftId: number) => {
        if (!canEdit) return;
        setLocalPreferredShifts((prev) => {
            const exists = prev.includes(shiftId);
            return exists ? prev.filter((id) => id !== shiftId) : [...prev, shiftId];
        });
        setIsDirty(true);
    };

    // Clear all
    const handleClearAll = () => {
        if (!canEdit) return;
        const cleared: Record<number, number[]> = {
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: [],
            7: [],
        };
        setLocalGrid(cleared);
        setLocalPreferredShifts([]);
        setIsDirty(true);
    };

    // Reset to saved state
    const handleReset = () => {
        setLocalGrid(getAvailability(employeeId));
        setLocalPreferredShifts(getPreferredShiftIds(employeeId));
        setIsDirty(false);
    };

    // Save changes lên database
    const handleSave = async () => {
        if (!canEdit || isSaving) return;
        setIsSaving(true);
        try {
            const success = await saveAvailability(employeeId, localGrid, localPreferredShifts);
            if (success) {
                setIsDirty(false);
                addToast({
                    type: 'success',
                    title: 'Lưu thành công',
                    message: `Đã cập nhật lịch làm việc và ca ưu tiên cho nhân sự ${employeeName}.`,
                });
            } else {
                addToast({
                    type: 'error',
                    title: 'Lưu thất bại',
                    message: 'Không thể lưu lịch làm việc lên máy chủ. Vui lòng thử lại.',
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Count total available slots
    const totalSlots = useMemo(() => {
        let count = 0;
        for (let d = 1; d <= 7; d++) {
            count += (localGrid[d] || []).length;
        }
        return count;
    }, [localGrid]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Top Banner & Info */}
            <div
                className="card"
                style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                    backgroundColor: 'var(--color-bg-surface, #FFFFFF)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: 640 }}>
                    <div
                        style={{
                            padding: 8,
                            borderRadius: 8,
                            backgroundColor: '#EFF6FF',
                            color: 'var(--color-primary, #2563EB)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Clock size={20} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                                Lịch Làm Việc Khả Dụng Trong Tuần
                            </h2>
                            <span
                                className="badge"
                                style={{
                                    backgroundColor: totalSlots > 0 ? '#ECFDF5' : '#F3F4F6',
                                    color: totalSlots > 0 ? '#059669' : '#6B7280',
                                    fontWeight: 600,
                                    fontSize: 12,
                                }}
                            >
                                {isLoading ? 'Đang nạp dữ liệu...' : `${totalSlots} ca khả dụng/tuần`}
                            </span>
                            {localPreferredShifts.length > 0 && (
                                <span
                                    className="badge"
                                    style={{
                                        backgroundColor: '#FEF3C7',
                                        color: '#B45309',
                                        fontWeight: 600,
                                        fontSize: 12,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        border: '1px solid #FDE68A',
                                    }}
                                >
                                    <Star size={11} fill="#B45309" color="#B45309" />
                                    {localPreferredShifts.length} ca ưu tiên
                                </span>
                            )}
                        </div>
                        <p
                            style={{
                                fontSize: 13,
                                color: 'var(--color-text-secondary, #6B7280)',
                                margin: '4px 0 0 0',
                                lineHeight: 1.4,
                            }}
                        >
                            Tích chọn các ca mà nhân sự có thể làm việc từ Thứ Hai đến Chủ Nhật.
                            Bấm biểu tượng ngôi sao ⭐ cạnh tên ca để đánh dấu các ca nhân sự mong muốn ưu tiên làm việc.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                {canEdit && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className="btn btn-default"
                            onClick={handleClearAll}
                            disabled={isSaving || isLoading}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, height: 36 }}
                            title="Xóa trắng toàn bộ lịch rảnh"
                        >
                            <Trash2 size={15} color="#DC2626" /> Xóa toàn bộ
                        </button>

                        {isDirty && (
                            <button
                                type="button"
                                className="btn btn-default"
                                onClick={handleReset}
                                disabled={isSaving || isLoading}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, height: 36 }}
                                title="Khôi phục trạng thái ban đầu"
                            >
                                <RotateCcw size={15} /> Hoàn tác
                            </button>
                        )}

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={!isDirty || isSaving || isLoading}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 13,
                                height: 36,
                                fontWeight: 600,
                                opacity: isDirty && !isSaving ? 1 : 0.6,
                                cursor: isDirty && !isSaving ? 'pointer' : 'not-allowed',
                            }}
                        >
                            {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                            {isSaving ? 'Đang lưu...' : 'Lưu lịch khả dụng'}
                        </button>
                    </div>
                )}
            </div>

            {/* Availability Matrix Table */}
            <div
                className="card"
                style={{
                    padding: 0,
                    overflowX: 'auto',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
                }}
            >
                <table
                    style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        textAlign: 'left',
                        fontSize: 13,
                    }}
                >
                    <thead>
                    <tr
                        style={{
                            backgroundColor: 'var(--color-bg-subtle, #F8FAFC)',
                            borderBottom: '2px solid var(--color-border)',
                        }}
                    >
                        <th
                            style={{
                                padding: '12px 16px',
                                fontWeight: 700,
                                color: 'var(--color-text-main, #1F2937)',
                                minWidth: 220,
                                width: '24%',
                                position: 'sticky',
                                left: 0,
                                backgroundColor: 'var(--color-bg-subtle, #F8FAFC)',
                                zIndex: 2,
                                borderRight: '1px solid var(--color-border)',
                            }}
                        >
                            Mẫu Ca Làm Việc
                        </th>
                        {DAYS_OF_WEEK.map((d) => (
                            <th
                                key={d.day}
                                style={{
                                    padding: '12px 10px',
                                    fontWeight: 700,
                                    textAlign: 'center',
                                    color: d.day >= 6 ? 'var(--color-primary, #2563EB)' : 'var(--color-text-main, #1F2937)',
                                    minWidth: 100,
                                    width: '10.8%',
                                    borderRight: '1px solid var(--color-border-subtle, #E2E8F0)',
                                }}
                            >
                                <div>{d.label}</div>
                                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary, #6B7280)' }}>
                                    ({d.short})
                                </div>
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {activeTemplates.map((template) => {
                        const { netHours } = calculateShiftDurations(
                            template.startTime,
                            template.endTime,
                            template.breakMinutes,
                            template.isCrossMidnight
                        );
                        const isRowFullySelected = DAYS_OF_WEEK.every((d) =>
                            (localGrid[d.day] || []).includes(template.id)
                        );

                        const isPreferred = localPreferredShifts.includes(template.id);

                        return (
                            <tr
                                key={template.id}
                                style={{
                                    borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)',
                                    transition: 'background-color 0.15s ease',
                                }}
                            >
                                {/* Sticky Shift Info Column */}
                                <td
                                    style={{
                                        padding: '14px 16px',
                                        position: 'sticky',
                                        left: 0,
                                        backgroundColor: 'var(--color-bg-surface, #FFFFFF)',
                                        zIndex: 1,
                                        borderRight: '1px solid var(--color-border)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                            {/* Star Button for Favorite Shift */}
                                            {canEdit ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleTogglePreferredShift(template.id)}
                                                    style={{
                                                        background: isPreferred ? '#FEF3C7' : 'transparent',
                                                        border: isPreferred ? '1px solid #FDE68A' : '1px solid transparent',
                                                        padding: 5,
                                                        borderRadius: 6,
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: isPreferred ? '#D97706' : '#94A3B8',
                                                        transition: 'all 0.15s ease',
                                                        flexShrink: 0,
                                                    }}
                                                    title={isPreferred ? 'Bỏ đánh dấu ca ưu tiên' : 'Đánh dấu ca này là ca ưu tiên làm việc'}
                                                >
                                                    <Star
                                                        size={16}
                                                        fill={isPreferred ? '#F59E0B' : 'transparent'}
                                                        color={isPreferred ? '#D97706' : '#94A3B8'}
                                                    />
                                                </button>
                                            ) : isPreferred ? (
                                                <div
                                                    style={{
                                                        padding: 5,
                                                        borderRadius: 6,
                                                        backgroundColor: '#FEF3C7',
                                                        border: '1px solid #FDE68A',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                    title="Ca ưu tiên làm việc"
                                                >
                                                    <Star size={16} fill="#F59E0B" color="#D97706" />
                                                </div>
                                            ) : null}

                                            {/* Shift Color Indicator */}
                                            <div
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    backgroundColor: template.colorCode || '#2563EB',
                                                    flexShrink: 0,
                                                }}
                                            />

                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 700, fontSize: 14 }}>{template.shiftName}</span>
                                                    {isPreferred && (
                                                        <span
                                                            style={{
                                                                fontSize: 10,
                                                                fontWeight: 700,
                                                                backgroundColor: '#FEF3C7',
                                                                color: '#B45309',
                                                                padding: '1px 6px',
                                                                borderRadius: 10,
                                                                border: '1px solid #FDE68A',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 3,
                                                            }}
                                                        >
                                                            Ưu tiên
                                                        </span>
                                                    )}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        color: 'var(--color-text-secondary, #6B7280)',
                                                        marginTop: 2,
                                                    }}
                                                >
                                                    {template.startTime} - {template.endTime}
                                                    {template.isCrossMidnight && ' (+1)'} • {netHours}h
                                                </div>
                                            </div>
                                        </div>

                                        {canEdit && (
                                            <button
                                                type="button"
                                                onClick={() => handleToggleShiftRow(template.id)}
                                                style={{
                                                    fontSize: 11,
                                                    padding: '4px 10px',
                                                    borderRadius: 4,
                                                    border: '1px solid var(--color-border)',
                                                    backgroundColor: isRowFullySelected ? '#EFF6FF' : '#F9FAFB',
                                                    color: isRowFullySelected ? '#1D4ED8' : 'var(--color-text-secondary)',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                    whiteSpace: 'nowrap',
                                                    flexShrink: 0,
                                                }}
                                                title={isRowFullySelected ? 'Bỏ chọn cả tuần' : 'Chọn nhanh cả tuần'}
                                            >
                                                {isRowFullySelected ? 'Bỏ cả tuần' : 'Cả tuần'}
                                            </button>
                                        )}
                                    </div>
                                </td>

                                {/* 7 Days of Week Interactive Cells */}
                                {DAYS_OF_WEEK.map((d) => {
                                    const isSelected = (localGrid[d.day] || []).includes(template.id);
                                    return (
                                        <td
                                            key={d.day}
                                            style={{
                                                padding: '10px 8px',
                                                textAlign: 'center',
                                                borderRight: '1px solid var(--color-border-subtle, #E2E8F0)',
                                                backgroundColor: isSelected ? '#F0FDF4' : 'transparent',
                                            }}
                                        >
                                            <button
                                                type="button"
                                                disabled={!canEdit || isLoading}
                                                onClick={() => handleToggleCell(template.id, d.day)}
                                                style={{
                                                    width: '100%',
                                                    minHeight: 46,
                                                    padding: '6px 4px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 2,
                                                    borderRadius: 6,
                                                    border: isSelected ? '1.5px solid #10B981' : '1px dashed #CBD5E1',
                                                    backgroundColor: isSelected ? '#ECFDF5' : '#FFFFFF',
                                                    color: isSelected ? '#065F46' : '#94A3B8',
                                                    fontWeight: isSelected ? 700 : 500,
                                                    fontSize: 12,
                                                    cursor: canEdit && !isLoading ? 'pointer' : 'default',
                                                    transition: 'all 0.15s ease',
                                                }}
                                                title={`${d.label} - ${template.shiftName}: ${
                                                    isSelected
                                                        ? isPreferred ? 'Sẵn sàng (Thuộc ca ưu tiên)' : 'Đang sẵn sàng'
                                                        : 'Không làm việc'
                                                }`}
                                            >
                                                {isSelected ? (
                                                    <>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <CheckCircle2 size={15} color="#10B981" />
                                                            <span style={{ fontSize: 11 }}>Sẵn sàng</span>
                                                        </div>
                                                        {isPreferred && (
                                                            <div
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 3,
                                                                    fontSize: 10,
                                                                    fontWeight: 700,
                                                                    color: '#B45309',
                                                                    lineHeight: 1,
                                                                }}
                                                            >
                                                                <Star size={10} fill="#F59E0B" color="#D97706" />
                                                                <span>Ưu tiên</span>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span style={{ fontSize: 14, color: '#94A3B8' }}>-</span>
                                                )}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};