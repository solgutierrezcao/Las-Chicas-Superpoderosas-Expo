/* =====================================================================
   LAS CHICAS SUPERPODEROSAS: AVENTURA EN SALTADILLA — EDICIÓN MODERNA
   Pegalo en editor.p5js.org (sketch.js) o usalo con un index.html local.
   Arte vectorial suave, fondos animados y UI moderna: sin imágenes externas.
   ===================================================================== */

// ---------- CONFIGURACIÓN GLOBAL ----------
console.log("¡SKETCH.JS ACTUALIZADO!");
const W = 320,
    H = 192,
    SC = 3,
    T = 16; // coordenadas del mundo; render a 960 × 576 antialias
let pg, G, music, so, env; // lienzo HD, gestor, música, sonido
let cam = 0,
    AUDIO = false; // cámara y audio disponible
const kd = (k) => keyIsDown(k); // atajo para teclas mantenidas

// Personajes: misma base, pequeña diferencia de habilidad
const CH = [
    {n: "BOMBÓN", hair: "#ff9a2e", dress: "#ff5fa8", eye: "#ff2e88", dmg: 1, jump: -6.3, fly: 45, d: "EQUILIBRADA"},
    {
        n: "BELLOTA",
        hair: "#2a2a2a",
        dress: "#3ddc4f",
        eye: "#2fb83b",
        dmg: 2,
        jump: -6.3,
        fly: 45,
        d: "GOLPEA MÁS FUERTE",
    },
    {
        n: "BURBUJA",
        hair: "#ffe14a",
        dress: "#4fc3ff",
        eye: "#2a8fe0",
        dmg: 1,
        jump: -6.9,
        fly: 85,
        d: "SALTA Y VUELA MÁS",
    },
];
// Temas de cada nivel (colores del cielo, capas de parallax, suelo) y nombre del jefe
const TH = [
    {
        n: "SALTADILLA CITY",
        s1: "#78DDFB",
        s2: "#FFD1E8",
        far: "#B9A5F5",
        mid: "#F18FC7",
        near: "#9B70C9",
        gt: "#FF83B9",
        gb: "#76519B",
        pl: "#FFE47A",
        boss: "ROWDYRUFF BOYS",
        st: 0,
        ec: "#FF526F",
    },
    {
        n: "LABORATORIO DEL PROFESOR",
        s1: "#A4F1FF",
        s2: "#D6C8FF",
        far: "#8CDDDC",
        mid: "#6BBFCB",
        near: "#568DAF",
        gt: "#8BF5B1",
        gb: "#477C91",
        pl: "#FFE58A",
        boss: "ÉL",
        st: 1,
        ec: "#D65BBD",
    },
    {
        n: "GUARIDA DE MOJO JOJO",
        s1: "#A77BEA",
        s2: "#F49BCB",
        far: "#754B9D",
        mid: "#59366F",
        near: "#39264F",
        gt: "#B7F46B",
        gb: "#49345F",
        pl: "#FFB85C",
        boss: "MOJO JOJO",
        st: 2,
        ec: "#FF9C45",
    },
];
// Melodías (notas MIDI, 0 = silencio) y efectos de sonido (frecuencias en secuencia)
const SONGS = [
    [72, 76, 79, 76, 74, 77, 81, 77, 72, 76, 79, 84, 83, 79, 76, 74],
    [69, 0, 72, 0, 76, 0, 72, 0, 68, 0, 71, 0, 74, 0, 71, 0],
    [57, 57, 60, 57, 63, 57, 62, 60, 56, 56, 59, 56, 62, 56, 61, 59],
];
const SFX = {
    jump: [400, 600],
    hit: [220, 140],
    coin: [988, 1319],
    boom: [90, 60, 40],
    power: [523, 659, 784, 1047],
    hurt: [200, 120],
    shoot: [800, 500],
    die: [330, 220, 110],
    ok: [660],
};

// ---------- SETUP / DRAW ----------
function setup() {
    // Configuración de resolución
    pixelDensity(1);

    // Crear UN SOLO canvas y colocarlo dentro del contenedor HTML
    const lienzo = createCanvas(W * SC, H * SC);
    lienzo.parent("juego-contenedor");

    // Accesibilidad
    lienzo.elt.setAttribute(
        "aria-label",
        "Juego de plataformas Las Chicas Superpoderosas"
    );

    // Suavizado gráfico
    smooth();

    // Crear lienzo interno para los gráficos
    pg = createGraphics(W * SC, H * SC);
    pg.pixelDensity(1);
    pg.smooth();

    // Configuración de texto
    pg.textFont("Trebuchet MS, Arial, sans-serif");
    pg.textStyle(BOLD);

    // Inicializar sonido y juego
    initAudio();
    music = new Music();
    G = new GameManager();
}

function draw() {
    G.update();
    pg.clear();
    pg.push();
    pg.scale(SC); // gráficos vectoriales a resolución 3 veces mayor, sin pixelado
    G.draw();
    pg.pop();
    image(pg, 0, 0);
}
function keyPressed() {
    if (typeof userStartAudio === "function") userStartAudio();
    G.key(keyCode);
    if ([32, 37, 38, 39, 40].includes(keyCode)) return false;
}
function mousePressed() {
    if (typeof userStartAudio === "function") userStartAudio();
    const x = mouseX / SC,
        y = mouseY / SC;
    if (x < 0 || x > W || y < 0 || y > H) return;
    if (G.st === "title") {
        for (let i = 0; i < 3; i++)
            if (x > 91 && x < 229 && y > 76 + i * 22 && y < 96 + i * 22) {
                G.sel = i;
                G.key(13);
                return;
            }
    } else if (G.st === "select") {
        for (let i = 0; i < 3; i++)
            if (x > 14 + i * 98 && x < 106 + i * 98 && y > 33 && y < 155) {
                G.ci = i;
                sfx("ok");
                return;
            }
        if (y > 159) G.key(13);
    } else if (["instr", "credits", "clear", "gameover", "win"].includes(G.st)) G.key(13);
}

