import { cp } from "fs";

export const towerVertexShader = `#define GLSLIFY 1
// All color attributes for each material
attribute vec4 color;
attribute vec4 color_1;
attribute vec4 color_2;
attribute vec4 color_3;
attribute vec4 color_4;

// Additional UV maps
attribute vec2 texcoord_2;
attribute vec2 texcoord_3;
attribute vec2 texcoord_4;

// Values to be passed to fragment shader
varying vec3 vNormal;
varying vec3 vObjectNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPos;
varying vec3 vLocalPos;
varying float vNoise;
// UVs
varying vec2 vUv;
varying vec2 vUv1;
varying vec2 vUv2;
varying vec2 vUv3;
varying vec2 vUv4; // All UVs
// Color attributes
varying vec4 c0_wall;
varying vec4 c1_rails;
varying vec4 c2_windows;
varying vec4 c3_pillars;

uniform float uTime;
uniform bool uAnimate;
uniform float uProgress;
uniform float uFloorIndex;
uniform float uGroundFloorBegin;
uniform float uOverallGradientSpread;

uniform sampler2D tRecText;
uniform float uRecTexScale;

uniform int uVertDispType;
uniform float uVertGradientSpread;
uniform float uVertDispMult;
uniform float uVertFalloffStart;
uniform float uVertFalloffEnd;
uniform float uVertNoiseSpeed;
uniform float uVertNoiseScale;
uniform float uVertNoiseStrength;

// Fog params
#include <fogParamsVert>

void main()     {
    
    vec3 objectNormal = vec3(normal);
    vObjectNormal = objectNormal;
    vec3 transformedNormal = objectNormal;
    #ifdef USE_INSTANCING
        mat3 m = mat3( instanceMatrix );
        transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );
        transformedNormal = m * transformedNormal;
    #endif
    transformedNormal = normalMatrix * transformedNormal;
    vNormal = transformedNormal;
    
    vUv = uv;
    
    vec3 transformedPosition = position;
    vec4 pos = modelMatrix * vec4(position, 1.0);
    vWorldPos = pos.xyz; // global coordinates
    vLocalPos = position; // Local position

    //Time
    float time;
    if (uAnimate) time = uTime;
    else time = 0.0;

    vec4 mvPosition = vec4( transformedPosition, 1.0 );
    #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
    #endif

    mvPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * mvPosition;
    vViewPosition = -mvPosition.xyz;

    // Pass through
    vUv1 = uv2;
    vUv2 = texcoord_2;
    vUv3 = texcoord_3;
    vUv4 = texcoord_4;
    c0_wall = color_2;
    c1_rails = color_3; 
    c2_windows = color_4; 
    c3_pillars = color;

    #include <fogOutputVert>

}`;

export const fogVertexShader = `#define GLSLIFY 1
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform float uProgress;

attribute vec2 texcoord_3; // Pillars UV map

#include <fogParamsVert>

void main() {
    
    vec3 objectNormal = vec3(normal);
    vec3 transformedNormal = objectNormal;
    transformedNormal = normalMatrix * transformedNormal;
    vNormal = transformedNormal;
    #ifdef IS_PILLARS
        vUv = texcoord_3;
    #else
        vUv = uv;
    #endif
    
    vec3 transformedPosition = position;

    vec4 mvPosition = vec4( transformedPosition, 1.0 );
    mvPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * mvPosition;
    vViewPosition = -mvPosition.xyz;

    #include <fogOutputVert>

}`

