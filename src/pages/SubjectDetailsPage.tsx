
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  BookOpenText,
  CalendarDays,
  Clock3,
  Layers3,
  Waypoints,
  Zap,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router";

import {
  ROUTES,
  getSubjectSkillsRoute,
  getSubjectSummariesRoute,
} from "../data/appConfig";

import {
  storageService,
} from "../services/storageService";

import {
  getSubjectInitial,
} from "../utils/subject";

import {
  formatElapsedTime,
} from "../utils/time";

import {
  getSubjectXP,
} from "../utils/xp";

function SubjectDetailsPage() {
  // =========================================
  // SUBJECT NAME FROM URL
  // =========================================

  const { subjectName } = useParams<{
    subjectName: string;
  }>();

  const subjects = storageService.getSubjects();
  const sessions = storageService.getSessions();

  // =========================================
  // FIND SUBJECT BY NAME
  // =========================================

  const subject = subjects.find(
    (currentSubject) =>
      currentSubject.name.toLowerCase() ===
      subjectName?.toLowerCase()
  );

  // =========================================
  // SUBJECT NOT FOUND
  // =========================================

  if (!subject) {
    return (
      <div className="page-container">
        <section className="panel subject-not-found">
          <div className="empty-state-icon large">
            <BookOpen size={30} />
          </div>

          <h1>Subject not found</h1>

          <p>
            This subject may have been
            renamed, deleted, or is no
            longer available.
          </p>

          <Link
            to={ROUTES.study}
            className="primary-button"
          >
            <ArrowLeft size={17} />
            Back to Study
          </Link>
        </section>
      </div>
    );
  }

  // =========================================
  // SUBJECT SESSIONS
  // =========================================

  // We still use the subject UUID internally.

  const subjectSessions = sessions
    .filter(
      (session) =>
        session.subjectId === subject.id
    )
    .sort(
      (a, b) =>
        new Date(b.endedAt).getTime() -
        new Date(a.endedAt).getTime()
    );

  const totalStudyMs = subjectSessions.reduce(
    (total, session) =>
      total + session.durationMs,
    0
  );

  // =========================================
  // XP
  // =========================================

  const totalSubjectXp = getSubjectXP(
    subjectSessions
  );

  // =========================================
  // RECENT ACTIVITY
  // =========================================

  const recentSessions = subjectSessions.slice(
    0,
    5
  );

  const createdDate = new Date(
    subject.createdAt
  ).toLocaleDateString();

  return (
    <div className="page-container subject-page">

      {/* ========================================= */}
      {/* BACK TO STUDY */}
      {/* ========================================= */}

      <Link
        to={ROUTES.study}
        className="subject-back-link"
      >
        <ArrowLeft size={17} />
        Study
      </Link>

      {/* ========================================= */}
      {/* SUBJECT HERO */}
      {/* ========================================= */}

      <section className="panel subject-page-hero">
        <div className="subject-page-identity">
          <div className="subject-page-letter">
            {getSubjectInitial(subject.name)}
          </div>

          <div>
            <p className="page-eyebrow">
              SUBJECT
            </p>

            <h1>
              {subject.name}
            </h1>

            {subject.category && (
              <p className="subject-page-category">
                {subject.category}
              </p>
            )}
          </div>
        </div>

        <div className="subject-page-created">
          <CalendarDays size={16} />
          Created {createdDate}
        </div>
      </section>

      {/* ========================================= */}
      {/* STATISTICS */}
      {/* ========================================= */}

      <section className="subject-page-stats">

        {/* TOTAL STUDY TIME */}

        <article className="subject-stat-card">
          <div className="subject-stat-icon">
            <Clock3 size={20} />
          </div>

          <div>
            <span>
              Total Study Time
            </span>

            <strong>
              {formatElapsedTime(totalStudyMs)}
            </strong>
          </div>
        </article>

        {/* SESSIONS */}

        <article className="subject-stat-card">
          <div className="subject-stat-icon">
            <Layers3 size={20} />
          </div>

          <div>
            <span>
              Sessions
            </span>

            <strong>
              {subjectSessions.length}
            </strong>
          </div>
        </article>

        {/* PROGRESS */}

        <article className="subject-stat-card">
          <div className="subject-stat-icon">
            <BookOpen size={20} />
          </div>

          <div>
            <span>
              Progress
            </span>

            <strong>
              {subject.progress}%
            </strong>
          </div>
        </article>

        {/* XP EARNED */}

        <article className="subject-stat-card">
          <div className="subject-stat-icon">
            <Zap size={20} />
          </div>

          <div>
            <span>
              XP Earned
            </span>

            <strong>
              {totalSubjectXp} XP
            </strong>
          </div>
        </article>

      </section>

      {/* ========================================= */}
      {/* LEARNING PROGRESS */}
      {/* ========================================= */}

      <section className="panel subject-page-section">
        <div className="subject-page-section-header">
          <div>
            <p className="panel-label">
              LEARNING PROGRESS
            </p>

            <h2>
              Your progress
            </h2>
          </div>

          <strong className="subject-progress-number">
            {subject.progress}%
          </strong>
        </div>

        <div className="progress-track subject-page-progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${subject.progress}%`,
            }}
          />
        </div>

        <p className="subject-progress-help">
          Progress will later connect
          with completed skills in
          your Skill Tree.
        </p>
      </section>

      {/* ========================================= */}
      {/* RECENT STUDY SESSIONS */}
      {/* ========================================= */}

      <section className="panel subject-page-section">
        <div className="subject-page-section-header">
          <div>
            <p className="panel-label">
              ACTIVITY
            </p>

            <h2>
              Recent sessions
            </h2>
          </div>

          <span className="subject-session-count">
            {subjectSessions.length}

            {subjectSessions.length === 1
              ? " session"
              : " sessions"}
          </span>
        </div>

        {recentSessions.length === 0 ? (
          <div className="subject-page-empty">
            <Clock3 size={24} />

            <div>
              <strong>
                No sessions yet
              </strong>

              <p>
                Your study sessions for{" "}
                {subject.name} will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="subject-session-list">
            {recentSessions.map((session) => (
              <article
                key={session.id}
                className="subject-session-row"
              >
                <div>
                  <strong>
                    {new Date(
                      session.endedAt
                    ).toLocaleDateString()}
                  </strong>

                  <span>
                    {new Date(
                      session.startedAt
                    ).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                </div>

                <span className="subject-session-duration">
                  {formatElapsedTime(
                    session.durationMs
                  )}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ========================================= */}
      {/* SUBJECT RESOURCES */}
      {/* ========================================= */}

      <section className="subject-resource-grid">

        {/* STUDY SUMMARIES */}

        <Link
          to={getSubjectSummariesRoute(
            subject.name
          )}
          className="panel subject-resource-card"
        >
          <div className="subject-resource-card-top">
            <BookOpenText size={25} />
            <ArrowUpRight size={19} />
          </div>

          <p className="panel-label">
            LEARNING NOTES
          </p>

          <h2>
            Study summaries
          </h2>

          <p>
            Read, organize, and manage
            everything you've learned
            in {subject.name}.
          </p>
        </Link>

        {/* RELATED SKILLS */}

        <Link
          to={getSubjectSkillsRoute(
            subject.name
          )}
          className="panel subject-resource-card"
        >
          <div className="subject-resource-card-top">
            <Waypoints size={25} />
            <ArrowUpRight size={19} />
          </div>

          <p className="panel-label">
            SKILL DEVELOPMENT
          </p>

          <h2>
            Related skills
          </h2>

          <p>
            Explore your skills and
            learning milestones.
            Coming soon.
          </p>
        </Link>

      </section>

    </div>
  );
}

export default SubjectDetailsPage;
