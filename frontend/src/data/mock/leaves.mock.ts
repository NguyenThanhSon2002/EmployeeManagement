import { addDays, format } from 'date-fns';
import type { LeaveRequest } from '@/types/domain.types';

export function getMockLeaves(baseMonday: Date): LeaveRequest[] {
  return [
    {
      id: 7001,
      employeeId: 2, // Trần Thị Bích (EMP-002)
      leaveTypeId: 1,
      leaveTypeName: 'Nghỉ phép năm',
      startDate: format(addDays(baseMonday, 3), 'yyyy-MM-dd'), // Thursday of current week
      endDate: format(addDays(baseMonday, 3), 'yyyy-MM-dd'),
      totalDays: 1,
      reason: 'Việc gia đình',
      status: 'APPROVED',
      tier1ReviewedBy: 1,
      tier2ReviewedBy: null,
    },
    {
      id: 7002,
      employeeId: 5, // Hoàng Thị Mai (EMP-005)
      leaveTypeId: 2,
      leaveTypeName: 'Nghỉ việc riêng hưởng lương',
      startDate: format(addDays(baseMonday, 10), 'yyyy-MM-dd'), // Next week Thursday
      endDate: format(addDays(baseMonday, 10), 'yyyy-MM-dd'),
      totalDays: 1,
      reason: 'Đám cưới người thân',
      status: 'SUBMITTED',
      tier1ReviewedBy: null,
      tier2ReviewedBy: null,
    },
    {
      id: 7003,
      employeeId: 7, // Vũ Thị Lan (EMP-007)
      leaveTypeId: 1,
      leaveTypeName: 'Nghỉ phép năm',
      startDate: format(addDays(baseMonday, 4), 'yyyy-MM-dd'), // Friday
      endDate: format(addDays(baseMonday, 4), 'yyyy-MM-dd'),
      totalDays: 1,
      reason: 'Khám sức khỏe định kỳ',
      status: 'SUBMITTED',
      tier1ReviewedBy: null,
      tier2ReviewedBy: null,
    },
  ];
}
