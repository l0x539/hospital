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

export const pipesFragmentShader = `#define GLSLIFY 1
varying vec3 vFakeUv;
varying float vAlpha;

// Animated colour gradient
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uTime;
uniform float uFloorIndex;
uniform float uBlendFrequency;
uniform float uBlendSpeed;

#include <fogParamsFrag>

// Line material
uniform float opacity;
uniform float linewidth;

#ifdef USE_DASH
  uniform float dashOffset;
  uniform float dashSize;
  uniform float gapSize;
#endif
varying float vLineDistance;
#ifdef WORLD_UNITS
  varying vec4 worldPos;
  varying vec3 worldStart;
  varying vec3 worldEnd;
  #ifdef USE_DASH
    varying vec2 vUv;
  #endif
#else
  varying vec2 vUv;
#endif
#include <common>
// #include <color_pars_fragment>
// #include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

float randomOffset(vec3 value, float index) {
  return (0.5 + 0.5 * cos(value.x) + fract(value.z)) * abs(value.x) * (index + 1.0);
}

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {
  float mua;
  float mub;
  vec3 p13 = p1 - p3;
  vec3 p43 = p4 - p3;
  vec3 p21 = p2 - p1;
  float d1343 = dot( p13, p43 );
  float d4321 = dot( p43, p21 );
  float d1321 = dot( p13, p21 );
  float d4343 = dot( p43, p43 );
  float d2121 = dot( p21, p21 );
  float denom = d2121 * d4343 - d4321 * d4321;
  float numer = d1343 * d4321 - d1321 * d4343;
  mua = numer / denom;
  mua = clamp( mua, 0.0, 1.0 );
  mub = ( d1343 + d4321 * ( mua ) ) / d4343;
  mub = clamp( mub, 0.0, 1.0 );
  return vec2( mua, mub );
}

void main() {
  // #include <clipping_planes_fragment>
  #ifdef USE_DASH
    if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps
    if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX
  #endif
  float alpha = opacity;
  #ifdef WORLD_UNITS
    // Find the closest points on the view ray and the line segment
    vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
    vec3 lineDir = worldEnd - worldStart;
    vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );
    vec3 p1 = worldStart + lineDir * params.x;
    vec3 p2 = rayEnd * params.y;
    vec3 delta = p1 - p2;
    float len = length( delta );
    float norm = len / linewidth;
    #ifndef USE_DASH
      #ifdef USE_ALPHA_TO_COVERAGE
        float dnorm = fwidth( norm );
        alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );
      #else
        if ( norm > 0.5 ) {
          discard;
        }
      #endif
    #endif
  #else
    #ifdef USE_ALPHA_TO_COVERAGE
      // artifacts appear on some hardware if a derivative is taken within a conditional
      float a = vUv.x;
      float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
      float len2 = a * a + b * b;
      float dlen = fwidth( len2 );
      if ( abs( vUv.y ) > 1.0 ) {
        alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );
      }
    #else
      if ( abs( vUv.y ) > 1.0 ) {
        float a = vUv.x;
        float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
        float len2 = a * a + b * b;
        if ( len2 > 1.0 ) discard;
      }
    #endif
  #endif
  
  // #include <logdepthbuf_fragment>

  if (vAlpha < 0.05) {
    discard;
  }

  float sinMix = 0.5 + 0.5 * sin(vFakeUv.y * uBlendFrequency + randomOffset(vFakeUv, uFloorIndex) - uTime * uBlendSpeed);
  vec3 baseColor = mix(uColor1, uColor2, sinMix );
  gl_FragColor = vec4( baseColor, alpha * vAlpha );

  #include <tonemapping_fragment>
  // #include <encodings_fragment>
  // Add fog
  #include <fogOutputFrag>
  // #include <premultiplied_alpha_fragment>
  
}`

