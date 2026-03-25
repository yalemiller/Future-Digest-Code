/**
 * ROLE: Scrollama scene tracking + Scene 2 lock + background slide to green on Scene 3+
 */

import {
  state,
  setStep,
  answerActiveQuestion,
  setFoodFocusIndex
} from "./state.js";

import { render } from "./scene.js";
import { loadFoodData, isKnownFood } from "./foodMeta.js";

const sceneIds = ["scene0","sceneIntro","scene1","scene2","scene3","scene4","scene5","scene6","scene7"];

function getContainer(){ return document.getElementById("snapContainer"); }

// ---------------- SCENE 2 LOCK ----------------

function lockScrollToScene2(){
  const container = getContainer();
  const scene2 = document.getElementById("scene2");
  if (!container || !scene2) return;
  container.scrollTop = scene2.offsetTop;
  container.style.overflowY = "hidden";
}

function unlockScroll(){
  const container = getContainer();
  if (!container) return;
  container.style.overflowY = "auto";
}

function enforceScene2PinIfLocked(){
  const container = getContainer();
  const scene2 = document.getElementById("scene2");
  if (!container || !scene2) return;

  const locked = (state.currentStepId === "scene2" && !state.questions.isComplete);
  if (!locked) return;

  if (Math.abs(container.scrollTop - scene2.offsetTop) > 2) {
    container.scrollTop = scene2.offsetTop;
  }
}

// ---------------- SCENE 2 INPUT ----------------

function setupScene2Input(){
  const input = document.getElementById("foodInput");
  const qTitle = document.getElementById("qTitle");
  const hint = document.getElementById("promptHint");
  const scene2Hint = document.getElementById("scene2Hint");

  function syncUI(){
    const q = state.questions.items[state.questions.activeIndex];

    if (!q) {
      qTitle.textContent = "All questions answered.";
      hint.textContent = "";
      scene2Hint.textContent = "Scroll to continue.";
      input.value = "";
      input.disabled = true;
      unlockScroll();
      return;
    }

    qTitle.textContent = q.prompt;
    hint.textContent = q.hint ?? "";
    scene2Hint.textContent = `Question ${state.questions.activeIndex + 1} of ${state.questions.items.length}`;
    input.disabled = false;
  }

  function submit(){
    if (state.currentStepId !== "scene2") return;

    const value = (input.value ?? "").trim();
    if (!value) return input.focus();

    if (!isKnownFood(value)) {
      scene2Hint.textContent = "That food isn't in our database. Try another.";
      input.classList.add("inputError");
      return;
    }

    input.classList.remove("inputError");

    answerActiveQuestion(value, value.toLowerCase());

    input.value = "";
    syncUI();
    render(state);

    if (!state.questions.isComplete) {
      lockScrollToScene2();
      input.focus();
    } else {
      input.blur();
    }
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });

  syncUI();
}

// ---------------- APPLY STEP (STATE MACHINE) ----------------

let lastStepId = null;

async function applyStep(stepId){
  if (!stepId) return;

  // 🚧 HARD GATE: block forward progression past Scene 2
  if (
    !state.questions.isComplete &&
    ["scene3","scene4","scene5","scene6","scene7"].includes(stepId)
  ) {
    lockScrollToScene2();
    document.getElementById("foodInput")?.focus();
    return;
  }

  if (stepId === lastStepId) return;
  lastStepId = stepId;

  const index = sceneIds.indexOf(stepId);
  setStep(stepId, index, null);

  const scene0Title = document.getElementById("scene0Title");
  if (scene0Title) {
    scene0Title.classList.toggle("scene0-active", stepId === "scene0");
    scene0Title.classList.toggle("scene0-exit", stepId !== "scene0");
  }

  document.body.classList.toggle("scene0-active", stepId === "scene0");

  const introCopy = document.getElementById("sceneIntroCopy");
  const scene1Copy = document.getElementById("scene1Copy");
  const scene2UI   = document.getElementById("scene2UI");

  if (introCopy) introCopy.style.display = (stepId === "sceneIntro") ? "block" : "none";
  if (scene1Copy) scene1Copy.style.display = (stepId === "scene1") ? "block" : "none";
  if (scene2UI)   scene2UI.style.display   = (stepId === "scene2") ? "block" : "none";

  document.body.classList.toggle("head-only", stepId === "sceneIntro");

  document.body.classList.toggle(
    "chest-frame",
    ["scene1","scene2","scene3","scene4","scene5","scene6","scene7"].includes(stepId)
  );

  document.body.classList.toggle("intro-bg-on", ["scene1","scene2"].includes(stepId));

  document.body.classList.toggle(
    "bg-is-green",
    ["scene3","scene4","scene5","scene6","scene7"].includes(stepId)
  );

  if (["scene3","scene4","scene5","scene6"].includes(stepId)) {
    const focusMap = { scene3:0, scene4:1, scene5:2, scene6:3 };
    setFoodFocusIndex(focusMap[stepId]);
  }

  if (stepId === "scene2" && !state.questions.isComplete) {
    lockScrollToScene2();
    document.getElementById("foodInput")?.focus();
  } else {
    unlockScroll();
  }

  await render(state);
  enforceScene2PinIfLocked();
}

// ---------------- SCROLLAMA SETUP ----------------

function setupScrollama(){
  const scroller = window.scrollama();

  scroller
    .setup({
      step: ".scene",
      offset: 0.55,
      debug: false,
      container: "#snapContainer"
    })
    .onStepEnter(async ({ element }) => {
      const stepId = element.dataset.step;
      await applyStep(stepId);
    });

  const container = getContainer();

  container?.addEventListener("scroll", () => {
    enforceScene2PinIfLocked();
  }, { passive: true });

  window.addEventListener("resize", () => scroller.resize());
}

// ---------------- BOOT ----------------

async function boot() {
  await loadFoodData();

  setupScene2Input();
  setupScrollama();

  await applyStep("scene0");
  render(state);
}

boot();