import {
  CheckCircle2,
  CirclePause,
  Clock3,
  Play,
  Square,
} from "lucide-react";

import {
  getSubjectInitial,
} from "../../utils/subject";

import {
  useEffect,
  useState,
} from "react";

import {
  useStudyTimer,
} from "../../context/StudyTimerContext";

import {
  storageService,
} from "../../services/storageService";

import type {
  StudySubject,
} from "../../types/subject";

import {
  formatElapsedTime,
} from "../../utils/time";

interface StudyTimerProps {
  subjects: StudySubject[];
}

function StudyTimer({
  subjects,
}: StudyTimerProps) {
  const {
    activeTimer,

    activeSubject,

    elapsedMs,

    completedSession,

    startTimer,

    pauseTimer,

    resumeTimer,

    finishTimer,
  } = useStudyTimer();

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
  // KEEP SUBJECT SELECTION VALID
  // =========================================

  useEffect(() => {
    // While a timer is active, the selector
    // should stay connected to that subject.
    if (activeTimer) {
      if (
        selectedSubjectId !==
        activeTimer.subjectId
      ) {
        setSelectedSubjectId(
          activeTimer.subjectId
        );
      }

      return;
    }

    // When there is no active timer,
    // allow the user to freely select
    // Java, SQL, or any other subject.
    const selectedExists =
      subjects.some(
        (subject) =>
          subject.id ===
          selectedSubjectId
      );

    // If the selected subject was deleted,
    // fall back to the first available subject.
    if (!selectedExists) {
      setSelectedSubjectId(
        subjects[0]?.id ?? ""
      );
    }
  }, [
    subjects,
    activeTimer,
    selectedSubjectId,
  ]);

  // =========================================
  // COMPLETED SESSION SUBJECT
  // =========================================

  const completedSubject =
    completedSession
      ? storageService
          .getSubjects()
          .find(
            (subject) =>
              subject.id ===
              completedSession.subjectId
          )
      : undefined;

  return (
    <section className="panel study-timer-panel">
      {/* ================================= */}
      {/* ACTIVE TIMER */}
      {/* ================================= */}

      {activeTimer &&
        activeSubject && (
          <div className="active-timer">
            <div className="timer-top-row">
              <div className="timer-subject-info">
                <div className="timer-subject-icon subject-letter-icon">
                      {getSubjectInitial(
                        activeSubject.name
                      )}
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
                    pauseTimer
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
                    resumeTimer
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
                  finishTimer
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
                    event.target.value
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
                      {subject.icon}{" "}
                      {subject.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <button
              type="button"
              className="primary-button start-session-button"
              disabled={
                !selectedSubjectId
              }
              onClick={() =>
                startTimer(
                  selectedSubjectId
                )
              }
            >
              <Play size={18} />

              Start session
            </button>
          </div>
        </div>
      )}

      {/* ================================= */}
      {/* SESSION SAVED */}
      {/* ================================= */}

      {!activeTimer &&
        completedSession &&
        completedSubject && (
          <div className="timer-complete-preview">
            <div className="timer-complete-icon">
              <CheckCircle2
                size={22}
              />
            </div>

            <div>
              <p>
                Session saved
              </p>

              <strong>
                {
                  completedSubject.name
                }
                {" · "}
                {formatElapsedTime(
                  completedSession.durationMs
                )}
              </strong>

              <span>
                Your study session has
                been saved successfully.
              </span>
            </div>
          </div>
        )}
    </section>
  );
}

export default StudyTimer;