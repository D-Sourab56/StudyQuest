
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { ReactNode } from "react";

import { BrowserQRCodeReader } from "@zxing/browser";

import { useAuth } from "../context/AuthContext";

import {
  StorageModeContext,
} from "../context/StorageModeContext";

import { createPrivateAccount } from "../services/authService";
import { storageScopeService } from "../services/storageScopeService";
import { settingsService } from "../services/settingsService";
import {
  restoreAccountSubjects,
} from "../services/subjectRestoreService";

import {
  supabase,
  loginWithAccountQr,
} from "../lib/supabase";

// =========================================
// CONSTANTS
// =========================================

const STORAGE_PREFERENCE_KEY =
  "studyquest:storage-preference:v1";

// =========================================
// TYPES
// =========================================

interface StorageScopeGateProps {
  children: ReactNode;
}

interface ActivationState {
  userId: string;
  error: string | null;
}

// =========================================
// STORAGE SCOPE GATE
// =========================================

export function StorageScopeGate({
  children,
}: StorageScopeGateProps) {
  // =========================================
  // AUTHENTICATION
  // =========================================

  const {
    user,
    isLoading,
    isAnonymousAccount,
    isQrAccount,
    accountUserId: authenticatedAccountId,
    qrAuthError,
  } = useAuth();

  // =========================================
  // STATE
  // =========================================

  const [activation, setActivation] =
    useState<ActivationState | null>(null);

  const [isCreating, setIsCreating] =
    useState(false);

  const [isSigningOut, setIsSigningOut] =
    useState(false);

  const [actionError, setActionError] =
    useState<string | null>(null);

  // =========================================
  // QR SCANNER STATE
  // =========================================

  const [isQrScannerOpen, setIsQrScannerOpen] =
    useState(false);

  const [isQrSigningIn, setIsQrSigningIn] =
    useState(false);

  const qrVideoRef =
    useRef<HTMLVideoElement>(null);

  const qrScanLocked = useRef(false);

  // =========================================
  // CURRENT ACCOUNT ID
  // =========================================

  const accountUserId =
    !isLoading
      ? authenticatedAccountId
      : null;

  // =========================================
  // ACTIVATE ACCOUNT STORAGE
  // =========================================

  useEffect(() => {
    if (accountUserId === null) {
      return;
    }

    let cancelled = false;

    let restoreTimedOut = false;

    let restoreTimeout: number | null = null;

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

      // Preserve the existing storage preference.
      try {
        localStorage.setItem(
          STORAGE_PREFERENCE_KEY,
          accountUserId
        );
      } catch {
        // Optional preference storage.
      }

      // Restore cloud subjects only in the
      // isolated QR testing environment.
      if (import.meta.env.MODE !== "qr") {
        reportResult(null);
      } else {
        // Never block local-first StudyQuest
        // indefinitely because of a network issue.
        restoreTimeout = window.setTimeout(() => {
          restoreTimedOut = true;

          console.warn(
            "Cloud subject restoration timed out. " +
            "Continuing with local subjects."
          );

          reportResult(null);
        }, 8000);

        void restoreAccountSubjects(
          accountUserId,
          () => cancelled || restoreTimedOut
        )
          .catch((error: unknown) => {
            if (!cancelled && !restoreTimedOut) {
              console.warn(
                "Could not restore cloud subjects. " +
                "Existing local data was preserved.",
                error
              );
            }
          })
          .finally(() => {
            if (restoreTimeout !== null) {
              window.clearTimeout(restoreTimeout);
            }

            if (!restoreTimedOut) {
              reportResult(null);
            }
          });
      }
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

      if (restoreTimeout !== null) {
        window.clearTimeout(restoreTimeout);
      }
    };
  }, [accountUserId]);

  // =========================================
  // ACCOUNT READINESS
  // =========================================

  const isAccountReady =
    accountUserId !== null &&
    activation?.userId === accountUserId &&
    activation.error === null;

  // Existing compatibility method.
  // Account activation is automatic.
  const selectPrivateMode = useCallback(
    () => isAccountReady,
    [isAccountReady]
  );

  // =========================================
  // CREATE PRIVATE ACCOUNT
  // =========================================

  async function handleCreateAccount() {
    if (
      isLoading ||
      isCreating ||
      isQrSigningIn ||
      user !== null ||
      isQrAccount
    ) {
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
      // session and activates its storage.
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

  // =========================================
  // LEGACY ACCOUNT SIGN OUT
  // =========================================

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

  // =========================================
  // DIRECT QR LOGIN SCANNER
  // =========================================

  useEffect(() => {
    if (
      !isQrScannerOpen ||
      !qrVideoRef.current
    ) {
      return;
    }

    let cancelled = false;

    let scannerControls:
      | { stop: () => void }
      | null = null;

    const reader = new BrowserQRCodeReader();

    async function startScanner() {
      try {
        const videoElement = qrVideoRef.current;

        if (!videoElement) {
          return;
        }

        const controls =
          await reader.decodeFromVideoDevice(
            undefined,
            videoElement,
            (result, _error, controls) => {
              if (
                !result ||
                cancelled ||
                qrScanLocked.current
              ) {
                return;
              }

              const qrPayload =
                result.getText().trim();

              // Accept only StudyQuest QR codes.
              if (
                !/^SQ1:[a-f0-9]{64}$/.test(
                  qrPayload
                )
              ) {
                setActionError(
                  "This is not a valid StudyQuest account QR code."
                );
                return;
              }

              // Prevent duplicate login requests.
              qrScanLocked.current = true;

              controls.stop();

              setActionError(null);
              setIsQrSigningIn(true);

              void loginWithAccountQr(qrPayload)
                  .then((device) => {
                    if (cancelled) {
                      return;
                    }

                    // Save the verified permanent QR credential
                    // for display on this authorized device.
                    try {
                      const storageKey =
                        `studyquest:account-qr:v1:${device.accountId}`;

                      localStorage.setItem(
                        storageKey,
                        qrPayload
                      );
                    } catch (storageError) {
                      console.warn(
                        "QR login succeeded, but the QR code " +
                        "could not be saved on this device.",
                        storageError
                      );
                    }

                    window.location.reload();
                  })
                .catch((error: unknown) => {
                  if (cancelled) {
                    return;
                  }

                  setActionError(
                    error instanceof Error
                      ? error.message
                      : "QR Login failed."
                  );

                  setIsQrSigningIn(false);
                  setIsQrScannerOpen(false);
                  qrScanLocked.current = false;
                });
            }
          );

        if (cancelled) {
          controls.stop();
        } else {
          scannerControls = controls;
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setActionError(
          error instanceof Error
            ? error.message
            : "Unable to access the camera."
        );

        setIsQrScannerOpen(false);
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      scannerControls?.stop();
    };
  }, [isQrScannerOpen]);

  // =========================================
  // LOADING SCREEN
  // =========================================

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

  // =========================================
  // NO ACCOUNT — CREATE OR SCAN QR
  // =========================================

  if (user === null && !isQrAccount) {
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
          {/* PAGE HEADING */}

          <p className="panel-label">
            WELCOME TO STUDYQUEST
          </p>

          <h1
            style={{
              color: "var(--text-primary)",
              margin: "8px 0 16px",
            }}
          >
            Welcome to StudyQuest
          </h1>

          <p className="page-description">
            Create a new private account or
            access your existing account using
            its permanent QR code.
          </p>

          {/* ACCOUNT CREATION */}

          <div style={{ marginTop: 24 }}>
            <h2
              style={{
                fontSize: 19,
                color: "var(--text-primary)",
              }}
            >
              New to StudyQuest?
            </h2>

            <p className="page-description">
              Create a private account to start
              tracking your study progress.
            </p>

            <button
              type="button"
              className="primary-button"
              disabled={
                isCreating ||
                isQrSigningIn
              }
              onClick={handleCreateAccount}
              style={{ marginTop: 12 }}
            >
              {isCreating
                ? "Creating Account..."
                : "Create Private Account"}
            </button>
          </div>

          {/* ========================================= */}
          {/* PERMANENT QR LOGIN */}
          {/* ========================================= */}

          <div
            style={{
              marginTop: 28,
              paddingTop: 24,
              borderTop:
                "1px solid var(--border-color, rgba(128,128,128,0.2))",
            }}
          >
            <h2
              style={{
                fontSize: 19,
                color: "var(--text-primary)",
              }}
            >
              Already have an account?
            </h2>

            <p className="page-description">
              Scan your permanent StudyQuest QR
              code to access your existing account.
            </p>

            {/* SCANNER TOGGLE */}

            <button
              type="button"
              className="secondary-button"
              disabled={
                isQrSigningIn ||
                isCreating
              }
              onClick={() => {
                if (isQrScannerOpen) {
                  setIsQrScannerOpen(false);
                } else {
                  qrScanLocked.current = false;
                  setActionError(null);
                  setIsQrScannerOpen(true);
                }
              }}
              style={{ marginTop: 12 }}
            >
              {isQrSigningIn
                ? "Signing In..."
                : isQrScannerOpen
                  ? "Close Scanner"
                  : "Scan QR Code"}
            </button>

            {/* CAMERA SCANNER */}

            {isQrScannerOpen && (
              <div style={{ marginTop: 20 }}>
                <video
                  ref={qrVideoRef}
                  autoPlay
                  muted
                  playsInline
                  aria-label="QR code camera scanner"
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: 360,
                    margin: "0 auto",
                    borderRadius: 14,
                    background: "#111",
                  }}
                />

                <p
                  className="page-description"
                  style={{
                    textAlign: "center",
                    fontSize: 12,
                    marginTop: 12,
                  }}
                >
                  Point your camera at your
                  StudyQuest account QR code.
                </p>
              </div>
            )}

            {/* SIGNING IN MESSAGE */}

            {isQrSigningIn && (
              <p
                className="page-description"
                role="status"
                style={{ marginTop: 16 }}
              >
                Verifying your QR code and
                opening your account...
              </p>
            )}
          </div>

          {/* ERROR MESSAGE */}

          {(actionError || qrAuthError) && (
            <p
              role="alert"
              style={{
                color: "var(--danger)",
                marginTop: 20,
              }}
            >
              {actionError || qrAuthError}
            </p>
          )}

          {/* SECURITY NOTICE */}

          <p
            className="page-description"
            style={{
              fontSize: 12,
              marginTop: 24,
            }}
          >
            Your permanent QR code is a login
            credential. Keep it private because
            anyone with a copy may access
            your account.
          </p>
        </section>
      </main>
    );
  }

  // =========================================
  // LEGACY NON-ANONYMOUS ACCOUNT
  // =========================================

  if (!isAnonymousAccount && !isQrAccount) {
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
          <h1
            style={{
              color: "var(--text-primary)",
              marginTop: 0,
            }}
          >
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
              style={{
                color: "var(--danger)",
              }}
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

  // =========================================
  // STORAGE ACTIVATION ERROR
  // =========================================

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
          <h1
            style={{
              color: "var(--text-primary)",
              marginTop: 0,
            }}
          >
            Storage unavailable
          </h1>

          <p
            className="page-description"
            role="alert"
          >
            {activation.error}
          </p>

          <p className="page-description">
            Your existing records have not
            been intentionally deleted.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              window.location.reload()
            }
          >
            Reload StudyQuest
          </button>
        </section>
      </main>
    );
  }

  // =========================================
  // WAIT FOR ACCOUNT STORAGE
  // =========================================

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

  // =========================================
  // ACTIVATE STUDYQUEST
  // =========================================

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
