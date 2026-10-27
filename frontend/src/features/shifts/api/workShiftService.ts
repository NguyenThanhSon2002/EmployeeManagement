import { api } from '@/shared/api/apiClient';
import type { ShiftTemplate } from '@/types/domain.types';

export function mapDtoToShiftTemplate(dto: any): ShiftTemplate {
  const startTime = dto.start_time ? dto.start_time.substring(0, 5) : (dto.startTime?.substring(0, 5) || '08:00');
  const endTime = dto.end_time ? dto.end_time.substring(0, 5) : (dto.endTime?.substring(0, 5) || '17:00');

  return {
    id: dto.id,
    shiftCode: dto.shift_code || dto.shiftCode,
    shiftName: dto.shift_name || dto.shiftName,
    branchId: dto.branch_id ?? dto.branchId ?? null,
    branchName: dto.branch_name || dto.branchName || null,
    startTime,
    endTime,
    breakMinutes: dto.break_minutes ?? dto.breakMinutes ?? 0,
    isCrossMidnight: Boolean(dto.is_cross_midnight ?? dto.isCrossMidnight),
    colorCode: dto.color_code || dto.colorCode || '#1677FF',
    textColor: dto.text_color || dto.textColor || '#FFFFFF',
    minStaffing: dto.min_staffing ?? dto.minStaffing ?? 1,
    maxStaffing: dto.max_staffing ?? dto.maxStaffing ?? 10,
    applicableDays: dto.applicable_days || dto.applicableDays || '1,2,3,4,5,6,7',
    isActive: dto.is_active ?? dto.isActive ?? true,
  };
}

export function mapShiftTemplateToDto(t: Partial<ShiftTemplate>): Record<string, any> {
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return undefined;
    if (timeStr.length === 5) return `${timeStr}:00`;
    return timeStr;
  };

  const payload: Record<string, any> = {};
  if (t.id !== undefined) payload.id = t.id;
  if (t.shiftCode !== undefined) payload.shift_code = t.shiftCode;
  if (t.shiftName !== undefined) payload.shift_name = t.shiftName;
  if (t.branchId !== undefined) payload.branch_id = t.branchId;
  if (t.startTime !== undefined) payload.start_time = formatTime(t.startTime);
  if (t.endTime !== undefined) payload.end_time = formatTime(t.endTime);
  if (t.breakMinutes !== undefined) payload.break_minutes = t.breakMinutes;
  if (t.isCrossMidnight !== undefined) payload.is_cross_midnight = t.isCrossMidnight;
  if (t.colorCode !== undefined) payload.color_code = t.colorCode;
  if (t.textColor !== undefined) payload.text_color = t.textColor;
  if (t.minStaffing !== undefined) payload.min_staffing = t.minStaffing;
  if (t.maxStaffing !== undefined) payload.max_staffing = t.maxStaffing;
  if (t.applicableDays !== undefined) payload.applicable_days = t.applicableDays;
  if (t.isActive !== undefined) payload.is_active = t.isActive;

  return payload;
}

export const workShiftService = {
  async getAllWorkShifts(branchId?: number): Promise<ShiftTemplate[]> {
    const endpoint = branchId ? `/work-shifts?branchId=${branchId}` : '/work-shifts';
    const list = await api.get<any[]>(endpoint);
    return (list || []).map(mapDtoToShiftTemplate);
  },

  async getWorkShiftById(id: number): Promise<ShiftTemplate> {
    const item = await api.get<any>(`/work-shifts/${id}`);
    return mapDtoToShiftTemplate(item);
  },

  async createWorkShift(template: Omit<ShiftTemplate, 'id'>): Promise<ShiftTemplate> {
    const res = await api.post<any>('/work-shifts', mapShiftTemplateToDto(template));
    return mapDtoToShiftTemplate(res);
  },

  async updateWorkShift(id: number, data: Partial<ShiftTemplate>): Promise<ShiftTemplate> {
    const res = await api.put<any>(`/work-shifts/${id}`, mapShiftTemplateToDto(data));
    return mapDtoToShiftTemplate(res);
  },

  async deleteWorkShift(id: number): Promise<void> {
    await api.delete<void>(`/work-shifts/${id}`);
  },
};
