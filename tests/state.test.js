import test from "node:test";
import assert from "node:assert/strict";
import { installStorage } from "./helpers.js";
import {
  playerState, startGuestSession, startAccountSession, savePlayerState,
  resetPlayerState, replacePlayerState, normalizePlayerState
} from "../js/state.js";

test("guest reload keeps the exact checkpoint, choices and bonus", () => {
  installStorage();
  startGuestSession();
  Object.assign(playerState, { proudReason: "save", familyAnchor: 3,
    unlockedBonus: { chapter1Novel: true },
    scene1: { currentNodeId: "ch1_h1_home", visitedNodes: ["ch1_p0_black", "ch1_h1_home"],
      flags: { family_branch_seen: true }, choiceHistory: [{ choiceId: "proud_save" }] } });
  savePlayerState();
  replacePlayerState({});
  startGuestSession();
  assert.equal(playerState.scene1.currentNodeId, "ch1_h1_home");
  assert.equal(playerState.scene1.flags.family_branch_seen, true);
  assert.equal(playerState.proudReason, "save");
  assert.equal(playerState.unlockedBonus.chapter1Novel, true);
});

test("account keys and guest storage never mix, including legacy shared key", () => {
  installStorage();
  localStorage.setItem("save_612104_playerState", JSON.stringify({ stress: 5 }));
  startAccountSession("alice");
  assert.equal(playerState.stress, 0);
  playerState.stress = 2;
  savePlayerState();
  startAccountSession("bob");
  assert.equal(playerState.stress, 0);
  playerState.stress = -1;
  savePlayerState();
  startGuestSession();
  assert.equal(playerState.stress, 0);
  startAccountSession("alice");
  assert.equal(playerState.stress, 2);
  startAccountSession("bob");
  assert.equal(playerState.stress, -1);
});

test("new game clears both chapters, flags and stats while keeping the earned novel", () => {
  installStorage();
  startGuestSession();
  replacePlayerState({ stress: 5, scene1: { ended: true, visitedNodes: ["ch1_end"] },
    scene2: { currentNodeId: "c2_waiting", visitedNodes: ["c2_waiting"] },
    currentChapter: "chapter2", unlockedBonus: { chapter1Novel: true } });
  resetPlayerState();
  startGuestSession();
  assert.equal(playerState.scene1, null);
  assert.equal(playerState.scene2, null);
  assert.equal(playerState.currentChapter, "chapter1");
  assert.equal(playerState.stress, 0);
  assert.equal(playerState.unlockedBonus.chapter1Novel, true);
});

test("legacy cloud end save migrates to a real chapter checkpoint", () => {
  const state = normalizePlayerState({ proudReason: "useful" }, "chapter1_end");
  assert.equal(state.scene1.currentNodeId, "ch1_end");
  assert.equal(state.scene1.ended, true);
  assert.equal(state.phase, "chapter-end");
  assert.equal(state.unlockedBonus.chapter1Novel, true);
  assert.equal(state.proudReason, "useful");
});

test("broken local JSON and invalid fields do not crash or unlock chapter 2", () => {
  installStorage();
  sessionStorage.setItem("save_612104_v2_guest", "{broken");
  startGuestSession();
  assert.equal(playerState.scene1, null);
  const state = normalizePlayerState({ currentChapter: "chapter2", stress: Infinity, familyAnchor: 99 });
  assert.equal(state.currentChapter, "chapter1");
  assert.equal(state.stress, 0);
  assert.equal(state.familyAnchor, 5);
});
