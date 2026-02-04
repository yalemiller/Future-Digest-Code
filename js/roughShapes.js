export function drawRoughSun(svgEl) {
  // rough is global from CDN
  const rc = rough.svg(svgEl);

  // clear any previous shape
  svgEl.innerHTML = "";

  const sun = rc.circle(120, 120, 180, {
    fill: "#e9ef3a",
    fillStyle: "solid",      // try: "hachure", "zigzag", "dots"
    stroke: "#e9ef3a",
    strokeWidth: 2,
    roughness: 1.8,          // higher = wobblier
    bowing: 1.6
  });

  svgEl.appendChild(sun);
}
