import { fogDefines } from "@/shaders/defines";
import {
  BufferGeometry,
  LinearFilter,
  Material,
  MathUtils,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Texture,
  Uniform,
  WebGLRenderer,
  Vector3,
  Plane,
  Matrix4,
  Vector4,
  Vector2,
  WebGLRenderTarget,
  ShaderMaterial,
  NearestFilter,
  RawShaderMaterial,
  CustomBlending,
  PlaneGeometry,
  OrthographicCamera,
  Camera,
} from "three";


class ReflectiveMesh extends Mesh<BufferGeometry, ShaderMaterial> {
  ignoreObjects: any[];
  renderReflection: boolean;
  camera: PerspectiveCamera;
  scene: Scene;
  sceneCamera: PerspectiveCamera;
  reflectorPlane: Plane;
  normal: Vector3;
  reflectorWorldPosition: Vector3;
  cameraWorldPosition: Vector3;
  rotationMatrix: Matrix4;
  lookAtPosition: Vector3;
  clipPlane: Vector4;
  view: Vector3;
  target: Vector3;
  q: Vector4;
  textureSize: Vector2;
  textureMatrix: Matrix4;
  renderTarget: WebGLRenderTarget;
  mipmapper: MipMapper;
  renderCount: number;
  constructor(
    geometry: BufferGeometry,
    material: ShaderMaterial,
    name: string
  ) {
    super(geometry, material); // diffuse, roughnessTexture, normalTexture, wallTexture, maskTexture
      (this.name = name),
      (this.ignoreObjects = []),
      (this.renderReflection = !0),
      (this.camera = new PerspectiveCamera),
      (this.scene = new Scene),
      (this.sceneCamera = new PerspectiveCamera),
      (this.reflectorPlane = new Plane()),
      (this.normal = new Vector3()),
      (this.reflectorWorldPosition = new Vector3()),
      (this.cameraWorldPosition = new Vector3()),
      (this.rotationMatrix = new Matrix4()),
      (this.lookAtPosition = new Vector3(0, 0, -1)),
      (this.clipPlane = new Vector4()),
      (this.view = new Vector3()),
      (this.target = new Vector3()),
      (this.q = new Vector4()),
      (this.textureSize = new Vector2(
        0.25 * window.innerWidth,
        0.25 * window.innerHeight
      )),
      (this.textureMatrix = new Matrix4()),
      (this.renderTarget = new WebGLRenderTarget(
        this.textureSize.x,
        this.textureSize.y,
        {
          minFilter: LinearFilter,
        }
      )),
      (this.mipmapper = new MipMapper()),
      this.mipmapper.resize(this.textureSize, this.renderTarget),
      (this.material.uniforms.uTextureMatrix = {
        value: this.textureMatrix,
      }),
      (this.material.uniforms.uTexture = {
        value: this.renderTarget.texture,
      }),
      (this.material.uniforms.uMipmapTextureSize = {
        value: this.mipmapper.targetSize,
      }),
      (this.matrixAutoUpdate = !1),
      (this.renderCount = 0);
  }
  onBeforeRender = (renderer: WebGLRenderer) => {
    if (
      (this.renderCount++,
      this.reflectorWorldPosition.setFromMatrixPosition(this.matrixWorld),
      this.cameraWorldPosition.setFromMatrixPosition(
        this.sceneCamera?.matrixWorld?? (new PerspectiveCamera()).matrixWorld
      ),
      this.rotationMatrix.extractRotation(this.matrixWorld),
      this.rotationMatrix.makeRotationX(MathUtils.degToRad(-90)),
      this.normal.set(0, 0, 1),
      this.normal.applyMatrix4(this.rotationMatrix),
      this.view.subVectors(
        this.reflectorWorldPosition,
        this.cameraWorldPosition
      ),
      this.view.dot(this.normal) > 0)
    )
      return;
    this.view.reflect(this.normal).negate(),
      this.view.add(this.reflectorWorldPosition),
      this.rotationMatrix.extractRotation(this.sceneCamera?.matrixWorld ?? new Scene().matrixWorld),
      this.lookAtPosition.set(0, 0, -1),
      this.lookAtPosition.applyMatrix4(this.rotationMatrix),
      this.lookAtPosition.add(this.cameraWorldPosition),
      this.target.subVectors(this.reflectorWorldPosition, this.lookAtPosition),
      this.target.reflect(this.normal).negate(),
      this.target.add(this.reflectorWorldPosition),
      this.camera?.position.copy(this.view),
      this.camera?.up.set(0, 1, 0),
      this.camera?.up.applyMatrix4(this.rotationMatrix),
      this.camera?.up.reflect(this.normal),
      this.camera?.lookAt(this.target),
      (this.camera && (this.camera.far = this.sceneCamera?.far ?? 0)),
      this.camera?.updateMatrixWorld(),
      this.camera?.projectionMatrix.copy(this.sceneCamera?.projectionMatrix??new PerspectiveCamera().projectionMatrix),
      this.textureMatrix.set(
        0.5,
        0,
        0,
        0.5,
        0,
        0.5,
        0,
        0.5,
        0,
        0,
        0.5,
        0.5,
        0,
        0,
        0,
        1
      ),
      this.textureMatrix.multiply(this.camera.projectionMatrix),
      this.textureMatrix.multiply(this.camera.matrixWorldInverse),
      this.textureMatrix.multiply(this.matrixWorld),
      this.reflectorPlane.setFromNormalAndCoplanarPoint(
        this.normal,
        this.reflectorWorldPosition
      ),
      this.reflectorPlane.applyMatrix4(this.camera.matrixWorldInverse),
      this.clipPlane.set(
        this.reflectorPlane.normal.x,
        this.reflectorPlane.normal.y,
        this.reflectorPlane.normal.z,
        this.reflectorPlane.constant
      );
    const t = this.camera.projectionMatrix;
    if (
      ((this.q.x =
        (Math.sign(this.clipPlane.x) + t.elements[8]) / t.elements[0]),
      (this.q.y =
        (Math.sign(this.clipPlane.y) + t.elements[9]) / t.elements[5]),
      (this.q.z = -1),
      (this.q.w = (1 + t.elements[10]) / t.elements[14]),
      this.clipPlane.multiplyScalar(2 / this.clipPlane.dot(this.q)),
      (t.elements[2] = this.clipPlane.x),
      (t.elements[6] = this.clipPlane.y),
      (t.elements[10] = this.clipPlane.z + 1 - 0.003),
      (t.elements[14] = this.clipPlane.w),
      this.renderCount % 2 != 0)
    ) {
      this.visible = !1;
      for (let t = 0; t < this.ignoreObjects.length; t++)
        this.ignoreObjects[t].visible = !1;
      if (this.renderReflection) {
        const t = renderer.getRenderTarget();
        renderer.setRenderTarget(this.renderTarget),
          renderer.setViewport(
            0,
            0,
            this.textureSize.x / renderer.getPixelRatio(),
            this.textureSize.y / renderer.getPixelRatio()
          ),
          renderer.setScissor(0, 0, this.textureSize.x, this.textureSize.y),
          renderer.setScissorTest(!0),
          renderer.clear(!0),
          renderer.render(this.scene?? new Scene, this.camera?? new PerspectiveCamera),
          renderer.setRenderTarget(null),
          renderer.setViewport(0, 0, window.innerWidth, window.innerHeight),
          renderer.setScissor(0, 0, window.innerWidth, window.innerHeight),
          renderer.setRenderTarget(t),
          this.mipmapper.update(
            this.renderTarget.texture,
            this.renderTarget,
            renderer
          );
      }
      this.visible = !0;
      for (let t = 0; t < this.ignoreObjects.length; t++)
        this.ignoreObjects[t].visible = !0;
    }
  }
  updateCameraScene(camera: PerspectiveCamera, scene: Scene) {
    (this.sceneCamera = camera),
      (this.camera = camera.clone()),
      (this.scene = scene);
  }
  clearIgnoreObjects() {
    this.ignoreObjects = [];
  }
  destroy() {
    this.renderTarget.dispose(),
      this.geometry.dispose(),
      this.material.dispose();
  }
}

