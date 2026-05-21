import type { Draft } from "adacad-drafting-lib";
import { getDraftAsImage, warps, wefts } from "adacad-drafting-lib";
import { COLOR_PALETTE } from "./color-palette";

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let current_draft: Draft | null = null;
let current_use_color = false;
let current_floats = false;
let render_count = 0;

export function getCurrentDraft(): Draft | null {
  return current_draft;
}

export function getLastDisplayOptions(): { use_color: boolean; floats: boolean } {
  return { use_color: current_use_color, floats: current_floats };
}

export function getViewportPixPerCell(draft: Draft): number {
  return pixPerCellForViewport(draft);
}


/** Number of times the draft canvas has been painted. */
export function getRenderCount(): number {
  return render_count;
}

export function bindDisplayCanvas(el: HTMLCanvasElement): void {
  canvas = el;
  ctx = el.getContext("2d");
  window.addEventListener("resize", onResize);
}

function onResize(): void {
  if (current_draft !== null) {
    paintDraft(current_draft, current_use_color, current_floats);
  }
}

function pixPerCellForViewport(draft: Draft): number {
  const w = warps(draft.drawdown);
  const h = wefts(draft.drawdown);
  if (w === 0 || h === 0) {
    return 1;
  }
  const scale_w = window.innerWidth / w;
  const scale_h = window.innerHeight / h;
  return Math.max(1, Math.floor(Math.max(scale_w, scale_h)));
}

function paintDraft(draft: Draft, use_color: boolean = false, floats: boolean = false): void {
  if (!canvas || !ctx) {
    return;
  }

  const pix_per_cell = pixPerCellForViewport(draft);
  const image = getDraftAsImage(draft, pix_per_cell, floats, use_color, COLOR_PALETTE);

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.putImageData(image, 0, 0);

  const css_w = window.innerWidth;
  const css_h = window.innerHeight;
  canvas.style.width = `${css_w}px`;
  canvas.style.height = `${css_h}px`;
}

/** Rasterize a draft and show it as the fullscreen background. */
export function display(draft: Draft, use_color: boolean = false, floats: boolean = false): void {
  if (!canvas || !ctx) {
    return;
  }
  current_draft = draft;
  current_use_color = use_color;
  current_floats = floats;
  paintDraft(draft, use_color, floats);
  render_count += 1;
}
