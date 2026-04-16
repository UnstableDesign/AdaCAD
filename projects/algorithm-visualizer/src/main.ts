import "./style.css";
import { GUI } from "dat.gui";
import { formatTraceEventPanel } from "./eventDescription";
import { createSceneRuntime, type SceneGroups } from "./scene";
import { DRAFT_LIST } from "./simVars";
import { reduceCreateLayerSetHeatTrace, reduceCreateLayerSetTrace } from "./traceTypes";
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
  event_index: 0,
  event_step_mode: "all_events" as "all_events" | "layer_complete",
  play_speed_ms: 250,
  auto_play: false,
  dim_untouched: true,
  showFloats: true,
  showAxes: true,
  threshold: 15,
  visualization_mode: "create_layer_set" as "create_layer_set" | "lift_map_heat",
  heat_gamma: 0.45,
  score_depth_mode: false,
  score_depth_strength: 0.35,
};
let eventSliderController: dat.GUIController | null = null;

const actions = {
  upload_png: () => {
    uploadInput.value = "";
    uploadInput.click();
  },
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
  const resolvedEventIndex = getResolvedEventIndex();
  eventDescriptionEl.value = formatTraceEventPanel(
    guiState.visualization_mode,
    [],
    [],
    sceneGroups.createLayerSetTrace,
    resolvedEventIndex,
  );
};

const getLayerCompleteFrames = (): number[] => {
  if (!sceneGroups) return [0];
  const frames = [0];
  sceneGroups.createLayerSetTrace.forEach((event, idx) => {
    if (event.type === "layer_complete") {
      frames.push(idx + 1);
    }
  });
  const finalEventIndex = sceneGroups.createLayerSetTrace.length;
  if (frames[frames.length - 1] !== finalEventIndex) {
    frames.push(finalEventIndex);
  }
  return frames;
};

const getResolvedEventIndex = (): number => {
  if (!sceneGroups) return 0;
  if (guiState.event_step_mode === "all_events") {
    return Math.max(0, Math.min(Math.floor(guiState.event_index), sceneGroups.createLayerSetTrace.length));
  }
  const frames = getLayerCompleteFrames();
  const slot = Math.max(0, Math.min(Math.floor(guiState.event_index), frames.length - 1));
  return frames[slot];
};

const applyTraceState = () => {
  if (!sceneGroups) {
    return;
  }
  const resolvedEventIndex = getResolvedEventIndex();
  if (guiState.visualization_mode === "lift_map_heat") {
    const state = reduceCreateLayerSetHeatTrace(sceneGroups.createLayerSetTrace, resolvedEventIndex);
    sceneGroups.applyLiftMapHeatState(state, guiState.dim_untouched, guiState.heat_gamma);
  } else {
    const state = reduceCreateLayerSetTrace(sceneGroups.createLayerSetTrace, resolvedEventIndex);
    sceneGroups.applyCreateLayerSetState(
      state,
      guiState.dim_untouched,
      guiState.score_depth_mode,
      guiState.score_depth_strength,
    );
  }
  updateEventDescriptionPanel();
};

const activeSliderMax = (): number => {
  if (!sceneGroups) return 1;
  if (guiState.event_step_mode === "all_events") {
    return sceneGroups.createLayerSetTrace.length;
  }
  return Math.max(0, getLayerCompleteFrames().length - 1);
};

const getCreateLayerSetOptions = () => ({
  threshold: Math.max(1, Math.floor(guiState.threshold)),
});

const renderSceneGroups = (next: SceneGroups) => {
  sceneGroups = next;
  runtime.scene.add(sceneGroups.createLayerSetGeometry);
  runtime.scene.add(sceneGroups.liftMapHeatGeometry);
  sceneGroups.createLayerSetGeometry.visible = guiState.showFloats;
  sceneGroups.liftMapHeatGeometry.visible =
    guiState.showFloats && guiState.visualization_mode === "lift_map_heat";
  sceneGroups.createLayerSetGeometry.visible =
    guiState.showFloats && guiState.visualization_mode === "create_layer_set";
  guiState.event_index = 0;
  if (eventSliderController) {
    eventSliderController.max(Math.max(activeSliderMax(), 1));
    eventSliderController.setValue(0);
  }
  applyTraceState();
};

const loadFromDrawdown = (drawdown: Parameters<typeof runtime.loadFromDrawdown>[0]) => {
  if (sceneGroups) {
    runtime.clear(sceneGroups);
  }
  stopPlayback();
  guiState.auto_play = false;
  runtime
    .loadFromDrawdown(drawdown, getCreateLayerSetOptions())
    .then((scenes) => {
      renderSceneGroups(scenes);
    });
};

runtime
  .load(0, getCreateLayerSetOptions())
  .then((scenes) => {
    renderSceneGroups(scenes);
  });

gui.add(actions, "upload_png").name("Upload PNG/JPG");

