/**
 * @file socket.js
 * @description Socket.IO client singleton with auto-reconnect and event management.
 */

import { io } from "socket.io-client";

let socket = null;

/**
 * Connect to Socket.IO server.
 * @param {string} token - JWT access token
 * @returns {object} Socket instance
 */
export const connectSocket = (token) => {
  if (!token) return null;

  // If already connected with the same token, return existing socket
  if (socket?.connected && socket.auth?.token === token) {
    return socket;
  }

  // If switching accounts or token changed, cleanly disconnect previous socket
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
    socket.emit("join_chat_rooms");
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.warn("⚠️ Socket disconnected:", reason);
  });

  return socket;
};

/**
 * Disconnect and destroy the socket instance.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Get the current socket instance.
 * @returns {object|null}
 */
export const getSocket = () => socket;

export default { connectSocket, disconnectSocket, getSocket };