// ---------- UTILIDADES ----------
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; // colisión AABB
function hs(n) {
    let s = Math.sin(n * 127.1) * 43758.5453;
    return s - Math.floor(s);
} // hash determinista
// Mueve un objeto y resuelve colisiones contra sólidos (eje X y luego eje Y)
function mv(o, S) {
    o.wall = false;
    o.x += o.vx;
    for (const s of S)
        if (s.t !== "spike" && hit(o, s)) {
            if (o.vx > 0) o.x = s.x - o.w;
            else if (o.vx < 0) o.x = s.x + s.w;
            o.wall = true;
            o.vx = 0;
        }
    o.y += o.vy;
    o.ground = false;
    for (const s of S)
        if (s.t !== "spike" && hit(o, s)) {
            if (o.vy > 0) {
                o.y = s.y - o.h;
                o.ground = true;
            } else if (o.vy < 0) o.y = s.y + s.h;
            o.vy = 0;
        }
}
// ---------- COMPONENTES GRÁFICOS MODERNOS ----------
const UI = {
    ink: "#35243D",
    white: "#FFFFFF",
    pink: "#FF72AE",
    blue: "#69D8F5",
    green: "#79E69A",
    gold: "#FFE47A",
    purple: "#A77BEA",
    cream: "#FFF5FA",
};
// Función general para dibujar textos dentro del juego
function tx(texto, x, y, tam = 8, colorTexto = "#FFFFFF", alineacion = CENTER) {
    pg.push();
    pg.textSize(tam);
    pg.textStyle(BOLD);
    pg.textAlign(alineacion, TOP);
    pg.noStroke();

    // Sombra para mejorar la lectura
    pg.fill(35, 25, 55, 110);
    pg.text(texto, x + 0.6, y + 1);

    // Texto principal
    pg.fill(colorTexto);
    pg.text(texto, x, y);

    pg.pop();
}
function ctext(s, cx, y, sz) {
    pg.push();
    pg.textSize(sz);
    pg.textStyle(BOLD);
    pg.textAlign(CENTER, TOP);
    pg.noStroke();
    pg.fill(14, 20, 51, 120);
    pg.text(s, cx + 0.7, y + 1.5);
    pg.fill("#ffffff");
    pg.text(s, cx, y);
    pg.pop();
}
function glow(x, y, radius, c, alpha = 45) {
    pg.push();
    pg.noStroke();
    const cc = color(c);
    for (let i = 4; i >= 1; i--) {
        pg.fill(red(cc), green(cc), blue(cc), alpha / (i * 1.45));
        pg.ellipse(x, y, radius * (0.4 + i * 0.25));
    }
    pg.pop();
}
function glass(x, y, w, h, r = 12, alpha = 220) {
    pg.push();
    pg.noStroke();

    // Sombra suave
    pg.fill(100, 70, 130, 25);
    pg.rect(x + 1.5, y + 2, w, h, r);

    // Panel pastel rosado y translúcido
    pg.fill(255, 239, 250, alpha);
    pg.rect(x, y, w, h, r);

    // Borde rosa claro
    pg.stroke(255, 255, 255, 220);
    pg.strokeWeight(1);
    pg.noFill();
    pg.rect(x + 0.4, y + 0.4, w - 0.8, h - 0.8, r);

    // Brillo superior
    pg.noStroke();
    pg.fill(255, 255, 255, 100);
    pg.rect(x + 7, y + 3, w - 14, 3, 2);

    pg.pop();
}
function pillButton(text, x, y, w, selected, col = UI.pink) {
    pg.push();
    pg.noStroke();

    if (selected) {
        glow(x + w / 2, y + 9, w * 0.8, col, 35);

        // Sombra
        pg.fill(120, 75, 120, 45);
        pg.rect(x, y + 2, w, 19, 10);

        // Botón seleccionado
        pg.fill(col);
        pg.rect(x, y, w, 19, 10);

        // Brillo
        pg.fill(255, 255, 255, 150);
        pg.rect(x + 7, y + 2, w - 14, 3, 2);

        pg.stroke(255, 255, 255, 220);
        pg.strokeWeight(0.8);
        pg.noFill();
        pg.rect(x, y, w, 19, 10);

    } else {
        // Botones sin seleccionar
        pg.fill(255, 255, 255, 175);
        pg.rect(x, y, w, 19, 10);

        pg.stroke(190, 140, 210, 180);
        pg.strokeWeight(0.8);
        pg.noFill();
        pg.rect(x, y, w, 19, 10);
    }

    pg.pop();

    tx(
        text,
        x + w / 2,
        y + 5,
        8,
        "#54345F",
        CENTER
    );
}
function starShape(x, y, r, inner, points = 5) {
    pg.beginShape();
    for (let a = 0; a < points * 2; a++) {
        const ang = -HALF_PI + (a * PI) / points,
            rr = a % 2 ? inner : r;
        pg.vertex(x + cos(ang) * rr, y + sin(ang) * rr);
    }
    pg.endShape(CLOSE);
}
function heartShape(x, y, scale = 1, col = "#ff6a9e") {
    pg.push();
    pg.translate(x, y);
    pg.scale(scale);
    pg.noStroke();
    pg.fill(col);
    pg.beginShape();
    pg.vertex(0, 6);
    pg.bezierVertex(-10, 0, -7, -7, 0, -3);
    pg.bezierVertex(7, -7, 10, 0, 0, 6);
    pg.endShape(CLOSE);
    pg.pop();
}
// Personajes estilo cartoon moderno: trazados vectoriales suaves, no sprites de 16px.
// Se dibujan en el mismo espacio de juego para conservar TODAS las colisiones.
function drawHero(ci, x, y, s = 1, pose = "idle", face = 1) {
    const c = CH[ci],
        bob = pose === "walk" ? sin(frameCount * 0.34) * 1.15 : 0;
    pg.push();
    pg.translate(x, y + bob);
    pg.scale(s * face, s);
    pg.stroke("#1c2340");
    pg.strokeWeight(0.8);
    pg.strokeJoin(ROUND);
    // Coletas y cabello por detrás.
    if (ci === 2) {
        pg.fill("#ffe45a");
        pg.ellipse(-11, -5, 8, 11);
        pg.ellipse(11, -5, 8, 11);
    }
    pg.fill(c.hair);
    pg.ellipse(0, -5, 23, 20);
    // Piernas y botitas.
    pg.fill("#fff");
    pg.rect(-6.2, 7, 4, 6, 2);
    pg.rect(2.2, 7, 4, 6, 2);
    pg.fill("#25263d");
    const step = pose === "walk" ? sin(frameCount * 0.34) * 1.8 : 0;
    pg.ellipse(-4.1, 12 + step, 6.5, 3.6);
    pg.ellipse(4.1, 12 - step, 6.5, 3.6);
    // Vestido y cinta negra característica.
    pg.fill(c.dress);
    pg.quad(-7, 2, 7, 2, 8.3, 9.7, -8.3, 9.7);
    pg.noStroke();
    pg.fill("#1b223b");
    pg.rect(-7.2, 6.3, 14.4, 2.2, 0.6);
    pg.stroke("#1c2340");
    pg.strokeWeight(0.8);
    // Brazos expresivos (vuelo / disparo).
    pg.fill("#ffe1c4");
    if (pose === "atk" || pose === "fly") {
        pg.ellipse(-10, 1, 7, 4);
        pg.ellipse(10, 0, 7, 4);
    } else {
        pg.ellipse(-8, 5, 5, 7);
        pg.ellipse(8, 5, 5, 7);
    }
    // Cara y ojos grandes en proporciones del dibujo animado.
    pg.fill("#ffe6cc");
    pg.ellipse(0, -5, 20.7, 16.6);
    pg.fill("#ffffff");
    pg.ellipse(-4.65, -4.4, 8.9, 10.6);
    pg.ellipse(4.65, -4.4, 8.9, 10.6);
    pg.noStroke();
    pg.fill(c.eye);
    pg.ellipse(-3.5, -4.0, 5.0, 7.2);
    pg.ellipse(5.8, -4.0, 5.0, 7.2);
    pg.fill("#20253a");
    pg.ellipse(-3.15, -3.9, 2.45, 5.2);
    pg.ellipse(5.9, -3.9, 2.45, 5.2);
    pg.fill("#ffffff");
    pg.ellipse(-3.8, -6, 1.55, 2);
    pg.ellipse(5.3, -6, 1.55, 2);
    pg.stroke("#653b45");
    pg.strokeWeight(0.7);
    pg.noFill();
    pg.arc(1, 1, 3.3, 2.4, 0, PI);
    pg.noStroke();
    // Peinados distintivos.
    if (ci === 0) {
        pg.fill(c.hair);
        pg.arc(0, -10, 22, 9, PI, TWO_PI, CHORD);
        pg.fill("#e84a72");
        pg.ellipse(-5, -15.2, 9, 6);
        pg.ellipse(4, -15.2, 9, 6);
        pg.fill("#ff8cb1");
        pg.ellipse(-0.5, -15.1, 3.5, 5);
    } else if (ci === 1) {
        pg.fill("#252437");
        pg.beginShape();
        pg.vertex(-10, -9);
        pg.vertex(-11, -15);
        pg.vertex(-5, -12);
        pg.vertex(0, -17);
        pg.vertex(5, -12);
        pg.vertex(11, -15);
        pg.vertex(10, -8);
        pg.vertex(6, -10);
        pg.vertex(-5, -10);
        pg.endShape(CLOSE);
    } else {
        pg.fill("#ffe45a");
        pg.arc(0, -10, 21.5, 9, PI, TWO_PI, CHORD);
    }
    pg.pop();
}

