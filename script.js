// --- Configurations & Asset Map ---
const photos = [
'pics/photo1.jpg',
'pics/photo2.jpg',
'pics/photo3.jpg',
'pics/photo4.jpg',
'pics/photo5.jpg',
'pics/photo6.jpg'
];

const noMessages = [
{ title: "Are you sure? 🥺", text: "You mean the whole world to me. Please say yes!", emoji: "🥺" },
{ title: "My heart is breaking... 💔", text: "I can't imagine a single day without you. Give us a chance!", emoji: "💔" },
{ title: "Please don't leave me... 😭", text: "You're my everything, say yes and make me the happiest person alive!", emoji: "😭" },
{ title: "Think again! 🌸", text: "Look at how much love is waiting for us!", emoji: "🥺" },
{ title: "You're breaking my heart! 🥀", text: "I'm going to cry... Please click YES!", emoji: "😭" }
];

let noClickCount = 0;
let isAudioPlaying = false;

// UI Element References
const proposalOverlay = document.getElementById('proposalOverlay');
const cardHeading = document.getElementById('cardHeading');
const cardSubtext = document.getElementById('cardSubtext');
const emojiHeader = document.getElementById('emojiHeader');
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const bgSong = document.getElementById('bgSong');
const galaxyUi = document.getElementById('galaxyUi');
const musicToggle = document.getElementById('musicToggle');

// --- Proposal Button Interactions ---
noBtn.addEventListener('click', () => {
noClickCount++;

// Cycle guilt-trip content
const index = Math.min(noClickCount - 1, noMessages.length - 1);
cardHeading.innerText = noMessages[index].title;
cardSubtext.innerText = noMessages[index].text;
emojiHeader.innerText = noMessages[index].emoji;

// Scale up YES button dynamically
const currentSize = parseFloat(window.getComputedStyle(yesBtn).fontSize);
const newSize = currentSize + 10;
yesBtn.style.fontSize = `${newSize}px`;

const padVertical = 12 + (noClickCount * 6);
const padHorizontal = 28 + (noClickCount * 12);
yesBtn.style.padding = `${padVertical}px ${padHorizontal}px`;

// Shake card slightly
document.getElementById('proposalCard').style.transform = `scale(${1 + noClickCount * 0.03})`;


});

yesBtn.addEventListener('click', () => {
// 1. Trigger full-screen confetti burst
triggerConfetti();

// 2. Play background audio
bgSong.play().then(() => {
    isAudioPlaying = true;
}).catch(err => console.log("Audio play allowed on user gesture: ", err));

// 3. Fade out overlay card
proposalOverlay.classList.add('fade-out');

// 4. Reveal 3D HUD controls
galaxyUi.classList.remove('hidden');

// 5. Accelerate camera zoom into 3D Galaxy
zoomCameraIntoGalaxy();


});

musicToggle.addEventListener('click', () => {
if (isAudioPlaying) {
bgSong.pause();
musicToggle.innerText = "🎵 Play Music";
isAudioPlaying = false;
} else {
bgSong.play();
musicToggle.innerText = "⏸️ Pause Music";
isAudioPlaying = true;
}
});

function triggerConfetti() {
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

// --- WebGL / Three.js 3D Engine ---
let scene, camera, renderer, controls;
let starField, coreParticles, photoGroup;
const photoSprites = [];

function init3D() {
const container = document.getElementById('canvas-container');

// Scene & Camera
scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030308, 0.015);

camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 45); // Start slightly further back

// Renderer
renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Orbit Controls
controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.8;
controls.maxDistance = 80;
controls.minDistance = 10;

// Build Scene Components
createStarfield();
createGlowingCore();
createPhotoGalaxy();

// Resize Handler
window.addEventListener('resize', onWindowResize);

// Start Animation Loop
animate();


}

// 1. Ambient Background Starfield
function createStarfield() {
const count = 3000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 160;
    positions[i + 1] = (Math.random() - 0.5) * 160;
    positions[i + 2] = (Math.random() - 0.5) * 160;

    colors[i] = 1.0;
    colors[i + 1] = Math.random() * 0.6 + 0.4;
    colors[i + 2] = Math.random() * 0.8 + 0.2;
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
    size: 0.25,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
});

starField = new THREE.Points(geometry, material);
scene.add(starField);


}

// 2. Central Glowing Particle Heart / Sphere
function createGlowingCore() {
const count = 2000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
    // Spherical distribution with density near radius 6
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 5.5 * Math.cbrt(Math.random());

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
    color: 0xff1a4b,
    size: 0.35,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
});

coreParticles = new THREE.Points(geometry, material);
scene.add(coreParticles);


}

// 3. Orbiting 3D Photo Sprites Ring
function createPhotoGalaxy() {
photoGroup = new THREE.Group();
const textureLoader = new THREE.TextureLoader();
const radius = 16;
const totalItems = 12; // Cycle photo list to form a full ring

for (let i = 0; i < totalItems; i++) {
    const photoPath = photos[i % photos.length];
    
    textureLoader.load(photoPath, (texture) => {
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(material);

        // Scale sprite aspect ratio
        sprite.scale.set(4.5, 6, 1);

        // Calculate cylindrical ring placement
        const angle = (i / totalItems) * Math.PI * 2;
        sprite.position.x = Math.cos(angle) * radius;
        sprite.position.z = Math.sin(angle) * radius;
        sprite.position.y = Math.sin(i * 1.5) * 2; // Subtle vertical wave

        sprite.userData = { angle: angle, radius: radius, ySpeed: Math.sin(i) * 0.002 };
        
        photoGroup.add(sprite);
        photoSprites.push(sprite);
    });
}

scene.add(photoGroup);


}

// Camera transition when "Yes" is clicked
function zoomCameraIntoGalaxy() {
let targetZ = 28;
let duration = 2000;
let startZ = camera.position.z;
let startTime = performance.now();

function step(currentTime) {
    let elapsed = currentTime - startTime;
    let progress = Math.min(elapsed / duration, 1);
    
    // Smooth easeOutCubic curve
    let ease = 1 - Math.pow(1 - progress, 3);
    camera.position.z = startZ + (targetZ - startZ) * ease;

    if (progress < 1) {
        requestAnimationFrame(step);
    }
}
requestAnimationFrame(step);


}

function onWindowResize() {
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(window.innerWidth, window.innerHeight);
}

// Rendering & Physics Animation Loop
function animate() {
requestAnimationFrame(animate);

// Continuous rotation of galaxy elements
if (starField) starField.rotation.y += 0.0003;
if (coreParticles) coreParticles.rotation.y -= 0.0015;

// Orbit photo ring around the core
if (photoGroup) {
    photoGroup.children.forEach((sprite) => {
        sprite.userData.angle += 0.0025; // Speed of orbit
        sprite.position.x = Math.cos(sprite.userData.angle) * sprite.userData.radius;
        sprite.position.z = Math.sin(sprite.userData.angle) * sprite.userData.radius;
        sprite.position.y += Math.sin(Date.now() * 0.001 + sprite.userData.angle) * 0.005;
    });
}

controls.update();
renderer.render(scene, camera);


}

// Initialize WebGL on page load
window.addEventListener('DOMContentLoaded', init3D);
