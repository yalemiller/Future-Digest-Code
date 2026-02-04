export const THEMES = [
  { bg: "#b7b7ff", grass: "#2fe07a", sunX: 0 },
  { bg: "#a6f2ff", grass: "#65d75f", sunX: 260 },
  { bg: "#a6f2ff", grass: "#65d75f", sunX: 520 },
  { bg: "#a6f2ff", grass: "#65d75f", sunX: 780 },
  { bg: "#a6f2ff", grass: "#65d75f", sunX: 1040 }
];

export function applyTheme({ bgEl, grassEl, sunEl }, theme) {
  bgEl.style.background = `linear-gradient(${theme.bg}, #dfead2)`;
  grassEl.style.background = theme.grass;
  sunEl.style.transform = `translateX(${theme.sunX}px)`;
}
