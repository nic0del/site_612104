import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { installDOM, installStorage, fastClock } from "./helpers.js";

installStorage();
const dom = installDOM();
const { playerState, replacePlayerState, savePlayerState, startGuestSession } = await import("../js/state.js");
const { startChapter, stopChapter } = await import("../js/scenes/chapterRunner.js");
const { chapter1Map, startScene1 } = await import("../js/scenes/scene1.js");
const { chapter2Map, startScene2 } = await import("../js/scenes/scene2.js");
const { createSceneEngine } = await import("../js/scenes/engine.js");

test("all scene targets and provisional images exist", () => {
  for (const map of [chapter1Map, chapter2Map]) {
    for (const node of Object.values(map.nodes)) {
      const choices = typeof node.choices === "function" ? node.choices() : node.choices || [];
      const targets = [node.next, ...(node.mapNext || []), ...choices.map(c => c.next)].filter(Boolean);
      for (const id of targets) assert(map.nodes[id], node.id + " -> " + id);
      if (node.image) {
        // Inventory from the original repository; images are deliberately not copied into tests.
        const image = node.image.replace("./", "");
        assert(assetPaths.has(image), image);
      }
    }
  }
});
const assetPaths = new Set([
  "black_soft","ch1_p0_black","ch1_p1_eyes","ch1_p2_trigger","ch1_r1_rubble_return",
  "ch1_r2_hold_on","locker_room","fire_silhouette","memory_fragments_2","ch1_h1_home",
  "ch1_f1_kitchen","ch1_f2_talk","home_argument","kitchen_back_kiss","ch1_t1_tv_alert",
  "ch1_t2_governor","ch1_t3_escalation","home_evening","angela_warning","tv_news_v1",
  "migrants_arrival","media_discourse","street_tensions","ligue_rise","ch1_ligue_vote","ligue_election"
].map(name => "assets/image_fond/scene1/" + name + ".png"));

test("browser import map versions every dependency with one shared state URL", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const mapping = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
  const stateURL = new URL(mapping["./js/state.js"], "https://example.test/game/");
  for (const file of Object.keys(mapping)) {
    const source = fs.readFileSync(new URL("../" + file, import.meta.url), "utf8");
    for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
      const resolved = new URL(match[1], new URL(file, "https://example.test/game/"));
      const key = "./" + resolved.pathname.replace("/game/", "");
      assert(mapping[key], key);
      if (key === "./js/state.js") assert.equal(mapping[key], "./js/state.js?v=chapter2-v2");
    }
  }
  assert.equal(stateURL.search, "?v=chapter2-v2");
});

test("chapter 2 text and optional choices use current player state", () => {
  replacePlayerState({});
  const waiting = chapter2Map.nodes.c2_waiting;
  const before = waiting.text();
  assert(!waiting.choices().some(c => c.id === "c2_wait_crack"));
  playerState.stress = 5;
  assert.notEqual(waiting.text(), before);
  assert(waiting.choices().some(c => c.id === "c2_wait_crack"));
  playerState.traumaLoad = 4;
  assert(chapter2Map.nodes.c2_barracks_arrival.choices().some(c => c.id === "c2_barracks_breath"));
  const night = chapter2Map.nodes.c2_night_shift_reflection;
  playerState.proudReason = "save";
  assert.match(night.text(), /sauver quelqu'un/);
  playerState.proudReason = "exist";
  assert.match(night.text(), /une place/);
});

test("play chapter 1, reload mid-chapter, carry choices into chapter 2 and reach its end", async () => {
  const restoreClock = fastClock();
  try {
    sessionStorage.clear();
    replacePlayerState({});
    let ended = null;
    const deps = {
      onStateChange: () => savePlayerState(),
      onChapterEnd: value => { ended = value; savePlayerState(); }
    };
    let controller = startScene1(playerState, deps);
    await controller.ready;
    let reloaded = false;
    for (let step = 0; step < 80 && !ended; step++) {
      const id = playerState.scene1.currentNodeId;
      const node = chapter1Map.nodes[id];
      if (id === "ch1_h1_home" && !reloaded) {
        const reason = playerState.proudReason;
        stopChapter();
        startGuestSession();
        controller = startScene1(playerState, deps);
        await controller.ready;
        assert.equal(playerState.scene1.currentNodeId, id);
        assert.equal(playerState.proudReason, reason);
        reloaded = true;
      }
      const available = typeof node.choices === "function" ? node.choices() : node.choices;
      let choice = available?.find(c => ["memory_firefighter", "proud_save", "home_to_family",
        "talk_open", "remember_car_argument"].includes(c.id)) || available?.[0];
      await controller.choose(node.kind === "end" ? "chapter_end" : choice?.id || "continue");
    }
    assert.equal(ended?.chapterId, "chapter1");
    assert.equal(playerState.proudReason, "save");
    assert(playerState.scene1.flags.family_branch_seen);
    assert(playerState.scene1.flags.tv_branch_seen);
    const firstHistory = JSON.stringify(playerState.scene1.choiceHistory);
    playerState.currentChapter = "chapter2";
    ended = null;
    controller = startScene2(playerState, deps);
    await controller.ready;
    for (let step = 0; step < 50 && !ended; step++) {
      const node = chapter2Map.nodes[playerState.scene2.currentNodeId];
      const choices = typeof node.choices === "function" ? node.choices() : node.choices || [];
      const choice = choices.find(c => !c.condition || c.condition(playerState));
      await controller.choose(node.kind === "end" ? "chapter_end" : choice.id);
    }
    assert.equal(ended?.chapterId, "chapter2");
    assert.equal(playerState.scene2.visitedNodes.length, 31);
    assert.equal(JSON.stringify(playerState.scene1.choiceHistory), firstHistory);
    assert(Object.values(playerState).filter(v => typeof v === "number").every(v => v >= -5 && v <= 5));
    stopChapter();
    startGuestSession();
    assert.equal(playerState.currentChapter, "chapter2");
    assert.equal(playerState.scene2.ended, true);
  } finally { stopChapter(); restoreClock(); }
});

test("reopening a scene does not apply onEnter effects twice", async () => {
  const restoreClock = fastClock();
  try {
    replacePlayerState({});
    const map = { id: "test", title: "Test", start: "once", nodes: {
      once: { id: "once", kind: "end", text: "Texte." }
    } };
    const effects = { onEnter: () => playerState.stress++ };
    let controller = startChapter(map, playerState, "scene1", {}, effects);
    await controller.ready;
    controller = startChapter(map, playerState, "scene1", {}, effects);
    await controller.ready;
    assert.equal(playerState.stress, 1);
  } finally { stopChapter(); restoreClock(); }
});

test("leaving during an intro settles timers without restarting hidden text", async () => {
  replacePlayerState({});
  const controller = startScene1(playerState);
  stopChapter();
  await controller.ready;
  assert.equal(playerState.scene1.currentNodeId, null);
  assert.equal(dom.get("choiceList").children.length, 0);
});

test("cancelled typing promises settle and a later scene can render normally", async () => {
  const engine = createSceneEngine({
    textContainer: dom.get("test-text"), onChoice() {}
  });
  const typing = engine.typeText(["Long passage", "Doit rester absent"]);
  engine.clearTimers();
  assert.equal(await typing, false);
  assert.equal(dom.get("test-text").children.length, 1);
});
