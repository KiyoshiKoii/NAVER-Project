import { useState, useEffect, useCallback } from 'react';

export interface AppSettings {
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  defaultPriority: 'high' | 'medium' | 'low';
  defaultEstimatedTime: number;
}

const defaultSettings: AppSettings = {
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  defaultPriority: 'medium',
  defaultEstimatedTime: 60,
};

const SETTINGS_KEY = 'app-settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      // Merge saved settings with defaults to avoid missing keys
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const saveSettings = useCallback((newSettings: AppSettings) => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      // Dispatch event to sync settings across tabs
      window.dispatchEvent(new StorageEvent('storage', { key: SETTINGS_KEY }));
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }, []);

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === SETTINGS_KEY) {
        try {
          const saved = localStorage.getItem(SETTINGS_KEY);
          if (saved) {
            setSettings({ ...defaultSettings, ...JSON.parse(saved) });
          }
        } catch (error) {
          console.error("Failed to reload settings:", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { settings, saveSettings };
};