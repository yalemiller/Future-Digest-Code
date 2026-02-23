/**
 * ROLE: Global app state (single source of truth)
 * WHAT IT DOES:
 * - Tracks current scene + backscroll clamp
 * - Tracks Scene 2 question flow + belly foods
 * - Tracks Scenes 3–6 focus index
 */

export const state = {
  currentStepId: "scene0",
  currentStepIndex: 0,
  minAllowedStepIndex: 0,
  maxVisitedStepIndex: 0,
  lastDirection: null, // "up" | "down"

  questions: {
    items: [
      { id: "q1", prompt: "I start my morning off with", hint: "Try: toast, eggs, cereal", answered: false, value: "", food: "" },
      { id: "q2", prompt: "For Lunch I’ll Have",          hint: "Try: salad, sandwich, soup", answered: false, value: "", food: "" },
      { id: "q3", prompt: "For a Snack I usually have",    hint: "Try: coffee, sandwich, peanuts", answered: false, value: "", food: "" },
      { id: "q4", prompt: "For Dinner I usually have",     hint: "Try: pasta, tacos, curry", answered: false, value: "", food: "" }
    ],
    activeIndex: 0,
    isComplete: false
  },

  belly: {
    foods: [] // { id, name, sourceQuestionId }
  },

  foodFocusIndex: 0,

  debug: { enableLogs: false }
};


// ---------- helpers ----------
export function setStep(stepId, index = null, direction = null) {
  state.currentStepId = stepId;

  if (index !== null) {
    state.currentStepIndex = index;
    if (index > state.maxVisitedStepIndex) state.maxVisitedStepIndex = index;
  }

  if (direction) state.lastDirection = direction;
  log("SET STEP →", stepId, index, direction);
}

export function setMinAllowedIndex(index) {
  const i = Number(index);
  if (!Number.isFinite(i)) return;
  state.minAllowedStepIndex = Math.max(state.minAllowedStepIndex, i);
  log("MIN ALLOWED →", state.minAllowedStepIndex);
}

export function setFoodFocusIndex(i) {
  const n = Number(i);
  state.foodFocusIndex = Number.isFinite(n) ? Math.max(0, n) : 0;
  log("FOCUS →", state.foodFocusIndex);
}

export function answerActiveQuestion(answerText, foodName) {
  const idx = state.questions.activeIndex;
  const q = state.questions.items[idx];
  if (!q) return;

  const value = (answerText ?? "").trim();
  const food = (foodName ?? "").trim();
  if (!value || !food) return;

  q.answered = true;
  q.value = value;
  q.food = food;

   state.belly.foods.push({
  id: `${q.id}-${Date.now()}`,
  name: food,
  foodKey: food.toLowerCase(),
  sourceQuestionId: q.id,
  color: colorForFood(food)
});

  state.questions.activeIndex += 1;

  if (state.questions.activeIndex >= state.questions.items.length) {
    state.questions.isComplete = true;
  }

  log("ANSWER →", q.id, { value, food }, "complete?", state.questions.isComplete);
}

function log(...args){
  if (state.debug.enableLogs) console.log("[STATE]", ...args);
}

function colorForFood(name){
  const palette = ["#5CC0E6", "#FF7A59", "#8ED081", "#9B7DFF", "#FFD166", "#EF476F"];
  const n = String(name || "");
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h*31 + n.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % palette.length;
  return palette[idx];
}
