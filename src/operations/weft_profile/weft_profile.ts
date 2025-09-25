import { Draft, warps, Cell, initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { parseRegex, lcm, filterToUniqueValues } from "../../utils";
import { clothOp } from "../categories";
import { getOpParamValById, getAllDraftsAtInlet, reduceToStaticInputs } from "../operations";
import { StringParam, OperationInlet, OpParamVal, OpInput, OpInletValType, OpParamValType, DynamicOperation, OpMeta } from "../types";


const name = "weft_profile";
const dynamic_param_id = [0];
const dynamic_param_type = 'profile';


const meta: OpMeta = {
  displayname: 'pattern across length',
  desc: 'Given a series of letters (a b c), this operation will associate a draft with each letter, and then arrange following the pattern order',
  img: 'weft_profile.png',
  categories: [clothOp],
  advanced: true,
  old_names: ["dynamicjointop"]
}


//PARAMS
const pattern: StringParam =
{
  name: 'pattern weft',
  type: 'string',
  value: 'a b c a b c',
  regex: /\S+/,
  error: 'invalid entry',
  dx: 'all entries must be letters separated by a space'
}




const params = [pattern];

//INLETS
const systems: OperationInlet = {
  name: 'warp pattern',
  type: 'static',
  value: null,
  uses: "warp-data",
  dx: 'optional, define a custom weft material or system pattern here',
  num_drafts: 1
}

const inlets = [systems];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const original_string = <string>getOpParamValById(0, op_params) ?? '';
  const system_data = getAllDraftsAtInlet(op_inputs, 0);
  const original_string_split = parseRegex(original_string, (<StringParam>op_params[0].param).regex);

  if (original_string_split == null || original_string_split.length == 0) return Promise.resolve([]);

  if (op_inputs.length == 0) return Promise.resolve([]);

  //now just get all the drafts
  const all_drafts: Array<Draft> = op_inputs
    .filter(el => el.inlet_id > 0)
    .reduce((acc: Array<Draft>, el) => {
      el.drafts.forEach(draft => { acc.push(draft) });
      return acc;
    }, []);

  let total_warps: number = 0;
  const all_warps = all_drafts.map(el => warps(el.drawdown)).filter(el => el > 0);
  total_warps = lcm(all_warps);

  const profile_draft_map = op_inputs
    .map(el => {
      return {
        id: el.inlet_id,
        val: (el.inlet_params[0] == undefined) ? '' : (el.inlet_params[0]).toString(),
        draft: el.drafts[0]
      }
    });

  const pattern = new Sequence.TwoD();
  const warp_systems = new Sequence.OneD();
  const warp_mats = new Sequence.OneD();
  const weft_systems = new Sequence.OneD();
  const weft_materials = new Sequence.OneD();

  if (system_data.length == 0) {
    warp_systems.import(all_drafts[0].colSystemMapping).resize(total_warps);
    warp_mats.import(all_drafts[0].colShuttleMapping).resize(total_warps);
  } else {
    warp_systems.import(system_data[0].colSystemMapping).resize(total_warps);
    warp_mats.import(system_data[0].colShuttleMapping).resize(total_warps);

  }

  original_string_split.forEach((string_id: string) => {

    const pdm_item = profile_draft_map.find(el => el.val == string_id);
    if (pdm_item !== undefined) {
      const draft = pdm_item.draft;

      draft.drawdown.forEach((row: Array<Cell>, i: number) => {
        const seq = new Sequence.OneD().import(row).resize(total_warps);
        pattern.pushWeftSequence(seq.val());
        weft_materials.push(draft.rowShuttleMapping[i % draft.rowShuttleMapping.length]);
        weft_systems.push(draft.rowSystemMapping[i % draft.rowSystemMapping.length]);
      })

    }


  })

  const d: Draft = initDraftFromDrawdown(pattern.export());
  d.colShuttleMapping = warp_mats.val();
  d.colSystemMapping = warp_systems.val();
  d.rowShuttleMapping = weft_materials.val();
  d.rowSystemMapping = weft_systems.val();


  return Promise.resolve([{ draft: d }]);

}

const generateName = (param_vals: Array<OpParamVal>): string => {

  return 'pattern across length:' + param_vals[0].val + "";
}


const onParamChange = (param_vals: Array<OpParamVal>, static_inlets: Array<OperationInlet>, inlet_vals: Array<OpInletValType>, changed_param_id: number, dynamic_param_vals: Array<OpParamValType>): Array<OpInletValType> => {

  const static_inlet_vals = reduceToStaticInputs(inlets, inlet_vals);
  const combined_inlet_vals = static_inlet_vals.slice();
  const param_regex = (<StringParam>param_vals[changed_param_id].param).regex;

  let matches = [];

  matches = parseRegex(<string>dynamic_param_vals[changed_param_id], param_regex);
  matches = filterToUniqueValues(matches);


  matches.forEach((el: OpInletValType) => {
    combined_inlet_vals.push(el);
  })

  return combined_inlet_vals;

}



export const weft_profile: DynamicOperation = { name, meta, params, inlets, dynamic_param_id, dynamic_param_type, perform, generateName, onParamChange };