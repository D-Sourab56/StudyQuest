import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter } from "react-router";

import App from "./App";

import { AuthProvider } from "./context/AuthContext";

import { StudyTimerProvider } from "./context/StudyTimerContext";

import { StorageScopeGate } from "./components/StorageScopeGate";

import { SettingsInitializer } from "./components/SettingsInitializer";

import "./index.css";

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
          <SettingsInitializer>
            <StudyTimerProvider>
              <App />
            </StudyTimerProvider>
          </SettingsInitializer>
        </StorageScopeGate>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);