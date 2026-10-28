const NOVEL_CHAPTER_COUNT = 17;

function createNovelChapterUnlocks() {
  const novelChapters = {};

  for (let i = 1; i <= NOVEL_CHAPTER_COUNT; i++) {
    novelChapters[`chapter${i}`] = false;
  }

  return novelChapters;
}

function createDefaultPlayerState() {
  return {
    proudReason: null,
    beliefHelped: null,

    familyAnchor: 0,
    dutyAnchor: 0,
    politicalLucidity: 0,
    tendernessToAngela: 0,
    traumaLoad: 0,
    selfControl: 0,
    stress: 0,
    memoryStability: 0,

    seenFamily: false,
    seenPolitics: false,

    unlockedBonus: {
      novelChapters: createNovelChapterUnlocks()
    }
  };
}

const STORAGE_KEY = "save_612104_playerState";
const MODE_KEY = "save_612104_mode";

let saveMode = "guest"; // "guest" | "account"

function getStorage() {
  return saveMode === "account" ? localStorage : sessionStorage;
}

function normalizePlayerStateShape(state = {}) {
  const defaultState = createDefaultPlayerState();

  const normalized = {
    ...defaultState,
    ...state
  };

  if (!normalized.unlockedBonus) {
    normalized.unlockedBonus = {};
  }

  const legacyChapter1Unlocked =
    normalized.unlockedBonus.chapter1Novel === true;

  if (!normalized.unlockedBonus.novelChapters) {
    normalized.unlockedBonus.novelChapters = createNovelChapterUnlocks();
  }

  for (let i = 1; i <= NOVEL_CHAPTER_COUNT; i++) {
    const chapterId = `chapter${i}`;

    if (typeof normalized.unlockedBonus.novelChapters[chapterId] !== "boolean") {
      normalized.unlockedBonus.novelChapters[chapterId] = false;
    }
  }

  // Migration de l'ancien système :
  // unlockedBonus.chapter1Novel → unlockedBonus.novelChapters.chapter1
  if (legacyChapter1Unlocked) {
    normalized.unlockedBonus.novelChapters.chapter1 = true;
  }

  return normalized;
}

function loadPlayerState() {
  try {
    const rememberedMode = localStorage.getItem(MODE_KEY);

    if (rememberedMode === "account" || rememberedMode === "guest") {
      saveMode = rememberedMode;
    }

    const storage = getStorage();
    const raw = storage.getItem(STORAGE_KEY);

    if (!raw) {
      return createDefaultPlayerState();
    }

    const parsed = JSON.parse(raw);
    return normalizePlayerStateShape(parsed);
  } catch (error) {
    console.warn("Impossible de charger la sauvegarde playerState :", error);
    return createDefaultPlayerState();
  }
}

export const playerState = loadPlayerState();

function replacePlayerState(nextState) {
  for (const key of Object.keys(playerState)) {
    delete playerState[key];
  }

  Object.assign(playerState, normalizePlayerStateShape(nextState));
}

export function savePlayerState() {
  try {
    const storage = getStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify(playerState));
  } catch (error) {
    console.warn("Impossible de sauvegarder playerState :", error);
  }
}

export function resetPlayerState() {
  replacePlayerState(createDefaultPlayerState());
  savePlayerState();
}

// 🔥 MODE INVITÉ
export function startGuestSession() {
  saveMode = "guest";
  localStorage.setItem(MODE_KEY, "guest");

  sessionStorage.removeItem(STORAGE_KEY);
  replacePlayerState(createDefaultPlayerState());
  savePlayerState();
}

// 🔒 MODE CONNECTÉ
export function startAccountSession() {
  saveMode = "account";
  localStorage.setItem(MODE_KEY, "account");

  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw) {
    try {
      replacePlayerState(JSON.parse(raw));
    } catch (error) {
      console.warn("Sauvegarde locale invalide, réinitialisation :", error);
      replacePlayerState(createDefaultPlayerState());
      savePlayerState();
    }
  } else {
    replacePlayerState(createDefaultPlayerState());
    savePlayerState();
  }
}

export function getSaveMode() {
  return saveMode;
}

export function unlockNovelChapter(chapterId) {
  if (!playerState.unlockedBonus) {
    playerState.unlockedBonus = {};
  }

  if (!playerState.unlockedBonus.novelChapters) {
    playerState.unlockedBonus.novelChapters = createNovelChapterUnlocks();
  }

  playerState.unlockedBonus.novelChapters[chapterId] = true;
  savePlayerState();
}

export function isNovelChapterUnlocked(chapterId) {
  return playerState.unlockedBonus?.novelChapters?.[chapterId] === true;
}

export function getUnlockedNovelChapters() {
  return Object.entries(playerState.unlockedBonus?.novelChapters || {})
    .filter(([, unlocked]) => unlocked)
    .map(([chapterId]) => chapterId);
}

export function getNovelChapterUnlocks() {
  return {
    ...(playerState.unlockedBonus?.novelChapters || {})
  };
}