class ReflectiveMaterial extends ShaderMaterial {
  constructor(globalUniforms: { [value: string]: {
    value: any
  } }) {
    super({
      vertexShader:
        "#define GLSLIFY 1\nattribute vec2 uv2;\n\nvarying vec4 vMirrorCoord;\nvarying vec2 vUv;\nvarying vec2 vUv2;\n\nuniform mat4 uTextureMatrix;\n\n#include <fogParamsVert>\n\nvoid main () {\n\tvec3 transformedPosition = position;\n\n\tvUv = uv;\n\tvUv2 = uv2;\n\n\tvMirrorCoord = uTextureMatrix * vec4( transformedPosition, 1.0 );\n\n\tvec4 mvPosition = vec4( transformedPosition, 1.0 );\n\tmvPosition = modelViewMatrix * mvPosition;\n\n\tgl_Position = projectionMatrix * mvPosition;\n\n\t#include <fogOutputVert>\n}",
      fragmentShader:
        '#define GLSLIFY 1\nfloat blendSoftLight(float base, float blend) {\n\treturn (blend<0.5)?(2.0*base*blend+base*base*(1.0-2.0*blend)):(sqrt(base)*(2.0*blend-1.0)+2.0*base*(1.0-blend));\n}\n\nvec3 blendSoftLight(vec3 base, vec3 blend) {\n\treturn vec3(blendSoftLight(base.r,blend.r),blendSoftLight(base.g,blend.g),blendSoftLight(base.b,blend.b));\n}\n\nvec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {\n\treturn (blendSoftLight(base, blend) * opacity + base * (1.0 - opacity));\n}\n\nfloat blendLinearDodge(float base, float blend) {\n\t// Note : Same implementation as BlendAddf\n\treturn min(base+blend,1.0);\n}\n\nvec3 blendLinearDodge(vec3 base, vec3 blend) {\n\t// Note : Same implementation as BlendAdd\n\treturn min(base+blend,vec3(1.0));\n}\n\nvec3 blendLinearDodge(vec3 base, vec3 blend, float opacity) {\n\treturn (blendLinearDodge(base, blend) * opacity + base * (1.0 - opacity));\n}\n\nfloat blendLinearBurn(float base, float blend) {\n\t// Note : Same implementation as BlendSubtractf\n\treturn max(base+blend-1.0,0.0);\n}\n\nvec3 blendLinearBurn(vec3 base, vec3 blend) {\n\t// Note : Same implementation as BlendSubtract\n\treturn max(base+blend-vec3(1.0),vec3(0.0));\n}\n\nvec3 blendLinearBurn(vec3 base, vec3 blend, float opacity) {\n\treturn (blendLinearBurn(base, blend) * opacity + base * (1.0 - opacity));\n}\n\nfloat blendLinearLight(float base, float blend) {\n\treturn blend<0.5?blendLinearBurn(base,(2.0*blend)):blendLinearDodge(base,(2.0*(blend-0.5)));\n}\n\nvec3 blendLinearLight(vec3 base, vec3 blend) {\n\treturn vec3(blendLinearLight(base.r,blend.r),blendLinearLight(base.g,blend.g),blendLinearLight(base.b,blend.b));\n}\n\nvec3 blendLinearLight(vec3 base, vec3 blend, float opacity) {\n\treturn (blendLinearLight(base, blend) * opacity + base * (1.0 - opacity));\n}\n\nvarying vec4 vMirrorCoord;\nvarying vec2 vUv;\nvarying vec2 vUv2;\n\nuniform sampler2D uDiffuse;\nuniform sampler2D uRoughnessTexture;\nuniform sampler2D uNormalTexture;\nuniform sampler2D uWallsTexture;\nuniform sampler2D uMaskTexture;\nuniform float uRoughnessScale;\nuniform float uConcreteScale;\nuniform sampler2D uTexture;\nuniform vec2 uMipmapTextureSize;\nuniform float uBaseLod;\nuniform float uDistortionAmount;\nuniform float uReflectionOpacity;\nuniform float uReflectionLighten;\nuniform float uDiffuseRedAmount;\n\n#include <fogParamsFrag>\n\nvec4 cubic(float v) {\n    vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;\n    vec4 s = n * n * n;\n    float x = s.x;\n    float y = s.y - 4.0 * s.x;\n    float z = s.z - 4.0 * s.y + 6.0 * s.x;\n    float w = 6.0 - x - y - z;\n    return vec4(x, y, z, w);\n}\n\n// https://stackoverflow.com/questions/13501081/efficient-bicubic-filtering-code-in-glsl\nvec4 textureBicubic(sampler2D t, vec2 texCoords, vec2 textureSize) {\n   vec2 invTexSize = 1.0 / textureSize;\n   texCoords = texCoords * textureSize - 0.5;\n\n    vec2 fxy = fract(texCoords);\n    texCoords -= fxy;\n    vec4 xcubic = cubic(fxy.x);\n    vec4 ycubic = cubic(fxy.y);\n\n    vec4 c = texCoords.xxyy + vec2 (-0.5, 1.5).xyxy;\n\n    vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);\n    vec4 offset = c + vec4 (xcubic.yw, ycubic.yw) / s;\n\n    offset *= invTexSize.xxyy;\n\n    vec4 sample0 = texture2D(t, offset.xz);\n    vec4 sample1 = texture2D(t, offset.yz);\n    vec4 sample2 = texture2D(t, offset.xw);\n    vec4 sample3 = texture2D(t, offset.yw);\n\n    float sx = s.x / (s.x + s.y);\n    float sy = s.z / (s.z + s.w);\n\n    return mix(\n       mix(sample3, sample2, sx), mix(sample1, sample0, sx)\n    , sy);\n}\n\n// With original size argument\nvec4 packedTexture2DLOD( sampler2D tex, vec2 uv, int level, vec2 originalPixelSize ) {\n    float floatLevel = float( level );\n    vec2 atlasSize;\n    atlasSize.x = floor( originalPixelSize.x * 1.5 );\n    atlasSize.y = originalPixelSize.y;\n    \n    // we stop making mip maps when one dimension == 1\n    \n    float maxLevel = min( floor( log2( originalPixelSize.x ) ), floor( log2( originalPixelSize.y ) ) );\n    floatLevel = min( floatLevel, maxLevel );\n    \n    // use inverse pow of 2 to simulate right bit shift operator\n    \n    vec2 currentPixelDimensions = floor( originalPixelSize / pow( 2.0, floatLevel ) );\n    vec2 pixelOffset = vec2(\n    floatLevel > 0.0 ? originalPixelSize.x : 0.0, floatLevel > 0.0 ? currentPixelDimensions.y : 0.0\n    );\n    \n    // "minPixel / atlasSize" samples the top left piece of the first pixel\n    // "maxPixel / atlasSize" samples the bottom right piece of the last pixel\n    vec2 minPixel = pixelOffset;\n    vec2 maxPixel = pixelOffset + currentPixelDimensions;\n    vec2 samplePoint = mix( minPixel, maxPixel, uv );\n    samplePoint /= atlasSize;\n    vec2 halfPixelSize = 1.0 / ( 2.0 * atlasSize );\n    samplePoint = min( samplePoint, maxPixel / atlasSize - halfPixelSize );\n    samplePoint = max( samplePoint, minPixel / atlasSize + halfPixelSize );\n    return textureBicubic( tex, samplePoint, originalPixelSize );\n}\n\nvec4 packedTexture2DLOD( sampler2D tex, vec2 uv, float level, vec2 originalPixelSize ) {\n    float ratio = mod( level, 1.0 );\n    int minLevel = int( floor( level ) );\n    int maxLevel = int( ceil( level ) );\n    vec4 minValue = packedTexture2DLOD( tex, uv, minLevel, originalPixelSize );\n    vec4 maxValue = packedTexture2DLOD( tex, uv, maxLevel, originalPixelSize );\n    return mix( minValue, maxValue, ratio );\n}\n\nvoid main() {\n    vec3 floorDiffuse = texture2D(uDiffuse, vUv).rgb;\n    floorDiffuse.r *= uDiffuseRedAmount;\n\n    vec2 reflectionUv = vMirrorCoord.xy / vMirrorCoord.w;\n    float lod = uBaseLod;\n\n    vec2 roughnessUv = vUv * uRoughnessScale;\n    float roughness = texture2D(uRoughnessTexture, roughnessUv).r;\n\n    vec3 floorNormal = texture2D(uNormalTexture, vUv * uRoughnessScale).rgb * 2. - 1.;\n    floorNormal = normalize(floorNormal);\n\n    vec3 color = packedTexture2DLOD(uTexture, reflectionUv + floorNormal.xy * uDistortionAmount, roughness * uBaseLod, uMipmapTextureSize).rgb;\n\n    // mix with base texture color\n    color = blendLinearLight(color, floorDiffuse, uReflectionLighten);\n    color = blendSoftLight(color, texture2D(uWallsTexture, vUv * uConcreteScale).rgb, roughness);\n    color = mix(floorDiffuse, color, uReflectionOpacity);\n    \n    gl_FragColor = vec4(color, 1.0);\n    gl_FragColor.rgb = mix(floorDiffuse, gl_FragColor.rgb, texture2D(uMaskTexture, vUv2).r);\n\n    #include <tonemapping_fragment>\n\n    // Add fog\n    #include <fogOutputFrag>\n}',
      uniforms: {
        ...globalUniforms,
        uDiffuse: {
          value: null,
        },
        uBaseLod: {
          value: 2,
        },
        uDistortionAmount: {
          value: 0.02,
        },
        uReflectionOpacity: {
          value: 0.587,
        },
        uReflectionLighten: {
          value: 0.783,
        },
        uRoughnessTexture: {
          value: null,
        },
        uNormalTexture: {
          value: null,
        },
        uRoughnessScale: {
          value: 7.18,
        },
        uConcreteScale: {
          value: 7.18,
        },
        uWallsTexture: {
          value: null,
        },
        uMaskTexture: {
          value: null,
        },
        uDiffuseRedAmount: {
          value: 1,
        },
      },
      defines: fogDefines,
    });
  }
}

