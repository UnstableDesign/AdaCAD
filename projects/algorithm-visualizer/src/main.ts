import "./style.css";
import { GUI } from "dat.gui";
import { createSceneRuntime, type SceneGroups } from "./scene";
import { DRAFT_LIST } from "./simVars";
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

const simHud = {
  paused: false,
  time: "0.000 s",
};

const syncSimHud = () => {
  simHud.time = `${runtime.getSimulationTime().toFixed(3)} s`;
  simHud.paused = runtime.getSimulationPaused();
  requestAnimationFrame(syncSimHud);
};
requestAnimationFrame(syncSimHud);

const guiState = {
  draft_id: 0,
  showSpringSystem: true,
  showNodes: true,
  showAxes: true,
  threshold: 15,
  yarn_thickness: 0.85,
  spring_gravity: 0.6,
  spring_stiffness: 1.0,
  spring_damping: 1.0,
  spring_global_damping: 0.2,
  boundary_max_stretch_add: 1.5,
  float_max_stretch_add: 1.5,
  per_node_force_multiplier: 1.0,
  float_score_z_multiplier: 5,
  float_spring_shrink_factor: 0.8,
  boundary_rest_length: 0.5,
  weft_rest_length: 1,
  warp_rest_length: 0.1,
  max_offset: 2,
};

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
  eventDescriptionEl.value = [
    "Spring System View",
    `Nodes: ${sceneGroups.nodeCount}`,
    `Springs: ${sceneGroups.springCount}`,
  ].join("\n");
};

const getCreateLayerSetOptions = () => ({
  threshold: Math.max(1, Math.floor(guiState.threshold)),
  yarnRadiusMultiplier: Math.max(0.2, guiState.yarn_thickness),
  perNodeForceMultiplier: Math.max(0, guiState.per_node_force_multiplier),
  floatScoreZMultiplier: Math.max(0, guiState.float_score_z_multiplier),
  floatSpringShrinkFactor: Math.min(1, Math.max(0, guiState.float_spring_shrink_factor)),
  boundaryRestLength: Math.max(0.01, guiState.boundary_rest_length),
  weftRestLength: Math.max(0.01, guiState.weft_rest_length),
  warpRestLength: Math.max(0.01, guiState.warp_rest_length),
});

const renderSceneGroups = (next: SceneGroups) => {
  sceneGroups = next;
  runtime.scene.add(sceneGroups.springGeometry);
  sceneGroups.springGeometry.visible = guiState.showSpringSystem;
  sceneGroups.setNodesVisible(guiState.showNodes);
  runtime.setSimulationPaused(false);
  simHud.paused = false;
  updateEventDescriptionPanel();
};

const loadFromDrawdown = (drawdown: Parameters<typeof runtime.loadFromDrawdown>[0]) => {
  if (sceneGroups) {
    runtime.clear(sceneGroups);
  }
  stopPlayback();
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
    runtime.setSpringStepOptions({
      gravity: guiState.spring_gravity,
      stiffnessScale: guiState.spring_stiffness,
      dampingScale: guiState.spring_damping,
      globalDamping: guiState.spring_global_damping,
      boundaryMaxStretchAdd: guiState.boundary_max_stretch_add,
      floatMaxStretchAdd: guiState.float_max_stretch_add,
      maxOffset: guiState.max_offset,
    });
  });

gui.add(actions, "upload_png").name("Upload PNG/JPG");

const simFolder = gui.addFolder("Simulation");
simFolder
  .add(simHud, "paused")
  .name("Paused")
  .onChange((value: boolean) => {
    runtime.setSimulationPaused(value);
  });
