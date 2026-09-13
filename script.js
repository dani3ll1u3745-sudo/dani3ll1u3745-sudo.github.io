/**
 * Portfolio interactions
 * - Scroll reveal
 * - Dark/light theme toggle
 * - Live Melbourne clock
 * - GitHub latest-commit widget
 * - Gallery lightbox + keyboard controls
 * - Graceful handling of missing images / resume PDF
 */

(() => {
  "use strict";

  const root = document.documentElement;
  const THEME_KEY = "daniel-portfolio-theme";

  const q = (selector) => document.querySelector(selector);
  const qa = (selector) => [...document.querySelectorAll(selector)];

  const themes = {
    dark: {
      "--paper": "#0B0C0F",
      "--ink": "#F4F2ED",
      "--signal": "#7C9CFF",
      "--signal-dim": "rgba(124,156,255,0.35)",
      "--sage": "#8B93A1",
      "--hairline": "#232630",
      "--paper-raised": "#15171C",
    },
    light: {
      "--paper": "#F5F4EF",
      "--ink": "#17181B",
      "--signal": "#526DCC",
      "--signal-dim": "rgba(82,109,204,0.22)",
      "--sage": "#626975",
      "--hairline": "#D8D9DE",
      "--paper-raised": "#FFFFFF",
    },
  };

  function applyTheme(theme) {
    const selected = theme === "light" ? "light" : "dark";
    Object.entries(themes[selected]).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
    root.dataset.theme = selected;
    localStorage.setItem(THEME_KEY, selected);

    qa(".theme-toggle").forEach((toggle) => {
      toggle.innerHTML = '<span class="theme-icon">☀</span>';
      toggle.setAttribute("aria-label", selected === "dark" ? "Switch to light mode" : "Switch to dark mode");
      toggle.setAttribute("title", selected === "dark" ? "Switch to light mode" : "Switch to dark mode");
    });
  }

  applyTheme(localStorage.getItem(THEME_KEY) || root.dataset.theme || "dark");
  qa(".theme-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
    });
  });

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealEls = qa(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("in-view"));
  } else {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach((el) => observer.observe(el));
  }

  const clockText = q("#clockText");
  function updateClock() {
    if (!clockText) return;
    const now = new Date();
    const formatted = new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Melbourne",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      weekday: "short",
    }).format(now);
    clockText.textContent = `${formatted} · Melbourne`;
  }
  updateClock();
  window.setInterval(updateClock, 1000);

  const locationText = q("#locationText");
  const locationWidget = q("#locationWidget");
  function setLocationFallback() {
    if (!locationText) return;
    locationText.textContent = "Melbourne, Australia";
    if (locationWidget) locationWidget.title = "Portfolio timezone: Australia/Melbourne";
  }

  function loadLocation() {
    if (!locationText) return;
    setLocationFallback();
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=10`;
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("Reverse geocoding failed");
        const data = await response.json();
        const address = data.address || {};
        const city = address.city || address.town || address.municipality || address.suburb || "Current location";
        const country = address.country || "";
        locationText.textContent = [city, country].filter(Boolean).join(", ");
      } catch {
        setLocationFallback();
      }
    }, setLocationFallback, {
      enableHighAccuracy: false,
      timeout: 6000,
      maximumAge: 15 * 60 * 1000,
    });
  }
  loadLocation();

  const ghCommits = q("#ghCommits");
  const repoUrl = "https://api.github.com/repos/dani3ll1u3745-sudo/dani3ll1u3745-sudo.github.io/commits?per_page=1";

  function relativeTime(dateString) {
    const diff = Math.max(0, Date.now() - new Date(dateString).getTime());
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < minute) return "just now";
    if (diff < hour) {
      const n = Math.floor(diff / minute);
      return `${n} min${n === 1 ? "" : "s"} ago`;
    }
    if (diff < day) {
      const n = Math.floor(diff / hour);
      return `${n} hour${n === 1 ? "" : "s"} ago`;
    }
    const n = Math.floor(diff / day);
    return `${n} day${n === 1 ? "" : "s"} ago`;
  }

  async function loadGitHubCommit() {
    if (!ghCommits) return;
    try {
      const response = await fetch(repoUrl, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`GitHub API ${response.status}`);
      const commits = await response.json();
      const latest = commits?.[0];
      if (!latest) throw new Error("No commits found");

      const message = (latest.commit?.message || "Latest commit").split("\n")[0].trim();
      const date = latest.commit?.author?.date || latest.commit?.committer?.date;
      ghCommits.textContent = date ? `GitHub · updated ${relativeTime(date)}` : `GitHub · ${message}`;

      const widget = q("#ghWidget");
      if (widget) {
        widget.title = message;
        widget.style.cursor = "pointer";
        widget.addEventListener("click", () => {
          window.open(latest.html_url || "https://github.com/dani3ll1u3745-sudo/dani3ll1u3745-sudo.github.io/commits/main", "_blank", "noopener");
        });
      }
    } catch {
      ghCommits.textContent = "GitHub · unavailable";
    }
  }
  loadGitHubCommit();

  const lightbox = q("#lightbox");
  const lightboxImg = q("#lightboxImg");
  const galleryImages = qa(".gallery-item img").map((img) => {
    let src = img.getAttribute("src") || "";
    if (/\.jpg$/i.test(src)) {
      src = src.replace(/\.jpg$/i, ".webp");
      img.setAttribute("src", src);
    }
    return {
      src,
      alt: img.getAttribute("alt") || "",
    };
  });
  let lightboxIndex = 0;

  function renderLightbox() {
    if (!lightbox || !lightboxImg || !galleryImages.length) return;
    const item = galleryImages[lightboxIndex];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt;
  }

  window.openLightbox = (index) => {
    if (!lightbox || !galleryImages.length) return;
    lightboxIndex = ((Number(index) || 0) % galleryImages.length + galleryImages.length) % galleryImages.length;
    renderLightbox();
    lightbox.classList.add("open");
    document.body.classList.add("lightbox-open");
  };

  window.closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove("open");
    document.body.classList.remove("lightbox-open");
  };

  window.shiftLightbox = (delta) => {
    if (!galleryImages.length) return;
    lightboxIndex = (lightboxIndex + delta + galleryImages.length) % galleryImages.length;
    renderLightbox();
  };

  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) window.closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox?.classList.contains("open")) return;
    if (event.key === "Escape") window.closeLightbox();
    if (event.key === "ArrowLeft") window.shiftLightbox(-1);
    if (event.key === "ArrowRight") window.shiftLightbox(1);
  });

  qa(".gallery-item img").forEach((img) => {
    img.addEventListener("error", () => {
      const item = img.closest(".gallery-item");
      if (!item) return;
      item.classList.add("image-missing");
      img.alt = "Image not available yet";
    });
  });

  qa('a[href="resume.pdf"]').forEach((link) => {
    fetch("resume.pdf", { method: "HEAD", cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          link.classList.add("missing-resource");
          link.title = "Add resume.pdf to the repository to enable this link";
        }
      })
      .catch(() => {});
  });

  const style = document.createElement("style");
  style.textContent = `
    .theme-toggle{border:1px solid var(--hairline);background:var(--paper-raised);color:var(--ink);width:42px;height:42px;border-radius:999px;cursor:pointer;display:inline-grid;place-items:center;font:inherit;transition:transform .2s ease,border-color .2s ease,background .2s ease}
    .theme-toggle:hover{transform:translateY(-1px);border-color:var(--signal)}
    .theme-icon{font-size:18px;line-height:1;color:var(--ink)}
    .lightbox{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:5vh 5vw;background:rgba(0,0,0,.88);backdrop-filter:blur(8px)}
    .lightbox.open{display:flex}
    .lightbox-img{max-width:min(90vw,1200px);max-height:85vh;object-fit:contain;border-radius:8px;box-shadow:0 20px 70px rgba(0,0,0,.45)}
    .lightbox-close,.lightbox-prev,.lightbox-next{position:absolute;border:0;color:#fff;background:rgba(255,255,255,.12);width:44px;height:44px;border-radius:50%;cursor:pointer;font:inherit;font-size:28px}
    .lightbox-close{top:20px;right:24px}.lightbox-prev{left:24px;top:50%;transform:translateY(-50%)}.lightbox-next{right:24px;top:50%;transform:translateY(-50%)}
    .lightbox-close:hover,.lightbox-prev:hover,.lightbox-next:hover{background:rgba(255,255,255,.22)}
    body.lightbox-open{overflow:hidden}
    .gallery-item.image-missing{opacity:.62;cursor:default}
    .gallery-item.image-missing img{min-height:180px;background:var(--paper-raised);object-fit:cover}
    .gallery-item.image-missing .gallery-overlay span::after{content:" · image not uploaded";opacity:.8}
    .missing-resource{opacity:.7;text-decoration-style:dotted!important}
    [data-theme="light"] .site-header{background:rgba(245,244,239,.88)}
    [data-theme="light"] .project-points{color:#4d515b}
    [data-theme="light"] .btn-primary{color:#fff}
    [data-theme="light"] .hero-glow{opacity:.7}
  `;
  document.head.appendChild(style);

  // Load the final CSS overrides after the site's main stylesheet so they win over its pseudo-element.
  const fixLink = document.createElement("link");
  fixLink.rel = "stylesheet";
  fixLink.href = "theme-fix.css";
  document.head.appendChild(fixLink);
})();
