// Scroll-reveal: project cards fade/rise into view as the user scrolls.
// Respects prefers-reduced-motion by showing everything immediately.

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealEls = document.querySelectorAll(".reveal");

if (prefersReducedMotion) {
  revealEls.forEach((el) => el.classList.add("in-view"));
} else if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  revealEls.forEach((el) => observer.observe(el));
} else {
  // Fallback for very old browsers without IntersectionObserver support.
  revealEls.forEach((el) => el.classList.add("in-view"));
}
