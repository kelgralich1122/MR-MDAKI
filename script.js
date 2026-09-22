// --- Configurations & Asset Map ---
const photos = [
    'pics/photo1.jpg',
    'pics/photo2.jpg',
    'pics/photo3.jpg',
    'pics/photo4.jpg',
    'pics/photo5.jpg',
    'pics/photo6.jpg'
];

// Polaroid captions — index matches the photo number (photo1 = index 0)
const photoLabels = [
    'My Love💕',
    'Habibti',
    'ya Rouhi❤️',
    'Ya Qamar',
    'Kuchu puchu🤭',
    'Love 😘'
];

const FAVOURITE_PHOTO_INDEX = 0; // photo1 is the answer

const noMessages = [
    { title: "Are you sure? 🥺", text: "You mean the whole world to me. Please say yes!", emoji: "🥺" },
    { title: "My heart is breaking... 💔", text: "I can't imagine a single day without you. Give us a chance!", emoji: "💔" },
    { title: "Please don't leave me... 😭", text: "You're my everything, say yes and make me the happiest person alive!", emoji: "😭" },
    { title: "Think again! 🌸", text: "Look at how much love is waiting for us!", emoji: "🥺" },
    { title: "You're breaking my heart! 🥀", text: "I'm going to cry... Please click YES!", emoji: "😭" }
];

const YES_FONT_MAX = 32;
const YES_PAD_V_MAX = 22;
const YES_PAD_H_MAX = 48;
const CARD_SCALE_MAX = 1.12;

let noClickCount = 0;

// UI Element References
const proposalOverlay = document.getElementById('proposalOverlay');
const proposalCard = document.getElementById('proposalCard');
const cardHeading = document.getElementById('cardHeading');
const cardSubtext = document.getElementById('cardSubtext');
const emojiHeader = document.getElementById('emojiHeader');
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const bgSong = document.getElementById('bgSong');
const secretSong = document.getElementById('secretSong');
const galaxyUi = document.getElementById('galaxyUi');

function playMusic() {
    if (!bgSong) return Promise.resolve(false);
    return bgSong.play().then(() => true).catch((err) => {
        console.warn('Audio play blocked or failed:', err);
        return false;
    });
}

// --- Hidden reward song (track2) ---
// When the puzzle is solved: pause track1, play track2, resume track1 after.
let rewardPlaying = false;

function playRewardSong() {
    if (!secretSong) return;

    const track1WasPlaying = bgSong && !bgSong.paused;

    const resumeTrack1 = () => {
        rewardPlaying = false;
        if (track1WasPlaying || (bgSong && bgSong.paused)) {
            playMusic();
        }
    };

    secretSong.onended = resumeTrack1;
    secretSong.onerror = resumeTrack1;

    if (bgSong && !bgSong.paused) bgSong.pause();

    secretSong.currentTime = 0;
    secretSong.play().then(() => {
        rewardPlaying = true;
    }).catch((err) => {
        console.warn('Hidden song failed to play:', err);
        resumeTrack1();
    });
}

// --- Proposal Button Interactions ---
noBtn.addEventListener('click', () => {
    noClickCount++;

    const index = Math.min(noClickCount - 1, noMessages.length - 1);
    cardHeading.textContent = noMessages[index].title;
    cardSubtext.textContent = noMessages[index].text;
    emojiHeader.textContent = noMessages[index].emoji;

    const fontSize = Math.min(16 + noClickCount * 4, YES_FONT_MAX);
    const padVertical = Math.min(12 + noClickCount * 2, YES_PAD_V_MAX);
    const padHorizontal = Math.min(28 + noClickCount * 4, YES_PAD_H_MAX);
    yesBtn.style.fontSize = `${fontSize}px`;
    yesBtn.style.padding = `${padVertical}px ${padHorizontal}px`;

    const scale = Math.min(1 + noClickCount * 0.03, CARD_SCALE_MAX);
    proposalCard.style.setProperty('--card-scale', String(scale));
});

