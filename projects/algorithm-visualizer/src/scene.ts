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
import { createDraftGeometryGroup } from "./draftAdapter";
import { getFloatGeometry } from "./floatAdapter";
import {
  type FloatTraceState,
} from "./traceTypes";
import { createLayerSet } from "./liftMap";

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
  ) => Promise<SceneGroups>;
  loadFromDrawdown: (
    drawdown: Drawdown,
  ) => Promise<SceneGroups>;
}

export interface SceneGroups {
  draftGeometry: Group;
  floatGeometry: Group;
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
    scene.remove(sceneGroups.floatGeometry);
  }

  const buildSceneGroups = async (
    drawdown: Drawdown,
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


    const layerSet = await createLayerSet(draft.drawdown, warps(draft.drawdown), wefts(draft.drawdown), 10);
    console.log("layerSet", layerSet);


    const sceneGroups: SceneGroups = {
      draftGeometry: draftGeometry,
      floatGeometry: floatBundle.group,
    }




    return Promise.resolve(sceneGroups);
  };

  const load = async (
    draft_id: number,
  ): Promise<SceneGroups> => {
    return buildSceneGroups(DRAFT_LIST[draft_id]);
  };

  const loadFromDrawdown = async (
    drawdown: Drawdown,
  ): Promise<SceneGroups> => {
    return buildSceneGroups(drawdown);
  }

  return { scene, camera, renderer, axesHelper, controls, start, stop, clear, load, loadFromDrawdown };
};


