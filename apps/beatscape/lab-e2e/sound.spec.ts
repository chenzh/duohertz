import { expect, test } from "@playwright/test";

test("lab respects music and beat-feedback settings before and during a run", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_settings", JSON.stringify({ musicVolume: 0.3, sfxVolume: 0.15, hitsound: true }));
    const probe = window as typeof window & { labGains: GainNode[]; labBufferRoutes: AudioNode[] };
    probe.labGains = [];
    probe.labBufferRoutes = [];
    const createGain = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function () {
      const gain = createGain.call(this);
      probe.labGains.push(gain);
      return gain;
    };
    const connect = AudioBufferSourceNode.prototype.connect;
    AudioBufferSourceNode.prototype.connect = function (destination: AudioNode) {
      probe.labBufferRoutes.push(destination);
      return connect.call(this, destination);
    } as typeof AudioBufferSourceNode.prototype.connect;
  });

  await page.goto("/beatscape/lab/duohertz");
  const levels = page.getByRole("group", { name: "Sound levels" });
  await expect(levels.getByRole("slider", { name: /Music/ })).toHaveValue("30");
  await expect(levels.getByRole("slider", { name: /Beat feedback/ })).toHaveValue("15");
  await page.getByRole("button", { name: "Play track with sound" }).click();
  await expect.poll(() => page.evaluate(() => {
    const gains = (window as typeof window & { labGains: GainNode[] }).labGains;
    return gains.slice(0, 2).map((gain) => Math.round(gain.gain.value * 100));
  })).toEqual([30, 15]);

  await levels.getByRole("slider", { name: /Music/ }).focus();
  await levels.getByRole("slider", { name: /Music/ }).press("Home");
  await expect(levels.getByRole("slider", { name: /Music/ })).toHaveValue("0");
  await levels.getByRole("checkbox", { name: "Play beat feedback" }).uncheck();
  await expect(levels.getByRole("slider", { name: /Beat feedback/ })).toBeDisabled();
  await expect.poll(() => page.evaluate(() => {
    const gains = (window as typeof window & { labGains: GainNode[] }).labGains;
    return gains.slice(0, 2).map((gain) => gain.gain.value < 0.01);
  })).toEqual([true, true]);

  await page.getByRole("button", { name: "Stop" }).click();
  await page.getByRole("button", { name: "First Frequency · 64s candidate" }).click();
  await page.getByRole("button", { name: "Play track with sound" }).click();
  await expect.poll(() => page.evaluate(() => {
    const probe = window as typeof window & { labGains: GainNode[]; labBufferRoutes: AudioNode[] };
    return probe.labBufferRoutes.some((target) => target === probe.labGains.at(-2));
  })).toBe(true);
});
