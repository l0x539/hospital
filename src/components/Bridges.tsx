import { fogDefines } from "@/shaders/defines";
import { bridgesFragmentShader } from "@/shaders/fragmantShaders";
import { bridgesVertexShade } from "@/shaders/vertexShaders";
import { objectData } from "@/utils/constants";
import { useGLTF, useKTX2 } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { useEffect, useMemo, useRef } from "react";
import {
  AddEquation,
  BufferGeometry,
  Color,
  CustomBlending,
  DoubleSide,
  Mesh,
  Object3D,
  OneMinusSrcAlphaFactor,
  Quaternion,
  RepeatWrapping,
  ShaderMaterial,
  SrcAlphaFactor,
  Vector2,
} from "three";

const applyObjectDataToObjectProps = (
  mesh: Object3D | Mesh,
  objectData: {
    [value: string]: any;
  },
  path: string,
  pathIndex: number
) => {
  mesh.position.set(
    objectData[path][pathIndex][0][0],
    objectData[path][pathIndex][0][1],
    objectData[path][pathIndex][0][2]
  );

  mesh?.rotation.setFromQuaternion(
    new Quaternion(
      objectData[path][pathIndex][1][0],
      objectData[path][pathIndex][1][1],
      objectData[path][pathIndex][1][2],
      objectData[path][pathIndex][1][3]
    )
  );

  mesh.scale.set(
    objectData[path][pathIndex][2][0],
    objectData[path][pathIndex][2][1],
    objectData[path][pathIndex][2][2]
  );

  return mesh;
};

const Bridges = () => {
  const ref = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null);
  const [
    {
      scene: {
        children: [bridges],
      },
    },
  ] = useGLTF(["/models/bridges.glb"]);

  const [bridgesGradient, bridgesDiffuse, recursiveMask3] = useKTX2([
    "/images/bridges-rim.ktx2",
    "/images/bridges-lightmap.ktx2",
    "/images/faces_3.ktx2",
  ]);

  const {uniforms} = useMemo(() => {
    bridgesGradient.flipY = bridgesDiffuse.flipY = false;

    recursiveMask3.wrapT = recursiveMask3.wrapS = RepeatWrapping;

    const textures = {
      bridgesGradient,
      bridgesDiffuse,
      recursiveMask3,
    };

    const sharedUniforms = {
      uProgress: {
        value: 0,
      },
      uColor1: {
        value: new Color(7603456),
      },
      uColor2: {
        value: new Color(16761996),
      },
      uGradientSpread: {
        value: 0.0182,
      },
      uTextureNum: {
        value: 3,
      },
    };

    const uniforms = {
      uTime: {
        value: 0
      },
      uUvScale: {
        value: new Vector2(50, 50),
      },
      uBakeBlend: {
        value: 1,
      },
      uBlendAlpha: {
        value: 1,
      },
      uAlphaMin: {
        value: 0.33,
      },
      uAlphaMax: {
        value: 1,
      },
      ...sharedUniforms,
      uTexture: {
        value: textures.bridgesDiffuse,
      },
      uTextureGradient: {
        value: textures.bridgesGradient,
      },
      uTextureRecursive: {
        value: textures.recursiveMask3,
      },
    };

    return {
      textures,
      uniforms,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    applyObjectDataToObjectProps(ref.current, objectData.objects, "bridges", 0)
  }, []);

  const {
    progress
  } = useControls('Bridges', {
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
    ref.current.material.uniforms.uTime.value = clock.getElapsedTime();
  });

  return <mesh ref={ref} geometry={(bridges as Mesh).geometry.clone()}>
    <shaderMaterial
      side={DoubleSide}
      transparent={false}
      blending={CustomBlending}
      blendEquation={AddEquation}
      blendSrc={SrcAlphaFactor}
      blendDst={OneMinusSrcAlphaFactor}
      uniforms={uniforms}
      defines={fogDefines}
      vertexShader={bridgesVertexShade}
      fragmentShader={bridgesFragmentShader}
    />
  </mesh>;
};

export default Bridges;
