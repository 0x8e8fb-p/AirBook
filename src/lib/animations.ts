"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const EASE = {
  enter: "power4.out",
  hover: "power2.out",
  exit: "power3.in",
  spring: "elastic.out(1, 0.4)",
  data: "expo.inOut",
  scroll: "none",
  counter: "power1.inOut",
} as const;

export function registerGSAP() {
  gsap.registerPlugin(ScrollTrigger);
}

export function initHeroAnimations() {
  const tl = gsap.timeline({ delay: 0.3 });

  tl.fromTo(
    ".hero__badge",
    { opacity: 0, y: 20, scale: 0.9 },
    { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: EASE.enter }
  );

  tl.fromTo(
    ".hero__title-line",
    { opacity: 0, y: 60, skewY: 3 },
    { opacity: 1, y: 0, skewY: 0, duration: 0.9, ease: EASE.enter, stagger: 0.12 },
    "-=0.3"
  );

  tl.fromTo(
    ".hero__subtitle",
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.6, ease: EASE.enter },
    "-=0.4"
  );

  tl.fromTo(
    "#search-card",
    { opacity: 0, y: 40, rotateX: -8, transformPerspective: 1000 },
    { opacity: 1, y: 0, rotateX: 0, duration: 0.8, ease: EASE.enter },
    "-=0.3"
  );

  tl.fromTo(
    ".hero__stat",
    { opacity: 0, y: 15 },
    { opacity: 1, y: 0, duration: 0.5, ease: EASE.enter, stagger: 0.1 },
    "-=0.2"
  );

  tl.fromTo(
    ".hero__scroll",
    { opacity: 0 },
    { opacity: 1, duration: 1.2 },
    "+=0.5"
  );

  return tl;
}

export function initCounters() {
  document.querySelectorAll<HTMLElement>("[data-counter]").forEach((el) => {
    const target = parseInt(el.dataset.counter || "0");
    const prefix = el.dataset.prefix || "";
    gsap.fromTo(
      { val: 0 },
      { val: target },
      {
        duration: 2.5,
        ease: EASE.counter,
        onUpdate() {
          // @ts-ignore
          el.textContent = prefix + Math.round(this.targets()[0].val).toLocaleString("en-IN");
        },
      }
    );
  });
}

export function initScrollAnimations() {
  // Section headers text reveal
  gsap.utils.toArray<HTMLElement>(".section-title").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: EASE.enter,
        scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
      }
    );
  });

  // How-it-works steps
  gsap.utils.toArray<HTMLElement>(".how-step").forEach((el, i) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 60, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        ease: EASE.enter,
        delay: i * 0.15,
        scrollTrigger: {
          trigger: ".how-steps",
          start: "top 75%",
          toggleActions: "play none none none",
        },
      }
    );
  });

  // Route cards 3D flip-in
  gsap.utils.toArray<HTMLElement>(".route-card").forEach((el, i) => {
    gsap.fromTo(
      el,
      { opacity: 0, rotateY: -25, transformPerspective: 800, scale: 0.92 },
      {
        opacity: 1,
        rotateY: 0,
        scale: 1,
        duration: 0.9,
        ease: EASE.enter,
        delay: i * 0.1,
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      }
    );
  });

  // Deals strip
  gsap.fromTo(
    ".deals-strip",
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: EASE.enter,
      scrollTrigger: {
        trigger: ".deals-strip",
        start: "top 85%",
        toggleActions: "play none none none",
      },
    }
  );

  // Intelligence section
  gsap.fromTo(
    ".intelligence-section",
    { opacity: 0, y: 40 },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: EASE.enter,
      scrollTrigger: {
        trigger: ".intelligence-section",
        start: "top 80%",
        toggleActions: "play none none none",
      },
    }
  );

  // Airlines
  gsap.utils.toArray<HTMLElement>(".airline-card").forEach((el, i) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: EASE.enter,
        delay: i * 0.08,
        scrollTrigger: {
          trigger: ".airlines-grid",
          start: "top 80%",
          toggleActions: "play none none none",
        },
      }
    );
  });

  // Testimonials
  gsap.fromTo(
    ".testimonials-section",
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: EASE.enter,
      scrollTrigger: {
        trigger: ".testimonials-section",
        start: "top 85%",
        toggleActions: "play none none none",
      },
    }
  );

  // Globe scroll-out
  ScrollTrigger.create({
    trigger: "#hero",
    start: "top top",
    end: "bottom top",
    scrub: true,
    onUpdate(self) {
      const progress = self.progress;
      const globeGroup = document.querySelector(".globe-group");
      if (globeGroup) {
        const scale = 1 - progress * 0.3;
        (globeGroup as HTMLElement).style.transform = `scale(${scale})`;
        (globeGroup as HTMLElement).style.opacity = String(1 - progress * 0.8);
      }
    },
  });
}

export function initNavScroll() {
  const nav = document.querySelector(".nav-main");
  if (!nav) return;
  let lastY = 0;

  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;

      if (y > 60) {
        nav.classList.add("nav-solid");
      } else {
        nav.classList.remove("nav-solid");
      }

      if (y > 200) {
        if (y > lastY) {
          gsap.to(nav, { y: -100, duration: 0.4, ease: EASE.enter });
        } else {
          gsap.to(nav, { y: 0, duration: 0.4, ease: EASE.enter });
        }
      }

      lastY = y;
    },
    { passive: true }
  );
}

export function shakeField(id: string) {
  gsap.fromTo(
    `#${id}`,
    { x: 0 },
    {
      x: 8,
      duration: 0.08,
      ease: "none",
      repeat: 5,
      yoyo: true,
      onComplete: () => { gsap.set(`#${id}`, { x: 0 }); },
    }
  );
  const el = document.getElementById(id);
  if (el) {
    el.style.borderColor = "rgba(244,63,94,0.5)";
    setTimeout(() => {
      el.style.borderColor = "";
    }, 1200);
  }
}
