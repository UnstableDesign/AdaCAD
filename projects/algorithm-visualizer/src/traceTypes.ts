export type FloatTraversalEvent =
  | {
    type: "local_region";
    layer: number;
    seed_float_id: number;
    radius: number;
    float_ids: number[];
  }
  | {
    type: "seed_selected";
    layer: number;
    float_id: number;
    float_face: "warp" | "weft";
  }
  | {
    type: "float_touched";
    layer: number;
    float_id: number;
  }
  | {
    type: "attached_discovered";
    layer: number;
    source_float_id: number;
    attached_float_ids: number[];
  }
  | {
    type: "layer_assigned";
    layer: number;
    float_id: number;
  }
  | {
    type: "layer_complete";
    layer: number;
    assigned_count: number;
    remaining_count: number;
  };

export interface FloatTraceState {
  currentFloatId: number | null;
  touchedIds: Set<number>;
  assignedByLayer: Map<number, number>;
  assignedIds: Set<number>;
  attachedIds: Set<number>;
  currentLayer: number;
  /** Float ids in the active scored-local neighborhood (empty in global mode or before any `local_region` event). */
  localRegionIds: Set<number>;
}

export const reduceFloatTrace = (
  events: FloatTraversalEvent[],
  eventIndex: number,
): FloatTraceState => {
  const clamped = Math.max(0, Math.min(eventIndex, events.length));
  const state: FloatTraceState = {
    currentFloatId: null,
    touchedIds: new Set<number>(),
    assignedByLayer: new Map<number, number>(),
    assignedIds: new Set<number>(),
    currentLayer: 0,
    localRegionIds: new Set<number>(),
    attachedIds: new Set<number>(),
  };

  for (let i = 0; i < clamped; i += 1) {
    const event = events[i];
    state.currentLayer = event.layer;

    if (event.type === "local_region") {
      state.localRegionIds = new Set(event.float_ids);
      continue;
    }

    if (event.type === "seed_selected") {
      state.currentFloatId = event.float_id;
      continue;
    }

    if (event.type === "float_touched") {
      state.currentFloatId = event.float_id;
      state.touchedIds.add(event.float_id);
      continue;
    }

    if (event.type === "attached_discovered") {
      state.currentFloatId = event.source_float_id;
      event.attached_float_ids.forEach((id: number) => {
        state.attachedIds.add(id);
      });
      continue;
    }

    if (event.type === "layer_assigned") {
      state.currentFloatId = event.float_id;
      state.assignedIds.add(event.float_id);
      state.assignedByLayer.set(event.float_id, event.layer);
      continue;
    }
  }

  return state;
};

/** Single step in the lift-map layer construction algorithm (for playback). */
export type LiftMapTraceEvent =
  | { type: "layer_begin"; layer_index: number }
  | { type: "null_candidate"; acn_key: string }
  | { type: "add_acn_layer"; acn_key: string; layer_index: number; reason: "null_next" | "loop" | "remainder" }
  | { type: "loop_seed"; acn_key: string }
  | {
    type: "loop_step";
    acn_key_from: string;
    acn_key_to: string;
    step_index: number;
    float_id: number | null;
  }
  | { type: "loop_outcome"; start_key: string; valid: boolean }
  | { type: "layer_end"; layer_index: number }
  | { type: "terminate_remainder"; acn_keys: string[]; layer_index: number };

export interface LiftMapTraceState {
  currentLayerIndex: number;
  /** ACN key → layer index once placed in a layer (cumulative). */
  assignedAcnLayer: Map<string, number>;
  /** ACN keys examined so far (null scan, loop seeds, loop steps). */
  checkedAcnKeys: Set<string>;
  /** Float ids touched while resolving next ACN along warp/weft rays. */
  scannedFloatIds: Set<number>;
  currentAcnKey: string | null;
  /** Secondary highlight for the "to" ACN on a loop step. */
  currentAcnKeyTo: string | null;
  currentFloatId: number | null;
}

export const reduceLiftMapTrace = (
  events: LiftMapTraceEvent[],
  eventIndex: number,
): LiftMapTraceState => {
  const clamped = Math.max(0, Math.min(eventIndex, events.length));
  const state: LiftMapTraceState = {
    currentLayerIndex: 0,
    assignedAcnLayer: new Map<string, number>(),
    checkedAcnKeys: new Set<string>(),
    scannedFloatIds: new Set<number>(),
    currentAcnKey: null,
    currentAcnKeyTo: null,
    currentFloatId: null,
  };

  for (let i = 0; i < clamped; i += 1) {
    const event = events[i];
    state.currentAcnKey = null;
    state.currentAcnKeyTo = null;
    state.currentFloatId = null;

    if (event.type === "layer_begin") {
      state.currentLayerIndex = event.layer_index;
      continue;
    }

    if (event.type === "null_candidate") {
      state.currentAcnKey = event.acn_key;
      state.checkedAcnKeys.add(event.acn_key);
      continue;
    }

    if (event.type === "add_acn_layer") {
      state.assignedAcnLayer.set(event.acn_key, event.layer_index);
      state.currentLayerIndex = event.layer_index;
      state.currentAcnKey = event.acn_key;
      continue;
    }

    if (event.type === "loop_seed") {
      state.currentAcnKey = event.acn_key;
      state.checkedAcnKeys.add(event.acn_key);
      continue;
    }

    if (event.type === "loop_step") {
      state.currentAcnKey = event.acn_key_from;
      state.currentAcnKeyTo = event.acn_key_to;
      state.checkedAcnKeys.add(event.acn_key_from);
      state.checkedAcnKeys.add(event.acn_key_to);
      if (event.float_id !== null) {
        state.currentFloatId = event.float_id;
        state.scannedFloatIds.add(event.float_id);
      }
      continue;
    }

    if (event.type === "loop_outcome") {
      state.currentAcnKey = event.start_key;
      state.checkedAcnKeys.add(event.start_key);
      continue;
    }

    if (event.type === "layer_end") {
      state.currentLayerIndex = event.layer_index;
      continue;
    }

    if (event.type === "terminate_remainder") {
      event.acn_keys.forEach((k) => {
        state.checkedAcnKeys.add(k);
        state.assignedAcnLayer.set(k, event.layer_index);
      });
      continue;
    }
  }

  return state;
};

