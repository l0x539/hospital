'use client'

import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';

import glReducer from './features/gl/glSlice';

export function makeStore() {
  return configureStore({
    reducer: {
      gl: glReducer,
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
