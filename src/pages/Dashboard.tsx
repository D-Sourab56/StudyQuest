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

import {
  storageService,
} from "../services/storageService";

import {
  getLevelInfo,
  getTotalXP,
} from "../utils/xp";

function Dashboard() {
  const sessions =
    storageService.getSessions();

  const totalXp =
    getTotalXP(
      sessions
    );

  const levelInfo =
    getLevelInfo(
      totalXp
    );

  return (
    <div className="page-container">
      {/* HEADER */}

      <header className="page-header">
        <div>
          <p className="page-eyebrow">
            OVERVIEW
          </p>

          <h1>
            Welcome back.
          </h1>

          <p className="page-description">
            Every study session moves
            your quest forward.
          </p>
        </div>
      </header>

      {/* STATS */}

      <section className="stats-grid">
        {/* TODAY */}

        <article className="stat-card">
          <div className="stat-icon">
            <Clock3
              size={20}
            />
          </div>

          <div>
            <p className="stat-label">
              Today
            </p>

            <h2>
              0 min
            </h2>

            <p className="stat-helper">
              Daily statistics
              coming next
            </p>
          </div>
        </article>

        {/* WEEKLY GOAL */}

        <article className="stat-card">
          <div className="stat-icon">
            <Target
              size={20}
            />
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
                  width:
                    "0%",
                }}
              />
            </div>
          </div>
        </article>

        {/* XP / LEVEL */}

        <article className="stat-card">
          <div className="stat-icon">
            <Zap
              size={20}
            />
          </div>

          <div className="stat-card-content">
            <p className="stat-label">
              Level{" "}
              {
                levelInfo.level
              }
            </p>

            <h2>
              {totalXp} XP
            </h2>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width:
                    `${levelInfo.progressPercent}%`,
                }}
              />
            </div>

            <p className="stat-helper">
              {
                levelInfo.xpToNextLevel
              }{" "}
              XP to next level
            </p>
          </div>
        </article>

        {/* STREAK */}

        <article className="stat-card">
          <div className="stat-icon">
            <Flame
              size={20}
            />
          </div>

          <div>
            <p className="stat-label">
              Study Streak
            </p>

            <h2>
              0 days
            </h2>

            <p className="stat-helper">
              Streak system
              coming later
            </p>
          </div>
        </article>
      </section>

      {/* DASHBOARD */}

      <section className="dashboard-grid">
        <article className="panel welcome-panel">
          <div className="welcome-icon">
            <BookOpen
              size={27}
            />
          </div>

          <div className="welcome-content">
            <span className="quest-label">
              YOUR QUEST
            </span>

            <h2>
              Keep building your
              learning journey.
            </h2>

            <p>
              Study consistently,
              earn XP, level up,
              and turn learning
              into visible progress.
            </p>

            <Link
              to={
                ROUTES.study
              }
              className="primary-button"
            >
              Start studying

              <ArrowRight
                size={18}
              />
            </Link>
          </div>
        </article>

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
              <Clock3
                size={24}
              />
            </div>

            <h3>
              Statistics coming
              soon
            </h3>

            <p>
              Your weekly study
              activity will appear
              here in a later step.
            </p>
          </div>
        </article>

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
              <BookOpen
                size={24}
              />
            </div>

            <h3>
              History coming
              soon
            </h3>

            <p>
              Your saved sessions
              will soon appear here.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}

export default Dashboard;