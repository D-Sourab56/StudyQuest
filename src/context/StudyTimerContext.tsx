import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  storageService,
} from "../services/storageService";

import type {
  StudySession,
} from "../types/session";

import type {
  StudySubject,
} from "../types/subject";

import type {
  ActiveStudyTimer,
} from "../types/timer";

import {
  getElapsedMilliseconds,
} from "../utils/time";

interface StudyTimerContextValue {
  activeTimer: ActiveStudyTimer | null;

  activeSubject:
    StudySubject | undefined;

  elapsedMs: number;

  completedSession:
    StudySession | null;

  isStudyWorkspaceOpen: boolean;

  setStudyWorkspaceOpen: (
    isOpen: boolean
  ) => void;

  startTimer: (
    subjectId: string
  ) => void;

  pauseTimer: () => void;

  resumeTimer: () => void;

  finishTimer: () => void;
}

const StudyTimerContext =
  createContext<
    StudyTimerContextValue | undefined
  >(undefined);

interface StudyTimerProviderProps {
  children: React.ReactNode;
}

export function StudyTimerProvider({
  children,
}: StudyTimerProviderProps) {
  // =========================================
  // ACTIVE TIMER
  // =========================================

  const [
    activeTimer,
    setActiveTimer,
  ] =
    useState<ActiveStudyTimer | null>(
      () =>
        storageService.getActiveTimer()
    );

  // =========================================
  // ELAPSED TIME
  // =========================================

  const [
    elapsedMs,
    setElapsedMs,
  ] = useState(() =>
    activeTimer
      ? getElapsedMilliseconds(
          activeTimer
        )
      : 0
  );

  // =========================================
  // LAST COMPLETED SESSION
  // =========================================

  const [
    completedSession,
    setCompletedSession,
  ] =
    useState<StudySession | null>(
      null
    );

  // =========================================
  // STUDY PAGE WORKSPACE
  // =========================================

  const [
    isStudyWorkspaceOpen,
    setStudyWorkspaceOpen,
  ] = useState(false);

  // =========================================
  // ACTIVE SUBJECT
  // =========================================

  const activeSubject =
    activeTimer
      ? storageService
          .getSubjects()
          .find(
            (subject) =>
              subject.id ===
              activeTimer.subjectId
          )
      : undefined;

  // =========================================
  // HANDLE DELETED / INVALID SUBJECT
  // =========================================

  useEffect(() => {
    if (
      activeTimer &&
      !activeSubject
    ) {
      storageService.clearActiveTimer();

      setActiveTimer(null);

      setElapsedMs(0);
    }
  }, [
    activeTimer,
    activeSubject,
  ]);

  // =========================================
  // UPDATE DISPLAY TIME
  // =========================================

  useEffect(() => {
    if (!activeTimer) {
      setElapsedMs(0);

      return;
    }

    const timer =
      activeTimer;

    function updateTime() {
      setElapsedMs(
        getElapsedMilliseconds(
          timer
        )
      );
    }

    updateTime();

    if (
      timer.status ===
      "paused"
    ) {
      return;
    }

    const intervalId =
      window.setInterval(
        updateTime,
        500
      );

    return () => {
      window.clearInterval(
        intervalId
      );
    };
  }, [activeTimer]);

  // =========================================
  // START
  // =========================================

  function startTimer(
    subjectId: string
  ) {
    if (!subjectId) {
      return;
    }

    const timer:
      ActiveStudyTimer = {
        subjectId,

        startedAt:
          new Date().toISOString(),

        status: "running",

        totalPausedMs: 0,
      };

    storageService.saveActiveTimer(
      timer
    );

    setActiveTimer(
      timer
    );

    setElapsedMs(
      0
    );

    setCompletedSession(
      null
    );
  }

  // =========================================
  // PAUSE
  // =========================================

  function pauseTimer() {
    if (
      !activeTimer ||
      activeTimer.status !==
        "running"
    ) {
      return;
    }

    const timer:
      ActiveStudyTimer = {
        ...activeTimer,

        status: "paused",

        pausedAt:
          new Date().toISOString(),
      };

    storageService.saveActiveTimer(
      timer
    );

    setActiveTimer(
      timer
    );
  }

  // =========================================
  // RESUME
  // =========================================

  function resumeTimer() {
    if (
      !activeTimer ||
      activeTimer.status !==
        "paused" ||
      !activeTimer.pausedAt
    ) {
      return;
    }

    const currentTime =
      Date.now();

    const pausedAt =
      new Date(
        activeTimer.pausedAt
      ).getTime();

    const extraPausedTime =
      Number.isNaN(pausedAt)
        ? 0
        : Math.max(
            0,
            currentTime -
              pausedAt
          );

    const timer:
      ActiveStudyTimer = {
        ...activeTimer,

        status: "running",

        totalPausedMs:
          activeTimer.totalPausedMs +
          extraPausedTime,

        pausedAt: undefined,
      };

    storageService.saveActiveTimer(
      timer
    );

    setActiveTimer(
      timer
    );
  }

  // =========================================
  // FINISH + SAVE SESSION
  // =========================================

  function finishTimer() {
    if (!activeTimer) {
      return;
    }

    const finishedAt =
      Date.now();

    const durationMs =
      getElapsedMilliseconds(
        activeTimer,
        finishedAt
      );

    const session:
      StudySession = {
        id: crypto.randomUUID(),

        subjectId:
          activeTimer.subjectId,

        startedAt:
          activeTimer.startedAt,

        endedAt:
          new Date(
            finishedAt
          ).toISOString(),

        durationMs,

        createdAt:
          new Date().toISOString(),
      };

    storageService.addSession(
      session
    );

    storageService.clearActiveTimer();

    setCompletedSession(
      session
    );

    setActiveTimer(
      null
    );

    setElapsedMs(
      0
    );
  }

  return (
    <StudyTimerContext.Provider
      value={{
        activeTimer,

        activeSubject,

        elapsedMs,

        completedSession,

        isStudyWorkspaceOpen,

        setStudyWorkspaceOpen,

        startTimer,

        pauseTimer,

        resumeTimer,

        finishTimer,
      }}
    >
      {children}
    </StudyTimerContext.Provider>
  );
}

export function useStudyTimer() {
  const context =
    useContext(
      StudyTimerContext
    );

  if (!context) {
    throw new Error(
      "useStudyTimer must be used inside StudyTimerProvider."
    );
  }

  return context;
}