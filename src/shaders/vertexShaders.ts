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