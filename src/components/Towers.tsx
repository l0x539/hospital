import { towersFragmentShafer } from "@/shaders/fragmantShaders";
import { towersVertexShader } from "@/shaders/vertexShaders";
import { globalLights, objectData } from "@/utils/constants";
import { useGLTF, useKTX2 } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AddEquation,
  BufferGeometry,
  Color,
  CustomBlending,
  InstancedBufferAttribute,
  InstancedMesh,
  MathUtils,
  Mesh,
  NoBlending,
  Object3D,
  OneMinusSrcAlphaFactor,
  Quaternion,
  RepeatWrapping,
  ShaderMaterial,
  SrcAlphaFactor,
  Texture,
  Vector3,
} from "three";

const Towers = () => {
  const [
    {scene: {children: [city0]}},
    {scene: {children: [city1]}},
    {scene: {children: [city2]}},
  ] = useGLTF([
    ...Array.from({ length: 3 }).map((_, index) => `/models/city${index}.glb`),
  ]);

  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    return () => {
      setAnimated(false);
    };
  }, []);

  const [
    city0Texture0,
    city0Texture1,
    city0Texture2,
    city0Texture3,
    city1Texture0,
    city1Texture1,
    city1Texture2,
    city1Texture3,
    city2Texture0,
    city2Texture1,
    city2Texture2,
    city2Texture3,
    railCity0,
    railCity1,
    railCity2,
    repeatWalls,
    recursiveMask2,
    hexTexture,
    matcap,
  ] = useKTX2([
    ...(Array.from({ length: 3 }).reduce(
      (prev: string[], _, indexTower) => [
        ...prev,
        ...Array.from({ length: 4 }).map(
          (_, index) => `/images/city${indexTower}-b${index}-lightmap.ktx2`
        ),
      ],
      []
    )),
    ...Array.from({ length: 3 }).map(
      (_, index) => `/images/rails-city${index}.ktx2`
    ),
    "/images/walls-2.ktx2",
    "/images/faces_2.ktx2",
    "/images/hex.ktx2",
    "/images/matcap.ktx2",
  ]);

  const {
    assets: { textures, models },
    globalUniforms,
    instanceDummy,
    quatrenion,
  } = useMemo(() => {
    city0Texture0.wrapS =
      city0Texture0.wrapT =
      city0Texture1.wrapS =
      city0Texture1.wrapT =
      city0Texture2.wrapS =
      city0Texture2.wrapT =
      city0Texture3.wrapS =
      city0Texture3.wrapT =
      city1Texture0.wrapS =
      city1Texture0.wrapT =
      city1Texture1.wrapS =
      city1Texture1.wrapT =
      city1Texture2.wrapS =
      city1Texture2.wrapT =
      city1Texture3.wrapS =
      city1Texture3.wrapT =
      city2Texture0.wrapS =
      city2Texture0.wrapT =
      city2Texture1.wrapS =
      city2Texture1.wrapT =
      city2Texture2.wrapS =
      city2Texture2.wrapT =
      city2Texture3.wrapS =
      city2Texture3.wrapT =
      railCity0.wrapS =
      railCity0.wrapT =
      railCity1.wrapS =
      railCity1.wrapT =
      railCity2.wrapS =
      railCity2.wrapT =
      repeatWalls.wrapS =
      repeatWalls.wrapT =
      hexTexture.wrapT =
      hexTexture.wrapS =
      recursiveMask2.wrapT =
      recursiveMask2.wrapS =
        RepeatWrapping;
    city0Texture0.flipY =
      city0Texture1.flipY =
      city0Texture2.flipY =
      city0Texture3.flipY =
      city1Texture0.flipY =
      city1Texture1.flipY =
      city1Texture2.flipY =
      city1Texture3.flipY =
      city2Texture0.flipY =
      city2Texture1.flipY =
      city2Texture2.flipY =
      city2Texture3.flipY =
      railCity0.flipY =
      railCity1.flipY =
      railCity2.flipY =
        false;

    const globalUniforms = {
      uGroundFloorBegin: {
        value: -50,
      },
      uAnimate: {
        value: !0,
      },
      uAnimateUpFlag: {
        value: !1,
      },
      uAnimateUp: {
        value: -1,
      },
      uFragNoiseScale: {
        value: 10,
      },
      uFragNoiseSpeed: {
        value: 2.5,
      },
      uFragNoiseStrength: {
        value: 0.13,
      },
      uHexTexScale: {
        value: 20,
      },
      uRecTexScale: {
        value: 0,
      },
      uOverallGradientSpread: {
        value: 0.13,
      },
      uFlameBandWidth: {
        value: 0.462,
      },
      uEdgeTextureSubtractStrength: {
        value: 0.559,
      },
      uFlameColorGradientSpread: {
        value: 0.15,
      },
      uFlameColorChangeOffset: {
        value: 0.239,
      },
      uFlameStrength: {
        value: 0.75,
      },
      uFlameTopColor: {
        value: new Color(16764607),
      },
      uFlameBottomColor: {
        value: new Color(16752742),
      },
      uBalconiesBlendMode: {
        value: 0,
      },
      uBalconiesBlendAlpha: {
        value: 1,
      },
      uBalconyBaseColorTop: {
        value: new Color(16772837),
      },
      uBalconyBaseColorBottom: {
        value: new Color(7286290),
      },
    };

    return {
      assets: {
        textures: {
          city0Texture0,
          city0Texture1,
          city0Texture2,
          city0Texture3,
          city1Texture0,
          city1Texture1,
          city1Texture2,
          city1Texture3,
          city2Texture0,
          city2Texture1,
          city2Texture2,
          city2Texture3,
          railCity0,
          railCity1,
          railCity2,
          repeatWalls,
          hexTexture,
          matcap,
          recursiveMask2,
        },
        models: {
          city0,
          city1,
          city2,
        },
      },
      globalUniforms,
      instanceDummy: new Object3D(),
      quatrenion: new Quaternion(),
      defines: {
        USE_MATCAP: true,
      },
    };
  }, [
    city0,
    city0Texture0,
    city0Texture1,
    city0Texture2,
    city0Texture3,
    city1,
    city1Texture0,
    city1Texture1,
    city1Texture2,
    city1Texture3,
    city2,
    city2Texture0,
    city2Texture1,
    city2Texture2,
    city2Texture3,
    hexTexture,
    matcap,
    railCity0,
    railCity1,
    railCity2,
    recursiveMask2,
    repeatWalls,
  ]);


  return (
    <>
      {Object.keys(objectData)
        .filter((d) => d.startsWith("city"))
        .map((dataKey, index) => <TowerInstancedMesh
          key={index}
          dataKey={dataKey}
          geometry={(models[dataKey as 'city0' | 'city1' | 'city2'] as Mesh).geometry.clone()}
          globalUniforms={globalUniforms}
          textures={textures}
        />)}
    </>
  );
};

