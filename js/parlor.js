const cardScene = document.getElementById("cardScene");
const magicCard = document.getElementById("magicCard");
const flyingBook = document.getElementById("flyingBook");
const flashOverlay = document.getElementById("flash-overlay");
const riffleStack = document.getElementById("riffleStack");
const body = document.body;

function fitCardToFrontImage() {
    const front = document.querySelector(".card-front img");
    if (!front) return;
    const apply = () => {
        if (!front.naturalWidth || front.naturalWidth <= front.naturalHeight) return;
        const width = "min(560px, 88vw)";
        cardScene.style.width = width;
        cardScene.style.height = `calc(${width} * ${front.naturalHeight} / ${front.naturalWidth})`;
    };
    if (front.complete) apply();
    else front.addEventListener("load", apply, { once: true });
}

fitCardToFrontImage();

const gateDialog = document.getElementById("gateDialog");
const gateForm = document.getElementById("gateForm");
const gateAnswer = document.getElementById("gateAnswer");
const gateError = document.getElementById("gateError");
const gateQuestion = document.getElementById("gateQuestion");
const gateSubmit = document.getElementById("gateSubmit");

let sequenceStarted = false;
let bookWaiting = false;
let bookOpened = false;
let isRedirectReady = false;
let redirecting = false;

const TOTAL_RIFFLE_PAGES = 24;
const leafElements = [];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const pageTexts = [
    ["Libro I: Shadow Manuscripts", "Arcana VII: The Alchemist's Seal"],
    ["Ch. II: Baker Street Gaslight", "Ch. III: The Fog of Westminster"],
    ["Obsidian Oracles & Symbols", "Transmutation of Lead to Gold"],
    ["Chronicles of Old Thames", "Phantasmagoria & Mirrors"],
    ["Spirits of Victorian Parlors", "The Celestial Astrolabe"],
    ["Ch. X: The Etheric Passage", "Ch. XI: Beyond the Stone Portal"]
];

function build3DRiffleDeck() {
    riffleStack.innerHTML = "";
    for (let i = 0; i < TOTAL_RIFFLE_PAGES; i++) {
        const leaf = document.createElement("div");
        leaf.className = "riffle-leaf";

        const initialZ = (TOTAL_RIFFLE_PAGES - i) * 0.45;
        leaf.style.zIndex = String(50 + (TOTAL_RIFFLE_PAGES - i));
        leaf.style.transform = `rotateY(0deg) translateZ(${initialZ}px)`;

        const samplePair = pageTexts[i % pageTexts.length];
        const front = document.createElement("div");
        front.className = "riffle-leaf-front";
        const back = document.createElement("div");
        back.className = "riffle-leaf-back";

        const wrapper = document.createElement("div");
        wrapper.className = "leaf-inner-wrapper";

        front.appendChild(strongLine(samplePair[0]));
        front.appendChild(leafCopy("Incantatio antiqua Et per saecula futurus. Umbra et lux in nocte..."));
        front.appendChild(pageNumber(String(i * 2 + 1), "right"));

        back.appendChild(strongLine(samplePair[1]));
        back.appendChild(leafCopy("The portal has been closed for many years."));
        back.appendChild(leafCopy("It is said to hold the secrets of the universe that has been long lost to time."));
        back.appendChild(leafCopy("The portal is guarded by an ancient riddle that only the wise can solve."));
        back.appendChild(leafCopy("Upon her twenty-third birthday, the girl will know the password And the portal will once again be opened."));
        back.appendChild(pageNumber(String(i * 2 + 2), "left"));

        wrapper.append(front, back);
        leaf.appendChild(wrapper);
        riffleStack.appendChild(leaf);
        leafElements.push(leaf);
    }
}

function strongLine(text) {
    const node = document.createElement("strong");
    node.style.color = "#4a321a";
    node.textContent = text;
    return node;
}

function leafCopy(text) {
    const node = document.createElement("p");
    node.style.marginTop = "6px";
    node.style.opacity = "0.85";
    node.textContent = text;
    return node;
}

function pageNumber(text, side) {
    const node = document.createElement("div");
    node.style.position = "absolute";
    node.style.bottom = "8px";
    node.style[side] = "12px";
    node.style.fontSize = "0.6rem";
    node.style.color = "#8c6d33";
    node.textContent = text;
    return node;
}

