import { Object3DNode, extend } from "@react-three/fiber";
import { Bloom, EffectComposer, FXAA } from "@react-three/postprocessing";
import { AdditiveBlending, Vector2 } from "three";
import { BloomPass } from "three-stdlib";
import { ScreenFX } from "./ScreenFX";
import { useControls } from "leva";

// extend({BloomPass})

// declare module "@react-three/fiber" {
//   interface ThreeElements {
//     bloomPass: Object3DNode<
//       BloomPass,
//       typeof BloomPass
//     >;
//   }
// }

const MainEffects = () => {
  const {
    luminanceThreshold,
    radius,
    intensity
  } = useControls('Bloom Effect', {
    luminanceThreshold: .717,
    radius: 1,
    intensity: 2.12
  });

  const {
    maxDistort,
    bendAmount,
  } = useControls('Screen Effect', {
    maxDistort: .251,
    bendAmount: -.272,
  })

  return (<>
    <EffectComposer disableNormalPass>
      {/* <bloomPass args={[2.12, 1, .717]} /> */}
      <FXAA />
      <Bloom luminanceThreshold={luminanceThreshold} radius={radius} intensity={intensity} />
      <ScreenFX maxDistort={maxDistort} bendAmount={bendAmount} />
    </EffectComposer>
    </>
  );
};

export default MainEffects;