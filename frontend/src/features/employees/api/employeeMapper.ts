import type { Employee, Branch, SecondaryBranchAssignment, EmploymentStatus } from '@/types/domain.types';

/**
 * Ánh xạ DTO kiêm nhiệm chi nhánh từ backend sang định dạng Domain Model
 */
export function mapDtoToSecondaryBranch(sb: any): SecondaryBranchAssignment {
  return {
    branchId: sb.branch_id ?? sb.branchId,
    positionId: sb.position_id ?? sb.positionId ?? 3,
    branchName: sb.branch_name ?? sb.branchName,
    positionName: sb.position_name ?? sb.positionName,
  };
}

/**
 * Ánh xạ DTO chi nhánh từ backend sang định dạng Domain Model
 */
export function mapDtoToBranch(b: any): Branch {
  return {
    id: b.id,
    branchCode: b.branch_code ?? b.branchCode ?? '',
    branchName: b.branch_name ?? b.branchName ?? '',
    address: b.address ?? '',
    phoneNumber: b.phone_number ?? b.phoneNumber ?? '',
    openedDate: b.opened_date ?? b.openedDate ?? '2026-01-01',
    managerId: b.manager_id ?? b.managerId ?? null,
    isActive: b.is_active !== undefined ? b.is_active : (b.isActive !== undefined ? b.isActive : true),
  };
}

/**
 * Ánh xạ DTO nhân viên từ backend (hỗ trợ cả camelCase và snake_case) sang Domain Model
 */
export function mapDtoToEmployee(dto: any): Employee {
  const rawSecondary = dto.secondary_branches ?? dto.secondaryBranches ?? [];
  const secondaryBranches: SecondaryBranchAssignment[] = Array.isArray(rawSecondary)
    ? rawSecondary.map(mapDtoToSecondaryBranch)
    : [];

  const secondaryBranchIds: number[] =
    dto.secondary_branch_ids ??
    dto.secondaryBranchIds ??
    secondaryBranches.map((sb) => sb.branchId);

  return {
    id: dto.id,
    employeeCode: dto.employee_code ?? dto.employeeCode ?? `EMP-${dto.id}`,
    fullName: dto.full_name ?? dto.fullName ?? 'Nhân viên',
    email: dto.email ?? '',
    phoneNumber: dto.phone_number ?? dto.phoneNumber ?? '',
    nationalId: dto.national_id ?? dto.nationalId ?? '',
    dateOfBirth: dto.date_of_birth ?? dto.dateOfBirth ?? '',
    gender: dto.gender ?? 'OTHER',
    address: dto.address ?? '',
    branchId: dto.branch_id ?? dto.branchId ?? dto.department_id ?? 1,
    positionId: dto.position_id ?? dto.positionId ?? 1,
    managerId: dto.manager_id ?? dto.managerId ?? null,
    employmentStatus: (dto.employment_status ?? dto.employmentStatus ?? 'OFFICIAL') as EmploymentStatus,
    employmentType: dto.employment_type ?? dto.employmentType ?? 'FULL_TIME',
    hourlyRate: dto.hourly_rate ?? dto.hourlyRate ?? (dto.employment_type === 'PART_TIME' || dto.employmentType === 'PART_TIME' ? 35000 : undefined),
    hireDate: dto.hire_date ?? dto.hireDate ?? '2026-01-01',
    resignationDate: dto.resignation_date ?? dto.resignationDate ?? null,
    avatarUrl: dto.avatar_url ?? dto.avatarUrl ?? '',
    isActive: dto.is_active !== undefined ? dto.is_active : (dto.isActive !== undefined ? dto.isActive : true),
    version: dto.version ?? 1,
    secondaryBranchIds,
    secondaryBranches,
    hasMultiBranch: Boolean(
      secondaryBranches.length > 0 ||
      secondaryBranchIds.length > 0
    ),
  };
}

/**
 * Chuyển đổi Domain Model sang Payload gửi lên Backend API (snake_case)
 */
export function mapEmployeeToPayload(data: Partial<Employee>): Record<string, any> {
  const payload: Record<string, any> = {};

  if (data.employeeCode !== undefined) payload.employee_code = data.employeeCode.trim();
  if (data.fullName !== undefined) payload.full_name = data.fullName.trim();
  if (data.email !== undefined) payload.email = data.email.trim();
  if (data.phoneNumber !== undefined) payload.phone_number = data.phoneNumber.trim();
  if (data.nationalId !== undefined) payload.national_id = data.nationalId;
  if (data.dateOfBirth !== undefined) payload.date_of_birth = data.dateOfBirth;
  if (data.gender !== undefined) payload.gender = data.gender;
  if (data.address !== undefined) payload.address = data.address;
  if (data.branchId !== undefined) payload.branch_id = data.branchId;
  if (data.positionId !== undefined) payload.position_id = data.positionId;
  if (data.managerId !== undefined) payload.manager_id = data.managerId;
  if (data.employmentStatus !== undefined) payload.employment_status = data.employmentStatus;
  if (data.employmentType !== undefined) payload.employment_type = data.employmentType;
  if (data.hourlyRate !== undefined) payload.hourly_rate = data.hourlyRate;
  if (data.hireDate !== undefined) payload.hire_date = data.hireDate;
  if (data.resignationDate !== undefined) payload.resignation_date = data.resignationDate;
  if (data.isActive !== undefined) payload.is_active = data.isActive;
  if (data.version !== undefined) payload.version = data.version;

  if (data.secondaryBranchIds !== undefined) {
    payload.secondary_branch_ids = data.secondaryBranchIds;
  }
  if (data.secondaryBranches !== undefined) {
    payload.secondary_branches = data.secondaryBranches.map((sb) => ({
      branch_id: sb.branchId,
      position_id: sb.positionId,
    }));
  }

  return payload;
}
