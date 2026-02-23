// js/foodMeta.js

let FOOD_MAP = {};   // { coffee: {...}, salmon: {...} }
let FOOD_LIST = [];  // raw array for reference

export async function loadFoodData() {
  const res = await fetch("data/foods.json");
  const json = await res.json();

  FOOD_LIST = json.foods || [];

  FOOD_MAP = {};
  for (const food of FOOD_LIST) {
    FOOD_MAP[food.id.toLowerCase()] = food;
  }

  console.log("[FOOD DATA LOADED]", FOOD_MAP);
}

export function isKnownFood(input) {
  if (!input) return false;
  const key = normalize(input);
  return !!FOOD_MAP[key];
}

export function getFoodMeta(foodName) {
  const key = normalize(foodName);
  const food = FOOD_MAP[key];

  if (!food) return null;

  const current = food.cost?.currentAvg ?? null;
  const predicted = food.cost?.predictedAvg ?? null;

  let pctRise = null;
  if (current && predicted) {
    pctRise = Math.round(((predicted - current) / current) * 100);
  }

  return {
    title: food.name,
    riskLevel: formatRisk(food.riskLevel),
    riskDriver: formatThreat(food.primaryThreat),
    priceFrom: current,
    priceTo: predicted,
    pctRise,
    affected: food.categories ?? []
  };
}

export function formatUSD(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `$${Number(n).toFixed(2)}`;
}

function normalize(str) {
  return String(str).trim().toLowerCase();
}

function formatRisk(risk) {
  if (!risk) return "Unknown Risk";
  return risk.charAt(0).toUpperCase() + risk.slice(1) + " Risk";
}

function formatThreat(threat) {
  if (!threat || threat === "none") return "No Immediate Threat";
  return threat
    .replaceAll("_", " ")
    .replace(/\b\w/g, l => l.toUpperCase());
}