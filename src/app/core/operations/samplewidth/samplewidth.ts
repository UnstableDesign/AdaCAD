import { Draft, DynamicOperation, OperationInlet, OpInput, OpParamVal, StringParam } from "../../model/datatypes";
import { getCol, initDraftFromDrawdown, warps, wefts } from "../../model/drafts";
import { getAllDraftsAtInlet, getOpParamValById, reduceToStaticInputs } from "../../model/operations";
import { Sequence } from "../../model/sequence";
import utilInstance from "../../model/util";


const name = "sample_width";
const old_names = [""];
const dynamic_param_id = [0];
const dynamic_param_type = 'profile';

//PARAMS
const pattern:StringParam =  
    {name: 'pattern',
    type: 'string',
    value: 'a20 b20 a40 b40',
    regex:/(?:[a-xA-Z][\d]*[\ ]*).*?/, //NEVER USE THE GLOBAL FLAG - it will throw errors randomly
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


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

      const original_string = getOpParamValById(0, op_params);
      const system_data = getAllDraftsAtInlet(op_inputs, 0);
      const original_string_split = utilInstance.parseRegex(original_string, (<StringParam>op_params[0].param).regex);
      
      if(original_string_split == null || original_string_split.length == 0) return Promise.resolve([]);

      if(op_inputs.length == 0) return Promise.resolve([]);
     
      //now just get all the drafts
        const all_drafts: Array<Draft> = op_inputs
        .filter(el => el.inlet_id > 0)
        .reduce((acc, el) => {
            el.drafts.forEach(draft => {acc.push(draft)});
            return acc;
        }, []);

        let total_wefts: number = 0;
        const all_wefts = all_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
        total_wefts = utilInstance.lcm(all_wefts);
  
        const profile_draft_map = op_inputs
        .map(el => {
          return  {
            id: el.inlet_id, 
            val: el.params[0].toString(),
            draft: el.drafts[0]
          }
        });

        let pattern = new Sequence.TwoD();
        let warp_systems = new Sequence.OneD();
        let warp_mats = new Sequence.OneD();
        let weft_systems = new Sequence.OneD();
        let weft_materials = new Sequence.OneD();

        if(system_data.length == 0){
            weft_systems.import(all_drafts[0].rowSystemMapping).resize(total_wefts);
            weft_materials.import(all_drafts[0].rowShuttleMapping).resize(total_wefts);
        }else{
            weft_systems.import(system_data[0].rowSystemMapping).resize(total_wefts);
            weft_materials.import(system_data[0].rowShuttleMapping).resize(total_wefts);

        }

        original_string_split.forEach(string_id => {

            const label = string_id.charAt(0);
            const qty = parseInt((<string>string_id).substring(1))

            let pdm_item = profile_draft_map.find(el => el.val == label.toString());
            if(pdm_item !== undefined){
                let draft = pdm_item.draft;
           
                for(let j = 0; j < qty; j++){
                    let col = getCol(draft.drawdown, j%warps(draft.drawdown));
                    let seq = new Sequence.OneD().import(col).resize(total_wefts);
                    pattern.pushWarpSequence(seq.val());
                    warp_mats.push(draft.colShuttleMapping[j%draft.colShuttleMapping.length]);
                    warp_systems.push(draft.colSystemMapping[j%draft.colSystemMapping.length]);
          
                }

             }


        })

       let d: Draft = initDraftFromDrawdown(pattern.export());
       d.colShuttleMapping = warp_mats.val();
       d.colSystemMapping = warp_systems.val();
       d.rowShuttleMapping = weft_materials.val();
       d.rowSystemMapping = weft_systems.val();

      
      return  Promise.resolve([d]);

  }   

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {

  
  return 'pattern width:'+param_vals[0].val+"";
}


const onParamChange = (param_vals: Array<OpParamVal>, inlets: Array<OperationInlet>, inlet_vals: Array<any>, changed_param_id: number, param_val: any) : Array<any> => {
    
    inlet_vals = reduceToStaticInputs(inlets, inlet_vals);
    const param_regex = (<StringParam> param_vals[0].param).regex;

    let matches = [];

    matches = utilInstance.parseRegex(param_val,param_regex);
    matches = matches.map(el => el.charAt(0));
    matches = utilInstance.filterToUniqueValues(matches);

    
    matches.forEach(el => {
      inlet_vals.push(el);
    })

    return inlet_vals;


}



export const sample_width: DynamicOperation = {name, old_names, params, inlets, dynamic_param_id, dynamic_param_type, perform, generateName,onParamChange};