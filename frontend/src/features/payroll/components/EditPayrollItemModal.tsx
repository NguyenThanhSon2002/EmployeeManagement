import React, { useState, useEffect, useMemo } from 'react';
import type { PayrollItem, UpdatePayrollItemPayload } from '../types/payroll.types';
import { X, Calculator, AlertCircle, Save, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

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
  const [actualHours, setActualHours] = useState<number>(0);
  const [nightHours, setNightHours] = useState<number>(0);
  const [basePay, setBasePay] = useState<number>(0);
  const [attendanceBonus, setAttendanceBonus] = useState<number>(0);
  const [allowancesTotal, setAllowancesTotal] = useState<number>(0);
  const [deductionLate, setDeductionLate] = useState<number>(0);
  const [deductionUnpaidLeave, setDeductionUnpaidLeave] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setActualHours(item.actual_hours || 0);
      setNightHours(item.night_hours || 0);
      setBasePay(item.base_pay || 0);
      setAttendanceBonus(item.attendance_bonus || 0);
      setAllowancesTotal(item.allowances_total || 0);
      setDeductionLate(item.deduction_late || 0);
      setDeductionUnpaidLeave(item.deduction_unpaid_leave || 0);
      setNote(item.note || '');
      setErrorMsg(null);
    }
  }, [item]);

  // Live recalculation simulation
  const preview = useMemo(() => {
    if (!item) {
      return { gross: 0, insurance: 0, tax: 0, net: 0, diffNet: 0 };
    }

    const gross = Math.max(
      0,
      basePay +
        (item.night_pay || 0) +
        attendanceBonus +
        allowancesTotal -
        deductionLate -
        deductionUnpaidLeave
    );

    const insurance = item.insurance_deduction || 0;

    // Giảm trừ bản thân (11tr) + phụ cấp ăn trưa miễn thuế (tối đa 730k) + BHXH
    const lunchRelief = Math.min(allowancesTotal, 730000);
    const totalRelief = 11000000 + insurance + lunchRelief;
    const taxableIncome = Math.max(0, gross - totalRelief);

    let tax = 0;
    if (taxableIncome <= 5000000) {
      tax = taxableIncome * 0.05;
    } else if (taxableIncome <= 10000000) {
      tax = 250000 + (taxableIncome - 5000000) * 0.1;
    } else if (taxableIncome <= 18000000) {
      tax = 750000 + (taxableIncome - 10000000) * 0.15;
    } else if (taxableIncome <= 32000000) {
      tax = 1950000 + (taxableIncome - 18000000) * 0.2;
    } else if (taxableIncome <= 52000000) {
      tax = 4750000 + (taxableIncome - 32000000) * 0.25;
    } else if (taxableIncome <= 80000000) {
      tax = 9750000 + (taxableIncome - 52000000) * 0.3;
    } else {
      tax = 18150000 + (taxableIncome - 80000000) * 0.35;
    }
    tax = Math.round(tax);

    const net = Math.max(0, gross - insurance - tax);
    const diffNet = net - (item.net_salary || 0);

    return {
      gross,
      insurance,
      tax,
      net,
      diffNet,
    };
  }, [item, basePay, attendanceBonus, allowancesTotal, deductionLate, deductionUnpaidLeave]);

  if (!isOpen || !item) return null;

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

    const payload: UpdatePayrollItemPayload = {
      actual_hours: Number(actualHours),
      night_hours: Number(nightHours),
      base_pay: Number(basePay),
      attendance_bonus: Number(attendanceBonus),
      allowances_total: Number(allowancesTotal),
      deduction_late: Number(deductionLate),
      deduction_unpaid_leave: Number(deductionUnpaidLeave),
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
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
        padding: 'var(--space-md)',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl, 16px)',
          border: '1px solid var(--color-border)',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--color-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'var(--color-primary-light, #EFF6FF)',
                color: 'var(--color-primary, #2563EB)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calculator size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Chỉnh Sửa Phiếu Lương: {item.full_name} ({item.employee_code})
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {item.position_title} • {item.branch_name} • Hợp đồng {item.employment_type}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', padding: '24px' }}>
            {/* Left Column: Editable Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
                Các Khoản Thu Nhập & Điều Chỉnh
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                    Giờ công thực tế
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={actualHours}
                    onChange={(e) => setActualHours(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                    Giờ làm việc đêm (22h-06h)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={nightHours}
                    onChange={(e) => setNightHours(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                  Lương cơ bản theo công (VNĐ)
                </label>
                <input
                  type="number"
                  step="50000"
                  min="0"
                  value={basePay}
                  onChange={(e) => setBasePay(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                    Thưởng chuyên cần / thêm (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="50000"
                    min="0"
                    value={attendanceBonus}
                    onChange={(e) => setAttendanceBonus(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                    Phụ cấp ăn trưa, đi lại (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="50000"
                    min="0"
                    value={allowancesTotal}
                    onChange={(e) => setAllowancesTotal(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#ef4444', display: 'block', marginBottom: '4px' }}>
                    Phạt đi muộn / vi phạm (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="50000"
                    min="0"
                    value={deductionLate}
                    onChange={(e) => setDeductionLate(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#ef4444', display: 'block', marginBottom: '4px' }}>
                    Trừ nghỉ không lương (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="50000"
                    min="0"
                    value={deductionUnpaidLeave}
                    onChange={(e) => setDeductionUnpaidLeave(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '4px' }}>
                  Lý do / Ghi chú điều chỉnh <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ví dụ: Bổ sung 2h làm thêm dự án và thưởng nóng đạt KPI..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
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
                    color: '#ef4444',
                    fontSize: '12px',
                    background: '#fef2f2',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Right Column: Live Calculation Preview */}
            <div
              style={{
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" />
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Xem Trước Kết Quả Tính Lại</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--color-border)' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Tổng Gross cũ:</span>
                    <span style={{ fontWeight: 500 }}>{formatVND(item.gross_salary || 0)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--color-border)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Tổng Gross mới:</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatVND(preview.gross)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--color-border)' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>BHXH (10.5%):</span>
                    <span style={{ color: '#ef4444' }}>-{formatVND(preview.insurance)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--color-border)' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Thuế TNCN tạm tính:</span>
                    <span style={{ color: '#ef4444' }}>-{formatVND(preview.tax)}</span>
                  </div>

                  <div
                    style={{
                      background: 'var(--color-surface)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      marginTop: '8px',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      Lương Thực Nhận (Net Pay)
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981' }}>
                      {formatVND(preview.net)}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px' }}>
                      {preview.diffNet >= 0 ? (
                        <>
                          <TrendingUp size={14} color="#10b981" />
                          <span style={{ color: '#10b981', fontWeight: 600 }}>+{formatVND(preview.diffNet)}</span>
                          <span style={{ color: 'var(--color-text-muted)' }}>so với trước</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown size={14} color="#ef4444" />
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>{formatVND(preview.diffNet)}</span>
                          <span style={{ color: 'var(--color-text-muted)' }}>so với trước</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '16px', lineHeight: 1.4 }}>
                * Thuế TNCN và Bảo hiểm xã hội được tự động tính toán lại theo biểu lũy tiến từng phần của Pháp luật Việt Nam.
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              background: 'var(--color-surface)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
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
                padding: '8px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary, #2563EB)',
                color: '#fff',
                border: 'none',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                opacity: isSaving ? 0.7 : 1,
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
