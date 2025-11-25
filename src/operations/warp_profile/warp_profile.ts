import { Sequence } from "../../sequence/sequence";
import { wefts, warps, getCol, initDraftFromDrawdown, Draft } from "../../draft";
import { DynamicOperation, OperationInlet, OpInletValType, OpInput, OpMeta, OpParamVal, OpParamValType, StringParam } from "../types";
import { parseRegex, lcm, filterToUniqueValues, defaults } from "../../utils";
import { getOpParamValById, getAllDraftsAtInlet, reduceToStaticInputs } from "../operations";
import { clothOp } from "../categories";



const name = "warp_profile";


const meta: OpMeta = {
  displayname: 'pattern across width',
  desc: 'Given a series of letters (a b c, etc), this operation will associate a draft with each letter, and then arrange those drafts from left to right following the pattern order',
  img: 'warp_profile.png',
  categories: [clothOp],
  old_names: ["dynamicjoinleft"],
  advanced: true
}



const dynamic_param_id = 0;
const dynamic_param_type = 'profile';

//PARAMS
const pattern: StringParam =
{
  name: 'pattern',
  type: 'string',
  value: 'a b c a b c',
  regex: /\S+/,
  error: 'invalid entry',
  dx: 'all entries must be letters separated by a space'
}




const params = [pattern];

//INLETS
const systems: OperationInlet = {
  name: 'weft pattern',
  type: 'static',
  value: null,
  uses: "weft-data",
  dx: 'optional, define a custom weft material or system pattern here',
  num_drafts: 1
}

const inlets = [systems];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const original_string = <string>getOpParamValById(0, op_params);
  const system_data = getAllDraftsAtInlet(op_inputs, 0);
  const original_string_split = parseRegex(original_string, (<StringParam>op_params[0].param).regex);

  if (original_string_split == null || original_string_split.length == 0) return Promise.resolve([]);

  if (op_inputs.length == 0) return Promise.resolve([]);

  //now just get all the drafts
  const all_drafts: Array<Draft> = op_inputs
    .filter(el => el.inlet_id > 0)
    .reduce((acc: Draft[], el) => {
      el.drafts.forEach(draft => { acc.push(draft) });
      return acc;
    }, []);

  let total_wefts: number = 0;
  const all_wefts = all_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
  total_wefts = lcm(all_wefts, defaults.lcm_timeout);

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
    weft_systems.import(all_drafts[0].rowSystemMapping).resize(total_wefts);
    weft_materials.import(all_drafts[0].rowShuttleMapping).resize(total_wefts);
  } else {
    weft_systems.import(system_data[0].rowSystemMapping).resize(total_wefts);
    weft_materials.import(system_data[0].rowShuttleMapping).resize(total_wefts);

  }

  original_string_split.forEach(string_id => {

    const pdm_item = profile_draft_map.find(el => el.val == string_id);
    if (pdm_item !== undefined) {
      const draft = pdm_item.draft;

      for (let j = 0; j < warps(draft.drawdown); j++) {
        const col = getCol(draft.drawdown, j);
        const seq = new Sequence.OneD().import(col).resize(total_wefts);
        pattern.pushWarpSequence(seq.val());
        warp_mats.push(draft.colShuttleMapping[j % draft.colShuttleMapping.length]);
        warp_systems.push(draft.colSystemMapping[j % draft.colSystemMapping.length]);

      }

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
  return 'pattern across width:' + param_vals[0].val + "";
}


const onParamChange = (param_vals: Array<OpParamVal>, static_inlets: Array<OperationInlet>, inlet_vals: Array<OpInletValType>, changed_param_id: number, dynamic_param_val: OpParamValType): Array<OpInletValType> => {

  const static_inlet_vals = reduceToStaticInputs(inlets, inlet_vals);
  const combined_inlet_vals = static_inlet_vals.slice();
  const param_regex = (<StringParam>param_vals[changed_param_id].param).regex;

  let matches = [];

  matches = parseRegex(<string>dynamic_param_val, param_regex);
  matches = filterToUniqueValues(matches);


  matches.forEach((el: OpInletValType) => {
    combined_inlet_vals.push(el);
  })

  return combined_inlet_vals;

}



export const warp_profile: DynamicOperation = { name, meta, params, inlets, dynamic_param_id, dynamic_param_type, perform, generateName, onParamChange };