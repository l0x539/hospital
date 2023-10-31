import { selectGl } from "@/features/gl/glSlice";
import { useAppSelector } from "@/hooks";
import { fogDefines } from "@/shaders/defines";
import {
  citySignFragmentShader,
  signFragmentShader,
} from "@/shaders/fragmantShaders";
import {
  citySignVertexShader,
  signVertexShader,
} from "@/shaders/vertexShaders";
import { objectData } from "@/utils/constants";
import { useGLTF, useKTX2 } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { useSearchParams } from "next/navigation";
import { FC, useEffect, useMemo, useRef } from "react";
import { config, useSpring, easings } from "@react-spring/three";
import {
  AddEquation,
  BufferGeometry,
  CustomBlending,
  MathUtils,
  Mesh,
  Object3D,
  OneMinusSrcAlphaFactor,
  Quaternion,
  ShaderMaterial,
  SrcAlphaFactor,
  Uniform,
} from "three";

const applyObjectDataToObjectProps = (
  mesh: Object3D | Mesh,
  signsData: {
    [value: string]: any;
  },
  path: string,
  pathIndex: number
) => {
  
  mesh.position.set(
    signsData[path][pathIndex][0][0],
    signsData[path][pathIndex][0][1],
    signsData[path][pathIndex][0][2]
  );

  mesh?.rotation.setFromQuaternion(
    new Quaternion(
      signsData[path][pathIndex][1][0],
      signsData[path][pathIndex][1][1],
      signsData[path][pathIndex][1][2],
      signsData[path][pathIndex][1][3]
    )
  );

  mesh.scale.set(
    signsData[path][pathIndex][2][0],
    signsData[path][pathIndex][2][1],
    signsData[path][pathIndex][2][2]
  );

  return mesh;
};

const Signs: FC<{
  options: {
    [value: string]: any;
  };
}> = ({ options }) => {
  const [
    {
      scene: {
        children: [sign],
      },
    },
  ] = useGLTF(["/models/sign.glb"]);
  const [
    signTexture0,
    signTexture1,
    signTexture2,
    signTexture3,
    signTexture4,
    signTexture5,
    signTexture6,
    signTexture7,
    signTexture8,
    signTexture9,
    signTexture10,
  ] = useKTX2([
    ...Array.from({ length: 11 }).map(
      (_, index) => `/images/sign_${index}.ktx2`
    ),
  ]);

  const { signs, signsData } = useMemo(() => {
    const sharedUniforms = {
      uProgress: {
        value: 0,
      },
      uBlendFrequency: {
        value: 8,
      },
      uBlendSpeed: {
        value: 1.8,
      },
    };

    const signsData: {
      [value: string]: any;
    } = Object.keys(objectData)
      .filter((path) => path.startsWith("sign"))
      .reduce(
        (prev, path) => ({
          ...prev,
          [path]: objectData[path],
        }),
        {}
      );

    const cities: {
      [value: string]: any[];
    } = Object.keys(objectData)
      .filter((path) => path.startsWith("city"))
      .reduce(
        (prev, path) => ({
          ...prev,
          [path]: objectData[path],
        }),
        {}
      );

    signTexture0.flipY =
      signTexture1.flipY =
      signTexture2.flipY =
      signTexture3.flipY =
      signTexture4.flipY =
      signTexture5.flipY =
      signTexture6.flipY =
      signTexture7.flipY =
      signTexture8.flipY =
      signTexture9.flipY =
      signTexture10.flipY =
        false;

    const textures = {
      signTexture0,
      signTexture1,
      signTexture2,
      signTexture3,
      signTexture4,
      signTexture5,
      signTexture6,
      signTexture7,
      signTexture8,
      signTexture9,
      signTexture10,
    };

    const signs: [
      string,
      BufferGeometry,
      {
        [value: string]: Uniform<any>;
      },
      string,
      number
    ][] = Object.keys(signsData).reduce(
      (prev: any, path: string) => {
        const signIndex = parseInt(path.replace("sign-", "")) as
          | 0
          | 1
          | 2
          | 3
          | 4
          | 5
          | 6
          | 7
          | 8
          | 9;
        const limit = 26;

        return [
          ...prev,
          ...(signsData[path] as number[]).map((_: any, pathIndex: number) => {
            const section = signsData[path][pathIndex][3].section;

            if (section === 0) {
              const signTest = signsData[path][pathIndex][0][1];
              const floorIndex =
                signTest <= limit
                  ? 0
                  : signTest <= 2 * limit
                  ? 1
                  : signTest <= 3 * limit
                  ? 2
                  : 3;

              return [
                "sign",
                (sign as Mesh).geometry.clone(),
                {
                  uTime: {
                    value: 0,
                  },
                  ...sharedUniforms,
                  uTexture: {
                    value: textures[`signTexture${signIndex}`],
                  },
                  uColor1: options.signs.uColor1,
                  uColor2: options.signs.uColor2,
                  uFloorIndex: {
                    value: floorIndex,
                  },
                  uIndex: {
                    value: pathIndex,
                  },
                },
                path,
                pathIndex,
              ];
            } else {
              const startOffset = 0.2 * MathUtils.seededRandom(section);
              const speed = 0.5 * (MathUtils.seededRandom(section) + 1);
              const thisCity = Object.keys(cities).map((path) =>
                cities[path].findLast(
                  (cityPath) => cityPath[3].section === section
                )
              )[-1];
              return [
                "city-sign",
                (sign as Mesh).geometry.clone(),
                {
                  uCityProgress: {
                    value: 0,
                  },
                  uTime: {
                    value: 0,
                  },
                  ...sharedUniforms,
                  uTexture: {
                    value: textures[`signTexture${signIndex}`],
                  },
                  uIndex: {
                    value: pathIndex,
                  },
                  uColor1: options.signs.uColor1,
                  uColor2: options.signs.uColor2,
                  uSpeed: {
                    value: speed,
                  },
                  uStartOffset: {
                    value: startOffset,
                  },
                  uGroundFloorBegin: {
                    value: -25,
                  },
                  uGradientSpread: {
                    value: 0.1,
                  },
                },
                path,
                pathIndex,
              ];
            }
          }),
        ];
      },
      [] as [
        string,
        BufferGeometry,
        {
          [value: string]: Uniform<any>;
        },
        string,
        number
      ][]
    );

    return { signs, signsData };
  }, [
    options.signs.uColor1,
    options.signs.uColor2,
    sign,
    signTexture0,
    signTexture1,
    signTexture10,
    signTexture2,
    signTexture3,
    signTexture4,
    signTexture5,
    signTexture6,
    signTexture7,
    signTexture8,
    signTexture9,
  ]);
  return (
    <group>
      {signs.map(([type, geometry, uniforms, path, index], key) => (
        <Sign
          key={key}
          type={type}
          geometry={geometry}
          uniforms={uniforms}
          path={path}
          index={index}
          signsData={signsData}
          options={options}
        />
      ))}
    </group>
  );
};

