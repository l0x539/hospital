import { fogFragmentShader } from "@/shaders/fragmantShaders";
import { fogVertexShader } from "@/shaders/vertexShaders";
import { objectData } from "@/utils/constants";
import { useGLTF, useKTX2 } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { useSearchParams } from "next/navigation";
import { FC, useEffect, useMemo, useRef } from "react";
import { BufferGeometry, Color, FrontSide, Mesh, MeshBasicMaterial, Quaternion, ShaderMaterial, Vector3 } from "three";

const WorldFloor: FC<{
  options: any
}> = ({options}) => {
  const floor = useGLTF('/models/floor.glb');
  const floorTexture = useKTX2('/images/floor-lightmap.ktx2');
  
  const {fogTweenValues} = useMemo(() => {
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
    return {
      fogTweenValues: {
        0: fogValues.start,
        [.12]: fogValues.outsideBuilding
      }
    }
  }, [])

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

  const lightCount = globalUniforms.volumetricLights.value.length;
  const fogDefines = {
    NUM_V_LIGHTS: lightCount
  }

  const mesh = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null);

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
  const searchParams = useSearchParams();

  useEffect(() => {
    mesh.current?.translateX(objectData.objects.floor[0][0][0])
    mesh.current?.translateY(objectData.objects.floor[0][0][1])
    mesh.current?.translateZ(objectData.objects.floor[0][0][2])
    new Object({...mesh.current}).hasOwnProperty('isBufferGeometry') && mesh.current?.applyQuaternion(new Quaternion(objectData.objects.floor[0][1][0], objectData.objects.floor[0][1][1], objectData.objects.floor[0][1][2], objectData.objects.floor[0][1][3]))
    mesh.current?.rotation.setFromQuaternion(new Quaternion(objectData.objects.floor[0][1][0], objectData.objects.floor[0][1][1], objectData.objects.floor[0][1][2], objectData.objects.floor[0][1][3]))
    mesh.current?.scale.set(objectData.objects.floor[0][2][0], objectData.objects.floor[0][2][1], objectData.objects.floor[0][2][2])
  }, []);

  useFrame(() => {
    if (!mesh.current) return;

    if (searchParams.has("controls")) {
      mesh.current.material.uniforms.uColor.value = {
        r: fogColor.r / 255,
        g: fogColor.g / 255,
        b: fogColor.b / 255,
      };
      mesh.current.material.uniforms.uWorldFogColor.value = {
        r: uWorldFogColor.r / 255,
        g: uWorldFogColor.g / 255,
        b: uWorldFogColor.b / 255,
      };

      mesh.current.material.uniforms.uWorldFogColor.value = {
        r: uWorldFogColor.r / 255,
        g: uWorldFogColor.g / 255,
        b: uWorldFogColor.b / 255,
      };

      mesh.current.material.uniforms.volumetricLights.value[0].color = {
        r: lights1.r / 255,
        g: lights1.g / 255,
        b: lights1.b / 255,
      };

      mesh.current.material.uniforms.volumetricLights.value[1].color = {
        r: lights2.r / 255,
        g: lights2.g / 255,
        b: lights2.b / 255,
      };

      mesh.current.material.uniforms.volumetricLights.value[2].color = {
        r: lights3.r / 255,
        g: lights3.g / 255,
        b: lights3.b / 255,
      };

    }
  });

  return <mesh
    ref={mesh}
    geometry={(floor.scene.children[0] as Mesh<BufferGeometry, MeshBasicMaterial>).geometry}>
    <shaderMaterial 
       uniforms={{
        ...globalUniforms,
        uProgress: {
            value: null
        },
        uColor: {
            value: null
        },
        uTexture: {
            value: floorTexture
        },
        uRepeatTexture: {
            value: null
        }
      }}
      defines={{
        ...fogDefines,
        USE_TEXTURE: true,
        IS_PILLARS: false
      }}
      vertexShader={fogVertexShader}
      fragmentShader={fogFragmentShader}
      side={FrontSide}
    />
  </mesh>;
};

export default WorldFloor;