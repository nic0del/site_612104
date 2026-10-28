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
import { startScene2 } from "./scenes/scene2.js?v=c2-paragraphes-1";
const gameState = {};
import {
  startGuestSession,
  startAccountSession,
  playerState,
  unlockNovelChapter,
  isNovelChapterUnlocked
} from "./state.js";
import { supabase } from "./supabase.js";
import { renderChapterMap } from "./chapterMap.js";
import { novelBonusTexts, novelBonusChapters } from "./bonusTexts.js";

/* -----------------------------
   DOM
----------------------------- */
const DOM = {
  // messages
  audioHint: document.getElementById("audioHint"),
  loginMsg: document.getElementById("loginMsg"),
  signupMsg: document.getElementById("signupMsg"),
  welcomeUser: document.getElementById("welcomeUser"),
  scenePlayerName: document.getElementById("scenePlayerName"),
  novelReaderTheme: document.getElementById("novelReaderTheme"),

  // overlays / audio
  fade: document.getElementById("fade"),
  music: document.getElementById("music"),
  scene1Impact: document.getElementById("scene1Impact"),
scene1RubbleAmbience: document.getElementById("scene1RubbleAmbience"),
scene1FamilyTheme: document.getElementById("scene1FamilyTheme"),
scene1FirehouseAmbience: document.getElementById("scene1FirehouseAmbience"),
scene1TvAmbience: document.getElementById("scene1TvAmbience"),
scene1PoliticalAmbience: document.getElementById("scene1PoliticalAmbience"),
chapter1MapTheme: document.getElementById("chapter1MapTheme"),

  // login
  emailInput: document.getElementById("email"),
  passwordInput: document.getElementById("password"),

  // signup
  signupUsernameInput: document.getElementById("signupUsername"),
  signupEmailInput: document.getElementById("signupEmail"),
  signupPasswordInput: document.getElementById("signupPassword"),

  // gate / menu / auth buttons
  btnGuest: document.getElementById("btnGuest"),
  btnLogin: document.getElementById("btnLogin"),
  btnGoSignup: document.getElementById("btnGoSignup"),
  btnBackToGate: document.getElementById("btnBackToGate"),
  btnBackToLogin: document.getElementById("btnBackToLogin"),
  btnSubmitLogin: document.getElementById("btnSubmitLogin"),
  btnSubmitSignup: document.getElementById("btnSubmitSignup"),
  btnForgotPassword: document.getElementById("btnForgotPassword"),
  btnStart: document.getElementById("btnStart"),
  btnNewGame: document.getElementById("btnNewGame"),
  btnSupport: document.getElementById("btnSupport"),
  btnOpenBonus: document.getElementById("btnOpenBonus"),
  btnChapterEndBonus: document.getElementById("btnChapterEndBonus"),
  bonusNovelList: document.getElementById("bonusNovelList"),
  btnBonusBack: document.getElementById("btnBonusBack"),
  btnChapterEndNext: document.getElementById("btnChapterEndNext"),
  btnChapterEndMenu: document.getElementById("btnChapterEndMenu"),
  btnChapterEndSupport: document.getElementById("btnChapterEndSupport"),
  btnCloseNovel: document.getElementById("btnCloseNovel"),
  novelReaderTitle: document.getElementById("novelReaderTitle"),
  novelReaderText: document.getElementById("novelReaderText"),
  btnOptions: document.getElementById("btnOptions"),
  btnQuit: document.getElementById("btnQuit"),
  btnSound: document.getElementById("btnSound"),
  btnFullscreen: document.getElementById("btnFullscreen"),
  btnCopyGameLink: document.getElementById("btnCopyGameLink"),
  btnSupportFeedback: document.getElementById("btnSupportFeedback"),
  btnSupportBack: document.getElementById("btnSupportBack"),
  supportCopyMsg: document.getElementById("supportCopyMsg"),

  // in-game buttons
  btnGameFullscreen: document.getElementById("btnGameFullscreen"),
  btnGameHome: document.getElementById("btnGameHome")
};

let pendingMode = "guest"; // "guest" | "account"

/* -----------------------------
   Utils
----------------------------- */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setLoginMessage(message = "") {
  if (DOM.loginMsg) DOM.loginMsg.textContent = message;
}

