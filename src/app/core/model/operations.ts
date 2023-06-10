import { Draft, OperationInlet, OpInput, OpParamVal } from "./datatypes";
import { generateMappingFromPattern, getDraftName, initDraftWithParams, warps, wefts } from "./drafts";
import { standardizeMaterialLists } from "./material";
import { makeWarpSystemsUnique, makeWeftSystemsUnique } from "./system";


export const operationHasInputs = (op_inputs : Array<OpInput>) : boolean => {
    return op_inputs.length > 0; 
}

export const getInputDraft = (op_inputs : Array<OpInput>) : Draft => {
    if(!operationHasInputs(op_inputs)) return null;
    else return op_inputs[0].drafts[0];
}

export const getAllDraftsAtInlet = (op_inputs : Array<OpInput>, inlet_id: number) : Array<Draft> => {
  if(!operationHasInputs(op_inputs) || inlet_id < 0) return [];
  else{

    let req_inputs = op_inputs.filter(el => el.inlet_id == inlet_id);
    let drafts:Array<Draft> = req_inputs.reduce((acc, el)=> {
      return acc.concat(el.drafts);
    }, []);

    return drafts;
  } 
}




const returnDefaultValue = ( p: OpParamVal) : any => {
    switch(p.param.type){
        case 'boolean': 
        return false;

        case 'draft':
            return null;

        case 'file':
            return null;
        
        case 'notation_toggle':
            return false;
        
        case 'number':
            return 0;
        
        case 'select':
            return null;
        
        case 'string':
            return '';
    }
}

export const reduceToStaticInputs = (inlets: Array<OperationInlet>, inlet_vals: Array<any>) : Array<any> => {

  let static_inputs = inlets.filter(el => el.type === 'static');
  inlet_vals = inlet_vals.slice(0,static_inputs.length);

  return inlet_vals;

}




export const getOpParamValById = (id: number, params: Array<OpParamVal>) : any => {
    
    if(params.length == 0) return null;

    if(id < params.length){
        return params[id].val;
    }else{
    console.error("PARAM ID ", id, " NOT FOUND IN PARAMS ", params)
     return returnDefaultValue(params[0]);
    }
}

export const getOpParamValByName = (name: string, params: Array<OpParamVal>) : any => {
    if(params.length == 0) return null;

    const item = params.find(el => el.param.name == 'name');
    if(item == undefined){
        console.error("CANNOT FIND OPERATION PARAMETER WITH NAME ", name);
        return returnDefaultValue(params[0])
    } 
    
    return item;

    
}


