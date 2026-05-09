import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../features/auth/services/authService';
import type { AuthState, SellerPlan, User, UserPreferences, UserRole } from '../../features/auth/types';
import { setAuthToken } from '../../services/apiClient';
import { getErrorMessage } from '../../utils/apiError';
import { storage } from '../../utils/storage';

interface ExtendedAuthState extends AuthState {
  /** True until we've finished loading persisted auth from storage on app start. */
  rehydrating: boolean;
}

const initialState: ExtendedAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  rehydrating: true,
};

/** Read persisted auth (token + user) from disk and restore session if valid. */
export const rehydrateAuthThunk = createAsyncThunk('auth/rehydrate', async () => {
  const persisted = await storage.getAuth();
  if (!persisted) return null;
  setAuthToken(persisted.token);
  return persisted;
});

/** Called by apiClient on a 401 — drops session everywhere. */
export const forceLogoutThunk = createAsyncThunk('auth/forceLogout', async () => {
  await storage.clearAuth();
});

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (
    creds: { identifier: string; password: string; role?: UserRole },
    { rejectWithValue },
  ) => {
    try {
      const res = await authService.login(creds.identifier, creds.password, creds.role ?? 'consumer');
      return res;
    } catch (e) {
      // Surface the server's actual reason (wrong password, account not found,
      // role mismatch) rather than a generic blanket. Falls back to a friendly
      // default only if the error has no message.
      return rejectWithValue(getErrorMessage(e, 'Could not sign you in. Please try again.'));
    }
  },
);

export const signupThunk = createAsyncThunk(
  'auth/signup',
  async (
    data: { fullName: string; email: string; phone: string; password: string; role?: UserRole },
    { rejectWithValue },
  ) => {
    try {
      return await authService.signup(data);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e, 'Could not create your account. Please try again.'));
    }
  },
);

export const verifyOtpThunk = createAsyncThunk(
  'auth/verifyOtp',
  async (input: { phone: string; otp: string; role?: UserRole }, { rejectWithValue }) => {
    try {
      const res = await authService.verifyOtp(input.phone, input.otp, input.role ?? 'consumer');
      if (!res.valid) return rejectWithValue('That OTP did not match. Please double-check and try again.');
      return res;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e, 'Could not verify the OTP. Please try again.'));
    }
  },
);

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  // Always clear local state even if the server logout fails (e.g. offline)
  try {
    await authService.logout();
  } catch {
    // ignore — local logout is what matters
  }
  await storage.clearAuth();
});

export const deleteAccountThunk = createAsyncThunk(
  'auth/deleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      await authService.deleteAccount();
      await storage.clearAuth();
      return true;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e, 'Could not delete your account. Please try again.'));
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setPreferences: (state, action: PayloadAction<UserPreferences>) => {
      if (state.user) state.user.preferences = action.payload;
    },
    setRole: (state, action: PayloadAction<UserRole>) => {
      if (state.user) {
        state.user.role = action.payload;
        if (action.payload === 'seller' && !state.user.seller) {
          state.user.seller = {
            plan: 'free',
            listingQuotaUsed: 0,
            listingQuotaTotal: 1,
            totalLeads: 0,
            rating: 0,
          };
        }
      }
    },
    setSellerPlan: (state, action: PayloadAction<SellerPlan>) => {
      if (state.user?.seller) {
        const quotas: Record<SellerPlan, number> = { free: 1, basic: 10, pro: 999 };
        state.user.seller.plan = action.payload;
        state.user.seller.listingQuotaTotal = quotas[action.payload];
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1);
        state.user.seller.planExpiresAt = expiry.toISOString();
      }
    },
    incrementListingQuota: state => {
      if (state.user?.seller) state.user.seller.listingQuotaUsed += 1;
    },
    decrementListingQuota: state => {
      if (state.user?.seller && state.user.seller.listingQuotaUsed > 0) {
        state.user.seller.listingQuotaUsed -= 1;
      }
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loginThunk.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        setAuthToken(action.payload.token);
        // Fire-and-forget: persist for next launch
        storage.saveAuth({ token: action.payload.token, user: action.payload.user });
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Login failed';
      })
      .addCase(signupThunk.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        setAuthToken(action.payload.token);
        storage.saveAuth({ token: action.payload.token, user: action.payload.user });
      })
      .addCase(signupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Signup failed';
      })
      .addCase(verifyOtpThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        setAuthToken(action.payload.token);
        storage.saveAuth({ token: action.payload.token, user: action.payload.user });
      })
      .addCase(logoutThunk.fulfilled, state => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        setAuthToken(null);
      })
      .addCase(deleteAccountThunk.fulfilled, state => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        setAuthToken(null);
      })
      .addCase(rehydrateAuthThunk.fulfilled, (state, action) => {
        state.rehydrating = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        }
      })
      .addCase(rehydrateAuthThunk.rejected, state => {
        state.rehydrating = false;
      })
      .addCase(forceLogoutThunk.fulfilled, state => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        setAuthToken(null);
      });
  },
});

export const {
  setUser,
  setPreferences,
  setRole,
  setSellerPlan,
  incrementListingQuota,
  decrementListingQuota,
  clearError,
} = authSlice.actions;
export default authSlice.reducer;
