import "@adw-factory/tokens/tokens.css";
import "@adw-factory/tokens/tokens.light.css";
import "@adw-factory/tokens/typography.css";
import "@adw-factory/tokens/reset.css";
import "@adw-factory/tokens/motion.css";
import type { Preview } from "@storybook/preact-vite";
import { applyTheme, themeToolbar } from "./theme";
import { VIEWPORTS } from "./viewports";

// Storybook reads `storySort` statically, so the order is an inline literal here; the
// config test pins it to LAYERS in layers.ts.
const preview: Preview = {
  initialGlobals: { theme: "dark" },
  globalTypes: { theme: themeToolbar },
  decorators: [
    (Story, context) => {
      applyTheme(document.documentElement, String(context.globals.theme));
      return Story();
    },
  ],
  parameters: {
    options: {
      storySort: {
        order: ["Foundations", "Atoms", "Molecules", "Organisms", "Templates", "Pages"],
      },
    },
    viewport: { options: VIEWPORTS },
    layout: "padded",
  },
};

export default preview;
