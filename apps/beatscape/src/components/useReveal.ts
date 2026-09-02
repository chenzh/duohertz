import { useEffect, useRef } from "react";

/**
 * Scroll-reveal for `[data-reveal]` descendants: elements fade + rise once as
 * they enter the viewport (RESONANCE stays flat — no blur, no glow).
 *
 * Fail-safe by construction: the hidden state lives on `.reveal-armed`, which
 * only this hook ever adds. An element the hook has never seen (async-loaded
 * content, or one rendered after the last scan) simply renders visible instead
 * of being stranded at opacity 0.
 *
 * @param key Re-scan trigger. Pass the list length so async-loaded children
 *   (catalog fetch) get picked up. Use a coarse value — re-running on every
 *   keystroke would re-arm visible rows and flicker.
 * @param selector Which descendants to reveal. Defaults to `[data-reveal]`;
 *   pass a class instead when you can't put attributes on the node (our
 *   `router.Link` only forwards a fixed prop list, so cards it renders need
 *   `.track-card` / `.character-card` style targeting).
 */
export function useReveal<T extends HTMLElement = HTMLElement>(key?: unknown, selector = "[data-reveal]") {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (targets.length === 0) return;

    // No IO, or the user asked for less motion: show everything immediately.
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const el of targets) el.classList.add("is-visible");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).classList.add("is-visible");
          io.unobserve(entry.target);
        }
      },
      // Fire a little before the element is fully on screen so the motion reads
      // as "arriving" rather than "catching up".
      { rootMargin: "0px 0px -6% 0px", threshold: 0.04 },
    );

    for (const el of targets) {
      el.classList.add("reveal-armed");
      io.observe(el);
    }

    return () => {
      io.disconnect();
      // is-visible is never removed, so already-revealed elements stay put.
      for (const el of targets) el.classList.remove("reveal-armed");
    };
  }, [key, selector]);

  return ref;
}
