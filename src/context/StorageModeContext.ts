
import {
  createContext,
  useContext,
} from "react";

// Keep the existing mode type for compatibility
// with components that still check "private".
export type StorageMode = "private";

export interface StorageModeContextValue {
  mode: StorageMode;
  accountUserId: string | null;
  isSwitching: boolean;
  selectPrivateMode: () => boolean;
}

export const StorageModeContext =
  createContext<StorageModeContextValue | undefined>(
    undefined
  );

export function useStorageMode(): StorageModeContextValue {
  const context = useContext(StorageModeContext);

  if (!context) {
    throw new Error(
      "useStorageMode must be used inside StorageScopeGate."
    );
  }

  return context;
}
