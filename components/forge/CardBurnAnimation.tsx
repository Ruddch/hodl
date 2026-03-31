"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BURN_FRAGMENT_SHADER, BURN_VERTEX_SHADER } from "@/lib/forge/burnShaders";
import { loadImageForCanvas } from "@/lib/loadImageForCanvas";

type ParticleEmber = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  hue: number;
};

type ParticleSmoke = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  op: number;
};

function mkShader(gl: WebGLRenderingContext, src: string, type: number): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("shader compile:", gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

interface CardBurnAnimationProps {
  imageUrl: string;
  /** Старт анимации при переходе в true */
  active: boolean;
  onComplete: () => void;
  className?: string;
  /**
   * Режим оверлея: абсолютное позиционирование поверх уже отрисованной карты,
   * без собственного aspect-ratio (размер задаёт родитель).
   */
  overlay?: boolean;
  /**
   * Вызывается в тот же кадр, когда текстура загружена и canvas готов к показу
   * (перед opacity 100). Родитель может скрыть статичную карту без «дыры» до анимации.
   */
  onBurnVisualReady?: () => void;
  /** Один bust с предзагрузкой на forge — тот же URL и кэш */
  imageCacheBust?: string | number;
}

/**
 * WebGL dissolve + 2D embers/smoke — логика из https://codepen.io/plutocrat/pen/bNeXOgy
 * (без фонового Balatro canvas и без Tone.js)
 */
export function CardBurnAnimation({
  imageUrl,
  active,
  onComplete,
  className = "",
  overlay = false,
  onBurnVisualReady,
  imageCacheBust,
}: CardBurnAnimationProps) {
  const [canvasVisible, setCanvasVisible] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const pCanvasRef = useRef<HTMLCanvasElement>(null);

  const glRef = useRef<WebGLRenderingContext | null>(null);
  const progRef = useRef<WebGLProgram | null>(null);
  const uRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const texRef = useRef<WebGLTexture | null>(null);
  const textureReadyRef = useRef(false);

  const mouseRef = useRef({ x: 0, y: 0 });
  const dissolveRef = useRef(0);
  const burningRef = useRef(false);
  const burnTimerRef = useRef(0);
  const doShineRef = useRef(false);
  const shineProgRef = useRef(0);
  const t0Ref = useRef(0);
  const lastNowRef = useRef(0);
  const lastEmberRef = useRef(0);
  const completedRef = useRef(false);

  const embersRef = useRef<ParticleEmber[]>([]);
  const smokeRef = useRef<ParticleSmoke[]>([]);
  const rafRef = useRef<number>(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onBurnVisualReadyRef = useRef(onBurnVisualReady);
  onBurnVisualReadyRef.current = onBurnVisualReady;

  /** Инициализация WebGL один раз */
  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    if (!glCanvas) return;
    const gl = glCanvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;
    const glWeb = gl;
    glRef.current = glWeb;

    const vs = mkShader(glWeb, BURN_VERTEX_SHADER, glWeb.VERTEX_SHADER);
    const fs = mkShader(glWeb, BURN_FRAGMENT_SHADER, glWeb.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const prog = glWeb.createProgram();
    if (!prog) return;
    glWeb.attachShader(prog, vs);
    glWeb.attachShader(prog, fs);
    glWeb.linkProgram(prog);
    if (!glWeb.getProgramParameter(prog, glWeb.LINK_STATUS)) {
      console.error(glWeb.getProgramInfoLog(prog));
      return;
    }
    glWeb.useProgram(prog);
    progRef.current = prog;

    const QUAD_POS = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]);
    const QUAD_UV = new Float32Array([0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1]);

    function bindBuf(data: Float32Array, attr: string) {
      const buf = glWeb.createBuffer();
      glWeb.bindBuffer(glWeb.ARRAY_BUFFER, buf);
      glWeb.bufferData(glWeb.ARRAY_BUFFER, data, glWeb.STATIC_DRAW);
      const loc = glWeb.getAttribLocation(prog, attr);
      glWeb.enableVertexAttribArray(loc);
      glWeb.vertexAttribPointer(loc, 2, glWeb.FLOAT, false, 0, 0);
    }
    bindBuf(QUAD_POS, "a_pos");
    bindBuf(QUAD_UV, "a_uv");

    const U: Record<string, WebGLUniformLocation | null> = {};
    for (const n of ["u_time", "u_mouse", "u_tex", "u_dissolve", "u_shine"]) {
      U[n] = glWeb.getUniformLocation(prog, n);
    }
    uRef.current = U;
    glWeb.uniform1i(U.u_tex!, 0);
    glWeb.uniform2f(U.u_mouse!, 0, 0);
    glWeb.uniform1f(U.u_dissolve!, 0);
    glWeb.uniform1f(U.u_shine!, 0);

    const tex = glWeb.createTexture();
    texRef.current = tex;
    textureReadyRef.current = false;
    setCanvasVisible(false);

    const uploadHtmlImage = (img: HTMLImageElement) => {
      glWeb.activeTexture(glWeb.TEXTURE0);
      glWeb.bindTexture(glWeb.TEXTURE_2D, tex);
      glWeb.pixelStorei(glWeb.UNPACK_FLIP_Y_WEBGL, true);
      glWeb.texImage2D(glWeb.TEXTURE_2D, 0, glWeb.RGBA, glWeb.RGBA, glWeb.UNSIGNED_BYTE, img);
      glWeb.texParameteri(glWeb.TEXTURE_2D, glWeb.TEXTURE_WRAP_S, glWeb.CLAMP_TO_EDGE);
      glWeb.texParameteri(glWeb.TEXTURE_2D, glWeb.TEXTURE_WRAP_T, glWeb.CLAMP_TO_EDGE);
      glWeb.texParameteri(glWeb.TEXTURE_2D, glWeb.TEXTURE_MIN_FILTER, glWeb.LINEAR);
      glWeb.texParameteri(glWeb.TEXTURE_2D, glWeb.TEXTURE_MAG_FILTER, glWeb.LINEAR);
    };

    const syncCanvasSizeToWrap = () => {
      const wrap = wrapRef.current;
      const glC = glCanvasRef.current;
      const pC = pCanvasRef.current;
      if (!wrap || !glC || !pC) return;
      const w = Math.max(1, Math.floor(wrap.clientWidth));
      const h = Math.max(1, Math.floor(wrap.clientHeight));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      glC.width = Math.floor(w * dpr);
      glC.height = Math.floor(h * dpr);
      glC.style.width = `${w}px`;
      glC.style.height = `${h}px`;
      pC.width = w;
      pC.height = h;
      pC.style.width = `${w}px`;
      pC.style.height = `${h}px`;
    };

    const applyFallbackTexture = () => {
      const fb = new Uint8Array([245, 238, 230, 255]);
      glWeb.activeTexture(glWeb.TEXTURE0);
      glWeb.bindTexture(glWeb.TEXTURE_2D, tex);
      glWeb.texImage2D(glWeb.TEXTURE_2D, 0, glWeb.RGBA, 1, 1, 0, glWeb.RGBA, glWeb.UNSIGNED_BYTE, fb);
    };

    let cancelled = false;

    const finishTextureReady = () => {
      textureReadyRef.current = true;
      requestAnimationFrame(() => {
        if (cancelled) return;
        syncCanvasSizeToWrap();
        onBurnVisualReadyRef.current?.();
        setCanvasVisible(true);
      });
    };

    (async () => {
      try {
        const img = await loadImageForCanvas(imageUrl, {
          bust: imageCacheBust ?? Date.now(),
        });
        if (cancelled) return;
        uploadHtmlImage(img);
        finishTextureReady();
      } catch {
        if (cancelled) return;
        applyFallbackTexture();
        textureReadyRef.current = true;
        requestAnimationFrame(() => {
          if (cancelled) return;
          syncCanvasSizeToWrap();
          onBurnVisualReadyRef.current?.();
          setCanvasVisible(true);
        });
      }
    })();

    t0Ref.current = performance.now();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      glWeb.deleteProgram(prog);
      glWeb.deleteShader(vs);
      glWeb.deleteShader(fs);
      if (tex) glWeb.deleteTexture(tex);
    };
  }, [imageUrl, imageCacheBust]);

  const resizeCanvases = useCallback(() => {
    const wrap = wrapRef.current;
    const glCanvas = glCanvasRef.current;
    const pCanvas = pCanvasRef.current;
    if (!wrap || !glCanvas || !pCanvas) return;
    const w = Math.max(1, Math.floor(wrap.clientWidth));
    const h = Math.max(1, Math.floor(wrap.clientHeight));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    glCanvas.width = Math.floor(w * dpr);
    glCanvas.height = Math.floor(h * dpr);
    glCanvas.style.width = `${w}px`;
    glCanvas.style.height = `${h}px`;
    pCanvas.width = w;
    pCanvas.height = h;
    pCanvas.style.width = `${w}px`;
    pCanvas.style.height = `${h}px`;
  }, []);

  useEffect(() => {
    resizeCanvases();
    const ro = new ResizeObserver(() => resizeCanvases());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [resizeCanvases]);

  const emitEmbers = useCallback(() => {
    const glCanvas = glCanvasRef.current;
    const pCanvas = pCanvasRef.current;
    const embers = embersRef.current;
    const smoke = smokeRef.current;
    if (!glCanvas || !pCanvas) return;
    const r = glCanvas.getBoundingClientRect();
    const cx = r.left + r.width * 0.5;
    const cy = r.top + r.height * 0.5;
    const angle = Math.random() * Math.PI * 2;
    const rad = (0.15 + Math.random() * 0.5) * r.width * 0.5;
    const ex = cx + Math.cos(angle) * rad;
    const ey = cy + Math.sin(angle) * rad * (r.height / Math.max(r.width, 1));
    for (let i = 0; i < 2 + Math.floor(Math.random() * 4); i++) {
      const a2 = angle + (Math.random() - 0.5) * 1.5;
      const spd = 1.5 + Math.random() * 3;
      embers.push({
        x: ex,
        y: ey,
        vx: Math.cos(a2) * spd,
        vy: Math.sin(a2) * spd - 1.8,
        life: 1,
        decay: 0.02 + Math.random() * 0.025,
        size: 1.5 + Math.random() * 2.5,
        hue: 15 + Math.random() * 35,
      });
    }
    if (Math.random() < 0.12) {
      smoke.push({
        x: ex + (Math.random() - 0.5) * 25,
        y: ey,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(0.4 + Math.random() * 0.9),
        life: 1,
        decay: 0.004 + Math.random() * 0.004,
        size: 12 + Math.random() * 30,
        op: 0.04 + Math.random() * 0.055,
      });
    }
  }, []);

  const drawParticles = useCallback(() => {
    const pCanvas = pCanvasRef.current;
    if (!pCanvas) return;
    const pCtx = pCanvas.getContext("2d");
    if (!pCtx) return;
    const embers = embersRef.current;
    const smoke = smokeRef.current;
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const ox = r.left;
    const oy = r.top;

    for (let i = smoke.length - 1; i >= 0; i--) {
      const s = smoke[i];
      s.x += s.vx;
      s.y += s.vy;
      s.size += 0.6;
      s.life -= s.decay;
      if (s.life <= 0) {
        smoke.splice(i, 1);
        continue;
      }
      const lx = s.x - ox;
      const ly = s.y - oy;
      const g = pCtx.createRadialGradient(lx, ly, 0, lx, ly, s.size);
      const a = s.op * s.life;
      g.addColorStop(0, `rgba(100,40,0,${a})`);
      g.addColorStop(0.6, `rgba(40,15,0,${a * 0.3})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      pCtx.fillStyle = g;
      pCtx.beginPath();
      pCtx.arc(lx, ly, s.size, 0, Math.PI * 2);
      pCtx.fill();
    }
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i];
      e.x += e.vx;
      e.y += e.vy;
      e.vy += 0.07;
      e.vx *= 0.98;
      e.life -= e.decay;
      if (e.life <= 0) {
        embers.splice(i, 1);
        continue;
      }
      const lx = e.x - ox;
      const ly = e.y - oy;
      const flk = 0.65 + 0.35 * Math.random();
      pCtx.save();
      pCtx.globalAlpha = e.life * flk;
      const g = pCtx.createRadialGradient(lx, ly, 0, lx, ly, e.size * 3);
      g.addColorStop(0, `hsl(${e.hue + 25},100%,92%)`);
      g.addColorStop(0.35, `hsl(${e.hue},100%,60%)`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      pCtx.fillStyle = g;
      pCtx.beginPath();
      pCtx.arc(lx, ly, e.size * 3, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.fillStyle = `hsl(${e.hue + 40},100%,96%)`;
      pCtx.beginPath();
      pCtx.arc(lx, ly, e.size * 0.25, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.restore();
    }
  }, []);

  useEffect(() => {
    if (!active) {
      burningRef.current = false;
      burnTimerRef.current = 0;
      dissolveRef.current = 0;
      completedRef.current = false;
      embersRef.current = [];
      smokeRef.current = [];
      setCanvasVisible(false);
      return;
    }

    completedRef.current = false;
    burningRef.current = true;
    burnTimerRef.current = 0;
    dissolveRef.current = 0;
    lastNowRef.current = performance.now();
    lastEmberRef.current = 0;

    const glCanvas = glCanvasRef.current;
    if (glCanvas) {
      glCanvas.classList.add("is-burning");
    }

    lastNowRef.current = performance.now();

    const loop = (now: number) => {
      if (!active) return;

      const gl = glRef.current;
      const prog = progRef.current;
      const U = uRef.current;
      const glCanvas = glCanvasRef.current;
      if (!gl || !prog || !glCanvas || !textureReadyRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min((now - lastNowRef.current) * 0.001, 0.05);
      lastNowRef.current = now;
      const t = (now - t0Ref.current) * 0.001;

      if (burningRef.current) {
        burnTimerRef.current += dt;
        const raw = Math.min(burnTimerRef.current / 3.5, 1.0);
        let eased: number;
        if (raw < 0.12) {
          eased = raw * raw * 3.5;
        } else if (raw < 0.75) {
          eased = 0.05 + (raw - 0.12) * 1.45;
        } else {
          const tail = (raw - 0.75) / 0.25;
          eased = 0.964 + tail * tail * 0.036;
        }
        dissolveRef.current = Math.min(eased, 1.0);
        if (dissolveRef.current >= 1.0) {
          dissolveRef.current = 1.0;
          burningRef.current = false;
        }
      }

      if (doShineRef.current) {
        shineProgRef.current += dt * 1.1;
        if (shineProgRef.current >= 1.0) {
          shineProgRef.current = 1.0;
          doShineRef.current = false;
        }
        gl.uniform1f(U.u_shine!, shineProgRef.current);
      } else {
        gl.uniform1f(U.u_shine!, 0.0);
      }

      const d = dissolveRef.current;
      if ((burningRef.current || d > 0.04) && d < 0.97 && now - lastEmberRef.current > 55) {
        lastEmberRef.current = now;
        emitEmbers();
      }

      const w = glCanvas.width;
      const h = glCanvas.height;
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(prog);
      gl.uniform1f(U.u_time!, t);
      gl.uniform2f(U.u_mouse!, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(U.u_dissolve!, dissolveRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      drawParticles();

      const finished = !burningRef.current && dissolveRef.current >= 0.999;
      if (finished && !completedRef.current) {
        completedRef.current = true;
        if (glCanvas) glCanvas.classList.remove("is-burning");
        onCompleteRef.current();
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (glCanvasRef.current) glCanvasRef.current.classList.remove("is-burning");
    };
  }, [active, emitEmbers, drawParticles]);

  const onMouseMove = (e: React.MouseEvent) => {
    const c = glCanvasRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  };

  const onMouseLeave = () => {
    mouseRef.current.x = 0;
    mouseRef.current.y = 0;
  };

  const wrapClass = overlay
    ? `pointer-events-auto absolute inset-0 z-30 overflow-hidden rounded-lg sm:rounded-xl ${className}`
    : `relative overflow-hidden rounded-lg sm:rounded-xl ${className}`;

  return (
    <div
      ref={wrapRef}
      className={wrapClass}
      style={overlay ? undefined : { aspectRatio: "567 / 889" }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <canvas
        ref={glCanvasRef}
        className={`forge-burn-gl absolute inset-0 block h-full w-full cursor-default transition-opacity duration-75 ${
          canvasVisible && active ? "opacity-100" : "opacity-0"
        }`}
      />
      <canvas
        ref={pCanvasRef}
        className={`pointer-events-none absolute inset-0 z-10 h-full w-full transition-opacity duration-75 ${
          canvasVisible && active ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
