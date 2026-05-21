import { resolveInitialSketch, STORAGE_KEY } from "./default-sketch";
import { pickRandomExampleSketch } from "./examples";
import { createEditor, setEditorDocument } from "./editor/setup-editor";
import { downloadCurrentView } from "./runtime/download";
import { bindDisplayCanvas } from "./runtime/display";
import { runSketch } from "./runtime/executor";

const canvas = document.getElementById("draft-canvas") as HTMLCanvasElement;
const editor_mount = document.getElementById("editor-mount") as HTMLElement;
const error_bar = document.getElementById("error-bar") as HTMLElement;
const play_btn = document.getElementById("play-btn") as HTMLButtonElement;
const pause_btn = document.getElementById("pause-btn") as HTMLButtonElement;
const step_btn = document.getElementById("step-btn") as HTMLButtonElement;
const frame_rate_input = document.getElementById("frame-rate-input") as HTMLInputElement;
const download_btn = document.getElementById("download-btn") as HTMLButtonElement;
const load_example_btn = document.getElementById("load-example-btn") as HTMLButtonElement;

bindDisplayCanvas(canvas);

function loadSketch(): { source: string; url_error: string | null } {
  return resolveInitialSketch();
}

function saveSketch(doc: string): void {
  localStorage.setItem(STORAGE_KEY, doc);
}

function showError(message: string): void {
  error_bar.textContent = message;
  error_bar.hidden = false;
}

function clearError(): void {
  error_bar.hidden = true;
  error_bar.textContent = "";
}

const STORAGE_KEY_FPS = "livedrafting-fps";
const DEFAULT_FPS = 10;
const MIN_FPS = 0.25;
const MAX_FPS = 60;

type PlayMode = "play" | "pause";

let editor_view: ReturnType<typeof createEditor> | null = null;
let executing = false;
let play_mode: PlayMode = "play";
let frame_rate_fps = DEFAULT_FPS;
let tick_ms = fpsToTickMs(DEFAULT_FPS);
let tick_timer: ReturnType<typeof setInterval> | null = null;

function fpsToTickMs(fps: number): number {
  return Math.round(1000 / fps);
}

function loadFrameRate(): number {
  const saved = localStorage.getItem(STORAGE_KEY_FPS);
  if (saved === null) {
    return DEFAULT_FPS;
  }
  const fps = Number(saved);
  if (!Number.isFinite(fps) || fps < MIN_FPS || fps > MAX_FPS) {
    return DEFAULT_FPS;
  }
  return fps;
}

function clampFps(fps: number): number {
  return Math.min(MAX_FPS, Math.max(MIN_FPS, fps));
}

function formatFps(fps: number): string {
  const rounded = Math.round(fps * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, "");
}

function setFrameRate(fps: number): void {
  frame_rate_fps = clampFps(fps);
  tick_ms = fpsToTickMs(frame_rate_fps);
  frame_rate_input.value = formatFps(frame_rate_fps);
  localStorage.setItem(STORAGE_KEY_FPS, String(frame_rate_fps));
  restartTickTimer();
}

function restartTickTimer(): void {
  if (tick_timer !== null) {
    clearInterval(tick_timer);
  }
  tick_timer = window.setInterval(() => {
    void execute();
  }, tick_ms);
}

function parseFrameRateInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }
  const fps = Number(trimmed);
  if (!Number.isFinite(fps) || fps < MIN_FPS || fps > MAX_FPS) {
    return null;
  }
  return fps;
}

function applyFrameRateInput(): void {
  const fps = parseFrameRateInput(frame_rate_input.value);
  if (fps === null) {
    frame_rate_input.value = formatFps(frame_rate_fps);
    return;
  }
  setFrameRate(fps);
}

function updateTransportUi(): void {
  play_btn.classList.toggle("top-bar-transport-btn-active", play_mode === "play");
  pause_btn.classList.toggle("top-bar-transport-btn-active", play_mode === "pause");
  download_btn.hidden = play_mode !== "pause";
}

function setPlayMode(next: PlayMode): void {
  if (play_mode === next) {
    return;
  }
  play_mode = next;
  updateTransportUi();
  if (play_mode === "play") {
    void execute();
  }
}

async function execute(force = false): Promise<void> {
  if (!force && play_mode !== "play") {
    return;
  }
  if (!editor_view || executing) {
    return;
  }
  executing = true;
  const source = editor_view.state.doc.toString();
  try {
    await runSketch(source);
    clearError();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : String(err);
    showError(message);
  } finally {
    executing = false;
  }
}

function stepFrame(): void {
  void execute(true);
}

function loadRandomExample(): void {
  if (!editor_view) {
    return;
  }
  const source = pickRandomExampleSketch();
  setEditorDocument(editor_view, source);
  saveSketch(source);
  void execute(true);
}

play_btn.addEventListener("click", () => {
  setPlayMode("play");
});

pause_btn.addEventListener("click", () => {
  setPlayMode("pause");
});

step_btn.addEventListener("click", () => {
  stepFrame();
});

download_btn.addEventListener("click", () => {
  void downloadCurrentView().catch((err) => {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : String(err);
    showError(message);
  });
});

load_example_btn.addEventListener("click", () => {
  loadRandomExample();
});

frame_rate_input.addEventListener("change", applyFrameRateInput);
frame_rate_input.addEventListener("blur", applyFrameRateInput);

const { source: initial_doc, url_error: initial_url_error } = loadSketch();

editor_view = createEditor(
  editor_mount,
  initial_doc,
  saveSketch,
  () => void execute()
);

if (initial_url_error !== null) {
  showError(initial_url_error);
}

setFrameRate(loadFrameRate());
updateTransportUi();
void execute();
