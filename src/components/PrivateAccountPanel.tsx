
import { useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useStorageMode } from "../context/StorageModeContext";

import { supabase } from "../lib/supabase";
import { createPrivateAccount } from "../services/authService";

import { SubjectSyncStatus } from "./SubjectSyncStatus";

// =========================================
// PRIVATE ACCOUNT PANEL
// =========================================

export function PrivateAccountPanel() {
  const {
    user,
    isAnonymousAccount,
    isLoading,
  } = useAuth();

  const {
    mode,
    isSwitching,
    selectPrivateMode,
  } = useStorageMode();

  // =========================================
  // STATE
  // =========================================

  const [isCreating, setIsCreating] =
    useState(false);

  const [isSigningOut, setIsSigningOut] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [notice, setNotice] =
    useState<string | null>(null);

  // =========================================
  // ACCOUNT STATUS
  // =========================================

  const isBusy =
    isLoading ||
    isSwitching ||
    isCreating ||
    isSigningOut;

  const hasPrivateSession =
    user !== null && isAnonymousAccount;

  const hasLegacySession =
    user !== null && !isAnonymousAccount;

  const isPrivateMode =
    hasPrivateSession && mode === "private";

  // =========================================
  // CREATE PRIVATE ACCOUNT
  // =========================================

  async function handleCreateAccount() {
    if (isBusy || user !== null) {
      return;
    }

    setIsCreating(true);
    setError(null);
    setNotice(null);

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
          "Could not verify the new private account."
        );
      }

      setNotice(
        "Private account created successfully."
      );
    } catch (err) {
      console.error(
        "Private account creation failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create an account."
      );
    } finally {
      setIsCreating(false);
    }
  }

  // =========================================
  // ACTIVATE PRIVATE ACCOUNT
  // =========================================

  function handleActivateAccount() {
    if (isBusy || !hasPrivateSession) {
      return;
    }

    setError(null);
    setNotice(null);

    const accepted = selectPrivateMode();

    if (!accepted) {
      setError(
        "Unable to activate your private account."
      );
    }
  }

  // =========================================
  // LEGACY ACCOUNT SIGN OUT
  // =========================================

  async function handleLegacySignOut() {
    if (isBusy || !hasLegacySession) {
      return;
    }

    const confirmed = window.confirm(
      "Sign out of the previous account? " +
      "Make sure you can access it again."
    );

    if (!confirmed) {
      return;
    }

    setIsSigningOut(true);
    setError(null);
    setNotice(null);

    try {
      if (!supabase) {
        throw new Error(
          "Supabase is not configured."
        );
      }

      const { error: signOutError } =
        await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      setNotice(
        "Previous account signed out successfully."
      );
    } catch (err) {
      console.error(
        "Account sign out failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign out."
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  // =========================================
  // RENDER
  // =========================================

  return (
    <section
      className="panel"
      aria-labelledby="private-account-title"
      style={{ padding: 28 }}
    >
      {/* HEADING */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <LockKeyhole
          size={23}
          color="var(--accent-dark)"
          aria-hidden="true"
        />

        <div>
          <p className="panel-label">
            ACCOUNT
          </p>

          <h2
            id="private-account-title"
            style={{
              margin: 0,
              color: "var(--text-primary)",
              fontSize: 21,
            }}
          >
            StudyQuest Account
          </h2>
        </div>
      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <p
          role="alert"
          style={{
            color: "var(--danger)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertTriangle
            size={17}
            aria-hidden="true"
          />

          {error}
        </p>
      )}

      {/* SUCCESS MESSAGE */}

      {notice && (
        <p
          role="status"
          style={{
            color: "var(--accent-dark)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CheckCircle2
            size={17}
            aria-hidden="true"
          />

          {notice}
        </p>
      )}

      {/* ACCOUNT CONTENT */}

      {isLoading ? (
        <p className="page-description">
          Checking your account...
        </p>
      ) : isPrivateMode ? (
        <>
          {/* ACTIVE ACCOUNT */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 18,
              color: "var(--accent-dark)",
            }}
          >
            <CheckCircle2
              size={20}
              aria-hidden="true"
            />

            <strong>
              Private Account Active
            </strong>
          </div>

          <p className="page-description">
            Your StudyQuest account is active
            in this browser.
          </p>

          {/* CLOUD SYNCHRONIZATION */}

          <div style={{ marginTop: 22 }}>
            <SubjectSyncStatus />
          </div>

          {/* RECOVERY INFORMATION */}

          <p
            className="page-description"
            style={{
              marginTop: 20,
              fontSize: 12,
            }}
          >
            Full cloud synchronization and QR
            account recovery are not available
            yet. Keep your browser session
            until account recovery is implemented.
          </p>
        </>
      ) : hasPrivateSession ? (
        <>
          {/* ACCOUNT ACTIVATION */}

          <p className="page-description">
            Your private account session was
            found. Activate it to use your
            account-specific study data.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={handleActivateAccount}
            disabled={isBusy}
          >
            {isSwitching ? (
              <Loader2
                size={17}
                aria-hidden="true"
              />
            ) : (
              <LockKeyhole
                size={17}
                aria-hidden="true"
              />
            )}

            Use Private Account
          </button>
        </>
      ) : hasLegacySession ? (
        <>
          {/* PREVIOUS ACCOUNT */}

          <p className="page-description">
            An older account session was found.
            Sign out of that session before
            creating a new StudyQuest account.
          </p>

          <button
            type="button"
            className="secondary-button"
            onClick={handleLegacySignOut}
            disabled={isBusy}
          >
            {isSigningOut
              ? "Signing Out..."
              : "Sign Out of Previous Account"}
          </button>
        </>
      ) : (
        <>
          {/* ACCOUNT CREATION */}

          <p className="page-description">
            Create your personal StudyQuest
            account to start using private,
            account-specific storage.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={handleCreateAccount}
            disabled={isBusy}
          >
            {isCreating ? (
              <Loader2
                size={17}
                aria-hidden="true"
              />
            ) : (
              <LockKeyhole
                size={17}
                aria-hidden="true"
              />
            )}

            {isCreating
              ? "Creating Account..."
              : "Create Private Account"}
          </button>
        </>
      )}

      {/* ACCOUNT SECURITY INFORMATION */}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 9,
          marginTop: 24,
          color: "var(--text-secondary)",
        }}
      >
        <ShieldCheck
          size={17}
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        />

        <p
          style={{
            margin: 0,
            fontSize: 12,
            lineHeight: 1.7,
          }}
        >
          Your account is authenticated using
          Supabase. Secure cross-device QR
          login will be added in a later step.
        </p>
      </div>
    </section>
  );
}
