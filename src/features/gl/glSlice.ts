'use client'

// TODO: rename slice name
import { AppState } from "@/store";
import { createSlice } from "@reduxjs/toolkit"
import { Uniform, Vector2 } from "three";

interface GlState {
  GLOBAL_VARS: {
    html: HTMLElement | null;
    body: HTMLElement | null;
    window: {
      w: number;
      h: number;
      dpr: number;
      fullHeight: number;
    };
    keys: {
      UP: number;
      DOWN: number;
      ENTER: number;
      ESC: number;
      HOME: number;
      END: number;
    },
    isTouch: boolean;
    isIOS: boolean;
    urlParams: URLSearchParams;
    pointer: {
        x: number;
        y: number;
        gl: Vector2;
        glNormalized: Vector2;
        isDragging: boolean;
    },
    cookieNoticeAccepted: boolean,
    animConfig: {
        duration: number;
        staggerAmount: number
    },
    pinType: "transform" | "fixed",
  };
  globalUniforms: {
    uDelta: Uniform<number>;
    uTime: Uniform<number>;
    uResolution: Uniform<Vector2>;
    uPixelRatio: Uniform<number>;
  }
}

const initialState: GlState = {
  GLOBAL_VARS: {
    html: null,
    body: null,
    window: {
        w: window.innerWidth,
        h: window.innerHeight,
        dpr: window.devicePixelRatio,
        fullHeight: window.innerHeight
    },
    keys: {
        UP: 38,
        DOWN: 40,
        ENTER: 13,
        ESC: 27,
        HOME: 36,
        END: 35
    },
    isTouch: !1,
    isIOS: ["iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod"].includes(navigator.platform) || navigator.userAgent.includes("Mac") && "ontouchend"in document,
    urlParams: new URLSearchParams(window.location.search),
    pointer: {
        x: 0,
        y: 0,
        gl: new Vector2,
        glNormalized: new Vector2,
        isDragging: !1
    },
    cookieNoticeAccepted: !1,
    animConfig: {
        duration: .7,
        staggerAmount: .2
    },
    pinType: "transform",
  },
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
  updateGlobalUniforms,
} = glSlice.actions;

export const selectGl = (state: AppState) => state.gl;
export const selectGlobalUniforms = (state: AppState) => state.gl.globalUniforms;
export const selectGlobalVars = (state: AppState) => state.gl.GLOBAL_VARS;

export default glSlice.reducer;