const applyObjectDataToObjectProps = (
  mesh: Object3D | Mesh,
  objectData: {
    [value: string]: any;
  }
) => {
  mesh.position.set(objectData[0][0], objectData[0][1], objectData[0][2]);

  mesh?.rotation.setFromQuaternion(
    new Quaternion(
      objectData[1][0],
      objectData[1][1],
      objectData[1][2],
      objectData[1][3]
    )
  );

  mesh.scale.set(objectData[2][0], objectData[2][1], objectData[2][2]);

  return mesh;
};

export default class ReflectiveSurface extends ReflectiveMesh {
  startPos: any;
  stopPos: any;
  scrollPosition: number;
  constructor(
    geometry: BufferGeometry,
    diffuse: Texture,
    roughnessTexture: Texture,
    normalTexture: Texture,
    wallTexture: Texture,
    maskTexture: Texture,
    objectData: {
      [value: string]: any;
    },
    name: string,
    options: {
      [value: string]: any;
    },
    uniforms: {
      [value: string]: {
        value: any
      };
    },
    camera: PerspectiveCamera,
    scene: Scene,
    scrollPosition: number
  ) {
    super(geometry.clone(), new ReflectiveMaterial(uniforms), name);
      (this.startPos = options.start),
      (this.stopPos = options.stop),
      (this.material.uniforms.uRoughnessTexture.value = roughnessTexture),
      (this.material.uniforms.uNormalTexture.value = normalTexture),
      (this.material.uniforms.uWallsTexture.value = wallTexture),
      (this.material.uniforms.uDiffuse.value = diffuse),
      maskTexture && (this.material.uniforms.uMaskTexture.value = maskTexture),
      this.geometry.computeBoundingBox(),
      this.geometry.computeBoundingSphere(),
      applyObjectDataToObjectProps(this, objectData),
      this.updateMatrix(),
      this.updateMatrixWorld(),
      this.updateCameraScene(camera, scene);
      this.scrollPosition = scrollPosition;
  }
  updateScroll(scrollPosition: number, renderer: WebGLRenderer) {
    this.scrollPosition = scrollPosition;
    this.scrollPosition < this.startPos ||
    this.scrollPosition > this.stopPos ||
      this.onBeforeRender(renderer);
  }
}