export const personFragmentShader = `#define GLSLIFY 1
float blendSoftLight(float base, float blend) {
        return (blend<0.5)?(2.0*base*blend+base*base*(1.0-2.0*blend)):(sqrt(base)*(2.0*blend-1.0)+2.0*base*(1.0-blend));
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
        return vec3(blendSoftLight(base.r,blend.r),blendSoftLight(base.g,blend.g),blendSoftLight(base.b,blend.b));
}

vec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {
        return (blendSoftLight(base, blend) * opacity + base * (1.0 - opacity));
}

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vViewPosition;

uniform float uProgress;
uniform float uGradientSpread;
uniform float uGroundFloorBegin;

uniform sampler2D uColorTexture;
uniform sampler2D uRepeatTexture;
// Masking textures
uniform sampler2D tHexText; // Hex grid texture
uniform sampler2D tRecText; // Recursive texture
uniform float uHexTexScale;
uniform float uRecTexScale;

#include <fogParamsFrag>

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main() {

    vec4 baseColor = vec4(blendSoftLight(texture2D(uColorTexture, vUv).rgb, texture2D(uRepeatTexture, vUv * 15.).rgb, 1.), 1.0 );
    vec4 tHex = texture2D(tHexText, vUv * vec2(uHexTexScale)); // hex texture
    float tHexClamped = clamp(tHex.r, 0.2, 1.0);
    vec4 tRecursive = texture2D(tRecText, vUv * vec2(uRecTexScale)); // Recursive subdivision texture
    float tRecursiveClamped = clamp(tRecursive.r, 0.2, 1.0); // Multiply to make it a bit brighter

    float mappedWorldY = map(vWorldPos.y, 3. + uGroundFloorBegin, 26. * 4., 0., 1.); // Map across the whole main building 
    float edge = mappedWorldY - uProgress; 
    edge /= uGradientSpread;

    float flameEdge = edge - tHex.r * tRecursiveClamped;
    float flamedSharpEdge = step(flameEdge, 0.0);

    if (flamedSharpEdge < 1.) {
      discard;
    }

    gl_FragColor = vec4(baseColor.rgb, 1.);

    #include <tonemapping_fragment>

    #include <fogOutputFrag>

}`;

