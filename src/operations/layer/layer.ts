import { Draft, warps, wefts, initDraftFromDrawdown, generateMappingFromPattern } from "../../draft";
import { Sequence } from "../../sequence";
import { getAllDraftsAtInlet, lcm, parseDraftNames } from "../../utils";
import { OperationParam, OperationInlet, OpParamVal, OpInput, Operation } from "../types";

const name = "layer";
const old_names: Array<string> = [];


//PARAMS

const params: Array<OperationParam> = [];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'drafts',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the drafts to layer (from top to bottom)',
  num_drafts: -1
}


const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): Promise<Array<Draft>> => {


  const drafts = getAllDraftsAtInlet(op_inputs, 0);

  if (drafts.length == 0) return Promise.resolve([]);


  //create a default system mapping that assumes alternating weft and warp systems associated with each layer
  const sys_seq = new Sequence.OneD();
  for (let i = 0; i < drafts.length; i++) {
    sys_seq.push(i);
  }

  const composite = new Sequence.TwoD().setBlank(2
  );
  const ends = lcm(drafts.map(el => warps(el.drawdown))) * drafts.length;
  const pics = lcm(drafts.map(el => wefts(el.drawdown))) * drafts.length;




  const warp_sys_above: number[] = [];
  const weft_sys_above: number[] = [];
  drafts.forEach((draft, ndx) => {
    const seq = new Sequence.TwoD().import(draft.drawdown);
    seq.mapToSystems([ndx], [ndx], sys_seq, sys_seq, ends, pics);
    composite.overlay(seq, false);
    composite.placeInLayerStack([ndx], warp_sys_above, [ndx], weft_sys_above, sys_seq, sys_seq);
    warp_sys_above.push(ndx);
    weft_sys_above.push(ndx);
  })


  const d: Draft = initDraftFromDrawdown(composite.export());
  d.colSystemMapping = generateMappingFromPattern(d.drawdown, sys_seq.val(), 'col');
  d.rowSystemMapping = generateMappingFromPattern(d.drawdown, sys_seq.val(), 'row');

  const warp_mats = [];
  for (let j = 0; j < ends; j++) {
    const select_draft = j % drafts.length;
    const within_draft_id = Math.floor(j / drafts.length);
    const mat_mapping = drafts[select_draft].colShuttleMapping;
    const mat_id = mat_mapping[within_draft_id % mat_mapping.length]
    warp_mats.push(mat_id)
  }

  const weft_mats = [];
  for (let i = 0; i < pics; i++) {
    const select_draft = i % drafts.length;
    const within_draft_id = Math.floor(i / drafts.length);
    const mat_mapping = drafts[select_draft].rowShuttleMapping;
    const mat_id = mat_mapping[within_draft_id % mat_mapping.length]
    weft_mats.push(mat_id)
  }

  d.rowShuttleMapping = generateMappingFromPattern(d.drawdown, weft_mats, 'row');
  d.colShuttleMapping = generateMappingFromPattern(d.drawdown, warp_mats, 'col');
  return Promise.resolve([d]);
};


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  const name_list = parseDraftNames(drafts);
  return "layer(" + name_list + ")";
}


export const layer: Operation = { name, old_names, params, inlets, perform, generateName };