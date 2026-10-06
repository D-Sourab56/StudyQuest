import {
  CheckCircle2,
  CirclePause,
  Clock3,
  Play,
  Square,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  storageService,
} from "../../services/storageService";

import type {
  StudySubject,
} from "../../types/subject";

import type {
  ActiveStudyTimer,
  CompletedTimerPreview,
} from "../../types/timer";

import {
  formatElapsedTime,
  getElapsedMilliseconds,
} from "../../utils/time";

interface StudyTimerProps {
  subjects: StudySubject[];
}

function StudyTimer({
  subjects,
}: StudyTimerProps) {
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
  // SUBJECT SELECTION
  // =========================================

  const [
    selectedSubjectId,
    setSelectedSubjectId,
  ] = useState(
    () =>
      activeTimer?.subjectId ??
      subjects[0]?.id ??
      ""
  );

  // =========================================
  // DISPLAYED TIME
  // =========================================

  const [
    elapsedMs,
    setElapsedMs,
  ] = useState(
    () =>
      activeTimer
        ? getElapsedMilliseconds(
            activeTimer
          )
        : 0
  );

  // =========================================
  // FINISHED TIMER PREVIEW
  // =========================================

  const [
    completedTimer,
    setCompletedTimer,
  ] =
    useState<CompletedTimerPreview | null>(
      null
    );

  const activeSubject =
    activeTimer
      ? subjects.find(
          (subject) =>
            subject.id ===
            activeTimer.subjectId
        )
      : undefined;

  const completedSubject =
    completedTimer
      ? subjects.find(
          (subject) =>
            subject.id ===
            completedTimer.subjectId
        )
      : undefined;

  // =========================================
  // KEEP SUBJECT SELECTION VALID
  // =========================================

  useEffect(() => {
    if (activeTimer) {
      return;
    }

    const selectedStillExists =
      subjects.some(
        (subject) =>
          subject.id ===
          selectedSubjectId
      );

    if (!selectedStillExists) {
      setSelectedSubjectId(
        subjects[0]?.id ?? ""
      );
    }
  }, [
    subjects,
    selectedSubjectId,
    activeTimer,
  ]);

  // =========================================
  // HANDLE BROKEN / DELETED TIMER SUBJECT
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
  // UPDATE TIMER DISPLAY
  // =========================================

  useEffect(() => {
    if (!activeTimer) {
      setElapsedMs(0);

      return;
    }

    // activeTimer has already been checked,
    // so this local variable is guaranteed
    // to be an ActiveStudyTimer.
    const timer =
      activeTimer;

    function updateDisplayedTime() {
      setElapsedMs(
        getElapsedMilliseconds(
          timer
        )
      );
    }

    updateDisplayedTime();

    if (
      timer.status ===
      "paused"
    ) {
      return;
    }

    const intervalId =
      window.setInterval(
        updateDisplayedTime,
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

  function handleStart() {
    if (!selectedSubjectId) {
      return;
    }

    const newTimer: ActiveStudyTimer = {
      subjectId:
        selectedSubjectId,

      startedAt:
        new Date().toISOString(),

      status: "running",

      totalPausedMs: 0,
    };

    storageService.saveActiveTimer(
      newTimer
    );

    setActiveTimer(
      newTimer
    );

    setCompletedTimer(
      null
    );

    setElapsedMs(
      0
    );
  }

  // =========================================
  // PAUSE
  // =========================================

  function handlePause() {
    if (
      !activeTimer ||
      activeTimer.status !==
        "running"
    ) {
      return;
    }

    const pausedTimer: ActiveStudyTimer = {
      ...activeTimer,

      status: "paused",

      pausedAt:
        new Date().toISOString(),
    };

    storageService.saveActiveTimer(
      pausedTimer
    );

    setActiveTimer(
      pausedTimer
    );
  }

  // =========================================
  // RESUME
  // =========================================

  function handleResume() {
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

    const additionalPausedTime =
      Number.isNaN(pausedAt)
        ? 0
        : Math.max(
            0,
            currentTime -
              pausedAt
          );

    const resumedTimer: ActiveStudyTimer = {
      ...activeTimer,

      status: "running",

      totalPausedMs:
        activeTimer.totalPausedMs +
        additionalPausedTime,

      pausedAt: undefined,
    };

    storageService.saveActiveTimer(
      resumedTimer
    );

    setActiveTimer(
      resumedTimer
    );
  }

  // =========================================
  // FINISH
  // =========================================

  function handleFinish() {
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

    const finishedTimer:
      CompletedTimerPreview = {
        subjectId:
          activeTimer.subjectId,

        startedAt:
          activeTimer.startedAt,

        endedAt:
          new Date(
            finishedAt
          ).toISOString(),

        durationMs,
      };

    storageService.clearActiveTimer();

    setCompletedTimer(
      finishedTimer
    );

    setSelectedSubjectId(
      activeTimer.subjectId
    );

    setActiveTimer(
      null
    );

    setElapsedMs(
      0
    );
  }

  return (
    <section className="panel study-timer-panel">
      {/* ================================= */}
      {/* ACTIVE SESSION */}
      {/* ================================= */}

      {activeTimer &&
        activeSubject && (
          <div className="active-timer">
            <div className="timer-top-row">
              <div className="timer-subject-info">
                <div className="timer-subject-icon">
                  {activeSubject.icon}
                </div>

                <div>
                  <p className="panel-label">
                    FOCUS SESSION
                  </p>

                  <h2>
                    {activeSubject.name}
                  </h2>

                  {activeSubject.category && (
                    <p className="timer-subject-category">
                      {
                        activeSubject.category
                      }
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`timer-status ${
                  activeTimer.status
                }`}
              >
                <span />

                {activeTimer.status ===
                "running"
                  ? "Studying"
                  : "Paused"}
              </div>
            </div>

            <div className="timer-display-area">
              <Clock3 size={24} />

              <div className="timer-display">
                {formatElapsedTime(
                  elapsedMs
                )}
              </div>
            </div>

            <div className="timer-controls">
              {activeTimer.status ===
              "running" ? (
                <button
                  type="button"
                  className="secondary-button timer-control-button"
                  onClick={
                    handlePause
                  }
                >
                  <CirclePause
                    size={18}
                  />

                  Pause
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-button timer-control-button"
                  onClick={
                    handleResume
                  }
                >
                  <Play
                    size={18}
                  />

                  Resume
                </button>
              )}

              <button
                type="button"
                className="finish-session-button"
                onClick={
                  handleFinish
                }
              >
                <Square
                  size={17}
                />

                Finish
              </button>
            </div>
          </div>
        )}

      {/* ================================= */}
      {/* READY TO START */}
      {/* ================================= */}

      {!activeTimer && (
        <div className="timer-start-area">
          <div>
            <p className="panel-label">
              FOCUS SESSION
            </p>

            <h2>
              Ready to study?
            </h2>

            <p className="timer-description">
              Choose a subject and start
              tracking your focused study
              time.
            </p>
          </div>

          <div className="timer-start-controls">
            <div className="form-group timer-subject-select">
              <label htmlFor="timer-subject">
                Subject
              </label>

              <select
                id="timer-subject"
                value={
                  selectedSubjectId
                }
                onChange={(
                  event
                ) =>
                  setSelectedSubjectId(
                    event.target
                      .value
                  )
                }
              >
                {subjects.map(
                  (subject) => (
                    <option
                      key={
                        subject.id
                      }
                      value={
                        subject.id
                      }
                    >
                      {
                        subject.icon
                      }{" "}
                      {
                        subject.name
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <button
              type="button"
              className="primary-button start-session-button"
              onClick={
                handleStart
              }
              disabled={
                !selectedSubjectId
              }
            >
              <Play size={18} />

              Start session
            </button>
          </div>
        </div>
      )}

      {/* ================================= */}
      {/* FINISHED PREVIEW */}
      {/* ================================= */}

      {!activeTimer &&
        completedTimer &&
        completedSubject && (
          <div className="timer-complete-preview">
            <div className="timer-complete-icon">
              <CheckCircle2
                size={22}
              />
            </div>

            <div>
              <p>
                Session finished
              </p>

              <strong>
                {
                  completedSubject.name
                }
                {" · "}
                {formatElapsedTime(
                  completedTimer.durationMs
                )}
              </strong>

              <span>
                Session saving and XP
                will be added in Step 5.
              </span>
            </div>
          </div>
        )}
    </section>
  );
}

export default StudyTimer;