function setSignupMessage(message = "") {
  if (DOM.signupMsg) DOM.signupMsg.textContent = message;
}

function setAudioHint(message = "") {
  if (DOM.audioHint) DOM.audioHint.textContent = message;
}

/* -----------------------------
   Fade helpers
----------------------------- */
async function fadeToBlack(ms = 900) {
  if (!DOM.fade) return;
  DOM.fade.classList.add("on");
  await sleep(ms);
}

async function fadeFromBlack(ms = 650) {
  if (!DOM.fade) return;
  DOM.fade.classList.remove("on");
  await sleep(ms);
}

async function transitionTo(screenName) {
  await fadeToBlack(300);
  showScreen(screenName);
  await fadeFromBlack(300);
}

/* -----------------------------
   Fullscreen
----------------------------- */
async function enterFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  } catch (error) {
    console.warn("Impossible de passer en plein écran :", error);
  }
}

async function exitFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.warn("Impossible de quitter le plein écran :", error);
  }
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await enterFullscreen();
  } else {
    await exitFullscreen();
  }
}

function updateFullscreenButton() {
  if (!DOM.btnFullscreen) return;
  DOM.btnFullscreen.textContent = document.fullscreenElement
    ? "🗗 Quitter plein écran"
    : "⛶ Plein écran";
}

function updateGameFullscreenButton() {
  if (!DOM.btnGameFullscreen) return;
  DOM.btnGameFullscreen.textContent = document.fullscreenElement
    ? "🗗 Quitter plein écran"
    : "⛶ Plein écran";
}

/* -----------------------------
   Sound UI
----------------------------- */
function refreshSoundUI() {
  if (!DOM.btnSound) return;

  if (!isUnlocked()) {
    DOM.btnSound.textContent = "Son : …";
    return;
  }

  if (isMuted()) {
    DOM.btnSound.textContent = "Son : muet";
    return;
  }

  DOM.btnSound.textContent = `Son : actif (${Math.round(getTargetVolume() * 100)}%)`;
}

async function tryUnlock() {
  const ok = await unlockAndStart();

  if (ok && DOM.music) {
    DOM.music._baseVol = DOM.music.volume;
  }

  setAudioHint(
    ok
      ? "Son : actif"
      : "Son : bloqué (autorise l’audio dans le navigateur)."
  );

  refreshSoundUI();
  return ok;
}

/* -----------------------------
   Audio crossfade
----------------------------- */
async function crossfade(outAudio, inAudio, { durationMs = 1200, targetIn = 0.45 } = {}) {
  const steps = 30;
  const stepMs = Math.max(20, Math.floor(durationMs / steps));

  if (inAudio) {
    try {
      inAudio.currentTime = 0;
      inAudio.volume = 0;
      await inAudio.play();
    } catch (error) {
      console.warn("Audio entrant bloqué :", error);
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
    outAudio.volume = outBase;
  }
}

/* -----------------------------
   Supabase auth / profile
----------------------------- */
async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

async function getUsername() {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Erreur récupération pseudo :", error);
    return null;
  }

  return data?.username ?? null;
}

async function ensureProfile() {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (data) return true;

  return false;
}

async function updateUserLabels() {
  let username = "invité";

  if (pendingMode === "account") {
    const dbUsername = await getUsername();
    if (dbUsername) username = dbUsername;
  }

  const welcomeLabel = `Bienvenue, ${username}`;

  if (DOM.welcomeUser) {
    DOM.welcomeUser.textContent = welcomeLabel;
  }

  if (DOM.scenePlayerName) {
    DOM.scenePlayerName.textContent = welcomeLabel;
  }
}

/* -----------------------------
   Save / Load
----------------------------- */
async function saveGame(sceneId, currentPlayerState) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Pas connecté");

  const { error } = await supabase
    .from("saves")
    .upsert(
      {
        user_id: user.id,
        scene_text: sceneId,
        player_state: currentPlayerState,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "user_id"
      }
    );

  if (error) throw error;

  console.log("SAVE:", sceneId, currentPlayerState);
}

window.saveGame = saveGame;

async function loadGame() {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("saves")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  console.log("LOAD:", data);
  return data;
}