export const pipesVertexShader = `#define GLSLIFY 1
varying vec2 vUv;
varying vec3 vFakeUv;
varying float vAlpha;
// Reveal
uniform float uProgress;
uniform float uGradientSpread;

#include <fogParamsVert>

// Line material
#include <common>
#include <color_pars_vertex>
#include <clipping_planes_pars_vertex>
#include <logdepthbuf_pars_vertex>

uniform float linewidth;
uniform vec2 resolution;
attribute vec3 instanceStart;
attribute vec3 instanceEnd;
attribute vec3 instanceColorStart;
attribute vec3 instanceColorEnd;
varying vec4 worldPos;
varying vec3 worldStart;
varying vec3 worldEnd;
#ifdef USE_DASH
    uniform float dashScale;
    attribute float instanceDistanceStart;
    attribute float instanceDistanceEnd;
    varying float vLineDistance;
#endif

void trimSegment( const in vec4 start, inout vec4 end ) {
    // trim end segment so it terminates between the camera plane and the near plane
    // conservative estimate of the near plane
    float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
    float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
    float nearEstimate = - 0.5 * b / a;
    float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );
    end.xyz = mix( start.xyz, end.xyz, alpha );
}

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

mat4 inverseMat4(mat4 m) {
  float
      a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
      a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
      a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
      a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],

      b00 = a00 * a11 - a01 * a10,
      b01 = a00 * a12 - a02 * a10,
      b02 = a00 * a13 - a03 * a10,
      b03 = a01 * a12 - a02 * a11,
      b04 = a01 * a13 - a03 * a11,
      b05 = a02 * a13 - a03 * a12,
      b06 = a20 * a31 - a21 * a30,
      b07 = a20 * a32 - a22 * a30,
      b08 = a20 * a33 - a23 * a30,
      b09 = a21 * a32 - a22 * a31,
      b10 = a21 * a33 - a23 * a31,
      b11 = a22 * a33 - a23 * a32,

      det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  return mat4(
      a11 * b11 - a12 * b10 + a13 * b09,
      a02 * b10 - a01 * b11 - a03 * b09,
      a31 * b05 - a32 * b04 + a33 * b03,
      a22 * b04 - a21 * b05 - a23 * b03,
      a12 * b08 - a10 * b11 - a13 * b07,
      a00 * b11 - a02 * b08 + a03 * b07,
      a32 * b02 - a30 * b05 - a33 * b01,
      a20 * b05 - a22 * b02 + a23 * b01,
      a10 * b10 - a11 * b08 + a13 * b06,
      a01 * b08 - a00 * b10 - a03 * b06,
      a30 * b04 - a31 * b02 + a33 * b00,
      a21 * b02 - a20 * b04 - a23 * b00,
      a11 * b07 - a10 * b09 - a12 * b06,
      a00 * b09 - a01 * b07 + a02 * b06,
      a31 * b01 - a30 * b03 - a32 * b00,
      a20 * b03 - a21 * b01 + a22 * b00) / det;
}

void main() {
    
    vec3 objectNormal = vec3(normal);
    vec3 transformedNormal = objectNormal;
    transformedNormal = normalMatrix * transformedNormal;
    
    #ifdef USE_COLOR
        vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;
    #endif
    #ifdef USE_DASH
        vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
    #endif
    float aspect = resolution.x / resolution.y;
    vUv = uv;
    // camera space
    vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
    vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );
    worldStart = start.xyz;
    worldEnd = end.xyz;
    // special case for perspective projection, and segments that terminate either in, or behind, the camera plane
    // clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
    // but we need to perform ndc-space calculations in the shader, so we must address this issue directly
    // perhaps there is a more elegant solution -- WestLangley
    bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column
    if ( perspective ) {
        if ( start.z < 0.0 && end.z >= 0.0 ) {
            trimSegment( start, end );
        } else if ( end.z < 0.0 && start.z >= 0.0 ) {
            trimSegment( end, start );
        }
    }
    // clip space
    vec4 clipStart = projectionMatrix * start;
    vec4 clipEnd = projectionMatrix * end;
    // ndc space
    vec3 ndcStart = clipStart.xyz / clipStart.w;
    vec3 ndcEnd = clipEnd.xyz / clipEnd.w;
    // direction
    vec2 dir = ndcEnd.xy - ndcStart.xy;
    // account for clip-space aspect ratio
    dir.x *= aspect;
    dir = normalize( dir );

    #ifdef WORLD_UNITS
        // get the offset direction as perpendicular to the view vector
        vec3 worldDir = normalize( end.xyz - start.xyz );
        vec3 offset;
        if ( position.y < 0.5 ) {
            offset = normalize( cross( start.xyz, worldDir ) );
        } else {
            offset = normalize( cross( end.xyz, worldDir ) );
        }
        // sign flip
        if ( position.x < 0.0 ) offset *= - 1.0;
        float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );
        // don't extend the line if we're rendering dashes because we
        // won't be rendering the endcaps
        #ifndef USE_DASH
            // extend the line bounds to encompass  endcaps
            start.xyz += - worldDir * linewidth * 0.5;
            end.xyz += worldDir * linewidth * 0.5;
            // shift the position of the quad so it hugs the forward edge of the line
            offset.xy -= dir * forwardOffset;
            offset.z += 0.5;
        #endif
        // endcaps
        if ( position.y > 1.0 || position.y < 0.0 ) {
            offset.xy += dir * 2.0 * forwardOffset;
        }
        // adjust for linewidth
        offset *= linewidth * 0.5;
        // set the world position
        worldPos = ( position.y < 0.5 ) ? start : end;
        worldPos.xyz += offset;
        // project the worldpos
        vec4 clip = projectionMatrix * worldPos;
        // shift the depth of the projected points so the line
        // segements overlap neatly
        vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
        clip.z = clipPose.z * clip.w;
    #else
    vec2 offset = vec2( dir.y, - dir.x );
    // undo aspect ratio adjustment
    dir.x /= aspect;
    offset.x /= aspect;
    // sign flip
    if ( position.x < 0.0 ) offset *= - 1.0;
    // endcaps
    if ( position.y < 0.0 ) {
        offset += - dir;
    } else if ( position.y > 1.0 ) {
        offset += dir;
    }
    // adjust for linewidth
    offset *= linewidth;
    // adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
    offset /= resolution.y;
    // select end
    vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;
    // back to clip space
    offset *= clip.w;
    clip.xy += offset;
    #endif
    gl_Position = clip;
    vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

    // Reveal
    vec3 myWorldPos = (inverseMat4(viewMatrix) * worldPos).xyz;
    vec3 myLocalPos = (inverseMat4(modelViewMatrix) * worldPos).xyz;
    vec3 transformedPosition = position;

    float objectSize = 26.0 * 4.;
    float mappedY = map(myWorldPos.y, 0.0, objectSize, 0.0, 1.0);
    float mappedX = map(myWorldPos.x, -11.5, 11.5, 0.0, 1.0);
    float mappedZ = map(myWorldPos.z, -11.5, 11.5, 0.0, 1.0);

    float bottomEdge = mappedY - uProgress;
    bottomEdge /= uGradientSpread;
    bottomEdge = clamp(bottomEdge,0.0, 1.0);
    bottomEdge = 1.0 - bottomEdge;

    vAlpha = bottomEdge; // Send the alpha to the fragment to be nicely interpolated
    vFakeUv = vec3(mappedX, mappedY, mappedZ); // Send a "UV" to the fragment to get a gradient between 0 and 1 on XY

    // #include <logdepthbuf_vertex>
    // #include <clipping_planes_vertex>
    #include <fogOutputVert>
}`

