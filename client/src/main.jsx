/**
 * @file main.jsx
 * @description React application entry point with all global providers.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import App from "./App";
import store from "./redux/store";
import queryClient from "./queryClient";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />

          {/* Global Toast Notifications */}
          <Toaster
            position="top-right"
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background:  "var(--surface)",
                color:       "var(--text)",
                border:      "1px solid var(--border)",
                borderRadius: "12px",
                padding:     "12px 16px",
                fontSize:    "0.875rem",
                fontWeight:  "500",
                boxShadow:   "0 8px 24px rgba(0,0,0,0.15)",
                fontFamily:  "Inter, sans-serif",
              },
              success: {
                iconTheme: { primary: "#22c55e", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#fff" },
              },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