export const towersFragmentShafer = `#define GLSLIFY 1
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

float blendLinearDodge(float base, float blend) {
        // Note : Same implementation as BlendAddf
        return min(base+blend,1.0);
}

vec3 blendLinearDodge(vec3 base, vec3 blend) {
        // Note : Same implementation as BlendAdd
        return min(base+blend,vec3(1.0));
}

vec3 blendLinearDodge(vec3 base, vec3 blend, float opacity) {
        return (blendLinearDodge(base, blend) * opacity + base * (1.0 - opacity));
}

float blendLinearBurn(float base, float blend) {
        // Note : Same implementation as BlendSubtractf
        return max(base+blend-1.0,0.0);
}

vec3 blendLinearBurn(vec3 base, vec3 blend) {
        // Note : Same implementation as BlendSubtract
        return max(base+blend-vec3(1.0),vec3(0.0));
}

vec3 blendLinearBurn(vec3 base, vec3 blend, float opacity) {
        return (blendLinearBurn(base, blend) * opacity + base * (1.0 - opacity));
}

float blendLinearLight(float base, float blend) {
        return blend<0.5?blendLinearBurn(base,(2.0*blend)):blendLinearDodge(base,(2.0*(blend-0.5)));
}

vec3 blendLinearLight(vec3 base, vec3 blend) {
        return vec3(blendLinearLight(base.r,blend.r),blendLinearLight(base.g,blend.g),blendLinearLight(base.b,blend.b));
}

vec3 blendLinearLight(vec3 base, vec3 blend, float opacity) {
        return (blendLinearLight(base, blend) * opacity + base * (1.0 - opacity));
}

// Passed through the vertex shader
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPos; // Global vertex position
varying vec3 vLocalPos; // Local vertex position
varying float vStartOffset; // Random starting position of the reveal
varying float vObjectHeight;
varying float vTextureNumber;
varying float vSpeed;
varying vec4 c_rails;

// Uniforms
uniform float uTime;
uniform bool uAnimate;
uniform float uAnimateUp;
uniform float uProgress; // Animation progress variable
uniform float uFloorIndex;
uniform float uGroundFloorBegin;

// Baked Textures
uniform sampler2D tColorText0;
uniform sampler2D tColorText1;
uniform sampler2D tColorText2;
uniform sampler2D tColorText3;
// uniform sampler2D tMatCap;
// uniform sampler2D tRepeatedTexW; // Detail texture

// Masking textures
uniform sampler2D tMatCap; 
uniform sampler2D tHexText; // Hex grid texture
uniform sampler2D tRecText; // Recursive texture
uniform float uHexTexScale;
uniform float uRecTexScale;

uniform sampler2D tRepeatedTexWalls;
uniform sampler2D tRailsTex;

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

uniform int uBalconiesBlendMode;
uniform float uBalconiesBlendAlpha;
uniform vec3 uBalconyBaseColorTop;
uniform vec3 uBalconyBaseColorBottom;

#include <fogParamsFrag>

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
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

    // Textures for masking
    vec4 tHex = texture2D(tHexText, vUv * vec2(uHexTexScale)); // hex texture
    float tHexClamped = clamp(tHex.r, 0.2, 1.0);

    vec4 baseColor;
    
    if(vTextureNumber < 0.5) {
        baseColor = texture2D(tColorText0, vUv);
    } else if(vTextureNumber > 0.5 && vTextureNumber < 1.5) {
        baseColor = texture2D(tColorText1, vUv);
    } else if(vTextureNumber > 1.5 && vTextureNumber < 2.5) {
        baseColor = texture2D(tColorText2, vUv);
    }  else if(vTextureNumber > 2.5 && vTextureNumber < 3.5) {
        baseColor = texture2D(tColorText3, vUv);
    }

    if (c_rails.r > 0.0) {
        /**
            Balconies material
        */
        // Sample the gradient texture
        float balconyGradient = texture2D(tRailsTex, vUv).r;
        vec3 colourGradient = mix(uBalconyBaseColorBottom, uBalconyBaseColorTop, balconyGradient);
        // baseColor.rgb = colourGradient;
        // baseColor = vec4(uBalconyBaseColorTop, 1.0);
        // baseColor = vec4(blendSoftLight(baseColor.rgb, uBalconyBaseColorTop, 1.), 1.0 );
        if(uBalconiesBlendMode == 0) baseColor = vec4(blendSoftLight(colourGradient, baseColor.rgb, uBalconiesBlendAlpha), 1.0 );
        else if(uBalconiesBlendMode == 1) baseColor = vec4(blendLinearLight(baseColor.rgb, colourGradient, uBalconiesBlendAlpha), 1.0 );

    } else {
        baseColor = vec4(blendSoftLight(baseColor.rgb, texture2D(tRepeatedTexWalls, vUv * 35.).rgb, 1.), 1.0 );
    }
    /**
        Walls material
    */
    // Scale the progress according to the object size
    // Map the local position of the vertices between 0.0 and 1.0 for easier calculations
    // float objectSize = vObjectHeight;
    float objectSize = 100.; // "uniform"
    // float mappedY = map(vLocalPos.y, 0.0 + 3., objectSize+3., 0.0, 1.0);
    float mappedY = map(vWorldPos.y, uGroundFloorBegin, objectSize+3., 0.0, 1.0);
    
    // Random offsets for each building - if doing this make objectSize a uniform so 
    // the buildings don't finish revealing all at the exact same moment
    // float progress = map(uProgress, vStartOffset + 0.052, 1.0, 0.0, 1.0);
    
    // No mapping and using the random speed varying
    float progress = (uProgress + vStartOffset) * vSpeed; // or
    // float progress = uProgress * vSpeed;

    // float progress = uProgress; // Scratch vStartOffset since we start all of them from 0

    // Edges
    // Edge based on local position, moving up the model as progress increases
    float bottomEdge = mappedY - progress;
    bottomEdge /= uOverallGradientSpread;
    float topEdge = bottomEdge - uFlameBandWidth; // Top edge

    // Gradient edge where the flame colours will change
    float colorChangeEdge = bottomEdge - uFlameColorChangeOffset; // Offset to control where the middle point is of the change
    float colorChangeEdgeSteepness = colorChangeEdge/uFlameColorGradientSpread;
    float clampedColorChangeEdgeGradient = clamp(colorChangeEdgeSteepness, 0.0, 1.0); // Make sure to clamp the range before using it for colours

    // Bottom edge: flamed + sharp (no gradient) edge
    // Option 1: flamed + gradient edge
    float flameBottomEdge = bottomEdge - tHex.r * uEdgeTextureSubtractStrength; // "flame" the edge line to add detail, this essentially flames it UP because it subtracts more
    float flamedSharpEdge = step(0.0, flameBottomEdge); // make a sharp edge line instead of gradient, flamed; top part white, bottom black 

    // Top edge 
    // Flame Top edge: flamed + sharp (no gradient) edge
    float flameTopEdge = topEdge - tHex.r * uEdgeTextureSubtractStrength;
    float flamedSharpTopEdge = step(0.0, flameTopEdge);

    // Alpha masking
    // Mask the desired top bit with textures
    float texturedEdgeMask = flamedSharpEdge * (1.0 - tHexClamped * uFlameStrength); 
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

    // gl_FragColor = vec4(outgoingLight.rgb, 1.);
    
    if (texturedAlphaMask * overallColor.a < 0.1) {
        discard;
    }
    
    gl_FragColor = vec4(outgoingLight.rgb, texturedAlphaMask * overallColor.a);

    #include <tonemapping_fragment>

    // Add fog
    #include <fogOutputFrag>

}`;

export const particlesFragmentShader = `#define GLSLIFY 1
varying float vRandom;
varying float vOpacity;

uniform float uTime;

const float falloff = 0.08;

void main() {
        vec3 color = vec3(1., 0.2, 0.2);
    color += cos(uTime + vRandom * 10.);

    vec2 uv = gl_PointCoord.xy;

    float distanceToCenter = distance(uv, vec2(0.5));
        float strength = falloff / distanceToCenter - (falloff * 2.);

    gl_FragColor = vec4(color, strength * vOpacity);
}`;

