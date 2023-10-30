import { selectGl } from "@/features/gl/glSlice";
import { useAppSelector } from "@/hooks";
import { personFragmentShader } from "@/shaders/fragmantShaders";
import { personVertexShader } from "@/shaders/vertexShaders";
import { globalLights, objectData } from "@/utils/constants";
import { useGLTF, useKTX2 } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { useSearchParams } from "next/navigation";
import { FC, useMemo, useRef } from "react";
import { BufferGeometry, Mesh, Quaternion, RepeatWrapping, ShaderMaterial, Texture } from "three";
import { Geometry, mergeBufferGeometries } from "three-stdlib";
import { config, useSpring, easings } from "@react-spring/three";

const applyObjectDataToObjectProps = (mesh: BufferGeometry, personIndex: string, index: number) => {
  mesh?.applyQuaternion(
    new Quaternion(
      objectData[`p${personIndex}`][index][1][0],
      objectData[`p${personIndex}`][index][1][1],
      objectData[`p${personIndex}`][index][1][2],
      objectData[`p${personIndex}`][index][1][3]
    )
  );
  
  mesh.translate(objectData[`p${personIndex}`][index][0][0], objectData[`p${personIndex}`][index][0][1], objectData[`p${personIndex}`][index][0][2]);
  
  
  mesh?.scale(
    objectData[`p${personIndex}`][index][2][0],
    objectData[`p${personIndex}`][index][2][1],
    objectData[`p${personIndex}`][index][2][2]
  );

  return mesh;
}

const People = () => {
  const [
    peopleLightmap0,
    peopleLightmap1,
    peopleLightmap2,
    peopleLightmap3,
    peopleLightmap4,
    peopleLightmap5,
    peopleLightmap6,
    peopleLightmap7,
    repeatTexture,
    recursiveMask2,
    hexTexture,
  ] = useKTX2([
    ...Array.from({ length: 8 }).map(
      (_, index) => `/images/people-L${index}-lightmap.ktx2`
    ),
    "/images/people.ktx2",
    "/images/faces_2.ktx2",
    "/images/hex.ktx2",
  ]);
  const [
    {
      scene: {
        children: [people0],
      },
    },
    {
      scene: {
        children: [people1],
      },
    },
    {
      scene: {
        children: [people2],
      },
    },
    {
      scene: {
        children: [people3],
      },
    },
    {
      scene: {
        children: [people4],
      },
    },
    {
      scene: {
        children: [people5],
      },
    },
    {
      scene: {
        children: [people6],
      },
    },
    {
      scene: {
        children: [people7],
      },
    },
  ] = useGLTF([
    ...Array.from({ length: 8 }).map((_, index) => `/models/p${index}.glb`),
  ]);
  const {
    assets: { models, textures },
    geometries
  } = useMemo(() => {
    peopleLightmap0.wrapS =
      peopleLightmap0.wrapT =
      peopleLightmap1.wrapS =
      peopleLightmap1.wrapT =
      peopleLightmap2.wrapS =
      peopleLightmap2.wrapT =
      peopleLightmap3.wrapS =
      peopleLightmap3.wrapT =
      peopleLightmap4.wrapS =
      peopleLightmap4.wrapT =
      peopleLightmap5.wrapS =
      peopleLightmap5.wrapT =
      peopleLightmap6.wrapS =
      peopleLightmap6.wrapT =
      peopleLightmap7.wrapS =
      peopleLightmap7.wrapT =
      repeatTexture.wrapS =
      repeatTexture.wrapT =
      recursiveMask2.wrapT =
      recursiveMask2.wrapS =
      hexTexture.wrapT =
      hexTexture.wrapS =
        RepeatWrapping;
    peopleLightmap0.flipY =
      peopleLightmap1.flipY =
      peopleLightmap2.flipY =
      peopleLightmap3.flipY =
      peopleLightmap4.flipY =
      peopleLightmap5.flipY =
      peopleLightmap6.flipY =
      peopleLightmap7.flipY =
      repeatTexture.flipY =
        false;

    const models = {
      people0,
      people1,
      people2,
      people3,
      people4,
      people5,
      people6,
      people7,
    };

    const textures = {
      peopleLightmap0,
      peopleLightmap1,
      peopleLightmap2,
      peopleLightmap3,
      peopleLightmap4,
      peopleLightmap5,
      peopleLightmap6,
      peopleLightmap7,
      repeatTexture,
      recursiveMask2,
      hexTexture
    };

    const geometries = Object.keys(models).map((_, index) => {
      return mergeBufferGeometries(Object.keys(models).map((currModelKey, i) => {
        return applyObjectDataToObjectProps((models[currModelKey as keyof typeof models] as Mesh<BufferGeometry>).geometry.clone(), `${i}`, index)
      }), false);
    });

    return {
      assets: {
        models,
        textures,
      },
      geometries
    };
  }, [hexTexture, people0, people1, people2, people3, people4, people5, people6, people7, peopleLightmap0, peopleLightmap1, peopleLightmap2, peopleLightmap3, peopleLightmap4, peopleLightmap5, peopleLightmap6, peopleLightmap7, recursiveMask2, repeatTexture]);

  return <>
    {geometries.map((geometry, index) => <mesh key={index} geometry={geometry ?? undefined}>
      <PersonMaterial index={index} textures={textures} />
    </mesh>)}
  </>;
};

const PersonMaterial: FC<{
  index: number;
  textures: {
    [value: string]: Texture;
  }
}> = ({
  index,
  textures
}) => {
  const ref = useRef<ShaderMaterial>(null);
  const lightCount = globalLights.length;
  const fogDefines = {
    NUM_V_LIGHTS: lightCount,
  };

  const globalUniforms = useMemo(() => ({
    uProgress: {
          value: 0
    },
    uGradientSpread: {
        value: .015
    },
    uGroundFloorBegin: {
        value: 1.74
    },
    uHexTexScale: {
        value: 16
    },
    uRecTexScale: {
        value: 4
    }
  }), [])
  const uniforms = useMemo(() => ({
    tRecText: {
        value: textures.recursiveMask2
    },
    tHexText: {
        value: textures.hexTexture
    },
    uRepeatTexture: {
        value: textures.repeatTexture
    }
  }), [textures.hexTexture, textures.recursiveMask2, textures.repeatTexture])

  const searchParams = useSearchParams();
  const {progress: scrollProgress} = useAppSelector(selectGl);
  const props = useSpring({
    springProgress: scrollProgress,
    config: {
      easing: easings.easeInBack,
    },
  });;

  const {
    progress
  } = useControls('People', {
    progress: {
      value: 0,
      min: 0,
      max: 1,
      step: 0.01
    }
  })

  useFrame(({clock}) => {
    if (!ref.current) return;
    if (searchParams.has('controls'))
      ref.current.uniforms.uProgress.value = progress;
    else
      ref.current.uniforms.uProgress.value = props.springProgress.get();
  })

  return <shaderMaterial
    ref={ref}
    uniforms={{
      ...globalUniforms,
      ...uniforms,
      uColorTexture: {
          value: textures[`peopleLightmap${index as 0|1|2|3|4|5|6|7}`]
      },
    }}
    defines={fogDefines}
    vertexShader={personVertexShader}
    fragmentShader={personFragmentShader}
  />
}

export default People;