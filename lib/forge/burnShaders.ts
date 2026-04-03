/** Vertex shader — Balatro-style card burn (see CodePen plutocrat/bNeXOgy). */
export const BURN_VERTEX_SHADER = `
attribute vec2 a_pos;
attribute vec2 a_uv;
uniform float u_time;
uniform vec2 u_mouse;
varying vec2 v_uv;
varying vec2 v_sc;

void main() {
  v_uv = a_uv;
  vec2 pos = a_pos;
  pos.y += sin(u_time*0.85)*0.018;
  pos.x += cos(u_time*0.52)*0.007;
  float tx = u_mouse.y*0.2, ty = -u_mouse.x*0.16;
  vec3 p = vec3(pos,0.0);
  float cy=cos(ty),sy=sin(ty);
  p = vec3(p.x*cy+p.z*sy, p.y, -p.x*sy+p.z*cy);
  float cx=cos(tx),sx=sin(tx);
  p = vec3(p.x, p.y*cx-p.z*sx, p.y*sx+p.z*cx);
  float dz = 1.0+p.z*0.28;
  /* 1.0 — квад заполняет весь canvas (0.78 оставлял «поля» меньше карты) */
  vec2 proj = p.xy / dz;
  v_sc = proj;
  gl_Position = vec4(proj,0.0,1.0);
}
`;

/** Фрагментный шейдер — spiral dissolve + fire edge (Balatro-style) */
export const BURN_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D u_tex;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_dissolve;
uniform float u_shine;
varying vec2 v_uv;
varying vec2 v_sc;

#define PI 3.14159265359
#define TAU 6.28318530718

float hash(vec2 p){p=fract(p*vec2(127.1,311.7));p+=dot(p,p+19.31);return fract(p.x*p.y);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*vnoise(p);p=p*2.0+vec2(1.7,9.2);a*=0.5;}return v;}

float spiralField(vec2 uv, float progress) {
  vec2 c = uv - 0.5;
  float r = length(c);
  float theta = atan(c.y, c.x);
  float spiralPhase = (theta / TAU + 0.5) + r * 2.2;
  spiralPhase = fract(spiralPhase);
  float n1 = fbm(uv*3.5 + u_time*0.25) * 0.3;
  float n2 = fbm(uv*7.0 - u_time*0.18 + vec2(4.3,1.1)) * 0.12;
  float field = r + spiralPhase*0.08 + n1 + n2;
  float thresh = 0.95*(1.0-progress);
  return field - thresh;
}

void main() {
  vec2 uv = v_uv;
  float wave = 0.0012*sin(uv.y*15.0+u_time*2.1)+0.0008*cos(uv.x*11.0+u_time*1.9);
  vec4 card = texture2D(u_tex, clamp(uv+vec2(wave), 0.001, 0.999));
  vec3 col = card.rgb;
  vec2 vc = uv-0.5;
  /* Виньетка только во время горения — кадр с u_dissolve=0 совпадает с фото под слоем */
  col *= mix(1.0, 1.0 - dot(vc, vc) * 0.5, smoothstep(0.0, 0.05, u_dissolve));
  float alpha = card.a;

  if (u_dissolve > 0.001) {
    float d = spiralField(uv, u_dissolve);
    float ew = 0.055;
    float ew2 = 0.18;
    float fn = fbm(uv*7.0 + vec2(u_time*1.4, -u_time*0.9));
    float fn2 = vnoise(uv*20.0 + u_time*3.0);
    vec3 hotWhite = vec3(1.00, 0.98, 0.90);
    vec3 orange = vec3(1.00, 0.55, 0.05);
    vec3 deepOrange= vec3(0.95, 0.22, 0.0);
    vec3 charcoal = vec3(0.30, 0.08, 0.0);
    vec3 fireCol = mix(deepOrange, orange, smoothstep(0.2,0.7,fn));
    fireCol = mix(fireCol, hotWhite, smoothstep(0.6,0.95,fn));
    float outerBloom = smoothstep(ew2, 0.0, d + ew2) * (1.0 - smoothstep(-ew*0.5, 0.0, d));
    col += mix(charcoal, deepOrange, fn*0.6) * outerBloom * 2.0;
    float edgeBand = smoothstep(-ew,0.0,d) * (1.0-smoothstep(0.0,ew,d));
    col = mix(col, fireCol*1.6, edgeBand*0.85);
    float coreBand = smoothstep(-ew*0.35,0.0,d)*(1.0-smoothstep(0.0,ew*0.5,d));
    col = mix(col, hotWhite*2.2, coreBand*0.75);
    float sparkMask = edgeBand * step(0.74, fn2) * step(0.6, fn);
    col += hotWhite * sparkMask * 4.0;
    float burned = smoothstep(-0.004, 0.018, d);
    alpha *= (1.0-burned) * card.a;
  }

  if (u_shine > 0.001 && u_shine < 0.999) {
    float sd = (uv.x*0.55+uv.y*0.45) - (u_shine*1.5-0.25);
    float shine = exp(-sd*sd*220.0) * 1.4;
    col += vec3(1.0, 0.95, 0.82) * shine;
  }
  gl_FragColor = vec4(col, alpha);
}
`;