export const cityPipesFragmentShader = `#define GLSLIFY 1
varying vec3 vFakeUv;
varying float vAlpha;

// Animated colour gradient
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uColMultiply;
uniform float uTime;
uniform float uSection;
uniform float uBlendFrequency;
uniform float uBlendSpeed;

#include <fogParamsFrag>

// Line material
uniform float opacity;
uniform float linewidth;

#ifdef USE_DASH
  uniform float dashOffset;
  uniform float dashSize;
  uniform float gapSize;
#endif
varying float vLineDistance;
#ifdef WORLD_UNITS
  varying vec4 worldPos;
  varying vec3 worldStart;
  varying vec3 worldEnd;
  #ifdef USE_DASH
    varying vec2 vUv;
  #endif
#else
  varying vec2 vUv;
#endif
#include <common>
// #include <color_pars_fragment>
// #include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

float randomOffset(vec3 value, float section) {
  return (0.5 + 0.5 * cos(section) + fract(value.z)) * abs(value.x) * abs(value.z);
}

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {
  float mua;
  float mub;
  vec3 p13 = p1 - p3;
  vec3 p43 = p4 - p3;
  vec3 p21 = p2 - p1;
  float d1343 = dot( p13, p43 );
  float d4321 = dot( p43, p21 );
  float d1321 = dot( p13, p21 );
  float d4343 = dot( p43, p43 );
  float d2121 = dot( p21, p21 );
  float denom = d2121 * d4343 - d4321 * d4321;
  float numer = d1343 * d4321 - d1321 * d4343;
  mua = numer / denom;
  mua = clamp( mua, 0.0, 1.0 );
  mub = ( d1343 + d4321 * ( mua ) ) / d4343;
  mub = clamp( mub, 0.0, 1.0 );
  return vec2( mua, mub );
}

void main() {
  // #include <clipping_planes_fragment>
  #ifdef USE_DASH
    if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps
    if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX
  #endif
  float alpha = opacity;
  #ifdef WORLD_UNITS
    // Find the closest points on the view ray and the line segment
    vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
    vec3 lineDir = worldEnd - worldStart;
    vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );
    vec3 p1 = worldStart + lineDir * params.x;
    vec3 p2 = rayEnd * params.y;
    vec3 delta = p1 - p2;
    float len = length( delta );
    float norm = len / linewidth;
    #ifndef USE_DASH
      #ifdef USE_ALPHA_TO_COVERAGE
        float dnorm = fwidth( norm );
        alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );
      #else
        if ( norm > 0.5 ) {
          discard;
        }
      #endif
    #endif
  #else
    #ifdef USE_ALPHA_TO_COVERAGE
      // artifacts appear on some hardware if a derivative is taken within a conditional
      float a = vUv.x;
      float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
      float len2 = a * a + b * b;
      float dlen = fwidth( len2 );
      if ( abs( vUv.y ) > 1.0 ) {
        alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );
      }
    #else
      if ( abs( vUv.y ) > 1.0 ) {
        float a = vUv.x;
        float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
        float len2 = a * a + b * b;
        if ( len2 > 1.0 ) discard;
      }
    #endif
  #endif

  // if (alpha * bottomEdge < 0.005) {
  //   discard;
  // }
  
  // Reveal
  // // float objectSize = 26.0 * 4.;
  // float objectSize = 100.;

  // float mappedY = map(vWorldPos.y, uGroundFloorBegin, objectSize + 3., 0.0, 1.0);
  // float progress = (uProgress + uStartOffset) * uSpeed;

  // float bottomEdge = mappedY - progress;
  // bottomEdge /= uGradientSpread;
  // bottomEdge = clamp(bottomEdge,0.0, 1.0);
  // bottomEdge = 1.0 - bottomEdge;

  // gl_FragColor = vec4(uColor, bottomEdge);
   
  if (vAlpha < 0.05) {
    discard;
  }

  float sinMix = 0.5 + 0.5 * sin(vFakeUv.y * uBlendFrequency + randomOffset(vFakeUv, uSection) - uTime * uBlendSpeed);
  vec3 baseColor = mix(uColor1, uColor2, sinMix );
  baseColor *= uColMultiply;
  gl_FragColor = vec4( baseColor, alpha * vAlpha );

  #include <tonemapping_fragment>
  // #include <encodings_fragment>
  // Add fog
  #include <fogOutputFrag>
  // #include <premultiplied_alpha_fragment>
  
}`;

