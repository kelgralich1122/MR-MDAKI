// Scene, Camera, Renderer setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 30;

// Create Starfield Background
const starsGeometry = new THREE.BufferGeometry();
const starsCount = 2000;
const starPositions = new Float32Array(starsCount * 3);

for(let i = 0; i < starsCount * 3; i++) {
    starPositions[i] = (Math.random() - 0.5) * 100;
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starsMaterial = new THREE.PointsMaterial({color: 0xffffff, size: 0.1});
const starField = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starField);

// Create Central Heart/Sphere Particle Core (Red/White Core)
const coreGeometry = new THREE.BufferGeometry();
const coreCount = 1000;
const corePositions = new Float32Array(coreCount * 3);

for(let i = 0; i < coreCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 5 * Math.cbrt(Math.random());
    
    corePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    corePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    corePositions[i * 3 + 2] = r * Math.cos(phi);
}

coreGeometry.setAttribute('position', new THREE.BufferAttribute(corePositions, 3));
const coreMaterial = new THREE.PointsMaterial({color: 0xff0033, size: 0.2});
const coreSphere = new THREE.Points(coreGeometry, coreMaterial);
scene.add(coreSphere);

// Galaxy Ring of Pictures
const textureLoader = new THREE.TextureLoader();
// Add filenames of pictures placed inside your pics/ directory
const imageFiles = ['pics/photo1.jpg', 'pics/photo2.jpg', 'pics/photo3.jpg']; 
const imageSprites = [];

const radius = 12;
const totalImages = 15; // Number of items in orbit ring

for (let i = 0; i < totalImages; i++) {
    const angle = (i / totalImages) * Math.PI * 2;
    const imgPath = imageFiles[i % imageFiles.length]; // Cycles through your image list

    textureLoader.load(imgPath, (texture) => {
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        
        sprite.scale.set(3, 3, 1);
        sprite.position.x = Math.cos(angle) * radius;
        sprite.position.z = Math.sin(angle) * radius;
        sprite.position.y = (Math.random() - 0.5) * 4;

        scene.add(sprite);
        imageSprites.push(sprite);
    });
}

// Interaction controls (Dragging & Zooming)
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let galaxyRotationSpeed = 0.002;

window.addEventListener('mousedown', (e) => { isDragging = true; });
window.addEventListener('mouseup', () => { isDragging = false; });

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        coreSphere.rotation.y += deltaX * 0.005;
        starField.rotation.y += deltaX * 0.002;
    }
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener('wheel', (e) => {
    camera.position.z += e.deltaY * 0.01;
    camera.position.z = Math.max(10, Math.min(50, camera.position.z)); // Zoom limits
});

// Audio Play Button Logic
const playBtn = document.getElementById('playBtn');
const bgSong = document.getElementById('bgSong');
let isPlaying = false;

playBtn.addEventListener('click', () => {
    if (!isPlaying) {
        bgSong.play();
        playBtn.innerText = "⏸️ Pause Song";
        isPlaying = true;
    } else {
        bgSong.pause();
        playBtn.innerText = "🎵 Play Our Song";
        isPlaying = false;
    }
});

// Animation Loop (Rotation)
function animate() {
    requestAnimationFrame(animate);

    // Rotate core and background slowly
    coreSphere.rotation.y += galaxyRotationSpeed;
    starField.rotation.y -= 0.0005;

    // Orbit image sprites around the center
    imageSprites.forEach((sprite, index) => {
        const angle = (index / totalImages) * Math.PI * 2 + Date.now() * 0.0005;
        sprite.position.x = Math.cos(angle) * radius;
        sprite.position.z = Math.sin(angle) * radius;
    });

    renderer.render(scene, camera);
}

animate();

// Handle Window Resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
