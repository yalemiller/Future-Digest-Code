/**
 * ROLE: Scroll controller (traffic cop)
 * WHAT IT DOES:
 * - Updates state on step enter
 * - Enforces:
 *    - no rewinding before minAllowedStepIndex
 *    - scene2 gate: cannot advance down until questions complete
 *    - lockback: once you leave scene1 you can’t go back; same for scene2
 * - Sets food focus index for scenes 3–6
 * - Calls render(state) on enter
 */

import { state, setStep, setMinAllowedIndex, setFoodFocusIndex } from "./state.js";
import { stepById, stepIndexById } from "./steps.js";
import { render } from "./scene.js";

function scrollToStepIndex(index) {
  const el = document.querySelectorAll(".step")[index];
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export const controller = {
  async onStepEnter({ element, direction, index }) {
    // Clamp upward movement
    if (direction === "up" && index < state.minAllowedStepIndex) {
      scrollToStepIndex(state.minAllowedStepIndex);
      return;
    }

    const stepId = element.dataset.step;
    setStep(stepId, index, direction);

    // Scenes 3–6: set focus index 0..3
    if (["scene3", "scene4", "scene5", "scene6"].includes(stepId)) {
      const focusMap = { scene3: 0, scene4: 1, scene5: 2, scene6: 3 };
      setFoodFocusIndex(focusMap[stepId]);
    }

    await render(state);
  },

  onStepExit({ element, direction, index }) {
    const stepId = element.dataset.step;
    const def = stepById(stepId);

    // Gate: block leaving down out of scene2 until complete
    if (direction === "down" && def?.canAdvance) {
      const ok = def.canAdvance(state);
      if (!ok) {
        scrollToStepIndex(index);
        document.getElementById("foodInput")?.focus();
        return;
      }
    }

    // Lockback rules (only when leaving downward)
    if (direction === "down") {
      if (stepId === "scene1") {
        setMinAllowedIndex(stepIndexById("scene2"));
      }
      if (stepId === "scene2" && state.questions.isComplete) {
        setMinAllowedIndex(stepIndexById("scene3"));
      }
    }
  }
};
