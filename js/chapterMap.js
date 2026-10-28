import { showScreen } from "./router.js";

const NODE_WIDTH = 230;
const NODE_HEIGHT = 82;

const COLUMN_GAP = 340;
const ROW_GAP = 118;

const MAP_PADDING_X = 220;
const MAP_PADDING_Y = 70;

const CAMERA_STEP_RATIO = 0.72;
let mapGeneration = 0;
export function stopChapterMap() { mapGeneration++; }

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createEl(tag, className, text = "") {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function getNodeKindLabel(kind = "scene") {
  const labels = {
    scene: "Souvenir",
    choice: "Choix",
    conditional: "Convergence",
    end: "Fin"
  };

  return labels[kind] || "Souvenir";
}

function getOutgoingTargets(node) {
  const targets = [];

  if (node.next) {
    targets.push(node.next);
  }

  if (Array.isArray(node.mapNext)) {
    targets.push(...node.mapNext);
  }

  if (Array.isArray(node.choices)) {
    for (const choice of node.choices) {
      if (choice.next) {
        targets.push(choice.next);
      }
    }
  }

  return [...new Set(targets)].filter(Boolean);
}

function buildEdges(map) {
  const edges = [];

  for (const node of Object.values(map.nodes)) {
    for (const targetId of getOutgoingTargets(node)) {
      edges.push([node.id, targetId]);
    }
  }

  return edges;
}

function getVisitedOrder(scene, map) {
  const visitedNodes = Array.isArray(scene?.visitedNodes)
    ? scene.visitedNodes
    : [];

  if (visitedNodes.length > 0) {
    return visitedNodes.filter((nodeId) => map.nodes[nodeId]);
  }

  const visitedSet = scene?.visitedSet || {};
  return Object.keys(visitedSet).filter((nodeId) => map.nodes[nodeId]);
}

function getReachableNodeIds(map) {
  const reachable = new Set();
  const queue = [map.start];

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId || reachable.has(nodeId)) continue;

    const node = map.nodes[nodeId];
    if (!node) continue;

    reachable.add(nodeId);

    for (const targetId of getOutgoingTargets(node)) {
  queue.push(targetId);
}
  }

  return reachable;
}

function computeColumns(map) {
  const columns = new Map();
  const queue = [{ id: map.start, depth: 0 }];
  const bestDepth = new Map();

  while (queue.length > 0) {
    const current = queue.shift();
    const node = map.nodes[current.id];

    if (!node) continue;

    const previousDepth = bestDepth.get(current.id);

    if (typeof previousDepth === "number" && previousDepth <= current.depth) {
      continue;
    }

    bestDepth.set(current.id, current.depth);

    if (!columns.has(current.depth)) {
      columns.set(current.depth, []);
    }

    const column = columns.get(current.depth);
    if (!column.includes(current.id)) {
      column.push(current.id);
    }

    for (const targetId of getOutgoingTargets(node)) {
  queue.push({
    id: targetId,
    depth: current.depth + 1
  });
}
  }

  return { columns, bestDepth };
}

function createLayout(map) {
  const reachable = getReachableNodeIds(map);
  const { columns, bestDepth } = computeColumns(map);

  const layoutNodes = [];

  const sortedDepths = [...columns.keys()].sort((a, b) => a - b);

  for (const depth of sortedDepths) {
    const ids = columns.get(depth).filter((id) => reachable.has(id));

    ids.sort((a, b) => {
      const ay = map.nodes[a]?.y ?? 0;
      const by = map.nodes[b]?.y ?? 0;
      return ay - by;
    });

    const columnHeight = (ids.length - 1) * ROW_GAP;

    ids.forEach((id, index) => {
      const node = map.nodes[id];

      layoutNodes.push({
        ...node,
        depth,
        mapX: MAP_PADDING_X + depth * COLUMN_GAP,
        mapY: MAP_PADDING_Y + index * ROW_GAP - columnHeight / 2 + 260
      });
    });
  }

  const maxDepth = Math.max(...layoutNodes.map((node) => node.depth), 0);
  const minY = Math.min(...layoutNodes.map((node) => node.mapY), 0);

  if (minY < MAP_PADDING_Y) {
    const delta = MAP_PADDING_Y - minY;
    for (const node of layoutNodes) {
      node.mapY += delta;
    }
  }

  const maxY = Math.max(...layoutNodes.map((node) => node.mapY + NODE_HEIGHT), 720);

  return {
    nodes: layoutNodes,
    width: MAP_PADDING_X * 2 + (maxDepth + 1) * COLUMN_GAP,
    height: Math.max(720, maxY + MAP_PADDING_Y),
    bestDepth
  };
}

