import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import AppLayout from "./components/layout/AppLayout";

import Achievements from "./pages/Achievements";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Settings from "./pages/Settings";
import SkillTree from "./pages/SkillTree";
import Study from "./pages/Study";

import {
  ROUTES,
} from "./data/appConfig";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Dashboard */}
        <Route
          path={ROUTES.dashboard}
          element={<Dashboard />}
        />

        {/* Study */}
        <Route
          path={ROUTES.study}
          element={<Study />}
        />

        {/* Skill Tree */}
        <Route
          path={ROUTES.skills}
          element={<SkillTree />}
        />

        {/* History */}
        <Route
          path={ROUTES.history}
          element={<History />}
        />

        {/* Achievements */}
        <Route
          path={ROUTES.achievements}
          element={<Achievements />}
        />

        {/* Settings */}
        <Route
          path={ROUTES.settings}
          element={<Settings />}
        />

        {/* Invalid URL */}
        <Route
          path="*"
          element={
            <Navigate
              to={ROUTES.dashboard}
              replace
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;