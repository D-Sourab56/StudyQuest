
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing Supabase environment variables. Check .env.local."
  );
}

// =========================================
// ORIGINAL SUPABASE CLIENT
// =========================================

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);

// =========================================
// QR DEVICE TYPES
// =========================================

interface QrDevice {
  accountId: string;
  deviceId: string;
  deviceCredential: string;
  expiresAt: string;
}

interface QrAccessSession {
  authorized: boolean;
  accountId: string;
  deviceId: string;
  accessToken: string;
  expiresIn: number;
}

const QR_DEVICE_KEY =
  `studyquest:qr-device:v1:${supabaseUrl}`;

let cachedToken:
  | {
      value: string;
      accountId: string;
      expiresAt: number;
    }
  | null = null;

let pendingToken: Promise<string | null> | null = null;

// =========================================
// LOCAL QR DEVICE STORAGE
// =========================================

export function getSavedQrDevice(): QrDevice | null {
  try {
    const raw = localStorage.getItem(QR_DEVICE_KEY);

    if (!raw) return null;

    const value: unknown = JSON.parse(raw);

    if (!value || typeof value !== "object") {
      return null;
    }

    const device = value as Partial<QrDevice>;

    if (
      typeof device.accountId !== "string" ||
      typeof device.deviceId !== "string" ||
      typeof device.deviceCredential !== "string" ||
      !/^[a-f0-9]{64}$/.test(device.deviceCredential) ||
      typeof device.expiresAt !== "string"
    ) {
      return null;
    }

    return device as QrDevice;
  } catch {
    return null;
  }
}

export function clearQrDevice(): void {
  localStorage.removeItem(QR_DEVICE_KEY);
  cachedToken = null;
  pendingToken = null;
}

// =========================================
// QR BACKEND REQUESTS
// =========================================

async function callQrFunction<T>(
  body: Record<string, unknown>
): Promise<T> {
  const { data, error } =
    await supabase.functions.invoke<T>("qr-login", {
      body,
    });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Empty QR Login response.");
  }

  return data;
}

// =========================================
// DIRECT PERMANENT QR LOGIN
// =========================================

export async function loginWithAccountQr(
  qrPayload: string
): Promise<QrDevice> {
  if (!/^SQ1:[a-f0-9]{64}$/.test(qrPayload)) {
    throw new Error("Invalid StudyQuest QR code.");
  }

  const response = await callQrFunction<
    QrDevice & { authorized: boolean }
  >({
    action: "login",
    qrPayload,
    deviceLabel: "StudyQuest Browser",
  });

  if (
    response.authorized !== true ||
    !response.accountId ||
    !response.deviceId ||
    !/^[a-f0-9]{64}$/.test(
      response.deviceCredential
    ) ||
    !Number.isFinite(
      Date.parse(response.expiresAt)
    )
  ) {
    throw new Error("QR Login authorization failed.");
  }

  const device: QrDevice = {
    accountId: response.accountId,
    deviceId: response.deviceId,
    deviceCredential: response.deviceCredential,
    expiresAt: response.expiresAt,
  };

  clearQrDevice();

  localStorage.setItem(
    QR_DEVICE_KEY,
    JSON.stringify(device)
  );

  try {
    const token = await getQrAccessToken();

    if (!token) {
      throw new Error("QR access session unavailable.");
    }
  } catch (error) {
    clearQrDevice();
    throw error;
  }

  return device;
}

// =========================================
// SHORT-LIVED ACCESS TOKEN
// =========================================

export async function getQrAccessToken():
  Promise<string | null> {
  const device = getSavedQrDevice();

  if (!device) return null;

  if (
    cachedToken &&
    cachedToken.accountId === device.accountId &&
    cachedToken.expiresAt > Date.now() + 60_000
  ) {
    return cachedToken.value;
  }

  if (pendingToken) return pendingToken;

  const request = (async (): Promise<string | null> => {
    let current = device;

    // Renew a device credential before expiry.
    if (
      Date.parse(current.expiresAt) <
      Date.now() + 3 * 24 * 60 * 60 * 1000
    ) {
      const renewed = await callQrFunction<
        QrDevice & { authorized: boolean }
      >({
        action: "renew",
        deviceCredential: current.deviceCredential,
      });

      if (
        renewed.authorized !== true ||
        renewed.accountId !== current.accountId ||
        renewed.deviceId !== current.deviceId ||
        !/^[a-f0-9]{64}$/.test(
          renewed.deviceCredential
        )
      ) {
        throw new Error("QR device renewal failed.");
      }

      current = {
        accountId: renewed.accountId,
        deviceId: renewed.deviceId,
        deviceCredential: renewed.deviceCredential,
        expiresAt: renewed.expiresAt,
      };

      localStorage.setItem(
        QR_DEVICE_KEY,
        JSON.stringify(current)
      );
    }

    const session =
      await callQrFunction<QrAccessSession>({
        action: "session",
        deviceCredential: current.deviceCredential,
      });

    if (
      session.authorized !== true ||
      session.accountId !== current.accountId ||
      session.deviceId !== current.deviceId ||
      !session.accessToken ||
      !Number.isFinite(session.expiresIn) ||
      session.expiresIn <= 0
    ) {
      throw new Error("Invalid QR access session.");
    }

    cachedToken = {
      value: session.accessToken,
      accountId: current.accountId,
      expiresAt:
        Date.now() + session.expiresIn * 1000,
    };

    return cachedToken.value;
  })();

  pendingToken = request;

  try {
    return await request;
  } finally {
    if (pendingToken === request) {
      pendingToken = null;
    }
  }
}

// =========================================
// QR AUTHENTICATED SUPABASE CLIENT
// =========================================

export const qrSupabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    accessToken: async () => getQrAccessToken(),
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);
