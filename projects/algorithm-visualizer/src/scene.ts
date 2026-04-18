import { getFloats, initContactNeighborhoods, initDraftFromDrawdown, updateCNs, warps, wefts, type Drawdown } from "adacad-drafting-lib";
import {
  AmbientLight,
  AxesHelper,
  Color,
  DirectionalLight,
  Group,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DRAFT_LIST } from "./simVars";
import { simVars } from "./simVars";
import { createSpringSystem, stepSpringSystem, type SpringStepOptions, type SpringSystem } from "./springSim";
import { createSpringGeometry, type SpringGeometryBundle } from "./springAdapter";
import { getFloatScores } from "./liftMap";

export interface CreateLayerSetOptions {
  threshold?: number;
  yarnRadiusMultiplier?: number;
  perNodeForceMultiplier?: number;
  floatScoreZMultiplier?: number;
  floatSpringShrinkFactor?: number;
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
  setSpringStepOptions: (options: Partial<SpringStepOptions>) => void;
  setSimulationPaused: (paused: boolean) => void;
  getSimulationPaused: () => boolean;
  getSimulationTime: () => number;
}

export interface SceneGroups {
  springGeometry: Group;
  nodeCount: number;
  springCount: number;
  setNodesVisible: (visible: boolean) => void;
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
  controls.target.set(0, 0, 0);

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
  let lastTime = performance.now();
  let simulationPaused = false;
  let simulationTime = 0;
  let currentSystem: SpringSystem | null = null;
  let currentSpringBundle: SpringGeometryBundle | null = null;
  let springStepOptions: SpringStepOptions = {
    gravity: 1,
    stiffnessScale: 1,
    dampingScale: 1,
    globalDamping: 0.2,
    boundaryMaxStretchAdd: 1.5,
    floatMaxStretchAdd: 1.5,
    packStrength: 1,
    boundaryZMinSeparation: 1e-3,
  };
  const renderFrame = () => {
    const now = performance.now();
    const dtSeconds = (now - lastTime) / 1000;
    lastTime = now;

    if (currentSystem && currentSpringBundle) {
      if (!simulationPaused) {
        stepSpringSystem(currentSystem, dtSeconds, springStepOptions);
        simulationTime += dtSeconds;
      }
      currentSpringBundle.updateFromSystem(currentSystem);
    }

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
    scene.remove(sceneGroups.springGeometry);
  }

  const buildSceneGroups = async (
    drawdown: Drawdown,
    options: CreateLayerSetOptions = {},
  ): Promise<SceneGroups> => {
    const draft = initDraftFromDrawdown(drawdown);
    const cns = await initContactNeighborhoods(draft.drawdown);
    const updatedCNs = await updateCNs(cns, wefts(draft.drawdown), warps(draft.drawdown), simVars);
    const floats = getFloats(wefts(draft.drawdown), warps(draft.drawdown), updatedCNs);
    const floatScores = await getFloatScores(draft.drawdown, warps(draft.drawdown), wefts(draft.drawdown), options.threshold ?? 0.5);
    const initialSystem: SpringSystem = {
      nodes: new Map(),
      springs: new Map(),
      nodeToSprings: new Map(),
      perNodeStartingForce: new Map(),
    };
    const system = createSpringSystem(
      initialSystem,
      floats,
      floatScores,
      draft.drawdown,
      wefts(draft.drawdown),
      warps(draft.drawdown),
      {
        perNodeForceMultiplier: options.perNodeForceMultiplier,
        floatScoreZMultiplier: options.floatScoreZMultiplier,
        floatSpringShrinkFactor: options.floatSpringShrinkFactor,
      },
    );
    // Recenter simulation coordinates so orbiting is anchored at the scene origin.
    const center = new Vector3();
    let nodeCount = 0;
    for (const node of system.nodes.values()) {
      center.add(node.position);
      nodeCount += 1;
    }
    if (nodeCount > 0) {
      center.multiplyScalar(1 / nodeCount);
      for (const node of system.nodes.values()) {
        node.position.sub(center);
      }
    }
    const springBundle = createSpringGeometry(system, {
      yarnRadiusMultiplier: options.yarnRadiusMultiplier,
    });

    currentSystem = system;
    currentSpringBundle = springBundle;
    simulationTime = 0;

    const sceneGroups: SceneGroups = {
      springGeometry: springBundle.group,
      nodeCount: system.nodes.size,
      springCount: system.springs.size,
      setNodesVisible: springBundle.setNodesVisible,
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

  const setSpringStepOptions = (options: Partial<SpringStepOptions>) => {
    springStepOptions = { ...springStepOptions, ...options };
  };

  const setSimulationPaused = (paused: boolean) => {
    simulationPaused = paused;
  };

  const getSimulationPaused = () => simulationPaused;

  const getSimulationTime = () => simulationTime;

  return {
    scene,
    camera,
    renderer,
    axesHelper,
    controls,
    start,
    stop,
    clear,
    load,
    loadFromDrawdown,
    setSpringStepOptions,
    setSimulationPaused,
    getSimulationPaused,
    getSimulationTime,
  };
};