class MipMapper {
  material: ShaderMaterial;
  swapTarget: WebGLRenderTarget;
  copyQuad: Quad;
  mipQuad: Quad;
  size: Vector2;
  targetSize: Vector2;
  maxMipMapLevel: number;
  constructor() {
    (this.material = new ShaderMaterial({
      vertexShader:
        "#define GLSLIFY 1\nvarying vec2 vUv;\n\nvoid main() {\n    #include <begin_vertex>\n    #include <project_vertex>\n    vUv = uv;\n}",
      fragmentShader:
        '#define GLSLIFY 1\nvarying vec2 vUv;\n\nuniform sampler2D map;\nuniform int parentLevel;\nuniform vec2 parentMapSize;\nuniform vec2 originalMapSize;\n\n// With original size argument\nvec4 packedTexture2DLOD( sampler2D tex, vec2 uv, int level, vec2 originalPixelSize ) {\n\n    float floatLevel = float( level );\n    vec2 atlasSize;\n    atlasSize.x = floor( originalPixelSize.x * 1.5 );\n    atlasSize.y = originalPixelSize.y;\n\n    // we stop making mip maps when one dimension == 1\n    float maxLevel = min( floor( log2( originalPixelSize.x ) ), floor( log2( originalPixelSize.y ) ) );\n    floatLevel = min( floatLevel, maxLevel );\n\n    // use inverse pow of 2 to simulate right bit shift operator\n    vec2 currentPixelDimensions = floor( originalPixelSize / pow( 2.0, floatLevel ) );\n    vec2 pixelOffset = vec2(\n        floatLevel > 0.0 ? originalPixelSize.x : 0.0,\n        floatLevel > 0.0 ? currentPixelDimensions.y : 0.0\n    );\n\n    // "minPixel / atlasSize" samples the top left piece of the first pixel\n    // "maxPixel / atlasSize" samples the bottom right piece of the last pixel\n    vec2 minPixel = pixelOffset;\n    vec2 maxPixel = pixelOffset + currentPixelDimensions;\n    vec2 samplePoint = mix( minPixel, maxPixel, uv );\n    samplePoint /= atlasSize;\n\n    vec2 halfPixelSize = 1.0 / ( 2.0 * atlasSize );\n    samplePoint = min( samplePoint, maxPixel / atlasSize - halfPixelSize );\n    samplePoint = max( samplePoint, minPixel / atlasSize + halfPixelSize );\n\n    return texture2D( tex, samplePoint );\n\n}\n\n#define SAMPLES 6\n\nvec4 sampleAt( vec2 uv ) {\n    return packedTexture2DLOD( map, uv, parentLevel, originalMapSize );\n}\n\nvoid main() {\n\n    vec2 childMapSize = parentMapSize / 2.0;\n    vec2 childPixelPos = floor( vUv * childMapSize );\n\n    vec2 parentPixelSize = 1.0 / parentMapSize;\n    vec2 halfParentPixelSize = parentPixelSize / 2.0;\n    vec2 parentPixelPos = childPixelPos * 2.0;\n\n    vec2 baseUv = ( parentPixelPos / parentMapSize ) + halfParentPixelSize;\n\n    vec4 samples[ SAMPLES ];\n    float weights[ SAMPLES ];\n\n    float xden = 2.0 * parentMapSize.x + 1.0;\n    float wx0 = ( parentMapSize.x - parentPixelPos.x ) / xden;\n    float wx1 = ( parentMapSize.x ) / xden;\n    float wx2 = ( parentPixelPos.x + 1.0 ) / xden;\n\n    float yden = 2.0 * parentMapSize.y + 1.0;\n    float wy0 = ( parentMapSize.y - parentPixelPos.y ) / yden;\n    float wy1 = ( parentMapSize.y ) / yden;\n    float wy2 = ( parentPixelPos.y + 1.0 ) / yden;\n\n    samples[ 0 ] = sampleAt( baseUv );\n    samples[ 1 ] = sampleAt( baseUv + vec2( parentPixelSize.x, 0.0 ) );\n    samples[ 2 ] = sampleAt( baseUv + vec2( 2.0 * parentPixelSize.x, 0.0 ) );\n\n    samples[ 3 ] = sampleAt( baseUv + vec2( 0.0, parentPixelSize.y ) );\n    samples[ 4 ] = sampleAt( baseUv + vec2( parentPixelSize.x, parentPixelSize.y ) );\n    samples[ 5 ] = sampleAt( baseUv + vec2( 2.0 * parentPixelSize.x, parentPixelSize.y ) );\n\n    // samples[ 6 ] = sampleAt( baseUv + vec2( 0.0, 2.0 * parentPixelSize.y ) );\n    // samples[ 7 ] = sampleAt( baseUv + vec2( parentPixelSize.x, 2.0 * parentPixelSize.y ) );\n    // samples[ 8 ] = sampleAt( baseUv + vec2( 2.0 * parentPixelSize.x, 2.0 * parentPixelSize.y ) );\n\n    weights[ 0 ] = wx0 * wy0;\n    weights[ 1 ] = wx1 * wy0;\n    weights[ 2 ] = wx2 * wy0;\n\n    weights[ 3 ] = wx0 * wy1;\n    weights[ 4 ] = wx1 * wy1;\n    weights[ 5 ] = wx2 * wy1;\n\n    // weights[ 6 ] = wx0 * wy2;\n    // weights[ 7 ] = wx1 * wy2;\n    // weights[ 8 ] = wx2 * wy2;\n\n    #pragma unroll_loop\n    for ( int i = 0; i < SAMPLES; i ++ ) {\n        gl_FragColor += samples[ i ] * weights[ i ];\n    }\n}',
      uniforms: {
        map: {
          value: null,
        },
        originalMapSize: {
          value: new Vector2(),
        },
        parentMapSize: {
          value: new Vector2(),
        },
        parentLevel: {
          value: 0,
        },
      },
    })),
      (this.swapTarget = new WebGLRenderTarget()),
      (this.swapTarget.texture.minFilter = NearestFilter),
      (this.swapTarget.texture.magFilter = NearestFilter),
      (this.copyQuad = new Quad(
        new RawShaderMaterial({
          vertexShader:
            "precision highp float;\nprecision highp int;\n#define GLSLIFY 1\n\nattribute vec3 position;\nattribute vec2 uv;\n\nvarying vec2 vUv;\n\nvoid main() {\n    vUv = uv;\n    gl_Position = vec4(position, 1.0 );\n}",
          fragmentShader:
            "precision highp float;\nprecision highp int;\n#define GLSLIFY 1\n\nuniform sampler2D uTexture;\n\nvarying vec2 vUv;\n\nvoid main () {\n    gl_FragColor = texture2D(uTexture, vUv);\n}\n",
          uniforms: {
            uTexture: {
              value: null,
            },
          },
          depthTest: !1,
          depthWrite: !1,
          blending: 0,
        })
      )),
      (this.mipQuad = new Quad(this.material)),
      (this.size = new Vector2()),
      (this.targetSize = new Vector2()),
      (this.maxMipMapLevel = 1);
  }
  resize(t: Vector2, e: WebGLRenderTarget) {
    const n = Math.floor(t.x),
      i = Math.floor(t.y);
    this.size.set(n, i),
      this.targetSize.set(Math.floor(1.5 * this.size.x), this.size.y),
      e.setSize(this.targetSize.x, this.targetSize.y),
      this.swapTarget.setSize(this.targetSize.x, this.targetSize.y);
  }
  update(t: Texture, e: WebGLRenderTarget, n: WebGLRenderer) {
    const i = n.autoClear,
      r = n.getRenderTarget();
    (n.autoClear = !1),
      (this.copyQuad.material.uniforms.uTexture.value = t),
      n.setRenderTarget(this.swapTarget),
      this.copyQuad.render(n);
    let s = this.size.x,
      o = this.size.y,
      a = 0;
    for (; s > this.maxMipMapLevel && o > this.maxMipMapLevel; ) {
      (this.material.uniforms.map.value = this.swapTarget.texture),
        (this.material.uniforms.parentLevel.value = a),
        this.material.uniforms.parentMapSize.value.set(s, o),
        this.material.uniforms.originalMapSize.value.set(
          this.size.x,
          this.size.y
        ),
        (s = Math.floor(s / 2)),
        (o = Math.floor(o / 2));
      const t = this.targetSize.y - 2 * o;
      n.setRenderTarget(e),
        this.mipQuad.camera.setViewOffset(
          s,
          o,
          -this.size.x,
          -t,
          this.targetSize.x,
          this.targetSize.y
        ),
        this.mipQuad.render(n),
        n.setRenderTarget(this.swapTarget),
        (this.material.uniforms.map.value = e.texture),
        this.mipQuad.render(n),
        a++;
    }
    n.setRenderTarget(r), (n.autoClear = i);
  }
  dispose() {
    this.swapTarget.dispose(), this.mipQuad.dispose(), this.copyQuad.dispose();
  }
}

class Quad {
  private _camera: OrthographicCamera;
  private _mesh: Mesh<PlaneGeometry, ShaderMaterial>;
  get camera() {
    return this._camera;
  }
  get material() {
    return this._mesh.material;
  }
  set material(t) {
    this._mesh.material = t;
  }
  constructor(t: ShaderMaterial) {
    const e = new OrthographicCamera(-1, 1, 1, -1, 0, 1),
      n = new PlaneGeometry(2, 2);
    (this._mesh = new Mesh(n, t)), (this._camera = e);
  }
  dispose() {
    this._mesh.geometry.dispose();
  }
  render(t: WebGLRenderer) {
    t.render(this._mesh, this._camera);
  }
}