/* -----------------------------
   Navigation helpers
----------------------------- */
function goToGate() {
  disableMenuBackground();
  showScreen("gate");
  setLoginMessage("");
  setSignupMessage("");
}

function goToLogin() {
  disableMenuBackground();
  showScreen("login");
  setLoginMessage("");
  setSignupMessage("");
}

function goToSignup() {
  disableMenuBackground();
  showScreen("signup");
  setLoginMessage("");
  setSignupMessage("");
}

async function goToMenu() {
  enableMenuBackground();
  showScreen("menu");
  setLoginMessage("");
  setSignupMessage("");
  await updateUserLabels();

  ensureBonusState();
  updateBonusUI();
}

/* -----------------------------
   Scene audio zones
----------------------------- */

let currentSceneMusicZone = "none";

function setAudioBaseVolume(audio, volume) {
  if (!audio) return;
  audio._baseVol = volume;
  audio.volume = volume;
}

function stopAudio(audio) {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

function stopScene1Audios() {
  stopAudio(DOM.music);
  stopAudio(DOM.scene1Impact);
  stopAudio(DOM.scene1RubbleAmbience);
  stopAudio(DOM.scene1FamilyTheme);
  stopAudio(DOM.scene1FirehouseAmbience);
  stopAudio(DOM.scene1TvAmbience);
  stopAudio(DOM.scene1PoliticalAmbience);
  stopAudio(DOM.chapter1MapTheme);
  stopAudio(DOM.novelReaderTheme);
}

async function playOneShot(audio, volume = 1) {
  if (!audio) return;

  try {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = volume;
    await audio.play();
  } catch (error) {
    console.warn("Son ponctuel bloqué :", error);
  }
}

function getAudioForScene1Zone(zone) {
  const zones = {
    rubble: DOM.scene1RubbleAmbience,
    family: DOM.scene1FamilyTheme,
    firehouse: DOM.scene1FirehouseAmbience,
    tv: DOM.scene1TvAmbience,
    political: DOM.scene1PoliticalAmbience,
    map: DOM.chapter1MapTheme
  };

  return zones[zone] || null;
}

function getVolumeForScene1Zone(zone) {
  const volumes = {
    rubble: 0.22,
    family: 0.26,
    firehouse: 0.26,
    tv: 0.18,
    political: 0.22,
    map: 0.30
  };

  return volumes[zone] ?? 0.30;
}

async function switchScene1MusicZone(zone) {
  if (currentSceneMusicZone === zone) return;

  const inAudio = getAudioForScene1Zone(zone);
  const targetIn = getVolumeForScene1Zone(zone);

  const allSceneAudios = [
    DOM.scene1RubbleAmbience,
    DOM.scene1FamilyTheme,
    DOM.scene1FirehouseAmbience,
    DOM.scene1TvAmbience,
    DOM.scene1PoliticalAmbience,
    DOM.chapter1MapTheme
  ];

  // Sécurité : on coupe tout ce qui n’est pas la nouvelle zone.
  for (const audio of allSceneAudios) {
    if (audio && audio !== inAudio) {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = audio._baseVol ?? audio.volume ?? 0.3;
    }
  }

  currentSceneMusicZone = zone;

  if (!inAudio) return;

  try {
    inAudio.currentTime = 0;
    inAudio.volume = 0;
    await inAudio.play();
  } catch (error) {
    console.warn("Audio entrant bloqué :", error);
    return;
  }

  const steps = 18;
  const stepMs = 30;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    inAudio.volume = targetIn * t;
    await sleep(stepMs);
  }

  setAudioBaseVolume(inAudio, targetIn);
}

function getScene1MusicZoneFromNode(node) {
  if (!node) return "rubble";

  if (node.visualFx === "homeWarm") {
    return "family";
  }

  if (node.visualFx === "firehouseCold") {
    return "firehouse";
  }

  if (node.visualFx === "tvBlue") {
    return "tv";
  }

  if (node.visualFx === "streetCold") {
  return "political";
}

if (node.visualFx === "ligueRed") {
  return "political";
}

return "rubble";
}

let lastScreenBeforeBonus = "menu";

function hasNovelChapterText(chapterId) {
  return !!novelBonusTexts[chapterId]?.body;
}

