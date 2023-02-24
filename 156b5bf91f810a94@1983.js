import define1 from "./e93997d5089d7165@2303.js";
import define2 from "./10023e7d8ddc32bc@90.js";

function _1(md){return(
md`# Raymarching 3D Fractals
`
)}

function _colorPick(columns,color){return(
columns({
  background: color({
    value: "#e0edf4",
    title: "Background Color"
  }),
  plane: color({
    value: "#bebebe",
    title: "Plane Color"
  }),
  material: color({
    value: "#ff0024",
    title: "Material Color"
  }),
  glow: color({
    value: "#ff0024",
    title: "Glow Color"
  })
})
)}

function _shinandlight(columns,slider){return(
columns({
 shininess: slider({
    min: 1, 
    max: 100, 
    step: 1, 
    value: 16, 
    title: "shininess",
  }),
   K_s: slider({
    min: 0, 
    max: 1, 
    step: 0.1, 
    value: 0.5, 
    title: "K_s",
  }),
    yRotation: slider({
    min: -2, 
    max: 2, 
    step: .05, 
    value: 0., 
    title: "Y-Axis Rotation",
    description: ""
  }),
})
)}

function _ModelParameters(columns,slider){return(
columns({
  xCameraOffset: slider({
    min: -5, 
    max: 5, 
    step: .1, 
    value: 0, 
    title: "Camera X-Axis Offset",
    description: ""
  }),
  yCameraOffset: slider({
    min: -5, 
    max: 5, 
    step: .1, 
    value: 0, 
    title: "Camera Y-Axis Offset",
    description: ""
  }),
  zCameraOffset: slider({
    min: -10., 
    max: 5, 
    step: .01, 
    value: -2.5, 
    title: "Camera Z-Axis Offset",
    description: ""
  }),

})
)}

function _effects(columns,slider){return(
columns({
  fogDensity: slider({
    min: 0, 
    max: 1, 
    step: .01, 
    value: .1, 
    title: "Fog Density",
    description: ""
  }),
  stepsAO: slider({
    min: 0, 
    max: 50, 
    step: 1, 
    value: 12, 
    title: "AO Steps",
    description: ""
  }),
  shadowSoftness: slider({
    min: 2, 
    max: 256, 
    step: 1, 
    value: 32, 
    title: "Shadow Softness",
    description: ""
  }),
})
)}

function _glowStrength(columns,slider){return(
columns({
  glowStrength: slider({
    min: 0, 
    max: 40, 
    step: 1, 
    value: 0, 
    title: "Glow Strength",
    description: ""
  }),
})
)}

function _julia(columns,slider){return(
columns({
  c: slider({
    min: -3, 
    max: 3, 
    step: .01, 
    value: -.34, 
    title: "Julia C Value",
    description: ""
  }),
  w: slider({
    min: -3, 
    max: 3, 
    step: .01, 
    value: -.34, 
    title: "Julia W Value",
    description: ""
  }),
})
)}

function _scene(Inputs){return(
Inputs.select(["Mandelbulb", "Sierpinski Triangle", "Julia Set"],{value: "Mandelbulb", label: "Scene"})
)}

function _canvas(DOM,width,height){return(
DOM.canvas(width, height)
)}

function _errorBlock(html,width){return(
html`<textarea style="height : 400px; width : ${width}px; font-size: 0.8em; display: block"></textarea>`
)}

