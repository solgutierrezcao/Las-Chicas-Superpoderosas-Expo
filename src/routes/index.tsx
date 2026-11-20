import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Volume2, Zap } from "lucide-react";
import { mountGame } from "@/game/mount";

export const Route = createFileRoute("/")({ component: Home });

function hold(code: number, down: boolean) {
  window.__hold?.(code, down);
}

function PadButton({
  label,
  code,
  tone,
  children,
}: {
  label: string;
  code: number;
  tone: "ink" | "rose" | "leaf";
  children: ReactNode;
}) {
  const toneClass =
    tone === "rose"
      ? "bg-rose text-card"
      : tone === "leaf"
        ? "bg-leaf text-card"
        : "bg-ink text-card";
  return (
    <button
      type="button"
      aria-label={label}
      className={`pad flex h-14 min-w-14 flex-1 items-center justify-center gap-2 rounded-2xl text-base font-extrabold shadow-none ${toneClass}`}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        hold(code, true);
      }}
      onPointerUp={() => hold(code, false)}
      onPointerCancel={() => hold(code, false)}
    >
      {children}
    </button>
  );
}

function elegir(i: number) {
  const juego = window.G;
  if (!juego) return;
  juego.sel = i;
  juego.key(13);
}

function elegirPersonaje(i: number) {
  window.G?.jugarCon(i);
}