// ---------- AUDIO (p5.sound con osciladores: chiptune) ----------
function initAudio() {
    try {
        so = new p5.Oscillator("square");
        so.amp(0);
        so.start();
        env = new p5.Envelope();
        env.setADSR(0.005, 0.08, 0.15, 0.08);
        env.setRange(0.15, 0);
        so.amp(env);
        AUDIO = true;
    } catch (e) {
        AUDIO = false;
    }
}
function sfx(n) {
    if (!AUDIO || !music || !music.on) return;
    SFX[n].forEach((f, i) =>
        setTimeout(() => {
            so.freq(f);
            env.play();
        }, i * 70)
    );
}
class Music {
    // secuenciador simple: melodía + bajo por nivel
    constructor() {
        this.l = 0;
        this.i = 0;
        this.t = 0;
        this.on = true;
        if (AUDIO) {
            this.lead = new p5.Oscillator("square");
            this.bass = new p5.Oscillator("triangle");
            this.lead.amp(0);
            this.bass.amp(0);
            this.lead.start();
            this.bass.start();
        }
    }
    set(l) {
        this.l = l;
        this.i = 0;
    }
    toggle() {
        this.on = !this.on;
        if (AUDIO && !this.on) {
            this.lead.amp(0);
            this.bass.amp(0);
        }
    }
    tick() {
        if (!AUDIO || !this.on || ++this.t % 11) return;
        const n = SONGS[this.l],
            i = this.i++ % n.length,
            s = n[i];
        this.lead.amp(s ? 0.035 : 0, 0.02);
        if (s) this.lead.freq(midiToFreq(s));
        if (i % 4 === 0) {
            this.bass.freq(midiToFreq((n[i] || n[i + 1] || 48) - 24));
            this.bass.amp(0.07, 0.02);
        }
    }
}

// ---------- ESCENARIOS HD CON PARALLAX, ILUMINACIÓN Y PROFUNDIDAD ----------
function layer(f, col, bw, hmax, hmin, st, sd) {
    const i0 = floor((cam * f) / bw);
    for (let i = i0; i < i0 + W / bw + 3; i++) {
        const h = hmin + hs(i * sd + sd) * hmax,
            x = i * bw - cam * f,
            y = 160 - h;
        pg.noStroke();
        if (st === 0) {
            // Edificios urbanos con bordes redondeados y fachadas iluminadas.
            pg.fill(11, 16, 49, 28);
            pg.rect(x + 1.5, y + 2, bw - 6, h + 4, 4);
            pg.fill(col);
            pg.rect(x, y, bw - 6, h + 8, 4, 4, 0, 0);
            pg.fill(255, 255, 255, 28);
            pg.rect(x + 3, y + 5, 2, h - 5, 2);
            for (let wy = y + 9; wy < 159; wy += 10)
                for (let wx = x + 9; wx < x + bw - 10; wx += 9) {
                    if (hs(i * 19 + wx * 0.6 + wy * 0.7) > 0.28) {
                        pg.fill(245, 245, 255, 88);
                        pg.rect(wx, wy, 4.3, 5.6, 1.5);
                    }
                }
        } else if (st === 1) {
            pg.fill(col);
            pg.rect(x + 2, y, bw - 10, h + 12, 7, 7, 0, 0);
            pg.fill(120, 250, 230, 47);
            pg.rect(x + 6, y + 5, bw - 18, h - 2, 5);
            pg.fill(255, 255, 255, 40);
            pg.rect(x + 9, y + 8, 2, h - 10, 2);
            pg.stroke(166, 255, 240, 60);
            pg.strokeWeight(0.7);
            pg.line(x + 7, y + 19, x + bw - 13, y + 19);
            pg.noStroke();
        } else {
            pg.fill(col);
            pg.beginShape();
            pg.vertex(x, 160);
            pg.vertex(x + bw * 0.12, y + 17);
            pg.vertex(x + bw * 0.45, y);
            pg.vertex(x + bw * 0.75, y + 19);
            pg.vertex(x + bw, 160);
            pg.endShape(CLOSE);
            pg.fill(233, 108, 243, 60);
            pg.ellipse(x + bw * 0.48, y + 20, 3, 3);
        }
    }
}
function drawBG(th) {
    pg.noStroke();

    // Cielo degradado
    for (let i = 0; i < 48; i++) {
        pg.fill(lerpColor(color(th.s1), color(th.s2), i / 47));
        pg.rect(0, i * 4, W, 4.25);
    }

    const t = frameCount * 0.01;

    // Sol, laboratorio o energía de la guarida
    if (th.st === 0) {
        glow(247 - ((cam * 0.02) % 40), 29, 90, "#FFF4A8", 85);
        pg.fill("#FFF8C9");
        pg.ellipse(247 - ((cam * 0.02) % 40), 29, 29);

        pg.fill(255, 255, 255, 90);
        pg.ellipse(247 - ((cam * 0.02) % 40) - 5, 24, 7);
    } else if (th.st === 1) {
        glow(235, 38, 105, "#7CFFE0", 85);

        for (let k = 0; k < 7; k++) {
            pg.fill(125, 255, 226, 35 + k * 4);
            pg.ellipse(235, 38, 72 + 10 * k);
        }
    } else {
        glow(258, 35, 104, "#F7A4FF", 90);
        pg.fill("#FFD0FF");
        pg.ellipse(258, 35, 31);
    }

    // Nubes y partículas
    const j0 = floor((cam * 0.1) / 72);

    for (let i = j0; i < j0 + 7; i++) {
        const x = i * 72 - cam * 0.1 + sin(t + i) * 3;
        const y = 10 + hs(i + 12) * 54;

        if (th.st === 0) {
            pg.fill(255, 255, 255, 180);
            pg.ellipse(x, y, 33, 12);
            pg.ellipse(x - 8, y - 3, 14, 11);
            pg.ellipse(x + 5, y - 5, 20, 13);
        } else {
            const col = th.st === 1 ? "#83FFE5" : "#F4A6FF";
            glow(x, y, 10, col, 65);

            pg.fill(255, 255, 255, 200);
            starShape(x, y, 2.5, 1.2);
        }
    }

    // Edificios con colores más intensos
    layer(0.25, th.far, 47, 64, 37, th.st, 1);
    layer(0.49, th.mid, 39, 48, 26, th.st, 2);
    layer(0.76, th.near, 34, 35, 16, th.st, 3);

    // Bruma luminosa
    pg.fill(255, 255, 255, 24);
    pg.rect(0, 143, W, 18);

    // Pequeñas estrellas decorativas en el cielo
    for (let i = 0; i < 12; i++) {
        const x = hs(i * 13) * W;
        const y = hs(i * 29) * 85;

        pg.fill(255, 255, 255, 100 + sin(frameCount * 0.04 + i) * 70);
        starShape(x, y, 2, 0.8);
    }
}

