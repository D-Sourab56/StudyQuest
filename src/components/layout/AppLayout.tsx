
import {
  BookOpenCheck,
  Sparkles,
} from "lucide-react";

import {
  NavLink,
  Outlet,
  useLocation,
} from "react-router";

import CompactStudyTimer from "../study/CompactStudyTimer";

import {
  APP_NAME,
  APP_TAGLINE,
  NAVIGATION_ITEMS,
  ROUTES,
} from "../../data/appConfig";

function AppLayout() {
  const location = useLocation();

  // =========================================
  // ACTIVE NAVIGATION
  // =========================================

  // Subject details, summaries, and skills
  // all belong to the Study section.

  const isSubjectPage =
    location.pathname.startsWith("/subjects/");

  function isNavigationActive(
    path: string,
    isActive: boolean
  ): boolean {
    if (
      path === ROUTES.study &&
      isSubjectPage
    ) {
      return true;
    }

    return isActive;
  }

  return (
    <div className="app-shell">
      {/* ================================= */}
      {/* DESKTOP SIDEBAR */}
      {/* ================================= */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <BookOpenCheck size={24} />
          </div>

          <div>
            <div className="brand-name">
              {APP_NAME}
            </div>

            <div className="brand-subtitle">
              {APP_TAGLINE}
            </div>
          </div>
        </div>

        {/* NAVIGATION */}

        <nav className="sidebar-navigation">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={
                  item.path ===
                  ROUTES.dashboard
                }
                className={({ isActive }) =>
                  `navigation-link ${
                    isNavigationActive(
                      item.path,
                      isActive
                    )
                      ? "active"
                      : ""
                  }`
                }
              >
                <Icon size={20} />

                <span>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* SIDEBAR MESSAGE */}

        <div className="sidebar-message">
          <Sparkles size={20} />

          <div>
            <strong>
              Keep progressing
            </strong>

            <p>
              Small study sessions
              become real skills.
            </p>
          </div>
        </div>
      </aside>

      {/* ================================= */}
      {/* MOBILE HEADER */}
      {/* ================================= */}

      <div className="mobile-header">
        <div className="brand-icon">
          <BookOpenCheck size={21} />
        </div>

        <span>
          {APP_NAME}
        </span>
      </div>

      {/* ================================= */}
      {/* MAIN PAGE */}
      {/* ================================= */}

      <main className="app-main">
        <Outlet />
      </main>

      {/* ================================= */}
      {/* GLOBAL ACTIVE TIMER */}
      {/* ================================= */}

      <CompactStudyTimer />

      {/* ================================= */}
      {/* MOBILE NAVIGATION */}
      {/* ================================= */}

      <nav className="mobile-navigation">
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={
                item.path ===
                ROUTES.dashboard
              }
              className={({ isActive }) =>
                `mobile-navigation-link ${
                  isNavigationActive(
                    item.path,
                    isActive
                  )
                    ? "active"
                    : ""
                }`
              }
            >
              <Icon size={20} />

              <span>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default AppLayout;
