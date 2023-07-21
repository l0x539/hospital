import { useGLTF, useKTX2 } from "@react-three/drei";
import { useMemo } from "react";
import { Color, RepeatWrapping } from "three";

const MainTower = () => {
  const [buildingWalls, buildingFloor, pillars, baseSides] = useGLTF([
    "/models/mb-walls.glb",
    "/models/mb-topfloor.glb",
    "/models/pilars.glb",
    "/models/base-sides.glb",
  ]);

  const [
    railsMask,
    repeatWalls,
    repeatWindows,
    repeatPillars,
    wallsColor0,
    wallsColor1,
    wallsColor2,
    wallsColor3,
    windowsColor0,
    windowsColor1,
    windowsColor2,
    windowsColor3,
    pillarsColor0,
    pillarsColor1,
    pillarsColor2,
    pillarsColor3,
    baseLightmap,
  ] = useKTX2([
    "/images/rails-mask.ktx2",
    "/images/walls-2.ktx2",
    "/images/windows.ktx2",
    "/images/pilars.ktx2",
    ...[0, 1, 2, 3].map((t) => `/images/mb ${t}-walls-lightmap.ktx2`),
    ...[0, 1, 2, 3].map((t) => `/images/mb ${t}-windows-lightmap.ktx2`),
    ...[0, 1, 2, 3].map((t) => `/images/mb ${t}-pilars-lightmap.ktx2`),
    "/images/base-lightmap.ktx2",
  ]);

  const { uniforms } = useMemo(() => {
    railsMask.wrapS =
      railsMask.wrapT =
      repeatWalls.wrapS =
      repeatWalls.wrapT =
      repeatWindows.wrapS =
      repeatWindows.wrapT =
      repeatPillars.wrapS =
      repeatPillars.wrapT =
        RepeatWrapping;
    wallsColor0.wrapS =
      wallsColor0.wrapT =
      wallsColor1.wrapS =
      wallsColor1.wrapT =
      wallsColor2.wrapS =
      wallsColor2.wrapT =
      wallsColor3.wrapS =
      wallsColor3.wrapT =
      windowsColor0.wrapS =
      windowsColor0.wrapT =
      windowsColor1.wrapS =
      windowsColor1.wrapT =
      windowsColor2.wrapS =
      windowsColor2.wrapT =
      windowsColor3.wrapS =
      windowsColor3.wrapT =
      pillarsColor0.wrapS =
      pillarsColor0.wrapT =
      pillarsColor1.wrapS =
      pillarsColor1.wrapT =
      pillarsColor2.wrapS =
      pillarsColor2.wrapT =
      pillarsColor3.wrapS =
      pillarsColor3.wrapT =
      baseLightmap.wrapS =
      baseLightmap.wrapT =
        RepeatWrapping;

    const uniforms = {
      uProgress: {
        value: 0,
      },
      uAnimate: {
        value: !0,
      },
      uAnimateUpFlag: {
        value: !1,
      },
      uUseNoise: {
        value: !0,
      },
      uAnimateUp: {
        value: -1,
      },
      uGroundFloorBegin: {
        value: -0.076,
      },
      uVertDispType: {
        value: 0,
      },
      uVertDispMult: {
        value: 0,
      },
      uVertGradientSpread: {
        value: 0.5,
      },
      uVertFalloffStart: {
        value: 0.022,
      },
      uVertFalloffEnd: {
        value: 0.609,
      },
      uVertNoiseScale: {
        value: 2,
      },
      uVertNoiseSpeed: {
        value: 2.5,
      },
      uVertNoiseStrength: {
        value: 0.13,
      },
      uHexTexScale: {
        value: 6,
      },
      uRecTexScale: {
        value: 0.6,
      },
      uOverallGradientSpread: {
        value: 0.13,
      },
      uFlameBandWidth: {
        value: 0.462,
      },
      uEdgeTextureSubtractStrength: {
        value: 0.253,
      },
      uFlameColorGradientSpread: {
        value: 0.2,
      },
      uFlameColorChangeOffset: {
        value: 0.2,
      },
      uFlameStrength: {
        value: 0.75,
      },
      uFlameTopColor: {
        value: new Color(16765123),
      },
      uFlameBottomColor: {
        value: new Color(16752742),
      },
      uFragNoiseScale: {
        value: 14.5,
      },
      uFragNoiseSpeed: {
        value: 2.5,
      },
      uFragNoiseStrength: {
        value: 0.04,
      },
      uBalconyBaseColorTop: {
        value: new Color(16764607),
      },
      uBalconyBaseColorBottom: {
        value: new Color(16743475),
      },
      uBalconyScanLinesBlendMode: {
        value: 1,
      },
      uBalconyScanLinesSpeed: {
        value: 1,
      },
      uBalconyScanLinesDensity: {
        value: 10,
      },
      uBalconyScanLinesStrength: {
        value: 0.25,
      },
      uBalconyScanLinesMaxDistance: {
        value: 38,
      },
    };

    const assets = {
      models: {
        buildingWalls,
        buildingFloor,
        pillars,
        baseSides,
      },
      textures: {
        railsMask,
        repeatWalls,
        repeatWindows,
        repeatPillars,
        wallsColor0,
        wallsColor1,
        wallsColor2,
        wallsColor3,
        windowsColor0,
        windowsColor1,
        windowsColor2,
        windowsColor3,
        pillarsColor0,
        pillarsColor1,
        pillarsColor2,
        pillarsColor3,
        baseLightmap,
      },
    };

    return {
      uniforms,
      assets,
    };
  }, [
    baseLightmap,
    baseSides,
    buildingFloor,
    buildingWalls,
    pillars,
    pillarsColor0,
    pillarsColor1,
    pillarsColor2,
    pillarsColor3,
    railsMask,
    repeatPillars,
    repeatWalls,
    repeatWindows,
    wallsColor0,
    wallsColor1,
    wallsColor2,
    wallsColor3,
    windowsColor0,
    windowsColor1,
    windowsColor2,
    windowsColor3,
  ]);
  return <></>;
};