// ---------- CLASES DEL JUEGO ----------
class Platform {
    // suelo, bloque flotante, púas o pared invisible
    constructor(x, y, w, h, t = "ground") {
        Object.assign(this, {x, y, w, h, t});
    }
    draw(th) {
        if (this.x > cam + W + 20 || this.x + this.w < cam - 20 || this.t === "wall") return;

        const x = this.x - cam;
        const y = this.y;

        pg.push();
        pg.noStroke();

        if (this.t === "spike") {
            glow(x + this.w / 2, y + 4, this.w * 1.5, "#FF719F", 55);

            pg.fill("#FFF4FA");
            pg.stroke("#D96A9D");
            pg.strokeWeight(0.6);

            for (let i = 0; i < this.w; i += 8) {
                pg.triangle(x + i, y + this.h, x + i + 4, y, x + i + 8, y + this.h);
            }

            pg.pop();
            return;
        }

        // Sombra
        pg.fill(55, 35, 75, 55);
        pg.rect(x + 1, y + 3, this.w - 1, this.h, 4);

        // Cuerpo
        pg.fill(this.t === "block" ? "#8E75BC" : th.gb);
        pg.rect(x, y, this.w, this.h, 4, 4, 1, 1);

        // Superficie superior
        pg.fill(this.t === "block" ? "#FFE58A" : th.gt);
        pg.rect(x, y, this.w, 5.8, 4);

        // Brillo
        pg.fill(255, 255, 255, 155);
        pg.rect(x + 3, y + 1.1, max(0, this.w - 6), 1.1, 1);

        // Detalles decorativos
        pg.fill(255, 255, 255, 45);
        for (let i = 8; i < this.w - 4; i += 16) {
            pg.ellipse(x + i, y + 13, 3, 3);
        }

        pg.pop();
    }
}

class Collectible {
    // 'x' = esencia Chemical X, 'star' = invencibilidad, 'heart' = vida extra
    constructor(x, y, t = "x") {
        Object.assign(this, {x, y, t, w: 10, h: 10, got: false});
    }
    draw() {
        if (this.got || this.x > cam + W || this.x < cam - 20) return;
        const x = this.x - cam + 5,
            y = this.y + 5 + sin(frameCount / 10 + this.x) * 1.7;
        pg.push();
        pg.noStroke();
        if (this.t === "x") {
            glow(x, y, 17, "#4ff3a0", 65);
            pg.fill("#37efb2");
            pg.ellipse(x, y, 11, 11);
            pg.fill("#ecfff7");
            pg.ellipse(x, y, 6.4, 6.4);
            pg.fill("#22b78e");
            pg.textAlign(CENTER, CENTER);
            pg.textSize(7);
            pg.textStyle(BOLD);
            pg.text("X", x, y);
        } else if (this.t === "star") {
            glow(x, y, 22, "#ffeb82", 85);
            pg.fill("#ffe278");
            starShape(x, y, 8, 3.8);
            pg.fill("#fff6c9");
            pg.ellipse(x - 1.3, y - 2.3, 2.3);
        } else {
            glow(x, y, 21, "#ff699e", 80);
            heartShape(x, y - 2, 1.1);
        }
        pg.pop();
    }
}

class Enemy {
    // t=0 robot patrullero, t=1 dron volador que persigue
    constructor(x, y, t, th) {
        Object.assign(this, {
            x,
            y,
            t,
            th,
            w: 12,
            h: 12,
            vx: 0,
            vy: 0,
            d: -1,
            hp: t ? 2 : 1,
            dead: false,
            ground: false,
            wall: false,
            by: y,
        });
    }
    update(L, P) {
        if (abs(this.x - P.x) > 260) return; // solo se actualiza cerca del jugador
        if (this.t === 0) {
            // patrulla: da la vuelta en paredes y bordes
            this.vy += 0.35;
            const a = this.d > 0 ? this.x + this.w + 2 : this.x - 2;
            if (this.ground && !L.solidAt(a, this.y + this.h + 2)) this.d *= -1;
            this.vx = this.d * (0.5 + this.th * 0.15);
            mv(this, L.solids);
            if (this.wall) this.d *= -1;
            if (this.y > H + 50) this.dead = true;
        } else {
            // persecución simple si el jugador está cerca
            const dx = P.x - this.x,
                dy = P.y - this.y,
                m = Math.hypot(dx, dy);
            if (m > 0.001 && m < 120) {
                this.x += (dx / m) * 0.8;
                this.y += (dy / m) * 0.8;
            } else {
                this.y = this.by + sin(frameCount / 15 + this.x) * 6;
            }
        }
    }
    draw() {
        if (this.dead || this.x > cam + W || this.x < cam - 22) return;
        const x = this.x - cam + this.w / 2,
            y = this.y + this.h / 2,
            c = TH[this.th].ec;
        pg.push();
        pg.translate(x, y);
        pg.noStroke();
        if (this.t === 0) {
            pg.fill(18, 22, 48, 45);
            pg.ellipse(0, 7, 17, 4);
            pg.fill("#394465");
            pg.rect(-5, 2, 3.4, 6, 1.5);
            pg.rect(2, 2, 3.4, 6, 1.5);
            pg.fill(c);
            pg.rect(-7, -6, 14, 12, 4);
            pg.fill("#29304d");
            pg.rect(-4, -8, 8, 2.8, 1);
            pg.fill("#fff");
            pg.ellipse(-3, -2, 4, 4.5);
            pg.ellipse(3, -2, 4, 4.5);
            pg.fill("#1c2340");
            pg.ellipse(-2.2 + this.d * 0.35, -2, 1.6, 2.3);
            pg.ellipse(3.7 + this.d * 0.35, -2, 1.6, 2.3);
            pg.fill(255, 255, 255, 55);
            pg.ellipse(-4, -4.7, 2, 1);
        } else {
            const wing = sin(frameCount * 0.35) * 2;
            glow(0, 0, 18, c, 28);
            pg.fill(183, 225, 250, 155);
            pg.ellipse(-8, wing, 8, 4);
            pg.ellipse(8, -wing, 8, 4);
            pg.fill("#f6f8ff");
            pg.ellipse(0, 0, 14, 12);
            pg.fill(c);
            pg.ellipse(0, 0, 11.5, 10);
            pg.fill("#ffffff");
            pg.ellipse(0, 0, 7.5, 4.8);
            pg.fill("#fa4271");
            pg.ellipse(0, 0, 3.2, 3.2);
        }
        pg.pop();
    }
}