function _shaders(){return(
{
fs: `#version 300 es

  // Resources I used to create this project:
  // https://iquilezles.org/articles/                                 
  // http://blog.hvidtfeldts.net/index.php/2011/06/distance-estimated-3d-fractals-part-i/
  // https://www.youtube.com/watch?v=PGtv-dBi2wE 
  // https://www.youtube.com/watch?v=svLzmFuSBhk
  // http://2008.sub.blue/blog/2009/9/20/quaternion_julia.html
  // https://www.t3hz0r.com/post/distance-function-ray-marching-webgl/
  // https://webglfundamentals.org/webgl/lessons/webgl-fog.html
  // https://typhomnt.github.io/teaching/ray_tracing/raymarching_intro/#bonus-effect-ambient-occulsion-

  precision highp float;

  #define LOG2 1.442695

  const int MAX_STEPS = 300;
  const float MAX_DIST = 200.;
  const float SURF_DIST = .001;

  uniform vec2 resolution;
  uniform float xCameraOffset;
  uniform float yCameraOffset;
  uniform float zCameraOffset;
  uniform float yRotation;
  uniform vec4 light;
  uniform vec3 materialColor;
  uniform vec3 planeColor;
  uniform float Ks;
  uniform float shininess;
  uniform vec3 backgroundColor;
  uniform float fogDensity;
  uniform float stepsAO;
  uniform int sceneID;
  uniform float cheapAOStrength;
  uniform float shadowSoftness;
  uniform float glowStrength;
  uniform vec3 bloomColor;
  uniform float juliaC;
  uniform float juliaW;

  out vec4 fragColor;

  int g_totalSteps;
  float g_minDistanceObject = -1.;
  float g_outsideFracDistance = -1.;
  vec3 g_bloomPoint;
  bool g_isObjectPoint;
  bool g_checkObjectPoint;
  vec4 g_trapColor;

  vec3 repeat(vec3 point, vec3 c) {
    return mod(point, c) - 0.5 * c;
  }

  int checkMinDist(vec3 point, float fracDist) {
    if (g_checkObjectPoint == true) {
      if (g_minDistanceObject < 0.) g_minDistanceObject = fracDist;

      g_minDistanceObject = min(fracDist, g_minDistanceObject);
      
      if (fracDist < g_minDistanceObject) {
        g_bloomPoint = point;
        //fracDist = g_minDistanceObject;
      }
    }
    return 0;
  }

  float getFracPlaneMinDist(float fracDist, float planeDist) {
    if (fracDist < planeDist) {
      if (g_checkObjectPoint == true)  g_isObjectPoint = true;
      return fracDist;
    }
    else {
      if (g_checkObjectPoint == true) g_isObjectPoint = false;
      return planeDist;
    }
  }

  float map(vec3 p, vec4 resColor) {
    vec3 w = p;
    float m = dot(w,w);
  
    vec4 trap = vec4(abs(w),m);
  	float dz = 1.;
    float multi = 8.0;
      
  	for( int i=0; i<5; i++ ) {
  		  dz = multi*pow(m,3.5)*dz + 1.0;
        
        float r = length(w);
        float b = multi*acos( w.y/r);
        float a = multi*atan( w.x, w.z );
        w = p + pow(r,multi) * vec3( sin(b)*sin(a), cos(b), sin(b)*cos(a) );
        
        trap = min( trap, vec4(abs(w),m) );
        
        m = dot(w,w);
          if( m > 256.0 )
        break;
      }
  
      g_trapColor = vec4(trap.yzw / 300., 1.);
  
      float planeDist = p.y + 1.5;
      float fracDist = 0.25*log(m)*sqrt(m)/dz;  

      checkMinDist(p, fracDist);

      return getFracPlaneMinDist(fracDist, planeDist);
  }

  // square a quaterion
  vec4 qsqr(vec4 a)  {
      return vec4( a.x*a.x - a.y*a.y - a.z*a.z - a.w*a.w,
                   2.0*a.x*a.y,
                   2.0*a.x*a.z,
                   2.0*a.x*a.w );
  }

  float julia(vec3 p) {
      vec4 z = vec4(p, juliaW);
      float md2 = 1.0;
      float mz2 = dot(z,z);
      float c = juliaC ;
  
      vec4 trap = vec4(abs(z.xyz),dot(z,z));
  
      float n = 1.0;
      for( int i=0; i<12; i++ ) {
          md2 *= 4.0*mz2;
          // z  -> z^2 + c
          z = qsqr(z) + c;  
  
          trap = min( trap, vec4(abs(z.xyz),dot(z,z)) );
  
          mz2 = dot(z, z);
          if(mz2>40.0) break;
          n += 1.0;
      }

      float fracDist = 0.25*sqrt(mz2/md2)*log(mz2);
      float planeDist = p.y + 1.5;

      checkMinDist(p, fracDist);
        
      return getFracPlaneMinDist(fracDist, planeDist); // d = 0.5·|z|·log|z|/|z'|
  }



float DE(vec3 z)
{
    float r;
    int n = 0;
    float Scale = 2. ;
    vec3 Offset = vec3(1.);
    vec3 originalZ = z;

    while (n < 20) {
       if(z.x + z.y<0.) z.xy = -z.yx; // fold 1
       if(z.x + z.z<0.) z.xz = -z.zx; // fold 2
       if(z.y + z.z<0.) z.zy = -z.yz; // fold 3	

       z = z*Scale - Offset*(Scale-1.0);
       n++;
    }

    float fracDist = (length(z) ) * pow(Scale, -float(n));
    checkMinDist(z, fracDist);
    float planeDist = originalZ.y + 1.5;

    return getFracPlaneMinDist(fracDist, planeDist);
}



  float sceneDistance(vec3 w, float radius) {
    if (sceneID == 0) {
      return map(w, vec4(0,0,0,0));
    }
    else if (sceneID == 1) {
      return DE(w);
    }
    else if (sceneID == 2) {
      return(julia(w));
    }

    // else if (sceneID == 2) {
    //   g_isObjectPoint = true;
    //   return max(0.0, length(repeat(w, vec3(6.0))) - radius);
    // }
  }

  vec3 gradient(vec3 point, float scale) {
    return normalize(vec3(
      sceneDistance(point + vec3(scale, 0, 0), 1.) - sceneDistance(point - vec3(scale, 0, 0), 1.),
      sceneDistance(point + vec3(0, scale, 0), 1.) - sceneDistance(point - vec3(0, scale, 0), 1.),
      sceneDistance(point + vec3(0, 0, scale), 1.) - sceneDistance(point - vec3(0, 0, scale), 1.)
    ));
  }

  // float getDist(vec3 point) {
  //   vec4 s = vec4(0, 0, 6, 1);

  //   float sphereDist = length(point - s.xyz) - s.w;
  //   float planeDist = point.y + 10.0;

  //   return min(sphereDist, planeDist);
  // }

  float rayMarch(vec3 rayOrigin, vec3 rayDirection, bool checkObj) {
    float distance = 0.;

    for (int i = 0; i < MAX_STEPS; i++) {
      vec3 currentLocation = rayOrigin + rayDirection * distance;
      float distanceScene = sceneDistance(currentLocation, 1.0);

      distance += distanceScene;
      
      if (distance > MAX_DIST) {
        g_totalSteps = i;
        //if (g_checkObjectPoint == true && sceneID != 0)  g_isObjectPoint = false;
        return -1.;
      }
      else if (distanceScene < SURF_DIST) {
        g_totalSteps = i;
        //if (g_checkObjectPoint == true && sceneID != 0)  g_isObjectPoint = true;

        break;
      }
    }
    
    return distance;
  }

float shadow(vec3 ro, vec3 rd, float mint, float maxt) {
    float res = 1.0;
    int steps = 0;
    for( float t=mint; t<maxt;)
    {
        float h = sceneDistance(ro + rd*t, 1.);
        if( h<0.0001 )
            return 0.0;
        res = min(res, shadowSoftness * h / t);
        t += h;
    }
    return res;
}


float AmbientOcclusion(vec3 point, vec3 normal, float step_dist, float step_nbr)
{
    float occlusion = 1.0f;
    while(step_nbr > 0.0)
    {
    occlusion -= pow(step_nbr * step_dist - (sceneDistance( point + normal * step_nbr * step_dist, 1.)),2.) / step_nbr;
    step_nbr--;
    }

    return occlusion;
}


  bool isInShadow(vec3 point, vec3 normal, vec3 lightDirection) {
    vec3 L = normalize(lightDirection);
    vec3 initOffset = normal * SURF_DIST * 2.;

    float distanceScene = rayMarch(point + initOffset, L, false);
    return distanceScene != -1.;
  }

  float getFogAmount(float distance) {
    float fogAmount = 1. - exp2(-fogDensity * fogDensity * distance * distance * LOG2);

    return clamp(fogAmount, 0., 1.);
  }

  vec3 getLightValue(vec3 point, vec3 rayDirection, float distance, vec3 cameraOrigin) {
    vec3 N = gradient(point - rayDirection * SURF_DIST, .001);
    vec3 L = normalize(light.xyz);
    vec3 V = normalize(vec3(0,0,0)-point);
    vec3 H = normalize(L+V);

    float cheapAOLevel = (1. - (float(g_totalSteps) * .03) * cheapAOStrength);
    float goodAOLevel = pow(AmbientOcclusion(point, N, .01, 40.), stepsAO);
    goodAOLevel = clamp(goodAOLevel, 0., 1.);

    cheapAOLevel = goodAOLevel;

    float bloomLevel =  float(g_totalSteps) / float(MAX_STEPS) * glowStrength;

    bloomLevel = clamp(bloomLevel, 0., 1.);
    if (g_isObjectPoint == false) {
      cheapAOLevel = 1.;
      bloomLevel =  1. - (g_minDistanceObject) / (SURF_DIST * glowStrength * 30.) ;
      bloomLevel = clamp(bloomLevel, 0., 1.);
      bloomLevel *=(bloomLevel);
    }
    
    vec3 resultMaterial = materialColor;
    if (g_isObjectPoint == false) resultMaterial = planeColor;

    if (distance == -1.) resultMaterial = backgroundColor;

    float shadowValue = shadow(point, L, SURF_DIST * 1., 200.);

    vec3 diffuse = resultMaterial * clamp(dot(L,N), 0.,1.) * cheapAOLevel;
    vec3 ambient = .3 * resultMaterial * cheapAOLevel;
    vec3 specular = vec3(1.0) * pow(clamp(dot(H,N),0.,1.), shininess);

    vec3 color = ((1.-Ks)*diffuse + Ks*specular) * shadowValue + ambient;
    if (distance == -1.) color = backgroundColor;

    float fogAmount = getFogAmount(distance);
    float fogAmountBloom = 0.;
    if (g_isObjectPoint == false) fogAmountBloom = getFogAmount(length(g_bloomPoint - cameraOrigin));

    if (g_isObjectPoint == false) {
      color = mix(color, backgroundColor, fogAmount);

      vec3 bloomColor = mix(color, bloomColor, bloomLevel);
      bloomColor = mix(bloomColor, backgroundColor, fogAmountBloom);

      color = mix(color, bloomColor, .5);
    }
    else {
      color = mix(color, bloomColor, bloomLevel);
      color = mix(color, backgroundColor, fogAmount);
    }

    if (g_isObjectPoint == true) {
      //color = vec3( (sin(length(point) * 100.) + 1.) / 2. );
    }
    return color;
  }

  mat3 rotateY(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
      vec3(c, 0, s),
      vec3(0, 1, 0),
      vec3(-s, 0, c)
    );
  }

  void main() {  
    // places origin at center of the screen
    vec3 normCoord = vec3((gl_FragCoord.xy - .5 * resolution.xy) / resolution.y, zCameraOffset);
    normCoord.x += xCameraOffset;
    normCoord.y += yCameraOffset;

    normCoord *= rotateY(yRotation);

    vec3 cameraOrigin = vec3(xCameraOffset, yCameraOffset, -1.0 + zCameraOffset);
    cameraOrigin *= rotateY(yRotation);

    vec3 rayDirection = normalize(normCoord - cameraOrigin);

    g_checkObjectPoint = true;
    float distance = rayMarch(cameraOrigin, rayDirection, true);
    g_checkObjectPoint = false;

    vec3 surfacePoint = cameraOrigin + distance * rayDirection;

    if (distance == -1.) surfacePoint = g_bloomPoint;
    vec3 color = getLightValue(surfacePoint, rayDirection, distance, cameraOrigin);

    fragColor = vec4(color, 1.0);
      //fragColor = g_trapColor;
  }

`,
vs: `#version 300 es
  precision highp float;
  in vec4 position;

  void main() {
    gl_Position = position;
  }`
}
)}

