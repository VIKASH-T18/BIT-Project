/**
 * @file chatSlice.js
 * @description Redux slice for real-time chat state.
 */
import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    rooms:          [],
    activeRoom:     null,
    messages:       {},  // { roomId: Message[] }
    typingUsers:    {},  // { roomId: userId[] }
    onlineUsers:    [],
    unreadCounts:   {},  // { roomId: count }
    isConnected:    false,
  },
  reducers: {
    setRooms:      (state, action) => { state.rooms = action.payload; },
    setActiveRoom: (state, action) => { state.activeRoom = action.payload; },
    addMessage:    (state, action) => {
      const { roomId, message } = action.payload;
      if (!state.messages[roomId]) state.messages[roomId] = [];
      state.messages[roomId].push(message);
    },
    setMessages:   (state, action) => {
      const { roomId, messages } = action.payload;
      state.messages[roomId] = messages;
    },
    prependMessages: (state, action) => {
      const { roomId, messages } = action.payload;
      if (!state.messages[roomId]) state.messages[roomId] = [];
      state.messages[roomId] = [...messages, ...state.messages[roomId]];
    },
    setTyping:     (state, action) => {
      const { roomId, userId } = action.payload;
      if (!state.typingUsers[roomId]) state.typingUsers[roomId] = [];
      if (!state.typingUsers[roomId].includes(userId)) {
        state.typingUsers[roomId].push(userId);
      }
    },
    clearTyping:   (state, action) => {
      const { roomId, userId } = action.payload;
      if (state.typingUsers[roomId]) {
        state.typingUsers[roomId] = state.typingUsers[roomId].filter((u) => u !== userId);
      }
    },
    setOnlineUsers:  (state, action) => { state.onlineUsers = action.payload; },
    incrementUnread: (state, action) => {
      const { roomId } = action.payload;
      state.unreadCounts[roomId] = (state.unreadCounts[roomId] || 0) + 1;
    },
    clearUnread:     (state, action) => { state.unreadCounts[action.payload] = 0; },
    setConnected:    (state, action) => { state.isConnected = action.payload; },
    updateReaction:  (state, action) => {
      const { roomId, messageId, reactions } = action.payload;
      if (state.messages[roomId]) {
        const msg = state.messages[roomId].find((m) => m._id === messageId);
        if (msg) msg.reactions = reactions;
      }
    },
  },
});

export const {
  setRooms, setActiveRoom, addMessage, setMessages, prependMessages,
  setTyping, clearTyping, setOnlineUsers, incrementUnread, clearUnread,
  setConnected, updateReaction,
} = chatSlice.actions;

export default chatSlice.reducer;
