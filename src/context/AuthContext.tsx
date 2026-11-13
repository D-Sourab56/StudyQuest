
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

import {
  supabase,
  getSavedQrDevice,
  getQrAccessToken,
} from "../lib/supabase";

// =========================================
// TYPES
// =========================================

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isPrivateAccount: boolean;
  isAnonymousAccount: boolean;
  isQrAccount: boolean;
  accountUserId: string | null;
  qrAuthError: string | null;
}

interface AuthProviderProps {
  children: ReactNode;
}

// =========================================
// CONTEXT
// =========================================

const AuthContext = createContext<
  AuthContextValue | undefined
>(undefined);

// =========================================
// PROVIDER
// =========================================

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(
    null
  );

  const [qrAccountId, setQrAccountId] =
    useState<string | null>(null);

  const [qrAuthError, setQrAuthError] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(
    true
  );

  // =========================================
  // AUTHENTICATION STATE
  // =========================================

  useEffect(() => {
    let active = true;
    let nativeReady = false;
    let qrReady = false;

    function finishLoading() {
      if (
        active &&
        nativeReady &&
        qrReady
      ) {
        setIsLoading(false);
      }
    }

    // Existing Supabase Auth session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;

        setUser(session?.user ?? null);

        nativeReady = true;
        finishLoading();
      }
    );

    // Restore previously authorized QR device
    async function restoreQrAccount() {
      try {
        const device = getSavedQrDevice();

        if (!device) {
          return;
        }

        const token = await getQrAccessToken();

        if (!active) return;

        if (!token) {
          throw new Error(
            "QR device session unavailable."
          );
        }

        setQrAccountId(device.accountId);
        setQrAuthError(null);
      } catch (error) {
        if (!active) return;

        console.error(
          "StudyQuest QR session restoration failed:",
          error
        );

        setQrAuthError(
          error instanceof Error
            ? error.message
            : "Unable to restore QR login."
        );
      } finally {
        qrReady = true;
        finishLoading();
      }
    }

    void restoreQrAccount();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // =========================================
  // ACCOUNT TYPE
  // =========================================

  const isAnonymousAccount =
    user?.is_anonymous === true;

  // A QR account is valid only after the
  // backend has verified the device credential.
  const isQrAccount =
    user === null &&
    qrAccountId !== null;

  const isPrivateAccount =
    (user !== null && isAnonymousAccount) ||
    isQrAccount;

  const accountUserId =
    isAnonymousAccount && user
      ? user.id
      : isQrAccount
        ? qrAccountId
        : null;

  // =========================================
  // PROVIDER
  // =========================================

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isPrivateAccount,
        isAnonymousAccount,
        isQrAccount,
        accountUserId,
        qrAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// =========================================
// CUSTOM HOOK
// =========================================

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}
