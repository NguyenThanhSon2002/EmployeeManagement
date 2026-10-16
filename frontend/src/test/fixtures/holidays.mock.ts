import { addDays, format } from 'date-fns';
import type { CompanyHoliday } from '@/types/domain.types';

export function getMockHolidays(baseMonday: Date): CompanyHoliday[] {
  return [
    {
      id: 1,
      // Sunday of current week is Company Foundation Day
      holidayDate: format(addDays(baseMonday, 6), 'yyyy-MM-dd'),
      holidayName: 'Ngày Hội Truyền Thống Doanh Nghiệp',
      isPaid: true,
    },
    {
      id: 2,
      holidayDate: '2026-09-02',
      holidayName: 'Ngày Quốc Khánh Việt Nam',
      isPaid: true,
    },
    {
      id: 3,
      holidayDate: '2026-04-30',
      holidayName: 'Ngày Giải Phóng Miền Nam',
      isPaid: true,
    },
    {
      id: 4,
      holidayDate: '2026-05-01',
      holidayName: 'Ngày Quốc Tế Lao Động',
      isPaid: true,
    },
  ];
}