function Home() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState("boot");

  useEffect(() => {
    const host = document.getElementById("juego-contenedor");
    if (!host) return;
    let alive = true;
    mountGame(host)
      .then(() => {
        if (!alive) return;
        const canvas = host.querySelector("canvas") || document.querySelector("canvas");
        if (canvas && canvas.parentElement !== host) host.appendChild(canvas);
        setReady(true);
      })
      .catch(() => {
        if (alive) setError("No se pudo abrir el juego. Recargá la página.");
      });
    const clear = () => window.__controlsTest?.setKeys([]);
    const watch = window.setInterval(() => {
      const st = window.G?.st;
      if (st) setScreen((prev) => (prev === st ? prev : st));
    }, 150);
    window.addEventListener("blur", clear);
    return () => {
      alive = false;
      window.clearInterval(watch);
      window.removeEventListener("blur", clear);
      clear();
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 px-4 py-4 pb-10">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-sm font-semibold tracking-wide text-rose">Ciudad Brillo</p>
          <h1 className="font-display text-3xl font-bold leading-none text-ink">Juárez y Gareis</h1>
        </div>
        <div className="flex items-center gap-2">
          {screen !== "title" && screen !== "boot" && (
            <button
              type="button"
              aria-label="Volver al menú"
              className="flex h-11 items-center gap-1 rounded-full border border-line bg-card px-3 text-sm font-extrabold text-ink"
              onClick={() => window.G?.key(27)}
            >
              <ChevronLeft className="size-5" aria-hidden />
              Menú
            </button>
          )}
          <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-full border border-line bg-card px-4 text-sm font-extrabold text-ink"
            onClick={() => window.music?.toggle()}
          >
            <Volume2 className="size-4" aria-hidden />
            Sonido
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-card border border-line bg-ink shadow-sm">
        <div id="juego-contenedor" className="aspect-game" />
        {screen === "title" && (
          <div className="absolute inset-0 z-10">
            {["Jugar ahora", "Cómo jugar", "Créditos"].map((nombre, i) => (
              <button
                key={nombre}
                type="button"
                aria-label={nombre}
                className="absolute border-0 bg-transparent p-0"
                style={{
                  left: "25%",
                  width: "50%",
                  top: `${((74 + i * 22) / 192) * 100}%`,
                  height: `${(22 / 192) * 100}%`,
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  elegir(i);
                }}
              />
            ))}
          </div>
        )}
        {screen === "select" && (
          <div className="absolute inset-0 z-10">
            {["Juárez", "Gareis", "Ferraro"].map((nombre, i) => (
              <button
                key={nombre}
                type="button"
                aria-label={nombre}
                className="absolute border-0 bg-transparent p-0"
                style={{
                  left: `${((8 + i * 104) / 320) * 100}%`,
                  width: `${(100 / 320) * 100}%`,
                  top: "18%",
                  height: "64%",
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  elegirPersonaje(i);
                }}
              />
            ))}
          </div>
        )}
        {screen === "gameover" && (
          <>
            <button
              type="button"
              aria-label="Reintentar"
              className="absolute z-10 border-0 bg-transparent p-0"
              style={{ left: "18%", width: "64%", top: "46%", height: "12%" }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.G?.key(13);
              }}
            />
            <button
              type="button"
              aria-label="Menú principal"
              className="absolute z-10 border-0 bg-transparent p-0"
              style={{ left: "18%", width: "64%", top: "59%", height: "14%" }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.G?.key(27);
              }}
            />
          </>
        )}
        {["instr", "credits", "clear", "win"].includes(screen) && (
          <button
            type="button"
            aria-label="Continuar"
            className="absolute inset-0 z-10 border-0 bg-transparent p-0"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.G?.key(13);
            }}
          />
        )}
        {!ready && !error && (
          <div className="absolute inset-0 z-20 grid place-items-center font-display text-lg text-card">Cargando…</div>
        )}
        {error && (
          <div className="absolute inset-0 z-20 grid place-items-center px-6 text-center text-card">{error}</div>
        )}
      </section>

      {screen !== "play" && (
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Juárez", "bg-rose"],
            ["Gareis", "bg-leaf"],
            ["Ferraro", "bg-[#2f8fd4]"],
          ].map(([nombre, tono], i) => (
            <button
              key={nombre}
              type="button"
              className={`h-12 rounded-2xl text-sm font-extrabold text-card ${tono}`}
              onClick={() => elegirPersonaje(i)}
            >
              {nombre}
            </button>
          ))}
        </div>
      )}

      <section className="pad flex flex-col gap-3" aria-label="Controles táctiles">
        <div className="flex gap-3">
          <PadButton label="Izquierda" code={37} tone="ink">
            <ChevronLeft className="size-7" aria-hidden />
          </PadButton>
          <PadButton label="Derecha" code={39} tone="ink">
            <ChevronRight className="size-7" aria-hidden />
          </PadButton>
        </div>
        <div className="flex gap-3">
          <PadButton label="Saltar y volar" code={32} tone="rose">
            Saltar
          </PadButton>
          <PadButton label="Disparar" code={88} tone="leaf">
            <Zap className="size-5" aria-hidden />
            Rayo
          </PadButton>
        </div>
        <p className="text-center text-sm font-bold text-muted">
          En el teclado: A y D, flechas, espacio para saltar, X para el rayo, P pausa.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="overflow-hidden rounded-card border border-line bg-card">
          <div className="grid place-items-end bg-rose-soft px-3 pt-3">
            <img src="/game/juarez.png" alt="Juárez, con lazo rojo y vestido rosa" className="h-56 w-auto object-contain" />
          </div>
          <div className="flex flex-col gap-1 px-4 py-4">
            <p className="text-xs font-extrabold tracking-wide text-rose">LA LÍDER</p>
            <h2 className="font-display text-2xl font-bold text-ink">Juárez</h2>
            <p className="text-sm font-bold leading-snug text-muted">
              Equilibrada. Salta, vuela y dispara parejo. Es quien toma el lugar de la líder del equipo.
            </p>
            <button
              type="button"
              className="mt-2 h-11 rounded-2xl bg-rose text-sm font-extrabold text-card"
              onClick={() => elegirPersonaje(0)}
            >
              Jugar con Juárez
            </button>
          </div>
        </article>
        <article className="overflow-hidden rounded-card border border-line bg-card">
          <div className="grid place-items-end bg-leaf-soft px-3 pt-3">
            <img
              src="/game/gareis.png"
              alt="Gareis, con anteojos, rizos y vestido verde"
              className="h-56 w-auto object-contain"
            />
          </div>
          <div className="flex flex-col gap-1 px-4 py-4">
            <p className="text-xs font-extrabold tracking-wide text-leaf">EL FUERTE</p>
            <h2 className="font-display text-2xl font-bold text-ink">Gareis</h2>
            <p className="text-sm font-bold leading-snug text-muted">
              Pega el doble. Anteojos, rizos y brazos de más. Entra en el lugar del verde del equipo.
            </p>
            <button
              type="button"
              className="mt-2 h-11 rounded-2xl bg-leaf text-sm font-extrabold text-card"
              onClick={() => elegirPersonaje(1)}
            >
              Jugar con Gareis
            </button>
          </div>
        </article>
        <article className="overflow-hidden rounded-card border border-line bg-card sm:col-span-2">
          <div className="grid place-items-end bg-[#dff3ff] px-3 pt-3">
            <img
              src="/game/ferraro.png"
              alt="Ferraro, con anteojos y vestido azul"
              className="h-56 w-auto object-contain"
            />
          </div>
          <div className="flex flex-col gap-1 px-4 py-4">
            <p className="text-xs font-extrabold tracking-wide text-[#2f8fd4]">LA QUE VUELA</p>
            <h2 className="font-display text-2xl font-bold text-ink">Ferraro</h2>
            <p className="text-sm font-bold leading-snug text-muted">
              Anteojos y vestido azul. Salta más alto y vuela más lejos. Entra en el lugar de la azul del equipo.
            </p>
            <button
              type="button"
              className="mt-2 h-11 rounded-2xl bg-[#2f8fd4] text-sm font-extrabold text-card"
              onClick={() => elegirPersonaje(2)}
            >
              Jugar con Ferraro
            </button>
          </div>
        </article>
      </section>

      <p className="text-center text-sm font-bold text-muted">Elegilos en Jugar ahora.</p>
    </main>
  );
}