build3DRiffleDeck();

let audioCtx = null;
const backgroundMusic = new Audio("music/Sunday Suspense - Sound Effects .mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.15;

function startBackgroundMusic() {
    const play = backgroundMusic.play();
    if (play) play.catch((error) => console.error(error));
}

function stopBackgroundMusic() {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

function initAudio() {
    if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtx = new Ctx();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

function playWhooshSound(duration = 0.2, startFreq = 200, endFreq = 800) {
    if (!audioCtx) return;
    try {
        const bufferSize = audioCtx.sampleRate * duration;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = "bandpass";
        filter.Q.value = 3;
        filter.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 50), audioCtx.currentTime + duration);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + duration * 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start();
    } catch (error) {
        console.error(error);
    }
}

function playTexturedPaperSnap(leafIndex, totalLeaves) {
    if (!audioCtx) return;
    try {
        const duration = 0.025 + Math.random() * 0.015;
        const bufferSize = Math.floor(audioCtx.sampleRate * duration);
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const baseFreq = 1400 + (leafIndex / totalLeaves) * 1200;
        const pitchJitter = (Math.random() - 0.5) * 300;

        const filter = audioCtx.createBiquadFilter();
        filter.type = "bandpass";
        filter.Q.value = 2.5;
        filter.frequency.setValueAtTime(baseFreq + pitchJitter, audioCtx.currentTime);

        const gain = audioCtx.createGain();
        const volume = 0.14 + Math.random() * 0.08;
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start();
    } catch (error) {
        console.error(error);
    }
}

function triggerAcceleratingWhooshes() {
    const totalDuration = 3.2;
    const totalFlips = 12;
    for (let i = 1; i <= totalFlips; i++) {
        const tRatio = Math.sqrt(i / totalFlips);
        const timeDelay = tRatio * totalDuration * 1000;
        window.setTimeout(() => {
            const startF = 150 + i * 80;
            const endF = 400 + i * 150;
            const dur = Math.max(0.08, 0.3 - i * 0.015);
            playWhooshSound(dur, startF, endF);
        }, timeDelay);
    }
}

function landedTransform(idx) {
    return `translateZ(${0.5 + idx * 0.4}px) rotateY(-180deg)`;
}

function triggerDramatic3DRiffleSequence() {
    const totalLeaves = leafElements.length;
    const riffleDurationMs = 1400;
    const interval = riffleDurationMs / totalLeaves;

    flyingBook.classList.add("is-vibrating");

    leafElements.forEach((leaf, idx) => {
        const delay = idx * interval;
        window.setTimeout(() => {
            leaf.style.zIndex = String(4000 + idx);
            leaf.classList.add("is-arching");
            playTexturedPaperSnap(idx, totalLeaves);

            window.setTimeout(() => {
                leaf.style.zIndex = String(200 + idx);
                leaf.style.transform = landedTransform(idx);
                leaf.classList.remove("is-arching");
                leaf.classList.add("is-flipped");
            }, 220);
        }, delay);
    });

    window.setTimeout(() => {
        flyingBook.classList.remove("is-vibrating");
    }, riffleDurationMs + 450);
}

function settleLeaves() {
    leafElements.forEach((leaf, idx) => {
        leaf.style.zIndex = String(200 + idx);
        leaf.style.transform = landedTransform(idx);
        leaf.classList.add("is-flipped");
    });
}

function armClosedBook() {
    bookWaiting = true;
    flyingBook.tabIndex = 0;
    flyingBook.setAttribute("role", "button");
    flyingBook.setAttribute("aria-label", "Open the book");
    flyingBook.removeAttribute("aria-hidden");
}

function openTheBook() {
    if (!bookWaiting || bookOpened || redirecting) return;
    bookOpened = true;
    flyingBook.classList.add("open-book");
    if (reduceMotion) {
        settleLeaves();
        armPassage();
        return;
    }
    playTexturedPaperSnap(0, TOTAL_RIFFLE_PAGES);
    window.setTimeout(triggerDramatic3DRiffleSequence, 500);
    window.setTimeout(() => {
        flyingBook.classList.add("book-floating");
        armPassage();
    }, 2300);
}

function armPassage() {
    isRedirectReady = true;
    flyingBook.tabIndex = 0;
    flyingBook.setAttribute("role", "link");
    flyingBook.setAttribute("aria-label", "Answer the book's question");
    flyingBook.removeAttribute("aria-hidden");
}

function startMagicSequence() {
    if (sequenceStarted) return;
    sequenceStarted = true;
    initAudio();
    startBackgroundMusic();

    if (reduceMotion) {
        cardScene.style.opacity = "0";
        cardScene.style.pointerEvents = "none";
        cardScene.setAttribute("aria-hidden", "true");
        body.classList.add("era-london");
        flyingBook.classList.add("active-book");
        armClosedBook();
        return;
    }

    magicCard.classList.add("card-accelerating-spin");
    triggerAcceleratingWhooshes();

    window.setTimeout(() => {
        flashOverlay.classList.add("flash-active");
        cardScene.style.opacity = "0";
        cardScene.style.pointerEvents = "none";
        cardScene.setAttribute("aria-hidden", "true");
    }, 3100);

    window.setTimeout(() => {
        body.classList.add("era-london");
    }, 3580);

    window.setTimeout(() => {
        flyingBook.classList.add("active-book");
    }, 3600);

    window.setTimeout(() => {
        armClosedBook();
    }, 5200);
}

function bytesFromBase64(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function allowedDestination(url) {
    let parsed;
    try {
        parsed = new URL(url, window.location.href);
    } catch (error) {
        return false;
    }
    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(url);
    if (hasScheme) {
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    }
    return parsed.origin === window.location.origin;
}

async function unsealDestination(answer) {
    const material = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(answer.trim().toLowerCase()),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: bytesFromBase64(GATE.salt),
            iterations: GATE.iterations,
            hash: "SHA-256"
        },
        material,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
    );
    const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: bytesFromBase64(GATE.iv) },
        key,
        bytesFromBase64(GATE.ciphertext)
    );
    return new TextDecoder().decode(plain);
}

