/**
 * ROLE: Scene renderer (DOM-based)
 * WHAT IT DOES:
 * - Incrementally adds belly food blocks (no full rerender)
 * - Updates focus styling by toggling classes only
 * - Renders focus card in scenes 3–6
 */

import { loadRandomWordBoxSvg } from "./wordBoxLoader.js";
import { getFoodMeta, formatUSD } from "./foodMeta.js";
import { renderPriceChart } from "./renderPriceChart.js";

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

  // Special case:
  // On the first food-detail scene, keep the focused block visually "stable"
  // so it does not appear to swap with a second circle.
  const isFirstFocusScene = state.currentStepId === "scene3";

  for (const [id, el] of blockMap.entries()) {
    el.classList.remove("isFocus", "isNotFocus", "isFocusStatic");

    if (!focusActive) continue;

    if (id === focusedId) {
      if (isFirstFocusScene) {
        el.classList.add("isFocusStatic");
      } else {
        el.classList.add("isFocus");
      }
    } else {
      el.classList.add("isNotFocus");
    }
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
    card = document.createElement("div");
    card.className = "focusCard";
    panel.appendChild(card);
  }

  if (!focusActive || !focused) {
    card.classList.remove("isVisible");
    return;
  }

  const meta = getFoodMeta(focused.foodKey || focused.name);
  if (!meta) {
    card.classList.remove("isVisible");
    return;
  }

  // Use food color (or fallback)
const baseColor = focused.color || "#5CC0E6";
const darkColor = darkenColor(baseColor, 0.45); // 45% darker

card.style.setProperty("--foodColor", baseColor);
card.style.setProperty("--foodColorDark", darkColor);

card.innerHTML = `
  <div class="focusHeader">
    <div class="focusHeaderRow">
      <h2 class="focusTitle">${escapeHtml(meta.title)}</h2>

      <div class="focusCategoryIcons" aria-label="Food categories">
        ${renderCategoryIcons(meta.categories)}
      </div>
    </div>
  </div>

  <div class="focusDivider" aria-hidden="true"></div>

  <div class="focusBody">
    
    <!-- LEFT COLUMN -->
    <div class="focusCol focusColLeft">
      
      <div class="focusRiskBlock">
        <div class="focusLabel">Risk Level:</div>
        <div class="focusRiskValue">
          ${escapeHtml(getRiskWord(meta.riskLevel))}
        </div>
      </div>

      <div class="focusThreatBlock">
        <div class="focusLabel">Threatened by:</div>
        <ol class="focusThreatList">
          ${renderThreatList(meta)}
        </ol>
      </div>

    </div>

    <!-- RIGHT COLUMN -->
    <div class="focusCol focusColRight">
      ${renderPriceChart(meta)}
    </div>

  </div>
`;

  // Fade in (ensure next paint)
  requestAnimationFrame(() => card.classList.add("isVisible"));
}

function getRiskWord(riskLevel = ""){
  return String(riskLevel)
    .replace(/\s*risk\s*$/i, "")
    .trim()
    .toUpperCase();
}

function darkenColor(hex, amount = 0.4){
  let c = hex.replace("#","");

  if (c.length === 3) {
    c = c.split("").map(x => x + x).join("");
  }

  const num = parseInt(c, 16);

  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;

  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));

  return `rgb(${r}, ${g}, ${b})`;
}

function renderThreatList(meta){
  const threats = getThreatItems(meta);

  return threats.map((threat) => `
    <li>${escapeHtml(threat)}</li>
  `).join("");
}

function getThreatItems(meta){
  if (!meta) return [];

  if (Array.isArray(meta.threats) && meta.threats.length > 0) {
    return meta.threats;
  }

  if (meta.riskDriver) {
    return [meta.riskDriver];
  }

  return ["No Immediate Threat"];
}

function renderCategoryIcons(categories = []){
  if (!Array.isArray(categories) || categories.length === 0) return "";

  return categories.map((category) => {
    const safeCategory = String(category).trim().toLowerCase();
    const encodedCategory = encodeURIComponent(safeCategory);

    return `
      <img
        class="focusCategoryIcon"
        src="assets/${encodedCategory}.png"
        alt="${escapeHtml(safeCategory)} icon"
      />
    `;
  }).join("");
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}