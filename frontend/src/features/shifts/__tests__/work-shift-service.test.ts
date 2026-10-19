import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  workShiftService,
  mapDtoToShiftTemplate,
  mapShiftTemplateToDto,
} from '../api/workShiftService';
import { api } from '@/shared/api/apiClient';

vi.mock('@/shared/api/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('workShiftService & Data Mappers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps backend DTO snake_case to frontend ShiftTemplate camelCase', () => {
    const backendDto = {
      id: 5,
      shift_code: 'CA_TOI',
      shift_name: 'Ca Tối (18:00 - 22:00)',
      start_time: '18:00:00',
      end_time: '22:00:00',
      break_minutes: 15,
      is_cross_midnight: false,
      color_code: '#722ED1',
      text_color: '#FFFFFF',
      min_staffing: 2,
      max_staffing: 5,
      applicable_days: '1,2,3,4,5',
      is_active: true,
    };

    const template = mapDtoToShiftTemplate(backendDto);

    expect(template.id).toBe(5);
    expect(template.shiftCode).toBe('CA_TOI');
    expect(template.shiftName).toBe('Ca Tối (18:00 - 22:00)');
    expect(template.startTime).toBe('18:00');
    expect(template.endTime).toBe('22:00');
    expect(template.breakMinutes).toBe(15);
    expect(template.isCrossMidnight).toBe(false);
    expect(template.colorCode).toBe('#722ED1');
    expect(template.textColor).toBe('#FFFFFF');
    expect(template.minStaffing).toBe(2);
    expect(template.maxStaffing).toBe(5);
  });

  it('maps frontend ShiftTemplate to backend payload snake_case with seconds', () => {
    const template = {
      id: 2,
      shiftCode: 'CA_CHIEU',
      shiftName: 'Ca Chiều',
      startTime: '14:00',
      endTime: '22:00',
      breakMinutes: 30,
      isCrossMidnight: false,
      colorCode: '#52C41A',
      textColor: '#FFFFFF',
      minStaffing: 3,
      maxStaffing: 10,
    };

    const payload = mapShiftTemplateToDto(template);

    expect(payload.id).toBe(2);
    expect(payload.shift_code).toBe('CA_CHIEU');
    expect(payload.start_time).toBe('14:00:00');
    expect(payload.end_time).toBe('22:00:00');
    expect(payload.break_minutes).toBe(30);
    expect(payload.is_cross_midnight).toBe(false);
  });

  it('calls api.get on getAllWorkShifts', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([
      {
        id: 1,
        shift_code: 'CA_SANG',
        shift_name: 'Ca Sáng',
        start_time: '06:00:00',
        end_time: '14:00:00',
      },
    ]);

    const result = await workShiftService.getAllWorkShifts();

    expect(api.get).toHaveBeenCalledWith('/work-shifts');
    expect(result).toHaveLength(1);
    expect(result[0].shiftCode).toBe('CA_SANG');
  });

  it('calls api.post on createWorkShift', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      id: 10,
      shift_code: 'CA_EXTRA',
      shift_name: 'Ca Tăng Cường',
      start_time: '12:00:00',
      end_time: '16:00:00',
    });

    const created = await workShiftService.createWorkShift({
      shiftCode: 'CA_EXTRA',
      shiftName: 'Ca Tăng Cường',
      startTime: '12:00',
      endTime: '16:00',
      breakMinutes: 0,
      isCrossMidnight: false,
      colorCode: '#1677FF',
      textColor: '#FFFFFF',
      minStaffing: 1,
      maxStaffing: 5,
      applicableDays: '1,2,3,4,5,6,7',
      isActive: true,
    });

    expect(api.post).toHaveBeenCalledWith(
      '/work-shifts',
      expect.objectContaining({
        shift_code: 'CA_EXTRA',
        start_time: '12:00:00',
        end_time: '16:00:00',
      })
    );
    expect(created.id).toBe(10);
  });

  it('calls api.put on updateWorkShift', async () => {
    vi.mocked(api.put).mockResolvedValueOnce({
      id: 1,
      shift_code: 'CA_SANG',
      shift_name: 'Ca Sáng Đã Sửa',
      start_time: '07:00:00',
      end_time: '15:00:00',
    });

    const updated = await workShiftService.updateWorkShift(1, {
      shiftName: 'Ca Sáng Đã Sửa',
      startTime: '07:00',
    });

    expect(api.put).toHaveBeenCalledWith(
      '/work-shifts/1',
      expect.objectContaining({
        shift_name: 'Ca Sáng Đã Sửa',
        start_time: '07:00:00',
      })
    );
    expect(updated.shiftName).toBe('Ca Sáng Đã Sửa');
  });

  it('calls api.delete on deleteWorkShift', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce(undefined);

    await workShiftService.deleteWorkShift(1);

    expect(api.delete).toHaveBeenCalledWith('/work-shifts/1');
  });
});
