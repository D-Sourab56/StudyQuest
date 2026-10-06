import {
  BookOpenCheck,
  Sparkles,
} from "lucide-react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router";

import {
  useEffect,
  useRef,
} from "react";

import {
  APP_NAME,
  APP_TAGLINE,
  NAVIGATION_ITEMS,
  ROUTES,
} from "../../data/appConfig";

function AppLayout() {
  const navigate = useNavigate();

  // =========================================
  // RETURN TO DASHBOARD AFTER REFRESH
  // =========================================

  const hasCheckedRefresh = useRef(false);

  useEffect(() => {
    // Only check the refresh once after the app loads.
    // Without this guard, React Router navigation could
    // keep sending the user back to Dashboard.
    if (hasCheckedRefresh.current) {
      return;
    }

    hasCheckedRefresh.current = true;

    const navigationEntry =
      performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming | undefined;

    const wasPageRefreshed =
      navigationEntry?.type === "reload";

    if (wasPageRefreshed) {
      navigate(
        ROUTES.dashboard,
        {
          replace: true,
        }
      );
    }
  }, [navigate]);

  return (
    <div className="app-shell">
      {/* ============================== */}
      {/* DESKTOP SIDEBAR */}
      {/* ============================== */}

      <aside className="sidebar">
        {/* Brand */}
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

        {/* Navigation */}
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
                    isActive
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

        {/* Bottom Message */}
        <div className="sidebar-message">
          <Sparkles size={20} />

          <div>
            <strong>
              Keep progressing
            </strong>

            <p>
              Small study sessions become
              real skills.
            </p>
          </div>
        </div>
      </aside>

      {/* ============================== */}
      {/* MOBILE HEADER */}
      {/* ============================== */}

      <div className="mobile-header">
        <div className="brand-icon">
          <BookOpenCheck size={21} />
        </div>

        <span>
          {APP_NAME}
        </span>
      </div>

      {/* ============================== */}
      {/* PAGE CONTENT */}
      {/* ============================== */}

      <main className="app-main">
        <Outlet />
      </main>

      {/* ============================== */}
      {/* MOBILE NAVIGATION */}
      {/* ============================== */}

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
                  isActive
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