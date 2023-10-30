import gsap from "gsap";
import { objectData } from "./constants";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";

export default function glslifyStrip(snippet: string) {
	return snippet.replace(/#define\sGLSLIFY\s./, '')
}

export function range(offset: number, from: number, distance: number, margin = 0) {
  const start = from - margin;
  const end = start + distance + margin * 2;
  return offset < start ? 0 : offset > end ? 1 : (offset - start) / (end - start);
}

const prefC = function() {
  let t = 1
    , e = 1;
  const n: any = [];
  for (let t = 0; t < 256; ++t)
      n.push(Math.random());
  const i = function(t: number, e: number, n: number) {
      return t * (1 - n) + e * n
  };
  return {
      getVal: function(r: number) {
          const s = r * e
            , o = Math.floor(s)
            , a = s - o
            , l = a * a * (3 - 2 * a)
            , h = 255 & o
            , c = h + 1 & 255;
          return i(n[h], n[c], l) * t
      },
      setAmplitude: function(e: number) {
          t = e
      },
      setScale: function(t: number) {
          e = t
      }
  }
}

const fC = new (prefC as any)();

function mC(t: number, e: number) {
  let n = 0
    , i = .5;
  for (let r = 0; r < e; r++)
      n += i * fC.getVal(t),
      t *= 2,
      i *= .5;
  return n
}

const uC = new Euler;
const pC = 1 / .75;

export class BrownianMotion {
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
  matrix: Matrix4;
  enablePositionNoise: boolean;
  enableRotationNoise: boolean;
  positionFrequency: number;
  rotationFrequency: number;
  positionAmplitude: number;
  rotationAmplitude: number;
  positionScale: Vector3;
  rotationScale: Vector3;
  positionFractalLevel: number;
  rotationFractalLevel: number;
  times: Float32Array;
  vec3: Vector3;
  constructor() {
    this.position = new Vector3,
    this.rotation = new Quaternion,
    this.scale = new Vector3(1,1,1),
    this.matrix = new Matrix4,
    this.enablePositionNoise = !0,
    this.enableRotationNoise = !0,
    this.positionFrequency = .25,
    this.rotationFrequency = .25,
    this.positionAmplitude = .3,
    this.rotationAmplitude = .003,
    this.positionScale = new Vector3(1,1,1),
    this.rotationScale = new Vector3(1,1,0),
    this.positionFractalLevel = 3,
    this.rotationFractalLevel = 3,
    this.times = new Float32Array(6),
    this.vec3 = new Vector3
    this.rehash()
  }

  rehash() {
    for (let t = 0; t < 6; t++)
      this.times[t] = -1e4 * Math.random()
  }

  update(t: number) {
    let e;
    if (t = void 0 === t ? 1e3 / 60 : t,
    this.enablePositionNoise) {
        for (e = 0; e < 3; e++)
            this.times[e] += this.positionFrequency * t;
        this.vec3.set(mC(this.times[0], this.positionFractalLevel), mC(this.times[1], this.positionFractalLevel), mC(this.times[2], this.positionFractalLevel)),
        this.vec3.multiply(this.positionScale),
        this.vec3.multiplyScalar(this.positionAmplitude * pC),
        this.position.copy(this.vec3)
    }
    if (this.enableRotationNoise) {
        for (e = 0; e < 3; e++)
            this.times[e + 3] += this.rotationFrequency * t;
        this.vec3.set(mC(this.times[3], this.rotationFractalLevel), mC(this.times[4], this.rotationFractalLevel), mC(this.times[5], this.rotationFractalLevel)),
        this.vec3.multiply(this.rotationScale),
        this.vec3.multiplyScalar(this.rotationAmplitude * pC),
        uC.set(this.vec3.x, this.vec3.y, this.vec3.z),
        this.rotation.setFromEuler(uC)
    }
    this.matrix.compose(this.position, this.rotation, this.scale)
  }
}