function _backgroundColor(){return(
"#e0edf4"
)}

function _13(gl,ModelParameters,shinandlight,hex2rgb,colorPick,effects,getSceneID,scene,glowStrength,julia,programInfo,twgl,bufferInfo,md)
{
  function render(time) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    const uniforms = {
      resolution: [gl.canvas.width, gl.canvas.height],
      xCameraOffset: ModelParameters.xCameraOffset,
      yCameraOffset: ModelParameters.yCameraOffset,
      zCameraOffset: ModelParameters.zCameraOffset,
      yRotation: shinandlight.yRotation,
      light: [1,1,-1,0],
      materialColor: hex2rgb(colorPick.material),
      planeColor: hex2rgb(colorPick.plane),
      shininess: shinandlight.shininess,
      Ks: shinandlight.K_s,
      backgroundColor: hex2rgb(colorPick.background),
      fogDensity: effects.fogDensity,
      sceneID: getSceneID(scene),
      cheapAOStrength: 0,
      stepsAO: effects.stepsAO,
      shadowSoftness: effects.shadowSoftness,
      glowStrength: glowStrength.glowStrength,
      bloomColor: hex2rgb(colorPick.glow),
      juliaC: julia.c == 0 ? julia.c + .001 : julia.c,
      juliaW: julia.w

    };

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, bufferInfo);
  }
  render();
  return md`### WebGL Render code`;
}


