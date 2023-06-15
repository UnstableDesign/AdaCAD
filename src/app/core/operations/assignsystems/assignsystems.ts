import { createCell } from "../../model/cell";
import { Draft, Operation, OperationInlet, OpInput, OpParamVal, StringParam } from "../../model/datatypes";
import { generateMappingFromPattern, initDraftFromDrawdown, initDraftWithParams } from "../../model/drafts";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";
import utilInstance from "../../model/util";

const name = "assign systems";
const old_names = [];

//PARAMS

const weft_pattern:StringParam =  
    {name: 'weft system pattern',
    type: 'string',
    value: 'a b c d e f g',
    regex: /\S+/, //NEVER USE THE GLOBAL FLAG - it will throw errors randomly
    error: 'invalid entry, must use single lower-case letters separated by a space',
    dx: 'all entries must be single lower-case letters separated by a space'
  }
  const warp_system:StringParam =  
    {name: 'weft system pattern',
    type: 'string',
    value: '1 2 3',
    regex: /\S+/, //NEVER USE THE GLOBAL FLAG - it will throw errors randomly
    error: 'invalid entry, must use single lower-case letters separated by a space',
    dx: 'all entries must be single lower-case letters separated by a space'
  }


  const assign_to_weft:StringParam =  
  {name: 'assign to weft',
  type: 'string',
  value: 'a',
  regex: /\S+/, //NEVER USE THE GLOBAL FLAG - it will throw errors randomly
  error: 'invalid entry, must use one lower case letter',
  dx: 'all entries must be one single lower-case letter'
}

  const assign_to_warp:StringParam =  
  {name: 'assign to warp',
  type: 'string',
  value: '1',
  regex: /\S+/, //NEVER USE THE GLOBAL FLAG - it will throw errors randomly
  error: 'invalid entry, must use one number',
  dx: 'all entries must be one number'
}



const params = [weft_pattern, warp_system, assign_to_weft, assign_to_warp];

//INLETS
const draft_inlet: OperationInlet = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: 'draft',
    dx: "the draft that will be assigned to a given system",
    num_drafts: 1
  }


  const inlets = [draft_inlet];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) : Promise<Array<Draft>> => {


    const weft_system_string = getOpParamValById(0, op_params);
    const warp_system_string = getOpParamValById(1, op_params);
    const weft_assignment_string = getOpParamValById(2, op_params);
    const warp_assignment_string = getOpParamValById(3, op_params);

    const weft_system_string_split = utilInstance.parseRegex(weft_system_string, (<StringParam>op_params[0].param).regex);

    const warp_system_string_split = utilInstance.parseRegex(warp_system_string, (<StringParam>op_params[0].param).regex);

    const weft_assignment_string_split = utilInstance.parseRegex(weft_assignment_string, (<StringParam>op_params[0].param).regex);

    const warp_assignment_string_split = utilInstance.parseRegex(warp_assignment_string, (<StringParam>op_params[0].param).regex);


    if(weft_system_string_split.length == 0 || warp_system_string_split.length == 0){
        return Promise.resolve([]);
    } 

    let weft_sys_seq = new Sequence.OneD();
    weft_system_string_split.forEach(id => {
        weft_sys_seq.push(id.charCodeAt(0) - 97);
    });

    let warp_sys_seq = new Sequence.OneD();
    warp_system_string_split.forEach(id => {
        warp_sys_seq.push(id.charCodeAt(0) - 49);
    });

    let drafts = getAllDraftsAtInlet(op_inputs, 0);
    let seq = new Sequence.TwoD();

    if(drafts.length == 0 || weft_assignment_string_split.length == 0 || warp_assignment_string_split.length == 0){
        let draft = initDraftWithParams({wefts: weft_sys_seq.length(), warps: warp_sys_seq.length(), drawdown:[[createCell(null)]]})
        seq.import(draft.drawdown);
      
    }else{

        let weft_assn = (weft_assignment_string_split.length == 0) ? 0 :  weft_assignment_string_split[0].charCodeAt(0) - 97;
       
        let warp_assn = (warp_assignment_string_split.length == 0) ? 0 :  warp_assignment_string_split[0].charCodeAt(0) - 49;
       
       
        let draft = drafts[0];
    
        seq.import(draft.drawdown).mapToSystems([weft_assn], [warp_assn], weft_sys_seq, warp_sys_seq);
    
    

    }

   

    let d: Draft = initDraftFromDrawdown(seq.export());
     d.colSystemMapping =  generateMappingFromPattern(d.drawdown, warp_sys_seq.val(),'col', 3);
    d.rowSystemMapping =  generateMappingFromPattern(d.drawdown, weft_sys_seq.val(),'row', 3);



  return Promise.resolve([d]);
};   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {

    let drafts = getAllDraftsAtInlet(op_inputs, 0);
    let name_list = parseDraftNames(drafts);
  return "assign systems("+name_list+")";
}


export const assignsystems: Operation = {name, old_names, params, inlets, perform, generateName};