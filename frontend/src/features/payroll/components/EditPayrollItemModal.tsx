import React, { useState, useEffect, useMemo } from 'react';
import type { PayrollItem, UpdatePayrollItemPayload, AdjustmentDetailItem, AdjustmentsDetail } from '../types/payroll.types';
import { CurrencyInput } from './CurrencyInput';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import {
  X,
  Calculator,
  AlertCircle,
  Save,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Clock,
  Briefcase,
  Moon,
  Gift,
  ShieldAlert,
  Wallet,
  Lock,
} from 'lucide-react';

interface EditPayrollItemModalProps {
  isOpen: boolean;
  item: PayrollItem | null;
  onClose: () => void;
  onSave: (itemId: number, payload: UpdatePayrollItemPayload) => Promise<boolean>;
}

export const EditPayrollItemModal: React.FC<EditPayrollItemModalProps> = ({
  isOpen,
  item,
  onClose,
  onSave,
}) => {
  const { currentRole } = useAuthStore();
  const canEditHours = currentRole === 'ROLE_ADMIN' || currentRole === 'ROLE_DIRECTOR';

  // 1. Công & Lương (Full-time, Part-time & Ban đêm)
  const [actualHours, setActualHours] = useState<number>(0);
  const [basePay, setBasePay] = useState<number>(0);
  const [partTimeHours, setPartTimeHours] = useState<number>(0);
  const [partTimeRate, setPartTimeRate] = useState<number>(0);
  const [nightHours, setNightHours] = useState<number>(0);
  const [nightRate, setNightRate] = useState<number>(0);

  // 1b. Trạng thái hiển thị mở rộng (Progressive Disclosure)
  const [showPartTimeSection, setShowPartTimeSection] = useState<boolean>(false);
  const [showBasePaySection, setShowBasePaySection] = useState<boolean>(true);

  // 2. Dynamic Lists: Phụ cấp, Thưởng, Phạt
  const [allowanceItems, setAllowanceItems] = useState<AdjustmentDetailItem[]>([]);
  const [bonusItems, setBonusItems] = useState<AdjustmentDetailItem[]>([]);
  const [deductionItems, setDeductionItems] = useState<AdjustmentDetailItem[]>([]);

  // 3. Ghi chú & Trạng thái lưu
  const [note, setNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Khởi tạo state khi mở modal hoặc thay đổi item
  useEffect(() => {
    if (item) {
      setActualHours(item.actual_hours || 0);

      // 1. Lương cứng (base_pay): Giữ nguyên từ phiếu lương, hoặc nếu = 0 của Full-time thì lấy base_salary từ hợp đồng
      let initialBase = Number(item.base_pay || 0);
      if (initialBase === 0 && item.employment_type === 'FULL_TIME' && item.base_salary && Number(item.base_salary) > 0) {
        initialBase = Number(item.base_salary);
      }
      setBasePay(initialBase);

      // 2. Part-time: Giờ công và Đơn giá lương Part-time theo giờ (VNĐ/h)
      const ptHours = Number(item.part_time_hours || 0);
      const ptPay = Number(item.part_time_pay || 0);
      let initPtRate = 0;
      if (ptHours > 0 && ptPay > 0) {
        initPtRate = Math.round(ptPay / ptHours);
      } else if (item.hourly_rate && Number(item.hourly_rate) > 0) {
        initPtRate = Number(item.hourly_rate);
      } else if (ptPay > 0 && ptHours === 0) {
        initPtRate = ptPay;
      } else if (item.employment_type === 'PART_TIME') {
        initPtRate = 25000;
      } else {
        initPtRate = item.hourly_rate ? Number(item.hourly_rate) : 25000;
      }
      setPartTimeHours(ptHours);
      setPartTimeRate(initPtRate);

      // 3. Ca đêm: Giờ làm việc đêm và Đơn giá lương ca đêm (VNĐ/h)
      const nHours = Number(item.night_hours || 0);
      const nPay = Number(item.night_pay || 0);
      let initNRate = 0;
      if (nHours > 0 && nPay > 0) {
        initNRate = Math.round(nPay / nHours);
      } else if (nPay > 0 && nHours === 0) {
        initNRate = nPay;
      } else if (item.hourly_rate && Number(item.hourly_rate) > 0) {
        initNRate = Number(item.hourly_rate);
      } else if (item.base_salary && Number(item.base_salary) > 0) {
        // Làm tròn đến hàng nghìn VNĐ để tránh đơn giá số lẻ như 36.058
        const rawNRate = (Number(item.base_salary) / 208) * 0.3;
        initNRate = Math.round(rawNRate / 1000) * 1000 || 35000;
      } else {
        initNRate = 35000;
      }
      setNightHours(nHours);
      setNightRate(initNRate);

      // Thiết lập hiển thị phù hợp với loại hình nhân sự
      const isPtEmployee = item.employment_type === 'PART_TIME';
      setShowPartTimeSection(isPtEmployee || ptHours > 0 || ptPay > 0);
      setShowBasePaySection(!isPtEmployee || initialBase > 0);

      setNote(item.note || '');
      setErrorMsg(null);

      // Parse adjustments_detail nếu có sẵn
      let parsedDetail: AdjustmentsDetail | null = null;
      if (item.adjustments_detail) {
        if (typeof item.adjustments_detail === 'string') {
          try {
            parsedDetail = JSON.parse(item.adjustments_detail) as AdjustmentsDetail;
          } catch {
            parsedDetail = null;
          }
        } else if (typeof item.adjustments_detail === 'object') {
          parsedDetail = item.adjustments_detail as AdjustmentsDetail;
        }
      }

      // 1. Phụ cấp
      if (parsedDetail?.allowances && parsedDetail.allowances.length > 0) {
        setAllowanceItems(parsedDetail.allowances);
      } else if (item.allowances_total && item.allowances_total > 0) {
        setAllowanceItems([
          { id: 'allowance_1', name: 'Phụ cấp ăn trưa, đi lại', amount: item.allowances_total },
        ]);
      } else {
        setAllowanceItems([]);
      }

      // 2. Thưởng
      if (parsedDetail?.bonuses && parsedDetail.bonuses.length > 0) {
        setBonusItems(parsedDetail.bonuses);
      } else if (item.attendance_bonus && item.attendance_bonus > 0) {
        setBonusItems([
          { id: 'bonus_1', name: 'Thưởng chuyên cần', amount: item.attendance_bonus },
        ]);
      } else {
        setBonusItems([]);
      }

      // 3. Phạt
      if (parsedDetail?.deductions && parsedDetail.deductions.length > 0) {
        setDeductionItems(parsedDetail.deductions);
      } else {
        const initialDeductions: AdjustmentDetailItem[] = [];
        if (item.deduction_late && item.deduction_late > 0) {
          initialDeductions.push({ id: 'ded_1', name: 'Phạt đi muộn', amount: item.deduction_late });
        }
        if (item.deduction_unpaid_leave && item.deduction_unpaid_leave > 0) {
          initialDeductions.push({ id: 'ded_2', name: 'Trừ nghỉ không lương', amount: item.deduction_unpaid_leave });
        }
        setDeductionItems(initialDeductions);
      }
    }
  }, [item]);

  // Xử lý khi thay đổi số giờ công Full-time: LƯƠNG CỨNG GIỮ NGUYÊN (chỉ user trực tiếp sửa ô lương cứng mới đổi)
  const handleActualHoursChange = (newHours: number) => {
    setActualHours(newHours);
  };

  // Xử lý khi thay đổi số giờ công Part-time
  const handlePartTimeHoursChange = (newHours: number) => {
    setPartTimeHours(newHours);
  };

  // Xử lý khi thay đổi đơn giá lương Part-time theo giờ
  const handlePartTimeRateChange = (newRate: number) => {
    setPartTimeRate(newRate);
  };

  // Xử lý khi thay đổi số giờ làm đêm
  const handleNightHoursChange = (newNightHours: number) => {
    setNightHours(newNightHours);
  };

  // Xử lý khi thay đổi đơn giá lương ca đêm
  const handleNightRateChange = (newRate: number) => {
    setNightRate(newRate);
  };

  // Helpers quản lý danh sách động
  const addAllowance = () => {
    const newItem: AdjustmentDetailItem = {
      id: `all_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: 'Phụ cấp ăn trưa',
      amount: 730000,
    };
    setAllowanceItems((prev) => [...prev, newItem]);
  };

  const updateAllowance = (id: string, field: 'name' | 'amount', val: string | number) => {
    setAllowanceItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: field === 'amount' ? Number(val) : val } : i))
    );
  };

  const removeAllowance = (id: string) => {
    setAllowanceItems((prev) => prev.filter((i) => i.id !== id));
  };

  const addBonus = () => {
    const newItem: AdjustmentDetailItem = {
      id: `bon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: 'Thưởng nóng KPI',
      amount: 500000,
    };
    setBonusItems((prev) => [...prev, newItem]);
  };

  const updateBonus = (id: string, field: 'name' | 'amount', val: string | number) => {
    setBonusItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: field === 'amount' ? Number(val) : val } : i))
    );
  };

  const removeBonus = (id: string) => {
    setBonusItems((prev) => prev.filter((i) => i.id !== id));
  };

  const addDeduction = () => {
    const newItem: AdjustmentDetailItem = {
      id: `ded_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: 'Phạt đi muộn',
      amount: 50000,
    };
    setDeductionItems((prev) => [...prev, newItem]);
  };

  const updateDeduction = (id: string, field: 'name' | 'amount', val: string | number) => {
    setDeductionItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: field === 'amount' ? Number(val) : val } : i))
    );
  };

  const removeDeduction = (id: string) => {
    setDeductionItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Tính tổng phụ theo nhóm
  const totalAllowances = useMemo(
    () => allowanceItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
    [allowanceItems]
  );

  const totalBonuses = useMemo(
    () => bonusItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
    [bonusItems]
  );

  const totalDeductions = useMemo(
    () => deductionItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
    [deductionItems]
  );

  // Tính thành tiền theo giờ: giờ công part-time * lương part-time, giờ làm đêm * lương đêm
  const computedPartTimePay = useMemo(() => {
    return Math.round(Number(partTimeHours || 0) * Number(partTimeRate || 0));
  }, [partTimeHours, partTimeRate]);

  const computedNightPay = useMemo(() => {
    return Math.round(Number(nightHours || 0) * Number(nightRate || 0));
  }, [nightHours, nightRate]);

  // Live Recalculation Simulation: Lương cứng giữ nguyên + (giờ công parttime * lương) + (giờ làm việc đêm * lương) + phụ cấp + thưởng - phạt
  const preview = useMemo(() => {
    if (!item) {
      return { net: 0, diffNet: 0 };
    }

    const net = Math.max(
      0,
      Number(basePay || 0) +
        Number(computedPartTimePay || 0) +
        Number(computedNightPay || 0) +
        Number(totalBonuses || 0) +
        Number(totalAllowances || 0) -
        Number(totalDeductions || 0)
    );

    const diffNet = net - (item.net_salary || 0);

    return { net, diffNet };
  }, [item, basePay, computedPartTimePay, computedNightPay, totalBonuses, totalAllowances, totalDeductions]);

  if (!isOpen || !item) return null;

  const isFullTime = item.employment_type !== 'PART_TIME';

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setErrorMsg('Vui lòng nhập lý do / ghi chú điều chỉnh để lưu vết đối soát.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    const adjustmentsDetailJson = JSON.stringify({
      allowances: allowanceItems,
      bonuses: bonusItems,
      deductions: deductionItems,
    });

    const payload: UpdatePayrollItemPayload = {
      actual_hours: Number(actualHours),
      part_time_hours: Number(partTimeHours),
      night_hours: Number(nightHours),
      base_pay: Number(basePay),
      part_time_pay: Number(computedPartTimePay),
      night_pay: Number(computedNightPay),
      attendance_bonus: Number(totalBonuses),
      allowances_total: Number(totalAllowances),
      deduction_late: Number(totalDeductions),
      deduction_unpaid_leave: 0,
      adjustments_detail: adjustmentsDetailJson,
      note: note.trim(),
    };

    const success = await onSave(item.id, payload);
    setIsSaving(false);
    if (success) {
      onClose();
    } else {
      setErrorMsg('Có lỗi xảy ra khi cập nhật phiếu lương. Vui lòng thử lại.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* Gợi ý datalist cho các danh mục phổ biến */}
      <datalist id="allowance-suggestions">
        <option value="Phụ cấp ăn trưa" />
        <option value="Phụ cấp đi lại, xăng xe" />
        <option value="Phụ cấp điện thoại" />
        <option value="Phụ cấp trách nhiệm" />
        <option value="Phụ cấp nhà ở" />
        <option value="Phụ cấp trang phục" />
      </datalist>

      <datalist id="bonus-suggestions">
        <option value="Thưởng chuyên cần" />
        <option value="Thưởng nóng KPI" />
        <option value="Thưởng dự án xuất sắc" />
        <option value="Thưởng doanh số vượt chỉ tiêu" />
        <option value="Thưởng thâm niên" />
        <option value="Thưởng nhân viên gương mẫu" />
      </datalist>

      <datalist id="deduction-suggestions">
        <option value="Phạt đi muộn" />
        <option value="Trừ nghỉ không lương" />
        <option value="Phạt vi phạm quy chế" />
        <option value="Phạt vi phạm đồng phục" />
        <option value="Khấu trừ làm hỏng thiết bị" />
        <option value="Khấu trừ sai sót nghiệp vụ" />
      </datalist>

      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calculator size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 700, color: '#0F172A' }}>
                Chỉnh Sửa Phiếu Lương: {item.full_name} ({item.employee_code})
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                {item.position_title} • {item.branch_name} •{' '}
                <span
                  style={{
                    fontWeight: 600,
                    color:
                      item.employment_status === 'RESIGNED'
                        ? '#DC2626'
                        : item.employment_status === 'PROBATION'
                        ? '#D97706'
                        : item.employment_status === 'ON_LEAVE'
                        ? '#2563EB'
                        : '#16A34A',
                  }}
                >
                  {item.employment_status === 'RESIGNED'
                    ? '• Đã nghỉ việc'
                    : item.employment_status === 'PROBATION'
                    ? '• Thử việc'
                    : item.employment_status === 'ON_LEAVE'
                    ? '• Nghỉ chế độ'
                    : '• Chính thức'}
                </span>
                {' '}({item.employment_type === 'PART_TIME' ? 'Part-time' : 'Full-time'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.35fr 1fr',
              gap: '24px',
              padding: '20px 24px',
              overflowY: 'auto',
              flex: 1,
              alignItems: 'start',
            }}
          >
            {/* Cột trái: Form nhập liệu & các danh sách động */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* KHỐI 1: Công & Lương làm việc (Ban ngày & Ban đêm) */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '16px',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#64748B',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Clock size={14} color="#2563EB" />
                  Công & Lương Theo Thời Gian Làm Việc
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* PHẦN 1: Mục Lương Cứng Full-time (Hiển thị ưu tiên cho Full-time, hoặc khi có lương cứng) */}
                  {showBasePaySection && (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '12px', alignItems: 'flex-start' }}>
                        {/* Giờ công Full-time */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', minHeight: '18px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={12} color="#2563EB" /> Giờ công Full-time (h)
                            </label>
                            {!canEditHours && (
                              <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 500 }}>
                                <Lock size={11} color="#64748B" /> Khóa
                              </span>
                            )}
                          </div>
                          {canEditHours ? (
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={actualHours}
                              onChange={(e) => handleActualHoursChange(Number(e.target.value))}
                              disabled={isSaving}
                              style={{
                                width: '100%',
                                height: '38px',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: '#FFFFFF',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#0F172A',
                                boxSizing: 'border-box',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                height: '38px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: '#FFFFFF',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                boxSizing: 'border-box',
                              }}
                            >
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                                {actualHours} giờ
                              </span>
                              <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                                <Lock size={12} color="#94A3B8" /> Cố định
                              </span>
                            </div>
                          )}
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                            Số giờ làm việc tiêu chuẩn
                          </div>
                        </div>

                        {/* Lương cứng Full-time */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', minHeight: '18px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block' }}>
                              Lương cứng Full-time (VNĐ)
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {!canEditHours && (
                                <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 500 }}>
                                  <Lock size={11} color="#64748B" /> Chỉ GĐ/Admin sửa
                                </span>
                              )}
                              {!isFullTime && basePay === 0 && (
                                <button
                                  type="button"
                                  onClick={() => setShowBasePaySection(false)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#94A3B8',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    padding: '0 2px',
                                  }}
                                  title="Ẩn mục lương cứng"
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                          {canEditHours ? (
                            <CurrencyInput
                              value={basePay}
                              onChange={(val) => setBasePay(val)}
                              disabled={isSaving}
                              placeholder="0"
                              style={{
                                width: '100%',
                                height: '38px',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: '#FFFFFF',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#0F172A',
                                boxSizing: 'border-box',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                height: '38px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: '#FFFFFF',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                boxSizing: 'border-box',
                              }}
                            >
                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                                {formatVND(basePay)}
                              </span>
                              <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                                <Lock size={12} color="#94A3B8" /> Theo HĐ
                              </span>
                            </div>
                          )}
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                            Lương cơ bản theo hợp đồng
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nút thêm Lương cứng nếu đang bị ẩn (cho Part-time) */}
                  {!isFullTime && !showBasePaySection && (
                    <button
                      type="button"
                      onClick={() => setShowBasePaySection(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: '1px dashed #CBD5E1',
                        backgroundColor: '#F8FAFC',
                        color: '#64748B',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        alignSelf: 'flex-start',
                      }}
                    >
                      <Plus size={14} /> Bổ sung lương cứng (nếu có lương cố định)
                    </button>
                  )}

                  {/* PHẦN 2: Ca đêm (22h-06h) */}
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '12px', alignItems: 'flex-start' }}>
                      {/* Giờ làm việc đêm */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', minHeight: '18px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Moon size={12} color="#6366F1" /> Giờ làm việc đêm (22h-06h)
                          </label>
                          {!canEditHours && (
                            <span style={{ fontSize: '11px', color: '#6366F1', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 500 }}>
                              <Lock size={11} color="#6366F1" /> Khóa
                            </span>
                          )}
                        </div>
                        {canEditHours ? (
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={nightHours}
                            onChange={(e) => handleNightHoursChange(Number(e.target.value))}
                            disabled={isSaving}
                            style={{
                              width: '100%',
                              height: '38px',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#0F172A',
                              boxSizing: 'border-box',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              height: '38px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              boxSizing: 'border-box',
                            }}
                          >
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                              {nightHours} giờ
                            </span>
                            <span style={{ fontSize: '11px', color: '#6366F1', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                              <Lock size={12} color="#6366F1" /> Lịch 22h-06h
                            </span>
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                          Số giờ làm ca đêm trong tháng
                        </div>
                      </div>

                      {/* Đơn giá ca đêm */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', minHeight: '18px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block' }}>
                            Đơn giá ca đêm (VNĐ/h)
                          </label>
                          {!canEditHours && (
                            <span style={{ fontSize: '11px', color: '#6366F1', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 500 }}>
                              <Lock size={11} color="#6366F1" /> Khóa
                            </span>
                          )}
                        </div>
                        {canEditHours ? (
                          <CurrencyInput
                            value={nightRate}
                            onChange={(val) => handleNightRateChange(val)}
                            disabled={isSaving}
                            placeholder="0"
                            style={{
                              width: '100%',
                              height: '38px',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#4F46E5',
                              boxSizing: 'border-box',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              height: '38px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              boxSizing: 'border-box',
                            }}
                          >
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#4F46E5' }}>
                              {formatVND(nightRate)}/h
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                              <Lock size={12} color="#94A3B8" /> Ca đêm
                            </span>
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                          Mức phụ cấp theo giờ ca đêm
                        </div>
                      </div>
                    </div>

                    {/* Chỉ hiển thị pill thành tiền khi có giờ làm đêm > 0 */}
                    {nightHours > 0 && (
                      <div
                        style={{
                          marginTop: '4px',
                          padding: '6px 10px',
                          backgroundColor: '#EEF2FF',
                          borderRadius: '6px',
                          border: '1px solid #C7D2FE',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11.5px',
                          color: '#4338CA',
                          fontWeight: 600,
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Moon size={12} /> Thành tiền ca đêm:
                        </span>
                        <span>
                          +{formatVND(computedNightPay)} ({nightHours}h × {formatVND(nightRate)}/h)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* PHẦN 3: Mục Part-time (Hiển thị nếu là Part-time hoặc được mở rộng) */}
                  {showPartTimeSection ? (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '12px', alignItems: 'flex-start' }}>
                        {/* Giờ công Part-time */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', minHeight: '18px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#92400E', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Briefcase size={12} color="#D97706" /> Giờ công Part-time (h)
                            </label>
                            {!canEditHours && (
                              <span style={{ fontSize: '11px', color: '#D97706', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 500 }}>
                                <Lock size={11} color="#D97706" /> Khóa
                              </span>
                            )}
                          </div>
                          {canEditHours ? (
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={partTimeHours}
                              onChange={(e) => handlePartTimeHoursChange(Number(e.target.value))}
                              disabled={isSaving}
                              style={{
                                width: '100%',
                                height: '38px',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: '1px solid #FCD34D',
                                backgroundColor: '#FFFFFF',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#0F172A',
                                boxSizing: 'border-box',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                height: '38px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #FCD34D',
                                backgroundColor: '#FFFFFF',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                boxSizing: 'border-box',
                              }}
                            >
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                                {partTimeHours} giờ
                              </span>
                              <span style={{ fontSize: '11px', color: '#D97706', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                                <Lock size={12} color="#D97706" /> Theo lịch
                              </span>
                            </div>
                          )}
                          <div style={{ fontSize: '11px', color: '#B45309', marginTop: '4px' }}>
                            Số giờ làm việc ca Part-time
                          </div>
                        </div>

                        {/* Đơn giá Part-time */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', minHeight: '18px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#92400E', display: 'block' }}>
                              Đơn giá Part-time (VNĐ/h)
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {!canEditHours && (
                                <span style={{ fontSize: '11px', color: '#D97706', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 500 }}>
                                  <Lock size={11} color="#D97706" /> Khóa
                                </span>
                              )}
                              {isFullTime && partTimeHours === 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowPartTimeSection(false);
                                    setPartTimeHours(0);
                                  }}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#94A3B8',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    padding: '0 2px',
                                  }}
                                  title="Ẩn mục Part-time"
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                          {canEditHours ? (
                            <CurrencyInput
                              value={partTimeRate}
                              onChange={(val) => handlePartTimeRateChange(val)}
                              disabled={isSaving}
                              placeholder="0"
                              style={{
                                width: '100%',
                                height: '38px',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: '1px solid #FCD34D',
                                backgroundColor: '#FFFFFF',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#D97706',
                                boxSizing: 'border-box',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                height: '38px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #FCD34D',
                                backgroundColor: '#FFFFFF',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                boxSizing: 'border-box',
                              }}
                            >
                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#D97706' }}>
                                {formatVND(partTimeRate)}/h
                              </span>
                              <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                                <Lock size={12} color="#94A3B8" /> Theo ca làm
                              </span>
                            </div>
                          )}
                          <div style={{ fontSize: '11px', color: '#B45309', marginTop: '4px' }}>
                            Đơn giá lương theo giờ
                          </div>
                        </div>
                      </div>

                      {/* Chỉ hiển thị pill thành tiền khi có giờ Part-time > 0 */}
                      {partTimeHours > 0 && (
                        <div
                          style={{
                            marginTop: '4px',
                            padding: '6px 10px',
                            backgroundColor: '#FEF3C7',
                            borderRadius: '6px',
                            border: '1px solid #FDE68A',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '11.5px',
                            color: '#92400E',
                            fontWeight: 600,
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Briefcase size={12} /> Thành tiền Part-time:
                          </span>
                          <span>
                            +{formatVND(computedPartTimePay)} ({partTimeHours}h × {formatVND(partTimeRate)}/h)
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Nút bấm mở rộng Part-time khi đang ẩn (cho Full-time) */
                    <button
                      type="button"
                      onClick={() => {
                        setShowPartTimeSection(true);
                        if (partTimeRate === 0) {
                          setPartTimeRate(Number(item.hourly_rate) || 25000);
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: '1px dashed #CBD5E1',
                        backgroundColor: '#F8FAFC',
                        color: '#64748B',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        alignSelf: 'flex-start',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Plus size={14} color="#64748B" /> Thêm giờ làm Part-time (nếu có làm thêm ca)
                    </button>
                  )}
                </div>
              </div>

              {/* KHỐI 2: Danh sách Phụ cấp động */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '16px',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Wallet size={14} color="#0D9488" />
                    Các Khoản Phụ Cấp
                  </div>
                  <button
                    type="button"
                    onClick={addAllowance}
                    disabled={isSaving}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #99F6E4',
                      background: '#F0FDFA',
                      color: '#0F766E',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={13} strokeWidth={2.5} /> Thêm phụ cấp
                  </button>
                </div>

                {allowanceItems.length === 0 ? (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      backgroundColor: '#F8FAFC',
                      border: '1px dashed #CBD5E1',
                      textAlign: 'center',
                      fontSize: '12px',
                      color: '#94A3B8',
                    }}
                  >
                    Chưa có khoản phụ cấp nào. Bấm <strong>"+ Thêm phụ cấp"</strong> để bổ sung.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {allowanceItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.4fr 1fr auto',
                          gap: 8,
                          alignItems: 'center',
                        }}
                      >
                        <input
                          type="text"
                          list="allowance-suggestions"
                          placeholder="Tên phụ cấp..."
                          value={item.name}
                          onChange={(e) => updateAllowance(item.id, 'name', e.target.value)}
                          disabled={isSaving}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '12.5px',
                          }}
                        />
                        <CurrencyInput
                          value={item.amount}
                          onChange={(val) => updateAllowance(item.id, 'amount', val)}
                          disabled={isSaving}
                          placeholder="Số tiền (VNĐ)"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            color: '#0F766E',
                            width: '100%',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeAllowance(item.id)}
                          disabled={isSaving}
                          title="Xóa khoản phụ cấp này"
                          style={{
                            border: '1px solid #FECDD3',
                            backgroundColor: '#FFF1F2',
                            color: '#E11D48',
                            borderRadius: '6px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#0F766E', fontWeight: 600, paddingTop: 4 }}>
                      Tổng phụ cấp: {formatVND(totalAllowances)}
                    </div>
                  </div>
                )}
              </div>

              {/* KHỐI 3: Danh sách Thưởng động */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '16px',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Gift size={14} color="#16A34A" />
                    Các Khoản Thưởng
                  </div>
                  <button
                    type="button"
                    onClick={addBonus}
                    disabled={isSaving}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #BBF7D0',
                      background: '#F0FDF4',
                      color: '#15803D',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={13} strokeWidth={2.5} /> Thêm khoản thưởng
                  </button>
                </div>

                {bonusItems.length === 0 ? (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      backgroundColor: '#F8FAFC',
                      border: '1px dashed #CBD5E1',
                      textAlign: 'center',
                      fontSize: '12px',
                      color: '#94A3B8',
                    }}
                  >
                    Chưa có khoản thưởng nào. Bấm <strong>"+ Thêm khoản thưởng"</strong> để bổ sung.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {bonusItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.4fr 1fr auto',
                          gap: 8,
                          alignItems: 'center',
                        }}
                      >
                        <input
                          type="text"
                          list="bonus-suggestions"
                          placeholder="Tên khoản thưởng..."
                          value={item.name}
                          onChange={(e) => updateBonus(item.id, 'name', e.target.value)}
                          disabled={isSaving}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '12.5px',
                          }}
                        />
                        <CurrencyInput
                          value={item.amount}
                          onChange={(val) => updateBonus(item.id, 'amount', val)}
                          disabled={isSaving}
                          placeholder="Số tiền (VNĐ)"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            color: '#16A34A',
                            width: '100%',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeBonus(item.id)}
                          disabled={isSaving}
                          title="Xóa khoản thưởng này"
                          style={{
                            border: '1px solid #FECDD3',
                            backgroundColor: '#FFF1F2',
                            color: '#E11D48',
                            borderRadius: '6px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#15803D', fontWeight: 600, paddingTop: 4 }}>
                      Tổng thưởng: {formatVND(totalBonuses)}
                    </div>
                  </div>
                )}
              </div>

              {/* KHỐI 4: Danh sách Phạt / Khấu trừ động */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '16px',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <ShieldAlert size={14} color="#DC2626" />
                    Các Khoản Phạt / Khấu Trừ
                  </div>
                  <button
                    type="button"
                    onClick={addDeduction}
                    disabled={isSaving}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #FECDD3',
                      background: '#FFF1F2',
                      color: '#E11D48',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={13} strokeWidth={2.5} /> Thêm khoản phạt
                  </button>
                </div>

                {deductionItems.length === 0 ? (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      backgroundColor: '#F8FAFC',
                      border: '1px dashed #CBD5E1',
                      textAlign: 'center',
                      fontSize: '12px',
                      color: '#94A3B8',
                    }}
                  >
                    Chưa có khoản phạt nào. Bấm <strong>"+ Thêm khoản phạt"</strong> để bổ sung.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {deductionItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.4fr 1fr auto',
                          gap: 8,
                          alignItems: 'center',
                        }}
                      >
                        <input
                          type="text"
                          list="deduction-suggestions"
                          placeholder="Lý do phạt/khấu trừ..."
                          value={item.name}
                          onChange={(e) => updateDeduction(item.id, 'name', e.target.value)}
                          disabled={isSaving}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '12.5px',
                          }}
                        />
                        <CurrencyInput
                          value={item.amount}
                          onChange={(val) => updateDeduction(item.id, 'amount', val)}
                          disabled={isSaving}
                          placeholder="Số tiền (VNĐ)"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            color: '#DC2626',
                            width: '100%',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeDeduction(item.id)}
                          disabled={isSaving}
                          title="Xóa khoản phạt này"
                          style={{
                            border: '1px solid #FECDD3',
                            backgroundColor: '#FFF1F2',
                            color: '#E11D48',
                            borderRadius: '6px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#DC2626', fontWeight: 600, paddingTop: 4 }}>
                      Tổng khấu trừ: -{formatVND(totalDeductions)}
                    </div>
                  </div>
                )}
              </div>

              {/* KHỐI 5: Lý do / Ghi chú điều chỉnh */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Lý do / Ghi chú điều chỉnh <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ví dụ: Bổ sung 2h làm thêm ca đêm dự án và thưởng nóng đạt KPI..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    fontSize: '13px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {errorMsg && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#DC2626',
                    fontSize: '12.5px',
                    background: '#FEF2F2',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #FECDD3',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Cột phải: Live Calculation Preview */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '12px',
                padding: '18px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                height: 'fit-content',
                position: 'sticky',
                top: 0,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <CheckCircle2 size={18} color="#2563EB" />
                  <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#0F172A' }}>
                    Xem Trước Kết Quả Tính Lại
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '16px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 4px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '6px', fontWeight: 600 }}>
                    Lương Thực Nhận (Net Pay)
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#059669' }}>
                    {formatVND(preview.net)}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '8px',
                      fontSize: '12px',
                    }}
                  >
                    {preview.diffNet >= 0 ? (
                      <>
                        <TrendingUp size={15} color="#059669" />
                        <span style={{ color: '#059669', fontWeight: 700 }}>+{formatVND(preview.diffNet)}</span>
                        <span style={{ color: '#64748B' }}>so với trước</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown size={15} color="#DC2626" />
                        <span style={{ color: '#DC2626', fontWeight: 700 }}>{formatVND(preview.diffNet)}</span>
                        <span style={{ color: '#64748B' }}>so với trước</span>
                      </>
                    )}
                  </div>

                  {/* Chi tiết công thức tính */}
                  <div
                    style={{
                      marginTop: '16px',
                      paddingTop: '14px',
                      borderTop: '1px dashed #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      fontSize: '12.5px',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Chi Tiết Thu Nhập & Khấu Trừ
                    </div>

                    {basePay > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={13} color="#2563EB" /> Lương cứng ({actualHours}h):
                        </span>
                        <span style={{ fontWeight: 600 }}>+{formatVND(basePay)}</span>
                      </div>
                    )}

                    {computedPartTimePay > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97706' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Briefcase size={13} color="#D97706" /> Part-time ({partTimeHours}h × {formatVND(partTimeRate)}):
                        </span>
                        <span style={{ fontWeight: 600 }}>+{formatVND(computedPartTimePay)}</span>
                      </div>
                    )}

                    {computedNightPay > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6366F1' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Moon size={13} color="#6366F1" /> Ca đêm ({nightHours}h × {formatVND(nightRate)}):
                        </span>
                        <span style={{ fontWeight: 600 }}>+{formatVND(computedNightPay)}</span>
                      </div>
                    )}

                    {totalAllowances > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Wallet size={13} color="#0D9488" /> Phụ cấp:
                        </span>
                        <span style={{ fontWeight: 600 }}>+{formatVND(totalAllowances)}</span>
                      </div>
                    )}

                    {totalBonuses > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Gift size={13} color="#059669" /> Tiền thưởng:
                        </span>
                        <span style={{ fontWeight: 600 }}>+{formatVND(totalBonuses)}</span>
                      </div>
                    )}

                    {totalDeductions > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <ShieldAlert size={13} color="#DC2626" /> Khấu trừ:
                        </span>
                        <span style={{ fontWeight: 600 }}>-{formatVND(totalDeductions)}</span>
                      </div>
                    )}

                    {basePay === 0 && computedPartTimePay === 0 && computedNightPay === 0 && totalAllowances === 0 && totalBonuses === 0 && totalDeductions === 0 && (
                      <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', padding: '4px 0' }}>
                        Chưa có khoản thu nhập nào phát sinh
                      </div>
                    )}

                    <div
                      style={{
                        marginTop: '6px',
                        paddingTop: '8px',
                        borderTop: '1px solid #E2E8F0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 700,
                        color: '#059669',
                      }}
                    >
                      <span>Thực nhận (Net):</span>
                      <span>{formatVND(preview.net)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: '#F8FAFC',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 22px',
                borderRadius: '8px',
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                opacity: isSaving ? 0.75 : 1,
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
              }}
            >
              <Save size={16} />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
