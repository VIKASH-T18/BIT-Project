/**
 * @file store.js
 * @description Redux Toolkit store configuration with all slices and RTK Query.
 */

import { configureStore } from "@reduxjs/toolkit";
import authReducer         from "./slices/authSlice";
import uiReducer           from "./slices/uiSlice";
import chatReducer         from "./slices/chatSlice";
import notificationReducer from "./slices/notificationSlice";
import allocationReducer   from "./slices/allocationSlice";

const store = configureStore({
  reducer: {
    auth:          authReducer,
    ui:            uiReducer,
    chat:          chatReducer,
    notifications: notificationReducer,
    allocation:    allocationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in these paths
        ignoredActions: ["auth/setCredentials"],
        ignoredPaths:   ["auth.user.lastLoginAt"],
      },
    }),
  devTools: import.meta.env.DEV,
});

export default store;
