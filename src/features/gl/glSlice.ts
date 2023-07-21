'use client'

// TODO: rename slice name
import { AppState } from "@/store";
import { createSlice } from "@reduxjs/toolkit"
import { Uniform, Vector2 } from "three";

interface GlState {
  globalUniforms: {
    uDelta: Uniform<number>;
    uTime: Uniform<number>;
    uResolution: Uniform<Vector2>;
    uPixelRatio: Uniform<number>;
  }
}

const initialState: GlState = {
  globalUniforms: {
    uDelta: new Uniform(0),
    uTime: new Uniform(0),
    uResolution: new Uniform(new Vector2(0, 0)),
    uPixelRatio: new Uniform(0)
  }
};

type Action<T> = {
  type: string;
  payload: T;
}

const glSlice = createSlice({
  name: 'gl',
  initialState,
  reducers: {
    updateGlobalUniforms: (state, action: Action<GlState['globalUniforms']>) => {
      state.globalUniforms = action.payload;
    }
  }
});

export const {
  updateGlobalUniforms
} = glSlice.actions;

export const selectGl = (state: AppState) => state.gl;
export const selectGlobalUniforms = (state: AppState) => state.gl.globalUniforms;

export default glSlice.reducer;