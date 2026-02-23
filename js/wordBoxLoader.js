/**
 * ROLE: Load a random SVG "word box" shape (like old version)
 * IMPORTANT:
 * - Uses RELATIVE paths (./assets/...) so it works when served from a folder/subpath
 */

const WORD_BOX_PATHS = [
  "./assets/wordBox-01.svg",
  "./assets/wordBox-02.svg",
  "./assets/wordBox-03.svg",
  "./assets/wordBox-04.svg",
  "./assets/wordBox-05.svg"
];

export async function loadRandomWordBoxSvg() {
  const path = WORD_BOX_PATHS[Math.floor(Math.random() * WORD_BOX_PATHS.length)];
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return await res.text();
}
