import { initDraftWithParams, createCell, Cell, wefts, warps, getHeddle, Draft, initDraftFromDrawdown } from "../../draft";
import { Img, AnalyzedImage } from "../../media";
import { getOpParamValById } from "../../utils";
import { FileParam, NumParam, OperationInlet, OpParamVal, OpInput, OpInletValType, DynamicOperation } from "../types";



const name = "bwimagemap";
const old_names: Array<string> = [];

const dynamic_param_id = [0];
const dynamic_param_type = 'color';

//PARAMS
//the value on this param needs to hold all the image data
const file: FileParam = {
  name: 'image file (.jpg or .png)',
  type: 'file',
  value: { id: '', data: null },
  dx: 'the file to upload',
}

const width: NumParam = {
  name: 'ends',
  type: 'number',
  min: 1,
  max: 10000,
  value: 30,
  dx: 'resize the input image to the width specified'
}

const height: NumParam = {
  name: 'pics',
  type: 'number',
  min: 1,
  max: 10000,
  value: 20,
  dx: 'resize the input image to the height specified'
}



const params = [file, width, height];

//INLETS

const inlets: Array<OperationInlet> = [];



const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const file_param: Img = <Img>getOpParamValById(0, op_params);
  const res_w: number = <number>getOpParamValById(1, op_params);
  const res_h: number = <number>getOpParamValById(2, op_params);

  if (file_param.id == '' || file_param.data == null) {
    const d = initDraftWithParams({ wefts: res_w, warps: res_h, drawdown: [[createCell(false)]] })
    return Promise.resolve([d]);
  }


  const data: AnalyzedImage = file_param.data;


  const color_to_drafts = data.colors.map((color) => {
    const child_of_color = op_inputs.find(input => (input.inlet_params.findIndex(param => param === color.hex) !== -1));

    if (child_of_color === undefined) {
      if (color.hex == '#000000') return { color: color.hex, draft: initDraftWithParams({ warps: 1, wefts: 1, drawdown: [[createCell(true)]] }) };
      else return { color: color.hex, draft: initDraftWithParams({ warps: 1, wefts: 1, drawdown: [[createCell(false)]] }) };;
    }
    else return { color: color.hex, draft: child_of_color.drafts[0] };
  });

  if (color_to_drafts === undefined) return Promise.resolve([]); //should never happen


  const pattern: Array<Array<Cell>> = [];
  for (let i = 0; i < res_h; i++) {
    pattern.push([]);
    for (let j = 0; j < res_w; j++) {

      const i_ratio = data.height / res_h;
      const j_ratio = data.width / res_w;

      const map_i = Math.floor(i * i_ratio);
      const map_j = Math.floor(j * j_ratio);

      const color_ndx = data.image_map[map_i][map_j];
      const mapped_color = data.colors_mapping.find(el => el.from == color_ndx) ?? { to: 0 }; //this is the mapped id
      const mapped_color_hex = data.colors[mapped_color.to].hex
      const found_color_draft = color_to_drafts.find(el => el.color == mapped_color_hex);
      const color_draft = found_color_draft ? found_color_draft.draft : null;




      if (color_draft === null) pattern[i].push(createCell(false));
      else {
        const draft_i = i % wefts(color_draft.drawdown);
        const draft_j = j % warps(color_draft.drawdown);
        pattern[i].push(createCell(getHeddle(color_draft.drawdown, draft_i, draft_j)));
      }

    }
  }

  const draft: Draft = initDraftFromDrawdown(pattern);
  return Promise.resolve([draft]);

}

const generateName = (param_vals: Array<OpParamVal>): string => {

  const file_param: Img = <Img>getOpParamValById(0, param_vals);
  if (file_param.id == '' || file_param.data == null) {
    return 'bwimage';
  } else {
    return file_param.data.name;
  }

}


const onParamChange = (): Array<OpInletValType> => {

  // //go through the image and adjust the mapping data so that it adds black and white and maps to those. 
  const new_inlets: Array<OpInletValType> = ['#000000', '#ffffff']
  // const img: AnalyzedImage = param_val.data;
  // console.log("IMG", img);

  // if(img == undefined) return new_inlets;



  // let has_black = false;
  // let has_white = false;

  // img.colors.forEach(color => {
  //   if(color.hex == '#000000') has_black = true;
  //   if(color.hex == '#ffffff') has_white = true;
  // })

  // if(!has_black) img.colors.push({r: 0, g: 0, b: 0, hex: '#000000'})
  // if(!has_white) img.colors.push({r: 255, g: 255, b: 255, hex: '#ffffff'})

  // const black_id = img.colors.findIndex(el => el.hex == '#000000');
  // const white_id = img.colors.findIndex(el => el.hex == '#ffffff');


  // img.colors_mapping.forEach(mapping => {
  //   const c = img.colors[mapping.from];
  //   if(c.black) mapping.to = black_id;
  //   else mapping.to = white_id;
  // })  

  return new_inlets;







}


export const bwimagemap: DynamicOperation = { name, old_names, params, inlets, dynamic_param_id, dynamic_param_type, perform, generateName, onParamChange };