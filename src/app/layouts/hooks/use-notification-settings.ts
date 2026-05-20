'use client';

import { useEffect, useState } from 'react';

export type NotificationPosition = 'center' | 'bottom-right' | 'bottom-right-small';

export interface NotificationSettings {
  enabled: boolean;
  position: NotificationPosition;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  position: 'center',
};

const STORAGE_KEY = 'checklab-notification-settings';

export function useNotificationSettings() {
  const [settings, setSettingsState] = useState<NotificationSettings>(
    DEFAULT_SETTINGS,
  );
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as NotificationSettings;
        setSettingsState(parsed);
      }
    } catch (error) {
      console.warn('Failed to load notification settings:', error);
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettingsState((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save notification settings:', error);
      }
      return updated;
    });
  };

  return { settings, updateSettings, isLoaded };
}
