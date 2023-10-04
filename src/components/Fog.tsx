import { fogFragmentShader } from "@/shaders/fragmantShaders";
import { fogVertexShader } from "@/shaders/vertexShaders";
import { useFrame } from "@react-three/fiber";
import { FC, useMemo, useRef } from "react";
import { BackSide, Color, FrontSide, Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from "three";

// TODO: add fog tween tansition (buildFogTween & buildInsideFogTween)

const Fog: FC<{
  options: any
}> = ({options}) => {



  const {
    fogTweenValues
  } = useMemo(() => {
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
        uWorldFogColorMix: .7065,
        lights: [{
            near: 0,
            far: 467.4,
            strength: 0,
            color: new Color(6179898),
            position: new Vector3(-190,263,-258)
        }, {
            near: 50,
            far: 869.6,
            strength: 1,
            color: new Color(12189953),
            position: new Vector3(-296,20,-17)
        }, {
            near: 16.9,
            far: 750,
            strength: 0,
            color: new Color(1052696),
            position: new Vector3(146,6.7,-230)
        }]
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
        uWorldFogColorMix: .51,
        lights: [{
            near: 0,
            far: 369.6,
            strength: 1,
            color: new Color(16760111),
            position: new Vector3(-190,50,-258)
        }, {
            near: 50,
            far: 260.87,
            strength: 1,
            color: new Color(9043968),
            position: new Vector3(-296,20,-17)
        }, {
            near: 16.85,
            far: 288.04,
            strength: 1.304,
            color: new Color(0),
            position: new Vector3(146,6.7,-230)
        }]
    },
    insideBuilding: {
        uWorldFogColor: new Color(0),
        uFogNear_D: 10.87,
        uFogFar_D: 108.7,
        uFogStrength_D: .8478,
        uFogNear_H: -35.5,
        uFogFar_H: -68.1,
        uFogStrength_H: 1,
        uFogStrength: 1,
        uWorldFogColorMix: 1,
        lights: [{
            near: 0,
            far: 369.6,
            strength: 1,
            color: new Color(16773441),
            position: new Vector3(-190,50,-258)
        }, {
            near: 50,
            far: 260.87,
            strength: 1,
            color: new Color(9518607),
            position: new Vector3(-296,20,-17)
        }, {
            near: 16.85,
            far: 288.04,
            strength: 1.304,
            color: new Color(49528),
            position: new Vector3(146,6.7,-230)
        }]
      }
    };

    return ({
    fogTweenEndPoint: .12,
    activeInsideFogTween: 1,
    allowInvalidate: false,
    fogValues,
    fogTweenValues: {
      0: fogValues.start,
      [.12]: fogValues.outsideBuilding
    },
    insideFogTweenPoints: [[.15, .264], [.38, .514], [.628, .775]]
  })}, []);

  const globalUniforms = useMemo(() => ({
    uEnableFog: {
        value: options.fogEnabled
    },
    uColouredMaterials: {
        value: !1
    },
    volumetricLights: {
        value: [...fogTweenValues[0].lights]
    },
    uFogNear_D: {
        value: fogTweenValues[0].uFogNear_D
    },
    uFogFar_D: {
        value: fogTweenValues[0].uFogFar_D
    },
    uFogStrength_D: {
        value: fogTweenValues[0].uFogStrength_D
    },
    uFogNear_H: {
        value: fogTweenValues[0].uFogNear_H
    },
    uFogFar_H: {
        value: fogTweenValues[0].uFogFar_H
    },
    uFogStrength_H: {
        value: fogTweenValues[0].uFogStrength_H
    },
    uFogStrength: {
        value: fogTweenValues[0].uFogStrength
    },
    uWorldFogColor: {
        value: fogTweenValues[0].uWorldFogColor
    },
    uWorldFogColorMix: {
        value: fogTweenValues[0].uWorldFogColorMix
    },
    uDebugFog: {
        value: !1
    }
  }), [fogTweenValues, options.fogEnabled]);

  return <group > {/** visible={options.lightHelpersEnabled} */}
    <LightsHelper globalUniforms={globalUniforms} />
    <Sky globalUniforms={globalUniforms} />
  </group>;
}

const Sky: FC<{
  globalUniforms: {
    [value: string]: any;
  }
}> = ({globalUniforms}) => {
  const lightCount = globalUniforms.volumetricLights.value.length;
  const fogDefines = {
    NUM_V_LIGHTS: lightCount
  }

  return <mesh scale={500} renderOrder={-1} position={[0, 249, 0]} >
    <boxGeometry />
    <shaderMaterial
      uniforms={{
        ...globalUniforms,
        uProgress: {
            value: null
        },
        uColor: {
            value: new Color(0)
        },
        uTexture: {
            value: null
        },
        uRepeatTexture: {
            value: null
        }
      }}
      defines={{
        ...fogDefines,
        IS_PILLARS: false
      }}
      vertexShader={fogVertexShader}
      fragmentShader={fogFragmentShader}
      side={BackSide}
      depthWrite={false}
    />
  </mesh>
}

const LightsHelper: FC<{
  globalUniforms: {
    [value: string]: any
  }
}> = ({globalUniforms}) => {
  const lightCount = globalUniforms.volumetricLights.value.length;

  return <group>
    {Array.from({length: lightCount}).map((_, index) => {
      return <mesh key={index} position={globalUniforms.volumetricLights.value[index].position} >
        <sphereGeometry args={[5, 6, 6]} />
        <meshBasicMaterial wireframe color={globalUniforms.volumetricLights.value[index].color} />
        <mesh rotation={[0, 90 * Math.PI / 180, 0]}>
          <sphereGeometry args={[5, 6, 6]} />
          <meshBasicMaterial wireframe color={globalUniforms.volumetricLights.value[index].color} />
        </mesh>
      </mesh>
    })}
  </group>;
}

export default Fog;