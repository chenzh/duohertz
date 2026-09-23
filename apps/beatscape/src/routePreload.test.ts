import { describe, expect, it } from "vitest";
import { lazyRouteKey } from "./routePreload";

describe("lazy route intent preloading", () => {
  it("maps lazy destinations while ignoring query strings and fragments", () => {
    expect(lazyRouteKey("/track/bs-s1-01?tier=easy#setup")).toBe("track");
    expect(lazyRouteKey("/duo/bs-s1-01?tier=hard")).toBe("duo");
    expect(lazyRouteKey("/leaderboard?view=daily")).toBe("leaderboard");
    expect(lazyRouteKey("/privacy#storage")).toBe("legal");
  });

  it("does not spend a request on eager or unknown destinations", () => {
    expect(lazyRouteKey("/play/bs-s1-01?tier=easy")).toBeNull();
    expect(lazyRouteKey("/results?run=local")).toBeNull();
    expect(lazyRouteKey("/library")).toBeNull();
    expect(lazyRouteKey("/unknown")).toBeNull();
  });
});
