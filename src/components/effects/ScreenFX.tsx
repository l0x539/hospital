import React, { forwardRef, useMemo } from 'react'
import { Texture, Uniform, WebGLRenderTarget, WebGLRenderer } from 'three'
import { Effect } from 'postprocessing'

const fragmentShader = `#define GLSLIFY 1

uniform sampler2D tDiffuse;
uniform float uMaxDistort;
uniform int uIterations;
uniform float uBendAmount;

const int iterations = 5;

vec2 barrelDistortion(vec2 coord, float amt) {
  vec2 cc = coord - 0.5;
  float dist = dot(cc, cc);
  return coord + cc * dist * amt;
}

float sat( float t ) {
  return clamp( t, 0.0, 1.0 );
}

float linterp( float t ) {
  return sat( 1.0 - abs( 2.0*t - 1.0 ) );
}

float remap( float t, float a, float b ) {
  return sat( (t - a) / (b - a) );
}

vec4 spectrum_offset( float t ) {
  vec4 ret;
  float lo = step(t,0.5);
  float hi = 1.0-lo;
  float w = linterp( remap( t, 1.0/6.0, 5.0/6.0 ) );
  ret = vec4(lo,1.0,hi, 1.) * vec4(1.0-w, w, 1.0-w, 1.);

  return pow( ret, vec4(1.0/2.2) );
}

void mainImage(const in vec4 inputColor, const in vec2 vUv, out vec4 outputColor) {
    vec4 sumcol = vec4(0.0);
    vec4 sumw = vec4(0.0);
    float reci_num_iter_f = 1.0 / float(iterations);
    for (int i = 0; i < iterations; i++){
      float t = float(i) * reci_num_iter_f;
      vec4 w = spectrum_offset( t );
      sumw += w;
      sumcol += w * texture2D( tDiffuse, barrelDistortion(vUv, uBendAmount * uMaxDistort*t ) );
    }

    outputColor = vec4(sumcol / sumw);
}`

let _uMaxDistort: number;
let _uBendAmount: number;
let _uTexture: Texture;

// Effect implementation
class ScreenFXImpl extends Effect {
  constructor({ maxDistort = 0.251, bendAmount = -.272, diffuse }: {
    maxDistort: number;
    bendAmount: number;
    diffuse?: any;
  }) {
    super('ScreenFX', fragmentShader, {
      uniforms: new Map([
        ['uMaxDistort', new Uniform(maxDistort)],
        ['uBendAmount', new Uniform(bendAmount)],
        ['tDiffuse', new Uniform(diffuse)],
      ])
    });

    _uMaxDistort = maxDistort
    _uBendAmount = bendAmount
    _uTexture = diffuse
  }

  update(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget, deltaTime: number) {
    const maxDistort = this.uniforms.get('uMaxDistort')
    maxDistort && (maxDistort.value = _uMaxDistort);

    const bendAmount = this.uniforms.get('uBendAmount')
    bendAmount && (bendAmount.value = _uBendAmount);

    // const diffuse = this.uniforms.get('tDiffuse')
    // diffuse && (diffuse.value = _uTexture);

    const diffuse = this.uniforms.get('tDiffuse')
    diffuse && (diffuse.value = inputBuffer.texture);
  }
}

// Effect component
export const ScreenFX = forwardRef<unknown, {maxDistort: number;bendAmount: number;diffuse?: Texture}>(({ maxDistort, bendAmount, diffuse }, ref) => {
  const effect = useMemo(() => new ScreenFXImpl({maxDistort, bendAmount}), [maxDistort, bendAmount, diffuse])
  return <primitive ref={ref} object={effect} dispose={null} />
});

ScreenFX.displayName = 'ScreenFX';