function _14(md){return(
md`### Leave the following code unchanged.`
)}

function _getSceneID(){return(
function getSceneID(scene) {
  let sceneIDMap = {
    "Mandelbulb" : 0,
    "Sierpinski Triangle" : 1,
    "Julia Set" : 2,
  }
  return (sceneIDMap[scene]);
}
)}

function _bufferInfo(twgl,gl){return(
twgl.createBufferInfoFromArrays(gl, {
  position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0]
})
)}

function _programInfo(errorBlock,twgl,gl,shaders)
{
  errorBlock.style.display = "none";
  return twgl.createProgramInfo(gl, [shaders.vs, shaders.fs], message => {
    errorBlock.style.display = "block";
    errorBlock.innerHTML = message;
  });
}


function _gl(canvas,hex2rgb,backgroundColor)
{
  const gl = canvas.getContext('webgl2', { antialias: true });
  gl.clearColor(...hex2rgb(backgroundColor), 1); // Choose a clear color
  gl.clear(gl.COLOR_BUFFER_BIT);
  return gl;
}


function _height(){return(
700
)}

function _20(md){return(
md`### Local Helper Functions`
)}

function _hex2rgb(){return(
hex =>
  (hex = hex.replace('#', ''))
    .match(new RegExp('(.{' + hex.length / 3 + '})', 'g'))
    .map(l => parseInt(hex.length % 2 ? l + l : l, 16) / 255)
)}

