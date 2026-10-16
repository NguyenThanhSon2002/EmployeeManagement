import type { Department } from '@/types/domain.types';

export const MOCK_DEPARTMENTS: Department[] = [
  {
    id: 1,
    departmentCode: 'DEPT-BGD',
    departmentName: 'Ban Giám đốc & Điều hành',
    managerId: 1,
    parentDepartmentId: null,
  },
  {
    id: 2,
    departmentCode: 'DEPT-OPS',
    departmentName: 'Phòng Vận hành Dịch vụ',
    managerId: 1,
    parentDepartmentId: null,
  },
  {
    id: 3,
    departmentCode: 'DEPT-TECH',
    departmentName: 'Phòng Kỹ thuật & Công nghệ',
    managerId: 6,
    parentDepartmentId: null,
  },
  {
    id: 4,
    departmentCode: 'DEPT-HR',
    departmentName: 'Phòng Hành chính - Nhân sự',
    managerId: 11,
    parentDepartmentId: null,
  },
  {
    id: 5,
    departmentCode: 'DEPT-ACC',
    departmentName: 'Phòng Kế toán & Tài chính',
    managerId: 16,
    parentDepartmentId: null,
  },
];