export const carFragmentShader = `#define GLSLIFY 1
float blendSoftLight(float base, float blend) {
        return (blend<0.5)?(2.0*base*blend+base*base*(1.0-2.0*blend)):(sqrt(base)*(2.0*blend-1.0)+2.0*base*(1.0-blend));
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
        return vec3(blendSoftLight(base.r,blend.r),blendSoftLight(base.g,blend.g),blendSoftLight(base.b,blend.b));
}

vec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {
        return (blendSoftLight(base, blend) * opacity + base * (1.0 - opacity));
}

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;

uniform sampler2D uMatcapTexture;
uniform sampler2D uDiffuseTexture;

#include <fogParamsFrag>

void main() {
        vec3 diffuseColor = texture2D(uDiffuseTexture, vUv).rgb;

    // matcap UVs
    vec3 normal = normalize( vNormal );
        vec3 viewDir = normalize( vViewPosition );
        vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
        vec3 y = cross( viewDir, x );
        vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;

    vec3 matcapColor = texture2D(uMatcapTexture, uv).rgb;
        vec3 finalColor = blendSoftLight(diffuseColor, matcapColor, 1.);

    gl_FragColor = vec4(finalColor, 1.);

        #include <tonemapping_fragment>
        #include <fogOutputFrag>

}`;

export const trailFragmentShader = `#define GLSLIFY 1
varying vec3 vNormal;
varying vec2 vUv;

uniform vec3 uColorBegin;
uniform vec3 uColorEnd;
uniform float uColorFallOff;
uniform float uColorOffset;
uniform float uTrailLength;
uniform float uTrailFallOffEnd;

#include <fogParamsFrag>

void main() {

    vec3 beginColor = uColorBegin;
    vec3 endColor = uColorEnd;
    float trailLength = uTrailLength;

    float triX = vUv.x;
    // triX /= trailLength;
    triX -= 0.08 / trailLength;
    
    float maskBack = smoothstep(0., uTrailFallOffEnd, triX);
    maskBack = clamp(maskBack, 0.0, 1.0);
    float mask = maskBack;

    float colX = 1.0 - triX; // reverse so 1.0 is closes to the car
    colX -= uColorOffset; // Move the beginning point of the gradient
    float gradientMask = colX / uColorFallOff; // Make the color gradient steeper or more gradual
    gradientMask = clamp(gradientMask, 0.0, 1.0);

    vec3 colorGradient = mix(beginColor, endColor, gradientMask);

    // Side masks
    float sideWidths = 0.05;
    float left = 1.0 - step(sideWidths, vUv.y);
    float right = step(1.0-sideWidths, vUv.y);
    float leftPlusRight = left + right;

    float middleWidth = 0.7;
    float middle = step((1.0 - middleWidth)/2., 0.5 - abs(vUv.y - 0.5) );
    float middlePlusSides = middle + leftPlusRight;
    middlePlusSides = clamp(middlePlusSides, 0., 1.);

    mask *= middlePlusSides;

    gl_FragColor = vec4(mix(vec3(0., 0., 0.), colorGradient, middlePlusSides), mask);

    #include <tonemapping_fragment>

    #include <fogOutputFrag>
}`;

export const signFragmentShader = `#define GLSLIFY 1
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

uniform float uProgress;
uniform float uTime;
uniform float uBlendFrequency;
uniform float uBlendSpeed;
uniform float uFloorIndex;
uniform float uIndex;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform sampler2D uTexture;

#include <fogParamsFrag>

float map(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

float randomOffset(float value) {
    return (cos(value) + fract(value)) * value;
}

void main() {

    // Reveal
    float uGroundFloorBegin =  0.0;
    // Remap uProgress
    float numOfFloors = 4.0;
    float uProgressMapped = map(uProgress, 0.0, 1.0, 0.0, 1.0 + abs(uGroundFloorBegin));
    float uProgressPlusFloor = uProgressMapped + uGroundFloorBegin;
    float uProgressClamp = clamp(uProgressPlusFloor, uGroundFloorBegin + 0.0 + uFloorIndex * 1.0/numOfFloors, 1.0/numOfFloors + uFloorIndex * 1.0/numOfFloors);
    float uProgressRemapped = map(uProgressClamp, uGroundFloorBegin + 0.0 + uFloorIndex * 1.0/numOfFloors, 1.0/numOfFloors + uFloorIndex * 1.0/numOfFloors, 0.0, 1.0 );
    
    float progress;
    if(uFloorIndex == 0.0) {
        progress = map(uProgressRemapped, 0.4, 0.9, 0.0, 1.0);
    } else {
        progress = map(uProgressRemapped, 0.0, 0.5, 0.0, 1.0);
    }

    // Colours
    vec3 color1 = uColor1;
    vec3 color2 = uColor2;

    // Animated gradient to mix between the colours + Remap so we don't get negative values
    // Use uIndex to add an offset
    float sinMix = 0.5 + 0.5 * sin(vUv.y * uBlendFrequency + randomOffset(uIndex) + uTime * uBlendSpeed);
    
    vec3 baseColor = mix(color1, color2, sinMix );

    vec3 alphaMask = texture2D(uTexture, vUv).rgb;

    gl_FragColor = vec4(baseColor.rgb, progress * alphaMask.r);

    // if (alphaMask.r < 0.15) {
    //     discard;
    // }

    #include <tonemapping_fragment>
    
    // Add fog
    #include <fogOutputFrag>
}`;

