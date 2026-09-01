import type { ReactNode } from "react";
import { navigate, useRoute, type Route } from "../router";
import { BroadcastIcon, DiamondIcon, GridIcon, HeartIcon } from "./icons";

const TABS: Array<{
  hash: string;
  label: string;
  icon: () => ReactNode;
  active: (r: Route) => boolean;
}> = [
  {
    hash: "#/",
    label: "Discover",
    icon: () => <DiamondIcon />,
    active: (r) => r.name === "feed" || r.name === "track",
  },
  { hash: "#/library", label: "Library", icon: () => <GridIcon />, active: (r) => r.name === "library" },
  {
    hash: "#/playlists",
    label: "Shows",
    icon: () => <BroadcastIcon />,
    active: (r) => r.name === "playlists" || r.name === "playlist",
  },
  {
    hash: "#/favorites",
    label: "Saved",
    icon: () => <HeartIcon />,
    active: (r) => r.name === "favorites",
  },
];

export function TabBar() {
  const route = useRoute();
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map((tab) => {
        const on = tab.active(route);
        return (
          <button
            key={tab.hash}
            className={`tab ${on ? "is-on" : ""}`}
            onClick={() => navigate(tab.hash)}
            aria-current={on ? "page" : undefined}
          >
            {tab.icon()}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
