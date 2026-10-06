import React from "react";

import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
} from "react-router";

import App from "./App";

import {
  StudyTimerProvider,
} from "./context/StudyTimerContext";

import "./index.css";

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