const applyObjectDataToObjectProps = (
  mesh: Object3D,
  towerKey: string,
  index: number
) => {
  
  mesh.position.set(
    objectData[towerKey][index][0][0],
    objectData[towerKey][index][0][1],
    objectData[towerKey][index][0][2]
  );
  
  mesh?.rotation.setFromQuaternion(
    new Quaternion(
      objectData[towerKey][index][1][0],
      objectData[towerKey][index][1][1],
      objectData[towerKey][index][1][2],
      objectData[towerKey][index][1][3]
    )
  );
  
  mesh.scale.set(
    objectData[towerKey][index][2][0],
    objectData[towerKey][index][2][1],
    objectData[towerKey][index][2][2]
  );

  return mesh;
};

const TowerInstancedMesh: FC<{
  dataKey: string;
  geometry: BufferGeometry;
  textures: {
    [value: string]: Texture;
  };
  globalUniforms: {
    [value: string]: {
      value: any;
    }
  }
}> = ({ dataKey, geometry, textures, globalUniforms }) => {
  const ref = useRef<InstancedMesh<BufferGeometry, ShaderMaterial>>(null);
  const { v3, dataLength, instanceDummy, towerData } = useMemo(() => {
    const v3 = new Vector3();
    const instanceDummy = new Object3D();
    const towerData = objectData[dataKey];
    const dataLength = Object.keys(towerData).length;

    return {
      v3,
      instanceDummy,
      towerData,
      dataLength,
    };
  }, [dataKey]);

  const innerUniforms = useMemo(() => {
    return {
      uProgress: {
          value: 0
      },
      uTime: {
        value: 0
      },
      uAnimate: {
        value: null
      },
      uAnimateUp: {
        value: null
      },
      tRailsTex: {
        value: null
      },
      tRecText: {
        value: null
      },
      tHexText: {
        value: null
      },
      tColorText: {
        value: null
      }
    }
  }, []);

  const uniforms = useMemo(
    () => ({
      tColorText0: {
        value: textures[`${dataKey}Texture0`],
      },
      tColorText1: {
        value: textures[`${dataKey}Texture1`],
      },
      tColorText2: {
        value: textures[`${dataKey}Texture2`],
      },
      tColorText3: {
        value: textures[`${dataKey}Texture3`],
      },
      tRailsTex: {
        value: textures[`rail${dataKey.toLowerCase().split('').map((ch, index) => (index === 0 ? ch.charAt(0).toUpperCase() : ch)).join('')}`],
      },
      tRecText: {
        value: textures.recursiveMask2,
      },
      tHexText: {
        value: textures.hexTexture,
      },
      tMatCap: {
        value: textures.matcap,
      },
      tRepeatedTexWalls: {
        value: textures.repeatWalls,
      },
    }),
    [dataKey, textures]
  );

  const defines = useMemo(
    () => ({
      USE_MATCAP: true,
    }),
    []
  );

  const lightCount = globalLights.length;
  const fogDefines = {
    NUM_V_LIGHTS: lightCount,
  };

  const iMesh = useMemo(() => {
    const iMesh = new InstancedMesh(geometry, new ShaderMaterial({
      uniforms: {
        ...innerUniforms,
        ...globalUniforms,
        ...uniforms
      },
      defines: {
        ...fogDefines,
        ...defines
      },
      fragmentShader: towersFragmentShafer,
      vertexShader: towersVertexShader,
      transparent: false,
      blending: CustomBlending,
      blendEquation: AddEquation,
      blendSrc: SrcAlphaFactor,
      blendDst: OneMinusSrcAlphaFactor
    }),dataLength);
    const textureNum = [],
      objectHeight = [],
      startOffset = [],
      speed = [];
    
    for (let index = 0; index < dataLength; index++) {
      const instanceDummy = applyObjectDataToObjectProps(new Object3D, dataKey, index);
      instanceDummy.updateMatrix();
      
      iMesh.setMatrixAt(index, instanceDummy.matrix);
      iMesh.geometry.computeBoundingBox();
      iMesh.geometry?.boundingBox?.getSize(v3);
      const y = v3.clone().y;
      let texNum;
      const angle = Math.round(MathUtils.radToDeg(instanceDummy.rotation.y));
      0 === angle
        ? (texNum = 0)
        : 90 === angle
        ? (texNum = 1)
        : 180 === angle
        ? (texNum = 2)
        : -90 === angle && (texNum = 3);
      const c = towerData[index][3].section;
      const startSeed = 0.2 * MathUtils.seededRandom(c);
      const speedSeed = 0.5 * (MathUtils.seededRandom(c) + 1);
      startOffset.push(startSeed);
      objectHeight.push(y);
      textureNum.push(texNum ?? 0);
      speed.push(speedSeed);
    }

    iMesh.geometry.setAttribute(
      "startOffset",
      new InstancedBufferAttribute(new Float32Array(startOffset), 1)
    );
    iMesh.geometry.setAttribute(
      "speed",
      new InstancedBufferAttribute(new Float32Array(speed), 1)
    );
    iMesh.geometry.setAttribute(
      "objectHeight",
      new InstancedBufferAttribute(new Float32Array(objectHeight), 1)
    );
    iMesh.geometry.setAttribute(
      "textureNum",
      new InstancedBufferAttribute(new Float32Array(textureNum), 1)
    );
    
    return iMesh;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLayoutEffect(() => {
    
  }, [dataKey, dataLength, instanceDummy, towerData, v3]);

  const {
    progress
  } = useControls('Towers', {
    progress: {
      value: 0,
      min: 0,
      max: 2,
      step: 0.01
    }
  })

  useFrame(({clock}) => {
    if (!ref.current) return;
    ref.current.material.uniforms.uProgress.value = progress;
    ref.current.material.uniforms.uTime.value = clock.getElapsedTime();

  })

  return (<primitive ref={ref} object={iMesh} />
  );
};

export default Towers;
