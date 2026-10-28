import test from "node:test";
import assert from "node:assert/strict";
import { installDOM, installStorage, fastClock } from "./helpers.js";
installStorage();
const dom = installDOM();
const rows = new Map();
let userId = null, failRead = false;
const writes = [];
const fakeSupabase = {
  auth: {
    getUser: async () => ({ data: { user: userId ? { id: userId } : null } }),
    signInWithPassword: async ({ email }) => {
      userId = email;
      return { data: { user: { id: userId } } };
    }
  },
  from(table) {
    let owner;
    const query = {
      select() { return query; }, eq(key, value) { owner = value; return query; },
      order() { return query; }, limit() { return query; },
      async maybeSingle() {
        if (table === "profiles") return { data: { id: owner, username: "Test" } };
        if (failRead) return { error: new Error("Read denied") };
        return { data: rows.get(owner) || null };
      },
      async upsert(row) {
        assert.equal(row.user_id, userId);
        writes.push(JSON.parse(JSON.stringify(row)));
        rows.set(row.user_id, JSON.parse(JSON.stringify(row)));
        return {};
      }
    };
    return query;
  }
};
globalThis.window = {
  supabase: { createClient: () => fakeSupabase },
  addEventListener() {}, confirm: () => true
};
const restoreClock = fastClock();
await import("../js/main.js");
const state = await import("../js/state.js");
const { stopChapter } = await import("../js/scenes/chapterRunner.js");
const settle = () => new Promise(resolve => setImmediate(resolve));
async function login(id) {
  await dom.get("btnLogin").click();
  dom.get("email").value = id;
  dom.get("password").value = "test-only";
  await dom.get("btnSubmitLogin").click();
  await settle();
}

test("guest menu, continue, leave and resume share a complete checkpoint", async () => {
  await dom.get("btnGuest").click();
  assert.equal(dom.get("btnStart").textContent, "▶ Commencer");
  await dom.get("btnStart").click();
  await settle();
  assert.equal(state.playerState.scene1.currentNodeId, "ch1_p0_black");
  await dom.get("choiceList").children[0].click();
  await settle();
  assert.equal(state.playerState.scene1.currentNodeId, "ch1_p1_eyes");
  await dom.get("btnGameHome").click();
  await dom.get("btnGuest").click();
  assert.equal(dom.get("btnStart").textContent, "▶ Continuer");
  await dom.get("btnStart").click();
  await settle();
  assert.equal(state.playerState.scene1.currentNodeId, "ch1_p1_eyes");
  assert.equal(writes.length, 0);
  stopChapter();
});

test("account login loads a complete cloud save; chapter 2 progress is autosaved", async () => {
  rows.set("alice", {
    scene_text: "chapter1_end", updated_at: "2026-10-27T12:00:00Z",
    player_state: {
      savedAt: "2026-10-27T12:00:00Z", phase: "chapter-end",
      proudReason: "save", familyAnchor: 3,
      scene1: { currentNodeId: "ch1_end", visitedNodes: ["ch1_end"], ended: true }
    }
  });
  await login("alice");
  assert.equal(state.playerState.proudReason, "save");
  assert.equal(dom.get("btnBonusChapter1").disabled, false);
  await dom.get("btnStart").click();
  await settle();
  assert.equal(dom.get("chapterEndTitle").textContent, "Chapitre 1 terminé");
  await dom.get("btnStartChapter2").click();
  await settle();
  assert.equal(state.playerState.currentChapter, "chapter2");
  assert.equal(state.playerState.scene2.currentNodeId, "c2_intro");
  assert.equal(rows.get("alice").player_state.scene2.currentNodeId, "c2_intro");
  assert.equal(rows.get("alice").player_state.proudReason, "save");
  stopChapter();
});

test("switching accounts isolates local state and new game really clears saved chapters", async () => {
  await login("bob");
  assert.equal(state.playerState.proudReason, null);
  assert.equal(state.playerState.scene2, null);
  await dom.get("btnNewGame").click();
  await settle();
  assert.equal(state.playerState.currentChapter, "chapter1");
  assert.equal(rows.get("bob").player_state.scene2, null);
  assert.equal(rows.get("alice").player_state.currentChapter, "chapter2");
  stopChapter();
});

test("unreadable cloud save never gets overwritten by a fresh local game", async () => {
  const before = writes.length;
  failRead = true;
  await login("offline");
  await dom.get("btnStart").click();
  await settle();
  assert.equal(writes.length, before);
  assert.match(dom.get("saveStatus").textContent, /locale|Reconnecte/);
  stopChapter();
  failRead = false;
  restoreClock();
});
