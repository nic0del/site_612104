const DEFAULT_PLAYER_STATE = {
  proudReason: null,
  beliefHelped: null,

  familyAnchor: 0,
  dutyAnchor: 0,
  politicalLucidity: 0,
  tendernessToAngela: 0,
  traumaLoad: 0,
  selfControl: 0,
  stress: 0,
  
  seenFamily: false,
  seenPolitics: false
};

const STORAGE_KEY = "save_612104_playerState";
const MODE_KEY = "save_612104_mode";

let saveMode = "guest"; // "guest" | "account"

function getStorage() {
  return saveMode === "account" ? localStorage : sessionStorage;
}

function loadPlayerState() {
  try {
    const rememberedMode = localStorage.getItem(MODE_KEY);
    if (rememberedMode === "account" || rememberedMode === "guest") {
      saveMode = rememberedMode;
    }

    const storage = getStorage();
    const raw = storage.getItem(STORAGE_KEY);

    if (!raw) return { ...DEFAULT_PLAYER_STATE };

    const parsed = JSON.parse(raw);

    return {
      ...DEFAULT_PLAYER_STATE,
      ...parsed
    };
  } catch (error) {
    console.warn("Impossible de charger la sauvegarde playerState :", error);
    return { ...DEFAULT_PLAYER_STATE };
  }
}

export const playerState = loadPlayerState();

export function savePlayerState() {
  try {
    const storage = getStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify(playerState));
  } catch (error) {
    console.warn("Impossible de sauvegarder playerState :", error);
  }
}

export function resetPlayerState() {
  Object.assign(playerState, { ...DEFAULT_PLAYER_STATE });
  savePlayerState();
}

// 🔥 MODE INVITÉ
export function startGuestSession() {
  saveMode = "guest";
  localStorage.setItem(MODE_KEY, "guest");

  sessionStorage.removeItem(STORAGE_KEY);
  Object.assign(playerState, { ...DEFAULT_PLAYER_STATE });
  savePlayerState();
}

// 🔒 MODE CONNECTÉ
export function startAccountSession() {
  saveMode = "account";
  localStorage.setItem(MODE_KEY, "account");

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    Object.assign(playerState, JSON.parse(raw));
  } else {
    Object.assign(playerState, { ...DEFAULT_PLAYER_STATE });
    savePlayerState();
  }
}

export function getSaveMode() {
  return saveMode;
}