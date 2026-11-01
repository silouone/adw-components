import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/preact-vite";
import remarkGfm from "remark-gfm";
import { mergeConfig } from "vite";
import { aliasesOf } from "./aliases";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const componentExports = (
  JSON.parse(readFileSync(`${ROOT}packages/components/package.json`, "utf8")) as {
    exports: Readonly<Record<string, unknown>>;
  }
).exports;

const config: StorybookConfig = {
  stories: ["../packages/*/src/**/*.stories.tsx", "../packages/*/docs/**/*.mdx"],
  addons: [
    "@storybook/addon-a11y",
    {
      name: "@storybook/addon-docs",
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
  ],
  framework: { name: "@storybook/preact-vite", options: {} },
  core: { disableTelemetry: true },
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      resolve: { alias: aliasesOf(ROOT.replace(/\/$/, ""), componentExports) },
    }),
};

export default config;