export const personVertexShader = `#define GLSLIFY 1
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vViewPosition;

uniform float uProgress;

#include <fogParamsVert>

void main()     {

    vec3 objectNormal = vec3(normal);
    vec3 transformedNormal = objectNormal;
    #ifdef USE_INSTANCING
        mat3 m = mat3( instanceMatrix );
        transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );
        transformedNormal = m * transformedNormal;
    #endif
    transformedNormal = normalMatrix * transformedNormal;
    vNormal = transformedNormal;
    
    vUv = uv;
    
    vec3 transformedPosition = position;
    vWorldPos = vec4( modelMatrix * vec4(position, 1.0) ).xyz; // World coordinates to use for the reveal

    vec4 mvPosition = vec4( transformedPosition, 1.0 );
    #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
    #endif

    mvPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * mvPosition;
    vViewPosition = -mvPosition.xyz;

    #include <fogOutputVert>
}`

export const towersVertexShader = `#define GLSLIFY 1
attribute float startOffset;
attribute float objectHeight;
attribute float textureNum;
attribute float speed;
attribute vec4 color;

// Values to be passed to fragment shader
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPos;
varying vec3 vLocalPos;
varying float vStartOffset;
varying vec2 vUv;
varying float vObjectHeight;
varying float vTextureNumber;
varying float vSpeed;
varying vec4 c_rails;

uniform float uProgress;
uniform float uGroundFloorBegin;

uniform sampler2D tRecText;
uniform float uRecTexScale;

uniform float uVertDispOffset;
uniform float uVertDispMult;
uniform float uVertFalloffStart;
uniform float uVertFalloffEnd;

#include <fogParamsVert>

void main()     {
    
  vec3 objectNormal = vec3(normal);
  vec3 transformedNormal = objectNormal;
  #ifdef USE_INSTANCING
      mat3 m = mat3( instanceMatrix );
      transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );
      transformedNormal = m * transformedNormal;
  #endif
  transformedNormal = normalMatrix * transformedNormal;
  vNormal = transformedNormal;

  vUv = uv;
  vStartOffset = startOffset;
  vObjectHeight = objectHeight;
  vTextureNumber = textureNum;
  vSpeed = speed;

  vec3 transformedPosition = position;
  vWorldPos = vec4(modelMatrix * vec4(position, 1.0)).xyz; // global coordinates
  vLocalPos = position; // Local position

  vec4 mvPosition = vec4( transformedPosition, 1.0 );
  #ifdef USE_INSTANCING
      mvPosition = instanceMatrix * mvPosition;
  #endif

  mvPosition = modelViewMatrix * mvPosition;
  gl_Position = projectionMatrix * mvPosition;
  vViewPosition = -mvPosition.xyz;

  #include <fogOutputVert>

  c_rails = color;
}`;

