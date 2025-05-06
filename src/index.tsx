// React 18 以降推奨の書き方
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App"; // ✅ OK

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container not found");
}
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
