// Hand-written view models for `<NetworkTree/>`: a busy local runner with one project and
// three runs, an idle ssh runner, and a planned e2b runner.

import type {
  NetworkRunner,
  NetworkTally,
  NetworkTreeLabels,
} from "../src/organisms/NetworkTree/NetworkTree";

export const NETWORK_LABELS: NetworkTreeLabels = {
  ariaLabel: "network",
  heading: (online, total) => `⌬ NETWORK · ${online} of ${total} online`,
  close: "close",
  fold: "fold",
  unfold: "unfold",
  focusBoardOn: (name) => `focus the board on ${name}`,
  runs: (n) => `${n} runs`,
  slotsHeld: (held, total) => `${held} of ${total} slots held`,
  notConfigured: "not configured",
  nothingRunning: "nothing running here",
  projectLive: (n) => `${n} live`,
  footer: (t) => `${t.live} live · ${t.waiting} waiting for a slot · ${t.agents} at the agents`,
};

export const NETWORK: readonly NetworkRunner[] = [
  {
    key: "local",
    label: "local",
    kind: "local",
    planned: false,
    status: "busy",
    dot: "live",
    glyph: "⌂",
    note: "this machine",
    held: 2,
    total: 4,
    runs: 3,
    projects: [
      {
        name: "sabado",
        live: 3,
        leaves: [
          {
            ticketId: "sabado-276-strip-tags",
            short: "sabado-276",
            kind: "holder",
            glyph: "●",
            now: "build",
            title: "sabado-276 · build",
            hue: 140,
          },
          {
            ticketId: "sabado-277-lint-fix",
            short: "sabado-277",
            kind: "agent",
            glyph: "✳",
            now: "plan",
            title: "sabado-277 · plan",
            hue: 200,
          },
          {
            ticketId: "sabado-278-docs",
            short: "sabado-278",
            kind: "waiter",
            glyph: "⏳",
            now: "queued",
            title: "sabado-278 · queued",
            hue: 30,
          },
        ],
      },
    ],
  },
  {
    key: "ssh:build-1",
    label: "build-1",
    kind: "ssh",
    planned: false,
    status: "idle",
    dot: "ok",
    glyph: "⇄",
    note: "build box",
    held: 0,
    total: 2,
    runs: 0,
    projects: [],
  },
  {
    key: "e2b",
    label: "e2b",
    kind: "e2b",
    planned: true,
    status: "planned",
    dot: "planned",
    glyph: "⬡",
    note: "",
    held: 0,
    total: 0,
    runs: 0,
    projects: [],
  },
];

export const NETWORK_TALLY: NetworkTally = { live: 1, waiting: 1, agents: 1 };