function renderBonusScreen() {
  if (!DOM.bonusNovelList) return;

  DOM.bonusNovelList.innerHTML = "";

  for (const chapter of novelBonusChapters) {
    const unlocked = isNovelChapterUnlocked(chapter.id);
    const hasText = hasNovelChapterText(chapter.id);

    const button = document.createElement("button");
    button.className = "bonusNovelButton";

    if (!unlocked) {
      button.textContent = `🔒 ${chapter.title}`;
      button.classList.add("locked");
      button.disabled = true;
    } else if (!hasText) {
      button.textContent = `✓ ${chapter.title} — texte à venir`;
      button.classList.add("unavailable");
      button.disabled = true;
    } else {
      button.textContent = `📖 ${chapter.title}`;
      button.addEventListener("click", () => {
        openNovelChapter(chapter.id, "bonus");
      });
    }

    DOM.bonusNovelList.appendChild(button);
  }
}

function openBonusPage(returnScreen = "menu") {
  lastScreenBeforeBonus = returnScreen;
  renderBonusScreen();
  showScreen("bonus");
}

function closeBonusPage() {
  showScreen(lastScreenBeforeBonus);
}

function ensureBonusState() {
  renderBonusScreen();
}

function unlockBonusChapter1() {
  unlockNovelChapter("chapter1");
  renderBonusScreen();
}

function updateBonusUI() {
  renderBonusScreen();
}

/* -----------------------------
   Game enter / leave
----------------------------- */

async function launchScene1() {
  if (!isUnlocked()) {
    await tryUnlock();
  }

  if (pendingMode === "guest") {
    startGuestSession();
  } else {
    startAccountSession();
  }

  currentSceneMusicZone = "none";
  stopScene1Audios();

  await updateUserLabels();
  await fadeToBlack(900);

  disableMenuBackground();
  showScreen("scene1");

  if (DOM.music) {
    DOM.music.pause();
    DOM.music.currentTime = 0;
  }

  await playOneShot(DOM.scene1Impact, 1);
  await switchScene1MusicZone("rubble");

  await fadeFromBlack(650);

  if (pendingMode === "account") {
    const save = await loadGame();

    if (save) {
      Object.assign(playerState, save.player_state || {});
      Object.assign(gameState, save.player_state || {});
    }
  }

  startScene1(gameState, {
    mount: document.getElementById("screen-scene1"),

    beforeRender: async ({ node }) => {
      const zone = getScene1MusicZoneFromNode(node);
      await switchScene1MusicZone(zone);
    },

    onChapterEnd: async ({ chapterId, scene, map }) => {
      await switchScene1MusicZone("map");

      renderChapterMap({
  map,
  scene,
  onContinue: async () => {
    unlockBonusChapter1();

    if (pendingMode === "account") {
      try {
        await saveGame("chapter1_end", playerState);
      } catch (error) {
        console.warn("Sauvegarde du bonus impossible :", error);
      }
    }

    currentSceneMusicZone = "none";
    showScreen("chapter-end");
  }
});
    },

    onStateChange: (progress) => {
      console.log("Progression chapitre 1 :", progress);
    }
  });
}

async function launchScene2Test() {
  if (!isUnlocked()) {
    await tryUnlock();
  }

  currentSceneMusicZone = "none";
  stopScene1Audios();
  stopAudio(DOM.music);

  await updateUserLabels();
  await fadeToBlack(900);

  disableMenuBackground();
  showScreen("scene1");

  stopAudio(DOM.music);

  if (DOM.music) {
    DOM.music.pause();
    DOM.music.currentTime = 0;
  }

  await switchScene1MusicZone("rubble");
  await fadeFromBlack(650);

  startScene2(gameState, {
    mount: document.getElementById("screen-scene1"),

    beforeRender: async ({ node }) => {
      const zone = getScene1MusicZoneFromNode(node);
      await switchScene1MusicZone(zone);
    },

    onChapterEnd: async ({ chapterId, scene, map }) => {
      await switchScene1MusicZone("map");

      renderChapterMap({
        map,
        scene,
        onContinue: async () => {
          currentSceneMusicZone = "none";
          stopScene1Audios();
          enableMenuBackground();
          await goToMenu();
        }
      });
    },

    onStateChange: (progress) => {
      console.log("Progression chapitre 2 :", progress);
    }
  });
}

