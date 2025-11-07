/* ---------- Basic helpers ---------- */
const q = sel => document.querySelector(sel);

/* ---------- DOM Elements ---------- */
const backBtn = q('#backBtn');
const loadingScreen = q("#loadingScreen");
const pixelFill = loadingScreen?.querySelector(".pixel-fill");
let isLoading = false;

/* ---------- Loading Screen ---------- */
function showLoading(duration = 4000, fadeDuration = 1000, displayDelay = 1000, callback = null) {
    if (!loadingScreen || !pixelFill) {
        console.error("Loading screen or pixel-fill not found");
        if (callback) callback();
        return;
    }

    // Hide the current active screen
    const currentScreen = document.querySelector(".screen.active");
    if (currentScreen) {
        currentScreen.classList.remove("active");
        currentScreen.style.display = "none";
    }

    // Reset progress
    pixelFill.style.transition = "none";
    pixelFill.style.width = "0%";

    // Show loader
    loadingScreen.classList.add("active");
    loadingScreen.classList.remove("fade-out");

    // Animate progress
    setTimeout(() => {
        pixelFill.style.transition = `width ${duration}ms linear`;
        pixelFill.style.width = "100%";
    }, 50);

    // Delay fade-out after progress completes
    setTimeout(() => {
        loadingScreen.classList.add("fade-out");
        setTimeout(() => {
            loadingScreen.classList.remove("active", "fade-out");
            if (callback) {
                setTimeout(callback, 100); // Small buffer after fade
            }
        }, fadeDuration);
    }, duration + displayDelay); // Delay fade-out by displayDelay
}


/* ---------- Back Button (main.js) ---------- */
backBtn?.addEventListener("click", () => {
    if (isLoading) return;
    isLoading = true;
    console.log("Back button clicked, navigating to index.html");
    document.querySelector('.fade-wrapper')?.classList.add('fade-out');
    showLoading(4000, 1000, 1000, () => { // Added 2000ms display delay
        window.location.href = "index.html";
        isLoading = false;
    });
});

/* ---------- Fireworks + Pixel Sky ---------- */
(function () {
    const canvas = document.getElementById('fireworksCanvas');
    if (!canvas) {
        console.error("Fireworks canvas not found");
        return;
    }
    const ctx = canvas.getContext('2d');

    let W = canvas.width = innerWidth;
    let H = canvas.height = innerHeight;

    window.addEventListener('resize', () => {
        W = canvas.width = innerWidth;
        H = canvas.height = innerHeight;
    });

    const rand = (a, b) => Math.random() * (b - a) + a;

    let rockets = [], sparks = [], shootingStars = [];
    let running = true, lastAuto = 0;
    let intensity = 0.8;

    /* ---------- Sky gradient ---------- */
    function drawSkyGradient() {
        const gradient = ctx.createLinearGradient(0, 0, 0, H);
        gradient.addColorStop(0, "#081a3a");
        gradient.addColorStop(0.5, "#283b8b");
        gradient.addColorStop(0.8, "#6b4ba5");
        gradient.addColorStop(1, "#d27aa6");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W, H);
    }

    /* ---------- Pixel moon ---------- */
    function drawMoonPixel() {
        const size = 7;
        const grid = [
            [0,0,1,1,1,0,0],
            [0,1,1,1,1,1,0],
            [1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1],
            [0,1,1,1,1,1,0],
            [0,0,1,1,1,0,0],
        ];
        const startX = W - 120;
        const startY = 70;
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                if (grid[r][c]) {
                    ctx.fillStyle = "#ffefc2";
                    ctx.fillRect(startX + c * size, startY + r * size, size, size);
                }
            }
        }
    }

    /* ---------- Stars ---------- */
    const stars = Array.from({ length: 140 }, () => ({
        x: rand(0, W),
        y: rand(0, H * 0.65),
        size: Math.random() > 0.8 ? 2 : 1,
        twinkle: Math.random() * 2,
        speed: Math.random() * 0.02 + 0.01
    }));

    /* ---------- Firework particles ---------- */
    class Spark {
        constructor(x, y, col, vx, vy) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.color = col;
            this.alpha = 1;
            this.size = 3;
            this.decay = 0.008;
            this.gravity = 0.04;
        }
        update() {
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
        }
        draw() {
            if (this.alpha <= 0) return;
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    class Rocket {
        constructor(x, col) {
            this.x = x;
            this.y = H + 10;
            this.vy = rand(-10, -15);
            this.color = col;
            this.exploded = false;
            this.targetY = rand(H * 0.2, H * 0.45);
        }
        update() {
            this.y += this.vy;
            this.vy += 0.18;
            if (this.y <= this.targetY && !this.exploded) {
                this.exploded = true;
                explode(this.x, this.y, this.color);
            }
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, 4, 8);
        }
    }

    function explode(x, y, color) {
        const count = 120;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = rand(3, 7);
            sparks.push(new Spark(
                x, y, color,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            ));
        }
    }

    function launch(x) {
        const colors = ["#ff4b5c", "#ffcd3c", "#4ddbff", "#ff6bff", "#6bff9e", "#ffffff"];
        const color = colors[Math.floor(Math.random() * colors.length)];
        rockets.push(new Rocket(x || rand(80, W - 80), color));
    }

    /* ---------- Animation loop ---------- */
    function animate() {
        if (!running) return;
        requestAnimationFrame(animate);

        drawSkyGradient();
        drawMoonPixel();

        // Stars
        stars.forEach(s => {
            s.twinkle += s.speed;
            const alpha = 0.45 + Math.sin(s.twinkle) * 0.45;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = "#fff";
            ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
        });
        ctx.globalAlpha = 1;

        // Rockets
        for (let i = rockets.length - 1; i >= 0; i--) {
            rockets[i].update();
            rockets[i].draw();
            if (rockets[i].exploded) rockets.splice(i, 1);
        }

        // Sparks
        for (let i = sparks.length - 1; i >= 0; i--) {
            sparks[i].update();
            sparks[i].draw();
            if (sparks[i].alpha <= 0 || sparks[i].y > H + 50)
                sparks.splice(i, 1);
        }

        // Auto-launch
        if (performance.now() - lastAuto > 700 - intensity * 400) {
            if (Math.random() < 0.85) launch();
            lastAuto = performance.now();
        }
    }

    window.reduceFireworksIntensity = () => { intensity = 0.32; };
    window.restoreFireworksIntensity = () => { intensity = 0.85; };
    animate();
})();