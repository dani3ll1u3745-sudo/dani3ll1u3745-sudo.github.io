// Simple typed-text effect for the hero "REPL" line.
// Respects prefers-reduced-motion by just showing the full line instantly.

const lines = [
  "import pandas as pd, sklearn, curiosity",
  "model.fit(data, ambition)",
  "print('still learning')"
];

const target = document.getElementById("typed");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (target) {
  if (prefersReducedMotion) {
    target.textContent = lines[0];
  } else {
    let lineIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
      const current = lines[lineIndex];

      if (!deleting) {
        target.textContent = current.slice(0, charIndex + 1);
        charIndex++;
        if (charIndex === current.length) {
          deleting = false;
          setTimeout(() => { deleting = true; tick(); }, 1800);
          return;
        }
      } else {
        target.textContent = current.slice(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
          deleting = false;
          lineIndex = (lineIndex + 1) % lines.length;
        }
      }

      setTimeout(tick, deleting ? 30 : 55);
    }

    tick();
  }
}
