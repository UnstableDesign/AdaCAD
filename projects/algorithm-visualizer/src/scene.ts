import { initDraftFromDrawdown, warps, wefts, type Drawdown } from "adacad-drafting-lib";
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
import { DRAFT_LIST } from "./simVars";
import { createDraftGeometryGroup } from "./draftAdapter";
import { createLayerSetGeometry } from "./createLayerSetAdapter";
import { createLiftMapHeatGeometry } from "./liftMapHeatAdapter";
import {
  type CreateLayerSetHeatTraceState,
  type CreateLayerSetTraceEvent,
  type CreateLayerSetTraceState,
} from "./traceTypes";
import { createLayerSetWithTrace } from "./liftMap";

export interface CreateLayerSetOptions {
  threshold?: number;
}

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
    options?: CreateLayerSetOptions,
  ) => Promise<SceneGroups>;
  loadFromDrawdown: (
    drawdown: Drawdown,
    options?: CreateLayerSetOptions,
  ) => Promise<SceneGroups>;
}

export interface SceneGroups {
  draftGeometry: Group;
  createLayerSetGeometry: Group;
  liftMapHeatGeometry: Group;
  createLayerSetTrace: CreateLayerSetTraceEvent[];
  applyCreateLayerSetState: (
    state: CreateLayerSetTraceState,
    dimUntouched: boolean,
    scoreDepthEnabled: boolean,
    scoreDepthStrength: number,
  ) => void;
  applyLiftMapHeatState: (
    state: CreateLayerSetHeatTraceState,
    dimUntouched: boolean,
    heatGamma: number,
  ) => void;
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
    scene.remove(sceneGroups.createLayerSetGeometry);
    scene.remove(sceneGroups.liftMapHeatGeometry);
  }

  const buildSceneGroups = async (
    drawdown: Drawdown,
    options: CreateLayerSetOptions = {},
  ): Promise<SceneGroups> => {
    const draft = initDraftFromDrawdown(drawdown);
    //DRAW THE DRAFT TO START
    const draftGeometry = createDraftGeometryGroup(draft);
    draftGeometry.visible = true;


    const createLayerSetResult = await createLayerSetWithTrace(
      draft.drawdown,
      warps(draft.drawdown),
      wefts(draft.drawdown),
      Math.max(1, Math.floor(options.threshold ?? 15)),
    );
    console.log("CREATE LAYER SET RESULT", createLayerSetResult.layerSet);
    const geometryBundle = createLayerSetGeometry(
      createLayerSetResult.snapshots,
      warps(draft.drawdown),
      wefts(draft.drawdown),
    );
    const heatBundle = createLiftMapHeatGeometry(
      createLayerSetResult.snapshots,
      warps(draft.drawdown),
      wefts(draft.drawdown),
    );


    const sceneGroups: SceneGroups = {
      draftGeometry: draftGeometry,
      createLayerSetGeometry: geometryBundle.group,
      liftMapHeatGeometry: heatBundle.group,
      createLayerSetTrace: createLayerSetResult.trace,
      applyCreateLayerSetState: geometryBundle.applyCreateLayerSetState,
      applyLiftMapHeatState: heatBundle.applyHeatState,
    }




    return Promise.resolve(sceneGroups);
  };

  const load = async (
    draft_id: number,
    options: CreateLayerSetOptions = {},
  ): Promise<SceneGroups> => {
    return buildSceneGroups(DRAFT_LIST[draft_id], options);
  };

  const loadFromDrawdown = async (
    drawdown: Drawdown,
    options: CreateLayerSetOptions = {},
  ): Promise<SceneGroups> => {
    return buildSceneGroups(drawdown, options);
  }

  return { scene, camera, renderer, axesHelper, controls, start, stop, clear, load, loadFromDrawdown };
};


