import { useMemo } from "react";

export type UrlModes = {
  demoMode: boolean;
  devMode: boolean;
  presentMode: boolean;
  playgroundOnly: boolean;
  deepLinkJobId: string | null;
};

export function useUrlModes(): UrlModes {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      demoMode: params.get("demo") === "1",
      devMode: params.get("dev") === "1",
      presentMode: params.get("present") === "1",
      playgroundOnly: params.get("playground") === "1",
      deepLinkJobId: params.get("job"),
    };
  }, []);
}

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