async function launchScene2({ reset = false } = {}) {
  if (!isUnlocked()) {
    await tryUnlock();
  }

  if (reset) {
    delete gameState.scene2;
  }

  currentSceneMusicZone = "none";
  stopScene1Audios();
  stopAudio(DOM.music);

  await updateUserLabels();
  await fadeToBlack(900);

  disableMenuBackground();
  showScreen("scene1");

  stopAudio(DOM.music);

  await switchScene1MusicZone("rubble");
  await fadeFromBlack(650);

  startScene2(gameState, {
    mount: document.getElementById("screen-scene1"),

    beforeRender: async ({ node }) => {
      const zone = getScene1MusicZoneFromNode(node);
      await switchScene1MusicZone(zone);
    },

    onChapterEnd: async ({ chapterId, scene, map }) => {
      await switchScene1MusicZone("map");

      renderChapterMap({
        map,
        scene,
        onContinue: async () => {
          currentSceneMusicZone = "none";
          stopScene1Audios();
          enableMenuBackground();
          await goToMenu();
        }
      });
    },

    onStateChange: (progress) => {
      console.log("Progression chapitre 2 :", progress);
    }
  });
}

window.launchScene2Test = launchScene2Test;

window.resetScene2Test = () => {
  delete gameState.scene2;
  console.log("Progression chapitre 2 réinitialisée pour le test.");
};

async function leaveGameToGate() {
  stopScene1Audios();
  currentSceneMusicZone = "none";

  disableMenuBackground();
  setLoginMessage("");
  setSignupMessage("");

  await transitionTo("gate");
}

let lastScreenBeforeNovel = "menu";

function openNovelChapter(chapterId, returnScreen = "menu") {
  const bonus = novelBonusTexts[chapterId];

  if (!bonus) {
    console.warn("Bonus introuvable :", chapterId);
    return;
  }

  lastScreenBeforeNovel = returnScreen;

  stopAudio(DOM.chapter1MapTheme);
  stopAudio(DOM.music);

  if (DOM.novelReaderTitle) {
    DOM.novelReaderTitle.textContent = bonus.title;
  }

  if (DOM.novelReaderText) {
    DOM.novelReaderText.innerHTML = bonus.body
      .split(/\n\s*\n/g)
      .map((paragraph) => `<p>${paragraph.trim()}</p>`)
      .join("");
  }

  if (DOM.novelReaderTheme) {
    DOM.novelReaderTheme.currentTime = 0;
    DOM.novelReaderTheme.volume = 0;

    DOM.novelReaderTheme.play()
      .then(async () => {
        const targetVolume = 0.14;
        const steps = 18;
        const stepMs = 30;

        for (let i = 0; i <= steps; i++) {
          DOM.novelReaderTheme.volume = targetVolume * (i / steps);
          await sleep(stepMs);
        }

        DOM.novelReaderTheme._baseVol = targetVolume;
      })
      .catch((error) => {
        console.warn("Musique bonus roman bloquée :", error);
      });
  }

  showScreen("novel-reader");
}

async function closeNovelReader() {
  if (lastScreenBeforeNovel === "menu") {
    await crossfade(DOM.novelReaderTheme, DOM.music, {
      durationMs: 900,
      targetIn: 0.38
    });

    enableMenuBackground();
    await goToMenu();
    return;
  }

  if (DOM.novelReaderTheme) {
    await crossfade(DOM.novelReaderTheme, null, {
      durationMs: 900,
      targetIn: 0
    });
  }

  showScreen(lastScreenBeforeNovel);
}

function resetGameStateForNewGame() {
  gameState.scene1 = {
    currentNodeId: null,
    visitedNodes: [],
    visitedSet: {},
    flags: {},
    ended: false
  };

  playerState.proudReason = null;
  playerState.beliefHelped = null;

  playerState.selfControl = 0;
  playerState.familyAnchor = 0;
  playerState.dutyAnchor = 0;
  playerState.politicalLucidity = 0;
  playerState.tendernessToAngela = 0;
  playerState.traumaLoad = 0;
  playerState.stress = 0;
  playerState.memoryStability = 0;

  ensureBonusState();
}

