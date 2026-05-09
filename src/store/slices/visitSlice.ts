import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { visitService } from '../../features/visits/services/visitService';
import type { Visit } from '../../features/visits/types';
import { getErrorMessage } from '../../utils/apiError';

interface VisitState {
  list: Visit[];
  loading: boolean;
  scheduling: boolean;
  error: string | null;
}

const initialState: VisitState = {
  list: [],
  loading: false,
  scheduling: false,
  error: null,
};

export const loadVisitsThunk = createAsyncThunk('visit/load', () => visitService.list());

export const scheduleVisitThunk = createAsyncThunk(
  'visit/schedule',
  async (input: Parameters<typeof visitService.create>[0], { rejectWithValue }) => {
    try {
      return await visitService.create(input);
    } catch (e) {
      return rejectWithValue(
        getErrorMessage(e, 'Could not schedule your visit. Please try again.'),
      );
    }
  },
);

export const cancelVisitThunk = createAsyncThunk(
  'visit/cancel',
  async (id: string, { rejectWithValue }) => {
    try {
      await visitService.cancel(id);
      return id;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e, 'Could not cancel the visit.'));
    }
  },
);

const visitSlice = createSlice({
  name: 'visit',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadVisitsThunk.pending, state => {
        state.loading = true;
      })
      .addCase(loadVisitsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(scheduleVisitThunk.pending, state => {
        state.scheduling = true;
      })
      .addCase(scheduleVisitThunk.fulfilled, (state, action) => {
        state.scheduling = false;
        state.list = [action.payload, ...state.list];
      })
      .addCase(scheduleVisitThunk.rejected, (state, action) => {
        state.scheduling = false;
        state.error = (action.payload as string) ?? action.error.message ?? null;
      })
      .addCase(cancelVisitThunk.fulfilled, (state, action) => {
        state.list = state.list.map(v => (v.id === action.payload ? { ...v, status: 'cancelled' } : v));
      });
  },
});

export default visitSlice.reducer;
