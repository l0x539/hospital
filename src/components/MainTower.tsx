import { fogDefines } from "@/shaders/defines";
import { towerFragmentShader } from "@/shaders/fragmantShaders";
import { towerVertexShader } from "@/shaders/vertexShaders";
import { objectData } from "@/utils/constants";
import { useGLTF, useKTX2 } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { FC, ReactNode, useEffect, useMemo, useRef } from "react";
import {
  BufferGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Quaternion,
  RepeatWrapping,
  ShaderMaterial,
  Texture,
  Vector3,
} from "three";

const MainTower: FC<{
  options: any;
}> = ({ options }) => {
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
    recursiveMask2,
    recursiveMask3,
    hexTexture,
    matcap,
  ] = useKTX2([
    "/images/rails-mask.ktx2",
    "/images/walls-2.ktx2",
    "/images/windows.ktx2",
    "/images/pilars.ktx2",
    ...[0, 1, 2, 3].map((t) => `/images/mb${t}-walls-lightmap.ktx2`),
    ...[0, 1, 2, 3].map((t) => `/images/mb${t}-windows-lightmap.ktx2`),
    ...[0, 1, 2, 3].map((t) => `/images/mb${t}-pilars-lightmap.ktx2`),
    "/images/base-lightmap.ktx2",
    "/images/faces_2.ktx2",
    "/images/faces_3.ktx2",
    "/images/hex.ktx2",
    "/images/matcap.ktx2",
  ]);

  const {
    globalUniforms,
    assets: { textures },
  } = useMemo(() => {
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
      recursiveMask2.wrapT =
      recursiveMask2.wrapS =
      recursiveMask3.wrapT =
      recursiveMask3.wrapS =
      hexTexture.wrapT =
      hexTexture.wrapS =
        RepeatWrapping;
    wallsColor3.flipY =
      windowsColor0.flipY =
      windowsColor1.flipY =
      windowsColor2.flipY =
      windowsColor3.flipY =
      wallsColor0.flipY =
      wallsColor1.flipY =
      wallsColor2.flipY =
      wallsColor3.flipY =
      pillarsColor0.flipY =
      pillarsColor1.flipY =
      pillarsColor2.flipY =
      pillarsColor3.flipY =
      baseLightmap.flipY =
        false;

    const globalUniforms = {
      uProgress: {
        value: 0,
      },
      uAnimate: {
        value: true,
      },
      uAnimateUpFlag: {
        value: false,
      },
      uUseNoise: {
        value: true,
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
        value: new Color("#ffd0c3"),
      },
      uFlameBottomColor: {
        value: new Color("#ffa066"),
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
        value: new Color("#ffcebf"),
      },
      uBalconyBaseColorBottom: {
        value: new Color("#ff7c33"),
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
        recursiveMask2,
        recursiveMask3,
        hexTexture,
        matcap,
      },
    };

    return {
      globalUniforms,
      assets,
    };
  }, [
    baseLightmap,
    baseSides,
    buildingFloor,
    buildingWalls,
    hexTexture,
    matcap,
    pillars,
    pillarsColor0,
    pillarsColor1,
    pillarsColor2,
    pillarsColor3,
    railsMask,
    recursiveMask2,
    recursiveMask3,
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

  const ref = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null);
  useEffect(() => {
    ref.current?.translateX(objectData.objects[`mb${3}`][0][0][0]);
    ref.current?.translateY(objectData.objects[`mb${3}`][0][0][1]);
    ref.current?.translateZ(objectData.objects[`mb${3}`][0][0][2]);
    ref.current?.position.setY(ref.current?.position.y - 0.05);
    new Object({ ...ref.current }).hasOwnProperty("isBufferGeometry") &&
      ref.current?.applyQuaternion(
        new Quaternion(
          objectData.objects[`mb${3}`][0][1][0],
          objectData.objects[`mb${3}`][0][1][1],
          objectData.objects[`mb${3}`][0][1][2],
          objectData.objects[`mb${3}`][0][1][3]
        )
      );
    ref.current?.rotation.setFromQuaternion(
      new Quaternion(
        objectData.objects[`mb${3}`][0][1][0],
        objectData.objects[`mb${3}`][0][1][1],
        objectData.objects[`mb${3}`][0][1][2],
        objectData.objects[`mb${3}`][0][1][3]
      )
    );
    ref.current?.scale.set(
      objectData.objects[`mb${3}`][0][2][0],
      objectData.objects[`mb${3}`][0][2][1],
      objectData.objects[`mb${3}`][0][2][2]
    );
  }, []);



  const {
    progress
  } = useControls('Tower', {
    progress: {
      value: 0,
      min: 0,
      max: 1,
      step: 0.01
    }
  })

  useFrame(({clock}) => {
    if (!ref.current) return;
    ref.current.material.uniforms.uProgress.value = progress;
    ref.current.material.uniforms.uTime.value = clock.elapsedTime;
  })

  return (
    <group>
      {Object.keys(objectData.objects)
        .filter((obj) => obj.startsWith("mb"))
        .map((key, index) => {
          return (
            <Wall
              key={index}
              name={key.replace("mb", "")}
              index={index}
              mesh={(buildingWalls.scene.children[0] as Mesh).clone()}
              renderOrder={4 - index}
            >
              <WallMaterial
                options={options}
                hexTexture={textures.hexTexture}
                index={index}
                matcap={textures.matcap}
                meshName={key.replace("mb", "")}
                pillarsColor={[
                  textures.pillarsColor0,
                  textures.pillarsColor1,
                  textures.pillarsColor2,
                  textures.pillarsColor3,
                ]}
                railsMask={textures.railsMask}
                recursiveMask2={textures.recursiveMask2}
                repeatPillars={textures.repeatPillars}
                repeatWalls={textures.repeatWalls}
                repeatWindows={textures.repeatWindows}
                wallsColor={[
                  textures.wallsColor0,
                  textures.wallsColor1,
                  textures.wallsColor2,
                  textures.wallsColor3,
                ]}
                windowsColor={[
                  textures.windowsColor0,
                  textures.windowsColor1,
                  textures.windowsColor2,
                  textures.windowsColor3,
                ]}
              />
            </Wall>
          );
        })}
      <mesh
        ref={ref}
        geometry={
          (
            buildingFloor.scene.children[0].clone() as Mesh<
              BufferGeometry,
              MeshStandardMaterial
            >
          ).geometry
        }
        name={"3"}
      >
        <WallMaterial
          key={4}
          options={options}
          hexTexture={textures.hexTexture}
          index={3}
          matcap={textures.matcap}
          pillarsColor={[
            textures.pillarsColor0,
            textures.pillarsColor1,
            textures.pillarsColor2,
            textures.pillarsColor3,
          ]}
          railsMask={textures.railsMask}
          recursiveMask2={textures.recursiveMask2}
          repeatPillars={textures.repeatPillars}
          repeatWalls={textures.repeatWalls}
          repeatWindows={textures.repeatWindows}
          wallsColor={[
            textures.wallsColor0,
            textures.wallsColor1,
            textures.wallsColor2,
            textures.wallsColor3,
          ]}
          windowsColor={[
            textures.windowsColor0,
            textures.windowsColor1,
            textures.windowsColor2,
            textures.windowsColor3,
          ]}
          meshName="mb0"
        />
      </mesh>
    </group>
  );
};

