
import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import AppLayout from "./components/layout/AppLayout";

import {
  ROUTES,
} from "./data/appConfig";

import Achievements from "./pages/Achievements";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Settings from "./pages/Settings";
import SkillTree from "./pages/SkillTree";
import Study from "./pages/Study";

import SubjectDetailsPage from "./pages/SubjectDetailsPage";
import SubjectSummariesPage from "./pages/SubjectSummariesPage";
import SubjectSkillsPage from "./pages/SubjectSkillsPage";

function App() {
  return (
    <Routes>
      {/* ========================================= */}
      {/* SHARED APP LAYOUT */}
      {/* ========================================= */}

      <Route element={<AppLayout />}>

        {/* DASHBOARD */}

        <Route
          path={ROUTES.dashboard}
          element={<Dashboard />}
        />

        {/* STUDY */}

        <Route
          path={ROUTES.study}
          element={<Study />}
        />

        {/* SUBJECT DETAILS */}

        <Route
          path={ROUTES.subjectDetails}
          element={<SubjectDetailsPage />}
        />

        {/* SUBJECT SUMMARIES */}

        <Route
          path={ROUTES.subjectSummaries}
          element={<SubjectSummariesPage />}
        />

        {/* SUBJECT SKILLS */}

        <Route
          path={ROUTES.subjectSkills}
          element={<SubjectSkillsPage />}
        />

        {/* SKILL TREE */}

        <Route
          path={ROUTES.skills}
          element={<SkillTree />}
        />

        {/* HISTORY */}

        <Route
          path={ROUTES.history}
          element={<History />}
        />

        {/* ACHIEVEMENTS */}

        <Route
          path={ROUTES.achievements}
          element={<Achievements />}
        />

        {/* SETTINGS */}

        <Route
          path={ROUTES.settings}
          element={<Settings />}
        />

        {/* UNKNOWN ROUTES */}

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
