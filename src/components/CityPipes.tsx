import { selectGl } from "@/features/gl/glSlice";
import { useAppSelector } from "@/hooks";
import { cityPipesFragmentShader, pipesFragmentShader } from "@/shaders/fragmantShaders";
import { cityPipeVertexShader, pipesVertexShader } from "@/shaders/vertexShaders";
import { objectData } from "@/utils/constants"
import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import { useSearchParams } from "next/navigation";
import { FC, ReactNode, useEffect, useMemo, useRef } from "react"
import { Color, MathUtils, Object3D, Quaternion, ShaderMaterial, Vector2, Vector3 } from "three";
import { Line2, LineGeometry, LineMaterial } from "three-stdlib";
import { config, useSpring, easings } from "@react-spring/three";
import gsap from "gsap";

const applyObjectDataToObjectProps = (
  mesh: Object3D,
  dataKey: string,
  index: number
) => {
  
  mesh.position.set(
    objectData[dataKey][index][0][0],
    objectData[dataKey][index][0][1],
    objectData[dataKey][index][0][2]
  );
  
  mesh?.rotation.setFromQuaternion(
    new Quaternion(
      objectData[dataKey][index][1][0],
      objectData[dataKey][index][1][1],
      objectData[dataKey][index][1][2],
      objectData[dataKey][index][1][3]
    )
  );
  
  mesh.scale.set(
    objectData[dataKey][index][2][0],
    objectData[dataKey][index][2][1],
    objectData[dataKey][index][2][2]
  );

  return mesh;
};

const CityPipes: FC<{
  options: any;
}> = ({
  options
}) => {

  const {
    vectors,
    instanceDummy
  } = useMemo(() => {
    const paths: {
      [value: string]: any[];
    } = Object.keys(objectData.paths)
    .filter(path => path.startsWith("pip-city"))
    .sort((path, nextPath) => parseInt(path.replace('pip', ''))-parseInt(nextPath.replace('pip', '')))
    .reduce((prevPath, path) => ({
      ...prevPath,
      [path]: objectData.paths[path]
    }), {});
    
    const vectors: {
      [value: string]: any;
    } = Object.keys(paths).reduce((prev, path) => {
      return {
        ...prev,
        [path.replace("pip-", "").concat("-temp")]: paths[path].slice(0, -1).map((_, index) => {
          return paths[path][index].map((_: any, subIndex: number) => {
            const vec3 = paths[path][index][subIndex];
            return new Vector3(vec3[0],vec3[1],vec3[2])
          })
        })
      }
    }, {});
    const instanceDummy = new Object3D;
    return {
      vectors,
      instanceDummy
    }
  }, [])

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
      uColor: {
        value: null
      },
      uTexture: {
          value: null
      },
      uRepeatTexture: {
          value: null
      }
    }),
    [fogTweenValues, options.fogEnabled]
  );

  const {gl} = useThree();

  return <>
    {Object.keys(objectData).filter((p) => p.startsWith('city')).reduce((prev: any[], dataKey: string, index: number) => {
      const cityDataLength = Object.keys(objectData[dataKey]).length;
      return [...prev, ...Object.keys(objectData[dataKey]).map((_, index) => {
        applyObjectDataToObjectProps(instanceDummy, dataKey, index);
        const section = objectData[dataKey][index][3].section;
        instanceDummy.updateMatrix();
        const startOffset = .2 * MathUtils.seededRandom(section);
        const speed = .5 * (MathUtils.seededRandom(section) + 1);
        
        return vectors[dataKey.concat("-temp")].reduce((prev: ReactNode[], _: any, vIndex: number) => {
          const geoBuffer = vectors[dataKey.concat("-temp")][vIndex].reduce((prev: number[], vec3: Vector3) => {
            const v3 = vec3.clone();
            v3.applyMatrix4(instanceDummy.matrix)
            return [...prev, v3.x, v3.y, v3.z];
          }, []);

          return [...prev, <PipeLine globalUniforms={globalUniforms} index={`${index}-${vIndex}`} options={options} key={`${index}-${vIndex}`} bufferArray={geoBuffer} speed={speed} startOffset={startOffset} section={section} />]
        }, [])
      })]
    }, [])}
  </>  
}