class Boss {
    // t=0 Rowdyruff Boys (embestida), t=1 Él (teletransporte + abanico), t=2 Mojo Jojo (saltos + ondas + misiles)
    constructor(t, x) {
        const w = [22, 20, 30][t],
            h = [26, 24, 34][t],
            y = t === 1 ? 118 : 160 - h;
        Object.assign(this, {
            t,
            sx: x,
            x,
            y,
            by: y,
            w,
            h,
            vx: 0,
            vy: 0,
            max: [10, 14, 22][t],
            st: t === 1 ? "float" : t === 2 ? "idle" : "walk",
            tm: 0,
            inv: 0,
            face: -1,
            active: false,
            dead: false,
            ground: false,
            wall: false,
        });
        this.hp = this.max;
    }
    reset() {
        Object.assign(this, new Boss(this.t, this.sx));
    }
    hurt(d) {
        if (this.inv > 0 || this.dead) return;
        this.hp -= d;
        this.inv = 40;
        sfx("hit");
        if (this.hp <= 0) {
            this.dead = true;
            G.add(1000);
            sfx("boom");
        }
    }
    update(L, P) {
        if (!this.active || this.dead) return;
        this.tm++;
        if (this.inv > 0) this.inv--;
        const dx = P.x - this.x,
            f = dx > 0 ? 1 : -1,
            fury = this.hp < this.max / 2 ? 1.4 : 1,
            cx = this.x + this.w / 2,
            cy = this.y + this.h / 2;
        if (this.t === 0) {
            // caminar -> aviso -> embestida -> descanso (vulnerable)
            if (this.st === "walk") {
                this.vx = f * 0.7 * fury;
                this.face = f;
                if (this.ground && random() < 0.012) this.vy = -6;
                if (this.tm > 100 / fury) {
                    this.st = "warn";
                    this.tm = 0;
                    this.vx = 0;
                }
            } else if (this.st === "warn") {
                this.vx = 0;
                if (this.tm > 30) {
                    this.st = "dash";
                    this.tm = 0;
                    sfx("hurt");
                }
            } else if (this.st === "dash") {
                this.vx = this.face * 4.2 * fury;
                if (this.tm > 55 || this.wall) {
                    this.st = "rest";
                    this.tm = 0;
                    this.vx = 0;
                }
            } else if (this.tm > 50) {
                this.st = "walk";
                this.tm = 0;
            }
            this.vy += 0.35;
            mv(this, L.solids);
        } else if (this.t === 1) {
            // flota, se teletransporta y dispara abanicos apuntados
            this.face = f;
            this.y = this.by + sin(frameCount / 18) * 10;
            if (this.st === "tele") {
                if (this.tm > 25) {
                    this.x = L.ax + 30 + random(W - 90);
                    this.st = "float";
                    this.tm = 0;
                }
            } else {
                if (this.tm % floor(80 / fury) === 0) {
                    const a = atan2(P.y - cy, P.x - cx),
                        n = fury > 1 ? 5 : 3;
                    for (let i = 0; i < n; i++) L.shot(cx, cy, a + (i - (n - 1) / 2) * 0.3, 1.6, "e");
                    sfx("shoot");
                }
                if (this.tm > 170) {
                    this.st = "tele";
                    this.tm = 0;
                }
            }
        } else {
            // salta hacia el jugador, onda de choque y misiles
            this.vy += 0.35;
            this.face = f;
            if (this.st === "idle") {
                this.vx = 0;
                if (this.tm > 45 / fury) {
                    this.st = "jump";
                    this.tm = 0;
                    this.vy = -7.4;
                    this.vx = constrain(dx / 40, -2.6, 2.6);
                    sfx("jump");
                }
            } else if (this.st === "jump") {
                if (this.ground && this.tm > 5) {
                    this.st = "shoot";
                    this.tm = 0;
                    this.vx = 0;
                    L.shot(cx, 156, 0, 2.2, "e");
                    L.shot(cx, 156, PI, 2.2, "e");
                    sfx("boom");
                }
            } else if (this.tm % 20 === 10) {
                L.shot(cx, cy, atan2(P.y - cy, P.x - cx), 2.2, "e");
                sfx("shoot");
            }
            if (this.st === "shoot" && this.tm > 70) {
                this.st = "idle";
                this.tm = 0;
            }
            mv(this, L.solids);
        }
    }
    draw() {
        if (this.x > cam + W || this.x < cam - 42) return;
        if ((this.dead || this.inv > 0) && frameCount % 4 < 2) return;
        if (this.t === 1 && this.st === "tele" && frameCount % 4 < 2) return;
        const x = this.x - cam + this.w / 2,
            y = this.y + this.h / 2;
        pg.push();
        pg.translate(x, y);
        pg.scale(this.face, 1);
        pg.stroke("#1f2043");
        pg.strokeWeight(1);
        if (this.t === 0) {
            // Brick: ojos rojos, pelo naranja y supertraje rojo.
            pg.fill("#f34362");
            pg.rect(-10, 0, 20, 12, 5);
            pg.fill("#21233c");
            pg.rect(-8, 11, 6, 3, 2);
            pg.rect(2, 11, 6, 3, 2);
            pg.fill("#ffe0c6");
            pg.ellipse(0, -5, 22, 18);
            pg.fill("#fff");
            pg.ellipse(-5, -4, 9, 10);
            pg.ellipse(5, -4, 9, 10);
            pg.fill("#e93252");
            pg.ellipse(-4, -4, 4.5, 6);
            pg.ellipse(6, -4, 4.5, 6);
            pg.noStroke();
            pg.fill("#fe9737");
            pg.arc(0, -12, 22, 11, PI, TWO_PI, CHORD);
        } else if (this.t === 1) {
            // Él: personaje flotante rojo y magenta.
            glow(0, 0, 34, "#ff5aa8", 56);
            pg.fill("#ef477e");
            pg.ellipse(-11, 3, 9, 8);
            pg.ellipse(11, 3, 9, 8);
            pg.fill("#fa596a");
            pg.rect(-9, -5, 18, 25, 8);
            pg.fill("#fae9ed");
            pg.ellipse(0, -8, 20, 15);
            pg.fill("#15152e");
            pg.ellipse(-4, -8, 4.5, 5);
            pg.ellipse(4, -8, 4.5, 5);
            pg.noStroke();
            pg.fill("#f23965");
            pg.arc(0, -15, 23, 12, PI, TWO_PI, CHORD);
        } else {
            // Mojo Jojo: casco violeta, rostro verde y capa.
            glow(0, 0, 43, "#c55bff", 44);
            pg.fill("#912eca");
            pg.rect(-16, 0, 32, 21, 10);
            pg.fill("#46c46e");
            pg.ellipse(0, 0, 29, 27);
            pg.fill("#f5f6ff");
            pg.ellipse(-7, -2, 10, 11);
            pg.ellipse(7, -2, 10, 11);
            pg.fill("#da4968");
            pg.ellipse(-5, -1, 4, 5);
            pg.ellipse(9, -1, 4, 5);
            pg.fill("#8f3cbe");
            pg.arc(0, -9, 33, 27, PI, TWO_PI, CHORD);
            pg.noStroke();
            pg.fill("#dba7fe");
            pg.rect(-8, -18, 16, 3, 2);
            pg.fill("#283044");
            pg.ellipse(0, 11, 11, 3.5);
        }
        pg.pop();
    }
}

class Player {
    constructor(ci, x, y) {
        this.ci = ci;
        this.c = CH[ci];
        Object.assign(this, {
            x,
            y,
            w: 10,
            h: 14,
            vx: 0,
            vy: 0,
            ground: false,
            face: 1,
            fe: this.c.fly,
            fly: false,
            inv: 0,
            star: 0,
            hp: 3,
            cd: 0,
            atk: 0,
            jp: false,
            coy: 0,
            wall: false,
        });
    }
    update(L) {
        const d = (kd(39) || kd(68) ? 1 : 0) - (kd(37) || kd(65) ? 1 : 0),
            j = kd(32) || kd(38) || kd(87);
        this.vx = lerp(this.vx, d * 1.7, 0.25);
        if (d) this.face = d;
        if (this.ground) {
            this.coy = 6;
            this.fe = this.c.fly;
        } else if (this.coy > 0) this.coy--;
        if (j && !this.jp) {
            // salto normal; segunda pulsación en el aire = vuelo (mantener)
            if (this.coy > 0) {
                this.vy = this.c.jump;
                this.coy = 0;
                this.ground = false;
                sfx("jump");
            } else if (this.fe > 0) this.fly = true;
        }
        this.jp = j;
        if (!j) this.fly = false;
        if (!j && this.vy < -2.5 && !this.fly) this.vy *= 0.9; // salto variable
        this.vy = min(this.vy + 0.35, 7);
        if (this.fly && this.fe > 0) {
            this.vy = lerp(this.vy, -1.4, 0.25);
            this.fe--;
        } else this.fly = false;
        if ((kd(88) || kd(90) || kd(74) || kd(75)) && this.cd <= 0) {
            // ataque especial (X/Z/J/K)
            L.shot(this.x + 5 + this.face * 6, this.y + 5, this.face > 0 ? 0 : PI, 4, "p", this.c.dmg);
            this.cd = 22;
            this.atk = 12;
            sfx("shoot");
        }
        this.cd--;
        this.atk--;
        if (this.inv > 0) this.inv--;
        if (this.star > 0) this.star--;
        mv(this, L.solids);
        if (this.y > H + 40) G.loseLife();
    }
    hurt(fx) {
        if (this.inv > 0 || this.star > 0 || G.st !== "play") return;
        this.hp--;
        sfx("hurt");
        this.inv = 90;
        this.vy = -4;
        this.vx = this.x < fx ? -2.5 : 2.5;
        if (this.hp <= 0) G.loseLife();
    }
    draw() {
        if (this.inv > 0 && frameCount % 4 < 2) return;
        let pose = "idle";
        if (this.atk > 0 || this.fly) pose = this.fly ? "fly" : "atk";
        else if (!this.ground) pose = "jump";
        else if (abs(this.vx) > 0.4) pose = "walk";
        const x = this.x + this.w / 2 - cam,
            y = this.y + this.h / 2;
        pg.push();
        pg.noStroke();
        if (this.fly) {
            glow(x, y + 7, 24, this.c.dress, 50);
            pg.fill(red(color(this.c.dress)), green(color(this.c.dress)), blue(color(this.c.dress)), 100);
            pg.ellipse(x - this.face * 7, y + 9, 16, 3);
        } else if (this.ground) {
            pg.fill(12, 20, 40, 48);
            pg.ellipse(x, this.y + this.h + 1, 16, 3);
        }
        if (this.star > 0) glow(x, y, 34, "#ffe87a", 87);
        drawHero(this.ci, x, y, 0.82, pose, this.face);
        pg.pop();
    }
}

