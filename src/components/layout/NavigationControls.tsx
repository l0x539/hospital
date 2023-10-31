import { selectGl, setProgress } from "@/features/gl/glSlice";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { objectData, progressSpeed } from "@/utils/constants";
import { useFrame } from "@react-three/fiber";
import { Handler, useGesture } from "@use-gesture/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FC, useEffect, useMemo, useRef } from "react";
import { useMediaQuery } from "react-responsive";
import gsap from "gsap";
import { CatmullRomCurve3, Euler, Quaternion, Vector2, Vector3 } from "three";
import { config, useSpring, easings } from "@react-spring/three";
import { BrownianMotion, range } from "@/utils/funcs";
import { CustomEase } from "gsap/all";

import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const NavigationControls: FC<{
  options: {
    [value: string]: any;
  };
}> = ({ options }) => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 991 });

  const dispatch = useAppDispatch();

  const {
    pathTween,
    paths,
    cameraPosition,
    cameraLookAt,
    _euler,
    _quaternion,
    brownianMotion,
    smoothMouse,
    timelines
  } = useMemo(() => {
    const brownianMotion = new BrownianMotion();
    const pathTween = gsap.timeline({
      paused: true,
      defaults: {
        ease: "none",
      },
    });

    for (
      let index = 0;
      index < objectData.paths.cam[1].stops.length - 1;
      index++
    ) {
      const cameraTargetPathProgress =
        0.01 * objectData.paths.tgt[1].stops[index + 1];
      const nextStop = 0.01 * objectData.paths.cam[1].stops[index + 1];
      const curStop = 0.01 * objectData.paths.cam[1].stops[index];
      const revealProgress = 0.01 * objectData.paths.reveal[1].stops[index + 1];
      const mainBuildingReveal =
        0.01 * (objectData.paths.reveal[1].stops[index + 1] + 5);
      pathTween.to(options, {
        cameraTargetPathProgress: cameraTargetPathProgress,
        duration: nextStop - curStop,
        revealProgress: revealProgress,
        mainBuildingReveal: mainBuildingReveal,
      });
    }

    const paths: {
      cars: {
        [value: string]: CatmullRomCurve3;
      };
      cam: CatmullRomCurve3;
      c: {
        [value: string]: CatmullRomCurve3;
      };
    } = {
      cars: {},
      c: {},
      cam: new CatmullRomCurve3(),
    };

    for (const key in objectData.paths)
      if ("c" === key)
        for (let index = 0; index < objectData.paths[key].length; index++) {
          if (!objectData.paths[key][index].length) continue;
          const points = [];
          for (let i = 0; i < objectData.paths[key][index].length; i++) {
            const arrayVec = objectData.paths[key][index][i];
            points.push(new Vector3(arrayVec[0], arrayVec[1], arrayVec[2]));
          }
          paths.c["c" + index] = new CatmullRomCurve3(points);
        }
      else {
        const points = [];
        for (let index = 0; index < objectData.paths[key][0].length; index++) {
          const arrayVec3 = objectData.paths[key][0][index];
          points.push(new Vector3(arrayVec3[0], arrayVec3[1], arrayVec3[2]));
        }
        key.startsWith("car")
          ? (paths.cars[key] = new CatmullRomCurve3(points))
          : (paths[key as "cam"] = new CatmullRomCurve3(points));
      }

    
    const customEase = CustomEase.create("custom", "M0,0,C0.4,0.018,0.398,0.3,0.507,0.512,0.6,0.693,0.6,0.984,1,1")
    const triggers = [{
      start: "top top",
      end: "top+=50% top",
      ease: customEase,
      pivotDistance: 15
    }, {
      start: "top+=50% top",
      end: "top+=50% top",
      ease: customEase,
      pivotDistance: 10
    }, {
      start: "top+=50% top",
      end: "top+=50% top",
      ease: customEase,
      pivotDistance: 12
    }, {
      start: "top+=50% top",
      end: "bottom top",
      ease: customEase,
      pivotDistance: 12
    }, {
      pivotDistance: 100
    }];
    options.cameraZOffset = triggers[0].pivotDistance;
    let timelines = [];
    for (let index = 0; index < 4; index++) {
      timelines[index] = gsap.timeline({
        paused: !0
      }).fromTo(options, {
        scrollPosition: .01 * objectData.paths.cam[1].stops[index],
        cameraZOffset: triggers[index].pivotDistance
      }, {
        scrollPosition: .01 * objectData.paths.cam[1].stops[index + 1],
        cameraZOffset: triggers[index + 1].pivotDistance,
        ease: triggers[index].ease,
        immediateRender: !1
      });
    }
    
    return {
      pathTween,
      paths,
      cameraPosition: new Vector3(),
      cameraLookAt: new Vector3(),
      _euler: new Euler(),
      _quaternion: new Quaternion(),
      brownianMotion,
      smoothMouse: [new Vector2(), new Vector2()],
      timelines
    };
  }, [options]);

  const handleScroll: Handler<"scroll" | "wheel" | "drag", UIEvent> = ({
    direction: [_, y],
    intentional,
    event,
    first,
    delta: [deltaX, deltaY],
    type,
  }) => {
    if (y !== 0) {
      const newVal =
        options.scrollPosition +
        deltaY *
          (type.startsWith("pointer")
            ? progressSpeed.pointer
            : progressSpeed.wheel);
      options.scrollPosition = Math.min(Math.max(newVal, 0), 1);
      dispatch(setProgress(Math.min(Math.max(newVal, 0), 1)));
    }
  };

  useEffect(() => {

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const searchParams = useSearchParams();

  useGesture(
    {
      // onWheel: handleScroll,
      onWheel: handleScroll,
      onScroll: handleScroll,
      onDrag: handleScroll,
    },
    {
      eventOptions: {
        passive: false,
      },
      target: document?.querySelector("main") || undefined,
    }
  );
  const props = useSpring({
    springProgress: options.scrollPosition,
    config: {
      easing: easings.easeInBack,
    },
  });

  useFrame(({ camera, mouse }) => {
    // const index = options.scrollPosition/4 < 1/4 ? 0 : options.scrollPosition/4 < 1/2 ? 1 : options.scrollPosition/4 < 3/4 ? 2 : 3;
    // const start = options.scrollPosition/4 < 1/4 ? 0 : options.scrollPosition/4 < 1/2 ? 1/4 : options.scrollPosition/4 < 3/4 ? 1/2 : 3/4;
    // const end = options.scrollPosition/4 < 1/4 ? 1/4 : options.scrollPosition/4 < 1/2 ? 1/2 : options.scrollPosition/4 < 3/4 ? 3/4 : 1;
    // const progress = range(options.scrollPosition, start, end)
    // timelines[index].progress(progress)
    pathTween.progress(props.springProgress.get());
    smoothMouse[0].lerp(mouse, 0.03);
    smoothMouse[0].lerp(mouse, 0.04);

    paths.cam.getPointAt(props.springProgress.get(), cameraPosition);
    isMobile
      ? ((paths as any).tgt as CatmullRomCurve3).getPointAt(
          options.cameraTargetPathProgress,
          cameraLookAt
        )
      : ((paths as any)["tgt-mob"] as CatmullRomCurve3).getPointAt(
          options.cameraTargetPathProgress,
          cameraLookAt
        );
    camera.position.copy(cameraPosition);
    camera.lookAt(cameraLookAt);
    camera.translateZ(options.cameraZTranslate);
    camera.translateY(options.cameraYTranslate);
    window.matchMedia("(pointer: coarse)").matches ||
      searchParams.has("controls") ||
      (brownianMotion.update(0.05),
      camera.updateMatrix(),
      camera.matrix.multiply(brownianMotion.matrix),
      camera.matrix.decompose(camera.position, camera.quaternion, camera.scale),
      camera.translateZ(-options.cameraZOffset),
      _euler.set(
        smoothMouse[0].y * options.mouseMoveAngle.y,
        -smoothMouse[0].x * options.mouseMoveAngle.x,
        0
      ),
      _quaternion.setFromEuler(_euler),
      camera.quaternion.multiply(_quaternion),
      _euler.set(0, 0, -0.05 * (smoothMouse[0].x - smoothMouse[1].x)),
      _quaternion.setFromEuler(_euler),
      camera.quaternion.multiply(_quaternion),
      camera.translateZ(options.cameraZOffset),
      camera.updateMatrixWorld());
  });

  return <></>;
};

export default NavigationControls;
