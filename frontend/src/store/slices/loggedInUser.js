import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axios } from "../../hooks/useApiRequest.js";

// Initial state must be declared before using it in createSlice
const initialState = {
  user: null,
  accessToken: localStorage.getItem("auth-token"),
  isLoading: false,
  error: null,
};

export const fetchCurrentUser = createAsyncThunk(
  "current-user/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("auth-token");
      const resp = await axios.get("/users/me/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return resp.data;
    } catch (err) {
      const message =
        err.response?.data?.detail || err.message || "Failed to load user.";
      return rejectWithValue(message);
    }
  }
);

export const updateUser = createAsyncThunk(
  "current-user/update",
  async (profileData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("auth-token");
      const isFormData = profileData instanceof FormData;

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          // Force the correct multipart header for FormData
          ...(isFormData && { "Content-Type": "multipart/form-data" }),
        },
      };

      const resp = await axios.patch("/users/me/update/", profileData, config);
      return resp.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || err.response?.data?.detail || err.message
      );
    }
  }
);

const loggedInUser = createSlice({
  name: "current-user",
  initialState, // ← we now have this defined!
  reducers: {
    loginUser: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isLoading = false;
      state.error = null;
      localStorage.setItem("auth-token", action.payload.accessToken);
    },
    logoutUser: (state) => {
      state.user = null;
      state.accessToken = null;
      localStorage.removeItem("auth-token");
    },
  },
  extraReducers: (builder) =>
    builder
      // fetchCurrentUser
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.user = payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })

      // updateUser
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.user = payload; // sync store to updated user
      })
      .addCase(updateUser.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      }),
});

export const { loginUser, logoutUser } = loggedInUser.actions;
export default loggedInUser.reducer;