export const particlesVertexShader = `#define GLSLIFY 1
attribute float size;
attribute float random;

varying float vRandom;
varying float vOpacity;

uniform float uTime;
uniform float uPixelRatio;
uniform vec3 uBounds;

vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
}
vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}
vec3 fade(vec3 t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
}
float pnoise(vec3 P, vec3 rep) {
    vec3 Pi0 = mod(floor(P), rep);
    vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
    vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
    vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
    vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
    vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
    vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
    vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
    vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;
    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
}

const float noiseFreq = 0.5;
const float noiseStrength = 0.5;
const float noiseTime = 0.2;

void main() {
    vRandom = random;

    vec3 pos = position;
    pos.y += uTime * 0.1;

    vec3 displacement = vec3(
        pnoise(noiseFreq * position + vec3(0., uTime * noiseTime, 0.), vec3(101.0)) * noiseStrength,
        pnoise(noiseFreq * position + vec3(0., uTime * noiseTime, 0.), vec3(202.0)) * noiseStrength,
        pnoise(noiseFreq * position + vec3(0., uTime * noiseTime, 0.), vec3(303.0)) * noiseStrength
    );

    pos += displacement;
    pos = mod(pos - cameraPosition, uBounds); // loop position inside bounds

    vec3 opacity = smoothstep(vec3(0.), vec3(5.), pos);
    vOpacity = opacity.x * opacity.y * opacity.z; // fade opacity around edges of bounds

    vOpacity *= smoothstep(40., 20., cameraPosition.z);
    
    vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );

    gl_PointSize = size * ( 300.0 / -mvPosition.z ) * uPixelRatio;

    gl_Position = projectionMatrix * mvPosition;

    vOpacity -= smoothstep(5., 1., -mvPosition.z); // fade opacity close to camera
}`;