const Wall: FC<{
  index: number;
  mesh: Mesh;
  name: string;
  renderOrder: number;
  children: ReactNode;
}> = ({
  children,
  index,
  mesh,
  name,
  renderOrder,
}) => {
  const ref = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null);
  useEffect(() => {
    ref.current?.translateX(objectData.objects[`mb${index}`][0][0][0]);
    ref.current?.translateY(objectData.objects[`mb${index}`][0][0][1]);
    ref.current?.translateZ(objectData.objects[`mb${index}`][0][0][2]);
    new Object({ ...ref.current }).hasOwnProperty("isBufferGeometry") &&
      ref.current?.applyQuaternion(
        new Quaternion(
          objectData.objects[`mb${index}`][0][1][0],
          objectData.objects[`mb${index}`][0][1][1],
          objectData.objects[`mb${index}`][0][1][2],
          objectData.objects[`mb${index}`][0][1][3]
        )
      );
    ref.current?.rotation.setFromQuaternion(
      new Quaternion(
        objectData.objects[`mb${index}`][0][1][0],
        objectData.objects[`mb${index}`][0][1][1],
        objectData.objects[`mb${index}`][0][1][2],
        objectData.objects[`mb${index}`][0][1][3]
      )
    );
    ref.current?.scale.set(
      objectData.objects[`mb${index}`][0][2][0],
      objectData.objects[`mb${index}`][0][2][1],
      objectData.objects[`mb${index}`][0][2][2]
    );
  }, [index]);

  const {
    progress
  } = useControls('Tower', {
    progress: {
      value: 0,
      min: 0,
      max: 1,
      step: 0.01
    }
  })

  useFrame(({clock}) => {
    if (!ref.current) return;
    ref.current.material.uniforms.uProgress.value = progress;
    ref.current.material.uniforms.uTime.value = clock.elapsedTime;
  })
  
  return (
    <mesh
      ref={ref}
      key={index}
      geometry={mesh.geometry}
      name={name.replace("mb", "")}
      renderOrder={renderOrder}
    >
      {children}
    </mesh>
  );
};