export type CreateLayerSetTraceEvent =
  | { type: "snapshot_set"; snapshot_index: number; layer_index: number; stage: "initial" | "post_update" }
  | {
      type: "float_scores";
      layer_index: number;
      scores: Array<{ float_id: number; score: number }>;
    }
  | { type: "search_start"; layer_index: number; acn_key: string }
  | {
    type: "touched_set";
    layer_index: number;
    acn_key: string;
    touched_acn_keys: string[];
    touched_float_ids: number[];
  }
  | { type: "search_result"; layer_index: number; acn_key: string; valid: boolean }
  | { type: "layer_complete"; layer_index: number; lifted_count: number };

export interface CreateLayerSetTraceState {
  currentLayerIndex: number;
  currentSnapshotIndex: number;
  currentAcnKey: string | null;
  touchedAcnKeys: Set<string>;
  touchedFloatIds: Set<number>;
  /** ACN key -> most recent outcome metadata */
  outcomeByAcn: Map<string, { layerIndex: number; valid: boolean }>;
  /** Float id -> current score for the active round. */
  floatScoreByFloatId: Map<number, number>;
  maxFloatScore: number;
}

export const reduceCreateLayerSetTrace = (
  events: CreateLayerSetTraceEvent[],
  eventIndex: number,
): CreateLayerSetTraceState => {
  const clamped = Math.max(0, Math.min(eventIndex, events.length));
  const state: CreateLayerSetTraceState = {
    currentLayerIndex: 0,
    currentSnapshotIndex: 0,
    currentAcnKey: null,
    touchedAcnKeys: new Set<string>(),
    touchedFloatIds: new Set<number>(),
    outcomeByAcn: new Map<string, { layerIndex: number; valid: boolean }>(),
    floatScoreByFloatId: new Map<number, number>(),
    maxFloatScore: 0,
  };

  for (let i = 0; i < clamped; i += 1) {
    const event = events[i];
    state.currentAcnKey = null;
    state.touchedAcnKeys = new Set<string>();
    state.touchedFloatIds = new Set<number>();

    if (event.type === "snapshot_set") {
      state.currentLayerIndex = event.layer_index;
      state.currentSnapshotIndex = event.snapshot_index;
      continue;
    }

    if (event.type === "search_start") {
      state.currentLayerIndex = event.layer_index;
      state.currentAcnKey = event.acn_key;
      continue;
    }

    if (event.type === "float_scores") {
      state.currentLayerIndex = event.layer_index;
      state.floatScoreByFloatId = new Map<number, number>();
      state.maxFloatScore = 0;
      event.scores.forEach((entry) => {
        state.floatScoreByFloatId.set(entry.float_id, entry.score);
        if (entry.score > state.maxFloatScore) {
          state.maxFloatScore = entry.score;
        }
      });
      continue;
    }

    if (event.type === "touched_set") {
      state.currentLayerIndex = event.layer_index;
      state.currentAcnKey = event.acn_key;
      state.touchedAcnKeys = new Set(event.touched_acn_keys);
      state.touchedFloatIds = new Set(event.touched_float_ids);
      continue;
    }

    if (event.type === "search_result") {
      state.currentLayerIndex = event.layer_index;
      state.currentAcnKey = event.acn_key;
      state.outcomeByAcn.set(event.acn_key, {
        layerIndex: event.layer_index,
        valid: event.valid,
      });
      continue;
    }

    if (event.type === "layer_complete") {
      state.currentLayerIndex = event.layer_index;
      continue;
    }
  }

  return state;
};

export interface CreateLayerSetHeatTraceState {
  currentLayerIndex: number;
  currentSnapshotIndex: number;
  /** Float id -> number of completed rounds where this float was touched */
  touchedFrequencyByFloatId: Map<number, number>;
  maxFrequency: number;
}

export const reduceCreateLayerSetHeatTrace = (
  events: CreateLayerSetTraceEvent[],
  eventIndex: number,
): CreateLayerSetHeatTraceState => {
  const clamped = Math.max(0, Math.min(eventIndex, events.length));
  const state: CreateLayerSetHeatTraceState = {
    currentLayerIndex: 0,
    currentSnapshotIndex: 0,
    touchedFrequencyByFloatId: new Map<number, number>(),
    maxFrequency: 0,
  };

  let roundTouched = new Map<number, number>();
  console.log(events);
  for (let i = 0; i < clamped; i += 1) {
    const event = events[i];

    if (event.type === "snapshot_set") {
      state.currentLayerIndex = event.layer_index;
      state.currentSnapshotIndex = event.snapshot_index;
      continue;
    }

    if (event.type === "touched_set") {
      event.touched_float_ids.forEach((id) => roundTouched.set(id, (roundTouched.get(id) ?? 0) + 1));
      continue;
    }

    if (event.type === "layer_complete") {
      console.log("layer_complete", roundTouched.entries());
      state.currentLayerIndex = event.layer_index;
      state.touchedFrequencyByFloatId = roundTouched;
      state.maxFrequency = Math.max(...roundTouched.values());

      console.log("lTouched by Float Id", state.touchedFrequencyByFloatId);

      continue;
    }
  }

  return state;
};
