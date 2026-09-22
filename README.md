# Only For You ❤️ — 3D Proposal Galaxy

An interactive romantic proposal website built with **Three.js**. It starts with a
proposal card, then opens into a 3D galaxy filled with floating polaroid photos,
a Saturn-like ring of stars, a hidden surprise at the core, and a glowing
LED-particle photo challenge.

> Made with love. 💕

---

## ✨ Features

- **Proposal card** — "Will you be mine forever?" with a Yes 💕 / No 💔 choice.
  Every "No" makes the Yes button bigger and the messages more dramatic.
- **3D galaxy** — thousands of stars, a glowing red particle core, and a dense
  Saturn-style ring (~72,000 star particles) you can rotate and zoom through.
- **3D floating title** — "Only For You" as extruded 3D text with a 3D heart,
  always facing the camera.
- **Polaroid photo ring** — 12 floating polaroid-framed photos orbiting the core,
  each with a handwritten caption (My Love💕, Habibti, ya Rouhi❤️, Ya Qamar,
  Kuchu puchu🤭, Love 😘).
- **LED particle challenge** — a few seconds after the galaxy appears, glowing
  dot-matrix LED particles morph into a message:
  *"PICK HIS FAVOURITE PHOTO"* — followed by a slow 3D morphing countdown
  from 10 to 1. Picking the right photo unlocks a **hidden song** (track2);
  the background music pauses, the reward song plays, then the music resumes.
- **Hidden secret** 🤫 — zoom *all the way* into the red core… a tiny sparkling
  heart and a secret note are waiting inside.
- **Music & confetti** — background music starts on "Yes" with a confetti burst.

## 📁 Project Structure

```
my-multimedia-project/
├── index.html      # Page structure, overlays, audio elements
├── style.css       # Proposal card, galaxy HUD, animations
├── script.js       # Proposal logic + full Three.js 3D scene
├── pics/
│   ├── photo1.jpg  # ← the "favourite photo" answer (My Love💕)
│   ├── photo2.jpg
│   ├── photo3.jpg
│   ├── photo4.jpg
│   ├── photo5.jpg
│   └── photo6.jpg
└── songs/
    ├── track1.mp3  # Background music (loops)
    └── track2.mp3  # Hidden reward song (plays when the puzzle is solved)
```

## 🚀 Run It

No build step — it's plain HTML/CSS/JS with CDN libraries.

**Option 1: GitHub Pages (recommended)**
1. Repo → **Settings** → **Pages**
2. Source: *Deploy from a branch* → branch `main`, folder `/ (root)` → Save
3. Open `https://<your-username>.github.io/my-multimedia-project/`

**Option 2: Local server**
```bash
python3 -m http.server 8000
# then open http://localhost:8000
```
(Opening `index.html` directly with `file://` may block audio/photos in some browsers — use a server.)

## 🎮 How to Play

1. Click **Yes 💕**
2. Drag to rotate the galaxy · scroll/pinch to zoom
3. When the LED text appears, find and **tap his favourite photo** before the
   countdown ends (hint: it's the one labelled *My Love💕*)
4. Solve it to unlock the hidden song 🎁
5. Bonus: zoom deep into the red core for one last secret ❤️

## 🛠️ Built With

- [Three.js r128](https://threejs.org/) — WebGL 3D engine (+ OrbitControls, FontLoader/TextGeometry)
- [canvas-confetti](https://github.com/catdad/canvas-confetti) — confetti celebration
- Google Fonts — Poppins & Caveat
- HTML5 Canvas — polaroid frames, LED dot-matrix text sampling, star textures

## 📝 Notes

- All 3D text, polaroids, and LED particles are generated at runtime — no image
  editing needed; just replace the photos and songs with your own.
- Works on mobile (touch drag + pinch zoom); particle counts scale down
  automatically on small screens.
