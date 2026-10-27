import React from "react";

import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
} from "react-router";

import App from "./App";

import {
  StudyTimerProvider,
} from "./context/StudyTimerContext";

import {
  settingsService,
} from "./services/settingsService";

import "./index.css";

// Apply the saved appearance before the app is painted.
const initialSettings = settingsService.getSettings();

document.documentElement.dataset.theme =
  initialSettings.theme;

document.documentElement.style.colorScheme =
  initialSettings.theme;

ReactDOM.createRoot(
  document.getElementById(
    "root"
  )!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <StudyTimerProvider>
        <App />
      </StudyTimerProvider>
    </BrowserRouter>
  </React.StrictMode>
);