function getNodeCenter(node) {
  return {
    x: node.mapX + NODE_WIDTH / 2,
    y: node.mapY + NODE_HEIGHT / 2
  };
}

function createEdgePath(from, to) {
  const a = getNodeCenter(from);
  const b = getNodeCenter(to);

  const distance = Math.max(110, Math.abs(b.x - a.x) * 0.42);

  return [
    `M ${a.x} ${a.y}`,
    `C ${a.x + distance} ${a.y}`,
    `${b.x - distance} ${b.y}`,
    `${b.x} ${b.y}`
  ].join(" ");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createCamera({ viewport, stage, mapWidth }) {
  let cameraX = 0;

  function getMaxCameraX() {
    return Math.max(0, mapWidth - viewport.clientWidth);
  }

  function apply() {
    const max = getMaxCameraX();
    cameraX = clamp(cameraX, 0, max);
    stage.style.transform = `translate3d(${-cameraX}px, 0, 0)`;
  }

  function moveTo(x) {
    cameraX = x;
    apply();
  }

  function moveBy(delta) {
    moveTo(cameraX + delta);
  }

  function centerOnNode(node) {
    const target = node.mapX + NODE_WIDTH / 2 - viewport.clientWidth / 2;
    moveTo(target);
  }

  function goStart() {
    moveTo(0);
  }

  function goEnd() {
    moveTo(getMaxCameraX());
  }

  return {
    apply,
    moveTo,
    moveBy,
    centerOnNode,
    goStart,
    goEnd
  };
}

function setCurrentNode(nodeElsById, nodeId) {
  for (const el of nodeElsById.values()) {
    el.classList.remove("is-current");
  }

  const current = nodeElsById.get(nodeId);
  if (current) {
    current.classList.add("is-current");
  }
}

function revealEdges(edgeEls, revealedSet) {
  for (const edgeEl of edgeEls) {
    const fromId = edgeEl.dataset.from;
    const toId = edgeEl.dataset.to;

    if (revealedSet.has(fromId) && revealedSet.has(toId)) {
      edgeEl.classList.remove("locked");
      edgeEl.classList.add("revealed");
    }
  }
}

function revealInitialState({
  nodeElsById,
  edgeEls,
  visitedSet,
  revealVisitedImmediately = false
}) {
  const revealedSet = new Set();

  for (const [nodeId, nodeEl] of nodeElsById.entries()) {
    const visited = !!visitedSet[nodeId];

    if (visited && revealVisitedImmediately) {
      nodeEl.classList.remove("locked");
      nodeEl.classList.add("revealed");
      revealedSet.add(nodeId);
    }
  }

  revealEdges(edgeEls, revealedSet);
  return revealedSet;
}

function enableControls({ viewport, camera, btnLeft, btnRight }) {
  const getStep = () => Math.round(viewport.clientWidth * CAMERA_STEP_RATIO);

  if (btnLeft) {
    btnLeft.onclick = () => {
      camera.moveBy(-getStep());
    };
  }

  if (btnRight) {
    btnRight.onclick = () => {
      camera.moveBy(getStep());
    };
  }

  window.onkeydown = (event) => {
    if (!document.getElementById("screen-chapter-map")?.classList.contains("active")) {
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      camera.moveBy(getStep());
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      camera.moveBy(-getStep());
    }

    if (event.key === "Home") {
      event.preventDefault();
      camera.goStart();
    }

    if (event.key === "End") {
      event.preventDefault();
      camera.goEnd();
    }
  };
}

async function playRevealSequence({
  camera,
  nodeElsById,
  edgeEls,
  visitedOrder,
  layoutNodesById,
  isActive
}) {
  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  )?.matches;

  const revealedSet = new Set();

  camera.goStart();

  await sleep(prefersReducedMotion ? 80 : 650);

  for (const nodeId of visitedOrder) {
    if (!isActive()) return;
    const node = layoutNodesById.get(nodeId);
    const nodeEl = nodeElsById.get(nodeId);

    if (!node || !nodeEl) continue;

    camera.centerOnNode(node);
    setCurrentNode(nodeElsById, nodeId);

    await sleep(prefersReducedMotion ? 80 : 700);
    if (!isActive()) return;

    nodeEl.classList.remove("locked");
    nodeEl.classList.add("revealed");
    revealedSet.add(nodeId);

    revealEdges(edgeEls, revealedSet);

    await sleep(prefersReducedMotion ? 80 : 520);
  }
}

