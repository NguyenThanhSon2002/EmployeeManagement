import React, { useState, useEffect } from 'react';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { useUIStore } from '@/shared/store/useUIStore';
import { authService } from '@/shared/auth/authService';
import {
  UserPlus,
  X,
  User,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface BranchOption {
  id: number;
  branchCode: string;
  branchName: string;
}

const DEFAULT_FALLBACK_BRANCHES: BranchOption[] = [
  { id: 1, branchCode: 'CN_CAUGIAY', branchName: 'Chi nhánh Cầu Giấy' },
  { id: 2, branchCode: 'CN_DONGDA', branchName: 'Chi nhánh Đống Đa' },
  { id: 3, branchCode: 'CN_HOANKIEM', branchName: 'Chi nhánh Hoàn Kiếm' },
];

interface RegisterAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: (employeeCode: string, defaultPassword?: string) => void;
}

export const RegisterAccountModal: React.FC<RegisterAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
}) => {
  const modalRef = useModalFocusTrap<HTMLDivElement>({ isOpen, onClose });
  const { addToast } = useUIStore();

  const [branches, setBranches] = useState<BranchOption[]>(DEFAULT_FALLBACK_BRANCHES);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>(DEFAULT_FALLBACK_BRANCHES[0].id);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const [registeredData, setRegisteredData] = useState<{
    employeeCode: string;
    fullName: string;
    email: string;
    branchName: string;
    defaultPassword: string;
  } | null>(null);

  // Tải danh sách chi nhánh hoạt động khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingBranches(true);

    authService
      .getPublicBranches()
      .then((data: any) => {
        if (isMounted) {
          const list = (data || []).map((b: any) => ({
            id: b.id,
            branchCode: b.branch_code || b.branchCode || '',
            branchName: b.branch_name || b.branchName || 'Chi nhánh',
          }));
          const finalList = list.length > 0 ? list : DEFAULT_FALLBACK_BRANCHES;
          setBranches(finalList);
          setSelectedBranchId((prev) => (prev ? prev : finalList[0].id));
        }
      })
      .catch((err) => {
        console.warn('Không thể tải chi nhánh từ server, dùng chi nhánh mặc định:', err);
        if (isMounted) {
          setBranches(DEFAULT_FALLBACK_BRANCHES);
          setSelectedBranchId((prev) => (prev ? prev : DEFAULT_FALLBACK_BRANCHES[0].id));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingBranches(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setSelectedBranchId(branches.length > 0 ? branches[0].id : DEFAULT_FALLBACK_BRANCHES[0].id);
    setErrorMsg(null);
    setRegisteredData(null);
    setCopiedCode(false);
    setCopiedPass(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setErrorMsg('Vui lòng nhập họ và tên đầy đủ.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (!cleanPhone) {
      setErrorMsg('Vui lòng nhập số điện thoại liên hệ.');
      return;
    }
    if (!selectedBranchId) {
      setErrorMsg('Vui lòng chọn chi nhánh làm việc.');
      return;
    }

    setIsLoading(true);

    try {
      const res: any = await authService.register({
        fullName: cleanName,
        email: cleanEmail,
        phoneNumber: cleanPhone,
        branchId: Number(selectedBranchId),
      });

      const empCode = res.employee_code || res.employeeCode || '';
      const bName = res.branch_name || res.branchName || '';
      const defPass = res.default_password || res.defaultPassword || '';

      setRegisteredData({
        employeeCode: empCode,
        fullName: res.full_name || res.fullName || cleanName,
        email: res.email || cleanEmail,
        branchName: bName,
        defaultPassword: defPass,
      });

      addToast({
        type: 'success',
        title: 'Tạo tài khoản thành công',
        message: `Mã nhân viên của bạn là ${empCode}`,
      });
    } catch (err: any) {
      console.error('Lỗi đăng ký:', err);
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, type: 'code' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const handleDirectLogin = () => {
    if (!registeredData) return;
    onSuccessLogin?.(registeredData.employeeCode, registeredData.defaultPassword);
    handleResetForm();
  };

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleResetForm();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-modal-title"
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.2), 0 10px 10px -5px rgba(15, 23, 42, 0.1)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          animation: 'fadeInModal 0.2s ease-out',
        }}
      >
        <style>{`
          @keyframes fadeInModal {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <UserPlus size={20} />
            </div>
            <div>
              <h2
                id="register-modal-title"
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#0F172A',
                }}
              >
                Tạo tài khoản mới
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748B' }}>
                Đăng ký tài khoản nhân viên vào hệ thống phân ca
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetForm}
            aria-label="Đóng popup"
            style={{
              background: 'none',
              border: 'none',
              padding: 6,
              borderRadius: 8,
              cursor: 'pointer',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          {registeredData ? (
            <div style={{ textAlign: 'center', padding: '10px 4px' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
                Tạo tài khoản thành công!
              </h3>
              <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.5, margin: '0 0 16px' }}>
                Chào mừng <strong>{registeredData.fullName}</strong>! Tài khoản nhân viên của bạn đã sẵn sàng để đăng nhập vào hệ thống.
              </p>

              {/* Thông tin tài khoản được cấp */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  padding: '16px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                {/* Mã nhân viên */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 12, color: '#64748B', display: 'block' }}>Mã nhân viên (Tài khoản)</span>
                    <strong style={{ fontSize: 16, color: '#2563EB', fontFamily: 'monospace' }}>
                      {registeredData.employeeCode}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(registeredData.employeeCode, 'code')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: 6,
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: copiedCode ? '#059669' : '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    {copiedCode ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>

                {/* Mật khẩu mặc định */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 12, color: '#64748B', display: 'block' }}>Mật khẩu đăng nhập</span>
                    <strong style={{ fontSize: 15, color: '#0F172A', fontFamily: 'monospace' }}>
                      {registeredData.defaultPassword}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(registeredData.defaultPassword, 'pass')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: 6,
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: copiedPass ? '#059669' : '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedPass ? <Check size={14} /> : <Copy size={14} />}
                    {copiedPass ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>

                {/* Chi nhánh & Thiết lập mặc định */}
                <div
                  style={{
                    paddingTop: 10,
                    borderTop: '1px dashed #E2E8F0',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    fontSize: 12.5,
                  }}
                >
                  <div>
                    <span style={{ color: '#64748B' }}>Chi nhánh: </span>
                    <strong style={{ color: '#334155' }}>{registeredData.branchName}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Vị trí: </span>
                    <strong style={{ color: '#334155' }}>Nhân viên</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Quyền hạn: </span>
                    <strong style={{ color: '#334155' }}>ROLE_EMPLOYEE</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Hợp đồng: </span>
                    <strong style={{ color: '#D97706' }}>Thử việc</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleResetForm}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleDirectLogin}
                  style={{
                    flex: 1.8,
                    height: 42,
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  Đăng nhập ngay <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {errorMsg && (
                <div
                  role="alert"
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    color: '#B91C1C',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 12.5,
                  color: '#475569',
                  lineHeight: 1.45,
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                }}
              >
                <ShieldCheck size={16} style={{ color: '#2563EB', flexShrink: 0, marginTop: 2 }} />
                <span>
                  Mã nhân viên sẽ được tự động cấp phát tăng dần. Tài khoản mới mặc định thuộc vai trò <strong>Nhân viên</strong> với chế độ hợp đồng <strong>Thử việc</strong>.
                </span>
              </div>

              {/* Full Name */}
              <div>
                <label
                  htmlFor="reg-fullname"
                  style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}
                >
                  Họ và tên <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                  />
                  <input
                    id="reg-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 12px 0 38px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: 13.5,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                </div>
              </div>

              {/* Email & Phone Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    htmlFor="reg-email"
                    style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}
                  >
                    Email liên hệ <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={16}
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                    />
                    <input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nv.a@company.com"
                      style={{
                        width: '100%',
                        height: 40,
                        padding: '0 12px 0 38px',
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        fontSize: 13.5,
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                      onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-phone"
                    style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}
                  >
                    Số điện thoại <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone
                      size={16}
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                    />
                    <input
                      id="reg-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912 345 678"
                      style={{
                        width: '100%',
                        height: 40,
                        padding: '0 12px 0 38px',
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        fontSize: 13.5,
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                      onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                    />
                  </div>
                </div>
              </div>

              {/* Branch Dropdown Select */}
              <div>
                <label
                  htmlFor="reg-branch"
                  style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}
                >
                  Chọn chi nhánh làm việc <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2
                    size={16}
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                  />
                  <select
                    id="reg-branch"
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : '')}
                    disabled={isLoadingBranches}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 12px 0 38px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: 13.5,
                      boxSizing: 'border-box',
                      outline: 'none',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  >
                    {isLoadingBranches ? (
                      <option value="">Đang tải danh sách chi nhánh...</option>
                    ) : branches.length === 0 ? (
                      <option value="">Không có chi nhánh khả dụng</option>
                    ) : (
                      branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.branchName} ({b.branchCode})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={handleResetForm}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: 13.5,
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading || isLoadingBranches}
                  style={{
                    flex: 1.6,
                    height: 42,
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: 13.5,
                    cursor: isLoading || isLoadingBranches ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Tạo tài khoản'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
