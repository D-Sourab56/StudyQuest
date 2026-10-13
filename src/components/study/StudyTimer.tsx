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
  useStudyTimer,
} from "../../context/StudyTimerContext";

import type {
  StudySubject,
} from "../../types/subject";

import {
  getSubjectInitial,
} from "../../utils/subject";

import {
  formatElapsedTime,
} from "../../utils/time";

import StudySummaryForm from "./StudySummaryForm";
import SubjectSelect from "./SubjectSelect";

import {
  summaryRecoveryService,
} from "../../services/summaryRecoveryService";

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

    const selectedExists =
      subjects.some(
        (subject) =>
          subject.id ===
          selectedSubjectId
      );

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
      ? subjects.find(
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
              <Clock3
                size={24}
              />

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
            <div className="timer-subject-select">
              <label>
                Subject
              </label>

              <SubjectSelect
                subjects={
                  subjects
                }
                value={
                  selectedSubjectId
                }
                onChange={
                  setSelectedSubjectId
                }
              />
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
              <Play
                size={18}
              />

              Start session
            </button>
          </div>
        </div>
      )}

      {/* ================================= */}
      {/* COMPLETED SESSION */}
      {/* ================================= */}

      {!activeTimer &&
        completedSession &&
        completedSubject && (
          <>
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

                  {" · +"}

                  {
                    completedSession.xpEarned
                  }

                  {" XP"}
                </strong>

                <span>
                  Your study session has
                  been saved successfully.
                </span>
              </div>
            </div>

            {/* ================================= */}
            {/* STUDY SUMMARY */}
            {/* ================================= */}

            <StudySummaryForm
              key={completedSession.id}
              session={completedSession}
              subjectName={completedSubject.name}
              onSaved={() => {
                summaryRecoveryService.clearPendingSession(
                  completedSession.id
                );
              }}
            />
          </>
        )}
    </section>
  );
}

export default StudyTimer;