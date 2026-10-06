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

function App() {
  return (
    <Routes>
      <Route
        element={
          <AppLayout />
        }
      >
        <Route
          path={
            ROUTES.dashboard
          }
          element={
            <Dashboard />
          }
        />

        <Route
          path={
            ROUTES.study
          }
          element={
            <Study />
          }
        />

        <Route
          path={
            ROUTES.subjectDetails
          }
          element={
            <SubjectDetailsPage />
          }
        />

        <Route
          path={
            ROUTES.skills
          }
          element={
            <SkillTree />
          }
        />

        <Route
          path={
            ROUTES.history
          }
          element={
            <History />
          }
        />

        <Route
          path={
            ROUTES.achievements
          }
          element={
            <Achievements />
          }
        />

        <Route
          path={
            ROUTES.settings
          }
          element={
            <Settings />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to={
                ROUTES.dashboard
              }
              replace
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;