function _22(md){return(
md`### External Libraries and Functions (imports)`
)}

function _twgl(require){return(
require("twgl.js")
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("viewof colorPick")).define("viewof colorPick", ["columns","color"], _colorPick);
  main.variable(observer("colorPick")).define("colorPick", ["Generators", "viewof colorPick"], (G, _) => G.input(_));
  main.variable(observer("viewof shinandlight")).define("viewof shinandlight", ["columns","slider"], _shinandlight);
  main.variable(observer("shinandlight")).define("shinandlight", ["Generators", "viewof shinandlight"], (G, _) => G.input(_));
  main.variable(observer("viewof ModelParameters")).define("viewof ModelParameters", ["columns","slider"], _ModelParameters);
  main.variable(observer("ModelParameters")).define("ModelParameters", ["Generators", "viewof ModelParameters"], (G, _) => G.input(_));
  main.variable(observer("viewof effects")).define("viewof effects", ["columns","slider"], _effects);
  main.variable(observer("effects")).define("effects", ["Generators", "viewof effects"], (G, _) => G.input(_));
  main.variable(observer("viewof glowStrength")).define("viewof glowStrength", ["columns","slider"], _glowStrength);
  main.variable(observer("glowStrength")).define("glowStrength", ["Generators", "viewof glowStrength"], (G, _) => G.input(_));
  main.variable(observer("viewof julia")).define("viewof julia", ["columns","slider"], _julia);
  main.variable(observer("julia")).define("julia", ["Generators", "viewof julia"], (G, _) => G.input(_));
  main.variable(observer("viewof scene")).define("viewof scene", ["Inputs"], _scene);
  main.variable(observer("scene")).define("scene", ["Generators", "viewof scene"], (G, _) => G.input(_));
  main.variable(observer("canvas")).define("canvas", ["DOM","width","height"], _canvas);
  main.variable(observer("errorBlock")).define("errorBlock", ["html","width"], _errorBlock);
  main.variable(observer("shaders")).define("shaders", _shaders);
  main.variable(observer("backgroundColor")).define("backgroundColor", _backgroundColor);
  main.variable(observer()).define(["gl","ModelParameters","shinandlight","hex2rgb","colorPick","effects","getSceneID","scene","glowStrength","julia","programInfo","twgl","bufferInfo","md"], _13);
  main.variable(observer()).define(["md"], _14);
  main.variable(observer("getSceneID")).define("getSceneID", _getSceneID);
  main.variable(observer("bufferInfo")).define("bufferInfo", ["twgl","gl"], _bufferInfo);
  main.variable(observer("programInfo")).define("programInfo", ["errorBlock","twgl","gl","shaders"], _programInfo);
  main.variable(observer("gl")).define("gl", ["canvas","hex2rgb","backgroundColor"], _gl);
  main.variable(observer("height")).define("height", _height);
  main.variable(observer()).define(["md"], _20);
  main.variable(observer("hex2rgb")).define("hex2rgb", _hex2rgb);
  main.variable(observer()).define(["md"], _22);
  const child1 = runtime.module(define1);
  main.import("slider", child1);
  main.import("radio", child1);
  const child2 = runtime.module(define2);
  main.import("columns", child2);
  const child3 = runtime.module(define1);
  main.import("color", child3);
  main.variable(observer("twgl")).define("twgl", ["require"], _twgl);
  return main;
}