export const citySignFragmentShader = `#define GLSLIFY 1
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

// Reveal effects
uniform float uCityProgress;
uniform float uGroundFloorBegin;
uniform float uSpeed;
uniform float uStartOffset;
uniform float uGradientSpread;
// Color effects
uniform float uIndex;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uBlendFrequency;
uniform float uBlendSpeed;

#include <fogParamsFrag>

// uniform float uFloorIndex;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

float randomOffset(float value) {
  return ( cos(value) + fract(value) ) * value;
}

void main() {

  // Reveal
  // float objectSize = 26.0 * 4.;
  float objectSize = 100.;

  float mappedY = map(vWorldPos.y, uGroundFloorBegin, objectSize, 0.0, 1.0);
  float progress = (uCityProgress + uStartOffset) * uSpeed;

  float bottomEdge = mappedY - progress;
  bottomEdge /= uGradientSpread;
  bottomEdge = clamp(bottomEdge, 0.0, 1.0);
  bottomEdge = 1.0 - bottomEdge;

  // Colours
  vec3 color1 = uColor1;
  vec3 color2 = uColor2;

  // Animated gradient to mix between the colours + Remap so we don't get negative values
  // Use uIndex to add an offset
  float sinMix = 0.5 + 0.5 * sin(vUv.y * uBlendFrequency + randomOffset(uIndex) + uTime * uBlendSpeed);
  
  vec3 baseColor = mix(color1, color2, sinMix );

  vec3 alphaMask = texture2D(uTexture, vUv).rgb;

  gl_FragColor = vec4(baseColor.rgb, bottomEdge * alphaMask.r);

  if (bottomEdge * alphaMask.r < 0.15) {
    discard;
  }

  #include <tonemapping_fragment>
  
  // Add fog
  #include <fogOutputFrag>
}`;

export const bridgesFragmentShader = `#define GLSLIFY 1
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

float blendLinearDodge(float base, float blend) {
        // Note : Same implementation as BlendAddf
        return min(base+blend,1.0);
}

vec3 blendLinearDodge(vec3 base, vec3 blend) {
        // Note : Same implementation as BlendAdd
        return min(base+blend,vec3(1.0));
}

vec3 blendLinearDodge(vec3 base, vec3 blend, float opacity) {
        return (blendLinearDodge(base, blend) * opacity + base * (1.0 - opacity));
}

float blendLinearBurn(float base, float blend) {
        // Note : Same implementation as BlendSubtractf
        return max(base+blend-1.0,0.0);
}

vec3 blendLinearBurn(vec3 base, vec3 blend) {
        // Note : Same implementation as BlendSubtract
        return max(base+blend-vec3(1.0),vec3(0.0));
}

vec3 blendLinearBurn(vec3 base, vec3 blend, float opacity) {
        return (blendLinearBurn(base, blend) * opacity + base * (1.0 - opacity));
}

float blendLinearLight(float base, float blend) {
        return blend<0.5?blendLinearBurn(base,(2.0*blend)):blendLinearDodge(base,(2.0*(blend-0.5)));
}

vec3 blendLinearLight(vec3 base, vec3 blend) {
        return vec3(blendLinearLight(base.r,blend.r),blendLinearLight(base.g,blend.g),blendLinearLight(base.b,blend.b));
}

vec3 blendLinearLight(vec3 base, vec3 blend, float opacity) {
        return (blendLinearLight(base, blend) * opacity + base * (1.0 - opacity));
}

varying vec3 vThreshold;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

uniform float uProgress;
uniform float uTime;
uniform float uFloorIndex;
uniform float uGradientSpread;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform sampler2D uTexture;
uniform sampler2D uTextureGradient;
uniform sampler2D uTextureRecursive;
uniform vec2 uUvScale; 
uniform float uBlendAlpha;
uniform float uAlphaMin;
uniform float uAlphaMax;
uniform float uBakeBlend;

#include <fogParamsFrag>

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

float random(float val) {
    return fract(sin(val)*1.0);
}

void main() {

    // Reveal
    float objectSize = 130.0;
    float urand = random(vWorldPos.y);
    float mappedY = map(vWorldPos.y, 0.0, objectSize, 0.0, 1.0);

    float threshold = clamp(vThreshold.r, 0.0, 1.0);
    // float bottomEdge = threshold - uProgress;
    float bottomEdge = mappedY - uProgress;
    bottomEdge /= 0.5;
    bottomEdge = clamp(bottomEdge, 0.0, 1.0);
    bottomEdge = 1.0 - bottomEdge;

    float sideRevealMix = mix(-2.0, 2.0, bottomEdge);
    
    float sideReveal = vUv.x - sideRevealMix;
    sideReveal /= 0.08;
    sideReveal = clamp(sideReveal, 0.0, 1.0);
    sideReveal = 1.0 - sideReveal;

    // Colours
    vec3 color1 = uColor1;
    vec3 color2 = uColor2;

    // Animated gradient to mix between the colours + Remap so we don't get negative values
    float sinMix = 0.5 + 0.5 * sin(vUv.x * 30.0 + uTime + urand * 0.65);
    float clampSin = clamp(sinMix, 0.65, 1.0);

    // Colours
    vec3 diffuseCol = texture2D(uTexture, vUv).rgb; // Texture bake

    float rimMask = texture2D(uTextureGradient, vUv).r;
    float maskAnimate = rimMask*clampSin;
    // float recursiveMask = texture2D(uTextureRecursive, vUv * uUvScale).r;
    // float blendMask = blendLinearLight(vec3(rimMask), vec3(recursiveMask), uBlendAlpha).r;
    // float blendMask = blendLighten(vec3(rimMask), vec3(recursiveMask), uBlendAlpha).r;
    
    // float blendMask = blendSoftLight(vec3(rimMask), vec3(recursiveMask), uBlendAlpha).r;
    // float blendMask = blendColorDodge(vec3(rimMask), vec3(recursiveMask), uBlendAlpha).r;
    vec3 baseColor = mix(uColor1, uColor2, maskAnimate);
    baseColor = blendColorDodge(baseColor, diffuseCol, uBakeBlend);
    float alphaMask = clamp(rimMask, uAlphaMin, uAlphaMax);

    if (bottomEdge * alphaMask < 0.1) {
      discard;
    }
    gl_FragColor = vec4(baseColor.rgb, sideReveal * alphaMask);

    // gl_FragColor = vec4(vec3(sideReveal), 1.0);

    #include <tonemapping_fragment>
    
    // Add fog
    #include <fogOutputFrag>
}`;

