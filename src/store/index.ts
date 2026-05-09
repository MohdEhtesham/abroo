import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import propertyReducer from './slices/propertySlice';
import inquiryReducer from './slices/inquirySlice';
import visitReducer from './slices/visitSlice';
import notificationReducer from './slices/notificationSlice';
import sellerReducer from './slices/sellerSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    property: propertyReducer,
    inquiry: inquiryReducer,
    visit: visitReducer,
    notification: notificationReducer,
    seller: sellerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
