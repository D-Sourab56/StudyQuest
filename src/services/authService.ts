
import { supabase } from "../lib/supabase";

// =========================================
// CREATE OR REUSE PRIVATE ACCOUNT
// =========================================

export async function createPrivateAccount() {
  const { data, error } =
    await supabase.auth.getSession();

  if (error) {
    return {
      data: {
        user: null,
        session: null,
      },
      error,
    };
  }

  // Reuse only an existing anonymous account.
  if (data.session?.user.is_anonymous === true) {
    return {
      data: {
        user: data.session.user,
        session: data.session,
      },
      error: null,
    };
  }

  // Do not replace an existing non-anonymous
  // session without an explicit migration flow.
  if (data.session) {
    throw new Error(
      "An unsupported account session is active. " +
      "Please resolve it before creating a private account."
    );
  }

  // Create a new anonymous Supabase identity.
  return supabase.auth.signInAnonymously();
}

// =========================================
// GET CURRENT ACCOUNT
// =========================================

async function getCurrentAccount() {
  return supabase.auth.getUser();
}

// =========================================
// EXPORT SERVICE
// =========================================

export const authService = {
  createPrivateAccount,
  getCurrentAccount,
};
