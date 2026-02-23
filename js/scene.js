/**
 * ROLE: Scene renderer (DOM-based)
 * WHAT IT DOES:
 * - Incrementally adds belly food blocks (no full rerender)
 * - Updates focus styling by toggling classes only
 * - Renders focus card in scenes 3–6
 */

import { loadRandomWordBoxSvg } from "./wordBoxLoader.js";
import { getFoodMeta, formatUSD } from "./foodMeta.js";

/* ---------------------------------------
   Incremental belly rendering (FAST)
---------------------------------------- */

const BELLY_IDS = ["phoneBelly","phoneBelly2","phoneBelly3","phoneBelly4","phoneBelly5","phoneBelly6"];

// per-belly: Map<foodId, HTMLElement>
const blockMapsByBellyId = new Map();

// cache the expensive SVG so we don't fetch/generate on every append
let cachedWordBoxSvg = null;
async function getWordBoxSvgOnce(){
  if (cachedWordBoxSvg != null) return cachedWordBoxSvg;
  try {
    cachedWordBoxSvg = await loadRandomWordBoxSvg();
  } catch {
    cachedWordBoxSvg = "";
  }
  return cachedWordBoxSvg;
}

function getBlockMapForBelly(bellyId){
  let map = blockMapsByBellyId.get(bellyId);
  if (!map) {
    map = new Map();
    blockMapsByBellyId.set(bellyId, map);
  }
  return map;
}

async function ensureBellyBlock(bellyEl, blockMap, food){
  if (!food?.id) return;
  if (blockMap.has(food.id)) return;

  const el = document.createElement("div");
  el.className = "foodBlock";
  el.dataset.id = food.id;
  el.style.setProperty("--foodColor", food.color || "#5CC0E6");

  const svgMarkup = await getWordBoxSvgOnce();

  // IMPORTANT: minimal DOM structure; avoid rebuilds
  el.innerHTML = `${svgMarkup}<div class="label"></div>`;
  el.querySelector(".label").textContent = food.name;

  bellyEl.appendChild(el);
  blockMap.set(food.id, el);
}

function updateBellyFocus(bellyEl, blockMap, state){
  const foods = state.belly.foods;

  const focusActive = ["scene3","scene4","scene5","scene6"].includes(state.currentStepId);
  const focused = foods[state.foodFocusIndex];
  const focusedId = focused?.id;

  // Only toggle classes; no DOM rebuild
  for (const [id, el] of blockMap.entries()) {
    el.classList.remove("isFocus", "isNotFocus");

    if (!focusActive) continue;

    if (id === focusedId) el.classList.add("isFocus");
    else el.classList.add("isNotFocus");
  }
}

async function renderBellyIncremental(bellyId, state){
  const bellyEl = document.getElementById(bellyId);
  if (!bellyEl) return;

  const blockMap = getBlockMapForBelly(bellyId);
  const foods = state.belly.foods;

  // Append only NEW blocks
  for (const food of foods) {
    await ensureBellyBlock(bellyEl, blockMap, food);
  }

  // Update focus classes
  updateBellyFocus(bellyEl, blockMap, state);
}

/* ---------------------------------------
   Public render()
---------------------------------------- */

export async function render(state){
  // Incremental bellies
  for (const id of BELLY_IDS) {
    await renderBellyIncremental(id, state);
  }

  // Focus card
  renderFocusPanel(state);
}

/* ---------------------------------------
   Focus panel (left)
---------------------------------------- */

function renderFocusPanel(state){
  const panel = document.getElementById("vizStage");
  if (!panel) return;

  const focusActive = ["scene3","scene4","scene5","scene6"].includes(state.currentStepId);
  const focused = state.belly.foods[state.foodFocusIndex];

  // Ensure card exists once so opacity transitions work
  let card = panel.querySelector(".focusCard");
  if (!card) {
    panel.innerHTML = `<div class="focusCard"></div>`;
    card = panel.querySelector(".focusCard");
  }

  if (!focusActive || !focused) {
    card.classList.remove("isVisible");
    return;
  }

  const meta = getFoodMeta(focused.foodKey || focused.name);

  // Use food color (or fallback)
  card.style.setProperty("--foodColor", focused.color || "#5CC0E6");

  card.innerHTML = `
    <div class="focusTop">
      <div class="focusTitleWrap">
        <div class="focusTitle">${escapeHtml(meta.title)}</div>
        <div class="focusRisk">${escapeHtml(meta.riskLevel)}</div>
      </div>

      <div class="focusIcons" aria-hidden="true">
        <span class="focusIconDot"></span>
        <span class="focusIconDot"></span>
      </div>
    </div>

    <div class="focusDriver">${escapeHtml(meta.riskDriver)}</div>

    <div class="focusStats">
      <div class="focusPrice">
        <span class="focusPriceBig">${formatUSD(meta.priceFrom)}</span>
        <span class="focusPriceMid">to</span>
        <span class="focusPriceBig">${formatUSD(meta.priceTo)}</span>
      </div>

      <div class="focusPct">
        <span class="focusPctBig">${meta.pctRise != null ? `${meta.pctRise}%` : "—"}</span>
        <span class="focusPctSub">rise in avg cost</span>
      </div>
    </div>

    <div class="focusBottom">
      <div class="focusBottomTitle">Affected Ingredients</div>
      <div class="focusBottomList">${escapeHtml((meta.affected || []).join(", "))}</div>
    </div>
  `;

  // Fade in (ensure next paint)
  requestAnimationFrame(() => card.classList.add("isVisible"));
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}