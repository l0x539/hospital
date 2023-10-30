// TODO Fix This

import { reflectiveFragmentShader } from "@/shaders/fragmantShaders";
import { reflectiveVertexShader } from "@/shaders/vertexShaders";
import { objectData } from "@/utils/constants";
import { MeshReflectorMaterial, useGLTF, useKTX2 } from "@react-three/drei";
import { FC, ReactNode, useEffect, useMemo, useRef } from "react";
import { config, useSpring, easings } from "@react-spring/three";
import {
  BufferGeometry,
  LinearFilter,
  Material,
  Matrix4,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Uniform,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
} from "three";
import { fogDefines } from "@/shaders/defines";
import ReflectiveSurface from "@/utils/ReflectiveSurface";
import { Object3DNode, extend, useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/hooks";
import { selectGl } from "@/features/gl/glSlice";

extend({ ReflectiveSurface });

// Add types to ThreeElements elements so primitives pick up on it
declare module "@react-three/fiber" {
  interface ThreeElements {
    reflectiveSurface: Object3DNode<
      ReflectiveSurface,
      typeof ReflectiveSurface
    >;
  }
}

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

const ReflectiveFloor = () => {
  const [
    baseLightmap,
    wallsRoughness,
    wallsNormal,
    walls,
    baseMask,
  ] = useKTX2([
    "/images/base-lightmap.ktx2",
    "/images/walls-2-Roughness.ktx2",
    "/images/walls-2-Normal.ktx2",
    "/images/walls-2.ktx2",
    "/images/base-top-mask.ktx2"
  ]);
  const baseTopRef = useRef<ReflectiveSurface>(null);
  const mb0Ref = useRef<Mesh<BufferGeometry, Material>>(null);
  const mb1Ref = useRef<Mesh<BufferGeometry, Material>>(null);
  const mb2Ref = useRef<Mesh<BufferGeometry, Material>>(null);
  const [
    {
      scene: {
        children: [baseTop],
      },
    },
    {
      scene: {
        children: [buildingFloor],
      },
    },
  ] = useGLTF(["/models/base-top.glb", "/models/mb-topfloor.glb"]);

  useEffect(() => {
    if (
      !baseTopRef.current ||
      !mb0Ref.current ||
      !mb1Ref.current ||
      !mb2Ref.current
    )
      return;
    applyObjectDataToObjectProps(
      baseTopRef.current,
      objectData.objects,
      "base-top",
      0
    );
    applyObjectDataToObjectProps(mb0Ref.current, objectData.objects, "mb0", 0);
    applyObjectDataToObjectProps(mb1Ref.current, objectData.objects, "mb1", 0);
    applyObjectDataToObjectProps(mb2Ref.current, objectData.objects, "mb2", 0);
  }, []);

  const {camera, scene, gl} = useThree();
  
  const searchParams = useSearchParams();
  const {progress: scrollProgress} = useAppSelector(selectGl);

  const {
    progress
  } = useControls('ReflectFloor', {
    progress: {
      value: 0.1,
      min: 0,
      max: 1,
      step: 0.01
    }
  })

  const props = useSpring({
    springProgress: scrollProgress,
    config: {
      easing: easings.easeInBack,
    },
  });;

  useFrame(({clock}) => {
    if (!baseTopRef.current || !baseTopRef.current.updateScroll) return;
    if (searchParams.has('controls'))
      baseTopRef.current.updateScroll(progress, gl)
    else
      baseTopRef.current.updateScroll(props.springProgress.get(), gl)
  })

  return (
    <group>
      <reflectiveSurface
        ref={baseTopRef}
        geometry={(baseTop as Mesh).geometry}
        args={[
          (baseTop as Mesh).geometry,
          baseLightmap,
          wallsRoughness,
          wallsNormal,
          walls,
          baseMask,
          objectData.objects["base-top"][0],
          "base-top",
          {
            start: 0,
            stop: 0.14,
          },
          {
            uBaseLod: {
              value: 3,
            },
            uDistortionAmount: {
              value: 0.1,
            },
            uReflectionOpacity: {
              value: 0.6,
            },
            uReflectionLighten: {
              value: 0.15,
            },
            uRoughnessScale: {
              value: 7.62,
            },
            uConcreteScale: {
              value: 7.62,
            },
          },
          (camera as PerspectiveCamera),
          scene,
          0
        ]}
      />
      {/* <mesh ref={mb0Ref} geometry={(buildingFloor as Mesh).geometry}>
        <MeshReflectorMaterial
          blur={[512, 512]} // Blur ground reflections (width, heigt), 0 skips blur
          mixBlur={0.75} // How much blur mixes with surface roughness
          mixStrength={0.25} // Strength of the reflections
          resolution={1024} // Off-buffer resolution, lower=faster, higher=better quality
          mirror={0.5} // Mirror environment, 0 = texture colors, 1 = pick up env colors
          minDepthThreshold={0.25}
          maxDepthThreshold={1}
          depthScale={50}
        />
      </mesh>
      <mesh ref={mb1Ref} geometry={(buildingFloor as Mesh).geometry}>
        <MeshReflectorMaterial
          blur={[512, 512]} // Blur ground reflections (width, heigt), 0 skips blur
          mixBlur={0.75} // How much blur mixes with surface roughness
          mixStrength={0.25} // Strength of the reflections
          resolution={1024} // Off-buffer resolution, lower=faster, higher=better quality
          mirror={0.5} // Mirror environment, 0 = texture colors, 1 = pick up env colors
          minDepthThreshold={0.25}
          maxDepthThreshold={1}
          depthScale={50}
        />
      </mesh>
      <mesh ref={mb2Ref} geometry={(buildingFloor as Mesh).geometry}>
        <MeshReflectorMaterial
          blur={[512, 512]} // Blur ground reflections (width, heigt), 0 skips blur
          mixBlur={0.75} // How much blur mixes with surface roughness
          mixStrength={0.25} // Strength of the reflections
          resolution={1024} // Off-buffer resolution, lower=faster, higher=better quality
          mirror={0.5} // Mirror environment, 0 = texture colors, 1 = pick up env colors
          minDepthThreshold={0.25}
          maxDepthThreshold={1}
          depthScale={50}
        />
      </mesh> */}
    </group>
  );
};

const ReflectiveMesh: FC<{
  children: ReactNode;
  geometry: BufferGeometry;
  name: string;
}> = ({ children, geometry, name }) => {
  const {} = useMemo(() => {
    const ignoreObjects = [];
    const renderReflection = true;
    const normal = new Vector3();
    const reflectorWorldPosition = new Vector3();
    const cameraWorldPosition = new Vector3();
    const rotationMatrix = new Matrix4();
    const lookAtPosition = new Vector3(0, 0, -1);
    const clipPlane = new Vector4();
    const view = new Vector3();
    const target = new Vector3();
    const q = new Vector4();
    const textureSize = new Vector2(
      0.25 * window.innerWidth,
      0.25 * window.innerHeight
    );
    const textureMatrix = new Matrix4();
    const renderTarget = new WebGLRenderTarget(textureSize.x, textureSize.y, {
      minFilter: LinearFilter,
    });

    return {};
  }, []);
  return (
    <mesh geometry={geometry} name={name}>
      {children}
    </mesh>
  );
};

const ReflectiveMaterial: FC<{
  uniforms?: {
    [value: string]: Uniform<any>;
  };
  defines?: {
    [value: string]: any;
  };
}> = ({ uniforms, defines }) => {
  return (
    <shaderMaterial
      vertexShader={reflectiveVertexShader}
      fragmentShader={reflectiveFragmentShader}
      defines={{
        ...fogDefines,
        ...defines,
      }}
      uniforms={{
        uDiffuse: {
          value: null,
        },
        uBaseLod: {
          value: 2,
        },
        uDistortionAmount: {
          value: 0.02,
        },
        uReflectionOpacity: {
          value: 0.587,
        },
        uReflectionLighten: {
          value: 0.783,
        },
        uRoughnessTexture: {
          value: null,
        },
        uNormalTexture: {
          value: null,
        },
        uRoughnessScale: {
          value: 7.18,
        },
        uConcreteScale: {
          value: 7.18,
        },
        uWallsTexture: {
          value: null,
        },
        uMaskTexture: {
          value: null,
        },
        uDiffuseRedAmount: {
          value: 1,
        },
        ...uniforms,
      }}
    />
  );
};

export default ReflectiveFloor;
