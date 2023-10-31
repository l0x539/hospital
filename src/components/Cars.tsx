import { fogDefines } from "@/shaders/defines";
import { carFragmentShader, trailFragmentShader } from "@/shaders/fragmantShaders";
import { carVertexShader, trailVertexShader } from "@/shaders/vertexShaders";
import { objectData } from "@/utils/constants";
import { useGLTF, useKTX2 } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { useSearchParams } from "next/navigation";
import { FC, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  CustomBlending,
  DataTexture,
  DoubleSide,
  FloatType,
  MathUtils,
  Mesh,
  NearestFilter,
  OneMinusSrcAlphaFactor,
  PlaneGeometry,
  RGBAFormat,
  RepeatWrapping,
  ShaderMaterial,
  Sphere,
  SrcAlphaFactor,
  Texture,
  Vector3,
} from "three";
import { GLTF, initSplineTexture, updateSplineTexture } from "three-stdlib";

const Cars = () => {
  const [
    {
      scene: {
        children: [car0],
      },
    },
    {
      scene: {
        children: [car1],
      },
    },
  ] = useGLTF(["/models/car0.glb", "/models/car1.glb"]) as any as GLTF &
    {
      scene: {
        children: [Mesh];
      };
    }[];
  const [carTexture0, carTexture1, matcap] = useKTX2([
    "/images/car0.ktx2",
    "/images/car1.ktx2",
    "/images/matcap.ktx2",
  ]);

  const { textures, models, cars } = useMemo(() => {
    carTexture0.flipY = carTexture1.flipY = false;
    const textures = {
      carTexture0,
      carTexture1,
    };
    const models = {
      car0,
      car1,
    };

    const carOptions = {
      gui: {
        progress: 0,
        splineHelperVisible: !0,
        currCar: "",
      },
      shared: {
        uJitterAmplitude: {
          value: 0.4,
        },
        uJitterFrequency: {
          value: 0.2,
        },
        uJitterFollow: {
          value: 0,
        },
        trailColorBegin: {
          value: new Color(16764332),
        },
        trailColorEnd: {
          value: new Color(15097924),
        },
        uTrailLength: {
          value: 0.9,
        },
        uTrailFallOffEnd: {
          value: 0.9,
        },
        uColorOffset: {
          value: 0.163,
        },
        uColorFallOff: {
          value: 0.28,
        },
      },
    };

    const carData = Object.keys(objectData.paths).filter((path) =>
      path.startsWith("car")
    );

    const cars = Object.keys(objectData.paths)
      .filter((path) => path.startsWith("car"))
      .map((path) => {
        const carVecs = objectData.paths[path][0].map((_: any, carPath: number) => {
          const vec3 = objectData.paths[path][0][carPath];
          return new Vector3(vec3[0], vec3[1], vec3[2]);
        });
        const carIndex = carData.indexOf(path);
        const options = {
          startOffset: Number(((0 + 0.32 * carIndex) % 0.9).toFixed(2)),
          speed: 897e-6,
          ...carOptions.shared,
        };
        return [
          carVecs,
          options,
          carIndex % 2 ? models.car0.geometry : models.car1.geometry,
          carIndex % 2 ? textures.carTexture0 : textures.carTexture1,
        ];
      });

    return {
      textures,
      models,
      cars,
    };
  }, [car0, car1, carTexture0, carTexture1]);

  return <>
    {cars.map(([carVecs, {
      trailOffset,
      carMeshOffset,
      curveArray,
      curveLengthArray,
      startOffset,
      uJitterAmplitude,
      uJitterFollow,
      uJitterFrequency,
      trailColorBegin,
      trailColorEnd,
      uTrailLength,
      uTrailFallOffEnd,
      uColorFallOff,
      uColorOffset,
      speed,
      carMeshColor
    }, geometry, texture], index) => <Car
      key={index}
      trailColorBegin={trailColorBegin}
      pathPoints={carVecs}
      trailOffset={trailOffset}
      carMeshOffset={carMeshOffset}
      curveArray={curveArray}
      curveLengthArray={curveLengthArray}
      matcap={matcap}
      startOffset={startOffset}
      uJitterAmplitude={uJitterAmplitude}
      uJitterFollow={uJitterFollow}
      uJitterFrequency={uJitterFrequency}
      trailColorEnd={trailColorEnd}
      uTrailLength={uTrailLength}
      uTrailFallOffEnd={uTrailFallOffEnd}
      uColorFallOff={uColorFallOff}
      uColorOffset={uColorOffset}
      geometry={geometry}
      texture={texture}
      speed={speed}
      carMeshColor={carMeshColor}
    />)}
  </>
};

const CHANNELS = 4;
const TEXTURE_WIDTH = 2048;
const TEXTURE_HEIGHT = 4;

