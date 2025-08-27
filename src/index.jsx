import "./i18n";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles.css"; // ✅ this ensures global styles like dark transitions apply

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the service worker for basic offline support (public/sw.js)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => {
        // Optional: log in dev for debugging
        if (import.meta.env.DEV) {
          console.debug("Service worker registration failed:", err);
        }
      });
  });
}
