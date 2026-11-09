
import {
  storageService,
} from "./storageService";

import {
  settingsService,
} from "./settingsService";

import {
  achievementStorageService,
} from "./achievementStorageService";

import {
  summaryRecoveryService,
} from "./summaryRecoveryService";

import {
  summaryDraftService,
} from "./summaryDraftService";

import {
  setAccountSessionNotesScope,
} from "../context/StudyTimerContext";

// =========================================
// TYPES
// =========================================

export type StorageScope = {
  type: "account";
  userId: string;
};

// =========================================
// CURRENT SCOPE
// =========================================

let currentScope: StorageScope | null = null;

// =========================================
// VALIDATION
// =========================================

function validateUserId(
  userId: string
): string {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(userId)) {
    throw new Error(
      "Invalid StudyQuest account ID."
    );
  }

  return userId.toLowerCase();
}

// =========================================
// ACTIVATE ACCOUNT SCOPE
// =========================================

function activateAccount(
  userId: string
): void {
  const validatedId =
    validateUserId(userId);

  storageService.useAccountStorage(validatedId);

  settingsService.useAccountSettings(validatedId);

  achievementStorageService.useAccountAchievements(
    validatedId
  );

  summaryRecoveryService.useAccountRecovery(
    validatedId
  );

  summaryDraftService.useAccountDrafts(
    validatedId
  );

  setAccountSessionNotesScope(validatedId);

  currentScope = {
    type: "account",
    userId: validatedId,
  };
}

// =========================================
// READ CURRENT SCOPE
// =========================================

function getCurrentScope(): StorageScope | null {
  return currentScope
    ? { ...currentScope }
    : null;
}

// =========================================
// EXPORT SERVICE
// =========================================

export const storageScopeService = {
  activateAccount,
  getCurrentScope,
};
