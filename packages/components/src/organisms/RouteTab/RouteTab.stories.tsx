import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  ROUTE_TAB,
  ROUTE_TAB_EMPTY,
  ROUTE_TAB_ESCALATED,
  ROUTE_TAB_LABELS,
} from "../../../fixtures/RouteTab";
import { RouteTab } from "./RouteTab";

const meta = {
  title: "Organisms/RouteTab",
  component: RouteTab,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The focus panel's Route tab: how the run was routed — the resolution chain, the gear per stage and what the shadow router would pick.",
          "**Where** Organism. The `route` tab of the focus panel.",
          "**When** The reader wants to know why a run got the model and gear it did.",
          "**Don't** Resolve the chain or pick a gear: the view arrives finished, and a journal without a route event arrives as dashes.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: ROUTE_TAB,
    labels: ROUTE_TAB_LABELS,
  },
} satisfies Meta<typeof RouteTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FocusPanel: Story = {};

export const FiredEscalation: Story = { args: { view: ROUTE_TAB_ESCALATED } };

export const NoRouteEvent: Story = { args: { view: ROUTE_TAB_EMPTY } };

export const RailDensity: Story = { args: { density: "rail" } };
