import React, {useState, useEffect, useMemo} from 'react';
import type {ShiftAssignment, Employee} from '@/types/domain.types';
import type {SimulateSwapResult, SwapType} from '../types/swap.types';
import {shiftSwapService} from '../api/shiftSwapService';
import {useModalFocusTrap} from '@/hooks/useModalFocusTrap';
import {useUIStore} from '@/shared/store/useUIStore';
import {
    ArrowLeftRight,
    X,
    CheckCircle,
    Loader2,
    Send,
    ShieldAlert,
    ArrowRight,
    Repeat,
    Sparkles,
    Users,
} from 'lucide-react';

const isClientTemporaryId = (id: number) => !id || id > 1_000_000_000_000;

const MAX_REASON_LENGTH = 500;

const SWAP_REASON_SUGGESTIONS = [
    'Có việc gia đình đột xuất',
    'Bận việc cá nhân',
    'Trùng lịch học / thi',
    'Đã thống nhất đổi ca với đồng nghiệp',
];

export interface ShiftSwapModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceAssignment?: ShiftAssignment | null;
    targetAssignment?: ShiftAssignment | null;
    initialType?: SwapType;
    employees: Employee[];
    allAssignments?: ShiftAssignment[];
    currentUserId: number;
    onSuccess: () => void;
}