export const cityPipeVertexShader = `#define GLSLIFY 1
varying vec2 vUv;
varying vec3 vFakeUv;
varying float vAlpha;

// varying vec2 vUv;
// varying vec3 vNormal;
// varying vec3 vViewPosition;
// varying vec3 vWorldPos;
// varying vec3 vLocalPos;

// Reveal
uniform float uProgress;
uniform float uGradientSpread;
uniform float uGroundFloorBegin;
uniform float uSpeed;
uniform float uStartOffset;

#include <fogParamsVert>

// Line material
#include <common>
#include <color_pars_vertex>
#include <clipping_planes_pars_vertex>
#include <logdepthbuf_pars_vertex>

uniform float linewidth;
uniform vec2 resolution;
attribute vec3 instanceStart;
attribute vec3 instanceEnd;
attribute vec3 instanceColorStart;
attribute vec3 instanceColorEnd;
varying vec4 worldPos;
varying vec3 worldStart;
varying vec3 worldEnd;
#ifdef USE_DASH
    uniform float dashScale;
    attribute float instanceDistanceStart;
    attribute float instanceDistanceEnd;
    varying float vLineDistance;
#endif

void trimSegment( const in vec4 start, inout vec4 end ) {
    // trim end segment so it terminates between the camera plane and the near plane
    // conservative estimate of the near plane
    float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
    float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
    float nearEstimate = - 0.5 * b / a;
    float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );
    end.xyz = mix( start.xyz, end.xyz, alpha );
}

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

mat4 inverseMat4(mat4 m) {
  float
      a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
      a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
      a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
      a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],

      b00 = a00 * a11 - a01 * a10,
      b01 = a00 * a12 - a02 * a10,
      b02 = a00 * a13 - a03 * a10,
      b03 = a01 * a12 - a02 * a11,
      b04 = a01 * a13 - a03 * a11,
      b05 = a02 * a13 - a03 * a12,
      b06 = a20 * a31 - a21 * a30,
      b07 = a20 * a32 - a22 * a30,
      b08 = a20 * a33 - a23 * a30,
      b09 = a21 * a32 - a22 * a31,
      b10 = a21 * a33 - a23 * a31,
      b11 = a22 * a33 - a23 * a32,

      det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  return mat4(
      a11 * b11 - a12 * b10 + a13 * b09,
      a02 * b10 - a01 * b11 - a03 * b09,
      a31 * b05 - a32 * b04 + a33 * b03,
      a22 * b04 - a21 * b05 - a23 * b03,
      a12 * b08 - a10 * b11 - a13 * b07,
      a00 * b11 - a02 * b08 + a03 * b07,
      a32 * b02 - a30 * b05 - a33 * b01,
      a20 * b05 - a22 * b02 + a23 * b01,
      a10 * b10 - a11 * b08 + a13 * b06,
      a01 * b08 - a00 * b10 - a03 * b06,
      a30 * b04 - a31 * b02 + a33 * b00,
      a21 * b02 - a20 * b04 - a23 * b00,
      a11 * b07 - a10 * b09 - a12 * b06,
      a00 * b09 - a01 * b07 + a02 * b06,
      a31 * b01 - a30 * b03 - a32 * b00,
      a20 * b03 - a21 * b01 + a22 * b00) / det;
}

void main() {
    
    vec3 objectNormal = vec3(normal);
    vec3 transformedNormal = objectNormal;
    transformedNormal = normalMatrix * transformedNormal;

    #ifdef USE_COLOR
        vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;
    #endif
    #ifdef USE_DASH
        vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
    #endif
    float aspect = resolution.x / resolution.y;
    vUv = uv;
    // camera space
    vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
    vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );
    worldStart = start.xyz;
    worldEnd = end.xyz;
    // special case for perspective projection, and segments that terminate either in, or behind, the camera plane
    // clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
    // but we need to perform ndc-space calculations in the shader, so we must address this issue directly
    // perhaps there is a more elegant solution -- WestLangley
    bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column
    if ( perspective ) {
        if ( start.z < 0.0 && end.z >= 0.0 ) {
            trimSegment( start, end );
        } else if ( end.z < 0.0 && start.z >= 0.0 ) {
            trimSegment( end, start );
        }
    }
    // clip space
    vec4 clipStart = projectionMatrix * start;
    vec4 clipEnd = projectionMatrix * end;
    // ndc space
    vec3 ndcStart = clipStart.xyz / clipStart.w;
    vec3 ndcEnd = clipEnd.xyz / clipEnd.w;
    // direction
    vec2 dir = ndcEnd.xy - ndcStart.xy;
    // account for clip-space aspect ratio
    dir.x *= aspect;
    dir = normalize( dir );

    #ifdef WORLD_UNITS
        // get the offset direction as perpendicular to the view vector
        vec3 worldDir = normalize( end.xyz - start.xyz );
        vec3 offset;
        if ( position.y < 0.5 ) {
            offset = normalize( cross( start.xyz, worldDir ) );
        } else {
            offset = normalize( cross( end.xyz, worldDir ) );
        }
        // sign flip
        if ( position.x < 0.0 ) offset *= - 1.0;
        float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );
        // don't extend the line if we're rendering dashes because we
        // won't be rendering the endcaps
        #ifndef USE_DASH
            // extend the line bounds to encompass  endcaps
            start.xyz += - worldDir * linewidth * 0.5;
            end.xyz += worldDir * linewidth * 0.5;
            // shift the position of the quad so it hugs the forward edge of the line
            offset.xy -= dir * forwardOffset;
            offset.z += 0.5;
        #endif
        // endcaps
        if ( position.y > 1.0 || position.y < 0.0 ) {
            offset.xy += dir * 2.0 * forwardOffset;
        }
        // adjust for linewidth
        offset *= linewidth * 0.5;
        // set the world position
        worldPos = ( position.y < 0.5 ) ? start : end;
        worldPos.xyz += offset;
        // project the worldpos
        vec4 clip = projectionMatrix * worldPos;
        // shift the depth of the projected points so the line
        // segements overlap neatly
        vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
        clip.z = clipPose.z * clip.w;
    #else
    vec2 offset = vec2( dir.y, - dir.x );
    // undo aspect ratio adjustment
    dir.x /= aspect;
    offset.x /= aspect;
    // sign flip
    if ( position.x < 0.0 ) offset *= - 1.0;
    // endcaps
    if ( position.y < 0.0 ) {
        offset += - dir;
    } else if ( position.y > 1.0 ) {
        offset += dir;
    }
    // adjust for linewidth
    offset *= linewidth;
    // adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
    offset /= resolution.y;
    // select end
    vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;
    // back to clip space
    offset *= clip.w;
    clip.xy += offset;
    #endif
    gl_Position = clip;
    vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

    // Reveal
    vec3 myWorldPos = (inverseMat4(viewMatrix) * worldPos).xyz;
    vec3 myLocalPos = (inverseMat4(modelViewMatrix) * worldPos).xyz;
    vec3 transformedPosition = position;

    float objectSize = 100.;
    float mappedY = map(myWorldPos.y, uGroundFloorBegin, objectSize + 3., 0.0, 1.0);
    float progress = (uProgress + uStartOffset) * uSpeed;
    // float mappedX = map(myWorldPos.x, -11.5, 11.5, 0.0, 1.0);
    // float mappedZ = map(myWorldPos.z, -11.5, 11.5, 0.0, 1.0); 
    float mappedX = map(myLocalPos.x, -27.5, 27.5, 0.0, 1.0); // local // approx for buildings
    float mappedZ = map(myLocalPos.z, -27.5, 27.5, 0.0, 1.0);  // local

    float bottomEdge = mappedY - progress;
    bottomEdge /= uGradientSpread;
    bottomEdge = clamp(bottomEdge,0.0, 1.0);
    bottomEdge = 1.0 - bottomEdge;

    vAlpha = bottomEdge; // Send the alpha to the fragment to be nicely interpolated
    vFakeUv = vec3(mappedX, mappedY, mappedZ); // Send a "UV" to the fragment to get a gradient between 0 and 1 on XY

    #include <fogOutputVert>

}`;

