/**
 * @file notificationSlice.js
 * @description Redux slice for notification state.
 */
import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    items:       [],
    unreadCount: 0,
    hasMore:     true,
    page:        1,
  },
  reducers: {
    setNotifications:    (state, action) => { state.items = action.payload; },
    prependNotification: (state, action) => { state.items.unshift(action.payload); state.unreadCount += 1; },
    markAsRead:          (state, action) => {
      const notif = state.items.find((n) => n._id === action.payload);
      if (notif && !notif.isRead) { notif.isRead = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
    },
    markAllAsRead: (state) => {
      state.items.forEach((n) => { n.isRead = true; });
      state.unreadCount = 0;
    },
    setUnreadCount: (state, action) => { state.unreadCount = action.payload; },
    removeNotification: (state, action) => {
      state.items = state.items.filter((n) => n._id !== action.payload);
    },
  },
});

export const {
  setNotifications, prependNotification, markAsRead, markAllAsRead,
  setUnreadCount, removeNotification,
} = notificationSlice.actions;

export default notificationSlice.reducer;
