/**
 * @file allocationSlice.js
 * @description Redux slice for student's room allocation state.
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// ─── Async Thunk: Fetch My Allocation ─────────────────────────────────────────
export const fetchMyAllocation = createAsyncThunk(
  "allocation/fetchMy",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/allocations/my");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch allocation");
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const allocationSlice = createSlice({
  name: "allocation",
  initialState: {
    allocation: null,
    isLoading:  false,
    error:      null,
  },
  reducers: {
    clearAllocation: (state) => {
      state.allocation = null;
      state.error = null;
    },
    setAllocation: (state, action) => {
      state.allocation = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyAllocation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyAllocation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allocation = action.payload;
      })
      .addCase(fetchMyAllocation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAllocation, setAllocation } = allocationSlice.actions;

// Selectors
export const selectAllocation = (state) => state.allocation?.allocation;
export const selectAllocationLoading = (state) => state.allocation?.isLoading;

export default allocationSlice.reducer;
