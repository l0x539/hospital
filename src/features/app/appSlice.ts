'use client'

import { AppState } from "@/store";
import { createSlice } from "@reduxjs/toolkit"

type Action<T> = {
  type: string;
  payload: T;
}

export interface MenuState {
  isMenuOpen: boolean;
  isScrolled: boolean;
  scrollHintBottom: boolean;
};

const initialState: MenuState = {
  isMenuOpen: false,
  isScrolled: true,
  scrollHintBottom: false,
};

const appSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    openMenu: (state) => {
      state.isMenuOpen = true;
    },
    closeMenu: (state) => {
      state.isMenuOpen = false;
    },
    togleMenu: (state) => {
      state.isMenuOpen = !state.isMenuOpen;
    },
    setMenuOpen: (state, {payload}: Action<boolean>) => {
      state.isMenuOpen = payload;
    },
    setScrollBottomHint: (state, {payload}: Action<boolean>) => {
      state.scrollHintBottom = payload;
    },
    setScrolled: (state, {payload}: Action<boolean>) => {
      state.isScrolled = payload;
    }
  }
});

export const {
  openMenu,
  closeMenu,
  togleMenu,
  setMenuOpen,
  setScrollBottomHint,
  setScrolled
} = appSlice.actions;

export const selectApp = (state: AppState) => state.app;

export default appSlice.reducer;