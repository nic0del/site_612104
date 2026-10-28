export function createSceneEngine({
  chapterCard,
  sceneImage,
  choicePanel,
  choiceTitle,
  choiceList,
  textContainer,
  fade,
  onChoice
}) {
  let timers = [];
  let cancellationId = 0;
  const pendingTasks = new Set();
  let currentChoiceMap = new Map();

  let typingRunId = 0;
  let isTyping = false;
  let activeTextTarget = null;

  function registerTimeout(fn, delay) {
    const id = setTimeout(() => {
      timers = timers.filter((t) => t !== id);
      fn();
    }, delay);
    timers.push(id);
    return id;
  }

  function clearTimers() {
    cancellationId++;
    typingRunId++;
    isTyping = false;
    activeTextTarget = null;

    for (const t of timers) clearTimeout(t);
    timers = [];
    for (const cancel of [...pendingTasks]) cancel();
    pendingTasks.clear();
    currentChoiceMap = new Map();
  }

  function wait(ms) {
    return new Promise((resolve) => {
      const cancel = () => resolve(false);
      pendingTasks.add(cancel);
      registerTimeout(() => {
        pendingTasks.delete(cancel);
        resolve(true);
      }, ms);
    });
  }

  function getPauseForChar(ch) {
    if (ch === ",") return 120;
    if (ch === ";" || ch === ":") return 180;
    if (ch === ".") return 280;
    if (ch === "!" || ch === "?") return 320;
    if (ch === "\n") return 220;
    if (ch === "…") return 420;
    return 0;
  }

  function hideTextContainer() {
    if (!textContainer) return;
    textContainer.style.opacity = "0";
    textContainer.innerHTML = "";
  }

  function showTextContainer() {
    if (!textContainer) return;
    textContainer.style.opacity = "1";
  }

  function clearText() {
    if (!textContainer) return;
    textContainer.innerHTML = "";
  }

  function skipCurrentTyping() {
    isTyping = false;
  }

  function makeTextBlock(text = "", className = "sceneTextLine") {
    const el = document.createElement("p");
    el.className = className;
    el.textContent = "";
    return el;
  }

  function typeWriter(text, opts = {}) {
    return new Promise((resolve) => {
      if (!textContainer) return resolve();

      const speed = opts.speed ?? 40;
      const append = opts.append ?? false;
      const className = opts.className ?? "sceneTextLine";

      typingRunId++;
      const myRunId = typingRunId;

      isTyping = true;

      if (!append) {
        textContainer.innerHTML = "";
      }

      const target = makeTextBlock("", className);
      textContainer.appendChild(target);
      activeTextTarget = target;

      let i = 0;
      let resolved = false;
      const cancel = () => done(false);
      pendingTasks.add(cancel);

      function done(completed = true) {
        if (resolved) return;
        resolved = true;
        pendingTasks.delete(cancel);
        if (myRunId === typingRunId) {
          activeTextTarget = null;
        }
        resolve(completed);
      }

      function finishInstantly() {
        if (myRunId !== typingRunId) return done();
        target.textContent = text;
        isTyping = false;
        done();
      }

      function step() {
        if (myRunId !== typingRunId) return done();

        if (!isTyping) {
          finishInstantly();
          return;
        }

        if (i >= text.length) {
          isTyping = false;
          done();
          return;
        }

        const ch = text[i];
        target.textContent += ch;
        i++;

        registerTimeout(step, speed + getPauseForChar(ch));
      }

      step();
    });
  }

  async function typeLines(lines = [], opts = {}) {
    if (!Array.isArray(lines) || !lines.length) return;

    const lineGapMs = opts.lineGapMs ?? 420;
    const speed = opts.speed ?? 40;
    const clearFirst = opts.clearFirst ?? true;
    const className = opts.className ?? "sceneTextLine";
    const run = cancellationId;

    if (clearFirst) {
      clearText();
    }

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      if (run !== cancellationId) return false;
      const completed = await typeWriter(line ?? "", {
        speed,
        append: true,
        className
      });
      if (completed === false || run !== cancellationId) return false;

      if (idx < lines.length - 1) {
        if (!await wait(lineGapMs)) return false;
      }
    }
    return true;
  }

  async function typeText(text, opts = {}) {
    if (Array.isArray(text)) {
      return typeLines(text, opts);
    }

    return typeWriter(text ?? "", {
      speed: opts.speed ?? 40,
      append: false,
      className: opts.className ?? "sceneTextLine"
    });
  }

  function fadeToBlack(ms = 1200) {
    if (!fade) return wait(ms);
    fade.classList.add("on");
    return wait(ms);
  }

  function fadeFromBlack(ms = 1200) {
    if (!fade) return wait(ms);
    fade.classList.remove("on");
    return wait(ms);
  }

  async function transitionToImage(newImageUrl, ms = 900) {
    const run = cancellationId;
    await fadeToBlack(ms);
    if (run !== cancellationId) return false;

    if (sceneImage && newImageUrl) {
      sceneImage.style.backgroundImage = `url("${newImageUrl}")`;
      sceneImage.classList.add("is-visible");
    }

    await fadeFromBlack(ms);
    return run === cancellationId;
  }

  function clearChoices() {
    if (!choiceList) return;
    choiceList.innerHTML = "";
  }

  function showPanelOnly(title = "") {
    if (choiceTitle) choiceTitle.textContent = title;
    clearText();
    clearChoices();
    if (choicePanel) choicePanel.classList.add("on");
  }

  function showChoices(title, choices, opts = {}) {
    const initialDelayMs = opts.initialDelayMs ?? 0;
    const staggerMs = opts.staggerMs ?? 0;

    if (choiceTitle) {
      choiceTitle.textContent = title ?? "Choisir :";
    }

    clearChoices();

    if (choicePanel) {
      choicePanel.classList.add("on");
    }

    if (!choiceList) return;

    if (!staggerMs && !initialDelayMs) {
      for (const c of choices) {
        const b = document.createElement("button");
        b.className = "choiceBtn";
        b.type = "button";
        b.textContent = c.label;
        b.addEventListener("click", () => onChoice(c.id), { once: true });
        choiceList.appendChild(b);
      }
      return;
    }

    choices.forEach((c, idx) => {
      const b = document.createElement("button");
      b.className = "choiceBtn";
      b.type = "button";
      b.textContent = c.label;
      b.style.opacity = "0";
      b.style.transform = "translateY(6px)";
      b.style.transition = "opacity 180ms ease, transform 180ms ease";
      b.disabled = true;

      b.addEventListener("click", () => onChoice(c.id), { once: true });

      choiceList.appendChild(b);

      const delay = initialDelayMs + idx * staggerMs;
      registerTimeout(() => {
        b.disabled = false;
        b.style.opacity = "1";
        b.style.transform = "translateY(0)";
      }, delay);
    });
  }

  function hideChoices() {
    clearChoices();
  }

  function setChoiceMap(map) {
    currentChoiceMap = map;
  }

  function getChoiceMap() {
    return currentChoiceMap;
  }

  if (textContainer) {
    textContainer.addEventListener("click", () => {
      skipCurrentTyping();
    });
  }

  return {
    clearTimers,
    wait,

    typeWriter,
    typeLines,
    typeText,
    skipCurrentTyping,

    fadeToBlack,
    fadeFromBlack,
    transitionToImage,

    clearText,
    clearChoices,
    showPanelOnly,
    showChoices,
    hideChoices,

    setChoiceMap,
    getChoiceMap,

    hideTextContainer,
    showTextContainer
  };
}