yesBtn.addEventListener('click', () => {
    triggerConfetti();
    playMusic();

    proposalOverlay.classList.add('fade-out');
    galaxyUi.classList.remove('hidden');
    zoomCameraIntoGalaxy();

    // The LED particle puzzle appears 4 seconds after the galaxy is revealed
    setTimeout(startPuzzle, 4000);
});

function triggerConfetti() {
    if (typeof confetti !== 'function') return;

    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 6,
            angle: 60,
            spread: 60,
            origin: { x: 0, y: 0.7 },
            colors: ['#ff4b72', '#ff9a9e', '#ffffff', '#ff2a5f']
        });
        confetti({
            particleCount: 6,
            angle: 120,
            spread: 60,
            origin: { x: 1, y: 0.7 },
            colors: ['#ff4b72', '#ff9a9e', '#ffffff', '#ff2a5f']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

// =========================================================
// 3D LED Dot-Matrix Particle Text Puzzle
// Bold sans-serif text formed by glowing LED dot particles,
// morphing between countdown numbers and messages in 3D.
// =========================================================
let puzzleActive = false;
let puzzleSolved = false;
let puzzleLost = false;
let countdownTimer = null;
let wrongFlashTimer = null;
let currentCount = null; // digit currently on the LED board (null = instruction phase)

let ledPoints = null;           // THREE.Points holding the LED particles
let ledTargets = null;          // Float32Array of morph target positions
let ledTargetColors = null;     // Float32Array of morph target colors
const LED_PARTICLE_COUNT = 6000;
const LED_MORPH_SPEED = 0.085;

// Sample "bold sans serif" text into an LED dot grid
function sampleTextToDots(text, options) {
    const opts = options || {};
    const big = !!opts.big;

    const canvas = document.createElement('canvas');
    const W = 1200;
    const H = 300;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Bold sans-serif, auto-shrunk to fit
    let fontSize = big ? 250 : 130;
    do {
        ctx.font = '900 ' + fontSize + 'px Poppins, Arial, sans-serif';
        if (ctx.measureText(text).width <= W - 60) break;
        fontSize -= 8;
    } while (fontSize > 34);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, W / 2, H / 2);

    const data = ctx.getImageData(0, 0, W, H).data;
    const step = big ? 6 : 7; // LED pitch in canvas px
    const dots = [];

    for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
            if (data[(y * W + x) * 4 + 3] > 128) {
                dots.push({ x: x - W / 2, y: H / 2 - y });
            }
        }
    }
    return dots;
}

// Set new morph targets from a text string
function ledSetText(text, options) {
    if (!ledPoints) return;
    const opts = options || {};
    const color = opts.color || { r: 1.0, g: 0.35, b: 0.5 };
    const dots = sampleTextToDots(text, opts);
    const worldScale = opts.scale || 0.014;

    for (let i = 0; i < LED_PARTICLE_COUNT; i++) {
        const i3 = i * 3;

        if (i < dots.length) {
            const d = dots[i % dots.length];
            ledTargets[i3] = d.x * worldScale + (Math.random() - 0.5) * 0.02;
            ledTargets[i3 + 1] = d.y * worldScale + (Math.random() - 0.5) * 0.02;
            ledTargets[i3 + 2] = (Math.random() - 0.5) * 0.25;

            // Slight per-LED brightness variation, like a real LED board
            const glow = 0.75 + Math.random() * 0.25;
            ledTargetColors[i3] = color.r * glow;
            ledTargetColors[i3 + 1] = color.g * glow;
            ledTargetColors[i3 + 2] = color.b * glow;
        } else {
            // Unused particles scatter into a faint cloud around the sign
            ledTargets[i3] = (Math.random() - 0.5) * 22;
            ledTargets[i3 + 1] = (Math.random() - 0.5) * 7;
            ledTargets[i3 + 2] = (Math.random() - 0.5) * 4;

            ledTargetColors[i3] = color.r * 0.05;
            ledTargetColors[i3 + 1] = color.g * 0.05;
            ledTargetColors[i3 + 2] = color.b * 0.05;
        }
    }
}

