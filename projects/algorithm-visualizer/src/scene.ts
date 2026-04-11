import { getFloats, initContactNeighborhoods, initDraftFromDrawdown, initWeftPaths, parseWeftPaths, pruneWeftsAndSetCNBlocking, updateCNs, warps, wefts, type Drawdown, type WeftPath } from "adacad-drafting-lib";
import {
  AmbientLight,
  AxesHelper,
  Color,
  DirectionalLight,
  Group,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DRAFT_LIST, simVars } from "./simVars";
import { createTopologyGeometry } from "./topoAdapter";
import { createDraftGeometryGroup } from "./draftAdapter";
import { getFloatGeometry } from "./floatAdapter";
import { isolateLayersLocal, type LayerAlgorithmOptions } from "./isolateLayersLocal";
import { type FloatTraceState, type FloatTraversalEvent } from "./traceTypes";
import { createSeedDebugGeometry } from "./seedDebugAdapter";

export interface SceneRuntime {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  axesHelper: AxesHelper;
  controls: OrbitControls;
  start: () => void;
  stop: () => void;
  clear: (sceneGroups: SceneGroups) => void;
  load: (
    draft_id: number,
    layerOptions?: LayerAlgorithmOptions,
  ) => Promise<SceneGroups>;
  loadFromDrawdown: (
    drawdown: Drawdown,
    layerOptions?: LayerAlgorithmOptions,
  ) => Promise<SceneGroups>;
}

export interface SceneGroups {
  draftGeometry: Group;
  cnGeometry: Group;
  floatGeometry: Group;
  seedDebugGeometry: Group;
  floatTrace: FloatTraversalEvent[];
  applyFloatTraceState: (state: FloatTraceState, dimUntouched: boolean) => void;
}

export const createSceneRuntime = (container: HTMLElement): SceneRuntime => {
  const scene = new Scene();
  scene.background = new Color("#111318");

  const camera = new PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    2000,
  );
  camera.position.set(10, 10, 14);
  camera.lookAt(0, 0, 0);

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(4, 0, 4);

  const ambient = new AmbientLight("#ffffff", 0.55);
  scene.add(ambient);

  const keyLight = new DirectionalLight("#ffffff", 1.1);
  keyLight.position.set(10, 16, 9);
  scene.add(keyLight);

  const fillLight = new DirectionalLight("#91a8ff", 0.35);
  fillLight.position.set(-8, 7, -8);
  scene.add(fillLight);

  const axesHelper = new AxesHelper(3);
  scene.add(axesHelper);

  let frameHandle = 0;
  const renderFrame = () => {
    controls.update();
    renderer.render(scene, camera);
    frameHandle = window.requestAnimationFrame(renderFrame);
  };

  const onResize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  window.addEventListener("resize", onResize);

  const start = () => {
    if (frameHandle !== 0) {
      return;
    }
    frameHandle = window.requestAnimationFrame(renderFrame);
  };

  const stop = () => {
    if (frameHandle !== 0) {
      window.cancelAnimationFrame(frameHandle);
      frameHandle = 0;
    }
    window.removeEventListener("resize", onResize);
  };

  const clear = (sceneGroups: SceneGroups) => {
    scene.remove(sceneGroups.draftGeometry);
    scene.remove(sceneGroups.cnGeometry);
    scene.remove(sceneGroups.floatGeometry);
    scene.remove(sceneGroups.seedDebugGeometry);
  }

  const buildSceneGroups = async (
    drawdown: Drawdown,
    layerOptions: LayerAlgorithmOptions = {},
  ): Promise<SceneGroups> => {
    const draft = initDraftFromDrawdown(drawdown);
    //DRAW THE DRAFT TO START
    const draftGeometry = createDraftGeometryGroup(draft);
    draftGeometry.visible = true;


    //MANUALLY MOVE THROUGH THE SIMULATION ALG

    //UNPACKING GET DRAFT TOPOLOGY
    //SET INITAL CNS
    const cns = await initContactNeighborhoods(draft.drawdown)
    const updatedCNs = await updateCNs(cns, wefts(draft.drawdown), warps(draft.drawdown), simVars);

    let paths: Array<WeftPath> = initWeftPaths(draft);
    paths = parseWeftPaths(draft, paths);


    const floats = getFloats(wefts(draft.drawdown), warps(draft.drawdown), updatedCNs);
    const floatBundle = getFloatGeometry(floats, warps(draft.drawdown), wefts(draft.drawdown));

    const localLayersResult = isolateLayersLocal(
      wefts(draft.drawdown),
      warps(draft.drawdown),
      floats,
      1,
      updatedCNs,
      simVars,
      layerOptions,
    );



    const layeredCNs = localLayersResult.cns;
    const seedDebugGeometry = createSeedDebugGeometry(localLayersResult.seedDebug);
    const pruned_cns = pruneWeftsAndSetCNBlocking(wefts(draft.drawdown), warps(draft.drawdown), layeredCNs);
    const cnGeometry = createTopologyGeometry(pruned_cns, warps(draft.drawdown), wefts(draft.drawdown));


    console.log("FLOAT TRACE IS", localLayersResult.trace);

    const sceneGroups: SceneGroups = {
      draftGeometry: draftGeometry,
      cnGeometry: cnGeometry,
      floatGeometry: floatBundle.group,
      seedDebugGeometry,
      floatTrace: localLayersResult.trace,
      applyFloatTraceState: floatBundle.applyTraceState,
    }




    return Promise.resolve(sceneGroups);
  };

  const load = async (
    draft_id: number,
    layerOptions: LayerAlgorithmOptions = {},
  ): Promise<SceneGroups> => {
    return buildSceneGroups(DRAFT_LIST[draft_id], layerOptions);
  };

  const loadFromDrawdown = async (
    drawdown: Drawdown,
    layerOptions: LayerAlgorithmOptions = {},
  ): Promise<SceneGroups> => {
    return buildSceneGroups(drawdown, layerOptions);
  }

  return { scene, camera, renderer, axesHelper, controls, start, stop, clear, load, loadFromDrawdown };
};


