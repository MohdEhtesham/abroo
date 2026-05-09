import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { inquiryService } from '../../features/inquiry/services/inquiryService';
import type { Inquiry } from '../../features/inquiry/types';
import { getErrorMessage } from '../../utils/apiError';

interface InquiryState {
  list: Inquiry[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
}

const initialState: InquiryState = {
  list: [],
  loading: false,
  submitting: false,
  error: null,
};

export const loadInquiriesThunk = createAsyncThunk('inquiry/load', () => inquiryService.list());

export const submitInquiryThunk = createAsyncThunk(
  'inquiry/submit',
  async (input: Parameters<typeof inquiryService.create>[0], { rejectWithValue }) => {
    try {
      return await inquiryService.create(input);
    } catch (e) {
      return rejectWithValue(
        getErrorMessage(e, 'Could not submit your inquiry. Please try again.'),
      );
    }
  },
);

const inquirySlice = createSlice({
  name: 'inquiry',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadInquiriesThunk.pending, state => {
        state.loading = true;
      })
      .addCase(loadInquiriesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(loadInquiriesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? null;
      })
      .addCase(submitInquiryThunk.pending, state => {
        state.submitting = true;
      })
      .addCase(submitInquiryThunk.fulfilled, (state, action) => {
        state.submitting = false;
        state.list = [action.payload, ...state.list];
      })
      .addCase(submitInquiryThunk.rejected, (state, action) => {
        state.submitting = false;
        state.error = (action.payload as string) ?? action.error.message ?? null;
      });
  },
});

export default inquirySlice.reducer;