function createLedTextBoard() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(LED_PARTICLE_COUNT * 3);
    const colors = new Float32Array(LED_PARTICLE_COUNT * 3);

    // Start as an invisible scattered cloud
    for (let i = 0; i < LED_PARTICLE_COUNT * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 30;
        positions[i + 1] = (Math.random() - 0.5) * 12;
        positions[i + 2] = (Math.random() - 0.5) * 6;
        colors[i] = 0;
        colors[i + 1] = 0;
        colors[i + 2] = 0;
    }

    ledTargets = new Float32Array(positions);
    ledTargetColors = new Float32Array(colors);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    ledPoints = new THREE.Points(geometry, new THREE.PointsMaterial({
        size: 0.16,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        map: makeSoftStarTexture(),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
    }));

    // Centered, just below the "Only For You" 3D title
    ledPoints.position.set(0, 9.2, 0);
    ledPoints.visible = false;
    scene.add(ledPoints);
}

// Called every frame: morph particles toward their targets, face the camera
function updateLedBoard() {
    if (!ledPoints || !ledPoints.visible) return;

    const pos = ledPoints.geometry.attributes.position;
    const col = ledPoints.geometry.attributes.color;

    for (let i = 0; i < LED_PARTICLE_COUNT * 3; i++) {
        pos.array[i] += (ledTargets[i] - pos.array[i]) * LED_MORPH_SPEED;
        col.array[i] += (ledTargetColors[i] - col.array[i]) * (LED_MORPH_SPEED * 1.4);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;

    if (camera) ledPoints.lookAt(camera.position);
}

const LED_PINK = { r: 1.0, g: 0.32, b: 0.48 };
const LED_WHITE = { r: 1.0, g: 0.95, b: 0.9 };
const LED_RED = { r: 1.0, g: 0.12, b: 0.2 };
const LED_GOLD = { r: 1.0, g: 0.8, b: 0.25 };

function startPuzzle() {
    if (puzzleActive || puzzleSolved || !ledPoints) return;

    // If she has already flown deep into the core (reading the secret),
    // wait until she zooms back out before starting the challenge.
    if (camera && camera.position.length() < 6) {
        setTimeout(startPuzzle, 2000);
        return;
    }

    puzzleActive = true;

    ledPoints.visible = true;
    ledSetText('PICK HIS FAVOURITE PHOTO', { color: LED_WHITE });

    // Give her time to read the instruction, then run the 3D morphing countdown.
    // Each number holds for ~2.5s so she can actually search the photos.
    let count = 11;
    setTimeout(() => {
        if (puzzleSolved) return;

        countdownTimer = setInterval(() => {
            count--;
            if (puzzleSolved) {
                clearInterval(countdownTimer);
                countdownTimer = null;
                return;
            }
            if (count >= 1) {
                // Big morphing 3D digits
                currentCount = count;
                ledSetText(String(count), { big: true, scale: 0.02, color: count <= 3 ? LED_RED : LED_PINK });
            } else {
                clearInterval(countdownTimer);
                countdownTimer = null;
                puzzleLose();
            }
        }, 2500);
    }, 5000);
}

function puzzleLose() {
    puzzleLost = true;
    ledSetText('YOU LOSE', { big: true, scale: 0.016, color: LED_RED });

    // Then reveal which photo to press so she can still unlock the gift
    setTimeout(() => {
        if (puzzleSolved) return;
        ledSetText('PRESS  "' + photoLabels[FAVOURITE_PHOTO_INDEX] + '"', { color: LED_GOLD });
    }, 3000);
}

function puzzleWin() {
    if (puzzleSolved) return;
    puzzleSolved = true;
    puzzleActive = false;

    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
    if (wrongFlashTimer) {
        clearTimeout(wrongFlashTimer);
        wrongFlashTimer = null;
    }

    ledSetText('CORRECT!  I LOVE YOU', { color: LED_PINK });

    triggerConfetti();
    playRewardSong();

    // Let the LEDs scatter away after the celebration
    setTimeout(() => {
        if (!ledPoints) return;
        for (let i = 0; i < LED_PARTICLE_COUNT * 3; i += 3) {
            ledTargets[i] = (Math.random() - 0.5) * 60;
            ledTargets[i + 1] = (Math.random() - 0.5) * 40;
            ledTargets[i + 2] = (Math.random() - 0.5) * 30;
            ledTargetColors[i] = 0;
            ledTargetColors[i + 1] = 0;
            ledTargetColors[i + 2] = 0;
        }
        setTimeout(() => { if (ledPoints) ledPoints.visible = false; }, 2600);
    }, 4200);
}

function puzzleWrongPick() {
    if ((!puzzleActive && !puzzleLost) || puzzleSolved) return;

    ledSetText('WRONG PHOTO', { big: true, scale: 0.015, color: LED_RED });

    if (wrongFlashTimer) clearTimeout(wrongFlashTimer);
    wrongFlashTimer = setTimeout(() => {
        if (puzzleSolved) return;
        if (puzzleLost) {
            ledSetText('PRESS  "' + photoLabels[FAVOURITE_PHOTO_INDEX] + '"', { color: LED_GOLD });
        } else if (currentCount !== null) {
            // Morph back to the digit currently counting down
            ledSetText(String(currentCount), { big: true, scale: 0.02, color: currentCount <= 3 ? LED_RED : LED_PINK });
        } else {
            // Still in the instruction phase
            ledSetText('PICK HIS FAVOURITE PHOTO', { color: LED_WHITE });
        }
    }, 1200);
}

// =========================================================
// WebGL / Three.js 3D Engine
// =========================================================
let scene, camera, renderer, controls;
let starField, coreParticles, photoGroup;
let saturnDust, saturnSquares, secretHeart, secretNote;
let titleGroup = null;
const photoSprites = [];

function randn() {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function makeSoftStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.55, 'rgba(255,220,230,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function makeSquareStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 6, 20, 20);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function init3D() {
    if (typeof THREE === 'undefined') {
        console.error('Three.js failed to load.');
        return;
    }

    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030308, 0.01);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 1000);
    camera.position.set(0, 5, 45);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    if (THREE.OrbitControls) {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.8;
        controls.zoomSpeed = 1.15;
        controls.maxDistance = 90;
        // Allow flying into the core to find the hidden gift
        controls.minDistance = 0.42;
        controls.enablePan = false;
        controls.target.set(0, 0, 0);
    } else {
        console.warn('OrbitControls unavailable — drag-to-rotate is disabled.');
    }

    createStarfield();
    createGlowingCore();
    createSaturnRings();
    createSecretGift();
    createPhotoGalaxy();
    create3DTitle();
    createLedTextBoard();
    setupPhotoPicking();

    window.addEventListener('resize', onWindowResize);
    animate();
}