gui
  .add(guiState, "visualization_mode", ["create_layer_set", "lift_map_heat"])
  .name("Visualization")
  .onFinishChange(() => {
    if (!sceneGroups) return;
    sceneGroups.createLayerSetGeometry.visible =
      guiState.showFloats && guiState.visualization_mode === "create_layer_set";
    sceneGroups.liftMapHeatGeometry.visible =
      guiState.showFloats && guiState.visualization_mode === "lift_map_heat";
    applyTraceState();
  });

eventSliderController = gui
  .add(guiState, "event_index", 0, 1, 1)
  .name("Event Index")
  .onChange((value: number) => {
    guiState.event_index = Math.floor(value);
    applyTraceState();
  });

gui
  .add(guiState, "event_step_mode", ["all_events", "layer_complete"])
  .name("Event Step")
  .onFinishChange(() => {
    guiState.event_index = 0;
    if (eventSliderController) {
      eventSliderController.max(Math.max(activeSliderMax(), 1));
      eventSliderController.setValue(0);
    } else {
      applyTraceState();
    }
  });

gui
  .add(guiState, "dim_untouched")
  .name("Dim Untouched")
  .onChange((value: boolean) => {
    guiState.dim_untouched = value;
    applyTraceState();
  });

gui
  .add(guiState, "play_speed_ms", 20, 1000, 10)
  .name("Play Speed (ms)")
  .onChange((value: number) => {
    guiState.play_speed_ms = value;
  });

gui
  .add(guiState, "heat_gamma", 0.1, 2.5, 0.05)
  .name("Heat Contrast")
  .onChange((value: number) => {
    guiState.heat_gamma = Math.max(0.1, value);
    if (guiState.visualization_mode === "lift_map_heat") {
      applyTraceState();
    }
  });

gui
  .add(guiState, "score_depth_mode")
  .name("Score Depth Mode")
  .onChange((value: boolean) => {
    guiState.score_depth_mode = value;
    if (guiState.visualization_mode === "create_layer_set") {
      applyTraceState();
    }
  });

gui
  .add(guiState, "score_depth_strength", 0, 1.5, 0.05)
  .name("Score Depth")
  .onChange((value: number) => {
    guiState.score_depth_strength = Math.max(0, value);
    if (guiState.visualization_mode === "create_layer_set" && guiState.score_depth_mode) {
      applyTraceState();
    }
  });

gui.add(guiState, "auto_play").name("Auto Play").onChange((value: boolean) => {
  if (!sceneGroups) {
    guiState.auto_play = false;
    return;
  }

  stopPlayback();
  if (!value) {
    return;
  }

  playbackTimer = window.setInterval(() => {
    if (!sceneGroups) {
      return;
    }
    if (guiState.event_index >= activeSliderMax()) {
      stopPlayback();
      guiState.auto_play = false;
      return;
    }
    guiState.event_index += 1;
    if (eventSliderController) {
      eventSliderController.setValue(guiState.event_index);
    } else {
      applyTraceState();
    }
  }, guiState.play_speed_ms);
});

const playbackActions = {
  step_forward: () => {
    if (!sceneGroups) return;
    guiState.event_index = Math.min(guiState.event_index + 1, activeSliderMax());
    if (eventSliderController) {
      eventSliderController.setValue(guiState.event_index);
    } else {
      applyTraceState();
    }
  },
  reset_trace: () => {
    stopPlayback();
    guiState.auto_play = false;
    guiState.event_index = 0;
    if (eventSliderController) {
      eventSliderController.setValue(0);
    } else {
      applyTraceState();
    }
  },
};

gui.add(playbackActions, "step_forward").name("Step +1");
gui.add(playbackActions, "reset_trace").name("Reset Trace");

gui
  .add(guiState, "threshold", 1, 40, 1)
  .name("Threshold")
  .onFinishChange((value: number) => {
    guiState.threshold = Math.max(1, Math.floor(value));
    if (currentCustomDrawdown) {
      loadFromDrawdown(currentCustomDrawdown);
      return;
    }
    if (sceneGroups) {
      runtime.clear(sceneGroups);
    }
    stopPlayback();
    guiState.auto_play = false;
    runtime
      .load(
        Math.floor(guiState.draft_id),
        getCreateLayerSetOptions(),
      )
      .then((scenes) => {
        renderSceneGroups(scenes);
      });
  });


gui
  .add(guiState, "draft_id", 0, DRAFT_LIST.length - 1, 1)
  .name("Draft ID")
  .onChange((value: number) => {
    if (sceneGroups) {
      runtime.clear(sceneGroups);
    }
    stopPlayback();
    runtime
      .load(
        Math.floor(value),
        getCreateLayerSetOptions(),
      )
      .then((scenes) => {
        renderSceneGroups(scenes);
      });
  });

gui.add(guiState, "showFloats").name("Show Floats").onChange((value: boolean) => {
  if (!sceneGroups) return;
  sceneGroups.createLayerSetGeometry.visible =
    value && guiState.visualization_mode === "create_layer_set";
  sceneGroups.liftMapHeatGeometry.visible =
    value && guiState.visualization_mode === "lift_map_heat";
});

gui.add(guiState, "showAxes").name("Show Axes").onChange((value: boolean) => {
  runtime.axesHelper.visible = value;
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
