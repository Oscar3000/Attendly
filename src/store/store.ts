/**
 * Redux store configuration with RTK Query
 */
import { configureStore } from '@reduxjs/toolkit';
import { invitationApi } from './invitationApi';

export const store = configureStore({
  reducer: {
    [invitationApi.reducerPath]: invitationApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(invitationApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;