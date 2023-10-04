'use client'
import { selectGl, selectGlobalVars, updateGlobalUniforms } from "@/features/gl/glSlice";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { useEffect, useMemo } from "react";
import { Color, ShaderChunk, Uniform, Vector2 } from "three";
import { useSearchParams } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import MainTower from "./MainTower";
import glslifyStrip from "@/utils/funcs";
import { defaultFragDef, defaultVertDef, fogOutputFragDef, fogOutputVertDef, fogParamsFragDef, fogParamsVertDef, normalsVertDef } from "@/shaders/defines";
import Fog from "./Fog";
import WorldFloor from "./WorldFloor";
import { OrbitControls } from "@react-three/drei";

(ShaderChunk as any).defaultVert = glslifyStrip(defaultVertDef);
(ShaderChunk as any).defaultFrag = glslifyStrip(defaultFragDef);
(ShaderChunk as any).normalsVert = glslifyStrip(normalsVertDef);
(ShaderChunk as any).fogParamsVert = glslifyStrip(fogParamsVertDef);
(ShaderChunk as any).fogOutputVert = glslifyStrip(fogOutputVertDef);
(ShaderChunk as any).fogParamsFrag = glslifyStrip(fogParamsFragDef);
(ShaderChunk as any).fogOutputFrag = glslifyStrip(fogOutputFragDef);

const MainCanva = () => {
  const searchParams = useSearchParams();
  const dispach = useAppDispatch();
  const {
    globalUniforms
  } = useAppSelector(selectGl);
  useEffect(() => {
    const dpr = window.devicePixelRatio >= 2 ? 2 : window.devicePixelRatio;
    dispach(updateGlobalUniforms({
      uDelta: new Uniform(0),
      uTime: new Uniform(0),
      uResolution: new Uniform(new Vector2(window.innerWidth * dpr, window.innerHeight * dpr)),
      uPixelRatio: new Uniform(dpr / window.devicePixelRatio)
    }))
  }, [dispach]);
  const {options} = useMemo(() => ({
    options: {
      cameraTargetPathProgress: 0,
      scrollPosition: parseFloat(`${searchParams.get("scrollPos") || 0}`),
      scrollSpeed: 1,
      mouseMoveAngle: new Vector2(.05,.035),
      cameraMotionPosAmplitude: .026,
      cameraMotionRotAmplitude: .0132,
      cameraMotionPosFrequency: .21,
      cameraMotionRotFrequency: .59,
      cameraZOffset: 0,
      cameraYTranslate: 5,
      cameraZTranslate: 15,
      revealProgress: 0,
      mainBuildingReveal: 0,
      signs: {
          uColor1: {
              value: new Color(16759194)
          },
          uColor2: {
              value: new Color(15368282)
          }
      },
      pipes: {
          uColor1: {
              value: new Color(16759194)
          },
          uColor2: {
              value: new Color(15368282)
          }
      },
      controls: searchParams.has("controls"),
      fogEnabled: true,
      lightHelpersEnabled: false,
      bloomEnabled: !searchParams.has("disableBloom"),
      towersScroll: searchParams.has("towersScroll"),
      noui: searchParams.has("noui")
    }
  }), [searchParams]);
  return (
    <Canvas
      gl={{
        alpha: false,
        antialias: false,
        powerPreference: "high-performance",
        stencil: false,
        pixelRatio: window.devicePixelRatio >= 2 ? 2 : window.devicePixelRatio, // TODO: mq sm match should be >= 1.5
      }}
      camera={{
        position: [0, 100, 100]
      }}
    >
      <MainTower options={options} />
      <Fog options={options} />
      <WorldFloor options={options} />
      <OrbitControls />
    </Canvas>
  );
};

export default MainCanva;