const WallMaterial: FC<{
  options: any;
  index: number;
  recursiveMask2: Texture;
  hexTexture: Texture;
  matcap: Texture;
  wallsColor: Texture[];
  railsMask: Texture;
  windowsColor: Texture[];
  pillarsColor: Texture[];
  repeatWalls: Texture;
  repeatWindows: Texture;
  repeatPillars: Texture;
  meshName: string;
}> = ({
  options,
  index,
  recursiveMask2,
  hexTexture,
  matcap,
  wallsColor,
  railsMask,
  windowsColor,
  pillarsColor,
  repeatWalls,
  repeatWindows,
  repeatPillars,
  meshName,
}) => {
  const { fogTweenValues } = useMemo(() => {
    const fogValues = {
      start: {
        uWorldFogColor: new Color(0),
        uFogNear_D: 0,
        uFogFar_D: 37,
        uFogStrength_D: 1,
        uFogNear_H: -15.2,
        uFogFar_H: -75,
        uFogStrength_H: 1,
        uFogStrength: 1,
        uWorldFogColorMix: 0.7065,
        lights: [
          {
            near: 0,
            far: 467.4,
            strength: 0,
            color: new Color(6179898),
            position: new Vector3(-190, 263, -258),
          },
          {
            near: 50,
            far: 869.6,
            strength: 1,
            color: new Color(12189953),
            position: new Vector3(-296, 20, -17),
          },
          {
            near: 16.9,
            far: 750,
            strength: 0,
            color: new Color(1052696),
            position: new Vector3(146, 6.7, -230),
          },
        ],
      },
      outsideBuilding: {
        uWorldFogColor: new Color(5111808),
        uFogNear_D: 23.91,
        uFogFar_D: 250,
        uFogStrength_D: 1,
        uFogNear_H: -47.8,
        uFogFar_H: -64.1,
        uFogStrength_H: 1,
        uFogStrength: 1,
        uWorldFogColorMix: 0.51,
        lights: [
          {
            near: 0,
            far: 369.6,
            strength: 1,
            color: new Color(16760111),
            position: new Vector3(-190, 50, -258),
          },
          {
            near: 50,
            far: 260.87,
            strength: 1,
            color: new Color(9043968),
            position: new Vector3(-296, 20, -17),
          },
          {
            near: 16.85,
            far: 288.04,
            strength: 1.304,
            color: new Color(0),
            position: new Vector3(146, 6.7, -230),
          },
        ],
      },
      insideBuilding: {
        uWorldFogColor: new Color(0),
        uFogNear_D: 10.87,
        uFogFar_D: 108.7,
        uFogStrength_D: 0.8478,
        uFogNear_H: -35.5,
        uFogFar_H: -68.1,
        uFogStrength_H: 1,
        uFogStrength: 1,
        uWorldFogColorMix: 1,
        lights: [
          {
            near: 0,
            far: 369.6,
            strength: 1,
            color: new Color(16773441),
            position: new Vector3(-190, 50, -258),
          },
          {
            near: 50,
            far: 260.87,
            strength: 1,
            color: new Color(9518607),
            position: new Vector3(-296, 20, -17),
          },
          {
            near: 16.85,
            far: 288.04,
            strength: 1.304,
            color: new Color(49528),
            position: new Vector3(146, 6.7, -230),
          },
        ],
      },
    };

    return {
      fogTweenValues: {
        0: fogValues.start,
        [0.12]: fogValues.outsideBuilding,
      },
    };
  }, []);

  const globalUniforms = useMemo(
    () => ({
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
      uEnableFog: {
        value: options.fogEnabled,
      },
      uColouredMaterials: {
        value: !1,
      },
      volumetricLights: {
        value: [...fogTweenValues[0].lights],
      },
      uFogNear_D: {
        value: fogTweenValues[0].uFogNear_D,
      },
      uFogFar_D: {
        value: fogTweenValues[0].uFogFar_D,
      },
      uFogStrength_D: {
        value: fogTweenValues[0].uFogStrength_D,
      },
      uFogNear_H: {
        value: fogTweenValues[0].uFogNear_H,
      },
      uFogFar_H: {
        value: fogTweenValues[0].uFogFar_H,
      },
      uFogStrength_H: {
        value: fogTweenValues[0].uFogStrength_H,
      },
      uFogStrength: {
        value: fogTweenValues[0].uFogStrength,
      },
      uWorldFogColor: {
        value: fogTweenValues[0].uWorldFogColor,
      },
      uWorldFogColorMix: {
        value: fogTweenValues[0].uWorldFogColorMix,
      },
      uDebugFog: {
        value: !1,
      },
    }),
    [fogTweenValues, options.fogEnabled]
  );

  const { uniforms } = useMemo(
    () => ({
      uniforms: {
        ...globalUniforms,
        uTime: {
          value: 0,
        },
        uAnimate: {
          value: null,
        },
        uAnimateUp: {
          value: null,
        },
        uUseNoise: {
          value: !0,
        },
        tRecText: {
          value: recursiveMask2,
        },
        tHexText: {
          value: hexTexture,
        },
        tMatCap: {
          value: matcap,
        },
        tWallsTex: {
          value: wallsColor[index] || wallsColor[0],
        },
        tRailsTex: {
          value: null,
        },
        tRailsMaskTex: {
          value: railsMask,
        },
        tWindowsTex: {
          value: windowsColor[index] || windowsColor[0],
        },
        tPillarsTex: {
          value: pillarsColor[index] || pillarsColor[0],
        },
        tRepeatedTexWalls: {
          value: repeatWalls,
        },
        tRepeatedTexRails: {
          value: null,
        },
        tRepeatedTexWindows: {
          value: repeatWindows,
        },
        tRepeatedTexPillars: {
          value: repeatPillars,
        },
        uFloorIndex: {
          value: `${meshName}`,
        },
      },
    }),
    [
      globalUniforms,
      hexTexture,
      index,
      matcap,
      meshName,
      pillarsColor,
      railsMask,
      recursiveMask2,
      repeatPillars,
      repeatWalls,
      repeatWindows,
      wallsColor,
      windowsColor,
    ]
  );
  const lightCount = globalUniforms.volumetricLights.value.length;
  const fogDefines = {
    NUM_V_LIGHTS: lightCount,
  };
  return (
    <shaderMaterial
      key={index}
      uniforms={uniforms}
      defines={fogDefines}
      vertexShader={towerVertexShader}
      fragmentShader={towerFragmentShader}
      transparent={false}
      side={2}
      blending={5}
      blendEquation={100}
      blendSrc={204}
      blendDst={205}
    />
  );
};

export default MainTower;