export const carVertexShader = `#define GLSLIFY 1
#define PI 3.14159265359
#define TWO_PI 6.28318530718

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
varying vec3 testCol;

uniform float uStartOffset; // Start offset for the whole car component
uniform float uPartStartOffset; // Start offset for only the part of the component (trail or car mesh)

uniform sampler2D spineTexture;
uniform float pathOffset;
uniform float pathSegment;
uniform float spineOffset;
uniform float spineLength;
uniform int flow;

uniform float uTime;
uniform float uJitterAmplitude;
uniform float uJitterFrequency;
uniform float uNumberOfCurves;
uniform float uTextureHeight;

#include <fogParamsVert>

void main() {

    vec3 objectNormal = vec3(normal);
    vec3 transformedNormal = objectNormal;
    #ifdef USE_INSTANCING
        mat3 m = mat3( instanceMatrix );
        transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );
        transformedNormal = m * transformedNormal;
    #endif
    transformedNormal = normalMatrix * transformedNormal;
    vNormal = transformedNormal;

    vUv = uv;

    vec4 worldPos = modelMatrix * vec4(position, 1.);

    float textureLayers = uTextureHeight * uNumberOfCurves;
    float textureStacks = uTextureHeight / 4.;
    
    bool bend = flow > 0;
    float xWeight = bend ? 0. : 1.;

    #ifdef USE_INSTANCING
    float pathOffsetFromInstanceMatrix = instanceMatrix[3][2];
    float spineLengthFromInstanceMatrix = instanceMatrix[3][0];
    float spinePortion = bend ? (worldPos.x + spineOffset) / spineLengthFromInstanceMatrix : 0.;
    float mt = (spinePortion * pathSegment + pathOffset + pathOffsetFromInstanceMatrix + uStartOffset)*textureStacks;
    #else
    float spinePortion = bend ? (worldPos.x + spineOffset) / spineLength : 0.;
    float mt = (spinePortion * pathSegment + pathOffset + uStartOffset + uPartStartOffset)*textureStacks;
    #endif

    mt = mod(mt, textureStacks);
    float rowOffset = floor(mt);

    #ifdef USE_INSTANCING
    rowOffset += instanceMatrix[3][1] * uTextureHeight;
    #endif

    vec3 spinePos = texture2D(spineTexture, vec2(mt, (0. + rowOffset + 0.5) / textureLayers)).xyz;
    vec3 a =        texture2D(spineTexture, vec2(mt, (1. + rowOffset + 0.5) / textureLayers)).xyz; // tangent
    vec3 b =        texture2D(spineTexture, vec2(mt, (2. + rowOffset + 0.5) / textureLayers)).xyz; // normal (y direction)
    vec3 c =        texture2D(spineTexture, vec2(mt, (3. + rowOffset + 0.5) / textureLayers)).xyz; // binormal
    mat3 basis = mat3(a, b, c);

    vec3 transformedPosition = basis
        * vec3(worldPos.x * xWeight, worldPos.y * 1., worldPos.z * 1.)
        + spinePos;

    // Additional displacement along the curve binormal (side to side) and normal (up and down)
    float amplitude = uJitterAmplitude;
    float frequency = uJitterFrequency;
    float verticalDisplacement = sin(TWO_PI * uTime * frequency) * sin(TWO_PI * uTime * frequency * 1.5) * amplitude;
    float horizontalDisplacement = cos(TWO_PI * uTime * frequency/0.33) * sin(TWO_PI * uTime * frequency * 0.75) * amplitude * 0.25;

    transformedPosition += c * verticalDisplacement + b * horizontalDisplacement;

    vec4 mvPosition = vec4( transformedPosition, 1.0 );    
    #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
    #endif
    mvPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * mvPosition;

    vViewPosition = -mvPosition.xyz;
    
    #include <fogOutputVert>
}`;

