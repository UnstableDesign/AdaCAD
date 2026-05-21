import { createMaterial, type Material } from "adacad-drafting-lib";

/** Curated yarn colors for live drafting (indices 0–29). */
export const PALETTE_ENTRIES: ReadonlyArray<{ name: string; color: string }> = [
  { name: "snow", color: "#f8f9fa" },
  { name: "ink", color: "#1a1a2e" },
  { name: "cherry", color: "#d62828" },
  { name: "coral", color: "#f77f00" },
  { name: "marigold", color: "#fcbf49" },
  { name: "lime", color: "#90be6d" },
  { name: "emerald", color: "#2d6a4f" },
  { name: "teal", color: "#2a9d8f" },
  { name: "cyan", color: "#48cae4" },
  { name: "azure", color: "#4361ee" },
  { name: "indigo", color: "#3a0ca3" },
  { name: "violet", color: "#7209b7" },
  { name: "magenta", color: "#f72585" },
  { name: "rose", color: "#e8998d" },
  { name: "blush", color: "#ffb4a2" },
  { name: "peach", color: "#ffd6a5" },
  { name: "sand", color: "#e9c46a" },
  { name: "wheat", color: "#d4a373" },
  { name: "caramel", color: "#bc6c25" },
  { name: "cocoa", color: "#6f4e37" },
  { name: "slate", color: "#495057" },
  { name: "pewter", color: "#6c757d" },
  { name: "silver", color: "#adb5bd" },
  { name: "mist", color: "#caf0f8" },
  { name: "sky", color: "#90e0ef" },
  { name: "ocean", color: "#0077b6" },
  { name: "navy", color: "#023e8a" },
  { name: "forest", color: "#344e41" },
  { name: "moss", color: "#588157" },
  { name: "sage", color: "#a7c957" },
];

export const COLOR_PALETTE: Material[] = PALETTE_ENTRIES.map((entry, id) =>
  createMaterial({
    id,
    name: entry.name,
    color: entry.color,
    insert: true,
    visible: true,
    stretch: 1,
    thickness: 100,
    diameter: 1,
    type: 0,
    notes: "",
  })
);

export const COLOR_PALETTE_SIZE = COLOR_PALETTE.length;
