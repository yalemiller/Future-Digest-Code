export const state = {
  stepIndex: 0,
  selections: {},      // { breakfast: "coffee", ... }
  usedFoods: new Set() // tracks normalized foods already chosen
};

export function setSelection(key, value) {
  state.selections[key] = value;
  state.usedFoods.add(value); // value should already be normalized
}

export function hasUsedFood(value) {
  return state.usedFoods.has(value);
}

export function nextStep() {
  state.stepIndex += 1;
  return state.stepIndex;
}
