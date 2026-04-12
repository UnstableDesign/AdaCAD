import "./style.css";
import { GUI } from "dat.gui";
import { createSceneRuntime, type SceneGroups } from "./scene";
import { DRAFT_LIST, simVars } from "./simVars";
import { reduceFloatTrace } from "./traceTypes";
import { pngFileToDrawdown } from "./pngDraft";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="app_shell">
    <header class="app_header">
      <h1>Algorithm Visualizer</h1>
      <p>Draft-derived geometry from local adacad-drafting-lib</p>
    </header>
    <main id="viewport" class="viewport"></main>
  </div>
`;

const viewportElement = document.querySelector<HTMLElement>("#viewport");
if (!viewportElement) {
  throw new Error("Viewport element not found.");
}

const runtime = createSceneRuntime(viewportElement);
let sceneGroups: SceneGroups | null = null;
let playbackTimer: number | null = null;
let eventSliderController: dat.GUIController | null = null;
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
  lift_limit: 1,
  layer_id: 0,
  event_index: 0,
  play_speed_ms: 250,
  auto_play: false,
  dim_untouched: true,
  cns: true,
  showAxes: true,
  showGeometry: true,
  showFloats: true,
  showSeedDebug: false,
  layer_algorithm_mode: "global" as "global" | "scored_local",
  score_radius_scale: 1,
  autoRotate: false,
  autoRotateSpeed: 1.5,
};

const getLayerAlgorithmOptions = () => ({
  mode: guiState.layer_algorithm_mode,
  scoreRadiusScale: guiState.score_radius_scale,
});

const stopPlayback = () => {
  if (playbackTimer !== null) {
    window.clearInterval(playbackTimer);
    playbackTimer = null;
  }
};

const applyTraceState = () => {
  if (!sceneGroups) {
    return;
  }
  const state = reduceFloatTrace(sceneGroups.floatTrace, guiState.event_index);
  sceneGroups.applyFloatTraceState(state, guiState.dim_untouched);
};

const renderSceneGroups = (next: SceneGroups) => {
  sceneGroups = next;
  //runtime.scene.add(sceneGroups.draftGeometry);
  //runtime.scene.add(sceneGroups.cnGeometry);
  runtime.scene.add(sceneGroups.floatGeometry);
  runtime.scene.add(sceneGroups.seedDebugGeometry);
  sceneGroups.seedDebugGeometry.visible = guiState.showSeedDebug;

  guiState.event_index = 0;
  if (eventSliderController) {
    eventSliderController.max(Math.max(sceneGroups.floatTrace.length, 1));
    eventSliderController.setValue(0);
  } else {
    applyTraceState();
  }
};

const loadFromDrawdown = (drawdown: Parameters<typeof runtime.loadFromDrawdown>[0]) => {
  if (sceneGroups) {
    runtime.clear(sceneGroups);
  }
  stopPlayback();
  guiState.auto_play = false;
  runtime
    .loadFromDrawdown(
      drawdown,
      getLayerAlgorithmOptions(),
    )
    .then((scenes) => {
      guiState.layer_id = 0;
      renderSceneGroups(scenes);
    });
};

runtime
  .load(0, getLayerAlgorithmOptions())
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
    guiState.auto_play = false;
    currentCustomDrawdown = null;
    runtime
      .load(
        Math.floor(value),
        getLayerAlgorithmOptions(),
      )
      .then((scenes) => {
        guiState.layer_id = 0;
        renderSceneGroups(scenes);
      });
  });

eventSliderController = gui
  .add(guiState, "event_index", 0, 1, 1)
  .name("Event Index")
  .onChange((value: number) => {
    guiState.event_index = Math.floor(value);
    applyTraceState();
  });

gui.add(guiState, "lift_limit", 1, 10, 1).name("Lift Limit").onChange((value: number) => {
  simVars.lift_limit = value;

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
    if (guiState.event_index >= sceneGroups.floatTrace.length) {
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

const actions = {
  step_forward: () => {
    if (!sceneGroups) {
      return;
    }
    guiState.event_index = Math.min(
      guiState.event_index + 1,
      sceneGroups.floatTrace.length,
    );
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
  upload_png: () => {
    uploadInput.value = "";
    uploadInput.click();
  },
};

gui.add(actions, "step_forward").name("Step +1");
gui.add(actions, "reset_trace").name("Reset Trace");
gui.add(actions, "upload_png").name("Upload PNG");

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

gui.add(guiState, "cns").name("contact neighborhoods").onChange((value: boolean) => {
  if (sceneGroups) {
    sceneGroups.cnGeometry.visible = value;
  }
});

gui.add(guiState, "showAxes").name("Show Axes").onChange((value: boolean) => {
  runtime.axesHelper.visible = value;
});

gui
  .add(guiState, "layer_id", 0, 10)
  .name("Layer ID")
  .onChange((value: number) => {
    guiState.layer_id = value;
  });

gui
  .add(guiState, "showGeometry")
  .name("Show Geometry")
  .onChange((value: boolean) => {
    if (sceneGroups) {
      sceneGroups.draftGeometry.visible = value;
    }
  });

gui
  .add(guiState, "showFloats")
  .name("Show Floats")
  .onChange((value: boolean) => {
    if (sceneGroups) {
      sceneGroups.floatGeometry.visible = value;
    }
  });

gui
  .add(guiState, "showSeedDebug")
  .name("Seed Debug Overlay")
  .onChange((value: boolean) => {
    if (sceneGroups) {
      sceneGroups.seedDebugGeometry.visible = value;
    }
  });

gui
  .add(guiState, "layer_algorithm_mode", ["global", "scored_local"])
  .name("Layer Algorithm")
  .onFinishChange((value: "global" | "scored_local") => {
    guiState.layer_algorithm_mode = value;
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
        getLayerAlgorithmOptions(),
      )
      .then((scenes) => {
        renderSceneGroups(scenes);
      });
  });

gui
  .add(guiState, "score_radius_scale", 0.25, 4, 0.05)
  .name("Score Radius Scale")
  .onFinishChange((value: number) => {
    guiState.score_radius_scale = Math.max(0.05, value);
    if (guiState.layer_algorithm_mode !== "scored_local") {
      return;
    }
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
        getLayerAlgorithmOptions(),
      )
      .then((scenes) => {
        renderSceneGroups(scenes);
      });
  });

gui.add(guiState, "autoRotate").name("Auto Rotate").onChange((value: boolean) => {
  runtime.controls.autoRotate = value;
});

gui
  .add(guiState, "autoRotateSpeed", 0, 8, 0.1)
  .name("Rotate Speed")
  .onChange((value: number) => {
    runtime.controls.autoRotateSpeed = value;
  });

window.addEventListener("beforeunload", () => {
  stopPlayback();
  uploadInput.remove();
});

runtime.start();
