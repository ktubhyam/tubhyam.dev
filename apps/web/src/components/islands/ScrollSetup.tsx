/**
 * ScrollSetup — Renderless island. Inits Lenis smooth scroll + wires GSAP ScrollTrigger.
 * All per-section entrance animations live here, keeping index.astro declarative.
 */
import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollSetup() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ─── Lenis ───────────────────────────────────────────
    const lenis = new Lenis({ autoRaf: false });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    // ─── Hero entrance ───────────────────────────────────
    if (!reduced) {
      gsap.from(".hero-content > *", {
        y: 16,
        opacity: 0,
        filter: "blur(4px)",
        stagger: 0.1,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.2,
        clearProps: "all",
      });
    } else {
      gsap.set(".hero-content > *", { opacity: 1, y: 0 });
    }

    // ─── S1 Research entrance ────────────────────────────
    ScrollTrigger.create({
      trigger: "#research-section",
      start: "top 80%",
      once: true,
      onEnter: () => {
        if (reduced) return;
        gsap.from("#research-section .section-label-type", { y: 8, opacity: 0, duration: 0.4, ease: "power2.out" });
        gsap.from("#research-section h2", { y: 16, opacity: 0, duration: 0.45, delay: 0.1, ease: "power2.out" });
        gsap.from("#research-section .research-col-left, #research-section .research-col-right", {
          y: 16, opacity: 0, stagger: 0.08, duration: 0.5, delay: 0.2, ease: "power2.out",
        });
      },
    });

    // ─── S2 Build entrance ───────────────────────────────
    ScrollTrigger.create({
      trigger: "#bento-grid",
      start: "top 75%",
      once: true,
      onEnter: () => {
        if (reduced) return;
        gsap.from("#bento-grid > *", {
          y: 20, opacity: 0, stagger: 0.08, duration: 0.5, ease: "power2.out",
        });
      },
    });

    // ─── S4 Writing entrance ─────────────────────────────
    ScrollTrigger.create({
      trigger: "[aria-label='Writing']",
      start: "top 80%",
      once: true,
      onEnter: () => {
        if (reduced) return;
        gsap.from(".posts-left-col > *", { y: 16, opacity: 0, stagger: 0.1, duration: 0.45, ease: "power2.out" });
        gsap.from(".grid-right-col > *", { x: 20, opacity: 0, stagger: 0.1, duration: 0.45, delay: 0.1, ease: "power2.out" });
      },
    });

    // ─── S5 Connect entrance ─────────────────────────────
    ScrollTrigger.create({
      trigger: "#contact",
      start: "top 80%",
      once: true,
      onEnter: () => {
        if (reduced) return;
        gsap.from(".contact-left-col > *", { y: 16, opacity: 0, stagger: 0.08, duration: 0.45, ease: "power2.out" });
        gsap.from(".contact-right-col > *", { x: 20, opacity: 0, stagger: 0.08, duration: 0.45, delay: 0.1, ease: "power2.out" });
      },
    });

    return () => {
      lenis.destroy();
      gsap.ticker.remove((t) => lenis.raf(t * 1000));
      ScrollTrigger.killAll();
    };
  }, []);

  return null;
}