export const parseDraftNames = (drafts: Array<Draft>) : string  => {
    
    if(drafts.length == 0) return '';



    let flat_names = drafts.reduce((acc, el) => {
        return acc+"+"+getDraftName(el);
    }, '');

    return flat_names.substring(1);
    

}



  /**
   * transfers data about systems and shuttles from input drafts to output drafts. 
   * @param d the output draft
   * @param drafts the input drafts
   * @param type how to handle the transfer (first - use the first input data, interlace, layer)
   * @returns 
   */
  export const transferSystemsAndShuttles = (d: Draft, drafts:Array<Draft>,params: any, type: string) => {
    if(drafts.length === 0) return;

    let rowSystems: Array<Array<number>> =[];
    let colSystems: Array<Array<number>> =[];
    let uniqueSystemRows: Array<Array<number>> = [];
    let uniqueSystemCols: Array<Array<number>> = [];

    let rowShuttles: Array<Array<number>> =[];
    let colShuttles: Array<Array<number>> =[];
    let standardShuttleRows: Array<Array<number>> = [];
    let standardShuttleCols: Array<Array<number>> = [];


    switch(type){
      case 'first':

        //if there are multipleop_input.drafts, 
        d.colShuttleMapping =  generateMappingFromPattern(d.drawdown, drafts[0].colShuttleMapping,'col', 3);
        d.rowShuttleMapping =  generateMappingFromPattern(d.drawdown, drafts[0].rowShuttleMapping,'row', 3);
        d.colSystemMapping =  generateMappingFromPattern(d.drawdown, drafts[0].colSystemMapping,'col', 3);
        d.rowSystemMapping =  generateMappingFromPattern(d.drawdown, drafts[0].rowSystemMapping,'row', 3);
        
        break;
      case 'jointop':

          //if there are multipleop_input.drafts, 
  
          d.colShuttleMapping =  generateMappingFromPattern(d.drawdown, drafts[0].colShuttleMapping,'col', 3);
          d.colSystemMapping =  generateMappingFromPattern(d.drawdown, drafts[0].colSystemMapping,'col', 3);

          break;

      case 'joinleft':
          //if there are multipleop_input.drafts, 
          d.rowShuttleMapping =  generateMappingFromPattern(d.drawdown, drafts[0].rowShuttleMapping,'row', 3);
          d.rowSystemMapping =  generateMappingFromPattern(d.drawdown, drafts[0].rowSystemMapping,'row', 3);

            break;
      case 'second':
          const input_to_use = (drafts.length < 2) ?drafts[0] :drafts[1];
          d.colShuttleMapping =  generateMappingFromPattern(d.drawdown, input_to_use.colShuttleMapping,'col',3);
          d.rowShuttleMapping =  generateMappingFromPattern(d.drawdown, input_to_use.rowShuttleMapping,'row',3);
          d.colSystemMapping =  generateMappingFromPattern(d.drawdown, input_to_use.colSystemMapping,'col',3);
          d.rowSystemMapping =  generateMappingFromPattern(d.drawdown, input_to_use.rowSystemMapping,'row',3);
         

      case 'materialsonly':

        d.colShuttleMapping =  generateMappingFromPattern(d.drawdown, drafts[1].colShuttleMapping,'col',3);
        d.rowShuttleMapping =  generateMappingFromPattern(d.drawdown, drafts[1].rowShuttleMapping,'row',3);
        d.colSystemMapping =  generateMappingFromPattern(d.drawdown, drafts[0].colSystemMapping,'col',3);
        d.rowSystemMapping =  generateMappingFromPattern(d.drawdown, drafts[0].rowSystemMapping,'row',3);
       
        break;

    case 'interlace':
         rowSystems =drafts.map(el => el.rowSystemMapping);
         uniqueSystemRows = makeWeftSystemsUnique(rowSystems);
    
         rowShuttles =drafts.map(el => el.rowShuttleMapping);
         standardShuttleRows = standardizeMaterialLists(rowShuttles);

        d.drawdown.forEach((row, ndx) => {

          const select_array: number = ndx %drafts.length; 
          const select_row: number = Math.floor(ndx /drafts.length)%wefts(drafts[select_array].drawdown);
          d.rowSystemMapping[ndx] = uniqueSystemRows[select_array][select_row];
          d.rowShuttleMapping[ndx] = standardShuttleRows[select_array][select_row];

        });

  
     
      break;

      case 'interlace_warps':
        colSystems =drafts.map(el => el.colSystemMapping);
        uniqueSystemCols = makeWeftSystemsUnique(colSystems);
   
        colShuttles =drafts.map(el => el.colShuttleMapping);
        standardShuttleCols = standardizeMaterialLists(colShuttles);

       d.drawdown.forEach((row, ndx) => {
        

         const select_array: number = ndx %drafts.length; 
         const select_col: number = Math.floor(ndx /drafts.length)%warps(drafts[select_array].drawdown);
         d.colSystemMapping[ndx] = uniqueSystemCols[select_array][select_col];
         d.colShuttleMapping[ndx] = standardShuttleCols[select_array][select_col];

       });

 
    
     break;


        case 'layer':
           rowSystems=drafts.map(el => el.rowSystemMapping);
           colSystems =drafts.map(el => el.colSystemMapping);
           uniqueSystemRows = makeWeftSystemsUnique(rowSystems);
           uniqueSystemCols= makeWarpSystemsUnique(colSystems);
      
           rowShuttles =drafts.map(el => el.rowShuttleMapping);
           colShuttles =drafts.map(el => el.colShuttleMapping);
           standardShuttleRows = standardizeMaterialLists(rowShuttles);
           standardShuttleCols = standardizeMaterialLists(colShuttles);
  
          d.drawdown.forEach((row, ndx) => {
  
            const select_array: number = ndx %drafts.length; 
            const select_row: number = Math.floor(ndx /drafts.length)%wefts(drafts[select_array].drawdown);
          
            d.rowSystemMapping[ndx] = uniqueSystemRows[select_array][select_row];
            d.rowShuttleMapping[ndx] = standardShuttleRows[select_array][select_row];
  
          });
  
  
        for(let i = 0; i < wefts(d.drawdown); i++){
          const select_array: number = i %drafts.length; 
          const select_col: number = Math.floor(i /drafts.length)%warps(drafts[select_array].drawdown);
          d.colSystemMapping[i] = uniqueSystemCols[select_array][select_col];
          d.colShuttleMapping[i] = standardShuttleCols[select_array][select_col];

        }



  
          
       
        break;
  

      case 'stretch':
        d.colShuttleMapping =  generateMappingFromPattern(drafts[0].drawdown, drafts[0].colShuttleMapping,'col', 3);
        d.rowShuttleMapping =  generateMappingFromPattern(drafts[0].drawdown, drafts[0].rowShuttleMapping,'row', 3);
        d.colSystemMapping =  generateMappingFromPattern(drafts[0].drawdown, drafts[0].colSystemMapping,'col', 3);
        d.rowSystemMapping =  generateMappingFromPattern(drafts[0].drawdown, drafts[0].rowSystemMapping,'row', 3);
        
        //need to determine how to handle this - should it stretch the existing information or copy it over
      break;

      
                
    }




  }
