import {
  type CreateLayerSetTraceEvent,
  type FloatTraversalEvent,
  type LiftMapTraceEvent,
} from "./traceTypes";

const describeFloatEvent = (e: FloatTraversalEvent): string => {
  switch (e.type) {
    case "local_region":
      return `Local region (layer ${e.layer}): seed float ${e.seed_float_id}, radius ${e.radius}, ${e.float_ids.length} float(s) in neighborhood: [${e.float_ids.join(", ")}].`;
    case "seed_selected":
      return `Seed selected for layer ${e.layer}: float ${e.float_id} (${e.float_face}).`;
    case "float_touched":
      return `Layer ${e.layer}: touched float ${e.float_id}.`;
    case "attached_discovered":
      return `Layer ${e.layer}: from float ${e.source_float_id}, discovered attached float(s): [${e.attached_float_ids.join(", ")}].`;
    case "layer_assigned":
      return `Layer ${e.layer}: assigned float ${e.float_id} to this layer.`;
    case "layer_complete":
      return `Layer ${e.layer} complete: ${e.assigned_count} assigned, ${e.remaining_count} remaining.`;
    default: {
      const _exhaustive: never = e;
      return String(_exhaustive);
    }
  }
};

const describeLiftMapEvent = (e: LiftMapTraceEvent): string => {
  switch (e.type) {
    case "layer_begin":
      return `Begin building layer index ${e.layer_index}.`;
    case "null_candidate":
      return `Null next-value scan: examining ACN ${e.acn_key} (no successor in search set along the walk).`;
    case "add_acn_layer":
      return `Add ACN ${e.acn_key} to layer ${e.layer_index} (${e.reason === "null_next" ? "null next" : e.reason === "loop" ? "valid loop" : "remainder termination"}).`;
    case "loop_seed":
      return `Loop walk: starting from ACN ${e.acn_key} (four steps along CN map).`;
    case "loop_step":
      return `Loop step ${e.step_index + 1}/4: ${e.acn_key_from} → ${e.acn_key_to}${e.float_id !== null ? ` (resolved on float ${e.float_id})` : ""}.`;
    case "loop_outcome":
      return `Loop from ${e.start_key}: ${e.valid ? "valid (closed / on-ray)" : "invalid"}.`;
    case "layer_end":
      return `Finished layer index ${e.layer_index}.`;
    case "terminate_remainder":
      return `Terminate with remainder: ${e.acn_keys.length} ACN(s) forced into layer ${e.layer_index}: [${e.acn_keys.join(", ")}].`;
    default: {
      const _exhaustive: never = e;
      return String(_exhaustive);
    }
  }
};

const describeCreateLayerSetEvent = (e: CreateLayerSetTraceEvent): string => {
  switch (e.type) {
    case "snapshot_set":
      return `Snapshot ${e.snapshot_index} active (${e.stage}) for layer ${e.layer_index}.`;
    case "float_scores":
      return `Layer ${e.layer_index}: computed float scores for ${e.scores.length} float(s).`;
    case "search_start":
      return `Layer ${e.layer_index}: searching ACN ${e.acn_key}.`;
    case "touched_set":
      return `Layer ${e.layer_index}: ACN ${e.acn_key} touched ${e.touched_acn_keys.length} ACN(s) and ${e.touched_float_ids.length} float(s).`;
    case "search_result":
      return `Layer ${e.layer_index}: ACN ${e.acn_key} is ${e.valid ? "valid (added to layer)" : "invalid (not added)"}.`;
    case "layer_complete":
      return `Layer ${e.layer_index} complete: ${e.lifted_count} float(s) lifted.`;
    default: {
      const _exhaustive: never = e;
      return String(_exhaustive);
    }
  }
};

/**
 * Text for the panel above the viewport. `eventIndex` matches the GUI: it is the number of
 * events already applied (0 … trace.length). The line shown is the last applied event when
 * eventIndex > 0.
 */
export const formatTraceEventPanel = (
  mode: "layers_local" | "lift_map" | "create_layer_set" | "lift_map_heat",
  floatTrace: FloatTraversalEvent[],
  liftMapTrace: LiftMapTraceEvent[],
  createLayerSetTrace: CreateLayerSetTraceEvent[],
  eventIndex: number,
): string => {
  const trace =
    mode === "lift_map"
      ? liftMapTrace
      : mode === "lift_map_heat"
        ? createLayerSetTrace
      : mode === "create_layer_set"
        ? createLayerSetTrace
        : floatTrace;
  const modeLabel =
    mode === "lift_map"
      ? "Lift map (floats + ACNs)"
      : mode === "lift_map_heat"
        ? "Lift map heat (touched frequency)"
      : mode === "create_layer_set"
        ? "CreateLayerSet (floats + ACNs)"
        : "Layer isolation (floats)";
  const total = trace.length;
  const applied = Math.max(0, Math.min(eventIndex, total));

  const header = `${modeLabel}\nApplied events: ${applied} / ${total}\n`;

  if (applied === 0) {
    return `${header}\nNo events applied yet. Increase “Event Index” to step through the trace.`;
  }

  const last = trace[applied - 1];
  const detail =
    mode === "lift_map"
      ? describeLiftMapEvent(last as LiftMapTraceEvent)
      : mode === "lift_map_heat"
        ? describeCreateLayerSetEvent(last as CreateLayerSetTraceEvent)
      : mode === "create_layer_set"
        ? describeCreateLayerSetEvent(last as CreateLayerSetTraceEvent)
        : describeFloatEvent(last as FloatTraversalEvent);

  return `${header}\nLast applied (event ${applied} of ${total}):\n${detail}`;
};
