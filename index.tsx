// index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Wait until the Office host (Word) is ready before mounting React
Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Could not find root element to mount to");
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    console.warn("This add-in is designed for Microsoft Word only.");
  }
});
