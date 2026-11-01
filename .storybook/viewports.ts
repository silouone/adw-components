import type { ViewportMap } from "storybook/viewport";

export const VIEWPORTS = {
  narrow: { name: "narrow", styles: { width: "820px", height: "900px" } },
  rail: { name: "rail", styles: { width: "1100px", height: "900px" } },
  desktop: { name: "desktop", styles: { width: "1440px", height: "900px" } },
} as const satisfies ViewportMap;
