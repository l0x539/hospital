import { selectGl } from "@/features/gl/glSlice";
import { useAppSelector } from "@/hooks";
import { fogDefines } from "@/shaders/defines";
import { bridgesFragmentShader } from "@/shaders/fragmantShaders";
import { bridgesVertexShade } from "@/shaders/vertexShaders";
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

const Bridges: FC<{
  options: {
    [value: string]: any;
  }
}> = ({
  options
}) => {
  const ref = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null);
  const [
    {
      scene: {
        children: [bridges],
      },
    },
  ] = useGLTF(["/models/bridges.glb"]);

  const searchParams = useSearchParams();

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
        value: new Color("#740500"),
      },
      uColor2: {
        value: new Color("#ffc48c"),
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
  const props = useSpring({
    springProgress: options.scrollPosition,
    config: {
      easing: easings.easeInBack,
    },
  });

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

  const {
    bridgeColor1,
    bridgeColor2,
  } = useControls('Bridges', {
    bridgeColor1: {
      r: uniforms.uColor1.value.r*256,
      g: uniforms.uColor1.value.g*256,
      b: uniforms.uColor1.value.b*256,
    },
    bridgeColor2: {
      r: uniforms.uColor2.value.r*256,
      g: uniforms.uColor2.value.g*256,
      b: uniforms.uColor2.value.b*256,
    }
  })

  useFrame(({clock}) => {
    if (!ref.current) return;
    if (searchParams.has('controls'))
      ref.current.material.uniforms.uProgress.value = progress;
    else
      ref.current.material.uniforms.uProgress.value = options.mainBuildingReveal; //props.springProgress.get();

    ref.current.material.uniforms.uTime.value = clock.getElapsedTime();

    if (searchParams.has('controls')) {
      ref.current.material.uniforms.uColor1.value = {
        r: bridgeColor1.r/256,
        g: bridgeColor1.g/256,
        b: bridgeColor1.b/256,
      };
      ref.current.material.uniforms.uColor2.value = {
        r: bridgeColor2.r/256,
        g: bridgeColor2.g/256,
        b: bridgeColor2.b/256,
      };
    }
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
