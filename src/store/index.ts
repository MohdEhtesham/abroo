import { Action, combineReducers, configureStore, Middleware, Reducer } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import chatReducer from './slices/chatSlice';
import propertyReducer from './slices/propertySlice';
import inquiryReducer from './slices/inquirySlice';
import visitReducer from './slices/visitSlice';
import notificationReducer from './slices/notificationSlice';
import sellerReducer from './slices/sellerSlice';

const appReducer = combineReducers({
  auth: authReducer,
  chat: chatReducer,
  property: propertyReducer,
  inquiry: inquiryReducer,
  visit: visitReducer,
  notification: notificationReducer,
  seller: sellerReducer,
});

type AppState = ReturnType<typeof appReducer>;

// Action types fired when a session ends — covers explicit logout, server-
// driven force-logout (401), and account deletion. Listed as strings so we
// don't introduce a circular import on the auth slice.
const RESET_ACTIONS = new Set<string>([
  'auth/logout/fulfilled',
  'auth/forceLogout/fulfilled',
  'auth/deleteAccount/fulfilled',
]);

/**
 * Root reducer that wipes every slice when a session ends.
 *
 * Why this matters:
 *   When user A logged out and user B signed in on the same device, A's
 *   inquiries / visits / leads / notifications / saved properties stayed
 *   in the Redux store. They'd flash on B's screen for the few hundred
 *   ms it took the new API responses to land — leaking A's private data
 *   to B's session.
 *
 *   Returning `undefined` to each slice's reducer makes Redux re-initialize
 *   it to its declared initialState, so B starts from a clean slate and
 *   sees only what their /me-scoped API calls return.
 */
const rootReducer: Reducer<AppState> = (state, action: Action) => {
  if (RESET_ACTIONS.has(action.type)) {
    const fresh = appReducer(undefined, action);
    // The auth slice initializes with rehydrating=true (used at app boot
    // to hold the splash while we read persisted auth from disk). After
    // a runtime logout there's nothing left to rehydrate, so force it
    // false here — otherwise the user would land on an indefinite splash.
    return { ...fresh, auth: { ...fresh.auth, rehydrating: false } };
  }
  return appReducer(state, action);
};

/**
 * Stale-thunk guard.
 *
 * If user A had a pending /inquiries / /visits / /seller/leads (etc.)
 * request when they logged out, the response could land *after* logout
 * and before — or even after — user B logs in, contaminating B's store
 * with A's payload.
 *
 * We drop any thunk action whose type isn't in `auth/*` when the auth
 * state shows nobody is signed in. The reducers never see those payloads,
 * so nothing leaks.
 */
const staleThunkGuard: Middleware = storeApi => next => (action: any) => {
  const type = action?.type;
  if (typeof type === 'string' && !type.startsWith('auth/')) {
    const isAuthed = (storeApi.getState() as AppState).auth?.isAuthenticated;
    if (!isAuthed && /\/(fulfilled|rejected)$/.test(type)) {
      return action;
    }
  }
  return next(action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefault => getDefault().concat(staleThunkGuard),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