// =========================================================
// 3D "Only For You" Title
// =========================================================
function create3DTitle() {
    titleGroup = new THREE.Group();
    titleGroup.position.set(0, 13.5, 0);
    scene.add(titleGroup);

    const fontUrl = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/fonts/helvetiker_bold.typeface.json';
    const loader = new THREE.FontLoader();

    loader.load(
        fontUrl,
        (font) => {
            const textGeom = new THREE.TextGeometry('Only For You', {
                font: font,
                size: 1.7,
                height: 0.55,
                curveSegments: 8,
                bevelEnabled: true,
                bevelThickness: 0.06,
                bevelSize: 0.045,
                bevelSegments: 3
            });
            textGeom.computeBoundingBox();
            const bb = textGeom.boundingBox;
            const width = bb.max.x - bb.min.x;
            textGeom.translate(-width / 2 - 1.1, 0, 0);

            const frontMat = new THREE.MeshBasicMaterial({ color: 0xff5c82 });
            const sideMat = new THREE.MeshBasicMaterial({ color: 0x7d1030 });
            const textMesh = new THREE.Mesh(textGeom, [frontMat, sideMat]);
            titleGroup.add(textMesh);

            // Extruded 3D heart at the end of the text
            const heartShape = new THREE.Shape();
            heartShape.moveTo(0, 0.6);
            heartShape.bezierCurveTo(0, 0.95, -0.55, 1.25, -0.95, 0.95);
            heartShape.bezierCurveTo(-1.45, 0.55, -1.05, -0.15, 0, -1.0);
            heartShape.bezierCurveTo(1.05, -0.15, 1.45, 0.55, 0.95, 0.95);
            heartShape.bezierCurveTo(0.55, 1.25, 0, 0.95, 0, 0.6);

            const heartGeom = new THREE.ExtrudeGeometry(heartShape, {
                depth: 0.45,
                bevelEnabled: true,
                bevelThickness: 0.06,
                bevelSize: 0.05,
                bevelSegments: 2
            });
            const heartMesh = new THREE.Mesh(heartGeom, [
                new THREE.MeshBasicMaterial({ color: 0xff2a5f }),
                new THREE.MeshBasicMaterial({ color: 0x8f0f30 })
            ]);
            heartMesh.scale.setScalar(0.85);
            heartMesh.position.set(width / 2 + 0.6, 0.85, 0.05);
            titleGroup.add(heartMesh);

            // Soft glow sprite behind the text
            const glowMat = new THREE.SpriteMaterial({
                map: makeSoftStarTexture(),
                color: 0xff4b72,
                transparent: true,
                opacity: 0.35,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            const glow = new THREE.Sprite(glowMat);
            glow.scale.set(width + 8, 6, 1);
            glow.position.set(0, 0.8, -0.6);
            titleGroup.add(glow);
        },
        undefined,
        (err) => {
            console.warn('Title font failed to load, using sprite fallback.', err);
            createTitleSpriteFallback();
        }
    );
}

function createTitleSpriteFallback() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 110px Caveat, cursive';

    // Layered offsets fake an extruded 3D look
    for (let i = 10; i > 0; i--) {
        ctx.fillStyle = 'rgb(' + (90 + i * 6) + ', 10, ' + (30 + i * 3) + ')';
        ctx.fillText('Only For You ❤️', 512 + i * 1.6, 128 + i * 1.6);
    }
    ctx.shadowColor = 'rgba(255, 75, 114, 0.95)';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#ff6b8a';
    ctx.fillText('Only For You ❤️', 512, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false
    }));
    sprite.scale.set(16, 4, 1);
    titleGroup.add(sprite);
}

