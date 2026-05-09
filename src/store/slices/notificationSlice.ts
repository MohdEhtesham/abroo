import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { notificationService } from '../../features/notifications/services/notificationService';
import type { AppNotification } from '../../features/notifications/types';

interface NotificationState {
  list: AppNotification[];
  loading: boolean;
}

const initialState: NotificationState = { list: [], loading: false };

export const loadNotificationsThunk = createAsyncThunk('notification/load', () => notificationService.list());

export const markReadThunk = createAsyncThunk('notification/markRead', async (id: string) => {
  await notificationService.markRead(id);
  return id;
});

export const markAllReadThunk = createAsyncThunk('notification/markAllRead', async () => {
  await notificationService.markAllRead();
});

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadNotificationsThunk.pending, state => {
        state.loading = true;
      })
      .addCase(loadNotificationsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(markReadThunk.fulfilled, (state, action) => {
        state.list = state.list.map(n => (n.id === action.payload ? { ...n, read: true } : n));
      })
      .addCase(markAllReadThunk.fulfilled, state => {
        state.list = state.list.map(n => ({ ...n, read: true }));
      });
  },
});

export default notificationSlice.reducer;
