import { useState, useEffect } from 'react';
import type { Employee, Branch, Position, EmploymentStatus } from '@/types/domain.types';
import { useAuthStore } from '@/shared/auth/useAuthStore';

export interface EmployeeFormData {
  employeeCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  branchId: number;
  secondaryBranchIds: number[];
  secondaryBranches: Array<{ branchId: number; positionId: number }>;
  positionId: number;
  employmentStatus: EmploymentStatus;
  hireDate: string;
}

interface UseEmployeeFormProps {
  isOpen: boolean;
  initialData: Employee | null;
  branches: Branch[];
  positions: Position[];
  onSubmit: (employee: Omit<Employee, 'id'> & { id?: number }) => void;
  onClose: () => void;
}

export function useEmployeeForm({
  isOpen,
  initialData,
  branches,
  positions,
  onSubmit,
  onClose,
}: UseEmployeeFormProps) {
  const { currentRole, currentUser } = useAuthStore();
  const isDirector = currentRole === 'ROLE_DIRECTOR';
  const userBranchId = currentUser?.branchId || (branches.length > 0 ? branches[0].id : 1);
  const defaultBranchId = !isDirector ? userBranchId : (branches.length > 0 ? branches[0].id : 1);

  const [formData, setFormData] = useState<EmployeeFormData>({
    employeeCode: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    branchId: 1,
    secondaryBranchIds: [],
    secondaryBranches: [],
    positionId: 3,
    employmentStatus: 'OFFICIAL',
    hireDate: '2024-01-01',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      let secList: Array<{ branchId: number; positionId: number }> = [];
      if (initialData.secondaryBranches && initialData.secondaryBranches.length > 0) {
        secList = initialData.secondaryBranches.map((sb) => ({
          branchId: sb.branchId,
          positionId: sb.positionId || 3,
        }));
      } else if (initialData.secondaryBranchIds && initialData.secondaryBranchIds.length > 0) {
        secList = initialData.secondaryBranchIds.map((bId) => ({
          branchId: bId,
          positionId: 3,
        }));
      }

      setFormData({
        employeeCode: initialData.employeeCode,
        fullName: initialData.fullName,
        email: initialData.email,
        phoneNumber: initialData.phoneNumber || '',
        branchId: initialData.branchId || 1,
        secondaryBranchIds: initialData.secondaryBranchIds || [],
        secondaryBranches: secList,
        positionId: initialData.positionId || 3,
        employmentStatus: initialData.employmentStatus || 'OFFICIAL',
        hireDate: initialData.hireDate || '2024-01-01',
      });
    } else {
      setFormData({
        employeeCode: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        fullName: '',
        email: '',
        phoneNumber: '',
        branchId: defaultBranchId,
        secondaryBranchIds: [],
        secondaryBranches: [],
        positionId: 3,
        employmentStatus: !isDirector ? 'PROBATION' : 'OFFICIAL',
        hireDate: new Date().toISOString().split('T')[0],
      });
    }
    setErrors({});
  }, [initialData, isOpen, defaultBranchId, isDirector]);

  const updateField = <K extends keyof EmployeeFormData>(field: K, value: EmployeeFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSecondaryBranch = (branchId: number, positionId = 3) => {
    setFormData((prev) => ({
      ...prev,
      secondaryBranches: [...prev.secondaryBranches, { branchId, positionId }],
    }));
  };

  const updateSecondaryBranch = (index: number, branchId: number, positionId: number) => {
    setFormData((prev) => {
      const next = [...prev.secondaryBranches];
      next[index] = { branchId, positionId };
      return { ...prev, secondaryBranches: next };
    });
  };

  const removeSecondaryBranch = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      secondaryBranches: prev.secondaryBranches.filter((_, i) => i !== index),
    }));
  };

  const validate = (): boolean => {
    const err: Record<string, string> = {};

    if (!formData.employeeCode.trim()) {
      err.employeeCode = 'Mã nhân viên không được để trống';
    }

    if (!formData.fullName.trim()) {
      err.fullName = 'Họ và tên không được để trống';
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      err.email = 'Email không hợp lệ (cần định dạng @company.com)';
    }

    if (!formData.phoneNumber.trim() || !/^\d{10}$/.test(formData.phoneNumber.trim())) {
      err.phoneNumber = 'Số điện thoại phải gồm đúng 10 chữ số';
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const effectiveBranchId = isDirector
      ? formData.branchId
      : (initialData ? initialData.branchId : userBranchId);

    const effectiveStatus = !isDirector
      ? (initialData ? initialData.employmentStatus : 'PROBATION')
      : formData.employmentStatus;

    const isEmpActive = effectiveStatus !== 'RESIGNED';

    const validSecondaryBranches = formData.secondaryBranches
      .filter((sb) => sb.branchId && sb.branchId !== effectiveBranchId)
      .map((sb) => {
        const b = branches.find((br) => br.id === sb.branchId);
        const p = positions.find((pos) => pos.id === sb.positionId);
        return {
          branchId: sb.branchId,
          positionId: sb.positionId,
          branchName: b?.branchName,
          positionName: p?.positionName,
        };
      });

    onSubmit({
      ...(initialData ? { id: initialData.id } : {}),
      managerId: initialData?.managerId ?? null,
      employeeCode: formData.employeeCode.trim(),
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      branchId: effectiveBranchId,
      secondaryBranchIds: validSecondaryBranches.map((sb) => sb.branchId),
      secondaryBranches: validSecondaryBranches,
      positionId: formData.positionId,
      employmentStatus: effectiveStatus,
      hireDate: formData.hireDate,
      isActive: isEmpActive,
    });
    onClose();
  };

  const availableBranchesForSecondary = branches.filter(
    (b) => b.id !== formData.branchId && !formData.secondaryBranches.some((sb) => sb.branchId === b.id)
  );

  return {
    formData,
    errors,
    isDirector,
    availableBranchesForSecondary,
    updateField,
    addSecondaryBranch,
    updateSecondaryBranch,
    removeSecondaryBranch,
    handleSubmit,
  };
}
