/**
 * ROLE: Snap scrolling controller (one gesture -> one scene)
 *
 * WHAT IT DOES:
 * - Intercepts wheel / touch / keyboard scroll intent
 * - Prevents free scrolling
 * - Smooth-scrolls to the next/previous step section
 * - Respects gating and backscroll clamps via callbacks
 */

export function initSnapScroll({
  getCurrentIndex,
  getMinIndex,
  getMaxIndex,
  canMove,          // (direction, fromIndex, toIndex) => boolean
  onMoveBlocked,    // () => void
  scrollBehavior = "smooth",
  scrollBlock = "start"
} = {}) {
  let isAnimating = false;
  let lastTouchY = null;
  let wheelAccum = 0;
  let wheelTimer = null;

  const getSteps = () => Array.from(document.querySelectorAll(".step"));

  function scrollToIndex(i) {
    const steps = getSteps();
    const el = steps[i];
    if (!el) return;

    isAnimating = true;
    el.scrollIntoView({ behavior: scrollBehavior, block: scrollBlock });

    // Cooldown (match smooth scroll duration)
    window.setTimeout(() => {
      isAnimating = false;
    }, 650);
  }

  function requestMove(direction) {
    if (isAnimating) return;

    const curr = getCurrentIndex();
    const min = getMinIndex();
    const max = getMaxIndex();

    const target = Math.max(min, Math.min(max, curr + direction));
    if (target === curr) return;

    if (typeof canMove === "function" && !canMove(direction, curr, target)) {
      if (typeof onMoveBlocked === "function") onMoveBlocked();
      return;
    }

    scrollToIndex(target);
  }

  // ---------- Wheel ----------
  function onWheel(e) {
    // ignore horizontal trackpad gestures
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

    e.preventDefault();
    if (isAnimating) return;

    wheelAccum += e.deltaY;

    // debounced threshold so trackpads don't multi-trigger
    if (wheelTimer) window.clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(() => {
      const dy = wheelAccum;
      wheelAccum = 0;

      if (Math.abs(dy) < 25) return; // ignore micro scroll
      requestMove(dy > 0 ? 1 : -1);
    }, 50);
  }

  // ---------- Keyboard ----------
  function onKeyDown(e) {
    const downKeys = ["ArrowDown", "PageDown", " ", "Enter"];
    const upKeys = ["ArrowUp", "PageUp"];

    if (![...downKeys, ...upKeys].includes(e.key)) return;

    e.preventDefault();
    requestMove(downKeys.includes(e.key) ? 1 : -1);
  }

  // ---------- Touch ----------
  function onTouchStart(e) {
    if (e.touches?.length !== 1) return;
    lastTouchY = e.touches[0].clientY;
  }

  function onTouchMove(e) {
    if (lastTouchY == null) return;

    const y = e.touches[0].clientY;
    const dy = lastTouchY - y;

    // stop native scroll
    e.preventDefault();

    // require a decent swipe to trigger
    if (Math.abs(dy) > 30) {
      requestMove(dy > 0 ? 1 : -1);
      lastTouchY = null;
    }
  }

  // IMPORTANT: passive:false so preventDefault works
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKeyDown, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });

  // Return cleanup
  return () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
  };
}
