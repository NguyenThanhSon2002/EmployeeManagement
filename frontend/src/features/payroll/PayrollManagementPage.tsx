import React, { useState, useEffect } from 'react';
import { usePayrollStore } from './store/usePayrollStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { PageHeader } from '@/components/common/PageHeader';
import {
  Calculator,
  CheckCircle,
  FileSpreadsheet,
  Search,
  DollarSign,
  Clock,
  Award,
  Users,
  ShieldCheck,
  Edit3,
  Lock,
  Building2,
  RotateCcw,
} from 'lucide-react';
import { EditPayrollItemModal } from './components/EditPayrollItemModal';
import type { PayrollItem } from './types/payroll.types';

export const PayrollManagementPage: React.FC = () => {
  const {
    activePayroll,
    isLoading,
    selectedMonth,
    selectedYear,
    selectedBranchId,
    setFilter,
    generatePayroll,
    approvePayroll,
    reopenPayroll,
    updatePayrollItem,
    fetchPayrolls,
  } = usePayrollStore();

  const { currentRole } = useAuthStore();
  const { branches, isLoaded: directoryLoaded, fetchDirectory } = useDirectoryStore();
  const { addToast } = useUIStore();

  const isDirectorOrAdmin = currentRole === 'ROLE_DIRECTOR' || currentRole === 'ROLE_ADMIN';
  const canEditPayroll = isDirectorOrAdmin;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [tableBranchFilter, setTableBranchFilter] = useState<string>('ALL');
  const [editingItem, setEditingItem] = useState<PayrollItem | null>(null);

  useEffect(() => {
    if (!directoryLoaded) {
      fetchDirectory();
    }
  }, [directoryLoaded, fetchDirectory]);

  useEffect(() => {
    fetchPayrolls(selectedYear, selectedBranchId || undefined);
  }, [selectedYear, selectedBranchId, fetchPayrolls]);

  const handleGeneratePayroll = async () => {
    const ok = await generatePayroll(selectedMonth, selectedYear, selectedBranchId);
    if (ok) {
      addToast({
        type: 'success',
        title: 'Tính toán bảng lương thành công',
        message: `Đã hoàn tất tính toán bảng lương tháng ${selectedMonth}/${selectedYear}.`,
      });
    } else {
      addToast({
        type: 'error',
        title: 'Lỗi tính lương',
        message: 'Không thể tính lương kỳ này. Vui lòng kiểm tra lại.',
      });
    }
  };

  const handleApprovePayroll = async () => {
    if (!activePayroll) return;
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn phê duyệt chốt bảng lương Tháng ${activePayroll.period_month}/${activePayroll.period_year}? Sau khi duyệt, bảng lương sẽ được khóa bảo vệ.`
    );
    if (!confirmed) return;

    const ok = await approvePayroll(activePayroll.id);
    if (ok) {
      addToast({
        type: 'success',
        title: 'Đã phê duyệt chốt bảng lương',
        message: 'Bảng lương đã chuyển sang trạng thái APPROVED và được khóa an toàn.',
      });
    } else {
      addToast({
        type: 'error',
        title: 'Lỗi duyệt bảng lương',
        message: 'Không thể phê duyệt bảng lương.',
      });
    }
  };

  const handleReopenPayroll = async () => {
    if (!activePayroll) return;
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn mở lại bảng lương Tháng ${activePayroll.period_month}/${activePayroll.period_year} về trạng thái Bản Nháp? Sau khi mở lại, Giám đốc / Admin có thể chỉnh sửa số liệu và duyệt chốt lại.`
    );
    if (!confirmed) return;

    const ok = await reopenPayroll(activePayroll.id);
    if (ok) {
      addToast({
        type: 'success',
        title: 'Đã mở lại bảng lương',
        message: 'Bảng lương đã chuyển về trạng thái BẢN NHÁP. Bạn có thể chỉnh sửa số liệu nhân viên.',
      });
    } else {
      addToast({
        type: 'error',
        title: 'Lỗi mở lại bảng lương',
        message: 'Không thể mở lại bảng lương.',
      });
    }
  };

  const formatVND = (amount?: number) => {
    if (amount === undefined || amount === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const items = activePayroll?.items || [];
  const filteredItems = items.filter((item) => {
    if (filterType !== 'ALL' && item.employment_type !== filterType) return false;
    if (tableBranchFilter !== 'ALL' && item.branch_name !== tableBranchFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = item.full_name?.toLowerCase().includes(q);
      const matchCode = item.employee_code?.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <PageHeader
        icon={<DollarSign size={22} />}
        title="Quản Lý Bảng Lương"
        subtitle="Hệ thống tự động tính lương theo giờ công thực tế, phụ cấp ca đêm 30%, thưởng chuyên cần, BHXH và Thuế TNCN"
      />

      {/* 1. Filter & Actions Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-md)',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-surface)',
          padding: 'var(--space-md)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', alignItems: 'center' }}>
          {/* Branch select */}
          <select
            value={selectedBranchId ?? ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              setFilter(selectedMonth, selectedYear, val);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              fontWeight: 500,
            }}
          >
            {isDirectorOrAdmin && <option value="">Toàn hệ thống (Tất cả chi nhánh)</option>}
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branchName}
              </option>
            ))}
          </select>

          {/* Month select */}
          <select
            value={selectedMonth}
            onChange={(e) => setFilter(Number(e.target.value), selectedYear, selectedBranchId)}
            style={{
              padding: '8px 12px',
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

          {/* Year select */}
          <select
            value={selectedYear}
            onChange={(e) => setFilter(selectedMonth, Number(e.target.value), selectedBranchId)}
            style={{
              padding: '8px 12px',
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

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
          <button
            onClick={handleGeneratePayroll}
            disabled={isLoading || activePayroll?.status === 'APPROVED' || activePayroll?.status === 'LOCKED'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: activePayroll?.status === 'APPROVED' ? 0.6 : 1,
            }}
          >
            <Calculator size={16} />
            {activePayroll ? 'Tính Lại Lương' : 'Tính Lương Kỳ Này'}
          </button>

          {isDirectorOrAdmin && activePayroll && activePayroll.status === 'DRAFT' && (
            <button
              onClick={handleApprovePayroll}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <CheckCircle size={16} />
              Duyệt Chốt Bảng Lương
            </button>
          )}

          {isDirectorOrAdmin && activePayroll && (activePayroll.status === 'APPROVED' || activePayroll.status === 'LOCKED') && (
            <button
              onClick={handleReopenPayroll}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                background: '#f59e0b',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Mở lại bảng lương để Giám đốc / Admin có thể chỉnh sửa số liệu"
            >
              <RotateCcw size={16} />
              Mở Lại Bảng Lương (Chỉnh Sửa)
            </button>
          )}

          {activePayroll && (
            <button
              onClick={() => {
                window.print();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-hover)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <FileSpreadsheet size={16} />
              In Bảng Lương
            </button>
          )}
        </div>
      </div>

      {/* 2. Metric KPI Cards */}
      {activePayroll && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-md)',
          }}
        >
          <div
            style={{
              padding: 'var(--space-md)',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
              <DollarSign size={18} color="var(--color-primary)" />
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Tổng Quỹ Lương Gross</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '8px', color: 'var(--color-text)' }}>
              {formatVND(activePayroll.total_gross)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Trước khấu trừ BHXH & Thuế
            </div>
          </div>

          <div
            style={{
              padding: 'var(--space-md)',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
              <ShieldCheck size={18} />
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Tổng Thực Chi Net</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '8px', color: '#10b981' }}>
              {formatVND(activePayroll.total_net)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Tiền lương thực tế chi trả
            </div>
          </div>

          <div
            style={{
              padding: 'var(--space-md)',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
              <Users size={18} color="#6366f1" />
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Tổng Số Nhân Sự</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '8px', color: 'var(--color-text)' }}>
              {activePayroll.total_employees} nhân viên
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Trạng thái: {activePayroll.status === 'APPROVED' ? 'ĐÃ DUYỆT CHỐT' : 'BẢN NHÁP'}
            </div>
          </div>

          <div
            style={{
              padding: 'var(--space-md)',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
              <Award size={18} color="#f59e0b" />
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Thưởng Chuyên Cần</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '8px', color: '#f59e0b' }}>
              {formatVND(
                activePayroll.items.reduce((acc, curr) => acc + (curr.attendance_bonus || 0), 0)
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Phát tự động từ chấm công
            </div>
          </div>
        </div>
      )}

      {/* 3. Search and Table Section */}
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        {/* Status Banner */}
        {activePayroll && (
          <div
            style={{
              padding: '10px 16px',
              background: activePayroll.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {activePayroll.status === 'APPROVED' ? (
                <>
                  <Lock size={15} color="#10b981" />
                  <span style={{ fontWeight: 700, color: '#10b981' }}>ĐÃ DUYỆT CHỐT:</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    Bảng lương {activePayroll.branch_name ? `• ${activePayroll.branch_name}` : 'Toàn hệ thống'} đã khóa bảo vệ. Giám đốc / Admin có thể bấm nút "Mở Lại Bảng Lương (Chỉnh Sửa)" ở trên nếu cần điều chỉnh.
                  </span>
                </>
              ) : (
                <>
                  <Edit3 size={15} color="#f59e0b" />
                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>BẢN NHÁP:</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    Bảng lương {activePayroll.branch_name ? `• ${activePayroll.branch_name}` : 'Toàn hệ thống'} đang mở. Giám đốc / Admin có thể bấm nút "Sửa" ở từng dòng để điều chỉnh, sau đó bấm "Duyệt Chốt Bảng Lương".
                  </span>
                </>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Kỳ: Tháng {activePayroll.period_month}/{activePayroll.period_year} ({activePayroll.items?.length || 0} nhân sự)
            </div>
          </div>
        )}

        <div
          style={{
            padding: 'var(--space-md)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flex: 1, maxWidth: '400px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
              />
              <input
                type="text"
                placeholder="Tìm nhân viên theo tên hoặc mã NV..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            {/* Table branch filter */}
            <select
              value={tableBranchFilter}
              onChange={(e) => setTableBranchFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              <option value="ALL">Tất cả chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id} value={b.branchName}>
                  {b.branchName}
                </option>
              ))}
            </select>

            {['ALL', 'FULL_TIME', 'PART_TIME'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: filterType === t ? 'var(--color-primary)' : 'transparent',
                  color: filterType === t ? '#fff' : 'var(--color-text)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {t === 'ALL' ? 'Tất cả' : t === 'FULL_TIME' ? 'Full-time' : 'Part-time'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {!activePayroll ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Clock size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <div style={{ fontSize: '16px', fontWeight: 600 }}>Chưa có bảng lương cho kỳ Tháng {selectedMonth}/{selectedYear}</div>
            <div style={{ fontSize: '13px', marginTop: '6px' }}>
              Hãy nhấn nút <b>"Tính Lương Kỳ Này"</b> ở trên để hệ thống tự động tính toán.
            </div>
          </div>
        ) : activePayroll.items.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Building2 size={42} style={{ margin: '0 auto 12px', opacity: 0.6, color: '#f59e0b' }} />
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
              {selectedBranchId
                ? `Chi nhánh ${branches.find((b) => b.id === selectedBranchId)?.branchName || ''} chưa có dữ liệu chấm công kỳ Tháng ${selectedMonth}/${selectedYear}`
                : `Chưa có dữ liệu chấm công cho kỳ Tháng ${selectedMonth}/${selectedYear}`}
            </div>
            <div style={{ fontSize: '13px', maxWidth: '480px', margin: '8px auto 16px', color: 'var(--color-text-muted)' }}>
              Chưa có ca làm việc nào được ghi nhận chấm công tại chi nhánh này trong tháng. Bạn có thể chuyển sang chi nhánh khác có dữ liệu để đối soát và chỉnh sửa.
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {selectedBranchId !== null && (
                <button
                  onClick={() => setFilter(selectedMonth, selectedYear, null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Xem Toàn hệ thống
                </button>
              )}
              {branches.filter((b) => b.id !== selectedBranchId).map((b) => (
                <button
                  key={b.id}
                  onClick={() => setFilter(selectedMonth, selectedYear, b.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-hover)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Xem {b.branchName}
                </button>
              ))}
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Không tìm thấy nhân viên nào phù hợp với bộ lọc tìm kiếm.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Mã NV</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Họ Tên</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Loại HĐ</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Giờ Công</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Giờ Đêm</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Lương Cơ Bản/Giờ</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Phụ Cấp Đêm (30%)</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Thưởng Chuyên Cần</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Khấu Trừ</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right', color: '#10b981' }}>Thực Nhận (Net)</th>
                  {canEditPayroll && (
                    <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'center' }}>Thao Tác</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{item.employee_code}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600 }}>{item.full_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {item.position_title} • {item.branch_name}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: 500,
                          background: item.employment_type === 'FULL_TIME' ? '#e0e7ff' : '#fef3c7',
                          color: item.employment_type === 'FULL_TIME' ? '#3730a3' : '#92400e',
                        }}
                      >
                        {item.employment_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 500 }}>
                      {item.actual_hours}h
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: item.night_hours > 0 ? '#6366f1' : 'inherit' }}>
                      {item.night_hours > 0 ? `${item.night_hours}h` : '-'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      {formatVND(item.base_pay)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: item.night_pay > 0 ? '#6366f1' : 'inherit' }}>
                      {item.night_pay > 0 ? formatVND(item.night_pay) : '-'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: item.attendance_bonus > 0 ? '#f59e0b' : 'inherit' }}>
                      {item.attendance_bonus > 0 ? formatVND(item.attendance_bonus) : '-'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#ef4444' }}>
                      {item.insurance_deduction + item.tax_deduction + item.deduction_late + item.deduction_unpaid_leave > 0
                        ? `-${formatVND(item.insurance_deduction + item.tax_deduction + item.deduction_late + item.deduction_unpaid_leave)}`
                        : '0 ₫'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#10b981', fontSize: '14px' }}>
                      {formatVND(item.net_salary)}
                    </td>
                    {canEditPayroll && (
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => setEditingItem(item)}
                          disabled={activePayroll?.status === 'APPROVED' || activePayroll?.status === 'LOCKED'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg)',
                            color: 'var(--color-text)',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: (activePayroll?.status === 'APPROVED' || activePayroll?.status === 'LOCKED') ? 'not-allowed' : 'pointer',
                            opacity: (activePayroll?.status === 'APPROVED' || activePayroll?.status === 'LOCKED') ? 0.5 : 1,
                          }}
                          title={activePayroll?.status === 'APPROVED' || activePayroll?.status === 'LOCKED' ? 'Bảng lương đã duyệt, không thể chỉnh sửa' : 'Chỉnh sửa thông tin chi tiết'}
                        >
                          <Edit3 size={14} />
                          Sửa
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Payroll Item Modal */}
      {editingItem && (
        <EditPayrollItemModal
          isOpen={!!editingItem}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={async (itemId, payload) => {
            const ok = await updatePayrollItem(itemId, payload);
            if (ok) {
              addToast({
                type: 'success',
                title: 'Cập nhật thành công',
                message: `Đã cập nhật phiếu lương cho nhân viên ${editingItem.full_name}.`,
              });
            } else {
              addToast({
                type: 'error',
                title: 'Cập nhật thất bại',
                message: 'Không thể cập nhật phiếu lương. Vui lòng thử lại.',
              });
            }
            return ok;
          }}
        />
      )}
    </div>
  );
};