let lastScreenBeforeSupport = "menu";

function openSupportPage(returnScreen = "menu") {
  lastScreenBeforeSupport = returnScreen;

  if (DOM.supportCopyMsg) {
    DOM.supportCopyMsg.textContent = "";
  }

  showScreen("support");
}

function closeSupportPage() {
  showScreen(lastScreenBeforeSupport);
}

/* -----------------------------
   Event bindings
----------------------------- */
if (DOM.btnGuest) {
  DOM.btnGuest.addEventListener("click", async () => {
    await tryUnlock();
    pendingMode = "guest";
    await transitionTo("menu");
    await goToMenu();
  });
}

if (DOM.btnLogin) {
  DOM.btnLogin.addEventListener("click", async () => {
    await tryUnlock();
    pendingMode = "account";
    await transitionTo("login");
    goToLogin();
  });
}

if (DOM.btnGoSignup) {
  DOM.btnGoSignup.addEventListener("click", async () => {
    await tryUnlock();
    await transitionTo("signup");
    goToSignup();
  });
}

if (DOM.btnBackToGate) {
  DOM.btnBackToGate.addEventListener("click", async () => {
    await transitionTo("gate");
    goToGate();
  });
}

if (DOM.btnBackToLogin) {
  DOM.btnBackToLogin.addEventListener("click", async () => {
    await transitionTo("gate");
    goToGate();
  });
}

if (DOM.btnSubmitSignup) {
  DOM.btnSubmitSignup.addEventListener("click", async () => {
    const username = DOM.signupUsernameInput?.value.trim() ?? "";
    const email = DOM.signupEmailInput?.value.trim() ?? "";
    const password = DOM.signupPasswordInput?.value ?? "";

    if (!username || !email || !password) {
      setSignupMessage("Remplis tous les champs.");
      return;
    }

    try {
      setSignupMessage("Création du profil...");

      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      const user = data.user;

      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            username
          });

        if (profileError) throw profileError;
      }

      setSignupMessage("Profil créé. Connecte-toi.");
      await transitionTo("login");
      goToLogin();
    } catch (error) {
      console.error(error);
      setSignupMessage(error.message || "Erreur création.");
    }
  });
}

if (DOM.btnSubmitLogin) {
  DOM.btnSubmitLogin.addEventListener("click", async () => {
    const email = DOM.emailInput?.value.trim() ?? "";
    const password = DOM.passwordInput?.value ?? "";

    if (!email || !password) {
      setLoginMessage("Renseigne un email et un mot de passe.");
      return;
    }

    try {
      setLoginMessage("Connexion...");
      await signInWithEmail(email, password);
      const hasProfile = await ensureProfile();

pendingMode = "account";

if (!hasProfile) {
  setLoginMessage("Compte trouvé, mais profil incomplet. Crée ou restaure un pseudo dans Supabase.");
  return;
}

setLoginMessage("Connexion réussie.");
await goToMenu();
    } catch (error) {
      console.error(error);
      setLoginMessage(error.message || "Connexion impossible.");
    }
  });
}

if (DOM.btnForgotPassword) {
  DOM.btnForgotPassword.addEventListener("click", async () => {
    const email = DOM.emailInput?.value.trim() ?? "";

    if (!email) {
      setLoginMessage("Renseigne ton email pour recevoir le lien.");
      return;
    }

    try {
      setLoginMessage("Envoi du mail de réinitialisation...");
      await sendPasswordReset(email);
      setLoginMessage("Mail envoyé si ce compte existe.");
    } catch (error) {
      console.error(error);
      setLoginMessage(error.message || "Impossible d'envoyer le mail.");
    }
  });
}

if (DOM.btnStart) {
  DOM.btnStart.addEventListener("click", async () => {
    await launchScene1();
  });
}

if (DOM.btnOptions) {
  DOM.btnOptions.addEventListener("click", () => {
    alert("Options : volume, vitesse du texte, accessibilité… (à faire)");
  });
}

if (DOM.btnQuit) {
  DOM.btnQuit.addEventListener("click", async () => {
    await transitionTo("gate");
    goToGate();
  });
}