export const trailVertexShader = `#define GLSLIFY 1
#define PI 3.14159265359
#define TWO_PI 6.28318530718

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;

uniform float uStartOffset; // Start offset for the whole car component
uniform float uPartStartOffset; // Start offset for only the part of the component (trail or car mesh)

uniform sampler2D spineTexture;
uniform float pathOffset;
uniform float pathSegment;
uniform float spineOffset;
uniform float spineLength;
uniform int flow;

uniform float uTime;
uniform float uJitterAmplitude;
uniform float uJitterFrequency;
uniform float uJitterFollow;
uniform float uNumberOfCurves;
uniform float uTextureHeight;

#include <fogParamsVert>

void main() {

    #include <beginnormal_vertex>

    vUv = uv;
    vNormal = normal;

    // vec4 mvPosition = vec4( position, 1.0 );
    // #ifdef USE_INSTANCING
    //     mvPosition = instanceMatrix * mvPosition;
    // #endif
    // mvPosition = modelViewMatrix * mvPosition;

    vec4 worldPos = modelMatrix * vec4(position, 1.);

    float textureLayers = uTextureHeight * uNumberOfCurves;
    float textureStacks = uTextureHeight / 4.;
    
    bool bend = flow > 0;
    float xWeight = bend ? 0. : 1.;

    #ifdef USE_INSTANCING
    float pathOffsetFromInstanceMatrix = instanceMatrix[3][2];
    float spineLengthFromInstanceMatrix = instanceMatrix[3][0];
    float spinePortion = bend ? (worldPos.x + spineOffset) / spineLengthFromInstanceMatrix : 0.;
    float mt = (spinePortion * pathSegment + pathOffset + pathOffsetFromInstanceMatrix + uStartOffset)*textureStacks;
    #else
    float spinePortion = bend ? (worldPos.x + spineOffset) / spineLength : 0.;
    float mt = (spinePortion * pathSegment + pathOffset + uStartOffset + uPartStartOffset )*textureStacks;
    #endif

    mt = mod(mt, textureStacks);
    float rowOffset = floor(mt);

    #ifdef USE_INSTANCING
    rowOffset += instanceMatrix[3][1] * uTextureHeight;
    #endif

    vec3 spinePos = texture2D(spineTexture, vec2(mt, (0. + rowOffset + 0.5) / textureLayers)).xyz;
    vec3 a =        texture2D(spineTexture, vec2(mt, (1. + rowOffset + 0.5) / textureLayers)).xyz; // tangent
    vec3 b =        texture2D(spineTexture, vec2(mt, (2. + rowOffset + 0.5) / textureLayers)).xyz; // normal (y)
    vec3 c =        texture2D(spineTexture, vec2(mt, (3. + rowOffset + 0.5) / textureLayers)).xyz; // binormal
    mat3 basis = mat3(a, b, c);

    vec3 transformedPosition = basis
        * vec3(worldPos.x * xWeight, worldPos.y * 1., worldPos.z * 1.)
        + spinePos;

    // Additional displacement along the curve binormal (side to side) and normal (up and down)
    float amplitude = uJitterAmplitude;
    float frequency = uJitterFrequency;
    float verticalDisplacement = sin(TWO_PI * uTime * frequency + uJitterFollow) * sin(TWO_PI * uTime * frequency * 1.5 + uJitterFollow) * amplitude;
    float horizontalDisplacement = cos(TWO_PI * uTime * frequency/0.33 + uJitterFollow) * sin(TWO_PI * uTime * frequency * 0.75 + uJitterFollow) * amplitude * 0.25;

    transformedPosition += c * verticalDisplacement + b * horizontalDisplacement;

    vec4 mvPosition = vec4( transformedPosition, 1.0 );    
    #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
    #endif
    mvPosition = modelViewMatrix * mvPosition;
    vViewPosition = -mvPosition.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( transformedPosition, 1.0 );  

    #include <fogOutputVert>

}`;

