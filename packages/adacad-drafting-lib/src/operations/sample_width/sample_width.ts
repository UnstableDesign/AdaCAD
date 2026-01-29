import { Draft, wefts, getCol, warps, initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { parseRegex, lcm, filterToUniqueValues, defaults } from "../../utils";
import { clothOp } from "../categories";
import { getOpParamValById, getAllDraftsAtInlet, reduceToStaticInputs } from "../operations";
import { StringParam, OperationInlet, OpParamVal, OpInput, OpInletValType, OpParamValType, DynamicOperation, OpMeta } from "../types";

const name = "sample_width";
const dynamic_param_id = 0;
const dynamic_param_type = 'profile';


const meta: OpMeta = {
  displayname: 'variable width sampler',
  desc: 'Given a series of letters and numbers (a100 b200 c300), this operation will associate a draft with each letter, and then arrange those drafts from left to right following the pattern order. The numbers next to each letter describe the number of ends upon which the specified pattern should be repeated',
  img: 'sample_width.png',
  categories: [clothOp],
  advanced: true
}


//PARAMS
const pattern: StringParam =
{
  name: 'pattern',
  type: 'string',
  value: 'a20 b20 a40 b40',
  regex: /(?:[a-zA-Z][\d]*[ ]*).*?/, //NEVER USE THE GLOBAL FLAG - it will throw errors randomly
  error: 'invalid entry',
  dx: 'all entries must be a single letter followed by a number, which each letter-number unit separated by a space'
}




const params = [pattern];

//INLETS
const systems: OperationInlet = {
  name: 'warp pattern',
  type: 'static',
  value: null,
  uses: "warp-data",
  dx: 'optional, define a custom warp material or system pattern here',
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
    .reduce((acc: Array<Draft>, el) => {
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
        val: (el.inlet_params[0] ? el.inlet_params[0].toString() : ""),
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

    const label = string_id.charAt(0);
    const qty = parseInt((<string>string_id).substring(1))

    const pdm_item = profile_draft_map.find(el => el.val == label.toString());

    if (pdm_item !== undefined) {
      const draft = pdm_item.draft;

      for (let j = 0; j < qty; j++) {
        const col = getCol(draft.drawdown, j % warps(draft.drawdown));

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


  return 'pattern width:' + param_vals[0].val + "";
}


const onParamChange = (param_vals: Array<OpParamVal>, static_inlets: Array<OperationInlet>, inlet_vals: Array<OpInletValType>, changed_param_id: number, dynamic_param_val: OpParamValType): Array<OpInletValType> => {

  const param_val = <string>dynamic_param_val;
  inlet_vals = reduceToStaticInputs(inlets, inlet_vals);
  const param_regex = (<StringParam>param_vals[0].param).regex;

  let matches = [];

  matches = parseRegex(param_val, param_regex);
  matches = matches.map(el => el.charAt(0));
  matches = filterToUniqueValues(matches);


  matches.forEach(el => {
    inlet_vals.push(el);
  })

  return inlet_vals;


}

const sizeCheck = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): boolean => {
  const original_string = <string>getOpParamValById(0, op_params);
  const original_string_split = parseRegex(original_string, (<StringParam>op_params[0].param).regex);

  if (original_string_split == null || original_string_split.length == 0) return true;
  if (op_inputs.length == 0) return true;

  //now just get all the drafts
  const all_drafts: Array<Draft> = op_inputs
    .filter(el => el.inlet_id > 0)
    .reduce((acc: Array<Draft>, el) => {
      el.drafts.forEach(draft => { acc.push(draft) });
      return acc;
    }, []);


  let total_wefts: number = 0;
  const all_wefts = all_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
  total_wefts = lcm(all_wefts, defaults.lcm_timeout);

  let total_warps: number = 0;
  original_string_split.forEach(string_id => {
    const qty = parseInt((<string>string_id).substring(1))
    total_warps += qty;
  })

  return (total_warps * total_wefts <= defaults.max_area) ? true : false;
}



export const sample_width: DynamicOperation = { name, meta, params, inlets, dynamic_param_id, dynamic_param_type, perform, generateName, onParamChange, sizeCheck };