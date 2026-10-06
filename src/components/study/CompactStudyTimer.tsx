import {
  CirclePause,
  Play,
  Square,
} from "lucide-react";

import {
  useLocation,
} from "react-router";

import {
  useStudyTimer,
} from "../../context/StudyTimerContext";

import {
  ROUTES,
} from "../../data/appConfig";

import {
  formatElapsedTime,
} from "../../utils/time";

function CompactStudyTimer() {
  const location =
    useLocation();

  const {
    activeTimer,

    activeSubject,

    elapsedMs,

    isStudyWorkspaceOpen,

    pauseTimer,

    resumeTimer,

    finishTimer,
  } = useStudyTimer();

  // No active session.
  if (
    !activeTimer ||
    !activeSubject
  ) {
    return null;
  }

  const isStudyPage =
    location.pathname ===
    ROUTES.study;

  // The Study page already displays
  // the large timer when no workspace
  // is open.
  if (
    isStudyPage &&
    !isStudyWorkspaceOpen
  ) {
    return null;
  }

  return (
    <aside className="compact-study-timer">
      <div className="compact-timer-subject">
        <div className="compact-timer-icon">
          {activeSubject.icon}
        </div>

        <div>
          <span>
            {activeSubject.name}
          </span>

          <strong>
            {formatElapsedTime(
              elapsedMs
            )}
          </strong>
        </div>
      </div>

      <div className="compact-timer-actions">
        {activeTimer.status ===
        "running" ? (
          <button
            type="button"
            className="compact-timer-button"
            onClick={
              pauseTimer
            }
            title="Pause"
            aria-label="Pause study session"
          >
            <CirclePause
              size={18}
            />
          </button>
        ) : (
          <button
            type="button"
            className="compact-timer-button resume"
            onClick={
              resumeTimer
            }
            title="Resume"
            aria-label="Resume study session"
          >
            <Play
              size={18}
            />
          </button>
        )}

        <button
          type="button"
          className="compact-timer-button finish"
          onClick={
            finishTimer
          }
          title="Finish"
          aria-label="Finish study session"
        >
          <Square
            size={16}
          />
        </button>
      </div>
    </aside>
  );
}

export default CompactStudyTimer;