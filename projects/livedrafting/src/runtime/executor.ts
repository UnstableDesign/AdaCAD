import * as esbuild from "esbuild-wasm";
import esbuildWasmUrl from "esbuild-wasm/esbuild.wasm?url";
import { addColors, fill, interlace, join, oscillator, random, renderCount, resize, satin, shift, stretch, symmetry, tabby, tile, twill, waffle } from "./addons";
import { getOp, call, initDraft, initDraftWithParams } from "./api";
import { display } from "./display";

let esbuild_ready: Promise<void> | null = null;

function ensureEsbuild(): Promise<void> {
  if (!esbuild_ready) {
    esbuild_ready = esbuild.initialize({
      wasmURL: esbuildWasmUrl,
    });
  }
  return esbuild_ready;
}

const SANDBOX_NAMES = [
  "getOp",
  "call",
  "display",
  "initDraft",
  "initDraftWithParams",
  "oscillator",
  "twill",
  "satin",
  "tabby",
  "waffle",
  "random",
  "interlace",
  "shift",
  "tile",
  "renderCount",
  "addColors",
  "resize",
  "symmetry",
  "stretch",
  "fill",
  "join",
] as const;

const SANDBOX_VALUES = [
  getOp,
  call,
  display,
  initDraft,
  initDraftWithParams,
  oscillator,
  twill,
  satin,
  tabby,
  waffle,
  random,
  interlace,
  shift,
  tile,
  renderCount,
  addColors,
  resize,
  symmetry,
  stretch,
  fill,
  join,
] as const;

let cached_source: string | null = null;
let cached_runner: ((...args: unknown[]) => Promise<unknown>) | null = null;

async function compileSketch(source: string): Promise<(...args: unknown[]) => Promise<unknown>> {
  await ensureEsbuild();

  const wrapped = `return (async () => {\n${source}\n})();`;

  const { code } = await esbuild.transform(wrapped, {
    loader: "ts",
    format: "cjs",
    target: "es2020",
  });

  return new Function(...SANDBOX_NAMES, code) as (
    ...args: unknown[]
  ) => Promise<unknown>;
}

export async function runSketch(source: string): Promise<void> {
  if (cached_source !== source || cached_runner === null) {
    cached_source = source;
    cached_runner = await compileSketch(source);
  }
  await cached_runner(...SANDBOX_VALUES);
}
