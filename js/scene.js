import { state, setSelection, nextStep, hasUsedFood } from "./state.js";
import { isFoodSupported, normalizeFood } from "./foodDb.js";
import { THEMES, applyTheme } from "./themes.js";


export const STEPS = [
  { key: "breakfast", text: "I start my morning off with" },
  { key: "lunch",     text: "For Lunch I’ll Have" },
  { key: "snack",     text: "For a Snack I usually have" },
  { key: "dinner",    text: "For Dinner I usually have" },
  { key: "favorite",  text: "My favorite food is" }
];

export function initScene({ onComplete } = {}) {
  const scene = document.getElementById("scene");
  const bgEl = document.getElementById("bg");
  const grassEl = document.getElementById("grass");
  const sunEl = document.getElementById("sun");
  const promptText = document.getElementById("promptText");
  const input = document.getElementById("foodInput");
  const belly = document.getElementById("belly");
  const phone = document.querySelector(".phone");

  const els = { bgEl, grassEl, sunEl };

  function setPrompt(i) {
    promptText.textContent = STEPS[i].text;
    input.value = "";
    input.focus();
  }

  function addFoodBlock(label) {
    const div = document.createElement("div");
    div.className = "foodBlock";
    div.textContent = label;
    belly.prepend(div);
  }

  function buzzError() {
    scene.classList.add("badInput");
    phone.classList.remove("buzz");
    void phone.offsetWidth; // restart animation
    phone.classList.add("buzz");
    setTimeout(() => scene.classList.remove("badInput"), 700);
  }

  function submit() {
  const raw = input.value;
  const val = normalizeFood(raw);
  const step = STEPS[state.stepIndex];

  if (!val) return;

  // must be in your database
  if (!isFoodSupported(val)) {
    buzzError();
    return;
  }

  // NEW: must not already be used
  if (hasUsedFood(val)) {
    buzzError();
    return;
  }

  setSelection(step.key, val);
  addFoodBlock(raw.trim());

  const i = nextStep();

  if (i >= STEPS.length) {
    onComplete?.(state.selections);
    return;
  }

  applyTheme(els, THEMES[Math.min(i, THEMES.length - 1)]);
  setPrompt(i);
}


  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });

  // init
  applyTheme(els, THEMES[0]);
  setPrompt(0);
}