export const reflectiveFragmentShader = `#define GLSLIFY 1
float blendSoftLight(float base, float blend) {
        return (blend<0.5)?(2.0*base*blend+base*base*(1.0-2.0*blend)):(sqrt(base)*(2.0*blend-1.0)+2.0*base*(1.0-blend));
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
        return vec3(blendSoftLight(base.r,blend.r),blendSoftLight(base.g,blend.g),blendSoftLight(base.b,blend.b));
}

vec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {
        return (blendSoftLight(base, blend) * opacity + base * (1.0 - opacity));
}

float blendLinearDodge(float base, float blend) {
        // Note : Same implementation as BlendAddf
        return min(base+blend,1.0);
}

vec3 blendLinearDodge(vec3 base, vec3 blend) {
        // Note : Same implementation as BlendAdd
        return min(base+blend,vec3(1.0));
}

vec3 blendLinearDodge(vec3 base, vec3 blend, float opacity) {
        return (blendLinearDodge(base, blend) * opacity + base * (1.0 - opacity));
}

float blendLinearBurn(float base, float blend) {
        // Note : Same implementation as BlendSubtractf
        return max(base+blend-1.0,0.0);
}

vec3 blendLinearBurn(vec3 base, vec3 blend) {
        // Note : Same implementation as BlendSubtract
        return max(base+blend-vec3(1.0),vec3(0.0));
}

vec3 blendLinearBurn(vec3 base, vec3 blend, float opacity) {
        return (blendLinearBurn(base, blend) * opacity + base * (1.0 - opacity));
}

float blendLinearLight(float base, float blend) {
        return blend<0.5?blendLinearBurn(base,(2.0*blend)):blendLinearDodge(base,(2.0*(blend-0.5)));
}

vec3 blendLinearLight(vec3 base, vec3 blend) {
        return vec3(blendLinearLight(base.r,blend.r),blendLinearLight(base.g,blend.g),blendLinearLight(base.b,blend.b));
}

vec3 blendLinearLight(vec3 base, vec3 blend, float opacity) {
        return (blendLinearLight(base, blend) * opacity + base * (1.0 - opacity));
}

varying vec4 vMirrorCoord;
varying vec2 vUv;
varying vec2 vUv2;

uniform sampler2D uDiffuse;
uniform sampler2D uRoughnessTexture;
uniform sampler2D uNormalTexture;
uniform sampler2D uWallsTexture;
uniform sampler2D uMaskTexture;
uniform float uRoughnessScale;
uniform float uConcreteScale;
uniform sampler2D uTexture;
uniform vec2 uMipmapTextureSize;
uniform float uBaseLod;
uniform float uDistortionAmount;
uniform float uReflectionOpacity;
uniform float uReflectionLighten;
uniform float uDiffuseRedAmount;

#include <fogParamsFrag>

vec4 cubic(float v) {
    vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
    vec4 s = n * n * n;
    float x = s.x;
    float y = s.y - 4.0 * s.x;
    float z = s.z - 4.0 * s.y + 6.0 * s.x;
    float w = 6.0 - x - y - z;
    return vec4(x, y, z, w);
}

// https://stackoverflow.com/questions/13501081/efficient-bicubic-filtering-code-in-glsl
vec4 textureBicubic(sampler2D t, vec2 texCoords, vec2 textureSize) {
   vec2 invTexSize = 1.0 / textureSize;
   texCoords = texCoords * textureSize - 0.5;

    vec2 fxy = fract(texCoords);
    texCoords -= fxy;
    vec4 xcubic = cubic(fxy.x);
    vec4 ycubic = cubic(fxy.y);

    vec4 c = texCoords.xxyy + vec2 (-0.5, 1.5).xyxy;

    vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);
    vec4 offset = c + vec4 (xcubic.yw, ycubic.yw) / s;

    offset *= invTexSize.xxyy;

    vec4 sample0 = texture2D(t, offset.xz);
    vec4 sample1 = texture2D(t, offset.yz);
    vec4 sample2 = texture2D(t, offset.xw);
    vec4 sample3 = texture2D(t, offset.yw);

    float sx = s.x / (s.x + s.y);
    float sy = s.z / (s.z + s.w);

    return mix(
       mix(sample3, sample2, sx), mix(sample1, sample0, sx)
    , sy);
}

// With original size argument
vec4 packedTexture2DLOD( sampler2D tex, vec2 uv, int level, vec2 originalPixelSize ) {
    float floatLevel = float( level );
    vec2 atlasSize;
    atlasSize.x = floor( originalPixelSize.x * 1.5 );
    atlasSize.y = originalPixelSize.y;
    
    // we stop making mip maps when one dimension == 1
    
    float maxLevel = min( floor( log2( originalPixelSize.x ) ), floor( log2( originalPixelSize.y ) ) );
    floatLevel = min( floatLevel, maxLevel );
    
    // use inverse pow of 2 to simulate right bit shift operator
    
    vec2 currentPixelDimensions = floor( originalPixelSize / pow( 2.0, floatLevel ) );
    vec2 pixelOffset = vec2(
    floatLevel > 0.0 ? originalPixelSize.x : 0.0, floatLevel > 0.0 ? currentPixelDimensions.y : 0.0
    );
    
    // "minPixel / atlasSize" samples the top left piece of the first pixel
    // "maxPixel / atlasSize" samples the bottom right piece of the last pixel
    vec2 minPixel = pixelOffset;
    vec2 maxPixel = pixelOffset + currentPixelDimensions;
    vec2 samplePoint = mix( minPixel, maxPixel, uv );
    samplePoint /= atlasSize;
    vec2 halfPixelSize = 1.0 / ( 2.0 * atlasSize );
    samplePoint = min( samplePoint, maxPixel / atlasSize - halfPixelSize );
    samplePoint = max( samplePoint, minPixel / atlasSize + halfPixelSize );
    return textureBicubic( tex, samplePoint, originalPixelSize );
}

vec4 packedTexture2DLOD( sampler2D tex, vec2 uv, float level, vec2 originalPixelSize ) {
    float ratio = mod( level, 1.0 );
    int minLevel = int( floor( level ) );
    int maxLevel = int( ceil( level ) );
    vec4 minValue = packedTexture2DLOD( tex, uv, minLevel, originalPixelSize );
    vec4 maxValue = packedTexture2DLOD( tex, uv, maxLevel, originalPixelSize );
    return mix( minValue, maxValue, ratio );
}

void main() {
    vec3 floorDiffuse = texture2D(uDiffuse, vUv).rgb;
    floorDiffuse.r *= uDiffuseRedAmount;

    vec2 reflectionUv = vMirrorCoord.xy / vMirrorCoord.w;
    float lod = uBaseLod;

    vec2 roughnessUv = vUv * uRoughnessScale;
    float roughness = texture2D(uRoughnessTexture, roughnessUv).r;

    vec3 floorNormal = texture2D(uNormalTexture, vUv * uRoughnessScale).rgb * 2. - 1.;
    floorNormal = normalize(floorNormal);

    vec3 color = packedTexture2DLOD(uTexture, reflectionUv + floorNormal.xy * uDistortionAmount, roughness * uBaseLod, uMipmapTextureSize).rgb;

    // mix with base texture color
    color = blendLinearLight(color, floorDiffuse, uReflectionLighten);
    color = blendSoftLight(color, texture2D(uWallsTexture, vUv * uConcreteScale).rgb, roughness);
    color = mix(floorDiffuse, color, uReflectionOpacity);
    
    gl_FragColor = vec4(color, 1.0);
    gl_FragColor.rgb = mix(floorDiffuse, gl_FragColor.rgb, texture2D(uMaskTexture, vUv2).r);

    #include <tonemapping_fragment>

    // Add fog
    #include <fogOutputFrag>
}`;