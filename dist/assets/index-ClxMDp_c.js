(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=typeof Float32Array<`u`?Float32Array:Array;Math.hypot||(Math.hypot=function(){for(var e=0,t=arguments.length;t--;)e+=arguments[t]*arguments[t];return Math.sqrt(e)});function t(){var t=new e(16);return e!=Float32Array&&(t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0),t[0]=1,t[5]=1,t[10]=1,t[15]=1,t}function n(e,t){var n=t[0],r=t[1],i=t[2],a=t[3],o=t[4],s=t[5],c=t[6],l=t[7],u=t[8],d=t[9],f=t[10],p=t[11],m=t[12],h=t[13],g=t[14],_=t[15],v=n*s-r*o,y=n*c-i*o,b=n*l-a*o,x=r*c-i*s,S=r*l-a*s,C=i*l-a*c,w=u*h-d*m,T=u*g-f*m,E=u*_-p*m,D=d*g-f*h,O=d*_-p*h,k=f*_-p*g,A=v*k-y*O+b*D+x*E-S*T+C*w;return A?(A=1/A,e[0]=(s*k-c*O+l*D)*A,e[1]=(i*O-r*k-a*D)*A,e[2]=(h*C-g*S+_*x)*A,e[3]=(f*S-d*C-p*x)*A,e[4]=(c*E-o*k-l*T)*A,e[5]=(n*k-i*E+a*T)*A,e[6]=(g*b-m*C-_*y)*A,e[7]=(u*C-f*b+p*y)*A,e[8]=(o*O-s*E+l*w)*A,e[9]=(r*E-n*O-a*w)*A,e[10]=(m*S-h*b+_*v)*A,e[11]=(d*b-u*S-p*v)*A,e[12]=(s*T-o*D-c*w)*A,e[13]=(n*D-r*T+i*w)*A,e[14]=(h*y-m*x-g*v)*A,e[15]=(u*x-d*y+f*v)*A,e):null}var r=`#version 300 es
// FixedFunction (FF) v1.0 vertex shader.
// Emulates the OpenGL 2 fixed-function vertex stage, in WORLD space.
// Read it, but do not edit it.
precision highp float;

const int MAX_LIGHTS = 1; // v1.0: one directional light

struct Light {
  bool enabled;
  vec4 position; // world space. w = 0: directional, xyz points TOWARD the light
  vec4 ambient;
  vec4 diffuse;
  vec4 specular;
};

struct Material {
  vec4 ambient;
  vec4 diffuse;
  vec4 specular;
  float shininess;
};

// Attribute slots. GL2: glVertexPointer, glNormalPointer, glColorPointer. Lecture 2A.
layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec4 a_color;
// layout(location = 3) in vec2 a_uv;  // reserved. Sampled from v1.1.

// Matrices. GL2: the modelview matrix, split in model and view. Lecture 2B.
uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat3 u_normalMatrix; // inverse transpose of the model matrix, upper 3x3
uniform vec3 u_eyePosition;  // world space. Computed by FF from the view matrix.

// Switches. GL2: glEnable(GL_LIGHTING), glEnable(GL_COLOR_MATERIAL).
uniform bool u_lighting;
uniform bool u_colorMaterial;

uniform vec4 u_globalAmbient; // GL2: GL_LIGHT_MODEL_AMBIENT
uniform Light u_lights[MAX_LIGHTS];
uniform Material u_material;

out vec4 v_primary;  // ambient + diffuse + emission, with alpha
out vec3 v_specular; // added after texturing in later versions

void main() {
  // Vertex position. GL2: gl_ModelViewProjectionMatrix * gl_Vertex. Lecture 2B.
  vec4 worldPosition = u_model * vec4(a_position, 1.0);
  gl_Position = u_projection * u_view * worldPosition;

  // Unlit path. GL2: LIGHTING disabled. Output is the color attribute. Lecture 2A.
  if (!u_lighting) {
    v_primary = a_color;
    v_specular = vec3(0.0);
    return;
  }

  vec3 n = normalize(u_normalMatrix * a_normal);
  vec3 v = normalize(u_eyePosition - worldPosition.xyz);

  // GL2: GL_COLOR_MATERIAL with GL_AMBIENT_AND_DIFFUSE.
  vec4 ka = u_colorMaterial ? a_color : u_material.ambient;
  vec4 kd = u_colorMaterial ? a_color : u_material.diffuse;

  vec3 primary = ka.rgb * u_globalAmbient.rgb; // k_e (emission) arrives in v1.1
  vec3 specular = vec3(0.0);

  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (!u_lights[i].enabled) continue;

    // v1.0: directional lights only (w = 0).
    vec3 l = normalize(u_lights[i].position.xyz);

    // Ambient and Lambert diffuse. GL2: GL_AMBIENT, GL_DIFFUSE. Lecture 9A.
    float nDotL = dot(n, l);
    primary += ka.rgb * u_lights[i].ambient.rgb;
    primary += kd.rgb * u_lights[i].diffuse.rgb * max(nDotL, 0.0);

    // Phong specular with the reflection vector r = 2(n.l)n - l. GL2: GL_SPECULAR. Lecture 9A.
    // GL2 uses the Blinn half-vector. FF uses Phong by course decision.
    if (nDotL > 0.0) {
      vec3 r = 2.0 * nDotL * n - l;
      // shininess = 0 would make pow(0, 0) undefined in GLSL. GL2 gives 1.
      float f = u_material.shininess > 0.0 ? pow(max(dot(r, v), 0.0), u_material.shininess) : 1.0;
      specular += u_material.specular.rgb * u_lights[i].specular.rgb * f;
    }
  }

  v_primary = vec4(clamp(primary, 0.0, 1.0), kd.a);
  v_specular = specular;
}
`,i=`#version 300 es
// FixedFunction (FF) v1.0 fragment shader.
// GL2: the color sum stage. Texturing arrives in v1.1. Lecture 2A.
precision mediump float;

in vec4 v_primary;  // interpolated across the triangle (Gouraud)
in vec3 v_specular;

out vec4 outColor;

void main() {
  // GL2: GL_SEPARATE_SPECULAR_COLOR. Specular is added last.
  outColor = vec4(v_primary.rgb + v_specular, v_primary.a);
}
`,a=`1.0.0`,o={POSITION:0,NORMAL:1,COLOR:2,UV:3},s=`lighting`,c=`colorMaterial`,l=1,u=e=>new Float32Array([e[0],e[1],e[2],e.length===4?e[3]:1]);function d(e,t,n){let r=e.createShader(t);if(e.shaderSource(r,n),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)){let t=e.getShaderInfoLog(r);throw e.deleteShader(r),Error(`FF: shader compile failed:\n${t}`)}return r}function f(e,t,n){let r=e.createProgram();if(e.attachShader(r,t),e.attachShader(r,n),e.linkProgram(r),!e.getProgramParameter(r,e.LINK_STATUS)){let t=e.getProgramInfoLog(r);throw e.deleteProgram(r),Error(`FF: program link failed:\n${t}`)}return r}function p(e,p={}){let m=p.debug??!1,h=f(e,d(e,e.VERTEX_SHADER,r),d(e,e.FRAGMENT_SHADER,i)),g=t=>e.getUniformLocation(h,t),_={model:g(`u_model`),view:g(`u_view`),projection:g(`u_projection`),normalMatrix:g(`u_normalMatrix`),eyePosition:g(`u_eyePosition`),lighting:g(`u_lighting`),colorMaterial:g(`u_colorMaterial`),globalAmbient:g(`u_globalAmbient`),lights:Array.from({length:l},(e,t)=>({enabled:g(`u_lights[${t}].enabled`),position:g(`u_lights[${t}].position`),ambient:g(`u_lights[${t}].ambient`),diffuse:g(`u_lights[${t}].diffuse`),specular:g(`u_lights[${t}].specular`)})),material:{ambient:g(`u_material.ambient`),diffuse:g(`u_material.diffuse`),specular:g(`u_material.specular`),shininess:g(`u_material.shininess`)}},v={[s]:!1,[c]:!1},y={projection:t(),view:t(),model:t(),normal:new Float32Array([1,0,0,0,1,0,0,0,1])},b=new Float32Array(3),x=new Float32Array([.2,.2,.2,1]),S=Array.from({length:l},(e,t)=>({enabled:!1,position:new Float32Array([0,0,1,0]),ambient:new Float32Array([0,0,0,1]),diffuse:new Float32Array(t===0?[1,1,1,1]:[0,0,0,1]),specular:new Float32Array(t===0?[1,1,1,1]:[0,0,0,1])})),C={ambient:new Float32Array([.2,.2,.2,1]),diffuse:new Float32Array([.8,.8,.8,1]),specular:new Float32Array([0,0,0,1]),shininess:0},w=new Set([`projection`,`view`,`model`,`normal`,`eye`,`switches`,`globalAmbient`,`lights`,`material`]);e.vertexAttrib4f(o.COLOR,1,1,1,1),e.vertexAttrib3f(o.NORMAL,0,0,1);let T=new Set,E=(e,t)=>{T.has(e)||(T.add(e),console.warn(`[FF] ${t}`))},D=!1,O=`FF`,k=(e,t)=>{if(m){for(let n=0;n<t.length;n++)if(!Number.isFinite(t[n])){E(`nan-${e}`,`${e} contains NaN or Infinity (often a zero-length vector normalized, e.g., lookAt with forward parallel to up).`);return}}},A=e=>{if(!Number.isInteger(e)||e<0||e>=l)throw RangeError(`FF: light index ${e} is outside [0, ${l}). FF v1.0 has ${l} light.`)},j=e=>{if(e===`lighting`||e===`colorMaterial`)return e;throw Error(e===`texture2D`?`FF: TEXTURE_2D arrives in FF v1.1 (week 6).`:e===`fog`?`FF: FOG arrives in FF v1.2 (week 9).`:`FF: unknown capability "${e}".`)},M=()=>{e.useProgram(h),w.size!==0&&(w.has(`projection`)&&e.uniformMatrix4fv(_.projection,!1,y.projection),w.has(`view`)&&e.uniformMatrix4fv(_.view,!1,y.view),w.has(`model`)&&e.uniformMatrix4fv(_.model,!1,y.model),w.has(`normal`)&&e.uniformMatrix3fv(_.normalMatrix,!1,y.normal),w.has(`eye`)&&e.uniform3fv(_.eyePosition,b),w.has(`switches`)&&(e.uniform1i(_.lighting,+!!v.lighting),e.uniform1i(_.colorMaterial,+!!v.colorMaterial)),w.has(`globalAmbient`)&&e.uniform4fv(_.globalAmbient,x),w.has(`lights`)&&S.forEach((t,n)=>{e.uniform1i(_.lights[n].enabled,+!!t.enabled),e.uniform4fv(_.lights[n].position,t.position),e.uniform4fv(_.lights[n].ambient,t.ambient),e.uniform4fv(_.lights[n].diffuse,t.diffuse),e.uniform4fv(_.lights[n].specular,t.specular)}),w.has(`material`)&&(e.uniform4fv(_.material.ambient,C.ambient),e.uniform4fv(_.material.diffuse,C.diffuse),e.uniform4fv(_.material.specular,C.specular),e.uniform1f(_.material.shininess,C.shininess)),w=new Set)},N=()=>{m&&(e.getVertexAttrib(o.POSITION,e.VERTEX_ATTRIB_ARRAY_ENABLED)||E(`no-position`,`No position data bound: did you bind your VAO?`),v.lighting&&(S.some(e=>e.enabled)||E(`no-light`,`Lighting is on but every light is disabled; only global ambient will show.`),D&&E(`stale-normal`,`Normal matrix may be stale: the model matrix changed but setNormalMatrix was not called (lecture 2B/9A).`),!v.colorMaterial&&e.getVertexAttrib(o.COLOR,e.VERTEX_ATTRIB_ARRAY_ENABLED)&&E(`color-ignored`,`Vertex colors are ignored under lighting unless COLOR_MATERIAL is enabled.`)))},P=()=>{if(!m)return;let t=e.getError();if(t===e.NO_ERROR)return;let n={[e.INVALID_ENUM]:`INVALID_ENUM`,[e.INVALID_VALUE]:`INVALID_VALUE`,[e.INVALID_OPERATION]:`INVALID_OPERATION`,[e.OUT_OF_MEMORY]:`OUT_OF_MEMORY`,[e.CONTEXT_LOST_WEBGL]:`CONTEXT_LOST_WEBGL`};E(`gl-${t}-${O}`,`GL error ${n[t]??t} after ${O}.`)};return{version:a,maxLights:l,program:h,enable(e){v[j(e)]=!0,w.add(`switches`)},disable(e){v[j(e)]=!1,w.add(`switches`)},isEnabled(e){return v[j(e)]},setColor(t){let n=u(t);e.vertexAttrib4f(o.COLOR,n[0],n[1],n[2],n[3])},setNormal(t){e.vertexAttrib3f(o.NORMAL,t[0],t[1],t[2])},setProjectionMatrix(e){k(`projection matrix`,e),y.projection.set(e),w.add(`projection`)},setViewMatrix(e){k(`view matrix`,e),y.view.set(e);let r=n(t(),y.view);r?b.set([r[12],r[13],r[14]]):E(`view-singular`,`View matrix is not invertible; the eye position was not updated.`),w.add(`view`).add(`eye`)},setModelMatrix(e){k(`model matrix`,e),y.model.set(e),D=!0,w.add(`model`)},setNormalMatrix(e){k(`normal matrix`,e),y.normal.set(e),D=!1,w.add(`normal`)},setGlobalAmbient(e){x.set(u(e)),w.add(`globalAmbient`)},setLight(e,t){A(e);let n=t;if([`constantAttenuation`,`linearAttenuation`,`quadraticAttenuation`,`spotDirection`,`spotCutoff`,`spotExponent`].some(e=>n[e]!==void 0)||t.position&&t.position[3]!==0)throw Error(`FF: positional and spot lights arrive in FF v1.2 (week 9). Use a directional light (position w = 0).`);let r=S[e];t.position&&r.position.set(t.position),t.ambient&&r.ambient.set(u(t.ambient)),t.diffuse&&r.diffuse.set(u(t.diffuse)),t.specular&&r.specular.set(u(t.specular)),w.add(`lights`)},enableLight(e){A(e),S[e].enabled=!0,w.add(`lights`)},disableLight(e){A(e),S[e].enabled=!1,w.add(`lights`)},setMaterial(e){if(e.emissive!==void 0)throw Error(`FF: emissive arrives in FF v1.1 (week 6).`);if(e.shininess!==void 0&&!(e.shininess>=0&&e.shininess<=128))throw RangeError(`FF: shininess ${e.shininess} is outside [0, 128].`);e.ambient&&C.ambient.set(u(e.ambient)),e.diffuse&&C.diffuse.set(u(e.diffuse)),e.specular&&C.specular.set(u(e.specular)),e.shininess!==void 0&&(C.shininess=e.shininess),w.add(`material`)},flush:M,drawArrays(t,n,r){O=`drawArrays`,M(),N(),e.drawArrays(t,n,r),P()},drawElements(t,n,r,i){O=`drawElements`,M(),N(),e.drawElements(t,n,r,i),P()},getState(){let e=e=>Object.freeze(Array.from(e));return Object.freeze({version:a,capabilities:Object.freeze({...v}),matrices:Object.freeze({projection:e(y.projection),view:e(y.view),model:e(y.model),normal:e(y.normal)}),eyePosition:e(b),globalAmbient:e(x),lights:Object.freeze(S.map(t=>Object.freeze({enabled:t.enabled,position:e(t.position),ambient:e(t.ambient),diffuse:e(t.diffuse),specular:e(t.specular)}))),material:Object.freeze({ambient:e(C.ambient),diffuse:e(C.diffuse),specular:e(C.specular),shininess:C.shininess})})}}}var m=[27/255,30/255,43/255,1];new Float32Array([0,.7,0,1,0,0,1,-.7,-.6,0,0,1,0,1,.7,-.6,0,0,0,1,1]);var h=new Float32Array([0,.7,0,-.7,-.6,0,.7,-.6,0]),g=new Float32Array([-.5,-.5,0,.5,-.5,0,.5,.5,0,-.5,.5,0]),_=new Uint16Array([0,1,2,0,2,3]);function v(e,t){let n=new Float32Array((e+2)*3);for(let r=0;r<=e;r++){let i=r/e*2*Math.PI;n[(r+1)*3]=t*Math.cos(i),n[(r+1)*3+1]=t*Math.sin(i)}return n}function y(e,t,n){let r=e.createVertexArray();e.bindVertexArray(r);let i=e.createBuffer();if(e.bindBuffer(e.ARRAY_BUFFER,i),e.bufferData(e.ARRAY_BUFFER,t,e.STATIC_DRAW),e.enableVertexAttribArray(o.POSITION),e.vertexAttribPointer(o.POSITION,3,e.FLOAT,!1,0,0),n){let t=e.createBuffer();e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t),e.bufferData(e.ELEMENT_ARRAY_BUFFER,n,e.STATIC_DRAW)}return e.bindVertexArray(null),r}function b(e,t){let n=y(e,h),r=y(e,g,_),i=y(e,v(6,.7)),a=y(e,v(64,.7));return[{name:`triángulo`,draw:()=>{e.bindVertexArray(n),t.drawArrays(e.TRIANGLES,0,3)}},{name:`cuadrado`,draw:()=>{e.bindVertexArray(r),t.drawElements(e.TRIANGLES,6,e.UNSIGNED_SHORT,0)}},{name:`hexágono`,draw:()=>{e.bindVertexArray(i),t.drawArrays(e.TRIANGLE_FAN,0,8)}},{name:`círculo`,draw:()=>{e.bindVertexArray(a),t.drawArrays(e.TRIANGLE_FAN,0,66)}}]}var x=[[1,0,0],[0,1,0],[0,0,1]],S=document.getElementById(`canvas`);S.width=480,S.height=480;var C=S.getContext(`webgl2`);if(!C)throw Error(`WebGL2 is not available.`);var w=p(C,{debug:!0});C.viewport(0,0,S.width,S.height),C.clearColor(...m);var T=b(C,w),E=0,D=0,O=()=>{C.clear(C.COLOR_BUFFER_BIT),w.setColor(x[D]),T[E].draw()};document.getElementById(`btn-shape`).addEventListener(`click`,()=>{E=(E+1)%T.length,O()}),document.getElementById(`btn-color`).addEventListener(`click`,()=>{D=(D+1)%x.length,O()}),O();