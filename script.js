// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initAudioController();
    initEnvelopeMechanics();
    initDodgingButton();
    initProposalActions();
});

// --- 1. Scroll-Driven Text Animations ---
function initScrollAnimations() {
    const scenes = document.querySelectorAll('.scroll-scene');

    scenes.forEach((scene) => {
        const text = scene.querySelector('.narrative-text');
        if (!text) return;

        // Fade in & Translate up as scene enters center
        gsap.fromTo(text,
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                scrollTrigger: {
                    trigger: scene,
                    start: "top 75%",
                    end: "top 25%",
                    scrub: 0.8
                }
            }
        );

        // Fade out & Translate up further as scene leaves top
        gsap.to(text, {
            opacity: 0,
            y: -30,
            scrollTrigger: {
                trigger: scene,
                start: "center 30%",
                end: "bottom top",
                scrub: 0.8
            }
        });
    });
}

// --- 2. Audio Controller ---
function initAudioController() {
    const audio = document.getElementById('bgMusic');
    const toggleBtn = document.getElementById('audioToggle');
    const audioIcon = document.getElementById('audioIcon');
    const audioText = document.getElementById('audioText');
    let isPlaying = false;

    toggleBtn.addEventListener('click', () => {
        if (isPlaying) {
            audio.pause();
            audioIcon.textContent = "🎵";
            audioText.textContent = "Play Music";
            isPlaying = false;
        } else {
            audio.play().then(() => {
                audioIcon.textContent = "⏸️";
                audioText.textContent = "Pause Music";
                isPlaying = true;
            }).catch(err => {
                console.log("Audio play prevented: ", err);
            });
        }
    });

    window.playBackgroundMusic = () => {
        if (!isPlaying) {
            audio.play().then(() => {
                audioIcon.textContent = "⏸️";
                audioText.textContent = "Pause Music";
                isPlaying = true;
            }).catch(() => {});
        }
    };
}

// --- 3. 3D Envelope & Fullscreen Letter Mechanics ---
function initEnvelopeMechanics() {
    const envelopeWrapper = document.getElementById('envelopeWrapper');
    const waxSeal = document.getElementById('waxSeal');
    const envelopeFlap = document.getElementById('envelopeFlap');
    const miniLetter = document.getElementById('miniLetter');
    const tapToOpenText = document.getElementById('tapToOpenText');

    const letterModal = document.getElementById('letterModal');
    const letterCard = document.getElementById('letterCard');
    const foldLetterBtn = document.getElementById('foldLetterBtn');
    const letterParas = document.querySelectorAll('.letter-para');

    let isEnvelopeOpened = false;

    envelopeWrapper.addEventListener('click', () => {
        if (isEnvelopeOpened) return;
        isEnvelopeOpened = true;

        if (window.playBackgroundMusic) window.playBackgroundMusic();

        // Step 1: Hide tap text & Fade out Wax Seal
        if (tapToOpenText) tapToOpenText.classList.add('opacity-0');
        waxSeal.style.opacity = '0';
        waxSeal.style.transform = 'translateX(-50%) scale(0.5)';

        // Step 2: Open top flap (rotateX 180deg) after seal fades
        setTimeout(() => {
            envelopeFlap.style.transform = 'rotateX(180deg)';
            envelopeFlap.style.zIndex = '1';

            // Step 3: Slide mini letter upwards out of envelope
            setTimeout(() => {
                miniLetter.style.transform = 'translateY(-60px)';
                miniLetter.style.zIndex = '4';

                // Step 4: Expand mini letter into Fullscreen Letter Overlay Modal
                setTimeout(() => {
                    letterModal.classList.remove('pointer-events-none');
                    letterModal.classList.remove('opacity-0');
                    letterModal.classList.add('opacity-100');

                    letterCard.classList.remove('scale-90');
                    letterCard.classList.add('scale-100');

                    // Step 5: Staggered Paragraph Fade-In Sequence
                    letterParas.forEach((para, idx) => {
                        setTimeout(() => {
                            para.classList.remove('opacity-0', 'translate-y-3');
                            para.classList.add('opacity-100', 'translate-y-0');
                        }, idx * 600 + 300);
                    });

                }, 500);

            }, 400);

        }, 300);
    });

    // Fold Letter Interaction
    foldLetterBtn.addEventListener('click', () => {
        letterCard.classList.remove('scale-100');
        letterCard.classList.add('scale-90');
        
        letterModal.classList.remove('opacity-100');
        letterModal.classList.add('opacity-0');

        setTimeout(() => {
            letterModal.classList.add('pointer-events-none');
            // Dim envelope section slightly to indicate completed state
            gsap.to('#envelopeSceneContainer', { opacity: 0.5, duration: 1 });
        }, 500);
    });
}

// --- 4. Dodging "No" Button Mechanics ---
function initDodgingButton() {
    const noBtn = document.getElementById('noBtn');
    if (!noBtn) return;

    const noTexts = [
        "are you sure?",
        "think again! 🌸",
        "really sure? 🥺",
        "give it another thought!",
        "you can't say no! 😉",
        "nice try! ❤️"
    ];

    let textIndex = 0;

    function dodgeButton(e) {
        if (e) e.preventDefault();

        // Change button text
        textIndex = (textIndex + 1) % noTexts.length;
        noBtn.textContent = noTexts[textIndex];

        // Calculate random bounding offsets (-120px to 120px)
        const randomX = (Math.random() - 0.5) * 240;
        const randomY = (Math.random() - 0.5) * 160;

        // Animate dodge using GSAP spring/bounce easing
        gsap.to(noBtn, {
            x: randomX,
            y: randomY,
            duration: 0.35,
            ease: "back.out(2)"
        });
    }

    noBtn.addEventListener('mouseover', dodgeButton);
    noBtn.addEventListener('touchstart', dodgeButton, { passive: false });
    noBtn.addEventListener('click', dodgeButton);
}

// --- 5. Proposal "Yes" Click & Confetti State ---
function initProposalActions() {
    const yesBtn = document.getElementById('yesBtn');
    const proposalContent = document.getElementById('proposalContent');
    const successMessage = document.getElementById('successMessage');

    yesBtn.addEventListener('click', () => {
        if (window.playBackgroundMusic) window.playBackgroundMusic();

        // Trigger Canvas Confetti Burst
        if (typeof confetti === 'function') {
            const duration = 4 * 1000;
            const end = Date.now() + duration;

            (function frame() {
                confetti({
                    particleCount: 7,
                    angle: 60,
                    spread: 65,
                    origin: { x: 0, y: 0.7 },
                    colors: ['#f43f5e', '#fb7185', '#ffffff', '#e11d48']
                });
                confetti({
                    particleCount: 7,
                    angle: 120,
                    spread: 65,
                    origin: { x: 1, y: 0.7 },
                    colors: ['#f43f5e', '#fb7185', '#ffffff', '#e11d48']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        }

        // Fade out question & buttons
        gsap.to(proposalContent, {
            opacity: 0,
            y: -20,
            duration: 0.6,
            onComplete: () => {
                proposalContent.classList.add('hidden');

                // Show success celebration message
                successMessage.classList.remove('hidden');
                successMessage.classList.add('flex');
                gsap.fromTo(successMessage,
                    { opacity: 0, scale: 0.85 },
                    { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" }
                );
            }
        });
    });
}
