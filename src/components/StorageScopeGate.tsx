
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";

import { useAuth } from "../context/AuthContext";

import {
  StorageModeContext,
} from "../context/StorageModeContext";

import { createPrivateAccount } from "../services/authService";
import { storageScopeService } from "../services/storageScopeService";
import { settingsService } from "../services/settingsService";
import { supabase } from "../lib/supabase";

const STORAGE_PREFERENCE_KEY =
  "studyquest:storage-preference:v1";

interface StorageScopeGateProps {
  children: ReactNode;
}

interface ActivationState {
  userId: string;
  error: string | null;
}

export function StorageScopeGate({
  children,
}: StorageScopeGateProps) {
  const {
    user,
    isLoading,
    isAnonymousAccount,
  } = useAuth();

  const [activation, setActivation] =
    useState<ActivationState | null>(null);

  const [isCreating, setIsCreating] =
    useState(false);

  const [isSigningOut, setIsSigningOut] =
    useState(false);

  const [actionError, setActionError] =
    useState<string | null>(null);

  const accountUserId =
    !isLoading && isAnonymousAccount && user
      ? user.id
      : null;

  // Activate only the storage belonging to
  // the authenticated Supabase account.
  useEffect(() => {
    if (accountUserId === null) {
      return;
    }

    let cancelled = false;

    function reportResult(error: string | null) {
      queueMicrotask(() => {
        if (!cancelled) {
          setActivation({
            userId: accountUserId!,
            error,
          });
        }
      });
    }

    try {
      storageScopeService.activateAccount(
        accountUserId
      );

      const settings =
        settingsService.getSettings();

      document.documentElement.dataset.theme =
        settings.theme;

      document.documentElement.style.colorScheme =
        settings.theme;

      // Retain compatibility with the existing
      // storage preference key.
      try {
        localStorage.setItem(
          STORAGE_PREFERENCE_KEY,
          accountUserId
        );
      } catch {
        // Optional preference storage.
      }

      reportResult(null);
    } catch (error) {
      console.error(
        "StudyQuest account storage failed:",
        error
      );

      reportResult(
        error instanceof Error
          ? error.message
          : "Unable to activate account storage."
      );
    }

    return () => {
      cancelled = true;
    };
  }, [accountUserId]);

  const isAccountReady =
    accountUserId !== null &&
    activation?.userId === accountUserId &&
    activation.error === null;

  // Temporary compatibility method.
  // Account activation is now automatic.
  const selectPrivateMode = useCallback(
    () => isAccountReady,
    [isAccountReady]
  );

  async function handleCreateAccount() {
    if (isLoading || isCreating || user !== null) {
      return;
    }

    setActionError(null);
    setIsCreating(true);

    try {
      const result = await createPrivateAccount();

      if (result.error) {
        throw result.error;
      }

      if (
        !result.data.user ||
        result.data.user.is_anonymous !== true
      ) {
        throw new Error(
          "StudyQuest could not verify the new account."
        );
      }

      // AuthContext receives the new Supabase
      // session. The effect above will then
      // activate its account-specific storage.
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to create your account."
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleLegacySignOut() {
    if (
      isLoading ||
      isSigningOut ||
      user === null ||
      isAnonymousAccount
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Sign out of your previous account? " +
      "Make sure you can access it again."
    );

    if (!confirmed) {
      return;
    }

    setActionError(null);
    setIsSigningOut(true);

    try {
      if (!supabase) {
        throw new Error(
          "Supabase is not configured."
        );
      }

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to sign out."
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  // Wait until Supabase finishes checking
  // the browser's existing session.
  if (isLoading) {
    return (
      <main className="page-container">
        <p
          className="page-description"
          role="status"
        >
          Checking your StudyQuest account...
        </p>
      </main>
    );
  }

  // No session: account creation is available,
  if (user === null) {
    return (
      <main className="page-container">
        <section
          className="panel"
          style={{
            maxWidth: 540,
            margin: "60px auto",
            padding: 32,
          }}
        >
          <p className="panel-label">
            WELCOME TO STUDYQUEST
          </p>

          <h1 style={{
            color: "var(--text-primary)",
            margin: "8px 0 16px",
          }}>
            Create your account
          </h1>

          <p className="page-description">
            StudyQuest requires a private account
            to save your study progress.
          </p>

          <p
            className="page-description"
            style={{ fontSize: 12 }}
          >
            QR login and account recovery are not
            available yet. Until they are ready,
            losing this browser session may mean
            losing access to the account.
          </p>

          {actionError && (
            <p
              role="alert"
              style={{ color: "var(--danger)" }}
            >
              {actionError}
            </p>
          )}

          <button
            type="button"
            className="primary-button"
            disabled={isCreating}
            onClick={handleCreateAccount}
            style={{ marginTop: 20 }}
          >
            {isCreating
              ? "Creating Account..."
              : "Create Private Account"}
          </button>
        </section>
      </main>
    );
  }

  // Existing non-anonymous accounts are not
  // automatically replaced or signed out.
  if (!isAnonymousAccount) {
    return (
      <main className="page-container">
        <section
          className="panel"
          style={{
            maxWidth: 540,
            margin: "60px auto",
            padding: 32,
          }}
        >
          <h1 style={{
            color: "var(--text-primary)",
            marginTop: 0,
          }}>
            Previous account detected
          </h1>

          <p className="page-description">
            StudyQuest found an older account
            session. Sign out of that account
            before creating a new private account.
          </p>

          {actionError && (
            <p
              role="alert"
              style={{ color: "var(--danger)" }}
            >
              {actionError}
            </p>
          )}

          <button
            type="button"
            className="secondary-button"
            disabled={isSigningOut}
            onClick={handleLegacySignOut}
          >
            {isSigningOut
              ? "Signing Out..."
              : "Sign Out of Previous Account"}
          </button>
        </section>
      </main>
    );
  }

  // Never mount the study app when activating
  // the authenticated account's storage failed.
  if (
    activation?.userId === accountUserId &&
    activation.error !== null
  ) {
    return (
      <main className="page-container">
        <section
          className="panel"
          style={{
            maxWidth: 540,
            margin: "60px auto",
            padding: 32,
          }}
        >
          <h1 style={{
            color: "var(--text-primary)",
            marginTop: 0,
          }}>
            Storage unavailable
          </h1>

          <p
            className="page-description"
            role="alert"
          >
            {activation.error}
          </p>

          <p className="page-description">
            Your existing records have not been
            intentionally deleted.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() => window.location.reload()}
          >
            Reload StudyQuest
          </button>
        </section>
      </main>
    );
  }

  if (!isAccountReady) {
    return (
      <main className="page-container">
        <p
          className="page-description"
          role="status"
        >
          Loading private account data...
        </p>
      </main>
    );
  }

  // Mount study components only after the
  // authenticated account scope is active.
  return (
    <StorageModeContext.Provider
      value={{
        mode: "private",
        accountUserId,
        isSwitching: false,
        selectPrivateMode,
      }}
    >
      {children}
    </StorageModeContext.Provider>
  );
}