const Sign: FC<{
  type: string;
  geometry: BufferGeometry;
  uniforms: {
    [value: string]: Uniform<any>;
  };
  path: string;
  index: number;
  signsData: {
    [value: string]: any;
  };
  options: {
    [value: string]: any;
  };
}> = ({ options, type, geometry, uniforms, path, index, signsData }) => {
  const ref = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null);

  const { progress } = useControls("MainTower", {
    progress: {
      value: 0,
      min: 0,
      max: 1,
      step: 0.01,
    },
  });

  const { progress: cityProgress } = useControls("Towers", {
    progress: {
      value: 0,
      min: 0,
      max: 2,
      step: 0.01,
    },
  });


  const searchParams = useSearchParams();
  const props = useSpring({
    springProgress: options.scrollPosition,
    config: {
      easing: easings.easeInBack,
    },
  });;

  useEffect(() => {
    if (!ref.current) return;
    applyObjectDataToObjectProps(ref.current, signsData, path, index);
  }, [index, path, signsData]);

  useFrame(({clock}) => {
    if (!ref.current) return;
    if (type === "city-sign")
      if (searchParams.has('controls')) {
        ref.current.material.uniforms.uProgress.value = progress;
        ref.current.material.uniforms.uCityProgress.value = cityProgress;
      } else {
        ref.current.material.uniforms.uProgress.value = options.mainBuildingReveal; //props.springProgress.get();
        ref.current.material.uniforms.uCityProgress.value = options.mainBuildingReveal; // props.springProgress.get();
      }
    ref.current.material.uniforms.uTime.value = clock.getElapsedTime();
  
  });

  return (
    <mesh ref={ref} geometry={geometry}>
      {type === "sign" ? (
        <shaderMaterial
          uniforms={uniforms}
          defines={fogDefines}
          transparent={true}
          blending={CustomBlending}
          blendEquation={AddEquation}
          blendSrc={SrcAlphaFactor}
          blendDst={OneMinusSrcAlphaFactor}
          vertexShader={signVertexShader}
          fragmentShader={signFragmentShader}
        />
      ) : (
        <shaderMaterial
          defines={fogDefines}
          transparent={true}
          uniforms={uniforms}
          vertexShader={citySignVertexShader}
          fragmentShader={citySignFragmentShader}
        />
      )}
    </mesh>
  );
};

export default Signs;
