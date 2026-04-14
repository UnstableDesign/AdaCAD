import "./style.css";
import { GUI } from "dat.gui";
import { createSceneRuntime, type SceneGroups } from "./scene";
import { DRAFT_LIST, simVars } from "./simVars";
import { pngFileToDrawdown } from "./pngDraft";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="app_shell">
    <header class="app_header">
      <h1>Algorithm Visualizer</h1>
      <p>Draft-derived geometry from local adacad-drafting-lib</p>
    </header>
    <div class="visualization_stack">
      <label for="event_description" class="event_description_label">Current trace event</label>
      <textarea id="event_description" class="event_description" readonly rows="8" spellcheck="false" aria-label="Current trace event description"></textarea>
      <main id="viewport" class="viewport"></main>
    </div>
  </div>
`;

const eventDescriptionEl = document.querySelector<HTMLTextAreaElement>("#event_description");
const viewportElement = document.querySelector<HTMLElement>("#viewport");
if (!viewportElement) {
  throw new Error("Viewport element not found.");
}

const runtime = createSceneRuntime(viewportElement);
let sceneGroups: SceneGroups | null = null;
let playbackTimer: number | null = null;
let currentCustomDrawdown: Parameters<typeof runtime.loadFromDrawdown>[0] | null = null;
const uploadInput = document.createElement("input");
uploadInput.type = "file";
uploadInput.accept = ".png,image/png,.jpg,image/jpg";
uploadInput.style.display = "none";
document.body.appendChild(uploadInput);

const gui = new GUI({ width: 340 });
gui.close();

const guiState = {
  draft_id: 0,
};



const stopPlayback = () => {
  if (playbackTimer !== null) {
    window.clearInterval(playbackTimer);
    playbackTimer = null;
  }
};

const updateEventDescriptionPanel = () => {
  if (!eventDescriptionEl) {
    return;
  }
  if (!sceneGroups) {
    eventDescriptionEl.value = "Load a draft to see trace events.";
    return;
  }

};


const renderSceneGroups = (next: SceneGroups) => {
  sceneGroups = next;
  //runtime.scene.add(sceneGroups.draftGeometry);
  //runtime.scene.add(sceneGroups.cnGeometry);
  runtime.scene.add(sceneGroups.floatGeometry);
};

const loadFromDrawdown = (drawdown: Parameters<typeof runtime.loadFromDrawdown>[0]) => {
  if (sceneGroups) {
    runtime.clear(sceneGroups);
  }
  stopPlayback();
  runtime
    .loadFromDrawdown(
      drawdown)
    .then((scenes) => {
      renderSceneGroups(scenes);
    });
};

runtime
  .load(0)
  .then((scenes) => {
    renderSceneGroups(scenes);
  });



gui
  .add(guiState, "draft_id", 0, DRAFT_LIST.length - 1, 1)
  .name("Draft ID")
  .onChange((value: number) => {
    if (sceneGroups) {
      runtime.clear(sceneGroups);
    }
    stopPlayback();
    currentCustomDrawdown = null;
    runtime
      .load(
        Math.floor(value)
      )
      .then((scenes) => {
        renderSceneGroups(scenes);
      });
  });



uploadInput.addEventListener("change", async () => {
  const selected = uploadInput.files?.[0];
  if (!selected) {
    return;
  }

  try {
    const drawdown = await pngFileToDrawdown(selected);
    currentCustomDrawdown = drawdown;
    loadFromDrawdown(drawdown);
  } catch (error) {
    console.error(error);
    window.alert(
      "Unable to load PNG draft. Ensure the file is a valid black/white bitmap image.",
    );
  }
});


window.addEventListener("beforeunload", () => {
  stopPlayback();
  uploadInput.remove();
});

runtime.start();
