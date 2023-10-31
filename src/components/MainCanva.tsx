'use client'
import { selectGl, selectGlobalVars, updateGlobalUniforms } from "@/features/gl/glSlice";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { useEffect, useMemo, useState } from "react";
import { Color, LinearSRGBColorSpace, PerspectiveCamera, SRGBColorSpace, ShaderChunk, Uniform, Vector2 } from "three";
import { useSearchParams } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import MainTower from "./MainTower";
import glslifyStrip from "@/utils/funcs";
import { defaultFragDef, defaultVertDef, fogOutputFragDef, fogOutputVertDef, fogParamsFragDef, fogParamsVertDef, normalsVertDef } from "@/shaders/defines";
import Fog from "./Fog";
import WorldFloor from "./WorldFloor";
import { OrbitControls, Scroll, ScrollControls } from "@react-three/drei";
import Pipes from "./Pipes";
import People from "./People";
import Towers from "./Towers";
import Particles from "./Particles";
import CityPipes from "./CityPipes";
import Cars from "./Cars";
import Signs from "./Signs";
import Bridges from "./Bridges";
import ReflectiveFloor from "./ReflectiveFloor";
import NavigationControls from "./layout/NavigationControls";
import MainEffects from "./effects/MainEffects";

(ShaderChunk as any).defaultVert = glslifyStrip(defaultVertDef);
(ShaderChunk as any).defaultFrag = glslifyStrip(defaultFragDef);
(ShaderChunk as any).normalsVert = glslifyStrip(normalsVertDef);
(ShaderChunk as any).fogParamsVert = glslifyStrip(fogParamsVertDef);
(ShaderChunk as any).fogOutputVert = glslifyStrip(fogOutputVertDef);
(ShaderChunk as any).fogParamsFrag = glslifyStrip(fogParamsFragDef);
(ShaderChunk as any).fogOutputFrag = glslifyStrip(fogOutputFragDef);

const MainCanva = () => {
   
  return (
    <Canvas
      gl={{
        alpha: false,
        antialias: false,
        powerPreference: "high-performance",
        stencil: false,
        outputColorSpace: LinearSRGBColorSpace
      }}
      camera={{
        fov: 45,
        near: 1,
        far: 500,
        filmGauge: 100,
        
      }}
    >
      <MainScene />
    </Canvas>
  );
};

const MainScene = () => {
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
      cameraYTranslate: 0, // 5
      cameraZTranslate: 0, // 15
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
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  return <>
    <Fog options={options} />
    <WorldFloor options={options} />
    {ready ? <MainTower options={options} /> : <></>}
    <Pipes options={options} />
    <People options={options} />
    <Towers options={options} />
    <Particles options={options} />
    <CityPipes options={options} />
    <Cars />
    <Signs options={options} />
    <Bridges options={options} />
    {ready ? <ReflectiveFloor options={options} /> : <></>}
    {searchParams.has('controls') ? <OrbitControls /> : <NavigationControls options={options} />}
    
    <MainEffects />
    {/* <ScrollControls pages={4} damping={0.1}>
      <Scroll html>
        <div className="h-screen js-section-0"></div>
        <div className="h-screen js-section-1"></div>
        <div className="h-screen js-section-2"></div>
        <div className="h-screen js-section-3"></div>
      </Scroll>
    </ScrollControls> */}
  </>
}

export default MainCanva;