if (DOM.btnSound) {
  DOM.btnSound.addEventListener("click", async () => {
    if (!isUnlocked()) {
      await tryUnlock();
    } else {
      toggleMute();
    }
    refreshSoundUI();
  });
}

if (DOM.btnFullscreen) {
  DOM.btnFullscreen.addEventListener("click", async () => {
    await toggleFullscreen();
    updateFullscreenButton();
    updateGameFullscreenButton();
  });
}

if (DOM.btnGameFullscreen) {
  DOM.btnGameFullscreen.addEventListener("click", async () => {
    await toggleFullscreen();
    updateFullscreenButton();
    updateGameFullscreenButton();
  });
}

if (DOM.btnGameHome) {
  DOM.btnGameHome.addEventListener("click", async () => {
    await leaveGameToGate();
  });
}

document.addEventListener("fullscreenchange", () => {
  updateFullscreenButton();
  updateGameFullscreenButton();
});

if (DOM.btnOpenBonus) {
  DOM.btnOpenBonus.addEventListener("click", () => {
    openBonusPage("menu");
  });
}

if (DOM.btnChapterEndBonus) {
  DOM.btnChapterEndBonus.addEventListener("click", () => {
    openBonusPage("chapter-end");
  });
}

if (DOM.btnBonusBack) {
  DOM.btnBonusBack.addEventListener("click", () => {
    closeBonusPage();
  });
}

if (DOM.btnChapterEndMenu) {
  DOM.btnChapterEndMenu.addEventListener("click", async () => {
    await crossfade(DOM.chapter1MapTheme, DOM.music, {
      durationMs: 1200,
      targetIn: 0.38
    });

    stopScene1Audios();
    currentSceneMusicZone = "none";

    enableMenuBackground();
    await goToMenu();
  });
}

if (DOM.btnChapterEndNext) {
  DOM.btnChapterEndNext.addEventListener("click", async () => {
    await launchScene2({ reset: true });
  });
}

if (DOM.btnNewGame) {
  DOM.btnNewGame.addEventListener("click", async () => {
    const confirmed = window.confirm(
      "Recommencer effacera ta progression actuelle du chapitre 1. Continuer ?"
    );

    if (!confirmed) return;

    resetGameStateForNewGame();

    if (pendingMode === "account") {
      try {
        await saveGame("new_game", playerState);
      } catch (error) {
        console.warn("Impossible d’écraser la sauvegarde :", error);
      }
    }

    await launchScene1();
  });
}

if (DOM.btnSupport) {
  DOM.btnSupport.addEventListener("click", () => {
    openSupportPage("menu");
  });
}

if (DOM.btnChapterEndSupport) {
  DOM.btnChapterEndSupport.addEventListener("click", () => {
    openSupportPage("chapter-end");
  });
}

if (DOM.btnCloseNovel) {
  DOM.btnCloseNovel.addEventListener("click", async () => {
    await closeNovelReader();
  });
}

if (DOM.btnSupportBack) {
  DOM.btnSupportBack.addEventListener("click", () => {
    closeSupportPage();
  });
}

if (DOM.btnCopyGameLink) {
  DOM.btnCopyGameLink.addEventListener("click", async () => {
    const link = window.location.href;

    try {
      await navigator.clipboard.writeText(link);

      if (DOM.supportCopyMsg) {
        DOM.supportCopyMsg.textContent = "Lien copié. Merci de le partager.";
      }
    } catch (error) {
      console.warn("Copie impossible :", error);

      if (DOM.supportCopyMsg) {
        DOM.supportCopyMsg.textContent = `Copie impossible. Lien : ${link}`;
      }
    }
  });
}

const FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScX7PEZ1vHZMAXEZFEIROjlqytfK9zrXNuV0-F__CzrCwFmxQ/viewform?usp=publish-editor";

if (DOM.btnSupportFeedback) {
  DOM.btnSupportFeedback.addEventListener("click", () => {
    window.open(FEEDBACK_FORM_URL, "_blank", "noopener,noreferrer");
  });
}
/* -----------------------------
   Init
----------------------------- */
pauseOnHidden();
disableMenuBackground();
showScreen("gate");
refreshSoundUI();
updateFullscreenButton();
updateGameFullscreenButton();
setLoginMessage("");
setSignupMessage("");