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