function createStarfield() {
    const count = 8000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 180;
        positions[i3 + 1] = (Math.random() - 0.5) * 180;
        positions[i3 + 2] = (Math.random() - 0.5) * 180;

        colors[i3] = 1.0;
        colors[i3 + 1] = Math.random() * 0.6 + 0.4;
        colors[i3 + 2] = Math.random() * 0.8 + 0.2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.22,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        map: makeSoftStarTexture(),
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    starField = new THREE.Points(geometry, material);
    scene.add(starField);
}

function createGlowingCore() {
    // Hollow shell so the hidden gift is only visible after flying inside
    const count = 9000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const theta = Math.random() * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * Math.random() - 1.0);
        const r = 4.15 + Math.random() * 1.7;

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xff1a4b,
        size: 0.16,
        transparent: true,
        opacity: 0.92,
        map: makeSoftStarTexture(),
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    coreParticles = new THREE.Points(geometry, material);
    scene.add(coreParticles);
}

function pickRingRadius() {
    const roll = Math.random();
    // Bright inner B-ring (the edge-on white band)
    if (roll < 0.46) return 7.6 + Math.random() * 4.2;
    // Cassini-style gap — almost empty
    if (roll < 0.50) return 11.9 + Math.random() * 0.7;
    // Main ring, sits with the photos
    if (roll < 0.82) return 12.7 + Math.random() * 6.5;
    // Outer sparse A-ring
    return 19.4 + Math.random() * 10.5;
}

