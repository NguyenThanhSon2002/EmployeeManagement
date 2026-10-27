import { create } from 'zustand';
import type { DemoSettings } from '@/types/domain.types';
import { settingService } from '../api/settingService';
import { isMockEnabled } from '@/config/env.config';

const STORAGE_KEY = 'EMS_SETTINGS_STATE_V1';

const DEFAULT_SETTINGS: DemoSettings = {
  minRestBetweenShiftsHours: 11.0,
  maxWeeklyHours: 48.0,
  maxDailyHours: 12.0,
  gracePeriodMinutes: 5,
  leaveConflictSeverity: 'WARNING',
  overnightAttribution: 'START_DATE',
};

function loadStoredSettings(): DemoSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore localStorage errors
  }
  return DEFAULT_SETTINGS;
}

interface SettingsState {
  settings: DemoSettings;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (partial: Partial<DemoSettings>) => Promise<void>;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: loadStoredSettings(),
  isLoading: false,

  fetchSettings: async () => {
    if (isMockEnabled()) return;
    try {
      set({ isLoading: true });
      const list = await settingService.getAllSettings();
      if (list && Array.isArray(list) && list.length > 0) {
        const mapped = { ...get().settings };
        for (const item of list) {
          if (item.setting_key === 'MIN_REST_BETWEEN_SHIFTS_HOURS') {
            mapped.minRestBetweenShiftsHours = parseFloat(item.setting_value) || 11.0;
          } else if (item.setting_key === 'MAX_WEEKLY_HOURS') {
            mapped.maxWeeklyHours = parseFloat(item.setting_value) || 48.0;
          } else if (item.setting_key === 'MAX_DAILY_HOURS') {
            mapped.maxDailyHours = parseFloat(item.setting_value) || 12.0;
          } else if (item.setting_key === 'GRACE_PERIOD_MINUTES') {
            mapped.gracePeriodMinutes = parseInt(item.setting_value, 10) || 5;
          } else if (item.setting_key === 'LEAVE_CONFLICT_SEVERITY') {
            mapped.leaveConflictSeverity = (item.setting_value as any) || 'WARNING';
          }
        }
        set({ settings: mapped, isLoading: false });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        } catch {
          // Ignore
        }
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.warn('Could not fetch settings from backend, keeping cached state:', err);
      set({ isLoading: false });
    }
  },

  updateSettings: async (partial: Partial<DemoSettings>) => {
    const updated = { ...get().settings, ...partial };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
    set({ settings: updated });

    if (!isMockEnabled()) {
      const promises: Promise<unknown>[] = [];

      if (partial.minRestBetweenShiftsHours !== undefined) {
        promises.push(
          settingService.updateSetting(
            'MIN_REST_BETWEEN_SHIFTS_HOURS',
            partial.minRestBetweenShiftsHours.toString()
          ).catch((err) => console.warn('Failed to update MIN_REST_BETWEEN_SHIFTS_HOURS:', err))
        );
      }
      if (partial.maxWeeklyHours !== undefined) {
        promises.push(
          settingService.updateSetting(
            'MAX_WEEKLY_HOURS',
            partial.maxWeeklyHours.toString()
          ).catch((err) => console.warn('Failed to update MAX_WEEKLY_HOURS:', err))
        );
      }
      if (partial.maxDailyHours !== undefined) {
        promises.push(
          settingService.updateSetting(
            'MAX_DAILY_HOURS',
            partial.maxDailyHours.toString()
          ).catch((err) => console.warn('Failed to update MAX_DAILY_HOURS:', err))
        );
      }
      if (partial.gracePeriodMinutes !== undefined) {
        promises.push(
          settingService.updateSetting(
            'GRACE_PERIOD_MINUTES',
            partial.gracePeriodMinutes.toString()
          ).catch((err) => console.warn('Failed to update GRACE_PERIOD_MINUTES:', err))
        );
      }
      if (partial.leaveConflictSeverity !== undefined) {
        promises.push(
          settingService.updateSetting(
            'LEAVE_CONFLICT_SEVERITY',
            partial.leaveConflictSeverity
          ).catch((err) => console.warn('Failed to update LEAVE_CONFLICT_SEVERITY:', err))
        );
      }

      await Promise.all(promises);
    }
  },

  resetToDefaults: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    set({ settings: DEFAULT_SETTINGS });
  },
}));
