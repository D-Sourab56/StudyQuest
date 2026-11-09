
import {
  BookOpenCheck,
  Sparkles,
} from "lucide-react";

import {
  NavLink,
  Outlet,
} from "react-router";

import CompactStudyTimer from "../study/CompactStudyTimer";

import {
  APP_NAME,
  APP_TAGLINE,
  NAVIGATION_ITEMS,
  ROUTES,
} from "../../data/appConfig";

interface NavigationLinksProps {
  mobile?: boolean;
}

function NavigationLinks({
  mobile = false,
}: NavigationLinksProps) {
  const className = mobile
    ? "mobile-navigation-link"
    : "navigation-link";

  return (
    <>
      {NAVIGATION_ITEMS.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === ROUTES.dashboard}
            className={({ isActive }) =>
              `${className}${isActive ? " active" : ""}`
            }
          >
            <Icon size={20} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </>
  );
}

function AppLayout() {
  return (
    <div className="app-shell">
      {/* Desktop sidebar */}
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

        <nav
          className="sidebar-navigation"
          aria-label="Main navigation"
        >
          <NavigationLinks />
        </nav>

        <div className="sidebar-message">
          <Sparkles size={20} />

          <div>
            <strong>Keep progressing</strong>
            <p>
              Small study sessions become real skills.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="mobile-header">
        <div className="brand-icon">
          <BookOpenCheck size={21} />
        </div>

        <span>{APP_NAME}</span>
      </header>

      {/* Main content */}
      <main className="app-main">
        <Outlet />
      </main>

      {/* Global study timer */}
      <CompactStudyTimer />

      {/* Mobile navigation */}
      <nav
        className="mobile-navigation"
        aria-label="Mobile navigation"
      >
        <NavigationLinks mobile />
      </nav>
    </div>
  );
}

export default AppLayout;
