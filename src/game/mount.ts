declare global {
  interface Window {
    p5?: new () => unknown;
    __hold?: (code: number, down: boolean) => void;
    __controlsTest?: {
      getX: () => number;
      getVx: () => number;
      getState: () => string;
      setKeys: (codes: string[]) => void;
      confirm: () => void;
    };
    music?: { toggle: () => void; on: boolean };
    G?: {
      st: string;
      paused: boolean;
      ci: number;
      sel: number;
      key: (k: number) => void;
      jugarCon: (i: number) => void;
    };
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const prev = document.querySelector(`script[data-src="${src}"]`);
    if (prev) {
      if (prev.getAttribute("data-loaded") === "1") resolve();
      else prev.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.dataset.src = src;
    s.onload = () => {
      s.dataset.loaded = "1";
      resolve();
    };
    s.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.body.appendChild(s);
  });
}

let boot: Promise<void> | null = null;

async function start() {
  await loadScript("/vendor/p5.min.js");
  await new Promise((r) => setTimeout(r, 0));
  await loadScript("/vendor/p5.sound.min.js");
  await loadScript("/game/sketch.js");
  if (!document.querySelector("#juego-contenedor canvas")) {
    if (typeof window.p5 !== "function") throw new Error("p5 no arrancó");
    new window.p5();
  }
}

function keepGameCanvas() {
  const box = document.getElementById("juego-contenedor");
  if (!box || !box.isConnected) return;
  const canvas = box.querySelector("canvas") || document.querySelector("canvas");
  if (canvas && canvas.parentElement !== box) box.appendChild(canvas);
  document.querySelectorAll("canvas").forEach((c) => {
    if (!box.contains(c)) c.remove();
  });
}

export function mountGame(host: HTMLElement) {
  if (!boot) boot = start();
  return boot.then(() => {
    keepGameCanvas();
    window.setTimeout(keepGameCanvas, 0);
    window.setTimeout(keepGameCanvas, 400);
    if (host.isConnected && !host.querySelector("canvas")) keepGameCanvas();
  });
}