class Level {
    constructor(i) {
        Object.assign(this, {i, th: TH[i], solids: [], en: [], items: [], cps: [], pr: [], locked: false, ft: 0});
        const end = [110, 130, 150][i];
        this.ax = end * T;
        this.len = end + 20;
        this.build(i, end);
        this.boss = new Boss(i, this.ax + W - 60);
    }
    // Generación procedural determinista: cada nivel siempre es igual, pero más difícil (huecos, enemigos, púas)
    build(d, end) {
        randomSeed(7 + d * 31);
        const S = this.solids,
            seg = (c, w) => S.push(new Platform(c * T, 10 * T, w * T, 2 * T)),
            plat = (c, r, w) => S.push(new Platform(c * T, r * T, w * T, T, "block")),
            it = (x, y, t = "x") => this.items.push(new Collectible(x, y, t));
        seg(0, 10);
        let c = 10,
            last = 0;
        while (c < end) {
            let g = floor(random(2, 4 + d * 0.5)),
                w = floor(random(6, 11));
            if (c + g + w + 4 > end) {
                w = end - c - g;
                if (w < 3) {
                    g = 0;
                    w = end - c;
                }
            }
            for (let k = 0; k < g; k++) it((c + k) * T + 4, (8 - sin((k * PI) / max(g - 1, 1)) * 1.5) * T); // arco de Chemical X sobre el hueco
            c += g;
            seg(c, w);
            if (w >= 5 && random() < 0.35) {
                const pw = min(4, w - 3);
                plat(c + 1, 7, pw);
                for (let k = 0; k < min(3, pw); k++) it((c + 1 + k) * T + 3, 7 * T - 13);
            }
            if (w >= 5)
                for (let k = 0, n = floor(random(0, 1.5 + d * 0.7)); k < n; k++)
                    this.en.push(new Enemy(floor(c + 1 + random(w - 3)) * T, 148, 0, d));
            if (d >= 1 && random() < 0.3) this.en.push(new Enemy((c + w / 2) * T, 6 * T, 1, d));
            if (d >= 1 && w >= 7 && random() < 0.35)
                S.push(new Platform((c + floor(w / 2)) * T, 10 * T - 8, 16, 8, "spike"));
            it((c + 1) * T + 4, 9 * T - 2);
            it((c + 2) * T + 4, 9 * T - 2);
            if (random() < 0.1) it((c + w / 2) * T, 5 * T, "star");
            else if (random() < 0.08) it((c + w / 2) * T, 5 * T, "heart");
            if (c - last >= 38 && w >= 4) {
                this.cps.push({x: (c + 1) * T, y: 10 * T - 24, on: false});
                last = c;
            }
            c += w;
        }
        this.cps.push({x: (end - 3) * T, y: 10 * T - 24, on: false}); // checkpoint antes de la arena del jefe
        seg(end, 20);
        S.push(new Platform(-8, -60, 8, 300, "wall"), new Platform(this.len * T, -60, 8, 300, "wall")); // bordes del nivel
    }
    solidAt(px, py) {
        return this.solids.some((s) => s.t !== "spike" && px >= s.x && px < s.x + s.w && py >= s.y && py < s.y + s.h);
    }
    shot(x, y, a, sp, f, d = 1) {
        this.pr.push({x, y, vx: cos(a) * sp, vy: sin(a) * sp, f, d, life: f === "p" ? 50 : 170});
    }
    resetBoss() {
        this.boss.reset();
        this.locked = false;
        this.solids = this.solids.filter((s) => s !== this.lw);
        this.pr = [];
    }
    update(P) {
        const B = this.boss;
        for (const e of this.en) {
            // enemigos: pisotón, ataque o daño
            if (e.dead) continue;
            e.update(this, P);
            if (hit(P, e)) {
                if (P.star > 0) {
                    e.dead = true;
                    G.add(150);
                    sfx("hit");
                } else if (P.vy > 0.5 && P.y + P.h - e.y < 10) {
                    e.hp -= P.c.dmg;
                    P.vy = -4.5;
                    sfx("hit");
                    if (e.hp <= 0) {
                        e.dead = true;
                        G.add(200);
                    }
                } else P.hurt(e.x);
            }
        }
        for (const s of this.solids) if (s.t === "spike" && hit(P, s)) P.hurt(s.x);
        for (const it of this.items)
            if (!it.got && hit(P, it)) {
                // coleccionables y power-ups
                it.got = true;
                if (it.t === "x") {
                    G.add(50);
                    if (++G.chem % 20 === 0) {
                        G.lives = min(9, G.lives + 1);
                        sfx("power");
                    } else sfx("coin");
                } else if (it.t === "star") {
                    P.star = 480;
                    G.add(100);
                    sfx("power");
                } else {
                    G.lives = min(9, G.lives + 1);
                    G.add(100);
                    sfx("power");
                }
            }
        for (const c of this.cps)
            if (!c.on && P.x > c.x) {
                c.on = true;
                G.sp = {x: c.x, y: 146};
                sfx("ok");
            } // checkpoints
        if (!this.locked && P.x > this.ax + 24) {
            // entrada a la arena: se bloquea la cámara y despierta el jefe
            this.locked = true;
            B.active = true;
            this.lw = new Platform(this.ax - 8, -60, 8, 300, "wall");
            this.solids.push(this.lw);
            G.ban = 120;
            G.msg = "¡JEFE: " + this.th.boss + "!";
        }
        B.update(this, P);
        if (B.active && !B.dead && hit(P, B)) {
            if (P.star > 0) B.hurt(1);
            else if (P.vy > 0.5 && P.y + P.h - B.y < 12) {
                B.hurt(P.c.dmg);
                P.vy = -5.5;
            } else P.hurt(B.x);
        }
        for (const p of this.pr) {
            // proyectiles
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (this.solidAt(p.x, p.y)) p.life = 0;
            const b = {x: p.x - 3, y: p.y - 3, w: 6, h: 6};
            if (p.f === "p") {
                for (const e of this.en)
                    if (!e.dead && p.life > 0 && hit(b, e)) {
                        e.hp -= p.d;
                        p.life = 0;
                        sfx("hit");
                        if (e.hp <= 0) {
                            e.dead = true;
                            G.add(200);
                        }
                    }
                if (B.active && !B.dead && p.life > 0 && hit(b, B)) {
                    B.hurt(p.d);
                    p.life = 0;
                }
            } else if (hit(b, P)) {
                P.hurt(p.x);
                p.life = 0;
            }
        }
        this.pr = this.pr.filter((p) => p.life > 0);
    }
}

