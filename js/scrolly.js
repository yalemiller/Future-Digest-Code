/**
 * ROLE: Scrollama wiring (sensor only)
 * WHAT IT DOES:
 * - Initializes Scrollama to observe .step sections
 * - Calls controller on enter/exit
 */

import { controller } from "./controller.js";

export function initScrolly() {
  const scroller = window.scrollama();

  scroller
    .setup({
      step: ".step",
      offset: 0.5,     // center of viewport
      debug: false
    })
    .onStepEnter(controller.onStepEnter)
    .onStepExit(controller.onStepExit);

  window.addEventListener("resize", scroller.resize);
}