function openGate() {
    if (!isRedirectReady || redirecting || gateDialog.open) return;
    gateError.hidden = true;
    gateAnswer.value = "";
    gateDialog.showModal();
    gateAnswer.focus();
}

function depart(url) {
    redirecting = true;
    if (gateDialog.open) gateDialog.close();
    try {
        sessionStorage.setItem("parlor-passage", "1");
    } catch (error) {
        console.error(error);
    }
    stopBackgroundMusic();
    if (reduceMotion) {
        window.location.href = url;
        return;
    }
    flyingBook.classList.remove("book-floating");
    flyingBook.style.transition = "transform 0.6s ease, opacity 0.6s ease";
    flyingBook.style.transform = "translateX(-50%) scale(1.35) rotateZ(4deg)";
    flyingBook.style.opacity = "0";
    window.setTimeout(() => {
        window.location.href = url;
    }, 600);
}

function passThrough() {
    openGate();
}

gateQuestion.textContent = GATE.question;

gateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (redirecting) return;
    gateError.hidden = true;
    gateSubmit.disabled = true;
    try {
        const url = await unsealDestination(gateAnswer.value);
        if (!allowedDestination(url)) {
            gateError.hidden = false;
            gateAnswer.focus();
            return;
        }
        depart(url);
    } catch (error) {
        gateError.hidden = false;
        gateAnswer.focus();
        gateAnswer.select();
    } finally {
        if (!redirecting) gateSubmit.disabled = false;
    }
});

document.getElementById("gateClose").addEventListener("click", () => {
    gateDialog.close();
});

window.addEventListener("click", (event) => {
    if (!sequenceStarted) {
        startMagicSequence();
        return;
    }
    if (!flyingBook.contains(event.target)) return;
    if (!bookOpened) {
        openTheBook();
        return;
    }
    passThrough();
});

window.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    if (!sequenceStarted) {
        event.preventDefault();
        startMagicSequence();
        return;
    }

    if (document.activeElement === flyingBook) {
        event.preventDefault();
        if (!bookOpened) {
            openTheBook();
            return;
        }
        passThrough();
    }
});