const PipeLine: FC<{
  bufferArray: number[];
  index: string;
  options: any;
  globalUniforms: {
    [value: string]: {
      value: any;
    };
  };
  startOffset: number;
  speed: number;
  section: number;
}> = ({
  bufferArray,
  index,
  options,
  globalUniforms,
  startOffset,
  speed,
  section
}) => {
  const ref = useRef<Line2>(null);

  const {
    v2
  } = useMemo(() => {
    return {
      v2: new Vector2
    }
  }, [])

  const {gl, scene} = useThree();

  const {
    progress
  } = useControls('CityPipes', {
    progress: {
      value: 0,
      min: 0,
      max: 2,
      step: 0.01
    }
  });

  const globalUniforms1 = useMemo(() => ({
    uProgress: {
          value: 0
    },
    uGradientSpread: {
      value: .03
    },
    linewidth: {
      value: .06
    },
    uBlendFrequency: {
      value: 20
    },
    uBlendSpeed: {
      value: 1.8
    }
  }), [])

  const uniforms = useMemo(() => ({
    uColor1: options.pipes.uColor1,
    uColor2: options.pipes.uColor2,
    uColMultiply: {
      value: 1
    },
    resolution: {
        value: v2
    },
    uSpeed: {
        value: speed
    },
    uStartOffset: {
        value: startOffset
    },
    uSection: {
        value: section
    }
  }), [options.pipes.uColor1, options.pipes.uColor2, section, speed, startOffset, v2]);

  useEffect(() => {
    const lightCount = globalUniforms.volumetricLights.value.length;
    const fogDefines = {
      NUM_V_LIGHTS: lightCount,
    };
    gl.getSize(v2);

    const defines = {
      WORLD_UNITS: ""
    };
    const lineGeo = new LineGeometry;
    lineGeo.setPositions(bufferArray);
    const path = new Line2(lineGeo, new ShaderMaterial({
      vertexShader: cityPipeVertexShader,
      fragmentShader: cityPipesFragmentShader,
      uniforms: {
        ...globalUniforms,
        uTime: {
          value: 0
        },
        vertexColors: {
            value: false
        },
        worldUnits: {
            value: true
        },
        dashed: {
            value: false
        },
        dashScale: {
            value: 1
        },
        dashSize: {
            value: 1
        },
        dashOffset: {
            value: 0
        },
        gapSize: {
            value: 1
        },
        opacity: {
            value: 1
        },
        ...globalUniforms1,
        ...uniforms
      },
  
      defines:
        {
          ...fogDefines,
          ...defines
        },
      transparent: false,
      blendDst: 205,
      blendSrc: 204,
      blendEquation: 100,
      blending: 5,
      }) as LineMaterial
    );

    scene.add(path);
    (ref.current as any) = path;
  }, [bufferArray, gl, globalUniforms, globalUniforms1, options.pipes.uColor1, options.pipes.uColor2, scene, uniforms, v2]);

  const searchParams = useSearchParams();
  const {progress: scrollProgress} = useAppSelector(selectGl);

  const props = useSpring({
    springProgress: scrollProgress,
    config: {
      easing: easings.easeInBack,
    },
  });;

  useFrame(({clock}) => {
    if (!ref.current) return;
      ref.current.material.uniforms.uTime.value = clock.getElapsedTime();
    if (searchParams.has('controls'))
      ref.current.material.uniforms.uProgress.value = progress;
    else {
      ref.current.material.uniforms.uProgress.value = props.springProgress.get();
    }

    
  })

  return <></>
}

export default CityPipes;