export function renderChapterMap({ map, scene, onContinue }) {
  stopChapterMap();
  const generation = mapGeneration;
  const isActive = () => generation === mapGeneration;
  const titleEl = document.getElementById("chapterMapTitle");
  const subtitleEl = document.getElementById("chapterMapSubtitle");
  const viewport = document.getElementById("chapterMapViewport");
  const stage = document.getElementById("chapterMapStage");
  const svg = document.getElementById("chapterMapSvg");
  const nodesLayer = document.getElementById("chapterMapNodes");
  const btnContinue = document.getElementById("btnMapContinue");
  const btnLeft = document.getElementById("btnMapLeft");
  const btnRight = document.getElementById("btnMapRight");

  if (!viewport || !stage || !svg || !nodesLayer) {
    throw new Error("[chapterMap] Éléments DOM introuvables");
  }

  if (titleEl) {
    titleEl.textContent = map.title || "Fin du chapitre";
  }

  if (subtitleEl) {
    subtitleEl.textContent = "Le chemin parcouru se recompose dans la mémoire";
  }

  svg.innerHTML = "";
  nodesLayer.innerHTML = "";

  const layout = createLayout(map);
  const layoutNodesById = new Map(layout.nodes.map((node) => [node.id, node]));
  const edges = buildEdges(map);

  const visitedSet = scene?.visitedSet || {};
  const visitedOrder = getVisitedOrder(scene, map);

  stage.style.width = `${layout.width}px`;
  stage.style.height = `${layout.height}px`;

  svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
  svg.setAttribute("width", layout.width);
  svg.setAttribute("height", layout.height);

  nodesLayer.style.width = `${layout.width}px`;
  nodesLayer.style.height = `${layout.height}px`;

  const edgeEls = [];

  for (const [fromId, toId] of edges) {
    const from = layoutNodesById.get(fromId);
    const to = layoutNodesById.get(toId);

    if (!from || !to) continue;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", createEdgePath(from, to));
    path.dataset.from = fromId;
    path.dataset.to = toId;
    path.classList.add("map-edge", "locked");

    svg.appendChild(path);
    edgeEls.push(path);
  }

  const nodeElsById = new Map();

  for (const node of layout.nodes) {
    const visited = !!visitedSet[node.id];

    const el = createEl("button", "map-node");
    el.type = "button";

    el.style.left = `${node.mapX}px`;
    el.style.top = `${node.mapY}px`;

    el.classList.add(`map-node--${node.kind || "scene"}`);

    if (node.id === map.start) {
      el.classList.add("map-node--start");
    }

    if (node.id === map.end || node.kind === "end") {
      el.classList.add("map-node--end");
    }

    if (visited) {
      el.classList.add("revealed");
    } else {
      el.classList.add("locked");
    }

    const title = createEl(
      "div",
      "map-node-title",
      visited ? node.label : "???"
    );

    const kind = createEl(
      "div",
      "map-node-kind",
      visited ? getNodeKindLabel(node.kind) : "mémoire verrouillée"
    );

    el.appendChild(title);
    el.appendChild(kind);
    nodesLayer.appendChild(el);
    nodeElsById.set(node.id, el);
  }

  showScreen("chapter-map");

  requestAnimationFrame(() => {
    if (!isActive()) return;
    const camera = createCamera({
      viewport,
      stage,
      mapWidth: layout.width
    });

    camera.apply();

    enableControls({
      viewport,
      camera,
      btnLeft,
      btnRight
    });

    if (visitedOrder.length > 0) {
      playRevealSequence({
        camera,
        nodeElsById,
        edgeEls,
        visitedOrder,
        layoutNodesById,
        isActive
      });
    }
  });

  if (btnContinue) {
    btnContinue.onclick = () => {
      if (!isActive()) return;
      stopChapterMap();
      if (typeof onContinue === "function") {
        onContinue();
      }
    };
  }
}
