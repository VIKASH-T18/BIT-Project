/**
 * @file uiSlice.js
 * @description UI state — theme, sidebar, edge hover auto-reveal, modals, loading.
 */
import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    theme:              localStorage.getItem("theme") || "dark",
    sidebarOpen:        true,
    sidebarPinned:      localStorage.getItem("sidebarPinned") !== "false", // Default true: pinned & docked
    sidebarHoverOpen:   false,
    sidebarMobile:      false,
    activeModal:        null,
    modalData:          null,
    globalLoading:      false,
    commandPaletteOpen: false,
  },
  reducers: {
    toggleTheme: (state) => {
      const newTheme = state.theme === "dark" ? "light" : "dark";
      state.theme = newTheme;
      localStorage.setItem("theme", newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem("theme", action.payload);
      document.documentElement.classList.toggle("dark", action.payload === "dark");
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setSidebarHoverOpen: (state, action) => {
      state.sidebarHoverOpen = action.payload;
    },
    toggleSidebarPinned: (state) => {
      const next = !state.sidebarPinned;
      state.sidebarPinned = next;
      localStorage.setItem("sidebarPinned", String(next));
    },
    setSidebarPinned: (state, action) => {
      state.sidebarPinned = action.payload;
      localStorage.setItem("sidebarPinned", String(action.payload));
    },
    toggleMobileSidebar: (state) => {
      state.sidebarMobile = !state.sidebarMobile;
    },
    setSidebarMobile: (state, action) => {
      state.sidebarMobile = action.payload;
    },
    openModal: (state, action) => {
      state.activeModal = action.payload.modal;
      state.modalData = action.payload.data;
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    toggleCommandPalette: (state) => {
      state.commandPaletteOpen = !state.commandPaletteOpen;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  setSidebarHoverOpen,
  toggleSidebarPinned,
  setSidebarPinned,
  toggleMobileSidebar,
  setSidebarMobile,
  openModal,
  closeModal,
  setGlobalLoading,
  toggleCommandPalette,
} = uiSlice.actions;

export const selectTheme             = (state) => state.ui.theme;
export const selectSidebarOpen       = (state) => state.ui.sidebarOpen;
export const selectSidebarPinned     = (state) => state.ui.sidebarPinned;
export const selectSidebarHoverOpen  = (state) => state.ui.sidebarHoverOpen;
export const selectSidebarMobile     = (state) => state.ui.sidebarMobile;
export const selectActiveModal       = (state) => state.ui.activeModal;
export const selectModalData         = (state) => state.ui.modalData;
export const selectGlobalLoading     = (state) => state.ui.globalLoading;
export const selectCommandPalette    = (state) => state.ui.commandPaletteOpen;

export default uiSlice.reducer;
