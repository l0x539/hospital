export const towerFragmentShader = `#define GLSLIFY 1
float blendLighten(float base, float blend) {
        return max(blend,base);
}

vec3 blendLighten(vec3 base, vec3 blend) {
        return vec3(blendLighten(base.r,blend.r),blendLighten(base.g,blend.g),blendLighten(base.b,blend.b));
}

vec3 blendLighten(vec3 base, vec3 blend, float opacity) {
        return (blendLighten(base, blend) * opacity + base * (1.0 - opacity));
}

vec3 blendMultiply(vec3 base, vec3 blend) {
        return base*blend;
}

vec3 blendMultiply(vec3 base, vec3 blend, float opacity) {
        return (blendMultiply(base, blend) * opacity + base * (1.0 - opacity));
}

float blendOverlay(float base, float blend) {
        return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
}

vec3 blendOverlay(vec3 base, vec3 blend) {
        return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
}

vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
        return (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));
}

float blendSoftLight(float base, float blend) {
        return (blend<0.5)?(2.0*base*blend+base*base*(1.0-2.0*blend)):(sqrt(base)*(2.0*blend-1.0)+2.0*base*(1.0-blend));
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
        return vec3(blendSoftLight(base.r,blend.r),blendSoftLight(base.g,blend.g),blendSoftLight(base.b,blend.b));
}

vec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {
        return (blendSoftLight(base, blend) * opacity + base * (1.0 - opacity));
}

float blendColorDodge(float base, float blend) {
        return (blend==1.0)?blend:min(base/(1.0-blend),1.0);
}

vec3 blendColorDodge(vec3 base, vec3 blend) {
        return vec3(blendColorDodge(base.r,blend.r),blendColorDodge(base.g,blend.g),blendColorDodge(base.b,blend.b));
}

vec3 blendColorDodge(vec3 base, vec3 blend, float opacity) {
        return (blendColorDodge(base, blend) * opacity + base * (1.0 - opacity));
}

float blendScreen(float base, float blend) {
        return 1.0-((1.0-base)*(1.0-blend));
}

vec3 blendScreen(vec3 base, vec3 blend) {
        return vec3(blendScreen(base.r,blend.r),blendScreen(base.g,blend.g),blendScreen(base.b,blend.b));
}

vec3 blendScreen(vec3 base, vec3 blend, float opacity) {
        return (blendScreen(base, blend) * opacity + base * (1.0 - opacity));
}

// Passed through the vertex shader
// UVs
varying vec2 vUv;
varying vec2 vUv1;
varying vec2 vUv2;
varying vec2 vUv3;
varying vec2 vUv4;
// Color attributes
varying vec4 c0_wall;
varying vec4 c1_rails;
varying vec4 c2_windows;
varying vec4 c3_pillars;

varying vec3 vNormal;
varying vec3 vObjectNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPos; // Global vertex position
varying vec3 vLocalPos; // Local vertex position
varying float vNoise;

// Uniforms
uniform float uTime;
uniform bool uAnimate;
uniform float uAnimateUp;
uniform bool uUseNoise;
uniform float uProgress; // Animation progress variable
uniform float uFloorIndex;
uniform float uGroundFloorBegin;

// Baked Textures
uniform sampler2D tMatCap;
uniform sampler2D tWallsTex;
uniform sampler2D tWindowsTex;
uniform sampler2D tPillarsTex;
// Detail textures
uniform sampler2D tRepeatedTexWalls;
// uniform sampler2D tRepeatedTexRails;
uniform sampler2D tRailsMaskTex;
uniform sampler2D tRepeatedTexWindows;
uniform sampler2D tRepeatedTexPillars;

// Masking textures
uniform sampler2D tHexText; // Hex grid texture
uniform sampler2D tRecText; // Recursive texture
uniform float uHexTexScale;
uniform float uRecTexScale;

// Effect fine tuning uniforms
uniform float uOverallGradientSpread;
uniform float uEdgeTextureSubtractStrength; // Controls how much of the texture we subtract from the edge
uniform float uFlameBandWidth; // How "thick" the flame is
uniform float uFlameColorChangeOffset; // Where the flame colours change in the gradient
uniform float uFlameColorGradientSpread; // How steeply or smoothly to interpolate between the flame colours
uniform float uFlameStrength; // How bright the flame colour is

uniform vec3 uFlameTopColor;
uniform vec3 uFlameBottomColor;

uniform float uFragNoiseSpeed;
uniform float uFragNoiseScale;
uniform float uFragNoiseStrength;

// Balconies
uniform int uBalconyBlendMode;
uniform vec3 uBalconyBaseColorTop;
uniform vec3 uBalconyBaseColorBottom;
uniform float uBalconyAlphaBlend;
uniform float uBalconyMaskAlphaMin;
uniform float uBalconyMaskAlphaMax;
uniform int uBalconyScanLinesBlendMode;
uniform float uBalconyScanLinesSpeed;
uniform float uBalconyScanLinesDensity;
uniform float uBalconyScanLinesStrength;
uniform float uBalconyScanLinesMaxDistance;

#include <fogParamsFrag>

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

//      Classic Perlin 3D Noise 
//      by Stefan Gustavson
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

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

void main() {

  //Time
  float time;
  if (uAnimate) time = uTime * 1.;
  else time = 0.0;

  // matcap UVs
  vec3 normal = normalize( vNormal );
        vec3 viewDir = normalize( vViewPosition );
        vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
        vec3 y = cross( viewDir, x );
        vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;

  float noise = 1.;
  if (uUseNoise) {
    noise = cnoise( vec3(vWorldPos.x * uFragNoiseScale, vWorldPos.y * uFragNoiseScale - time * uFragNoiseSpeed * uAnimateUp, vWorldPos.z * uFragNoiseScale) );
  }

  // Textures for masking
  #ifdef IS_WALL

    vec4 tHex = texture2D(tHexText, vUv4 * vec2(uHexTexScale)); // hex texture

    // vec4 tHex = texture2D(tHexText, (vUv4+vec2(0.0, .0)) * vec2(uHexTexScale)); // hex texture
    // vec4 tRecursive = texture2D(tRecText, (vUv4+vec2(0.0, time)) * vec2(uRecTexScale)); // Recursive subdivision texture
  #else
    vec4 tHex = texture2D(tHexText, vUv * vec2(uHexTexScale)); // hex texture
  #endif

  // Clamp to make it a bit brighter
  float tHexClamped = clamp(tHex.r, 0.2, 1.0);

  // Noise
  // float sine = sin(2.5 * time + uv.y + vWorldPos.y - vWorldPos.x) * 0.15;

  vec4 baseColor;
  if (c0_wall.r > 0.0) {
    // Sample walls
    baseColor = vec4(blendSoftLight(texture2D(tWallsTex, vUv).rgb, texture2D(tRepeatedTexWalls, vUv * 35.).rgb, 1.), 1.0 );
  } else if (c1_rails.r > 0.0) {
    // Sample rails (balconies)

    /**
      Balconies material
    */
    // Mask alpha with the texture
    // float balconyMask = clamp(texture2D(tRepeatedTexRails, vUv1 * 12.).r, uBalconyMaskAlphaMin, uBalconyMaskAlphaMax);
    // Blend mask with gradient
    float balconyGradient = texture2D(tRailsMaskTex, vUv1).r;
    
    // float alphaMask;
    // if(uBalconyBlendMode == 0) {
    //   alphaMask = vec4(blendOverlay( vec3(balconyGradient), vec3(balconyMask), uBalconyAlphaBlend ), 1.0).r;
    // } else if(uBalconyBlendMode == 1) {
    //   alphaMask = vec4(blendSoftLight( vec3(balconyGradient), vec3(balconyMask), uBalconyAlphaBlend ), 1.0).r;
    // } else {
    //   alphaMask = vec4(blendColorDodge( vec3(balconyGradient), vec3(balconyMask), uBalconyAlphaBlend ), 1.0).r;
    // }
    
    //Base colour blend
    // baseColor.rgb = mix(uBalconyBaseColorBottom, uBalconyBaseColorTop, balconyGradient);

    vec3 scanLines = vec3( sin( ( fract(0.99) * uBalconyScanLinesDensity * vWorldPos.y + uTime * uBalconyScanLinesSpeed ) * 10. ));
    scanLines *= (1.0 - smoothstep( 5., uBalconyScanLinesMaxDistance, distance(cameraPosition, vWorldPos) ) * 0.7 );
    
    vec3 scanCol;
    if(uBalconyScanLinesBlendMode == 0) {
      scanCol = blendOverlay(vec3(balconyGradient), scanLines, uBalconyScanLinesStrength);
    } else if(uBalconyScanLinesBlendMode == 1) {
      scanCol = blendSoftLight(vec3(balconyGradient), scanLines, uBalconyScanLinesStrength);
    } else if(uBalconyScanLinesBlendMode == 2){
      scanCol = blendColorDodge(vec3(balconyGradient), scanLines, uBalconyScanLinesStrength);
    } else if(uBalconyScanLinesBlendMode == 3){
      scanCol = vec3(balconyGradient) + scanLines * uBalconyScanLinesStrength;
    } else {
      scanCol = vec3(balconyGradient) - scanLines * uBalconyScanLinesStrength;
    }

    baseColor.rgb = mix(uBalconyBaseColorBottom, uBalconyBaseColorTop, scanCol.r);
    baseColor = vec4(baseColor.rgb, balconyGradient);

  } else if (c2_windows.r > 0.0) {
    // Sample windows
    baseColor = vec4( blendMultiply(texture2D(tWindowsTex, vUv2).rgb, texture2D(tRepeatedTexWindows, vUv2 * 4.).rgb, 0.1), 1.0 );
    float windowMask = clamp(texture2D(tRepeatedTexWindows, vUv2 * 4.).r, 0.5, 0.7);
    baseColor = vec4(baseColor.rgb, windowMask);
  } else if (c3_pillars.r > 0.0) {
    // Sample pillars
    // baseColor = vec4(texture2D(tPillarsTex, vUv3).rgb, 1.0);
    baseColor = vec4(blendSoftLight(texture2D(tPillarsTex, vUv3).rgb, texture2D(tRepeatedTexPillars, vUv3 * 9.).rgb, 1.), 1.0 );
  } 

  float objectSize = 26.0 * 4.;
  float initialRaiseInScene = 3.0;

  float mappedY = map(vWorldPos.y, initialRaiseInScene, objectSize + initialRaiseInScene, 0.0, 1.0); // + 5.90779 because this is where the reveal box begins in the scene world coords.
  float uProgressMapped = map(uProgress, 0.0, 1.0, 0.0, 1.0 + abs(uGroundFloorBegin));
  float progress = uProgressMapped + uGroundFloorBegin;

  float bottomEdge = mappedY - progress;
  bottomEdge /= uOverallGradientSpread;
  float topEdge = bottomEdge - uFlameBandWidth; // Top edge

  // Gradient edge where the flame colours will change
  // float colorChangeEdge = bottomEdge - uFlameColorChangeOffset - sin(vNoise + time * 10. + vWorldPos.x * 0.2) * 0.05; // Offset to control where the middle point is of the change
  float colorChangeEdge = bottomEdge - uFlameColorChangeOffset - noise * uFragNoiseStrength;
  float colorChangeEdgeSteepness = colorChangeEdge/uFlameColorGradientSpread;
  float clampedColorChangeEdgeGradient = clamp(colorChangeEdgeSteepness, 0.0, 1.0); // Make sure to clamp the range before using it for colours

  /** 
    Edge effects
  */
  // Bottom edge: flamed + sharp (no gradient) edge
  // float flameBottomEdge = bottomEdge - tHex.r * uEdgeTextureSubtractStrength - sin(2. * uTime - (vWorldPos.y - vWorldPos.x) * 2.) * 0.01; // "flame" the edge line to add detail, this essentially flames it UP because it subtracts more
  float flameBottomEdge = bottomEdge - tHex.r * uEdgeTextureSubtractStrength + noise * uFragNoiseStrength;
  float flamedSharpEdge = step(0.0, flameBottomEdge); // make a sharp edge line instead of gradient, flamed; top part white, bottom black

  // Top edge : flamed + sharp (no gradient) edge
  float flameTopEdge = topEdge - tHex.r * uEdgeTextureSubtractStrength + noise * uFragNoiseStrength;
  float flamedSharpTopEdge = step(0.0, flameTopEdge);

  // Alpha masking
  // Mask the desired top bit with textures
  float texturedEdgeMask = flamedSharpEdge * (1.0 - tHexClamped * uFlameStrength); 
  // float texturedEdgeMask = flamedSharpEdge; 
  // Invert it so we can add another mask (the top edge mask)
  float invertedTexturedEdgeMask = 1.0 - texturedEdgeMask;
  // Mask layer 2: add mask width (aka top edge mask)
  float texturedAlphaMask = invertedTexturedEdgeMask * (1.0 - flamedSharpTopEdge); // Use this for alpha ! // Flamed

  // Apply final colours
  vec4 layer1flameColor = vec4(mix(uFlameBottomColor, uFlameTopColor, clampedColorChangeEdgeGradient), 1.0);
  vec4 overallColor = mix(baseColor, layer1flameColor, flamedSharpEdge); // Mask it with the base

  // Apply matcaps
  #ifdef USE_MATCAP
                vec4 matcapColor = texture2D( tMatCap, uv );
        #else
          vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
        #endif
        // vec3 outgoingLight = overallColor.rgb * matcapColor.rgb; 
        vec4 outgoingLight = overallColor; // ignore matcaps for now

  if (texturedAlphaMask * overallColor.a <= 0.) {
    discard;
  }

  // Apply alpha mask
  gl_FragColor = vec4(outgoingLight.rgb, texturedAlphaMask * overallColor.a);
  // gl_FragColor = vec4(vec3(c.rgb), 1.0);

  #include <tonemapping_fragment>
  // Add fog
  #include <fogOutputFrag>

}`