class GameManager {
    // máquina de estados: title, instr, credits, select, play, clear, gameover, win
    constructor() {
        Object.assign(this, {
            st: "title",
            sel: 0,
            ci: 0,
            tm: 0,
            ban: 0,
            msg: "",
            score: 0,
            lives: 3,
            chem: 0,
            li: 0,
            paused: false,
            lvScore: 0,
        });
    }
    newGame() {
        this.score = 0;
        this.lives = 3;
        this.chem = 0;
        this.loadLevel(0);
    }
    loadLevel(i) {
        this.li = i;
        this.L = new Level(i);
        this.P = new Player(this.ci, 32, 146);
        this.sp = {x: 32, y: 146};
        this.lvScore = this.score;
        cam = 0;
        this.st = "play";
        this.tm = 0;
        this.ban = 150;
        this.msg = "NIVEL " + (i + 1) + ": " + TH[i].n;
        this.paused = false;
        music.set(i);
    }
    add(n) {
        this.score += n;
    }
    loseLife() {
        // pierde una vida y reaparece en el último checkpoint
        if (this.st !== "play") return;
        this.lives--;
        sfx("die");
        if (this.lives <= 0) {
            this.st = "gameover";
            this.tm = 0;
            return;
        }
        const P = this.P;
        Object.assign(P, {x: this.sp.x, y: this.sp.y, vx: 0, vy: 0, hp: 3, inv: 120, star: 0});
        this.L.resetBoss();
    }
    key(k) {
        const up = k === 38 || k === 87,
            dn = k === 40 || k === 83,
            lf = k === 37 || k === 65,
            rt = k === 39 || k === 68,
            ok = k === 13 || k === 32;
        if (k === 77) {
            music.toggle();
            return;
        }
        switch (this.st) {
            case "title":
                if (up) this.sel = (this.sel + 2) % 3;
                if (dn) this.sel = (this.sel + 1) % 3;
                if (ok) {
                    this.st = ["select", "instr", "credits"][this.sel];
                    sfx("ok");
                }
                break;
            case "instr":
            case "credits":
                if (ok || k === 27) this.st = "title";
                break;
            case "select":
                if (lf) this.ci = (this.ci + 2) % 3;
                if (rt) this.ci = (this.ci + 1) % 3;
                if (ok) this.newGame();
                if (k === 27) this.st = "title";
                break;
            case "play":
                if (k === 80) this.paused = !this.paused;
                break;
            case "clear":
                if (ok && this.tm > 30) {
                    if (this.li < 2) this.loadLevel(this.li + 1);
                    else {
                        this.st = "win";
                        this.tm = 0;
                    }
                }
                break;
            case "gameover":
                if (ok && this.tm > 30) {
                    this.lives = 3;
                    this.score = this.lvScore;
                    this.loadLevel(this.li);
                }
                if (k === 27) this.st = "title";
                break;
            case "win":
                if (ok && this.tm > 30) this.st = "title";
                break;
        }
    }
    update() {
        music.tick();
        this.tm++;
        if (this.st === "title" || this.st === "select" || this.st === "instr" || this.st === "credits") cam += 0.6;
        if (this.st !== "play" || this.paused) return;
        if (this.ban > 0) this.ban--;
        const L = this.L,
            P = this.P;
        P.update(L);
        if (this.st !== "play") return;
        L.update(P);
        if (this.st !== "play") return;
        cam = lerp(cam, constrain(P.x - W / 2 + 8, L.locked ? L.ax : 0, L.ax), 0.15); // la cámara sigue al jugador
        if (L.boss.dead && ++L.ft > 150) {
            this.st = "clear";
            this.tm = 0;
            sfx("power");
        }
    }
    heart(x, y, c) {
        heartShape(x, y, 0.6, c);
    }
    hud() {
        const P = this.P,
            B = this.L.boss;
        glass(6, 6, 99, 29, 9, 175);
        tx("VIDAS  " + this.lives, 13, 10, 7, "#fff");
        for (let i = 0; i < 3; i++) this.heart(58 + i * 12, 14, i < P.hp ? "#ff6c9a" : "#687089");
        pg.noStroke();
        pg.fill(255, 255, 255, 40);
        pg.rect(13, 26, 79, 3, 2);
        pg.fill("#4ce6ad");
        pg.rect(13, 26, 79 * (P.fe / P.c.fly), 3, 2);
        glass(112, 6, 95, 29, 9, 175);
        tx("PUNTOS", 159.5, 10, 6, "#d3d9f4", CENTER);
        tx(nf(this.score, 6), 159.5, 18, 12, "#fff", CENTER);
        glass(214, 6, 100, 29, 9, 175);
        tx("NIVEL " + (this.li + 1), 222, 10, 7, "#fff");
        pg.noStroke();
        pg.fill("#4dffc6");
        pg.ellipse(228, 26, 5);
        tx("X  " + this.chem, 236, 21, 7, "#a5ffe3");
        if (P.star > 0) {
            glass(217, 39, 95, 15, 7, 190);
            tx("★ INVENCIBLE", 265, 42, 7, "#ffe78e", CENTER);
        }
        if (B.active && !B.dead) {
            glass(76, 41, 168, 21, 9, 220);
            tx(TH[this.li].boss, W / 2, 44, 7, "#fff", CENTER);
            pg.noStroke();
            pg.fill(255, 255, 255, 55);
            pg.rect(91, 55, 138, 3.4, 2);
            pg.fill("#ff6287");
            pg.rect(91, 55, (138 * max(0, B.hp)) / B.max, 3.4, 2);
        }
    }
    dPlay() {
        const L = this.L,
            th = TH[this.li];
        drawBG(th);
        L.solids.forEach((s) => s.draw(th));
        L.items.forEach((i) => i.draw());
        for (const c of L.cps) {
            const x = c.x - cam;
            pg.noStroke();
            pg.fill("#e6ebfb");
            pg.rect(x, c.y, 2.2, 24, 1);
            pg.fill(c.on ? "#51efb1" : "#ff729a");
            pg.triangle(x + 2, c.y + 1, x + 14, c.y + 5, x + 2, c.y + 9);
            if (c.on) glow(x + 7, c.y + 5, 20, "#68f1b4", 35);
        }
        L.en.forEach((e) => e.draw());
        L.boss.draw();
        for (const p of L.pr) {
            const x = p.x - cam,
                col = p.f === "p" ? CH[this.ci].eye : "#ff4976";
            glow(x, p.y, 16, col, 80);
            pg.noStroke();
            pg.fill(col);
            pg.ellipse(x, p.y, 6.5);
            pg.fill("#fff");
            pg.ellipse(x - 1, p.y - 1, 2.4);
        }
        this.P.draw();
        this.hud();
        if (this.ban > 0) {
            glass(34, 75, W - 68, 33, 13, 205);
            tx(this.msg, W / 2, 86, this.msg.length > 29 ? 8 : 10, "#fff", CENTER);
        }
        if (this.paused) {
            pg.noStroke();
            pg.fill(11, 18, 43, 195);
            pg.rect(0, 0, W, H);
            glass(67, 54, 186, 81, 16, 236);
            tx("EN PAUSA", W / 2, 70, 19, "#fff", CENTER);
            tx("PRESIONÁ P PARA SEGUIR", W / 2, 103, 8, "#c7d5ef", CENTER);
        }
    }
    dScene() {
        drawBG(TH[0]);

        // Piso de Saltadilla
        pg.noStroke();
        pg.fill("#A78BD2");
        pg.rect(0, 170, W, 22);

        pg.fill("#FF91C2");
        pg.rect(0, 170, W, 4);

        // Evitamos oscurecer toda la pantalla
        pg.fill(255, 255, 255, 15);
        pg.rect(0, 0, W, H);
    }
    dTitle() {
        this.dScene();
        glow(160, 58, 190, "#ff75b4", 44);
        glass(55, 6, 210, 160, 17, 178);
        tx("UN JUEGO DE AVENTURAS", W / 2, 14, 7, "#b5fbe8", CENTER);
        ctext("LAS CHICAS", W / 2, 26, 16);
        ctext("SUPERPODEROSAS", W / 2, 45, 17);
        tx("AVENTURA EN SALTADILLA", W / 2, 64, 7, "#e9dcff", CENTER);
        ["JUGAR AHORA", "CÓMO JUGAR", "CRÉDITOS"].forEach((s, i) =>
            pillButton(s, 91, 77 + i * 22, 138, this.sel === i, ["#ff86bb", "#83dfff", "#9bf5b4"][i])
        );
        const bob = sin(frameCount * 0.07) * 1.5;
        drawHero(0, 114, 155 + bob, 1.23, "fly", 1);
        drawHero(2, 160, 151 - bob, 1.36, "fly", 1);
        drawHero(1, 206, 155 + bob * 0.6, 1.23, "fly", 1);
        tx("↑↓  ELEGIR     ENTER  CONFIRMAR     M  MÚSICA", W / 2, 179, 7, "#fff", CENTER);
    }
    dInstr() {
        this.dScene();
        glass(22, 12, 276, 158, 17, 224);
        tx("CONTROLES", W / 2, 21, 18, "#fff", CENTER);
        tx("DOMINÁ TUS SUPERPODERES", W / 2, 43, 7, "#a9f7e3", CENTER);
        const lines = [
            ["← →  /  A D", "Moverte por la ciudad"],
            ["ESPACIO / W / ↑", "Saltar"],
            ["DOBLE SALTO", "Mantené para volar"],
            ["X / Z / J / K", "Disparar un rayo"],
            ["P", "Pausar"],
            ["M", "Activar / silenciar música"],
        ];
        lines.forEach(([key, desc], i) => {
            const yy = 58 + i * 15;
            pg.noStroke();
            pg.fill(255, 255, 255, i % 2 ? 11 : 19);
            pg.rect(34, yy, 252, 13, 5);
            tx(key, 41, yy + 3, 7, "#8cdbff");
            tx(desc, 279, yy + 3, 7, "#fff", RIGHT);
        });
        tx("RECOLECTÁ CHEMICAL X, ACTIVÁ CHECKPOINTS Y VENCÉ AL JEFE", W / 2, 153, 6.5, "#e7d9ff", CENTER);
        tx("ENTER / ESC  VOLVER", W / 2, 179, 7, "#fff", CENTER);
    }
    dCred() {
        this.dScene();
        glass(35, 26, 250, 135, 17, 221);
        tx("CRÉDITOS", W / 2, 42, 20, "#fff", CENTER);
        tx("AVENTURA EN SALTADILLA", W / 2, 70, 9, "#a4ffe3", CENTER);
        tx("Desarrollado con p5.js y p5.sound", W / 2, 91, 8, "#fff", CENTER);
        tx("Arte vectorial generado por código", W / 2, 105, 8, "#fff", CENTER);
        tx("Fan game educativo sin fines de lucro", W / 2, 119, 8, "#f0dbff", CENTER);
        tx("Personajes de Cartoon Network", W / 2, 133, 7, "#c8cfed", CENTER);
        tx("ENTER / ESC  VOLVER", W / 2, 179, 7, "#fff", CENTER);
    }
    dSelect() {
        this.dScene();
        tx("ELEGÍ TU HEROÍNA", W / 2, 11, 19, "#fff", CENTER);
        tx("CADA UNA TIENE UN SUPERPODER ESPECIAL", W / 2, 31, 7, "#ecdbfc", CENTER);
        CH.forEach((c, i) => {
            const x = 14 + i * 98,
                selected = i === this.ci;
            pg.noStroke();
            if (selected) {
                glow(x + 46, 84, 97, c.dress, 38);
            }
            glass(x, 42, 92, 112, 12, selected ? 226 : 161);
            if (selected) {
                pg.fill(c.dress);
                pg.rect(x + 16, 47, 60, 3, 2);
            }
            drawHero(i, x + 46, 89 + sin(frameCount * 0.05 + i) * 1.2, 2, selected ? "fly" : "idle");
            tx(c.n, x + 46, 118, 10, selected ? c.dress : "#fff", CENTER);
            tx(i === 0 ? "EQUILIBRADA" : i === 1 ? "MÁS FUERZA" : "MÁS VUELO", x + 46, 134, 7, "#dce7ff", CENTER);
            if (selected) {
                pg.noStroke();
                pg.fill("#8ffff0");
                pg.ellipse(x + 46, 149, 4, 4);
            }
        });
        tx("← → ELEGIR       ENTER JUGAR       ESC VOLVER", W / 2, 174, 7, "#fff", CENTER);
    }
    dClear() {
        pg.noStroke();
        pg.fill(10, 15, 36, 185);
        pg.rect(0, 0, W, H);
        glass(37, 29, 246, 136, 16, 238);
        glow(W / 2, 45, 110, "#74efbb", 45);
        tx("¡NIVEL SUPERADO!", W / 2, 42, 18, "#fff", CENTER);
        tx(TH[this.li].n, W / 2, 66, 8, "#9ff8db", CENTER);
        tx("PUNTOS DEL NIVEL  " + (this.score - this.lvScore), W / 2, 90, 9, "#fff", CENTER);
        tx("PUNTAJE TOTAL  " + this.score, W / 2, 108, 9, "#fff", CENTER);
        pillButton("ENTER PARA SEGUIR", 89, 134, 142, true, "#9df2c7");
    }
    dOver() {
        pg.noStroke();
        pg.fill(12, 16, 37, 200);
        pg.rect(0, 0, W, H);
        glass(46, 40, 228, 112, 16, 239);
        tx("¡INTENTALO OTRA VEZ!", W / 2, 57, 16, "#ff8cad", CENTER);
        tx("PUNTAJE  " + this.score, W / 2, 85, 10, "#fff", CENTER);
        pillButton("ENTER REINTENTAR", 92, 109, 136, true, "#ff9cbb");
        tx("ESC  MENÚ PRINCIPAL", W / 2, 141, 7, "#dce5ff", CENTER);
    }
    dWin() {
        this.dScene();
        for (let i = 0; i < 38; i++) {
            const col = ["#ff91ba", "#83dcff", "#83f5aa", "#ffe99c"][i % 4];
            pg.noStroke();
            pg.fill(col);
            pg.ellipse(hs(i) * W, (hs(i + 50) * H + frameCount * (0.45 + (i % 3))) % H, 2 + (i % 3));
        }
        glass(37, 17, 246, 155, 16, 193);
        tx("¡MISIÓN CUMPLIDA!", W / 2, 30, 19, "#fff", CENTER);
        tx("SALTADILLA ESTÁ A SALVO", W / 2, 55, 9, "#a5ffe2", CENTER);
        tx("PUNTAJE FINAL   " + this.score, W / 2, 77, 10, "#fff", CENTER);
        for (let i = 0; i < 3; i++) drawHero(i, 106 + i * 54, 125 + sin(frameCount * 0.05 + i) * 2, 1.55, "fly");
        tx("ENTER  VOLVER AL MENÚ", W / 2, 178, 7, "#fff", CENTER);
    }

    draw() {
        pg.noStroke();
        switch (this.st) {
            case "title":
                this.dTitle();
                break;
            case "instr":
                this.dInstr();
                break;
            case "credits":
                this.dCred();
                break;
            case "select":
                this.dSelect();
                break;
            case "play":
                this.dPlay();
                break;
            case "clear":
                this.dPlay();
                this.dClear();
                break;
            case "gameover":
                this.dPlay();
                this.dOver();
                break;
            case "win":
                this.dWin();
                break;
        }
    }
}
