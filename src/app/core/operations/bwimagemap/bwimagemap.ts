import { createCell } from "../../model/cell";
import { AnalyzedImage, Cell, Color, Draft, DynamicOperation, FileParam, NumParam, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { getHeddle, initDraftFromDrawdown, initDraftWithParams, warps, wefts } from "../../model/drafts";
import { getOpParamValById } from "../../model/operations";




const name = "bwimagemap";
const old_names = [];
const dynamic_param_id = [0];
const dynamic_param_type = 'color';

//PARAMS
//the value on this param needs to hold all the image data
const file:FileParam =  {
    name: 'image file (.jpg or .png)',
    type: 'file',
    value: {id: '', data: null},
    dx: 'the file to upload',
}

const width:NumParam = { 
   name: 'ends',     
   type: 'number',
   min: 1,
   max: 10000,
   value: 30,
   dx: 'resize the input image to the width specified'
}

const height:NumParam = {   
    name: 'pics',   
    type: 'number',
    min: 1,
    max: 10000,
    value: 20,
    dx: 'resize the input image to the height specified'
 }
 


const params = [file, width, height];

//INLETS

  const inlets = [];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

    const file_param = getOpParamValById(0, op_params);   
    const res_w = getOpParamValById(1, op_params);
    const res_h = getOpParamValById(2, op_params);

    if(file_param.id == '' || file_param.data == null){
        const d = initDraftWithParams({wefts: res_w, warps: res_h, drawdown: [[createCell(false)]]})
        return Promise.resolve([d]);
    } 
    

    const data:AnalyzedImage = file_param.data;

    const color_to_drafts = data.colors_mapping.map((color, ndx) => {

       let color_to:Color = data.colors[color.to];


        if(color_to.hex == '#000000'){
            if(op_inputs.findIndex(input => input.inlet_id == 0) !== -1) return {color: color_to.hex, draft: op_inputs[0].drafts[0]}
            else return {color: color_to.hex, draft: initDraftWithParams({warps: 1, wefts: 1, drawdown: [[createCell(true)]]})}
          } else{
            if(op_inputs.findIndex(input => input.inlet_id == 1) !== -1) return {color: color_to.hex, draft: op_inputs[1].drafts[0]}
            else return {color: color_to.hex, draft: initDraftWithParams({warps: 1, wefts: 1, drawdown: [[createCell(false)]]})}

          } 
        });
      

    const pattern: Array<Array<Cell>> = [];
      for(let i = 0; i < res_h; i++){
        pattern.push([]);
        for(let j = 0; j < res_w; j++){

          const i_ratio = data.height / res_h;
          const j_ratio = data.width / res_w;

          const map_i = Math.floor(i * i_ratio);
          const map_j = Math.floor(j * j_ratio);

          const color_ndx = data.image_map[map_i][map_j]; //
          const color_draft = color_to_drafts[color_ndx].draft;

          if(color_draft === null) pattern[i].push( createCell(false));
          else {
            const draft_i = i % wefts(color_draft.drawdown);
            const draft_j = j % warps(color_draft.drawdown);
            pattern[i].push(createCell(getHeddle(color_draft.drawdown,draft_i,draft_j)));
          }

        }
      }

    const draft: Draft = initDraftFromDrawdown(pattern);
    return  Promise.resolve([draft]);

  }   

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {

  const file_param = getOpParamValById(0, param_vals);   
  if(file_param.id == '' || file_param.data == null){
      return 'bwimage';
  }else{
    return file_param.data.name;
  } 

}


const onParamChange = (param_vals: Array<OpParamVal>, inlets: Array<OperationInlet>, inlet_vals: Array<any>, changed_param_id: number, param_val: any) : Array<any> => {

    const new_inlets: Array<any> = ['#000000', '#ffffff']

    return new_inlets;


}
  

export const bwimagemap: DynamicOperation = {name, old_names, params, inlets, dynamic_param_id, dynamic_param_type, perform, generateName,onParamChange};