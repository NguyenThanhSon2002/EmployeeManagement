import React, { useState, useEffect } from 'react';
import { usePayrollStore } from './store/usePayrollStore';
import { PageHeader } from '@/components/common/PageHeader';
import {
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Building2,
  DollarSign,
  TrendingDown,
  Award,
  Receipt,
} from 'lucide-react';

export const MyPayslipPage: React.FC = () => {
  const { myPayslip, isLoading, fetchMyPayslip } = usePayrollStore();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  useEffect(() => {
    fetchMyPayslip(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, fetchMyPayslip]);

  const parsedAdjustments = React.useMemo(() => {
    if (!myPayslip?.adjustments_detail) return null;
    if (typeof myPayslip.adjustments_detail === 'object') return myPayslip.adjustments_detail as any;
    try {
      return JSON.parse(myPayslip.adjustments_detail);
    } catch {
      return null;
    }
  }, [myPayslip?.adjustments_detail]);

  const formatVND = (amount?: number) => {
    if (amount === undefined || amount === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', maxWidth: '800px', margin: '0 auto' }}>
      <PageHeader
        icon={<Receipt size={20} />}
        title="Phiếu Lương Của Tôi"
        subtitle="Chi tiết thu nhập, phụ cấp ca đêm, thưởng chuyên cần và các khoản giảm trừ theo quy định"
      />

      {/* 1. Month / Year Selector Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--color-surface)',
          padding: 'var(--space-md)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
          <Calendar size={18} color="var(--color-primary)" />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Kỳ Lương:</span>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              fontWeight: 500,
            }}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              fontWeight: 500,
            }}
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
        </div>

        {myPayslip && (
          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Printer size={16} />
            In Phiếu Lương
          </button>
        )}
      </div>

      {/* 2. Payslip Presentation */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
          Đang nạp dữ liệu phiếu lương...
        </div>
      ) : !myPayslip ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          <AlertCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <div style={{ fontSize: '16px', fontWeight: 600 }}>Chưa có phiếu lương cho Tháng {selectedMonth}/{selectedYear}</div>
          <div style={{ fontSize: '13px', marginTop: '6px' }}>
            Bảng lương kỳ này chưa được tính toán hoặc đang chờ cấp quản lý phê duyệt.
          </div>
        </div>
      ) : (
        <div
          id="printable-payslip"
          style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '24px 28px',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #4338ca 100%)',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.85 }}>
                  EMS Workforce Platform • Enterprise HRMS
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
                  PHIẾU LƯƠNG ĐIỆN TỬ
                </div>
                <div style={{ fontSize: '14px', marginTop: '4px', opacity: 0.9 }}>
                  Kỳ lương Tháng {myPayslip.period_month}/{myPayslip.period_year}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: myPayslip.payroll_status === 'APPROVED' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <CheckCircle2 size={12} />
                  {myPayslip.payroll_status === 'APPROVED' ? 'ĐÃ PHÊ DUYỆT' : 'BẢN TẠM TÍNH'}
                </span>
              </div>
            </div>

            {/* Employee Meta Sub-bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '13px',
              }}
            >
              <div>
                <div style={{ opacity: 0.75, fontSize: '11px' }}>Họ và tên</div>
                <div style={{ fontWeight: 700 }}>{myPayslip.full_name}</div>
              </div>
              <div>
                <div style={{ opacity: 0.75, fontSize: '11px' }}>Mã nhân viên</div>
                <div style={{ fontWeight: 600 }}>{myPayslip.employee_code}</div>
              </div>
              <div>
                <div style={{ opacity: 0.75, fontSize: '11px' }}>Chi nhánh</div>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={12} />
                  {myPayslip.branch_name}
                </div>
              </div>
              <div>
                <div style={{ opacity: 0.75, fontSize: '11px' }}>Chức vụ & Trạng thái</div>
                <div style={{ fontWeight: 600 }}>
                  {myPayslip.position_title} •{' '}
                  {myPayslip.employment_status === 'RESIGNED'
                    ? 'Đã nghỉ việc'
                    : myPayslip.employment_status === 'PROBATION'
                    ? 'Thử việc'
                    : myPayslip.employment_status === 'ON_LEAVE'
                    ? 'Nghỉ chế độ'
                    : 'Chính thức'} ({myPayslip.employment_type === 'PART_TIME' ? 'Part-time' : 'Full-time'})
                </div>
              </div>
            </div>
          </div>

          {/* Time & Attendance Summary Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              padding: '12px 20px',
              background: 'var(--color-bg)',
              borderBottom: '1px solid var(--color-border)',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} color="var(--color-primary)" />
              <span>Giờ công Full-time: <b>{myPayslip.actual_hours || 0}h</b></span>
            </div>
            {myPayslip.part_time_hours !== undefined && myPayslip.part_time_hours > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706' }}>
                <Clock size={15} />
                <span>Giờ công Part-time: <b>{myPayslip.part_time_hours}h</b></span>
              </div>
            )}
            {myPayslip.night_hours > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6366f1' }}>
                <Sparkles size={15} />
                <span>Giờ ca đêm (22h-06h): <b>{myPayslip.night_hours}h</b></span>
              </div>
            )}
            {myPayslip.late_minutes > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
                <AlertCircle size={15} />
                <span>Đi muộn: <b>{myPayslip.late_minutes} phút</b></span>
              </div>
            )}
            {myPayslip.attendance_bonus > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
                <Award size={15} />
                <span>Đạt chuyên cần tháng</span>
              </div>
            )}
          </div>

          {/* Body: 2 Columns (Earnings vs Deductions) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-lg)',
              padding: '24px 28px',
            }}
          >
            {/* Column 1: THU NHẬP (Earnings) */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  marginBottom: '14px',
                  borderBottom: '2px solid var(--color-primary)',
                  paddingBottom: '6px',
                }}
              >
                <DollarSign size={16} />
                THU NHẬP (EARNINGS)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Lương công Full-time:</span>
                  <span style={{ fontWeight: 600 }}>{formatVND(myPayslip.base_pay)}</span>
                </div>

                {myPayslip.part_time_pay !== undefined && myPayslip.part_time_pay > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#d97706', fontWeight: 500 }}>Lương Part-time theo giờ:</span>
                    <span style={{ fontWeight: 600, color: '#d97706' }}>
                      {formatVND(myPayslip.part_time_pay)}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Phụ cấp ca đêm (+30%):</span>
                  <span style={{ fontWeight: 600, color: myPayslip.night_pay > 0 ? '#6366f1' : 'inherit' }}>
                    {formatVND(myPayslip.night_pay)}
                  </span>
                </div>

                {parsedAdjustments?.bonuses && parsedAdjustments.bonuses.length > 0 ? (
                  parsedAdjustments.bonuses.map((b: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{b.name || 'Thưởng'}:</span>
                      <span style={{ fontWeight: 600, color: '#f59e0b' }}>{formatVND(b.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Thưởng chuyên cần:</span>
                    <span style={{ fontWeight: 600, color: myPayslip.attendance_bonus > 0 ? '#f59e0b' : 'inherit' }}>
                      {formatVND(myPayslip.attendance_bonus)}
                    </span>
                  </div>
                )}

                {parsedAdjustments?.allowances && parsedAdjustments.allowances.length > 0 ? (
                  parsedAdjustments.allowances.map((a: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{a.name || 'Phụ cấp'}:</span>
                      <span style={{ fontWeight: 600, color: '#0d9488' }}>{formatVND(a.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Phụ cấp cố định (Ăn trưa, đi lại):</span>
                    <span style={{ fontWeight: 600 }}>{formatVND(myPayslip.allowances_total)}</span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                    paddingTop: '10px',
                    borderTop: '1px dashed var(--color-border)',
                    fontWeight: 700,
                    fontSize: '14px',
                  }}
                >
                  <span>Tổng Thu Nhập (Gross):</span>
                  <span style={{ color: 'var(--color-primary)' }}>{formatVND(myPayslip.gross_salary)}</span>
                </div>
              </div>
            </div>

            {/* Column 2: GIẢM TRỪ (Deductions) */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#ef4444',
                  marginBottom: '14px',
                  borderBottom: '2px solid #ef4444',
                  paddingBottom: '6px',
                }}
              >
                <TrendingDown size={16} />
                CÁC KHOẢN GIẢM TRỪ (DEDUCTIONS)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Bảo hiểm bắt buộc (BHXH, BHYT, BHTN 10.5%):</span>
                  <span style={{ fontWeight: 600, color: myPayslip.insurance_deduction > 0 ? '#ef4444' : 'inherit' }}>
                    {myPayslip.insurance_deduction > 0 ? `-${formatVND(myPayslip.insurance_deduction)}` : '0 ₫'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Thuế Thu Nhập Cá Nhân (PIT):</span>
                  <span style={{ fontWeight: 600, color: myPayslip.tax_deduction > 0 ? '#ef4444' : 'inherit' }}>
                    {myPayslip.tax_deduction > 0 ? `-${formatVND(myPayslip.tax_deduction)}` : '0 ₫'}
                  </span>
                </div>

                {parsedAdjustments?.deductions && parsedAdjustments.deductions.length > 0 ? (
                  parsedAdjustments.deductions.map((d: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{d.name || 'Khấu trừ'}:</span>
                      <span style={{ fontWeight: 600, color: '#ef4444' }}>
                        {d.amount > 0 ? `-${formatVND(d.amount)}` : '0 ₫'}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Khấu trừ đi muộn:</span>
                      <span style={{ fontWeight: 600, color: myPayslip.deduction_late > 0 ? '#ef4444' : 'inherit' }}>
                        {myPayslip.deduction_late > 0 ? `-${formatVND(myPayslip.deduction_late)}` : '0 ₫'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Khấu trừ ngày nghỉ không lương:</span>
                      <span style={{ fontWeight: 600, color: myPayslip.deduction_unpaid_leave > 0 ? '#ef4444' : 'inherit' }}>
                        {myPayslip.deduction_unpaid_leave > 0 ? `-${formatVND(myPayslip.deduction_unpaid_leave)}` : '0 ₫'}
                      </span>
                    </div>
                  </>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                    paddingTop: '10px',
                    borderTop: '1px dashed var(--color-border)',
                    fontWeight: 700,
                    fontSize: '14px',
                  }}
                >
                  <span>Tổng Giảm Trừ:</span>
                  <span style={{ color: '#ef4444' }}>-{formatVND(myPayslip.total_deductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Take-Home Highlight Footer */}
          <div
            style={{
              padding: '20px 28px',
              background: 'var(--color-bg)',
              borderTop: '2px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                LƯƠNG THỰC LĨNH CHUYỂN KHOẢN (NET TAKE-HOME)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Đã bao gồm đầy đủ phụ cấp và các khoản khấu trừ luật định
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981' }}>
                {formatVND(myPayslip.net_salary)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
