
import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter } from "react-router";

import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { StudyTimerProvider } from "./context/StudyTimerContext";

import { StorageScopeGate } from "./components/StorageScopeGate";

import { settingsService } from "./services/settingsService";

import "./index.css";

// =========================================
// INITIAL SETTINGS
// =========================================

const initialSettings = settingsService.getSettings();

document.documentElement.dataset.theme =
  initialSettings.theme;

document.documentElement.style.colorScheme =
  initialSettings.theme;

// =========================================
// APPLICATION ROOT
// =========================================

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StorageScopeGate>
          <StudyTimerProvider>
            <App />
          </StudyTimerProvider>
        </StorageScopeGate>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
