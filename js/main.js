import { showScreen } from "./router.js";
import { enableMenuBackground, disableMenuBackground } from "./ui.js";
import {
  unlockAndStart,
  toggleMute,
  isUnlocked,
  isMuted,
  getTargetVolume,
  pauseOnHidden
} from "./audio.js";
import { startScene1 } from "./scenes/scene1.js";

const audioHint = document.getElementById("audioHint");
const loginMsg = document.getElementById("loginMsg");

// Fade + Audio DOM
const fadeEl = document.getElementById("fade");
const music = document.getElementById("music");       // musique menu
const ambience = document.getElementById("ambience"); // ambiance scène 1

// Buttons
const btnGuest = document.getElementById("btnGuest");
const btnLogin = document.getElementById("btnLogin");

const btnBackToGate = document.getElementById("btnBackToGate");
const btnSubmitLogin = document.getElementById("btnSubmitLogin");

const btnStart = document.getElementById("btnStart");
const btnOptions = document.getElementById("btnOptions");
const btnQuit = document.getElementById("btnQuit");
const btnSound = document.getElementById("btnSound");
const btnFullscreen = document.getElementById("btnFullscreen");

/* -----------------------------
   Fullscreen
----------------------------- */
async function enterFullscreen() {
  const el = document.documentElement;
  try {
    await el.requestFullscreen();
  } catch (e) {
    console.warn("Impossible de passer en plein écran :", e);
  }
}

async function exitFullscreen() {
  try {
    await document.exitFullscreen();
  } catch (e) {
    console.warn("Impossible de quitter le plein écran :", e);
  }
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) await enterFullscreen();
  else await exitFullscreen();
}

function updateFullscreenButton() {
  if (!btnFullscreen) return;
  btnFullscreen.textContent = document.fullscreenElement
    ? "🗗 Quitter plein écran"
    : "⛶ Plein écran";
}

if (btnFullscreen) {
  btnFullscreen.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  updateFullscreenButton();
}

/* -----------------------------
   Sound UI
----------------------------- */
function refreshSoundUI() {
  if (!btnSound) return;
  if (!isUnlocked()) btnSound.textContent = "Son : …";
  else if (isMuted()) btnSound.textContent = "Son : muet";
  else btnSound.textContent = `Son : actif (${Math.round(getTargetVolume() * 100)}%)`;
}

async function tryUnlock() {
  const ok = await unlockAndStart();

  // mémorise le volume menu pour le crossfade
  if (ok && music) music._baseVol = music.volume;

  if (audioHint) {
    audioHint.textContent = ok
      ? "Son : actif"
      : "Son : bloqué (autorise l’audio dans le navigateur).";
  }
  refreshSoundUI();
  return ok;
}

/* -----------------------------
   Fade + Crossfade helpers
----------------------------- */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fadeToBlack(ms = 900) {
  if (!fadeEl) return;
  fadeEl.classList.add("on");
  await sleep(ms);
}

async function fadeFromBlack(ms = 650) {
  if (!fadeEl) return;
  fadeEl.classList.remove("on");
  await sleep(ms);
}

async function crossfade(
  outAudio,
  inAudio,
  { durationMs = 1200, targetIn = 0.45 } = {}
) {
  const steps = 30;
  const stepMs = Math.max(20, Math.floor(durationMs / steps));

  // Démarre l'audio entrant (doit rester dans un geste utilisateur)
  if (inAudio) {
    try {
      inAudio.volume = 0;
      await inAudio.play();
    } catch (e) {
      console.warn("Audio scene bloqué :", e);
    }
  }

  const outBase = outAudio ? (outAudio._baseVol ?? outAudio.volume ?? 0.4) : 0;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    if (outAudio) outAudio.volume = Math.max(0, (1 - t) * outBase);
    if (inAudio) inAudio.volume = Math.min(targetIn, t * targetIn);

    await sleep(stepMs);
  }

  if (outAudio) {
    outAudio.pause();
    outAudio.currentTime = 0;
  }
}

/* -----------------------------
   Gate actions
----------------------------- */
if (btnGuest) {
  btnGuest.addEventListener("click", async () => {
    await tryUnlock();
    enableMenuBackground();
    showScreen("menu");
  });
}

if (btnLogin) {
  btnLogin.addEventListener("click", async () => {
    await tryUnlock();
    disableMenuBackground();
    showScreen("login");
    if (loginMsg) loginMsg.textContent = "";
  });
}

/* -----------------------------
   Login actions (prototype)
----------------------------- */
if (btnBackToGate) {
  btnBackToGate.addEventListener("click", () => {
    disableMenuBackground();
    showScreen("gate");
  });
}

if (btnSubmitLogin) {
  btnSubmitLogin.addEventListener("click", () => {
    const email = document.getElementById("email")?.value.trim();
    const pwd = document.getElementById("password")?.value;

    if (!email || !pwd) {
      if (loginMsg) loginMsg.textContent = "Renseigne un email et un mot de passe.";
      return;
    }

    if (loginMsg) loginMsg.textContent = "Connexion… (prototype)";

    setTimeout(() => {
      if (loginMsg) loginMsg.textContent = "";
      enableMenuBackground();
      showScreen("menu");
    }, 400);
  });
}

/* -----------------------------
   Menu actions
----------------------------- */
if (btnStart) {
  btnStart.addEventListener("click", async () => {
    // S'assure que l'audio est débloqué, sinon le crossfade peut être bloqué
    if (!isUnlocked()) await tryUnlock();

    // Fade noir
    await fadeToBlack(900);

    // Crossfade musique menu -> ambience scène 1
    await crossfade(music, ambience, { durationMs: 1200, targetIn: 0.45 });

    // Lance la scène 1 (tu peux aussi switcher vers un screen "scene1" si tu en as un)
    startScene1();

    // Fade retour
    await fadeFromBlack(650);
  });
}

if (btnOptions) {
  btnOptions.addEventListener("click", () => {
    alert("Options: volume, vitesse texte, etc. (à faire).");
  });
}

if (btnQuit) {
  btnQuit.addEventListener("click", () => {
    alert("Pour quitter, tu peux fermer l’onglet/la fenêtre.");
  });
}

if (btnSound) {
  btnSound.addEventListener("click", async () => {
    if (!isUnlocked()) await tryUnlock();
    else toggleMute();
    refreshSoundUI();
  });
}

/* -----------------------------
   Init
----------------------------- */
pauseOnHidden();
disableMenuBackground();
showScreen("gate");
refreshSoundUI();
