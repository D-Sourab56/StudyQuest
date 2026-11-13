import {
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";

import { settingsService } from "../services/settingsService";

// =========================================
// SETTINGS INITIALIZER
// =========================================

interface SettingsInitializerProps {
  children: ReactNode;
}

export function SettingsInitializer({
  children,
}: SettingsInitializerProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const settings = settingsService.getSettings();

      document.documentElement.dataset.theme =
        settings.theme;

      document.documentElement.style.colorScheme =
        settings.theme;
    } catch (error) {
      console.error(
        "Could not initialize StudyQuest settings:",
        error
      );
    } finally {
      setIsReady(true);
    }
  }, []);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}