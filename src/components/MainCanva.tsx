import { selectGl, updateGlobalUniforms } from "@/features/gl/glSlice";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import { Uniform, Vector2 } from "three";

const MainCanva = () => {
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
  
  return (
    <Canvas
      gl={{
        alpha: false,
        antialias: false,
        powerPreference: "high-performance",
        stencil: false,
        pixelRatio: window.devicePixelRatio >= 2 ? 2 : window.devicePixelRatio, // TODO: mq sm match should be >= 1.5
      }}
    >
      
    </Canvas>
  );
}

export default MainCanva;