export const fogFragmentShader = `#define GLSLIFY 1
float blendSoftLight(float base, float blend) {
        return (blend<0.5)?(2.0*base*blend+base*base*(1.0-2.0*blend)):(sqrt(base)*(2.0*blend-1.0)+2.0*base*(1.0-blend));
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
        return vec3(blendSoftLight(base.r,blend.r),blendSoftLight(base.g,blend.g),blendSoftLight(base.b,blend.b));
}

vec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {
        return (blendSoftLight(base, blend) * opacity + base * (1.0 - opacity));
}

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform float uProgress;
uniform vec3 uColor;
uniform sampler2D uTexture; 
uniform sampler2D uRepeatTexture; 

#include <fogParamsFrag>

void main() {

    #ifdef USE_TEXTURE
        #ifdef IS_PILLARS
            vec4 diffuse = texture2D(uTexture, vUv);
            gl_FragColor = vec4(blendSoftLight(diffuse.rgb, texture2D(uRepeatTexture, vUv * 15.).rgb, 1.), diffuse.a );
        #else
            gl_FragColor = texture2D(uTexture, vUv);
        #endif
    #else 
        gl_FragColor = vec4(uColor, 1.0);
    #endif
    
    #include <tonemapping_fragment>
    // Add fog
    #include <fogOutputFrag>
}`;