export const signVertexShader = `#define GLSLIFY 1
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

uniform float uProgress;

#include <fogParamsVert>

void main() {
    
    vec3 objectNormal = vec3(normal);
    vec3 transformedNormal = objectNormal;
    transformedNormal = normalMatrix * transformedNormal;
    vNormal = transformedNormal;
    vUv = uv;
    
    vec3 transformedPosition = position;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz; // global coordinates
    vLocalPos = position; // Local position

    vec4 mvPosition = vec4( transformedPosition, 1.0 );
    mvPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * mvPosition;
    vViewPosition = -mvPosition.xyz;

    #include <fogOutputVert>

}`;

export const citySignVertexShader = `#define GLSLIFY 1
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

uniform float uProgress;

#include <fogParamsVert>

void main() {
    
    vec3 objectNormal = vec3(normal);
    vec3 transformedNormal = objectNormal;
    transformedNormal = normalMatrix * transformedNormal;
    vNormal = transformedNormal;
    vUv = uv;
    
    vec3 transformedPosition = position;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz; // global coordinates
    vLocalPos = position; // Local position

    vec4 mvPosition = vec4( transformedPosition, 1.0 );
    mvPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * mvPosition;
    vViewPosition = -mvPosition.xyz;

    #include <fogOutputVert>

}`;

export const bridgesVertexShade = `#define GLSLIFY 1
attribute vec3 color;

varying vec3 vThreshold;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

uniform float uProgress;

#include <fogParamsVert>

void main() {
    
    vec3 objectNormal = vec3(normal);
    vec3 transformedNormal = objectNormal;
    transformedNormal = normalMatrix * transformedNormal;
    vNormal = transformedNormal;
    vUv = uv;
    
    vec3 transformedPosition = position;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz; // global coordinates
    vLocalPos = position; // Local position

    vec4 mvPosition = vec4( transformedPosition, 1.0 );
    mvPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * mvPosition;
    vViewPosition = -mvPosition.xyz;

    vThreshold = color;

    #include <fogOutputVert>

}`;

export const reflectiveVertexShader = `#define GLSLIFY 1
attribute vec2 uv2;

varying vec4 vMirrorCoord;
varying vec2 vUv;
varying vec2 vUv2;

uniform mat4 uTextureMatrix;

#include <fogParamsVert>

void main () {
        vec3 transformedPosition = position;

        vUv = uv;
        vUv2 = uv2;

        vMirrorCoord = uTextureMatrix * vec4( transformedPosition, 1.0 );

        vec4 mvPosition = vec4( transformedPosition, 1.0 );
        mvPosition = modelViewMatrix * mvPosition;

        gl_Position = projectionMatrix * mvPosition;

        #include <fogOutputVert>
}`;