function createSaturnRings() {
    const isSmallScreen = window.innerWidth < 700;
    const dustCount = isSmallScreen ? 42000 : 72000;
    const squareCount = isSmallScreen ? 2200 : 3800;

    const dustGeom = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustCol = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
        const radius = pickRingRadius();
        const angle = Math.random() * Math.PI * 2;
        // Thin disk: tighter at the inner bright band, a little thicker outward
        const thickness = 0.07 + (radius - 7.6) * 0.012;
        const y = randn() * thickness;

        dustPos[i * 3] = Math.cos(angle) * radius;
        dustPos[i * 3 + 1] = y;
        dustPos[i * 3 + 2] = Math.sin(angle) * radius;

        const warm = Math.random();
        if (warm < 0.12) {
            dustCol[i * 3] = 1.0;
            dustCol[i * 3 + 1] = 0.55 + Math.random() * 0.25;
            dustCol[i * 3 + 2] = 0.7 + Math.random() * 0.2;
        } else if (warm < 0.22) {
            dustCol[i * 3] = 1.0;
            dustCol[i * 3 + 1] = 0.85 + Math.random() * 0.1;
            dustCol[i * 3 + 2] = 0.55 + Math.random() * 0.2;
        } else {
            const c = 0.82 + Math.random() * 0.18;
            dustCol[i * 3] = c;
            dustCol[i * 3 + 1] = c;
            dustCol[i * 3 + 2] = Math.min(1, c + 0.05);
        }
    }

    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    dustGeom.setAttribute('color', new THREE.BufferAttribute(dustCol, 3));

    saturnDust = new THREE.Points(dustGeom, new THREE.PointsMaterial({
        size: 0.085,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        map: makeSoftStarTexture(),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
    }));
    scene.add(saturnDust);

    const sqGeom = new THREE.BufferGeometry();
    const sqPos = new Float32Array(squareCount * 3);
    const sqCol = new Float32Array(squareCount * 3);

    for (let i = 0; i < squareCount; i++) {
        const radius = 14 + Math.pow(Math.random(), 0.65) * 18;
        const angle = Math.random() * Math.PI * 2;
        const y = randn() * (0.18 + (radius - 14) * 0.02);

        sqPos[i * 3] = Math.cos(angle) * radius;
        sqPos[i * 3 + 1] = y;
        sqPos[i * 3 + 2] = Math.sin(angle) * radius;

        const c = 0.88 + Math.random() * 0.12;
        sqCol[i * 3] = c;
        sqCol[i * 3 + 1] = c * (0.92 + Math.random() * 0.08);
        sqCol[i * 3 + 2] = c * (0.9 + Math.random() * 0.1);
    }

    sqGeom.setAttribute('position', new THREE.BufferAttribute(sqPos, 3));
    sqGeom.setAttribute('color', new THREE.BufferAttribute(sqCol, 3));

    saturnSquares = new THREE.Points(sqGeom, new THREE.PointsMaterial({
        size: 0.42,
        vertexColors: true,
        transparent: true,
        opacity: 0.88,
        map: makeSquareStarTexture(),
        depthWrite: false,
        sizeAttenuation: true
    }));
    scene.add(saturnSquares);
}

function makeSecretNoteTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 768, 512);

    ctx.fillStyle = 'rgba(40, 8, 18, 0.35)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(48, 56, 672, 400, 36);
    else ctx.rect(48, 56, 672, 400);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 180, 200, 0.45)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe4ec';
    ctx.shadowColor = 'rgba(255, 75, 114, 0.9)';
    ctx.shadowBlur = 18;
    ctx.font = '700 96px Caveat, cursive';
    ctx.fillText('I love you', 384, 210);
    ctx.font = '600 52px Caveat, cursive';
    ctx.fillStyle = '#ffd0dc';
    ctx.fillText('more than all of this', 384, 310);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function createSecretGift() {
    const count = 2800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scale = 0.017;

    for (let i = 0; i < count; i++) {
        const t = Math.random() * Math.PI * 2;
        const fill = Math.pow(Math.random(), 0.45);
        const x = 16 * Math.pow(Math.sin(t), 3) * fill;
        const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * fill;
        const z = (Math.random() - 0.5) * 6 * fill;

        positions[i * 3] = x * scale;
        positions[i * 3 + 1] = y * scale;
        positions[i * 3 + 2] = z * scale;

        const sparkle = Math.random();
        if (sparkle > 0.82) {
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 0.95;
            colors[i * 3 + 2] = 0.85;
        } else {
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 0.35 + Math.random() * 0.35;
            colors[i * 3 + 2] = 0.5 + Math.random() * 0.25;
        }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    secretHeart = new THREE.Points(geometry, new THREE.PointsMaterial({
        size: 0.028,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        map: makeSoftStarTexture(),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
    }));
    scene.add(secretHeart);

    const noteMat = new THREE.SpriteMaterial({
        map: makeSecretNoteTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.95
    });
    secretNote = new THREE.Sprite(noteMat);
    secretNote.scale.set(0.38, 0.25, 1);
    secretNote.position.set(0, -0.42, 0);
    scene.add(secretNote);
}

// =========================================================
// Polaroid Photo Galaxy
// =========================================================
const POLAROID_W = 560;
const POLAROID_H = 700;

function drawPolaroidBase(ctx) {
    // Slightly warm white card with a soft edge
    const g = ctx.createLinearGradient(0, 0, 0, POLAROID_H);
    g.addColorStop(0, '#fdfbf7');
    g.addColorStop(1, '#f3efe6');
    ctx.fillStyle = g;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(0, 0, POLAROID_W, POLAROID_H, 14);
    else ctx.rect(0, 0, POLAROID_W, POLAROID_H);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 3;
    ctx.stroke();
}

function drawPolaroidCaption(ctx, label) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 58px Caveat, cursive';
    ctx.fillStyle = '#5c4a3d';
    ctx.fillText(label, POLAROID_W / 2, 648);
}

function makePolaroidTexture(image, label) {
    const canvas = document.createElement('canvas');
    canvas.width = POLAROID_W;
    canvas.height = POLAROID_H;
    const ctx = canvas.getContext('2d');

    drawPolaroidBase(ctx);

    // Photo window: 500x500 with cover-crop
    const px = 30, py = 30, pw = 500, ph = 560;
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();

    const iw = image.width || pw;
    const ih = image.height || ph;
    const scale = Math.max(pw / iw, ph / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(image, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh);
    ctx.restore();

    // Subtle inner shadow around the photo
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.lineWidth = 4;
    ctx.strokeRect(px, py, pw, ph);

    drawPolaroidCaption(ctx, label);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
}

function makePolaroidPlaceholder(label) {
    const canvas = document.createElement('canvas');
    canvas.width = POLAROID_W;
    canvas.height = POLAROID_H;
    const ctx = canvas.getContext('2d');

    drawPolaroidBase(ctx);

    const px = 30, py = 30, pw = 500, ph = 560;
    const gradient = ctx.createLinearGradient(px, py, px + pw, py + ph);
    gradient.addColorStop(0, '#ff6b8a');
    gradient.addColorStop(1, '#ff2a5f');
    ctx.fillStyle = gradient;
    ctx.fillRect(px, py, pw, ph);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.font = '600 120px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♥', px + pw / 2, py + ph / 2);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.lineWidth = 4;
    ctx.strokeRect(px, py, pw, ph);

    drawPolaroidCaption(ctx, label);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function placePhotoSprite(texture, index, totalItems, radius, photoIndex) {
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
    });
    const sprite = new THREE.Sprite(material);

    const aspect = POLAROID_W / POLAROID_H;
    const height = 6.4;
    sprite.scale.set(height * aspect, height, 1);

    const angle = (index / totalItems) * Math.PI * 2;
    const baseY = Math.sin(index * 1.5) * 2;
    sprite.position.set(
        Math.cos(angle) * radius,
        baseY,
        Math.sin(angle) * radius
    );

    sprite.userData = {
        angle: angle,
        radius: radius,
        baseY: baseY,
        bobAmp: 0.45,
        photoIndex: photoIndex
    };

    photoGroup.add(sprite);
    photoSprites.push(sprite);
}

