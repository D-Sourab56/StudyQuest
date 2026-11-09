
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

// =========================================
// TYPES
// =========================================

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isPrivateAccount: boolean;
  isAnonymousAccount: boolean;
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

  const [isLoading, setIsLoading] = useState(
    true
  );

  // =========================================
  // AUTHENTICATION STATE
  // =========================================

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // =========================================
  // ACCOUNT TYPE
  // =========================================

  const isAnonymousAccount =
    user?.is_anonymous === true;

  // A private StudyQuest account currently
  // uses anonymous Supabase authentication.
  //
  // An existing email-based Supabase session
  // must not be mistaken for a private account.

  const isPrivateAccount =
    user !== null && isAnonymousAccount;

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
  const context = useContext(
    AuthContext
  );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}
