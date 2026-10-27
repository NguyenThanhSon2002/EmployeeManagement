import { api } from '@/shared/api/apiClient';

export interface SystemSettingDto {
  id?: number;
  setting_key: string;
  setting_value: string;
  data_type?: string;
  description?: string;
}

export const settingService = {
  async getAllSettings(): Promise<SystemSettingDto[]> {
    return api.get<SystemSettingDto[]>('/settings');
  },

  async getSettingByKey(key: string): Promise<SystemSettingDto> {
    return api.get<SystemSettingDto>(`/settings/${key}`);
  },

  async updateSetting(key: string, settingValue: string): Promise<SystemSettingDto> {
    return api.put<SystemSettingDto>(`/settings/${key}`, { setting_value: settingValue });
  },
};
