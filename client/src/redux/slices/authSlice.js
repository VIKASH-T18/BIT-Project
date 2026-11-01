/**
 * @file authSlice.js
 * @description Redux slice for authentication state.
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { queryClient } from "../../queryClient";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/login", credentials);
    if (data.data?.accessToken) {
      localStorage.setItem("accessToken", data.data.accessToken);
    }
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Login failed");
  }
});

export const registerUser = createAsyncThunk("auth/register", async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/register", userData);
    if (data.data?.accessToken) {
      localStorage.setItem("accessToken", data.data.accessToken);
    }
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Registration failed");
  }
});

export const logoutUser = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    await api.post("/auth/logout");
    localStorage.removeItem("accessToken");
  } catch (err) {
    localStorage.removeItem("accessToken");
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchCurrentUser = createAsyncThunk("auth/me", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/auth/me");
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const refreshTokenThunk = createAsyncThunk("auth/refresh", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/refresh");
    localStorage.setItem("accessToken", data.data.accessToken);
    return data.data;
  } catch (err) {
    localStorage.removeItem("accessToken");
    return rejectWithValue("Session expired. Please login again.");
  }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user:         null,
    profile:      null,    // Student/Warden/Admin profile
    accessToken:  localStorage.getItem("accessToken") || null,
    isLoading:    false,
    isRefreshing: false,
    error:        null,
    isInitialized: false,  // Has initial auth check been done?
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user        = action.payload.user;
      state.profile     = action.payload.profile;
      state.accessToken = action.payload.accessToken;
    },
    updateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
  },
  extraReducers: (builder) => {
    // ── Login ─────────────────────────────────────────────
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading     = false;
        state.user          = action.payload.user;
        state.profile       = action.payload.profile || null;
        state.accessToken   = action.payload.accessToken;
        state.error         = null;
        state.isInitialized = true; // Mark initialized so App.jsx skips redundant fetchCurrentUser
        try { queryClient.clear(); } catch (_) {}
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      });

    // ── Register ──────────────────────────────────────────
    builder
      .addCase(registerUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?.user && action.payload?.accessToken) {
          state.user = action.payload.user;
          state.profile = action.payload.profile || null;
          state.accessToken = action.payload.accessToken;
        }
        try { queryClient.clear(); } catch (_) {}
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      });

    // ── Logout ────────────────────────────────────────────
    const clearAuthState = (state) => {
      state.user        = null;
      state.profile     = null;
      state.accessToken = null;
      state.error       = null;
      try { queryClient.clear(); } catch (_) {}
    };
    builder
      .addCase(logoutUser.fulfilled, clearAuthState)
      .addCase(logoutUser.rejected,  clearAuthState); // Always clear state even if API call fails

    // ── Fetch Me ──────────────────────────────────────────
    builder
      .addCase(fetchCurrentUser.pending, (state) => { state.isLoading = true; })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading    = false;
        state.user         = action.payload.user;
        state.profile      = action.payload.profile;
        state.isInitialized = true;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading    = false;
        state.isInitialized = true;
        // Only clear credentials if the server explicitly rejected the token
        // (401/403). Do NOT clear on network errors or server downtime (503, etc.)
        // to avoid logging users out during temporary MongoDB disconnects.
        const errorMsg = action.payload || "";
        const isAuthError =
          typeof errorMsg === "string" &&
          (errorMsg.includes("token") ||
           errorMsg.includes("login") ||
           errorMsg.includes("unauthorized") ||
           errorMsg.includes("Invalid") ||
           errorMsg.includes("expired"));
        if (isAuthError) {
          state.user        = null;
          state.accessToken = null;
          localStorage.removeItem("accessToken");
        }
        // Otherwise keep existing user/token so the app stays usable
      });

    // ── Refresh Token ─────────────────────────────────────
    builder
      .addCase(refreshTokenThunk.pending, (state) => { state.isRefreshing = true; })
      .addCase(refreshTokenThunk.fulfilled, (state, action) => {
        state.isRefreshing = false;
        state.accessToken  = action.payload.accessToken;
      })
      .addCase(refreshTokenThunk.rejected, (state) => {
        state.isRefreshing = false;
        state.user         = null;
        state.accessToken  = null;
      });
  },
});

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectCurrentUser    = (state) => state.auth.user;
export const selectUserProfile    = (state) => state.auth.profile;
export const selectAccessToken    = (state) => state.auth.accessToken;
export const selectIsAuthenticated = (state) => !!state.auth.user;
export const selectAuthLoading    = (state) => state.auth.isLoading;
export const selectAuthError      = (state) => state.auth.error;
export const selectIsInitialized  = (state) => state.auth.isInitialized;

export const { setCredentials, updateProfile, updateUser, clearError, setInitialized } = authSlice.actions;
export default authSlice.reducer;
