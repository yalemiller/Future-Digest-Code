const FOOD_DB = new Set([
  "coffee",
  "sandwich",
  "peanuts",
  "rice",
  "chocolate",
  "avocado",
  "chicken",
  "taco"
]);

export function normalizeFood(s) {
  return s.trim().toLowerCase();
}

export function isFoodSupported(s) {
  return FOOD_DB.has(normalizeFood(s));
}
