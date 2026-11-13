
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { importJWK, SignJWT } from "npm:jose@6.1.0";

// =========================================
// HELPERS
// =========================================

function randomHex(length: number): string {
  const bytes = crypto.getRandomValues(
    new Uint8Array(length)
  );

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashSecret(secret: string): Promise<string> {
  const encoded = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function createVerificationCode(): string {
  const random = crypto.getRandomValues(new Uint32Array(1))[0];

  return String(random % 1_000_000).padStart(6, "0");
}

function jsonError(message: string, status: number) {
  return Response.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}


const ACCESS_TOKEN_LIFETIME = 15 * 60;

async function issueQrAccessToken(
  accountId: string,
  deviceId: string
): Promise<string> {
  const encoded = Deno.env.get(
    "QR_JWT_SIGNING_JWK_B64"
  );

  if (!encoded) {
    throw new Error("QR signing key unavailable.");
  }

  const jwk = JSON.parse(atob(encoded)) as {
    kty: string;
    kid: string;
    alg: string;
    d: string;
    crv?: string;
    x?: string;
    y?: string;
  };

  if (
    jwk.kty !== "EC" ||
    jwk.alg !== "ES256" ||
    !jwk.kid ||
    !jwk.d
  ) {
    throw new Error("Invalid QR signing key.");
  }


  const signingJwk = {
    kty: jwk.kty,
    crv: jwk.crv,
    x: jwk.x,
    y: jwk.y,
    d: jwk.d,
  };

  const privateKey = await importJWK(
    signingJwk,
    "ES256"
  );

  return new SignJWT({
    role: "authenticated",
    is_anonymous: true,
    device_id: deviceId,
    aal: "aal1",
  })
    .setProtectedHeader({
      alg: "ES256",
      kid: jwk.kid,
      typ: "JWT",
    })
    .setSubject(accountId)
    .setAudience("authenticated")
    .setIssuer("studyquest-qr")
    .setIssuedAt()
    .setExpirationTime(
      Math.floor(Date.now() / 1000) +
        ACCESS_TOKEN_LIFETIME
    )
    .sign(privateKey);
}


// =========================================
// QR LOGIN ENDPOINT
// =========================================

export default {
  fetch: withSupabase(
    { auth: ["user", "publishable"] },
    async (req, ctx) => {
      if (req.method !== "POST") {
        return jsonError("Method not allowed.", 405);
      }

      let body: unknown;

      try {
        body = await req.json();
      } catch {
        return jsonError("Invalid JSON request.", 400);
      }

      // =====================================
      // REGISTER PERMANENT ACCOUNT QR
      // =====================================

      if (
        typeof body === "object" &&
        body !== null &&
        "action" in body &&
        body.action === "register"
      ) {
        // Never trust a user ID sent by the browser.
        // Identity comes from the verified JWT.
        if (
          ctx.authMode !== "user" ||
          ctx.jwtClaims?.role !== "authenticated" ||
          ctx.jwtClaims?.is_anonymous !== true
        ) {
          return jsonError(
            "A signed-in Private Account is required.",
            401
          );
        }

        const userId = ctx.jwtClaims.sub;

        // Prevent accidental replacement of an
        // existing permanent QR credential.
        const { data: existing, error: lookupError } =
          await ctx.supabaseAdmin
            .from("qr_account_credentials")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle();

        if (lookupError) {
          return jsonError(
            "Could not check QR credential.",
            500
          );
        }

        if (existing) {
          return jsonError(
            "This account already has a QR credential.",
            409
          );
        }

        const secret = randomHex(32);
        const secretHash = await hashSecret(secret);

        const { error: insertError } =
          await ctx.supabaseAdmin
            .from("qr_account_credentials")
            .insert({
              user_id: userId,
              secret_hash: secretHash,
            });

        if (insertError) {
          if (insertError.code === "23505") {
            return jsonError(
              "This account already has a QR credential.",
              409
            );
          }

          console.error(
            "QR registration failed:",
            insertError.message
          );

          return jsonError(
            "Could not register QR credential.",
            500
          );
        }

        return Response.json(
          {
            created: true,
            qrPayload: `SQ1:${secret}`,
          },
          {
            status: 201,
            headers: {
              "Cache-Control": "no-store",
            },
          }
        );
      }

      // =====================================
      // DIRECT QR LOGIN - DEVICE CREDENTIAL
      // =====================================

      if (
        typeof body === "object" &&
        body !== null &&
        "action" in body &&
        body.action === "login"
      ) {
        const qrPayload =
          "qrPayload" in body &&
          typeof body.qrPayload === "string"
            ? body.qrPayload
            : "";

        if (!/^SQ1:[a-f0-9]{64}$/.test(qrPayload)) {
          return jsonError("Invalid QR credential.", 401);
        }

        const secretHash = await hashSecret(
          qrPayload.slice(4)
        );

        const { data: account, error: lookupError } =
          await ctx.supabaseAdmin
            .from("qr_account_credentials")
            .select("user_id")
            .eq("secret_hash", secretHash)
            .is("revoked_at", null)
            .maybeSingle();

        if (lookupError) {
          console.error(
            "QR lookup failed:",
            lookupError.message
          );
          return jsonError("QR login failed.", 500);
        }

        if (!account) {
          return jsonError("Invalid QR credential.", 401);
        }

        const rawLabel =
          "deviceLabel" in body &&
          typeof body.deviceLabel === "string"
            ? body.deviceLabel.trim().slice(0, 80)
            : "";

        const deviceCredential = randomHex(32);
        const credentialHash = await hashSecret(
          deviceCredential
        );

        const expiresAt = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString();

        const { data: device, error: insertError } =
          await ctx.supabaseAdmin
            .from("qr_device_credentials")
            .insert({
              user_id: account.user_id,
              device_label: rawLabel || "New device",
              credential_hash: credentialHash,
              expires_at: expiresAt,
            })
            .select("id, expires_at")
            .single();

        if (insertError || !device) {
          console.error(
            "QR device registration failed:",
            insertError?.message
          );
          return jsonError(
            "Could not register device.",
            500
          );
        }

        return Response.json(
          {
            authorized: true,
            accountId: account.user_id,
            deviceId: device.id,
            deviceCredential,
            expiresAt: device.expires_at,
          },
          {
            status: 201,
            headers: {
              "Cache-Control": "no-store",
            },
          }
        );
      }


      // =====================================
      // RENEW AUTHORIZED DEVICE CREDENTIAL
      // =====================================

      if (
        typeof body === "object" &&
        body !== null &&
        "action" in body &&
        body.action === "renew"
      ) {
        const oldCredential =
          "deviceCredential" in body &&
          typeof body.deviceCredential === "string"
            ? body.deviceCredential
            : "";

        if (!/^[a-f0-9]{64}$/.test(oldCredential)) {
          return jsonError("Invalid device credential.", 401);
        }

        const oldHash = await hashSecret(oldCredential);

        const newCredential = randomHex(32);
        const newHash = await hashSecret(newCredential);

        const now = new Date().toISOString();

        const newExpiresAt = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString();

        // Rotate the credential atomically.
        // An expired, revoked or already-rotated
        // credential cannot be reused.
        const { data, error } = await ctx.supabaseAdmin
          .from("qr_device_credentials")
          .update({
            credential_hash: newHash,
            expires_at: newExpiresAt,
            last_used_at: now,
          })
          .eq("credential_hash", oldHash)
          .gt("expires_at", now)
          .is("revoked_at", null)
          .select("id, user_id, expires_at")
          .maybeSingle();

        if (error) {
          console.error(
            "Device renewal failed:",
            error.message
          );
          return jsonError("Device renewal failed.", 500);
        }

        if (!data) {
          return jsonError(
            "Device credential expired or invalid.",
            401
          );
        }

        return Response.json(
          {
            authorized: true,
            accountId: data.user_id,
            deviceId: data.id,
            deviceCredential: newCredential,
            expiresAt: data.expires_at,
          },
          {
            headers: {
              "Cache-Control": "no-store",
            },
          }
        );
      }


      // =====================================
      // QR DEVICE ACCESS SESSION
      // =====================================

      if (
        typeof body === "object" &&
        body !== null &&
        "action" in body &&
        body.action === "session"
      ) {
        const credential =
          "deviceCredential" in body &&
          typeof body.deviceCredential === "string"
            ? body.deviceCredential
            : "";

        if (!/^[a-f0-9]{64}$/.test(credential)) {
          return jsonError(
            "Invalid device credential.",
            401
          );
        }

        const credentialHash = await hashSecret(
          credential
        );

        const now = new Date().toISOString();

        const { data: device, error } =
          await ctx.supabaseAdmin
            .from("qr_device_credentials")
            .select("id, user_id")
            .eq("credential_hash", credentialHash)
            .gt("expires_at", now)
            .is("revoked_at", null)
            .maybeSingle();

        if (error) {
          return jsonError(
            "Could not verify device.",
            500
          );
        }

        if (!device) {
          return jsonError(
            "Device credential expired or invalid.",
            401
          );
        }

        try {
          const accessToken =
            await issueQrAccessToken(
              device.user_id,
              device.id
            );

          return Response.json(
            {
              authorized: true,
              accountId: device.user_id,
              deviceId: device.id,
              accessToken,
              expiresIn: ACCESS_TOKEN_LIFETIME,
              tokenType: "Bearer",
            },
            {
              headers: {
                "Cache-Control": "no-store",
              },
            }
          );
        } catch (error) {
          console.error(
            "QR access token issuance failed:",
            error instanceof Error
              ? error.message
              : "Unknown error"
          );

          return jsonError(
            "Could not create access session.",
            500
          );
        }
      }





      if (
        typeof body !== "object" ||
        body === null ||
        !("action" in body) ||
        body.action !== "start"
      ) {
        return jsonError("Unsupported QR login action.", 400);
      }

      // =====================================
      // CREATE TEMPORARY LOGIN REQUEST
      // =====================================

      const label =
        "deviceLabel" in body &&
        typeof body.deviceLabel === "string"
          ? body.deviceLabel.trim().slice(0, 80)
          : "";

      const deviceLabel = label || "New device";

      const requestSecret = randomHex(32);
      const verifierHash = await hashSecret(requestSecret);
      const verificationCode = createVerificationCode();

      // Only the backend may insert into this table.
      const { data, error } = await ctx.supabaseAdmin
        .from("qr_login_requests")
        .insert({
          verifier_hash: verifierHash,
          verification_code: verificationCode,
          device_label: deviceLabel,
        })
        .select("id, verification_code, expires_at")
        .single();

      if (error || !data) {
        console.error("QR request creation failed:", error);
        return jsonError(
          "Could not create QR login request.",
          500
        );
      }

      return Response.json(
        {
          requestId: data.id,
          requestSecret,
          verificationCode: data.verification_code,
          expiresAt: data.expires_at,
          status: "pending",
        },
        {
          status: 201,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }
  ),
};
