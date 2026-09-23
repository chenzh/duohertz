const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** Cycle focus through every usable control owned by a modal dialog. */
export function cycleModalFocus(container: HTMLElement, backwards: boolean): void {
  const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
  if (!focusable.length) return;

  const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);
  const nextIndex = backwards
    ? (activeIndex <= 0 ? focusable.length - 1 : activeIndex - 1)
    : (activeIndex < 0 || activeIndex === focusable.length - 1 ? 0 : activeIndex + 1);
  focusable[nextIndex]?.focus();
}
