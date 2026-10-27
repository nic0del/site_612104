const LEGACY_KEY = "preview_612104_legacy_unused";
const GUEST_KEY = "preview_612104_v2_guest";
let saveMode = "guest";
let accountId = null;

export const NUMERIC_KEYS = ["familyAnchor", "dutyAnchor", "politicalLucidity",
  "tendernessToAngela", "traumaLoad", "selfControl", "stress"];

export function freshPlayerState() {
  return {
    schemaVersion: 2, savedAt: null, currentChapter: "chapter1", phase: "story",
    proudReason: null, beliefHelped: null,
    familyAnchor: 0, dutyAnchor: 0, politicalLucidity: 0,
    tendernessToAngela: 0, traumaLoad: 0, selfControl: 0, stress: 0,
    unlockedBonus: { chapter1Novel: false }, scene1: null, scene2: null
  };
}

function normalizeScene(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const visitedNodes = Array.isArray(raw.visitedNodes)
    ? [...new Set(raw.visitedNodes.filter(id => typeof id === "string"))] : [];
  return {
    currentNodeId: typeof raw.currentNodeId === "string" ? raw.currentNodeId : null,
    visitedNodes,
    visitedSet: Object.fromEntries(visitedNodes.map(id => [id, true])),
    flags: raw.flags && typeof raw.flags === "object" ? { ...raw.flags } : {},
    choiceHistory: Array.isArray(raw.choiceHistory) ? raw.choiceHistory.slice(-500) : [],
    ended: raw.ended === true
  };
}

export function normalizePlayerState(raw = {}, legacySceneId = null) {
  const state = freshPlayerState();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return state;
  for (const key of NUMERIC_KEYS) {
    if (Number.isFinite(raw[key])) state[key] = Math.max(-5, Math.min(5, raw[key]));
  }
  if (["save", "useful", "exist"].includes(raw.proudReason)) state.proudReason = raw.proudReason;
  if (typeof raw.beliefHelped === "boolean") state.beliefHelped = raw.beliefHelped;
  state.scene1 = normalizeScene(raw.scene1);
  state.scene2 = normalizeScene(raw.scene2);
  if (raw.currentChapter === "chapter2" && state.scene1?.ended) state.currentChapter = "chapter2";
  if (["story", "map", "chapter-end"].includes(raw.phase)) state.phase = raw.phase;
  state.unlockedBonus.chapter1Novel = raw.unlockedBonus?.chapter1Novel === true || state.scene1?.ended === true;
  state.savedAt = typeof raw.savedAt === "string" && Number.isFinite(Date.parse(raw.savedAt)) ? raw.savedAt : null;
  // Old cloud saves contain personality only; recover only a known checkpoint.
  if (!state.scene1 && legacySceneId === "chapter1_end") {
    state.scene1 = normalizeScene({ currentNodeId: "ch1_end", visitedNodes: ["ch1_end"], ended: true });
    state.unlockedBonus.chapter1Novel = true;
    state.phase = "chapter-end";
  }
  if (!state.scene1 && typeof legacySceneId === "string" && legacySceneId.startsWith("ch1_")) {
    state.scene1 = normalizeScene({ currentNodeId: legacySceneId, visitedNodes: [legacySceneId] });
  }
  const currentScene = state.currentChapter === "chapter2" ? state.scene2 : state.scene1;
  if (!currentScene?.ended) state.phase = "story";
  return state;
}

// Stable object identity is shared by the chapter modules.
export const playerState = freshPlayerState();

export function replacePlayerState(raw, legacySceneId = null) {
  const normalized = normalizePlayerState(raw, legacySceneId);
  for (const key of Object.keys(playerState)) delete playerState[key];
  Object.assign(playerState, normalized);
}

function storageKey() {
  return saveMode === "account" ? "preview_612104_v2_account:" + accountId : GUEST_KEY;
}
function storage() { return saveMode === "account" ? localStorage : sessionStorage; }

export function savePlayerState({ touch = true } = {}) {
  if (touch) playerState.savedAt = new Date().toISOString();
  try {
    storage().setItem(storageKey(), JSON.stringify(playerState));
    return true;
  } catch (error) {
    console.warn("Sauvegarde locale impossible :", error);
    return false;
  }
}

function loadSession(mode, userId) {
  saveMode = mode;
  accountId = userId;
  let raw = null;
  try {
    raw = storage().getItem(storageKey());
    // A legacy guest save is tab-scoped. Never adopt the old shared account key.
    if (!raw && mode === "guest") raw = sessionStorage.getItem(LEGACY_KEY);
    replacePlayerState(raw ? JSON.parse(raw) : {});
  } catch (error) {
    console.warn("Sauvegarde locale illisible :", error);
    replacePlayerState({});
  }
}

export function startGuestSession() { loadSession("guest", null); }
export function startAccountSession(userId) {
  if (typeof userId !== "string" || !userId) throw new Error("Identifiant du compte manquant.");
  loadSession("account", userId);
}

export function resetPlayerState({ keepBonus = true } = {}) {
  const bonus = keepBonus && playerState.unlockedBonus?.chapter1Novel === true;
  replacePlayerState({});
  playerState.unlockedBonus.chapter1Novel = bonus;
  return savePlayerState();
}
export function getSaveMode() { return saveMode; }
export function getAccountId() { return accountId; }

