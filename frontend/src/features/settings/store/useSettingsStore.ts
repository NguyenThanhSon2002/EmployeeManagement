import { create } from 'zustand';
import type { DemoSettings } from '@/types/domain.types';

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
  updateSettings: (partial: Partial<DemoSettings>) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: loadStoredSettings(),

  updateSettings: (partial: Partial<DemoSettings>) => {
    const updated = { ...get().settings, ...partial };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
    set({ settings: updated });
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
