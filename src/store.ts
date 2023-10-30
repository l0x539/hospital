'use client'

import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';

import glReducer from './features/gl/glSlice';
import appReducer from './features/app/appSlice';

export function makeStore() {
  return configureStore({
    reducer: {
      gl: glReducer,
      app: appReducer,
    },
    middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  })
}

const store = makeStore()

export type AppState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  Action<string>
>

export default store
