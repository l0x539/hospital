import { selectGl } from "@/features/gl/glSlice";
import { useAppSelector } from "@/hooks";
import { particlesFragmentShader } from "@/shaders/fragmantShaders";
import { particlesVertexShader } from "@/shaders/vertexShaders";
import { globalLights } from "@/utils/constants";
import { useFrame } from "@react-three/fiber";
import { FC, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  MathUtils,
  NormalBlending,
  Points,
  ShaderMaterial,
  Vector3,
} from "three";

const Particles: FC<{
  options: any;
}> = ({ options }) => {
  const ref = useRef<Points<BufferGeometry, ShaderMaterial>>(null);
  const { bounds, count, positions, randoms, sizes, geometry } = useMemo(() => {
    const count = 3000;
    const bounds = new Vector3(60, 40, 20);
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const randoms = new Float32Array(count);
    const v3 = new Vector3();
    const geometry = new BufferGeometry();
    for (let index = 0; index < count; index++) {
      v3.x = MathUtils.randFloat(0.5 * -bounds.x, 0.5 * bounds.x);
      v3.y = MathUtils.randFloat(0.5 * -bounds.y, 0.5 * bounds.y);
      v3.z = MathUtils.randFloat(0.5 * -bounds.z, 0.5 * bounds.z);
      v3.toArray(positions, 3 * index);
      sizes[index] = 0.35;
      randoms[index] = Math.random();
    }
    geometry.setAttribute("position", new BufferAttribute(positions,3));
    geometry.setAttribute("size", new BufferAttribute(sizes,1));
    geometry.setAttribute("random", new BufferAttribute(randoms,1));

    return {
      positions,
      sizes,
      randoms,
      count,
      bounds,
      geometry
    };
  }, []);

  useFrame(({ camera, clock }) => {
    if (!ref.current) return;

    ref.current.position.set(
      camera.position.x - 0.5 * bounds.x,
      camera.position.y - 0.5 * bounds.y,
      camera.position.z - bounds.z
    );

    ref.current.material.uniforms.uTime.value = clock.getElapsedTime();
  });
  return (
    <points ref={ref} geometry={geometry} frustumCulled={false} renderOrder={100}>
      <ParticlesMaterial options={options} bounds={bounds} />
    </points>
  );
};

const ParticlesMaterial: FC<{
  options: any;
  bounds: Vector3;
}> = ({ bounds, options }) => {
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
      fogTweenEndPoint: 0.12,
      activeInsideFogTween: 1,
      allowInvalidate: false,
      fogValues,
      fogTweenValues: {
        0: fogValues.start,
        [0.12]: fogValues.outsideBuilding,
      },
      insideFogTweenPoints: [
        [0.15, 0.264],
        [0.38, 0.514],
        [0.628, 0.775],
      ],
    };
  }, []);


  const {
    globalUniforms: { uPixelRatio },
  } = useAppSelector(selectGl);

  const lightCount = globalLights.length;
  const fogDefines = useMemo(() => ({
    NUM_V_LIGHTS: lightCount,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const { uniforms } = useMemo(() => {
    return {
      uniforms: {
        uBounds: {
          value: bounds,
        },
        uTime: {
          value: 0
        },
        uPixelRatio
      },
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <shaderMaterial
      uniforms={{
        ...uniforms,
      }}
      vertexShader={particlesVertexShader}
      fragmentShader={particlesFragmentShader}
      defines={fogDefines}
      transparent={true}
      blending={AdditiveBlending}
      depthWrite={false}
    />
  );
};

export default Particles;