function createPhotoGalaxy() {
    photoGroup = new THREE.Group();
    const radius = 16;
    const totalItems = 12;

    for (let i = 0; i < totalItems; i++) {
        const photoIndex = i % photos.length;
        const photoPath = photos[photoIndex];
        const label = photoLabels[photoIndex];
        const slot = i;

        const img = new Image();
        img.onload = () => {
            const texture = makePolaroidTexture(img, label);
            placePhotoSprite(texture, slot, totalItems, radius, photoIndex);
        };
        img.onerror = () => {
            console.warn('Failed to load photo:', photoPath);
            const fallback = makePolaroidPlaceholder(label);
            placePhotoSprite(fallback, slot, totalItems, radius, photoIndex);
        };
        img.src = photoPath;
    }

    scene.add(photoGroup);
}

// =========================================================
// Photo picking (raycast) for the puzzle
// =========================================================
function setupPhotoPicking() {
    if (!renderer) return;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const dom = renderer.domElement;

    dom.addEventListener('pointerdown', (e) => {
        downX = e.clientX;
        downY = e.clientY;
    });

    dom.addEventListener('pointerup', (e) => {
        // Ignore drags (rotating the galaxy)
        const dx = e.clientX - downX;
        const dy = e.clientY - downY;
        if (Math.sqrt(dx * dx + dy * dy) > 8) return;
        if (!puzzleActive && !puzzleLost) return;
        if (puzzleSolved || !photoGroup) return;

        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(photoGroup.children, false);
        if (!hits.length) return;

        const picked = hits[0].object;
        if (picked.userData.photoIndex === FAVOURITE_PHOTO_INDEX) {
            puzzleWin();
        } else {
            puzzleWrongPick();
        }
    });
}

function zoomCameraIntoGalaxy() {
    if (!camera) return;

    const targetZ = 28;
    const duration = 2000;
    const startZ = camera.position.z;
    const startTime = performance.now();

    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        camera.position.z = startZ + (targetZ - startZ) * ease;

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}

function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const t = Date.now() * 0.001;

    if (starField) starField.rotation.y += 0.0003;
    if (coreParticles) coreParticles.rotation.y -= 0.0015;
    if (saturnDust) saturnDust.rotation.y += 0.00085;
    if (saturnSquares) saturnSquares.rotation.y += 0.00055;

    if (titleGroup && camera) {
        titleGroup.position.y = 13.5 + Math.sin(t * 0.9) * 0.35;
        titleGroup.lookAt(camera.position);
    }

    updateLedBoard();

    if (secretHeart) {
        secretHeart.rotation.y += 0.006;
        const pulse = 1 + Math.sin(t * 2.3) * 0.06;
        secretHeart.scale.setScalar(pulse);
    }

    if (secretNote && camera) {
        const dist = camera.position.length();
        if (dist > 2.2) {
            secretNote.visible = false;
        } else {
            secretNote.visible = true;
            secretNote.material.opacity = Math.min(1, (2.2 - dist) / 1.15);
        }
    }

    if (photoGroup) {
        photoGroup.children.forEach((sprite) => {
            const data = sprite.userData;
            data.angle += 0.0025;
            sprite.position.x = Math.cos(data.angle) * data.radius;
            sprite.position.z = Math.sin(data.angle) * data.radius;
            sprite.position.y = data.baseY + Math.sin(t + data.angle) * data.bobAmp;
        });
    }

    if (camera && galaxyUi && !galaxyUi.classList.contains('hidden')) {
        const dist = camera.position.length();
        if (dist < 3.4) galaxyUi.classList.add('near-secret');
        else galaxyUi.classList.remove('near-secret');
    }

    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', init3D);