const setTextureValue = (dataTexture: DataTexture, idx: number, x: number, y: number, z: number, idxI: number) => {
    const aspectIdx = CHANNELS * TEXTURE_WIDTH * idxI;
    dataTexture.image.data[idx * CHANNELS + aspectIdx + 0] = x,
    dataTexture.image.data[idx * CHANNELS + aspectIdx + 1] = y,
    dataTexture.image.data[idx * CHANNELS + aspectIdx + 2] = z,
    dataTexture.image.data[idx * CHANNELS + aspectIdx + 3] = 1;

    return dataTexture;
}

const Car: FC<{
  trailColorBegin: { value: Color };
  trailColorEnd: { value: Color };
  carMeshColor: Color;
  uTrailLength: { value: number };
  uTrailFallOffEnd: { value: number };
  uColorFallOff: { value: Color };
  uColorOffset: { value: Color };
  uJitterAmplitude: { value: number };
  uJitterFrequency: { value: number };
  uJitterFollow: { value: number };
  pathPoints: Vector3[];
  startOffset: number;
  trailOffset?: number;
  carMeshOffset?: number;
  speed: number;
  curveArray?: any[];
  curveLengthArray?: any[];
  geometry: BufferGeometry;
  texture: Texture;
  matcap: Texture;
}> = ({
  pathPoints,
  trailOffset = 0,
  carMeshOffset = 0,
  curveArray = new Array(1),
  curveLengthArray = new Array(1),
  geometry,
  texture,
  matcap,
  startOffset,
  uJitterAmplitude,
  uJitterFollow,
  uJitterFrequency,
  trailColorBegin,
  trailColorEnd,
  uTrailLength,
  uTrailFallOffEnd,
  uColorFallOff,
  uColorOffset,
  speed
}) => {
  const carRef = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null);
  const trailRef = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);
  const { uniforms, trailUniforms, curve, dataTexture } = useMemo(() => {
    const curve = new CatmullRomCurve3(pathPoints, false);
    
    const carMeshOffset = 30 / curve.getLength();
    const multiply = 1;
    const dataTexture = initSplineTexture(1);

    const dataTextureOptions = {
      uTextureHeight: {
        value: TEXTURE_HEIGHT,
      },
      uNumberOfCurves: {
        value: 1,
      },
      textureHeight: {
        value: TEXTURE_HEIGHT,
      },
      pathOffset: {
        type: "f",
        value: 0,
      },
      pathSegment: {
        type: "f",
        value: 1,
      },
      spineOffset: {
        type: "f",
        value: 15,
      },
      spineLength: {
        type: "f",
        value: 13,
      },
    };

    const uniforms = {
      uTime: {
        value: 0,
      },
      uDiffuseTexture: {
        value: texture,
      },
      uMatcapTexture: {
        value: matcap,
      },
      uPartStartOffset: {
        value: carMeshOffset,
      },
      uStartOffset: {
        value: startOffset,
      },
      spineTexture: {
        value: dataTexture,
      },
      flow: {
        type: "i",
        value: 0,
      },
      uJitterAmplitude,
      uJitterFrequency,
      uJitterFollow,
      ...dataTextureOptions,
    };

    const trailUniforms = {
      uTime: {
        value: 0
      },
      uColorBegin: trailColorBegin,
      uColorEnd: trailColorEnd,
      uPartStartOffset: {
        value: trailOffset,
      },
      uStartOffset: {
        value: startOffset,
      },
      spineTexture: {
        value: dataTexture,
      },
      uTrailLength: uTrailLength,
      uTrailFallOffEnd: uTrailFallOffEnd,
      uColorFallOff: uColorFallOff,
      uColorOffset: uColorOffset,
      flow: {
        type: "i",
        value: 1,
      },
      uJitterAmplitude,
      uJitterFollow,
      uJitterFrequency,
      ...dataTextureOptions
    };

    return {
      dataTexture,
      dataTextureOptions,
      uniforms,
      trailUniforms,
      curve
    };
  }, [
    matcap,
    pathPoints,
    startOffset,
    texture,
    trailColorBegin,
    trailColorEnd,
    trailOffset,
    uColorFallOff,
    uColorOffset,
    uJitterAmplitude,
    uJitterFollow,
    uJitterFrequency,
    uTrailFallOffEnd,
    uTrailLength,
  ]);

  useEffect(() => {
    if (!carRef.current || !trailRef.current) return;
    trailRef.current.geometry.rotateX(MathUtils.degToRad(90));
    carRef.current.geometry.rotateZ(MathUtils.degToRad(-180));
    carRef.current.geometry.rotateY(MathUtils.degToRad(-90));
    carRef.current.geometry.computeBoundingBox();
    carRef.current.geometry.boundingBox?.makeEmpty();
    carRef.current.geometry.boundingBox?.setFromPoints(pathPoints);
    carRef.current.geometry.boundingSphere = new Sphere();
    carRef.current.geometry.boundingBox?.getBoundingSphere(
      carRef.current.geometry.boundingSphere
    );
    carRef.current.geometry.boundingSphere.radius *= 1.5;
    trailRef.current.geometry.computeBoundingBox(),
    trailRef.current.geometry.boundingBox?.makeEmpty(),
    trailRef.current.geometry.boundingBox?.setFromPoints(pathPoints),
    trailRef.current.geometry.boundingSphere = new Sphere,
    trailRef.current.geometry.boundingBox?.getBoundingSphere(trailRef.current.geometry.boundingSphere),
    trailRef.current.geometry.boundingSphere.radius *= 1.5

    const curveLength = curve.getLength();
    
    carRef.current.material.uniforms.spineLength.value = curveLength;
    curveLengthArray[0] = curveLength;
    curveArray[0] = curve;
    updateSplineTexture(dataTexture, curve, 0);
    trailRef.current.material.uniforms.spineTexture.value = dataTexture;
    carRef.current.material.uniforms.spineTexture.value = dataTexture;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // uniform vec3 uColorBegin;
  // uniform vec3 uColorEnd;
  // uniform float uColorFallOff;
  // uniform float uColorOffset;
  const {
    uColorBegin,
    uColorEnd,
    colorFallOff,
    colorOffset
  } = useControls('Car Colors', {
    uColorBegin: {
      r: trailUniforms.uColorBegin.value.r*256,
      g: trailUniforms.uColorBegin.value.g*256,
      b: trailUniforms.uColorBegin.value.b*256,
    },
    uColorEnd: {
      r: trailUniforms.uColorEnd.value.r*256,
      g: trailUniforms.uColorEnd.value.g*256,
      b: trailUniforms.uColorEnd.value.b*256,
    },
    colorFallOff: {
      r: trailUniforms.uColorFallOff.value.r*256,
      g: trailUniforms.uColorFallOff.value.g*256,
      b: trailUniforms.uColorFallOff.value.b*256,
    },
    colorOffset: {
      r: trailUniforms.uColorOffset.value.r*256,
      g: trailUniforms.uColorOffset.value.g*256,
      b: trailUniforms.uColorOffset.value.b*256,
    }
  });

  const { 
    fogColor,
    uWorldFogColor,
    lights1,
    lights2,
    lights3
  } = useControls("Fog Colors", {
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

  useFrame(({clock}) => {
    if (!carRef.current || !trailRef.current) return;
    carRef.current.material.uniforms.uTime.value = clock.getElapsedTime();
    trailRef.current.material.uniforms.uTime.value = clock.getElapsedTime();
    trailRef.current.material.uniforms.pathOffset.value + 1e-4 >= .97 - startOffset - carMeshOffset && (trailRef.current.material.uniforms.pathOffset.value = -startOffset);
    trailRef.current.material.uniforms.pathOffset.value += (speed*2 + clock.getDelta());

    if (searchParams.has('controls')) {
      trailRef.current.material.uniforms.uColorBegin.value = {
        r: uColorBegin.r/256,
        g: uColorBegin.g/256,
        b: uColorBegin.b/256,
      };

      trailRef.current.material.uniforms.uColorEnd.value = {
        r: uColorEnd.r/256,
        g: uColorEnd.g/256,
        b: uColorEnd.b/256,
      };

      trailRef.current.material.uniforms.uColorFallOff.value = {
        r: colorFallOff.r/256,
        g: colorFallOff.g/256,
        b: colorFallOff.b/256,
      };

      trailRef.current.material.uniforms.uColorOffset.value = {
        r: colorOffset.r/256,
        g: colorOffset.g/256,
        b: colorOffset.b/256,
      };
    }
  })

  return (<group>
    <mesh ref={trailRef}>
      <planeGeometry args={[25,2,10,1]} />
      <shaderMaterial
        uniforms={trailUniforms}
        defines={fogDefines}
        vertexShader={trailVertexShader}
        fragmentShader={trailFragmentShader}
        side={DoubleSide}
        transparent={false}
        blending={CustomBlending}
        blendSrc={SrcAlphaFactor}
        blendDst={OneMinusSrcAlphaFactor}
      />
    </mesh>
    <mesh ref={carRef} geometry={geometry}>
      <shaderMaterial
        uniforms={{
          ...uniforms,
        }}
        vertexShader={carVertexShader}
        fragmentShader={carFragmentShader}
        defines={fogDefines}
        side={DoubleSide}
      />
    </mesh>
  </group>
  );
};

export default Cars;