simFolder.add(simHud, "time").name("Time").listen();
simFolder.open();

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
  .add(guiState, "yarn_thickness", 0.2, 2, 0.05)
  .name("Yarn Thickness")
  .onFinishChange((value: number) => {
    guiState.yarn_thickness = Math.max(0.2, value);
    if (currentCustomDrawdown) {
      loadFromDrawdown(currentCustomDrawdown);
      return;
    }
    if (sceneGroups) {
      runtime.clear(sceneGroups);
    }
    stopPlayback();
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
  .add(guiState, "spring_gravity", 0, 2, 0.05)
  .name("Gravity")
  .onChange((value: number) => {
    guiState.spring_gravity = Math.max(0, value);
    runtime.setSpringStepOptions({ gravity: guiState.spring_gravity });
  });

gui
  .add(guiState, "spring_stiffness", 0.1, 4, 0.05)
  .name("Stiffness Scale")
  .onChange((value: number) => {
    guiState.spring_stiffness = Math.max(0.1, value);
    runtime.setSpringStepOptions({ stiffnessScale: guiState.spring_stiffness });
  });

gui
  .add(guiState, "spring_damping", 0, 4, 0.05)
  .name("Spring Damping")
  .onChange((value: number) => {
    guiState.spring_damping = Math.max(0, value);
    runtime.setSpringStepOptions({ dampingScale: guiState.spring_damping });
  });

gui
  .add(guiState, "spring_global_damping", 0, 1, 0.01)
  .name("Global Damping")
  .onChange((value: number) => {
    guiState.spring_global_damping = Math.min(1, Math.max(0, value));
    runtime.setSpringStepOptions({ globalDamping: guiState.spring_global_damping });
  });

gui
  .add(guiState, "boundary_max_stretch_add", 1, 100, 0.05)
  .name("Boundary MaxStretch +")
  .onChange((value: number) => {
    guiState.boundary_max_stretch_add = Math.min(100, Math.max(1, value));
    runtime.setSpringStepOptions({ boundaryMaxStretchAdd: guiState.boundary_max_stretch_add });
  });

gui
  .add(guiState, "float_max_stretch_add", 1, 5, 0.05)
  .name("Float MaxStretch +")
  .onChange((value: number) => {
    guiState.float_max_stretch_add = Math.min(5, Math.max(1, value));
    runtime.setSpringStepOptions({ floatMaxStretchAdd: guiState.float_max_stretch_add });
  });

gui
  .add(guiState, "max_offset", 0, 20, 0.1)
  .name("Max XY offset")
  .onChange((value: number) => {
    guiState.max_offset = Math.min(20, Math.max(0, value));
    runtime.setSpringStepOptions({ maxOffset: guiState.max_offset });
  });

gui
  .add(guiState, "per_node_force_multiplier", 0, 10, 0.1)
  .name("Per-Node Force Mult")
  .onFinishChange((value: number) => {
    guiState.per_node_force_multiplier = Math.max(0, value);
    if (currentCustomDrawdown) {
      loadFromDrawdown(currentCustomDrawdown);
      return;
    }
    if (sceneGroups) {
      runtime.clear(sceneGroups);
    }
    stopPlayback();
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
  .add(guiState, "float_score_z_multiplier", 0, 20, 0.1)
  .name("Float Score Z Mult")
  .onFinishChange((value: number) => {
    guiState.float_score_z_multiplier = Math.max(0, value);
    if (currentCustomDrawdown) {
      loadFromDrawdown(currentCustomDrawdown);
      return;
    }
    if (sceneGroups) {
      runtime.clear(sceneGroups);
    }
    stopPlayback();
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
  .add(guiState, "float_spring_shrink_factor", 0, 1, 0.05)
  .name("Float Spring Shrink")
  .onFinishChange((value: number) => {
    guiState.float_spring_shrink_factor = Math.min(1, Math.max(0, value));
    if (currentCustomDrawdown) {
      loadFromDrawdown(currentCustomDrawdown);
      return;
    }
    if (sceneGroups) {
      runtime.clear(sceneGroups);
    }
    stopPlayback();
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
  .add(guiState, "boundary_rest_length", 0.01, 5, 0.01)
  .name("Boundary Rest Length")
  .onFinishChange((value: number) => {
    guiState.boundary_rest_length = Math.max(0.01, value);
    if (currentCustomDrawdown) {
      loadFromDrawdown(currentCustomDrawdown);
      return;
    }
    if (sceneGroups) {
      runtime.clear(sceneGroups);
    }
    stopPlayback();
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
  .add(guiState, "weft_rest_length", 0.01, 5, 0.01)
  .name("Weft Rest Length")
  .onFinishChange((value: number) => {
    guiState.weft_rest_length = Math.max(0.01, value);
    if (currentCustomDrawdown) {
      loadFromDrawdown(currentCustomDrawdown);
      return;
    }
    if (sceneGroups) {
      runtime.clear(sceneGroups);
    }
    stopPlayback();
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
  .add(guiState, "warp_rest_length", 0.01, 5, 0.01)
  .name("Warp Rest Length")
  .onFinishChange((value: number) => {
    guiState.warp_rest_length = Math.max(0.01, value);
    if (currentCustomDrawdown) {
      loadFromDrawdown(currentCustomDrawdown);
      return;
    }
    if (sceneGroups) {
      runtime.clear(sceneGroups);
    }
    stopPlayback();
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

gui.add(guiState, "showSpringSystem").name("Show Spring System").onChange((value: boolean) => {
  if (!sceneGroups) return;
  sceneGroups.springGeometry.visible = value;
});

gui.add(guiState, "showNodes").name("Show Nodes").onChange((value: boolean) => {
  if (!sceneGroups) return;
  sceneGroups.setNodesVisible(value);
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
