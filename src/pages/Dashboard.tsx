import {
  ArrowRight,
  BookOpen,
  Clock3,
  Flame,
  Target,
  Zap,
} from "lucide-react";

import {
  Link,
} from "react-router";

import {
  ROUTES,
} from "../data/appConfig";

function Dashboard() {
  return (
    <div className="page-container">
      {/* ============================== */}
      {/* PAGE HEADER */}
      {/* ============================== */}

      <header className="page-header">
        <div>
          <p className="page-eyebrow">
            OVERVIEW
          </p>

          <h1>
            Welcome back.
          </h1>

          <p className="page-description">
            Every study session moves your quest forward.
          </p>
        </div>
      </header>

      {/* ============================== */}
      {/* STATISTICS */}
      {/* ============================== */}

      <section className="stats-grid">
        {/* Today's Study */}
        <article className="stat-card">
          <div className="stat-icon">
            <Clock3 size={20} />
          </div>

          <div>
            <p className="stat-label">
              Today
            </p>

            <h2>
              0 min
            </h2>

            <p className="stat-helper">
              No study yet
            </p>
          </div>
        </article>

        {/* Weekly Goal */}
        <article className="stat-card">
          <div className="stat-icon">
            <Target size={20} />
          </div>

          <div className="stat-card-content">
            <p className="stat-label">
              Weekly Goal
            </p>

            <h2>
              0 / 10h
            </h2>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: "0%",
                }}
              />
            </div>
          </div>
        </article>

        {/* Level */}
        <article className="stat-card">
          <div className="stat-icon">
            <Zap size={20} />
          </div>

          <div className="stat-card-content">
            <p className="stat-label">
              Level 1
            </p>

            <h2>
              0 XP
            </h2>

            <p className="stat-helper">
              100 XP to next level
            </p>
          </div>
        </article>

        {/* Streak */}
        <article className="stat-card">
          <div className="stat-icon">
            <Flame size={20} />
          </div>

          <div>
            <p className="stat-label">
              Study Streak
            </p>

            <h2>
              0 days
            </h2>

            <p className="stat-helper">
              Start your streak today
            </p>
          </div>
        </article>
      </section>

      {/* ============================== */}
      {/* DASHBOARD CONTENT */}
      {/* ============================== */}

      <section className="dashboard-grid">
        {/* First Quest */}
        <article className="panel welcome-panel">
          <div className="welcome-icon">
            <BookOpen size={27} />
          </div>

          <div className="welcome-content">
            <span className="quest-label">
              YOUR FIRST QUEST
            </span>

            <h2>
              Start building your learning journey.
            </h2>

            <p>
              Create a subject, start studying,
              and StudyQuest will turn your effort
              into visible progress.
            </p>

            <Link
              to={ROUTES.study}
              className="primary-button"
            >
              Start studying

              <ArrowRight size={18} />
            </Link>
          </div>
        </article>

        {/* Weekly Activity */}
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="panel-label">
                THIS WEEK
              </p>

              <h2>
                Study Activity
              </h2>
            </div>
          </div>

          <div className="empty-state compact">
            <div className="empty-state-icon">
              <Clock3 size={24} />
            </div>

            <h3>
              No activity yet
            </h3>

            <p>
              Your weekly study activity will
              appear here after your first
              session.
            </p>
          </div>
        </article>

        {/* Recent Sessions */}
        <article className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-label">
                RECENT
              </p>

              <h2>
                Study Sessions
              </h2>
            </div>
          </div>

          <div className="empty-state compact">
            <div className="empty-state-icon">
              <BookOpen size={24} />
            </div>

            <h3>
              No sessions yet
            </h3>

            <p>
              Complete your first study session
              and it will appear here.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}

export default Dashboard;