export const ShiftSwapModal: React.FC<ShiftSwapModalProps> = ({
                                                                  isOpen,
                                                                  onClose,
                                                                  sourceAssignment,
                                                                  targetAssignment,
                                                                  initialType,
                                                                  employees,
                                                                  allAssignments = [],
                                                                  currentUserId,
                                                                  onSuccess,
                                                              }) => {
    const modalRef = useModalFocusTrap({isOpen, onClose});
    const {addToast} = useUIStore();

    const [swapType, setSwapType] = useState<SwapType>('HANDOVER');
    const [selectedSourceId, setSelectedSourceId] = useState<number>(0);
    const [targetEmployeeId, setTargetEmployeeId] = useState<number>(0);
    const [selectedTargetId, setSelectedTargetId] = useState<number>(0);
    const [reason, setReason] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Simulation State
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState<SimulateSwapResult | null>(null);

    // Xác định người yêu cầu thực tế:
    // Nếu modal được mở từ 1 ca cụ thể (sourceAssignment), người yêu cầu là chủ nhân của ca đó (kể cả khi Quản lý/Giám đốc tạo hộ).
    // Nếu không có sourceAssignment, người yêu cầu là currentUserId.
    const effectiveRequesterId = useMemo(() => {
        if (sourceAssignment && sourceAssignment.employeeId) {
            return Number(sourceAssignment.employeeId);
        }
        return Number(currentUserId);
    }, [sourceAssignment, currentUserId]);

    const isManagerOnBehalf = Boolean(
        sourceAssignment &&
        Number(sourceAssignment.employeeId) !== Number(currentUserId)
    );

    const requesterEmployee = useMemo(() => {
        return employees.find((e) => Number(e.id) === effectiveRequesterId) || null;
    }, [employees, effectiveRequesterId]);

    // Danh sách các ca của người yêu cầu
    const myShifts = useMemo(() => {
        const shifts = allAssignments.filter(
            (a) => Number(a.employeeId) === effectiveRequesterId && a.status !== 'CANCELLED'
        );
        if (sourceAssignment && !shifts.some((s) => s.id === sourceAssignment.id)) {
            return [sourceAssignment, ...shifts];
        }
        return shifts;
    }, [allAssignments, effectiveRequesterId, sourceAssignment]);

    // Đồng nghiệp hợp lệ để nhường/đổi ca (loại trừ chính người đang giữ ca)
    const candidateEmployees = useMemo(() => {
        return employees.filter(
            (e) =>
                Number(e.id) !== effectiveRequesterId &&
                e.isActive &&
                e.employmentStatus !== 'RESIGNED' &&
                e.positionId !== 1
        );
    }, [employees, effectiveRequesterId]);

    // Danh sách ca của đồng nghiệp đang chọn (cho chế độ SWAP)
    const targetColleagueShifts = useMemo(() => {
        if (!targetEmployeeId) return [];
        return allAssignments.filter(
            (a) => Number(a.employeeId) === Number(targetEmployeeId) && a.status !== 'CANCELLED'
        );
    }, [allAssignments, targetEmployeeId]);

    // Khởi tạo state khi mở modal
    useEffect(() => {
        if (isOpen) {
            const mode = initialType || (targetAssignment ? 'SWAP' : 'HANDOVER');
            setSwapType(mode);

            if (sourceAssignment) {
                setSelectedSourceId(sourceAssignment.id);
            } else if (myShifts.length > 0) {
                setSelectedSourceId(myShifts[0].id);
            } else {
                setSelectedSourceId(0);
            }

            if (targetAssignment) {
                setTargetEmployeeId(targetAssignment.employeeId);
                setSelectedTargetId(targetAssignment.id);
            } else {
                setTargetEmployeeId(0);
                setSelectedTargetId(0);
            }

            setReason('');
            setSimulationResult(null);
        }
    }, [isOpen, sourceAssignment, targetAssignment, initialType, effectiveRequesterId]);

    // Tự động kiểm tra xung đột thời gian thực
    useEffect(() => {
        if (!selectedSourceId || !targetEmployeeId) {
            setSimulationResult(null);
            return;
        }
        if (swapType === 'SWAP' && !selectedTargetId) {
            setSimulationResult(null);
            return;
        }

        // Bảo vệ an toàn: Không gửi ID tạm thời của client (> 1_000_000_000_000) lên backend để tránh ResourceNotFoundException
        if (isClientTemporaryId(selectedSourceId) || (swapType === 'SWAP' && isClientTemporaryId(selectedTargetId))) {
            setSimulationResult({
                valid: false,
                hasError: true,
                hasWarning: false,
                isServerError: false,
                requesterConflicts: [],
                targetConflicts: [],
                message: 'Ca làm việc này chưa được đồng bộ hoặc lưu lên máy chủ (ID tạm). Vui lòng làm mới trang để nạp dữ liệu chính thức trước khi gửi đề xuất.',
            });
            return;
        }

        let isMounted = true;
        setIsSimulating(true);

        const timer = setTimeout(async () => {
            try {
                const result = await shiftSwapService.simulateSwap({
                    requesterAssignmentId: selectedSourceId,
                    targetEmployeeId: targetEmployeeId,
                    targetAssignmentId: swapType === 'SWAP' ? selectedTargetId : undefined,
                    type: swapType,
                });
                if (isMounted) {
                    setSimulationResult(result);
                }
            } catch (err: any) {
                if (isMounted) {
                    setSimulationResult({
                        valid: false,
                        hasError: true,
                        hasWarning: false,
                        isServerError: true,
                        requesterConflicts: [],
                        targetConflicts: [],
                        message: err?.response?.data?.error?.message || err?.message || 'Lỗi khi kiểm tra xung đột',
                    });
                }
            } finally {
                if (isMounted) {
                    setIsSimulating(false);
                }
            }
        }, 250);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [selectedSourceId, targetEmployeeId, selectedTargetId, swapType]);

    if (!isOpen) return null;

    const handleSelectReason = (text: string) => {
        setReason((prev) => {
            const current = prev.trim();
            if (!current) return text;
            if (current.includes(text)) return current;
            return `${current}; ${text}`.slice(0, MAX_REASON_LENGTH);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSourceId) {
            addToast({
                type: 'error',
                title: 'Thiếu ca nguồn',
                message: isManagerOnBehalf ? 'Vui lòng chọn ca làm việc của nhân sự cần đổi/nhường.' : 'Vui lòng chọn ca làm việc của bạn cần đổi/nhường.',
            });
            return;
        }

        if (isClientTemporaryId(selectedSourceId)) {
            addToast({
                type: 'error',
                title: 'Ca làm việc chưa lưu',
                message: 'Ca làm việc này chưa được đồng bộ hoặc lưu lên máy chủ (ID tạm). Vui lòng tải lại trang trước khi gửi yêu cầu.',
            });
            return;
        }

        if (swapType === 'SWAP' && isClientTemporaryId(selectedTargetId)) {
            addToast({
                type: 'error',
                title: 'Ca đối ứng chưa lưu',
                message: 'Ca làm việc đối ứng chưa được đồng bộ hoặc lưu lên máy chủ (ID tạm). Vui lòng tải lại trang trước khi gửi yêu cầu.',
            });
            return;
        }

        if (!targetEmployeeId) {
            addToast({
                type: 'error',
                title: 'Thiếu đồng nghiệp',
                message: 'Vui lòng chọn đồng nghiệp nhận đề xuất.',
            });
            return;
        }

        if (swapType === 'SWAP' && !selectedTargetId) {
            addToast({
                type: 'error',
                title: 'Thiếu ca đổi',
                message: 'Vui lòng chọn ca của đồng nghiệp mà bạn muốn đổi lấy.',
            });
            return;
        }

        if (!reason.trim()) {
            addToast({
                type: 'error',
                title: 'Thiếu lý do',
                message: 'Vui lòng cung cấp lý do đề xuất đổi/nhường ca.',
            });
            return;
        }

        if (simulationResult?.hasError) {
            addToast({
                type: 'error',
                title: simulationResult.isServerError ? 'Lỗi hệ thống' : 'Vi phạm quy định',
                message: simulationResult.message || 'Không thể tạo đơn đổi/nhường ca.',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await shiftSwapService.createSwapRequest({
                requesterAssignmentId: selectedSourceId,
                targetEmployeeId,
                targetAssignmentId: swapType === 'SWAP' ? selectedTargetId : null,
                type: swapType,
                reason: reason.trim(),
            });

            addToast({
                type: 'success',
                title: swapType === 'SWAP' ? 'Đã gửi đề xuất đổi chéo ca' : 'Đã gửi đề xuất nhường ca',
                message: 'Đã gửi yêu cầu đến đồng nghiệp thành công. Chờ đồng nghiệp phản hồi trước khi Quản lý duyệt.',
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            addToast({
                type: 'error',
                title: 'Lỗi gửi yêu cầu',
                message: err?.response?.data?.error?.message || err?.message || 'Không thể tạo yêu cầu đổi/nhường ca.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid =
        Boolean(selectedSourceId) &&
        Boolean(targetEmployeeId) &&
        (swapType === 'HANDOVER' || Boolean(selectedTargetId)) &&
        Boolean(reason.trim()) &&
        !isSimulating &&
        !simulationResult?.hasError;

    return (
        <div
            className="drawer-backdrop"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                zIndex: 1100,
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
            role="presentation"
        >
            <div
                ref={modalRef}
                className="modal-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="swap-modal-title"
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'relative',
                    top: 'auto',
                    left: 'auto',
                    transform: 'none',
                    width: 580,
                    maxWidth: 'calc(100vw - 32px)',
                    maxHeight: 'calc(100vh - 48px)',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.15)',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#F8FAFC',
                    }}
                >
                    <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                backgroundColor: '#EFF6FF',
                                color: '#4F46E5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <ArrowLeftRight size={20}/>
                        </div>
                        <div>
                            <h3 id="swap-modal-title"
                                style={{fontSize: 16, fontWeight: 700, color: '#1E293B', margin: 0}}>
                                {swapType === 'SWAP' ? 'Đề Xuất Đổi Chéo Ca (2 Chiều)' : 'Đề Xuất Nhường Ca (1 Chiều)'}
                            </h3>
                            <p style={{fontSize: 12, color: '#64748B', margin: '2px 0 0'}}>
                                {isManagerOnBehalf
                                    ? `Quản lý tạo yêu cầu thay cho nhân sự: ${requesterEmployee?.fullName || `NV #${effectiveRequesterId}`}`
                                    : (swapType === 'SWAP'
                                        ? 'Hoán đổi ca làm việc giữa bạn và đồng nghiệp, tự động kiểm tra xung đột.'
                                        : 'Gửi yêu cầu nhường ca cho đồng nghiệp đi làm thay.')
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            padding: 4,
                            borderRadius: 6,
                        }}
                        aria-label="Đóng"
                    >
                        <X size={18}/>
                    </button>
                </div>

                {/* Scrollable Body */}
                <form onSubmit={handleSubmit} style={{
                    overflowY: 'auto',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16
                }}>
                    {/* Banner thay mặt nhân sự (khi Quản lý/Giám đốc tạo hộ) */}
                    {isManagerOnBehalf && requesterEmployee && (
                        <div
                            style={{
                                padding: '10px 12px',
                                backgroundColor: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 12.5,
                                color: '#1E40AF',
                            }}
                        >
                            <Users size={16} color="#3B82F6" />
                            <span>
                                Đang tạo đề xuất thay cho: <strong>{requesterEmployee.fullName} ({requesterEmployee.employeeCode})</strong>.
                            </span>
                        </div>
                    )}

                    {/* Mode Switcher */}
                    <div
                        style={{
                            display: 'flex',
                            padding: 4,
                            backgroundColor: '#F1F5F9',
                            borderRadius: 10,
                            gap: 4,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setSwapType('HANDOVER')}
                            style={{
                                flex: 1,
                                padding: '7px 12px',
                                border: 'none',
                                borderRadius: 7,
                                fontSize: 12.5,
                                fontWeight: 600,
                                backgroundColor: swapType === 'HANDOVER' ? '#FFFFFF' : 'transparent',
                                color: swapType === 'HANDOVER' ? '#1E293B' : '#64748B',
                                boxShadow: swapType === 'HANDOVER' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <ArrowRight size={14} color={swapType === 'HANDOVER' ? '#4F46E5' : '#64748B'}/>
                            Nhường ca 1 chiều (Đi làm thay)
                        </button>
                        <button
                            type="button"
                            onClick={() => setSwapType('SWAP')}
                            style={{
                                flex: 1,
                                padding: '7px 12px',
                                border: 'none',
                                borderRadius: 7,
                                fontSize: 12.5,
                                fontWeight: 600,
                                backgroundColor: swapType === 'SWAP' ? '#FFFFFF' : 'transparent',
                                color: swapType === 'SWAP' ? '#1E293B' : '#64748B',
                                boxShadow: swapType === 'SWAP' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <Repeat size={14} color={swapType === 'SWAP' ? '#4F46E5' : '#64748B'}/>
                            Đổi ca 2 chiều (Hoán đổi ca)
                        </button>
                    </div>

                    {/* 1. Ca nguồn */}
                    <div>
                        <label style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: '#334155',
                            display: 'block',
                            marginBottom: 6
                        }}>
                            {swapType === 'SWAP'
                                ? (isManagerOnBehalf ? `Ca đổi của ${requesterEmployee?.fullName || 'nhân viên'}` : 'Ca bạn muốn đổi đi (Của bạn)')
                                : (isManagerOnBehalf ? `Ca nhường của ${requesterEmployee?.fullName || 'nhân viên'}` : 'Ca bạn muốn nhường (Của bạn)')
                            }{' '}
                            <span style={{color: '#DC2626'}}>*</span>
                        </label>
                        {myShifts.length === 0 ? (
                            <div style={{
                                padding: '10px',
                                backgroundColor: '#FEF2F2',
                                borderRadius: 8,
                                fontSize: 12,
                                color: '#DC2626'
                            }}>
                                {isManagerOnBehalf
                                    ? `Nhân viên ${requesterEmployee?.fullName || 'này'} chưa có ca làm việc nào trong tuần này để đề xuất.`
                                    : 'Bạn chưa có ca làm việc nào trong tuần này để đề xuất.'}
                            </div>
                        ) : (
                            <select
                                className="input-base"
                                value={selectedSourceId}
                                onChange={(e) => setSelectedSourceId(Number(e.target.value))}
                                style={{width: '100%', height: 38, fontSize: 13}}
                                required
                            >
                                {myShifts.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.snapshotShiftName} -
                                        Ngày {s.workDate} ({s.snapshotStartTime} - {s.snapshotEndTime})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* 2. Chọn đồng nghiệp */}
                    <div>
                        <label style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: '#334155',
                            display: 'block',
                            marginBottom: 6
                        }}>
                            Chọn đồng nghiệp đối tác <span style={{color: '#DC2626'}}>*</span>
                        </label>
                        {candidateEmployees.length === 0 ? (
                            <div style={{
                                padding: '10px',
                                backgroundColor: '#FFFBEB',
                                borderRadius: 8,
                                fontSize: 12,
                                color: '#B45309'
                            }}>
                                Không có nhân sự nào khác trong chi nhánh này khả dụng.
                            </div>
                        ) : (
                            <select
                                className="input-base"
                                value={targetEmployeeId}
                                onChange={(e) => {
                                    const empId = Number(e.target.value);
                                    setTargetEmployeeId(empId);
                                    setSelectedTargetId(0);
                                }}
                                style={{width: '100%', height: 38, fontSize: 13}}
                                required
                            >
                                <option value={0}>-- Chọn đồng nghiệp trong chi nhánh --</option>
                                {candidateEmployees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.fullName} ({emp.employeeCode})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* 3. Ca đối ứng của đồng nghiệp (Chỉ ở chế độ SWAP) */}
                    {swapType === 'SWAP' && targetEmployeeId > 0 && (
                        <div>
                            <label style={{
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: '#334155',
                                display: 'block',
                                marginBottom: 6
                            }}>
                                Chọn ca của đồng nghiệp bạn muốn nhận lấy <span style={{color: '#DC2626'}}>*</span>
                            </label>
                            {targetColleagueShifts.length === 0 ? (
                                <div style={{
                                    padding: '10px',
                                    backgroundColor: '#FFFBEB',
                                    borderRadius: 8,
                                    fontSize: 12,
                                    color: '#B45309'
                                }}>
                                    Đồng nghiệp này chưa có ca phân công nào trong tuần hiện tại để đổi.
                                </div>
                            ) : (
                                <select
                                    className="input-base"
                                    value={selectedTargetId}
                                    onChange={(e) => setSelectedTargetId(Number(e.target.value))}
                                    style={{width: '100%', height: 38, fontSize: 13}}
                                    required
                                >
                                    <option value={0}>-- Chọn ca của đồng nghiệp --</option>
                                    {targetColleagueShifts.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.snapshotShiftName} -
                                            Ngày {s.workDate} ({s.snapshotStartTime} - {s.snapshotEndTime})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {/* 4. Lý do */}
                    <div>
                        <label style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: '#334155',
                            display: 'block',
                            marginBottom: 6
                        }}>
                            Lý do xin đổi / nhường ca <span style={{color: '#DC2626'}}>*</span>
                        </label>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#334155',
                            marginBottom: 6
                        }}>
                            <Sparkles size={14} color="#F59E0B"/>
                            Gợi ý lý do nhanh:
                        </div>
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8}}>
                            {SWAP_REASON_SUGGESTIONS.map((text) => (
                                <button
                                    key={text}
                                    type="button"
                                    onClick={() => handleSelectReason(text)}
                                    style={{
                                        border: '1px solid #E2E8F0',
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: 20,
                                        padding: '4px 10px',
                                        fontSize: 12,
                                        color: '#334155',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#EFF6FF';
                                        e.currentTarget.style.borderColor = '#93C5FD';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                                        e.currentTarget.style.borderColor = '#E2E8F0';
                                    }}
                                >
                                    + {text}
                                </button>
                            ))}
                        </div>

                        <textarea
                            className="input-base"
                            rows={2}
                            maxLength={MAX_REASON_LENGTH}
                            placeholder="Ví dụ: Bận việc cá nhân cần hoán đổi ca làm việc..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            style={{
                                width: '100%',
                                height: 64,
                                padding: '8px 12px',
                                fontSize: 13,
                                resize: 'none',
                            }}
                            required
                        />
                    </div>

                    {/* 5. Hộp Kiểm Tra Xung Đột Thời Gian Thực */}
                    {(isSimulating || simulationResult) && (
                        <div
                            style={{
                                borderRadius: 10,
                                padding: '12px 14px',
                                backgroundColor: isSimulating
                                    ? '#F8FAFC'
                                    : simulationResult?.hasError
                                        ? '#FEF2F2'
                                        : simulationResult?.hasWarning
                                            ? '#FFFBEB'
                                            : '#F0FDF4',
                                border: isSimulating
                                    ? '1px solid #E2E8F0'
                                    : simulationResult?.hasError
                                        ? '1px solid #FECACA'
                                        : simulationResult?.hasWarning
                                            ? '1px solid #FDE68A'
                                            : '1px solid #BBF7D0',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {isSimulating ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 12,
                                    color: '#64748B'
                                }}>
                                    <Loader2 size={16} className="animate-spin" color="#4F46E5"/>
                                    <span>Đang phân tích tuân thủ luật lao động & thời gian nghỉ...</span>
                                </div>
                            ) : simulationResult?.hasError ? (
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        color: '#DC2626',
                                        fontWeight: 700,
                                        fontSize: 12.5
                                    }}>
                                        <ShieldAlert size={16}/> Vi phạm quy định làm việc (Bị chặn)
                                    </div>
                                    <div style={{fontSize: 12, color: '#991B1B', marginTop: 4}}>
                                        {simulationResult.message}
                                    </div>
                                    {simulationResult.targetConflicts.map((c, idx) => (
                                        <div key={`target-${idx}`}
                                             style={{fontSize: 11.5, color: '#B91C1C', marginTop: 3}}>
                                            • <strong>Đồng nghiệp:</strong> {c.message}
                                        </div>
                                    ))}
                                    {simulationResult.requesterConflicts?.map((c, idx) => (
                                        <div key={`req-${idx}`}
                                             style={{fontSize: 11.5, color: '#B91C1C', marginTop: 3}}>
                                            • <strong>Bạn:</strong> {c.message}
                                        </div>
                                    ))}
                                </div>
                            ) : simulationResult?.hasWarning ? (
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        color: '#D97706',
                                        fontWeight: 700,
                                        fontSize: 12.5
                                    }}>
                                        <ShieldAlert size={16}/> Cảnh báo quy định làm việc
                                    </div>
                                    <div style={{fontSize: 12, color: '#92400E', marginTop: 4}}>
                                        {simulationResult.message}
                                    </div>
                                    {simulationResult.targetConflicts.map((c, idx) => (
                                        <div key={`warn-target-${idx}`}
                                             style={{fontSize: 11.5, color: '#B45309', marginTop: 3}}>
                                            • {c.message}
                                        </div>
                                    ))}
                                    {simulationResult.requesterConflicts?.map((c, idx) => (
                                        <div key={`warn-req-${idx}`}
                                             style={{fontSize: 11.5, color: '#B45309', marginTop: 3}}>
                                            • {c.message}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    color: '#15803D',
                                    fontSize: 12.5,
                                    fontWeight: 600
                                }}>
                                    <CheckCircle size={16} color="#16A34A"/>
                                    <span>Hoàn toàn hợp lệ! Đảm bảo thời gian nghỉ tối thiểu và không trùng ca.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div
                        style={{
                            paddingTop: 12,
                            borderTop: '1px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 10,
                        }}
                    >
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={isSubmitting}
                            style={{height: 38, padding: '0 16px', fontSize: 13}}
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!isFormValid || isSubmitting}
                            style={{
                                height: 38,
                                padding: '0 18px',
                                fontSize: 13,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                backgroundColor: '#4F46E5',
                                borderColor: '#4338CA',
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin"/>
                                    <span>Đang gửi...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={15}/>
                                    <span>{swapType === 'SWAP' ? 'Gửi đề xuất đổi chéo ca' : 'Gửi đề xuất nhường ca'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
