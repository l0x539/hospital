import { selectGl } from "@/features/gl/glSlice";
import { useAppSelector } from "@/hooks";
import { fogFragmentShader } from "@/shaders/fragmantShaders";
import { fogVertexShader } from "@/shaders/vertexShaders";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { FC, useMemo, useRef } from "react";
import {
  BackSide,
  BoxGeometry,
  Color,
  FrontSide,
  Mesh,
  MeshBasicMaterial,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { config, useSpring, easings } from "@react-spring/three";
import gsap from "gsap";
import { fogValues } from "@/utils/constants";
import { useSearchParams } from "next/navigation";

// TODO: add fog tween tansition (buildFogTween & buildInsideFogTween)

const Fog: FC<{
  options: any;
}> = ({ options }) => {
  const { fogTweenValues, insideFogTweenPoints } = useMemo(() => {
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
            color: new Color("#5e4c3a"),
            position: new Vector3(-190, 263, -258),
          },
          {
            near: 50,
            far: 869.6,
            strength: 1,
            color: new Color("#ba0101"),
            position: new Vector3(-296, 20, -17),
          },
          {
            near: 16.9,
            far: 750,
            strength: 0,
            color: new Color("#101018"),
            position: new Vector3(146, 6.7, -230),
          },
        ],
      },
      outsideBuilding: {
        uWorldFogColor: new Color("#4e0000"),
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
      fogTweenEndPoint: 0.12,
      activeInsideFogTween: true,
      allowInvalidate: false,
      fogValues,
      fogTweenValues: {
        0: fogValues.start,
        [0.12]: fogValues.outsideBuilding,
      },
      insideFogTweenPoints: [
        [0.15, 0.264],
        [0.38, 0.514],
        [0.628, 0.775],
      ],
    };
  }, []);

  const globalUniforms = useMemo(
    () => ({
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

  const { insideFogTween, fogTweenEndPoint, fogTween, activeInsideFogTween } =
    useMemo(() => {
      const insideFogTween = gsap
        .timeline({
          paused: !0,
          defaults: {
            duration: 0.5,
            ease: "sine.inOut",
          },
        })
        .to(
          globalUniforms.uWorldFogColor.value,
          {
            r: fogValues.insideBuilding.uWorldFogColor.r,
            g: fogValues.insideBuilding.uWorldFogColor.g,
            b: fogValues.insideBuilding.uWorldFogColor.b,
          },
          0
        )
        .to(
          globalUniforms.uFogNear_D,
          {
            value: fogValues.insideBuilding.uFogNear_D,
          },
          0
        )
        .to(
          globalUniforms.uFogFar_D,
          {
            value: fogValues.insideBuilding.uFogFar_D,
          },
          0
        )
        .to(
          globalUniforms.uFogStrength_D,
          {
            value: fogValues.insideBuilding.uFogStrength_D,
          },
          0
        )
        .to(
          globalUniforms.uFogNear_H,
          {
            value: fogValues.insideBuilding.uFogNear_H,
          },
          0
        )
        .to(
          globalUniforms.uFogFar_H,
          {
            value: fogValues.insideBuilding.uFogFar_H,
          },
          0
        )
        .to(
          globalUniforms.uFogStrength_H,
          {
            value: fogValues.insideBuilding.uFogStrength_H,
          },
          0
        )
        .to(
          globalUniforms.uFogStrength,
          {
            value: fogValues.insideBuilding.uFogStrength,
          },
          0
        )
        .to(
          globalUniforms.uWorldFogColorMix,
          {
            value: fogValues.insideBuilding.uWorldFogColorMix,
          },
          0
        )
        .to(
          globalUniforms.uWorldFogColor.value,
          {
            r: fogValues.outsideBuilding.uWorldFogColor.r,
            g: fogValues.outsideBuilding.uWorldFogColor.g,
            b: fogValues.outsideBuilding.uWorldFogColor.b,
          },
          0.5
        )
        .to(
          globalUniforms.uFogNear_D,
          {
            value: fogValues.outsideBuilding.uFogNear_D,
          },
          0.5
        )
        .to(
          globalUniforms.uFogFar_D,
          {
            value: fogValues.outsideBuilding.uFogFar_D,
          },
          0.5
        )
        .to(
          globalUniforms.uFogStrength_D,
          {
            value: fogValues.outsideBuilding.uFogStrength_D,
          },
          0.5
        )
        .to(
          globalUniforms.uFogNear_H,
          {
            value: fogValues.outsideBuilding.uFogNear_H,
          },
          0.5
        )
        .to(
          globalUniforms.uFogFar_H,
          {
            value: fogValues.outsideBuilding.uFogFar_H,
          },
          0.5
        )
        .to(
          globalUniforms.uFogStrength_H,
          {
            value: fogValues.outsideBuilding.uFogStrength_H,
          },
          0.5
        )
        .to(
          globalUniforms.uFogStrength,
          {
            value: fogValues.outsideBuilding.uFogStrength,
          },
          0.5
        )
        .to(
          globalUniforms.uWorldFogColorMix,
          {
            value: fogValues.outsideBuilding.uWorldFogColorMix,
          },
          0.5
        );

      const fogTweenEndPoint = 0.12;
      const activeInsideFogTween = 1;
      const fogTween = gsap
        .timeline({
          paused: !0,
          defaults: {
            duration: 1,
            ease: "sine.inOut",
          },
        })
        .fromTo(
          globalUniforms.uWorldFogColor.value,
          {
            r: fogTweenValues[0].uWorldFogColor.r,
            g: fogTweenValues[0].uWorldFogColor.g,
            b: fogTweenValues[0].uWorldFogColor.b,
          },
          {
            r: fogTweenValues[fogTweenEndPoint].uWorldFogColor.r,
            g: fogTweenValues[fogTweenEndPoint].uWorldFogColor.g,
            b: fogTweenValues[fogTweenEndPoint].uWorldFogColor.b,
          },
          0
        )
        .fromTo(
          globalUniforms.uFogNear_D,
          {
            value: fogTweenValues[0].uFogNear_D,
          },
          {
            value: fogTweenValues[fogTweenEndPoint].uFogNear_D,
          },
          0
        )
        .fromTo(
          globalUniforms.uFogFar_D,
          {
            value: fogTweenValues[0].uFogFar_D,
          },
          {
            value: fogTweenValues[fogTweenEndPoint].uFogFar_D,
          },
          0
        )
        .fromTo(
          globalUniforms.uFogStrength_D,
          {
            value: fogTweenValues[0].uFogStrength_D,
          },
          {
            value: fogTweenValues[fogTweenEndPoint].uFogStrength_D,
          },
          0
        )
        .fromTo(
          globalUniforms.uFogNear_H,
          {
            value: fogTweenValues[0].uFogNear_H,
          },
          {
            value: fogTweenValues[fogTweenEndPoint].uFogNear_H,
          },
          0
        )
        .fromTo(
          globalUniforms.uFogFar_H,
          {
            value: fogTweenValues[0].uFogFar_H,
          },
          {
            value: fogTweenValues[fogTweenEndPoint].uFogFar_H,
          },
          0
        )
        .fromTo(
          globalUniforms.uFogStrength_H,
          {
            value: fogTweenValues[0].uFogStrength_H,
          },
          {
            value: fogTweenValues[fogTweenEndPoint].uFogStrength_H,
          },
          0
        )
        .fromTo(
          globalUniforms.uFogStrength,
          {
            value: fogTweenValues[0].uFogStrength,
          },
          {
            value: fogTweenValues[fogTweenEndPoint].uFogStrength,
          },
          0
        )
        .fromTo(
          globalUniforms.uWorldFogColorMix,
          {
            value: fogTweenValues[0].uWorldFogColorMix,
          },
          {
            value: fogTweenValues[fogTweenEndPoint].uWorldFogColorMix,
          },
          0
        );
      for (let t = 0; t < fogTweenValues[0].lights.length; t++) {
        const e = fogTweenValues[0].lights[t],
          n = fogTweenValues[fogTweenEndPoint].lights[t];
        fogTween.fromTo(
          globalUniforms.volumetricLights.value[t],
          {
            near: e.near,
            far: e.far,
            strength: e.strength,
          },
          {
            near: n.near,
            far: n.far,
            strength: n.strength,
          },
          0
        ),
          fogTween.fromTo(
            globalUniforms.volumetricLights.value[t].color,
            {
              r: e.color.r,
              g: e.color.g,
              b: e.color.b,
            },
            {
              r: n.color.r,
              g: n.color.g,
              b: n.color.b,
            },
            0
          ),
          fogTween.fromTo(
            globalUniforms.volumetricLights.value[t].position,
            {
              x: e.position.x,
              y: e.position.y,
              z: e.position.z,
            },
            {
              x: n.position.x,
              y: n.position.y,
              z: n.position.z,
            },
            0
          );
      }

      return {
        insideFogTween,
        fogTweenEndPoint,
        fogTween,
        activeInsideFogTween,
      };
    }, [
      fogTweenValues,
      globalUniforms.uFogFar_D,
      globalUniforms.uFogFar_H,
      globalUniforms.uFogNear_D,
      globalUniforms.uFogNear_H,
      globalUniforms.uFogStrength,
      globalUniforms.uFogStrength_D,
      globalUniforms.uFogStrength_H,
      globalUniforms.uWorldFogColor.value,
      globalUniforms.uWorldFogColorMix,
      globalUniforms.volumetricLights.value,
    ]);

  const props = useSpring({
    springProgress: options.scrollPosition,
    config: {
      easing: easings.easeInBack,
    },
  });

  useFrame(() => {
    fogTween.progress(props.springProgress.get() / fogTweenEndPoint);
    let activeInsideFogTweenUpdated = activeInsideFogTween;
    props.springProgress.get() >= insideFogTweenPoints[0][0] - 0.05 &&
    props.springProgress.get() <= insideFogTweenPoints[0][1] + 0.05
      ? ((activeInsideFogTweenUpdated = 0),
        insideFogTween.progress(
          (props.springProgress.get() - insideFogTweenPoints[0][0]) /
            (insideFogTweenPoints[0][1] - insideFogTweenPoints[0][0])
        ))
      : props.springProgress.get() >= insideFogTweenPoints[1][0] - 0.05 &&
        props.springProgress.get() <= insideFogTweenPoints[1][1] + 0.05
      ? ((activeInsideFogTweenUpdated = 1),
        insideFogTween.progress(
          (props.springProgress.get() - insideFogTweenPoints[1][0]) /
            (insideFogTweenPoints[1][1] - insideFogTweenPoints[1][0])
        ))
      : props.springProgress.get() >= insideFogTweenPoints[2][0] - 0.05 &&
        props.springProgress.get() <= insideFogTweenPoints[2][1] + 0.05
      ? ((activeInsideFogTweenUpdated = 2),
        insideFogTween.progress(
          (props.springProgress.get() - insideFogTweenPoints[2][0]) /
            (insideFogTweenPoints[2][1] - insideFogTweenPoints[2][0])
        ))
      : (activeInsideFogTweenUpdated = 0),
      activeInsideFogTweenUpdated !== activeInsideFogTweenUpdated &&
        insideFogTween.invalidate();
  });

  /** visible={options.lightHelpersEnabled} */
  return (
    <group>
      <LightsHelper globalUniforms={globalUniforms} />
      <Sky globalUniforms={globalUniforms} />
    </group>
  );
};

const Sky: FC<{
  globalUniforms: {
    [value: string]: any;
  };
}> = ({ globalUniforms }) => {
  const ref = useRef<Mesh<BoxGeometry, ShaderMaterial>>(null);
  const lightCount = globalUniforms.volumetricLights.value.length;
  const fogDefines = {
    NUM_V_LIGHTS: lightCount,
  };
  const searchParams = useSearchParams();

  const { 
    fogColor,
    uWorldFogColor,
    lights1,
    lights2,
    lights3
  } = useControls("Fog", {
    fogColor: {
      r: 255,
      g: 255,
      b: 255,
    },
    uWorldFogColor: {
      r: 0x4e,
      g: 0,
      b: 0,
    },
    lights1: {
      r: 0x5e,
      g: 0x4c,
      b: 0x3a
    },
    lights2: {
      r: 0xba,
      g: 0x01,
      b: 0x01
    },
    lights3: {
      r: 0x10,
      g: 0x10,
      b: 0x18
    }
  });

  useFrame(() => {
    if (!ref.current) return;

    if (searchParams.has("controls")) {
      ref.current.material.uniforms.uColor.value = {
        r: fogColor.r / 255,
        g: fogColor.g / 255,
        b: fogColor.b / 255,
      };
      ref.current.material.uniforms.uWorldFogColor.value = {
        r: uWorldFogColor.r / 255,
        g: uWorldFogColor.g / 255,
        b: uWorldFogColor.b / 255,
      };

      ref.current.material.uniforms.uWorldFogColor.value = {
        r: uWorldFogColor.r / 255,
        g: uWorldFogColor.g / 255,
        b: uWorldFogColor.b / 255,
      };

      ref.current.material.uniforms.volumetricLights.value[0].color = {
        r: lights1.r / 255,
        g: lights1.g / 255,
        b: lights1.b / 255,
      };

      ref.current.material.uniforms.volumetricLights.value[1].color = {
        r: lights2.r / 255,
        g: lights2.g / 255,
        b: lights2.b / 255,
      };

      ref.current.material.uniforms.volumetricLights.value[2].color = {
        r: lights3.r / 255,
        g: lights3.g / 255,
        b: lights3.b / 255,
      };

    }
  });

  return (
    <mesh ref={ref} scale={500} renderOrder={-1} position={[0, 249, 0]}>
      <boxGeometry />
      <shaderMaterial
        uniforms={{
          ...globalUniforms,
          uProgress: {
            value: 0,
          },
          uColor: {
            value: new Color(0),
          },
          uTexture: {
            value: null,
          },
          uRepeatTexture: {
            value: null,
          },
        }}
        defines={{
          ...fogDefines,
          IS_PILLARS: false,
        }}
        vertexShader={fogVertexShader}
        fragmentShader={fogFragmentShader}
        side={BackSide}
        depthWrite={false}
      />
    </mesh>
  );
};

const LightsHelper: FC<{
  globalUniforms: {
    [value: string]: any;
  };
}> = ({ globalUniforms }) => {
  const lightCount = globalUniforms.volumetricLights.value.length;

  return (
    <group>
      {lightCount > 0 ? (
        Array.from({ length: lightCount }).map((_, index) => {
          return (
            <mesh
              key={index}
              position={globalUniforms.volumetricLights.value[index].position}
            >
              <sphereGeometry args={[5, 6, 6]} />
              <meshBasicMaterial
                wireframe
                color={globalUniforms.volumetricLights.value[index].color}
              />
              <mesh rotation={[0, (90 * Math.PI) / 180, 0]}>
                <sphereGeometry args={[5, 6, 6]} />
                <meshBasicMaterial
                  wireframe
                  color={globalUniforms.volumetricLights.value[index].color}
                />
              </mesh>
            </mesh>
          );
        })
      ) : (
        <></>
      )}
    </group>
  );
};

export default Fog;
