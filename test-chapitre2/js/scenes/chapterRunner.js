import { playerState } from "../state.js";
import { showScreen } from "../router.js";
import { createSceneEngine } from "./engine.js";

const el = id => document.getElementById(id);
const image = el("scene1Image");
const card = el("chapterCard");
let active = null;
const engine = createSceneEngine({
  sceneImage: image, chapterCard: card,
  choicePanel: el("choicePanel"), choiceTitle: el("choiceTitle"),
  choiceList: el("choiceList"), textContainer: el("text-container"), fade: el("fade"),
  onChoice: id => {
    const controller = active;
    controller?.choose(id).catch(error => {
      stopChapter();
      controller.onError?.(error);
    });
  }
});

export function stopChapter() {
  active = null;
  engine.clearTimers();
  engine.hideChoices();
  card?.classList.remove("is-visible", "is-hiding");
  el("fade")?.classList.remove("on");
}

export function getSceneState(state, key) {
  state[key] ||= { currentNodeId: null, visitedNodes: [], visitedSet: {},
    flags: {}, choiceHistory: [], ended: false };
  const scene = state[key];
  scene.visitedNodes ||= [];
  scene.visitedSet ||= {};
  scene.flags ||= {};
  scene.choiceHistory ||= [];
  return scene;
}

export function startChapter(map, state, key, deps = {}, effects = {}) {
  stopChapter();
  const scene = getSceneState(state, key);
  let renderId = 0;
  let available = new Map();
  const live = id => active === controller && (id == null || renderId === id);
  function checkpoint() { deps.onStateChange?.({ chapterId: map.id, scene }); }
  function applyFx(fx) {
    if (!image) return;
    for (const name of ["rubble", "homeWarm", "tvBlue", "streetCold", "ligueRed", "firehouseCold"]) {
      image.classList.toggle("fx-" + name, name === fx);
    }
  }

  async function goToNode(nodeId) {
    if (!live()) return;
    const node = map.nodes[nodeId];
    if (!node) throw new Error("Scène introuvable : " + nodeId);
    const id = ++renderId;
    engine.clearTimers();
    available = new Map();
    engine.showPanelOnly("");
    scene.currentNodeId = nodeId;
    if (!scene.visitedSet[nodeId]) {
      scene.visitedSet[nodeId] = true;
      scene.visitedNodes.push(nodeId);
      effects.onEnter?.(node, scene);
    }
    checkpoint();
    await deps.beforeRender?.({ node, scene });
    if (!live(id)) return;
    if (node.await) await node.await();
    if (!live(id)) return;
    if (node.image) {
      await engine.transitionToImage(node.image, 650);
      if (!live(id)) return;
    }
    applyFx(node.visualFx);
    const raw = typeof node.text === "function" ? node.text(scene) : node.text;
    const paragraphs = (Array.isArray(raw) ? raw : String(raw ?? "").split(/\n\s*\n/))
      .filter(text => text.trim());
    await engine.typeText(paragraphs, { speed: 32, lineGapMs: 260 });
    if (!live(id)) return;
    const choices = typeof node.choices === "function" ? node.choices(scene) : node.choices;
    const filtered = (choices || []).filter(choice => !choice.condition || choice.condition(playerState));
    if (node.kind === "end") {
      available.set("chapter_end", { type: "end" });
      engine.showChoices("", [{ id: "chapter_end", label: "Afficher la carte du chapitre" }]);
    } else if (filtered.length) {
      available = new Map(filtered.map(choice => [choice.id, { type: "choice", choice }]));
      engine.showChoices("", filtered, node.choiceReveal || { initialDelayMs: 150, staggerMs: 100 });
    } else {
      const next = node.getNext ? node.getNext(scene) : node.next;
      if (!next) throw new Error("Suite manquante : " + nodeId);
      available.set("continue", { type: "next", next });
      engine.showChoices("", [{ id: "continue", label: "Continuer" }]);
    }
    deps.afterRender?.({ node, scene });
  }

  const controller = {
    onError: deps.onError,
    stop: stopChapter,
    goToNode,
    getProgress: () => scene,
    async choose(id) {
      const payload = available.get(id);
      if (!payload || !live()) return;
      available.clear();
      engine.hideChoices();
      if (payload.type === "end") {
        scene.ended = true;
        checkpoint();
        await deps.onChapterEnd?.({ chapterId: map.id, scene, map });
        return;
      }
      const next = payload.choice?.next || payload.next;
      if (payload.choice) {
        effects.onChoice?.(scene, payload.choice);
        scene.choiceHistory.push({ nodeId: scene.currentNodeId, choiceId: id, next });
      }
      await goToNode(next);
    }
  };
  active = controller;
  showScreen("scene1");
  engine.clearText();
  el("choicePanel")?.classList.remove("on");
  engine.showTextContainer();
  image?.classList.add("is-visible");
  const firstLaunch = !scene.currentNodeId;
  controller.ready = (async () => {
    if (firstLaunch && card) {
      card.textContent = map.title;
      card.classList.add("is-visible");
      await engine.wait(1800);
      if (!live()) return;
      card.classList.remove("is-visible");
      await engine.wait(700);
      if (!live()) return;
    }
    await goToNode(map.nodes[scene.currentNodeId] ? scene.currentNodeId : map.start);
  })();
  return controller;
}

