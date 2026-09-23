import type { Locator } from "@playwright/test";

/** WCAG text contrast against the element's composited solid-color background. */
export async function contrastRatio(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas color parser unavailable");

    const rgba = (color: string): number[] => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data];
    };

    const ancestors: Element[] = [];
    for (let node: Element | null = element; node; node = node.parentElement) {
      ancestors.unshift(node);
    }

    let background = [255, 255, 255];
    for (const node of ancestors) {
      const layer = rgba(getComputedStyle(node).backgroundColor);
      const alpha = layer[3] / 255;
      background = background.map((channel, index) =>
        layer[index] * alpha + channel * (1 - alpha));
    }

    const foreground = rgba(getComputedStyle(element).color);
    const luminance = (channels: number[]) => {
      const linear = channels.slice(0, 3).map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };

    const foregroundLuminance = luminance(foreground);
    const backgroundLuminance = luminance(background);
    return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
      / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
  });
}
