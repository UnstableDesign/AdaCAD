import { Injectable } from '@angular/core';
import { Cell } from '../../core/model/cell';
import { VaeService} from "../../core/provider/vae.service"
import { PatternfinderService} from "../../core/provider/patternfinder.service"
import utilInstance from '../../core/model/util';
import { SystemsService } from '../../core/provider/systems.service';
import { MaterialsService } from '../../core/provider/materials.service';
import * as _ from 'lodash';
import { ImageService } from '../../core/provider/image.service';
import { BoolParam, Draft, DraftParam, DynamicOperation, Loom, LoomSettings, NumParam, Operation, OperationClassification, OpInput, SelectParam, StringParam } from '../../core/model/datatypes';
import { applyMask, flipDraft, flipDrawdown, generateMappingFromPattern, getDraftName, initDraft, initDraftWithParams, invertDrawdown, pasteIntoDrawdown, shiftDrawdown, warps, wefts } from '../../core/model/drafts';
import { getLoomUtilByType, numFrames, numTreadles } from '../../core/model/looms';
import { WorkspaceService } from '../../core/provider/workspace.service';
import { CombinatoricsService } from '../../core/provider/combinatorics.service';


 

@Injectable({
  providedIn: 'root'
})
export class OperationService {

  ops: Array<Operation> = [];
  dynamic_ops: Array<DynamicOperation> = [];
  classification: Array<OperationClassification> = [];

  constructor(
    private vae: VaeService, 
    private pfs: PatternfinderService,
    private ms: MaterialsService,
    private ss: SystemsService,
    private is: ImageService,
    private ws: WorkspaceService,
    private combos: CombinatoricsService) { 

    const rect: Operation = {
      name: 'rectangle',
      displayname: 'rectangle',
      old_names:[],
      dx: "generates a rectangle of the user specified side, if given an input, fills the rectangle with the input",
      params: <Array<NumParam>>[
        {name: 'width',
        type: 'number',
        min: 1,
        max: 500,
        value: 10,
        dx: "width"
        },
        {name: 'height',
        type: 'number',
        min: 1,
        max: 500,
        value: 10,
        dx: "height"
        }
      ],
      inlets: [{
        name: 'input draft', 
        type: 'static',
        value: null,
        dx: 'the draft with which you would like to fill this rectangle',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'rectangle');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        const draft = (child_input !== undefined && child_input.drafts.length > 0) ? child_input.drafts[0] : initDraftWithParams({drawdown: [[new Cell(true)]]});

        const outputs: Array<Draft> = [];
        const d: Draft = initDraftWithParams(
          {warps: parent_input.params[0], 
            wefts: parent_input.params[1], 
            drawdown: draft.drawdown,
            rowShuttleMapping: draft.rowShuttleMapping,
            colShuttleMapping: draft.colShuttleMapping,
            rowSystemMapping: draft.rowSystemMapping,
            colSystemMapping: draft.colSystemMapping
            });

        d.gen_name = this.formatName(op_inputs[0].drafts, "rect");
        outputs.push(d);

        return Promise.resolve(outputs);
      }        
    }

    const clear: Operation = {
      name: 'clear',
      displayname: 'clear',
      old_names:[],
      dx: "this sets all heddles to lifted, allowing it to be masked by any pattern",
      params: [],
      inlets: [{
        name: 'input draft', 
        type: 'static',
        value: null,
        dx: 'the draft you would like to clear',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'clear');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        if(child_input === undefined) return Promise.resolve([]);
       

        const outputs: Array<Draft> =child_input.drafts.map(draft => {
          const d: Draft = initDraftWithParams({warps: warps(draft.drawdown), wefts:wefts(draft.drawdown), drawdown: [[new Cell(false)]]});
          
          if(child_input.drafts.length > 0){
            this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
            d.gen_name = this.formatName(child_input.drafts, "clear");
          }
          return  d;
        });
        return Promise.resolve(outputs);
      }        
    }

    const set: Operation = {
      name: 'set unset',
      displayname: 'set unset heddle to',
      old_names:['unset'],
      dx: "this sets all unset heddles in this draft to the specified value",
      params: <Array<BoolParam>>[ 
        {name: 'up/down',
        type: 'boolean',
        falsestate: 'unset to heddle up',
        truestate: 'unset to heddle down',
        value: 1,
        dx: "toggles the value to which to set the unset cells (heddle up or down)"
        }],
       inlets: [{
          name: 'input draft', 
          type: 'static',
          value: null,
          dx: 'the draft you would like to modify',
          num_drafts: 1
        }],
      perform: (op_inputs: Array<OpInput>)=> {
        const parent_input = op_inputs.find(el => el.op_name == 'set unset');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        if(child_input === undefined) return Promise.resolve([]);
       

        const outputs: Array<Draft> =child_input.drafts.map(draft => {
         
          const d: Draft = initDraftWithParams({warps: warps(draft.drawdown), wefts:wefts(draft.drawdown)});
          draft.drawdown.forEach((row, i) => {
            row.forEach((cell, j) => {
              if(!cell.isSet()){
                if(parent_input.params[0] === 0) d.drawdown[i][j] = new Cell(false);
                else d.drawdown[i][j] = new Cell(true);
              } 
              else d.drawdown[i][j] = new Cell(cell.isUp());
            });
          });
         
          if(child_input.drafts.length > 0){
            this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
            d.gen_name = this.formatName(child_input.drafts, "unset->down");
          }
          return d;
        });
        return Promise.resolve(outputs);
      }        
    }

    const unset: Operation = {
      name: 'set down to unset',
      displayname: 'set heddles of type to unset',
      old_names:['set'],
      dx: "this sets all  heddles of a particular type in this draft to unset",
      params: <Array<BoolParam>>[
        {name: 'up/down',
        type: 'boolean',
        falsestate: 'heddle up to unset',
        truestate: 'heddle down to unset',
        value: 1,
        dx: "toggles which values to map to unselected)"
      }],
      inlets: [{
        name: 'input draft', 
        type: 'static',
        value: null,
        dx: 'the draft you would like to modify',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'set down to unset');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        if(child_input === undefined) return Promise.resolve([]);
  
        const outputs: Array<Draft> =child_input.drafts.map(draft => {
          const d: Draft =initDraftWithParams({warps: warps(draft.drawdown), wefts:wefts(draft.drawdown)});
          draft.drawdown.forEach((row, i) => {
            row.forEach((cell, j) => {
              if(parent_input.params[0] === 1 && !cell.isUp() && cell.isSet()) d.drawdown[i][j] = new Cell(null);
              else if(parent_input.params[0] === 0 && cell.isUp() && cell.isSet()) d.drawdown[i][j] = new Cell(null);
              else d.drawdown[i][j] = new Cell(cell.getHeddle());
            });
          });
          if(child_input.drafts.length > 0){
            this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
            d.gen_name = this.formatName(child_input.drafts, "unset");

          }
          return d;
        });
        return Promise.resolve(outputs);
      }        
    }


    const apply_mats: Operation = {
      name: 'apply materials',
      displayname: 'apply materials',  
      old_names:[],    
      dx: "applies the materials from the second draft onto the first draft. If they are uneven sizes, it will repeat the materials as a pattern",
      params: [],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to which you would like to apply materials',
        num_drafts: 1
      },
      {
        name: 'materials', 
        type: 'static',
        value: null,
        dx: 'a draft which has the materials youd like to apply',
        num_drafts: 1
      }
    ],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'apply materials');
        const child_input = op_inputs.find(el => el.op_name == 'child');
        const materials = op_inputs.find(el => el.inlet == 1);
        const inputdraft = op_inputs.find(el => el.inlet == 0);

        if(child_input === undefined) return Promise.resolve([]);
        if(materials === undefined) return Promise.resolve([inputdraft.drafts[0]])
        if(inputdraft === undefined) return Promise.resolve([materials.drafts[0]])

        const d: Draft =initDraftWithParams(
          {warps:warps(inputdraft.drafts[0].drawdown), 
          wefts:wefts(inputdraft.drafts[0].drawdown),
          rowShuttleMapping: materials.drafts[0].rowShuttleMapping,
          rowSystemMapping: inputdraft.drafts[0].rowSystemMapping,
          colShuttleMapping: materials.drafts[0].colShuttleMapping,
          colSystemMapping: inputdraft.drafts[0].colSystemMapping,
        });
        inputdraft.drafts[0].drawdown.forEach((row, i) => {
          row.forEach((cell, j) => {
            d.drawdown[i][j] = new Cell(cell.getHeddle());
          });
        });

        d.gen_name = this.formatName(inputdraft.drafts, 'materials')
        return Promise.resolve([d]);
      }        
    }

  

    const rotate: Operation = {
      name: 'rotate',
      displayname: 'rotate', 
      old_names:[],     
      dx: "this turns the draft by the amount specified",
      params: [
        <SelectParam>{name: 'amount',
        type: 'select',
        selectlist: [
          {name: '90', value: 0},
          {name: '180', value: 1},
          {name: '270', value: 2},
        ],
          value: 0,
          dx: 'corner to which this draft is rotated around 0 is top left, 1 top right, 2 bottom right, 3 bottom left'
        },
        <BoolParam>{
          name: 'materials?',
          type: 'boolean',
          falsestate: 'no, don\'t rotate materials',
          truestate: 'yes, rotate materials',
          value: 1, 
          dx: 'if your draft has materials assigned, you can choose wether you want to rotate the draft or the materials only'

        }
        ],
      inlets: [
        {
        name: 'input draft', 
        type: 'static',
        value: null,
        dx: 'the draft you would like to modify',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'rotate');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        if(child_input === undefined) return Promise.resolve([]);

        const outputs: Array<Draft> =child_input.drafts.map(draft => {

          const num_rots = parent_input.params[0];
          const rotate_mats = (parent_input.params[1] === 0) ? false : true;
          const rotated_wefts = ( num_rots % 2 == 0) ? warps(draft.drawdown) : wefts(draft.drawdown);
          const rotated_warps = ( num_rots % 2 == 0) ? wefts(draft.drawdown) : warps(draft.drawdown);

          const d: Draft =initDraftWithParams({warps: rotated_warps, wefts:rotated_wefts});


          for(var i = 0; i < wefts(draft.drawdown); i++){
            for(var j = 0; j < warps(draft.drawdown); j++){
              const heddle_val = draft.drawdown[i][j].getHeddle();
              switch(num_rots){
                case 0: 
                  d.drawdown[(warps(draft.drawdown) - 1) - j][i].setHeddle(heddle_val);
                 
                break;
                case 1: 
                  d.drawdown[(wefts(draft.drawdown) - 1) - i][(warps(draft.drawdown) - 1) - j].setHeddle(heddle_val);
                  
                break;
                case 2: 
                  d.drawdown[j][(wefts(draft.drawdown) - 1)  - i].setHeddle(heddle_val);
                  
                break;

              }
            }
          }

          if(rotate_mats){
          for(var i = 0; i < wefts(draft.drawdown); i++){
              switch(num_rots){
                case 0: 
                    d.colShuttleMapping[i] = draft.rowShuttleMapping[i];
                    d.colSystemMapping[i] = draft.rowSystemMapping[i];
                  
                break;
                case 1: 
                  d.rowShuttleMapping[(wefts(draft.drawdown) - 1) - i] = draft.rowShuttleMapping[i];
                  d.rowSystemMapping[(wefts(draft.drawdown) - 1) - i] = draft.rowSystemMapping[i];

                  
                  
                break;
                case 2: 

                  d.colShuttleMapping[wefts(draft.drawdown)-1-i] = draft.rowShuttleMapping[i];
                  d.colSystemMapping[wefts(draft.drawdown)-1-i] = draft.rowSystemMapping[i];
                  
                break;

              }

              for(var j = 0; j < warps(draft.drawdown); j++){
                switch(num_rots){
                  case 0: 
                    d.rowShuttleMapping[j] =  draft.colShuttleMapping[j];
                    d.rowSystemMapping[j] = draft.colSystemMapping[j];
                  break;
                  case 1: 
                    
                    d.colShuttleMapping[(warps(draft.drawdown) - 1) - j] =  draft.colShuttleMapping[j];
                    d.colSystemMapping[(warps(draft.drawdown) - 1) - j] = draft.colSystemMapping[j];

                  break;
                  case 2: 

                    d.rowShuttleMapping[(warps(draft.drawdown) - 1)  - j] =  draft.colShuttleMapping[j];
                    d.rowSystemMapping[(warps(draft.drawdown) - 1)  - j] = draft.colSystemMapping[j];
             
                  break;
  
                }
              }
              

            }
          }else{
           for(var i = 0; i < wefts(d.drawdown); i++){
             d.rowShuttleMapping[i] = draft.rowShuttleMapping[i];
             d.rowSystemMapping[i] = draft.rowSystemMapping[i];
           }
           for(var j = 0; j < warps(d.drawdown); j++){
            d.colShuttleMapping[j] = draft.colShuttleMapping[j];
            d.colSystemMapping[j] = draft.colSystemMapping[j];
          }
          }

          if(child_input.drafts.length > 0){
            d.gen_name = this.formatName(child_input.drafts, "rot");
          }

          return d;
        });
        return Promise.resolve(outputs);
      }        
    }

    const interlace:Operation = {
      name: 'interlace',
      displayname: 'interlace',  
      old_names:[],
      dx: 'interlace the input drafts together in alternating lines',
      params: <Array<BoolParam>>[
        {name: 'repeat',
        type: 'boolean',
        falsestate: 'do not repeat inputs to match size',
        truestate: 'repeat inputs to match size',
        value: 1,
        dx: "controls if the inputs are intelaced in the exact format sumitted or repeated to fill evenly"
      }],
      inlets: [
        {
          name: 'drafts', 
          type: 'static',
          value: null,
          dx: 'all the drafts you would like to interlace',
          num_drafts: -1
        },
        {
          name: 'warp system map', 
          type: 'static',
          value: null,
          dx: 'if you would like to specify the warp system or materials, you can do so by adding a draft here',
          num_drafts: 1
        }
      ],
      perform: (op_inputs: Array<OpInput>) => {
       

        const parent_input = op_inputs.find(el => el.op_name == 'interlace');
        const child_inputs = op_inputs.filter(el => el.inlet == 0);
        let warp_systems = op_inputs.find(el => el.inlet == 1);


        if(child_inputs === undefined) return Promise.resolve([]);

        const all_drafts = child_inputs.map(el => el.drafts[0]);
        let warp_system_draft = null;
        if(warp_systems === undefined)  warp_system_draft =initDraftWithParams({warps: 1, wefts: 1});
        else  warp_system_draft = warp_systems.drafts[0];

        const factor_in_repeats = parent_input.params[0];
        const outputs: Array<Draft> = [];

        const d: Draft = utilInstance.interlace(all_drafts, factor_in_repeats, warp_system_draft);
     
    
        this.transferSystemsAndShuttles(d,all_drafts,parent_input.params, 'interlace');
        d.gen_name = this.formatName(all_drafts, "ilace")

        outputs.push(d);
        return Promise.resolve(outputs);
      }     
    }

    const splicein:Operation = {
      name: 'splice in wefts',
      displayname: 'splice in wefts',  
      old_names:[],
      dx: 'splices the second draft into the first every nth row',
      params: <Array<NumParam>>[  
        {name: 'pics between insertions',
        type: 'number',
        min: 1,
        max: 100,
        value: 1,
        dx: "the number of pics to keep between each splice row"
        },
        {name: 'repeat',
        type: 'boolean',
        falsestate: 'do not repeat inputs to match size',
        truestate: 'repeat inputs to match size',
        value: 1,
        dx: "controls if the inputs are repeated to make drafts of the same size or not"
      },
      {name: 'splice style',
      type: 'boolean',
      falsestate: 'line by line',
      truestate: 'whole draft',
      value: 0,
      dx: "controls if the whole draft is spliced in every nth weft or just the next pic in the draft"
    }],
        inlets: [{
          name: 'receiving draft', 
          type: 'static',
          value: null,
          dx: 'all the drafts you would like to interlace',
          num_drafts: 1
        },
        {
          name: 'splicing draft', 
          type: 'static',
          value: null,
          dx: 'the draft you would like to splice into the recieving draft',
          num_drafts: 1
        }
      ],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'splice in wefts');
        const child_input = op_inputs.find(el => el.op_name == 'child');
        const static_inlet = op_inputs.find(el => el.inlet == 0);
        const splicing_inlet = op_inputs.find(el => el.inlet == 1);


        
        if(child_input === undefined) return Promise.resolve([]);
        if(static_inlet === undefined) return Promise.resolve([splicing_inlet.drafts[0]]);
        if(splicing_inlet === undefined) return Promise.resolve([static_inlet.drafts[0]]);
        const outputs: Array<Draft> = [];

        const static_input = static_inlet.drafts[0];
        const splicing_input = splicing_inlet.drafts[0];
        const factor_in_repeats = parent_input.params[1];
        const whole_draft = parent_input.params[2];

        const all_drafts = [static_input, splicing_input];

        let total_wefts: number = 0;
        if(factor_in_repeats === 1){
          let factors = [];
          if(whole_draft){
            factors = [wefts(static_input.drawdown), wefts(splicing_input.drawdown)*(parent_input.params[0]+wefts(splicing_input.drawdown))];
          }else{
            factors = [wefts(static_input.drawdown), wefts(splicing_input.drawdown)*(parent_input.params[0]+1)];
          }
          total_wefts = utilInstance.lcm(factors);
        }  
        else  {
          //sums the wefts from all the drafts
          total_wefts =all_drafts.reduce((acc, el) => {
            return acc + wefts(el.drawdown);
          }, 0);
  
        }
      
        let total_warps: number = 0;
        const all_warps = all_drafts.map(el => warps(el.drawdown)).filter(el => el > 0);
      
        if(factor_in_repeats === 1)  total_warps = utilInstance.lcm(all_warps);
        else  total_warps = utilInstance.getMaxWarps(all_drafts);
      

        const uniqueSystemRows = this.ss.makeWeftSystemsUnique(all_drafts.map(el => el.rowSystemMapping));



        let array_a_ndx = 0;
        let array_b_ndx = 0;
      
        //create a draft to hold the merged values
        const d:Draft =initDraftWithParams({warps: total_warps, wefts:total_wefts, colShuttleMapping:static_input.colShuttleMapping, colSystemMapping:static_input.colSystemMapping});

        for(let i = 0; i < wefts(d.drawdown); i++){
          let select_array:number = 0;

          if(whole_draft){
            const cycle = parent_input.params[0] + wefts(splicing_input.drawdown);
            select_array = (i % (cycle) >= parent_input.params[0]) ? 1 : 0; 
          }else{
            select_array = (i % (parent_input.params[0]+1) ===parent_input.params[0]) ? 1 : 0; 
          } 


          if(!factor_in_repeats){
            if(array_b_ndx >=wefts(splicing_input.drawdown)) select_array = 0;
            if(array_a_ndx >=warps(static_input.drawdown)) select_array = 1;
          }
          
          let cur_weft_num = wefts(all_drafts[select_array].drawdown);
          let ndx = (select_array === 0) ? array_a_ndx%cur_weft_num : array_b_ndx%cur_weft_num;

          d.drawdown[i].forEach((cell, j) => {
            let cur_warp_num = warps(all_drafts[select_array].drawdown);
            cell.setHeddle(all_drafts[select_array].drawdown[ndx][j%cur_warp_num].getHeddle());
            if(j >= cur_warp_num && !factor_in_repeats) cell.setHeddle(null);
          });

          d.rowSystemMapping[i] = uniqueSystemRows[select_array][ndx];
          d.rowShuttleMapping[i] =all_drafts[select_array].rowShuttleMapping[ndx];


          if(select_array === 0){
            array_a_ndx++;
          } 
          else{
            array_b_ndx++;
          } 

        }
        // this.transferSystemsAndShuttles(d,op_input.drafts,op_input.params, 'interlace');
        d.gen_name = this.formatName(all_drafts, "splice")
        outputs.push(d);
        return Promise.resolve(outputs);
      }     
    }

    const spliceinwarps:Operation = {
      name: 'splice in warps',
      displayname: 'splice in warps',  
      old_names:[],
      dx: 'splices the second draft into the first every nth warp',
      params: <Array<NumParam>>[  
        {name: 'pics between insertions',
        type: 'number',
        min: 1,
        max: 100,
        value: 1,
        dx: "the number of ends to keep between each splice "
        },
        {name: 'repeat',
        type: 'boolean',
        falsestate: 'do not repeat inputs to match size',
        truestate: 'repeat inputs to match size',
        value: 1,
        dx: "controls if the inputs are repeated to make drafts of the same size or not"
      },
      {name: 'splice style',
      type: 'boolean',
      falsestate: 'line by line',
      truestate: 'whole draft',
      value: 0,
      dx: "controls if the whole draft is spliced in every nth warp or just the next end in the draft"
    }],
        inlets: [{
          name: 'receiving draft', 
          type: 'static',
          value: null,
          dx: 'all the drafts you would like to interlace',
          num_drafts: 1
        },
        {
          name: 'splicing draft', 
          type: 'static',
          value: null,
          dx: 'the draft you would like to splice into the recieving draft',
          num_drafts: 1
        }
      ],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'splice in warps');
        const child_input = op_inputs.find(el => el.op_name == 'child');
        const static_inlet = op_inputs.find(el => el.inlet == 0);
        const splicing_inlet = op_inputs.find(el => el.inlet == 1);
        
        if(child_input === undefined) return Promise.resolve([]);
        if(static_inlet === undefined) return Promise.resolve([splicing_inlet.drafts[0]]);
        if(splicing_inlet === undefined) return Promise.resolve([static_inlet.drafts[0]]);
        const outputs: Array<Draft> = [];

        const static_input = static_inlet.drafts[0];
        const splicing_input = splicing_inlet.drafts[0];
        const factor_in_repeats = parent_input.params[1];
        const whole_draft = parent_input.params[2];

        const all_drafts = [static_input, splicing_input];

        let total_warps: number = 0;
        let factors: Array<number> = [];
        if(factor_in_repeats === 1){
          if(whole_draft){
            factors = [warps(static_input.drawdown), (warps(splicing_input.drawdown)*(parent_input.params[0]+warps(splicing_input.drawdown)))];
          }else{
            factors = [warps(static_input.drawdown), warps(splicing_input.drawdown)*(parent_input.params[0]+1)];
          }
          total_warps = utilInstance.lcm(factors);
        }  
        else  {
          //sums the warps from all the drafts
          total_warps =all_drafts.reduce((acc, el) => {
            return acc + warps(el.drawdown);
          }, 0);
        }
      
        let total_wefts: number = 0;
        const all_wefts = all_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
      
        if(factor_in_repeats === 1)  total_wefts = utilInstance.lcm(all_wefts);
        else  total_wefts = utilInstance.getMaxWefts(all_drafts);
      

        const uniqueSystemCols = this.ss.makeWarpSystemsUnique(all_drafts.map(el => el.colSystemMapping));

        let array_a_ndx = 0;
        let array_b_ndx = 0;
      
        //create a draft to hold the merged values
        const d:Draft = initDraftWithParams({warps: total_warps, wefts:total_wefts, rowShuttleMapping:static_input.rowShuttleMapping, rowSystemMapping:static_input.rowSystemMapping});

        for(let j = 0; j < warps(d.drawdown); j++){
          let select_array: number;
          if(whole_draft){
            const cycle = parent_input.params[0] + warps(splicing_input.drawdown);
            select_array = (j % (cycle) >= parent_input.params[0]) ? 1 : 0; 
          }else{
            select_array = (j % (parent_input.params[0]+1) ===parent_input.params[0]) ? 1 : 0; 
          } 


          if(!factor_in_repeats){
            if(array_b_ndx >=warps(splicing_input.drawdown)) select_array = 0;
            if(array_a_ndx >=warps(static_input.drawdown)) select_array = 1;
          }
          
          let cur_warp_num = warps(all_drafts[select_array].drawdown)
          let ndx = (select_array === 0) ? array_a_ndx%cur_warp_num : array_b_ndx%cur_warp_num;

          const col:Array<Cell> = d.drawdown.reduce((acc, el) => {
            acc.push(el[j]);
            return acc;
          }, [])


          col.forEach((cell, i) => {
            let cur_weft_num = wefts(all_drafts[select_array].drawdown);
            cell.setHeddle(all_drafts[select_array].drawdown[i%cur_weft_num][ndx].getHeddle());
            if(i >= cur_weft_num && !factor_in_repeats) cell.setHeddle(null);
          });

          d.colSystemMapping[j] = uniqueSystemCols[select_array][ndx];
          d.colShuttleMapping[j] =all_drafts[select_array].colShuttleMapping[ndx];


          if(select_array === 0){
            array_a_ndx++;
          } 
          else{
            array_b_ndx++;
          } 

        }
        // this.transferSystemsAndShuttles(d,op_input.drafts,op_input.params, 'interlace');
        d.gen_name = this.formatName(all_drafts, "splice")
        outputs.push(d);
        return Promise.resolve(outputs);
      }     
    }


    const assignwefts:Operation = {
      name: 'assign weft systems',
      displayname: 'assign weft systems', 
      old_names:[], 
      dx: 'splits each pic of the draft apart, allowing it to repeat at a specified interval and shift within that interval. Currently this will overwrite any system information that has been defined upstream',
      params: <Array<NumParam>>[  
        {name: 'total',
        type: 'number',
        min: 1,
        max: 26,
        value: 2,
        dx: "how many systems total"
        },
        {name: 'shift',
        type: 'number',
        min: 0,
        max: 26,
        value: 0,
        dx: "which posiiton to assign this draft"
        }],
      inlets: [
        {
          name: 'draft',
          type: 'static',
          value: null,
          dx: "the draft that will be assigned to a given system",
          num_drafts: 1
        }
      ],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'assign weft systems');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        if(child_input === undefined) return Promise.resolve([]);
        const outputs = [];
        const systems = [];

        //create a list of the systems
        for(let n = 0;  n <parent_input.params[0]; n++){
          const sys = ss.getWeftSystem(n);
          if(sys === undefined) ss.addWeftSystemFromId(n);
          systems[n] = n;
        }

        // const system_maps = [inputs[0]];
        // for(let i = 1; i <op_input.params[0]; i++){
        //   system_maps.push(new Draft({wefts:op_input.drafts[0].wefts, warps:op_input.drafts[0].warps}));
        // }

        // const uniqueSystemRows = this.ss.makeWeftSystemsUnique(system_maps.map(el => el.rowSystemMapping));

        const d:Draft =initDraftWithParams({
          warps:warps(child_input.drafts[0].drawdown), 
          wefts:wefts(child_input.drafts[0].drawdown)*parent_input.params[0], 
          colShuttleMapping:child_input.drafts[0].colShuttleMapping, 
          colSystemMapping:child_input.drafts[0].colSystemMapping,
          rowSystemMapping: systems});


        d.drawdown.forEach((row, i) => {
          const use_row = i %parent_input.params[0] ===parent_input.params[1];
          const use_index = Math.floor(i /parent_input.params[0]);
          //this isn't working
          //d.rowSystemMapping[i] = uniqueSystemRows[i %op_input.params[0]][use_index];
          row.forEach((cell, j)=> {
            if(use_row){
              d.rowShuttleMapping[i] =child_input.drafts[0].rowShuttleMapping[use_index];
              cell.setHeddle(child_input.drafts[0].drawdown[use_index][j].getHeddle());
            }else{
              cell.setHeddle(null);
            }
          })
        });
        
        // this.transferSystemsAndShuttles(d,op_input.drafts,op_input.params, 'interlace');
        d.gen_name = this.formatName(child_input.drafts, "assign wefts")
        const sys_char = String.fromCharCode(97 +parent_input.params[1]);
        d.gen_name = '-'+sys_char+':'+d.gen_name;
        outputs.push(d);
        return Promise.resolve(outputs);
      }     
    }

    const assignwarps:Operation = {
      name: 'assign warp systems',
      displayname: 'assign warp systems', 
      old_names:[], 
      dx: 'splits each warp of the draft apart, allowing it to repeat at a specified interval and shift within that interval. An additional button is used to specify if these systems correspond to layers, and fills in draft accordingly',
      params: <Array<NumParam>>[  
        {name: 'total',
        type: 'number',
        min: 1,
        max: 26,
        value: 2,
        dx: "how many warp systems (or layers) total"
        },
        {name: 'shift',
        type: 'number',
        min: 0,
        max: 26,
        value: 0,
        dx: "which system/layer to assign this draft"
        },
        {name: 'map warp systems to layers?',
        type: 'boolean',
        min: 0,
        max: 1,
        value: 0,
        dx: "fill in the draft such that each warp system corresponds to a layer (0 is top)"
        }
      ],
      inlets: [
        {
          name: 'draft',
          type: 'static',
          value: null,
          dx: "the draft that will be assigned to a given system",
          num_drafts: 1
        }
      ],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'assign warp systems');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        if(child_input === undefined) return Promise.resolve([]);

        const outputs = [];
        const systems = [];

        //create a list of the systems
        for(let n = 0;  n < parent_input.params[0]; n++){
          const sys = ss.getWarpSystem(n);
          if(sys === undefined) ss.addWarpSystemFromId(n);
          systems[n] = n;
        }
        
        const d:Draft =initDraftWithParams({
          warps:warps(child_input.drafts[0].drawdown)*parent_input.params[0], 
          wefts:wefts(child_input.drafts[0].drawdown), 
          rowShuttleMapping:child_input.drafts[0].rowShuttleMapping, 
          rowSystemMapping:child_input.drafts[0].rowSystemMapping,
          colSystemMapping: systems});


        d.drawdown.forEach((row, i) => {
          const row_is_null = utilInstance.hasOnlyUnset(child_input.drafts[0].drawdown[i]);
          row.forEach((cell, j)=> {
            const sys_id = j %parent_input.params[0];
            const use_col = sys_id ===parent_input.params[1];
            const use_index = Math.floor(j /parent_input.params[0]);
            //d.colSystemMapping[j] = uniqueSystemCols[sys_id][use_index];
            if(use_col){
              d.colShuttleMapping[j] =child_input.drafts[0].colShuttleMapping[use_index];
              cell.setHeddle(child_input.drafts[0].drawdown[i][use_index].getHeddle());
            }else{
              if(parent_input.params[2] == 1 && !row_is_null){
                if(sys_id <parent_input.params[1]){
                  cell.setHeddle(true);
                }else if(sys_id >=parent_input.params[1]){
                  cell.setHeddle(false);
                }
              }else{
                cell.setHeddle(null);
              }
            }
          })
        });
        

        
        // this.transferSystemsAndShuttles(d,op_input.drafts,op_input.params, 'interlace');
        d.gen_name = this.formatName(child_input.drafts, "assign warps")
        const sys_char = String.fromCharCode(97 +parent_input.params[1]);
        d.gen_name = '|'+sys_char+':'+d.gen_name;

        outputs.push(d);
        return Promise.resolve(outputs);
      }     
    }

    


    const vertcut:Operation = {
      name: 'vertical cut',
      displayname: 'vertical cut',  
      dx: 'make a vertical of this structure across two systems, representing the left and right side of an opening in the warp',
      old_names:[],
      params: <Array<NumParam>>[  
        {name: 'systems',
        type: 'number',
        min: 2,
        max: 100,
        value: 2,
        dx: "how many different systems you want to move this structure onto"
        }],
        inlets: [
          {
            name: 'draft',
            type: 'static',
            value: null,
            dx: "the draft that will be assigned to a given system",
            num_drafts: 1
          }
        ],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'vertical cut');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        if(child_input === undefined) return Promise.resolve([]);


        const outputs: Array<Draft> = [];
        const outwefts =parent_input.params[0]*wefts(child_input.drafts[0].drawdown);

        const rep_inputs = [];

        for(let i = 0; i <parent_input.params[0]; i++){
          rep_inputs.push(_.cloneDeep(child_input.drafts[0]));
        }

        const uniqueSystemRows = this.ss.makeWeftSystemsUnique(rep_inputs.map(el => el.rowSystemMapping));

        for(let i = 0; i <parent_input.params[0]; i++){

          const d: Draft =initDraftWithParams({wefts: outwefts, warps:warps(child_input.drafts[0].drawdown), colShuttleMapping:child_input.drafts[0].colShuttleMapping, colSystemMapping:child_input.drafts[0].colSystemMapping});
          d.drawdown.forEach((row, row_ndx) => {
            row.forEach((cell, j) => {

              const use_row: boolean = row_ndx%parent_input.params[0] === i;
              const input_ndx: number = Math.floor(row_ndx /parent_input.params[0]);
              d.rowShuttleMapping[row_ndx] =child_input.drafts[0].rowShuttleMapping[input_ndx];


              if(use_row){
                cell.setHeddle(child_input.drafts[0].drawdown[input_ndx][j].getHeddle());
                d.rowSystemMapping[row_ndx] = uniqueSystemRows[i][input_ndx]
              } 
              else{
                cell.setHeddle(null);
                d.rowSystemMapping[row_ndx] = uniqueSystemRows[row_ndx%parent_input.params[0]][input_ndx]
              }
            });
          });

          d.gen_name = this.formatName(child_input.drafts, "cut+"+i)
          outputs.push(d);
        }
        return Promise.resolve(outputs);
      }     
    }

    

    const selvedge: Operation = {
      name: 'selvedge',
      old_names:[],
      displayname: 'selvedge',  
      dx: 'adds a selvedge of a user defined width (in ends) on both sides of the input draft. The second input functions as the selvedge pattern, and if none is selected, a selvedge is generated',
      params: <Array<NumParam>>[
        {name: 'width',
        type: 'number',
        min: 1,
        max: 100,
        value: 12,
        dx: "the width in warps of the selvedge"
        }
      ],
      inlets: [
        {
          name: 'draft',
          type: 'static',
          value: null,
          dx: "the draft that will have a selvedge added",
          num_drafts: 1
        },
        {
          name: 'selvedge',
          type: 'static',
          value: null,
          dx: "the pattern to use for the selvedge",
          num_drafts: 1
        }
      ],
      perform: (op_inputs: Array<OpInput>)=> {

        const parent_input = op_inputs.find(el => el.op_name == 'selvedge');
        const child_input = op_inputs.filter(el => el.op_name == 'child');
        const draft_inlet = op_inputs.find(el => el.inlet == 0);
        const selvedge_inlet = op_inputs.find(el => el.inlet == 1);

        if(child_input.length === 0) return Promise.resolve([]);
        if(draft_inlet === undefined) return Promise.resolve([selvedge_inlet.drafts[0]]);
        if(selvedge_inlet === undefined) return Promise.resolve([draft_inlet.drafts[0]]);

        const all_drafts = [draft_inlet.drafts[0], selvedge_inlet.drafts[0]];
       
        const num_systems = utilInstance.filterToUniqueValues(all_drafts[0].rowSystemMapping).length;
        const height = 2*num_systems;


        let pattern:Array<Array<Cell>> = [];
        
        if(selvedge_inlet !== undefined){
          pattern = all_drafts[1].drawdown;
        }else{
          for(let i = 0; i < height; i++){
            pattern.push([]);
            let alt: boolean =  i <num_systems;
            for(let j = 0; j < 2; j++){
              pattern[i][j] = ((alt && j%2 ==0) || (!alt && j%2 ==1)) ? new Cell(true) : new Cell(false);
            }
          }
        }
        
        
 
        const input: Draft = all_drafts[0];
        const d: Draft =initDraftWithParams({warps: warps(input.drawdown) +parent_input.params[0]*2, wefts: wefts(input.drawdown)});
            
            
        for(let i = 0; i < wefts(d.drawdown); i++){
          for(let j = 0; j < warps(d.drawdown); j++){
            if(j < parent_input.params[0]){
              //left selvedge
              d.drawdown[i][j].setHeddle(pattern[(i+1)%pattern.length][j%pattern[0].length].getHeddle());

            }else if(j < parent_input.params[0]+warps(input.drawdown)){
              //pattern
              d.drawdown[i][j].setHeddle(input.drawdown[i][j - parent_input.params[0]].getHeddle());

            }else{
              //right selvedge
              d.drawdown[i][j].setHeddle(pattern[i%pattern.length][j%pattern[0].length].getHeddle());

            }
          }
        }

        if(all_drafts.length > 0){
          this.transferSystemsAndShuttles(d,all_drafts,parent_input.params, 'first');
          d.gen_name = this.formatName(all_drafts, "sel")

        }

        
        return Promise.resolve([d]);
      }        
    }

    const number_to_draft: Operation = {
      name: 'number_to_draft',
      old_names:[],
      displayname: 'draft by number',  
      dx: 'sets the draft values based on a number, turned into binary, and then filled into the structure',
      params: <Array<NumParam>>[
        {name: 'decode',
        type: 'number',
        min: 1,
        max: 100000,
        value: 1,
        dx: "number you'd like to decode into a draft"
        },
        {name: 'width',
        type: 'number',
        min: 1,
        max: 20,
        value: 5,
        dx: "the width of your structure"
        },
        {name: 'height',
        type: 'number',
        min: 1,
        max: 20,
        value: 5,
        dx: "the height of your structure"
        }
      ],
      inlets: [
      ],
      perform: (op_inputs: Array<OpInput>)=> {

        const parent_input = op_inputs.find(el => el.op_name == 'number_to_draft');
        const decode = parent_input.params[0];
        const width = parent_input.params[1];
        const height = parent_input.params[2];

        const bit_size = width * height;
        let decode_string = decode.toString(2);

        while(decode_string.length < bit_size){
          decode_string = '0'+decode_string;
        }

        let pattern:Array<Array<Cell>> = [];
        for(let i = 0; i < height; i++){
          pattern.push([]);
          for(let j = 0; j < width; j++){
            const ndx = i * width + j;
            if(ndx < decode_string.length){
              const cell_val:boolean = (decode_string.charAt(ndx) == '1');
              pattern[i].push(new Cell(cell_val));
            }else{
              pattern[i].push(new Cell(false));
            }
          }
        }
       

        const d =initDraftWithParams({wefts: height, warps: width, drawdown: pattern});
        
       
  
        
        
 

        
        return Promise.resolve([d]);
      }        
    }

    const overlay: Operation = {
      name: 'overlay, (a,b) => (a OR b)',
      displayname: 'overlay, (a,b) => (a OR b)', 
      old_names:['overlay'], 
      dx: 'keeps any region that is marked as black/true in either draft',
      params: <Array<NumParam>>[
        {name: 'left offset',
        type: 'number',
        min: 0,
        max: 10000,
        value: 0,
        dx: "the amount to offset b from the left"
        },
        {name: 'bottom offset',
        type: 'number',
        min: 0,
        max: 10000,
        value: 0,
        dx: "the amount to offset b from the bottom"
        }
      ],
      inlets: [{
        name: 'a', 
        type: 'static',
        value: null,
        dx: 'all the drafts you would like to overlay another onto',
        num_drafts: 1
      },
      {
        name: 'b', 
        type: 'static',
        value: null,
        dx: 'the draft you would like to overlay onto the base',
        num_drafts: 1
      }
    ],
      perform: (op_inputs: Array<OpInput>)=> {

        const parent_input = op_inputs.find(el => el.op_name == 'overlay, (a,b) => (a OR b)');
        const child_inputs = op_inputs.filter(el => el.op_name == 'child');
        const base = op_inputs.find(el => el.inlet == 0);
        const top = op_inputs.find(el => el.inlet == 1);

        if(child_inputs.length == 0) return Promise.resolve([]);
        if(base === undefined) return Promise.resolve([top.drafts[0]]);
        if(top === undefined) return Promise.resolve([base.drafts[0]]);

        const alldrafts = [base.drafts[0], top.drafts[0]];
        const inputs_divided =alldrafts.slice();
        const first: Draft =inputs_divided.shift();

        const outputs: Array<Draft> = [];


        let width: number = utilInstance.getMaxWarps(alldrafts) +parent_input.params[0];
        let height: number = utilInstance.getMaxWefts(alldrafts) +parent_input.params[1];
        if(warps(first.drawdown) > width) width = warps(first.drawdown);
        if(wefts(first.drawdown) > height) height = wefts(first.drawdown);

    

        //initialize the base container with the first draft at 0,0, unset for anythign wider
        const init_draft: Draft =initDraftWithParams({
          wefts: height, 
          warps: width, 
          colSystemMapping: first.colSystemMapping, 
          colShuttleMapping: first.colShuttleMapping,
          rowSystemMapping: first.rowSystemMapping,
          rowShuttleMapping: first.rowShuttleMapping});
          
        first.drawdown.forEach((row, i) => {
          row.forEach((cell, j) => {
            init_draft.drawdown[i][j].setHeddle(cell.getHeddle());
          });
        });

        //now merge in all of the additionalop_input.drafts offset by theop_input.drafts
        const d: Draft =inputs_divided.reduce((acc, input) => {
          input.drawdown.forEach((row, i) => {
            const adj_i: number = i+parent_input.params[1];

            //if theinitDraftWithParams has only nulls on this row, set the value to the input value
            if(utilInstance.hasOnlyUnset(acc.drawdown[adj_i])){
              acc.rowSystemMapping[adj_i] = input.rowSystemMapping[i]
              acc.rowShuttleMapping[adj_i] = input.rowShuttleMapping[i]
            }
            row.forEach((cell, j) => {
              //if i or j is less than input params 
              const adj_j: number = j+parent_input.params[0];
              acc.drawdown[adj_i][adj_j].setHeddle(utilInstance.computeFilter('or', cell.getHeddle(), acc.drawdown[adj_i][adj_j].getHeddle()));
            });
          });
          return acc;

        }, init_draft);


        //this.transferSystemsAndShuttles(d,op_input.drafts,op_input.params, 'first');
        //d.name = this.formatName(op_input.drafts, "overlay")
        d.gen_name =alldrafts.reduce((acc, el) => {
          return acc+"+"+getDraftName(el)
        }, "").substring(1);

        outputs.push(d);
        return Promise.resolve(outputs);
      }        
    }

    const atop: Operation = {
      name: 'set atop, (a, b) => a',
      displayname: 'set atop, (a, b) => b', 
      old_names:['set atop'], 
      dx: 'sets cells of a on top of b, no matter the value of b',
      params: <Array<NumParam>>[
        {name: 'left offset',
        type: 'number',
        min: 0,
        max: 10000,
        value: 0,
        dx: "the amount to offset the addedop_input.drafts from the left"
        },
        {name: 'bottom offset',
        type: 'number',
        min: 0,
        max: 10000,
        value: 0,
        dx: "the amount to offset the overlayingop_input.drafts from the bottom"
        }
      ],
      inlets: [{
        name: 'a', 
        type: 'static',
        value: null,
        dx: 'all the drafts you would like to set another on top of',
        num_drafts: 1
      },
      {
        name: 'b', 
        type: 'static',
        value: null,
        dx: 'the draft you would like to set atop the base',
        num_drafts: 1
      }
    ],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'set atop, (a, b) => a');
        const child_inputs = op_inputs.filter(el => el.op_name == 'child');
        const base = op_inputs.find(el => el.inlet == 0);
        const top = op_inputs.find(el => el.inlet == 1);

        if(child_inputs.length == 0) return Promise.resolve([]);
        if(base === undefined) return Promise.resolve([top.drafts[0]]);
        if(top === undefined) return Promise.resolve([base.drafts[0]]);

        const alldrafts = [base.drafts[0], top.drafts[0]];

        const first: Draft =alldrafts.shift();

        const outputs: Array<Draft> = [];


        let width: number = utilInstance.getMaxWarps(alldrafts) +parent_input.params[0];
        let height: number = utilInstance.getMaxWefts(alldrafts) +parent_input.params[1];
        if(warps(first.drawdown) > width) width = warps(first.drawdown);
        if(wefts(first.drawdown) > height) height = wefts(first.drawdown);

        //initialize the base container with the first draft at 0,0, unset for anythign wider
        const init_draft: Draft =initDraftWithParams({wefts: height, warps: width});
          
        first.drawdown.forEach((row, i) => {
            row.forEach((cell, j) => {
              init_draft.drawdown[i][j].setHeddle(cell.getHeddle());
            });
          });

        //now merge in all of the additionalop_input.drafts offset by theop_input.drafts
        const d: Draft =alldrafts.reduce((acc, input) => {
          input.drawdown.forEach((row, i) => {
            row.forEach((cell, j) => {
              //if i or j is less than input params 
              const adj_i: number = i+parent_input.params[1];
              const adj_j: number = j+parent_input.params[0];
              acc.drawdown[adj_i][adj_j].setHeddle(utilInstance.computeFilter('up', cell.getHeddle(), acc.drawdown[adj_i][adj_j].getHeddle()));
            });
          });
          return acc;

        }, init_draft);
        this.transferSystemsAndShuttles(d,alldrafts,parent_input.params, 'first');
        d.gen_name = this.formatName(alldrafts, "atop")

        outputs.push(d);
        return Promise.resolve(outputs);
      }        
    }

    const knockout: Operation = {
      name: 'knockout, (a, b) => (a XOR b)',
      displayname: 'knockout, (a, b) => (a XOR b)', 
      old_names:['knockout'], 
      dx: 'Flips the value of overlapping cells of the same value, effectively knocking out the image of the second draft upon the first',
      params: <Array<NumParam>>[
        {name: 'left offset',
        type: 'number',
        min: 0,
        max: 10000,
        value: 0,
        dx: "the amount to offset the addedop_input.drafts from the left"
        },
        {name: 'bottom offset',
        type: 'number',
        min: 0,
        max: 10000,
        value: 0,
        dx: "the amount to offset the overlayingop_input.drafts from the bottom"
        }
      ],
      inlets: [{
        name: 'a', 
        type: 'static',
        value: null,
        dx: 'all the drafts you would like to xor another onto',
        num_drafts: 1
      },
      {
        name: 'b', 
        type: 'static',
        value: null,
        dx: 'the draft you would like to xor over the base',
        num_drafts: 1
      }
    ],
      perform: (op_inputs: Array<OpInput>)=> {
        const parent_input = op_inputs.find(el => el.op_name == 'knockout, (a, b) => (a XOR b)');
        const child_inputs = op_inputs.filter(el => el.op_name == 'child');
        const base = op_inputs.find(el => el.inlet == 0);
        const top = op_inputs.find(el => el.inlet == 1);

        if(child_inputs.length == 0) return Promise.resolve([]);
        if(base === undefined) return Promise.resolve([top.drafts[0]]);
        if(top === undefined) return Promise.resolve([base.drafts[0]]);

        const alldrafts = [base.drafts[0], top.drafts[0]];
        const first: Draft =alldrafts.shift();

        const outputs: Array<Draft> = [];


        let width: number = utilInstance.getMaxWarps(alldrafts) +parent_input.params[0];
        let height: number = utilInstance.getMaxWefts(alldrafts) +parent_input.params[1];
        if(warps(first.drawdown) > width) width = warps(first.drawdown);
        if(wefts(first.drawdown) > height) height = wefts(first.drawdown);

        //initialize the base container with the first draft at 0,0, unset for anythign wider
        const init_draft: Draft =initDraftWithParams({wefts: height, warps: width});
          
        first.drawdown.forEach((row, i) => {
            row.forEach((cell, j) => {
              init_draft.drawdown[i][j].setHeddle(cell.getHeddle());
            });
          });

        //now merge in all of the additionalop_input.drafts offset by theop_input.drafts
        const d: Draft =alldrafts.reduce((acc, input) => {
          input.drawdown.forEach((row, i) => {
            row.forEach((cell, j) => {
              //if i or j is less than input params 
              const adj_i: number = i+parent_input.params[1];
              const adj_j: number = j+parent_input.params[0];
              acc.drawdown[adj_i][adj_j].setHeddle(utilInstance.computeFilter('neq', cell.getHeddle(), acc.drawdown[adj_i][adj_j].getHeddle()));
            });
          });
          return acc;

        }, init_draft);
        this.transferSystemsAndShuttles(d,alldrafts,parent_input.params, 'first');
        d.gen_name = this.formatName(alldrafts, "ko");
        outputs.push(d);
        return Promise.resolve(outputs);
      }        
    }

    const mask: Operation = {
      name: 'mask, (a,b) => (a AND b)',
      displayname: 'mask, (a,b) => (a AND b)',
      old_names:['mask'],
      dx: 'only shows areas of the first draft in regions where the second draft has black/true cells',
      params: <Array<NumParam>>[
        {name: 'left offset',
        type: 'number',
        min: 0,
        max: 10000,
        value: 0,
        dx: "the amount to offset the addedop_input.drafts from the left"
        },
        {name: 'bottom offset',
        type: 'number',
        min: 0,
        max: 10000,
        value: 0,
        dx: "the amount to offset the overlayingop_input.drafts from the bottom"
        }
      ],
      inlets: [{
        name: 'a', 
        type: 'static',
        value: null,
        dx: 'all the draft you would like to mask',
        num_drafts: 1
      },
      {
        name: 'b', 
        type: 'static',
        value: null,
        dx: 'the draft to use as the mask',
        num_drafts: 1
      }
    ],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'mask, (a,b) => (a AND b)');
        const child_inputs = op_inputs.filter(el => el.op_name == 'child');
        const base = op_inputs.find(el => el.inlet == 0);
        const top = op_inputs.find(el => el.inlet == 1);

        if(child_inputs.length == 0) return Promise.resolve([]);
        if(base === undefined) return Promise.resolve([top.drafts[0]]);
        if(top === undefined) return Promise.resolve([base.drafts[0]]);

        const alldrafts = [base.drafts[0], top.drafts[0]];
        const first: Draft =alldrafts.shift();

        const outputs: Array<Draft> = [];


        let width: number = utilInstance.getMaxWarps(alldrafts) +parent_input.params[0];
        let height: number = utilInstance.getMaxWefts(alldrafts) +parent_input.params[1];
        if(warps(first.drawdown) > width) width = warps(first.drawdown);
        if(wefts(first.drawdown) > height) height = wefts(first.drawdown);

        //initialize the base container with the first draft at 0,0, unset for anythign wider
        const init_draft: Draft =initDraftWithParams({wefts: height, warps: width});
          
        first.drawdown.forEach((row, i) => {
            row.forEach((cell, j) => {
              init_draft.drawdown[i][j].setHeddle(cell.getHeddle());
            });
          });

        //now merge in all of the additionalop_input.drafts offset by theop_input.drafts
        const d: Draft =alldrafts.reduce((acc, input) => {
          input.drawdown.forEach((row, i) => {
            row.forEach((cell, j) => {
              //if i or j is less than input params 
              const adj_i: number = i+parent_input.params[1];
              const adj_j: number = j+parent_input.params[0];
              acc.drawdown[adj_i][adj_j].setHeddle(utilInstance.computeFilter('and', cell.getHeddle(), acc.drawdown[adj_i][adj_j].getHeddle()));
            });
          });
          return acc;

        }, init_draft);
        this.transferSystemsAndShuttles(d,alldrafts,parent_input.params, 'first');
        d.gen_name = this.formatName(alldrafts, "mask")
        outputs.push(d);
        return Promise.resolve(outputs);
      }        
    }

   

    const fill: Operation = {
      name: 'fill',
      displayname: 'fill',
      old_names:[],
      dx: 'fills black cells of the first input with the pattern specified by the second input, white cells with third input',
      params: [],
      inlets: [{
        name: 'pattern', 
        type: 'static',
        value: null,
        dx: 'the draft you would like to fill',
        num_drafts: 1
      },
      {
        name: 'black cell structure', 
        type: 'static',
        value: null,
        dx: 'the structure you would like to repeat in in the black regions of the base draft',
        num_drafts: 1
      },
      {
        name: 'white cell structure', 
        type: 'static',
        value: null,
        dx: 'the structure you would like to repeat in in the white regions of the base draft',
        num_drafts: 1
      }
    ],
      perform: (op_inputs: Array<OpInput>) => {

        const child_inputs = op_inputs.filter(el => el.op_name == 'child');
        const base = op_inputs.find(el => el.inlet == 0);
        const black = op_inputs.find(el => el.inlet == 1);
        const white = op_inputs.find(el => el.inlet == 2);

        if(child_inputs.length == 0) return Promise.resolve([]);
        if(base === undefined) return Promise.resolve([]);
        if(black === undefined && white === undefined) return Promise.resolve([base.drafts[0]]);

        const alldrafts = [base.drafts[0], black?.drafts[0], white?.drafts[0]];
    
        const d =initDraftWithParams(
          {warps: warps(alldrafts[0].drawdown), 
            wefts:wefts(alldrafts[0].drawdown), 
            pattern:alldrafts[0].drawdown,
            rowShuttleMapping:alldrafts[0].rowShuttleMapping,
            colShuttleMapping:alldrafts[0].colSystemMapping,
            rowSystemMapping:alldrafts[0].rowSystemMapping,
            colSystemMapping:alldrafts[0].colSystemMapping});
      
        for(let i = 0; i < wefts(d.drawdown); i++){
          for(let j = 0; j < warps(d.drawdown); j++){
            const val = d.drawdown[i][j].getHeddle();
            if(val !== null){
              if(val && black !== undefined){
                const adj_i = i%wefts(alldrafts[1].drawdown);
                const adj_j = j%warps(alldrafts[1].drawdown);
                d.drawdown[i][j].setHeddle(alldrafts[1].drawdown[adj_i][adj_j].getHeddle())
              }else if(!val && white !== undefined){
                const adj_i = i%wefts(alldrafts[2].drawdown);
                const adj_j = j%warps(alldrafts[2].drawdown);
                d.drawdown[i][j].setHeddle(alldrafts[2].drawdown[adj_i][adj_j].getHeddle())
              }
            }
          }
        }    

        return Promise.resolve([d]);
      }        
    }

    const tabby: Operation = {
      name: 'tabby',
      displayname: 'tabby',
      old_names:[],
      dx: 'also known as plain weave generates or fills input a draft with tabby structure or derivitae',
      params: <Array<NumParam>>[
        {name: 'repeats',
        type: 'number',
        min: 1,
        max: 100,
        value: 1,
        dx: 'the number or reps to adjust evenly through the structure'
        },
      ],
      inlets: [{
        name: 'shape', 
        type: 'static',
        value: null,
        dx: 'the shape you would like to fill with tabby',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {

        const parent_input = op_inputs.find(el => el.op_name == 'tabby');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        const width: number =parent_input.params[0]*2;
        const height: number =parent_input.params[0]*2;

        let alt_rows, alt_cols, val: boolean = false;
        const pattern:Array<Array<Cell>> = [];
        for(let i = 0; i < height; i++){
          alt_rows = (i <parent_input.params[0]);
          pattern.push([]);
          for(let j = 0; j < width; j++){
            alt_cols = (j <parent_input.params[0]);
            val = (alt_cols && alt_rows) || (!alt_cols && !alt_rows);
            pattern[i][j] =  new Cell(val);
          }
        }

        let outputs: Array<Draft> = [];
        if(child_input  == undefined){
          const d: Draft =initDraftWithParams({warps: width, wefts: height, pattern: pattern});
          d.gen_name = this.formatName([], "tabby");
          outputs.push(d);
        }else{
          outputs =child_input.drafts.map(input => {
            const d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
            d.drawdown = applyMask(input.drawdown, pattern);         
            this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
            d.gen_name = this.formatName(child_input.drafts, "tabby")
            return d;
          });
        }

        return Promise.resolve(outputs);
      

      }
    }

    const basket: Operation = {
      name: 'basket',
      displayname: 'basket',
      old_names:[],
      dx: 'generates a basket structure defined by theop_input.drafts',
      params: <Array<NumParam>>[
        {name: 'unders',
        type: 'number',
        min: 1,
        max: 100,
        value: 2,
        dx: 'number of weft unders'
        },
        {name: 'overs',
        type: 'number',
        min: 1,
        max: 100,
        value: 2,
        dx: 'number of weft overs'
        }
      ],
      inlets: [{
        name: 'shape', 
        type: 'static',
        value: null,
        dx: 'the shape you would like to fill with this twill',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {

        const parent_input = op_inputs.find(el => el.op_name == 'basket');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        const sum: number =parent_input.params.reduce( (acc, val) => {
            return val + acc;
        }, 0);

        let alt_rows, alt_cols, val: boolean = false;
        const pattern:Array<Array<Cell>> = [];
        for(let i = 0; i < sum; i++){
          alt_rows = (i % sum <parent_input.params[0]);
          pattern.push([]);
          for(let j = 0; j < sum; j++){
            alt_cols = (j % sum <parent_input.params[0]);
            val = (alt_cols && alt_rows) || (!alt_cols && !alt_rows);
            pattern[i][j] =  new Cell(val);
          }
        }

        let outputs: Array<Draft> = [];
        if(child_input  == undefined){
          const d: Draft =initDraftWithParams({warps: sum, wefts: sum, pattern: pattern});
          d.gen_name = this.formatName([], "basket");
          outputs.push(d);
        }else{
          outputs =child_input.drafts.map(input => {
            const d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
            d.drawdown = applyMask(input.drawdown, pattern);         
            this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
            d.gen_name = this.formatName(child_input.drafts, "basket")
            return d;
          });
        }

        return Promise.resolve(outputs);
      }
          
    }


    const stretch: Operation = {
      name: 'stretch',
      displayname: 'stretch',
      old_names:[],
      dx: 'repeats each warp and/or weft by theop_input.drafts',
      params: <Array<NumParam>>[
        {name: 'warp repeats',
        type: 'number',
        min: 1,
        max: 100,
        value: 2,
        dx: 'number of times to repeat each warp'
        },
        {name: 'weft repeats',
        type: 'number',
        min: 1,
        max: 100,
        value: 2,
        dx: 'number of weft overs in a pic'
        }
      ],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to stretch',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'stretch');
        const child_input = op_inputs.find(el => el.op_name == 'child');
        if(child_input == undefined) return Promise.resolve([]);

        const outputs: Array<Draft> =child_input.drafts.map(input => {
            const d: Draft =initDraftWithParams({warps:parent_input.params[0]*warps(input.drawdown), wefts:parent_input.params[1]*wefts(input.drawdown)});
            input.drawdown.forEach((row, i) => {
              for(let p = 0; p <parent_input.params[1]; p++){
                let i_ndx =parent_input.params[1] * i + p;
                row.forEach((cell, j) => {
                  for(let r = 0; r <parent_input.params[0]; r++){
                    let j_ndx =parent_input.params[0] * j + r;
                    d.drawdown[i_ndx][j_ndx].setHeddle(cell.getHeddle());
                  }
                });

              }
            });
            this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'stretch');
            d.gen_name = this.formatName(child_input.drafts, "stretch")
            return d;
            
        });

        return Promise.resolve(outputs);
      }
          
    }

    const resize: Operation = {
      name: 'resize',
      displayname: 'resize',
      old_names:[],
      dx: 'stretches or squishes the draft to fit the boundary',
      params: <Array<NumParam>>[
        {name: 'warps',
        type: 'number',
        min: 1,
        max: 10000,
        value: 2,
        dx: 'number of warps to resize to'
        },
        {name: 'weft repeats',
        type: 'number',
        min: 1,
        max: 10000,
        value: 2,
        dx: 'number of wefts to resize to'
        }
      ],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to resize',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'resize');
        const child_input = op_inputs.find(el => el.op_name == 'child');
       
        if(child_input == undefined) return Promise.resolve([]);


        const outputs: Array<Draft> =child_input.drafts.map(input => {
          const weft_factor =parent_input.params[1] /wefts(input.drawdown) ;
          const warp_factor =parent_input.params[0] / warps(input.drawdown);
          const d: Draft =initDraftWithParams({warps:parent_input.params[0], wefts:parent_input.params[1]});
            d.drawdown.forEach((row, i) => {
                row.forEach((cell, j) => {
                    const mapped_cell: Cell = input.drawdown[Math.floor(i/weft_factor)][Math.floor(j/warp_factor)];
                    d.drawdown[i][j].setHeddle(mapped_cell.getHeddle());
                
                });
            });
            this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'stretch');
            d.gen_name = this.formatName(child_input.drafts, "resize")
            return d;
        });

        return Promise.resolve(outputs);
      }
          
    }

    const margin: Operation = {
      name: 'margin',
      displayname: 'add margins',
      old_names:[],
      dx: 'adds padding of unset cells to the top, right, bottom, left of the block',
      params: <Array<NumParam>>[
        {name: 'bottom',
        min: 1,
        max: 10000,
        value: 1,
        type: 'number',
        dx: 'number of pics of padding to add to the bottom'
        },
        {name: 'right',
        min: 1,
        max: 10000,
        value: 1,
        type: 'number',
        dx: 'number of pics of padding to add to the right'
        },
        {name: 'top',
        min: 1,
        max: 10000,
        value: 1,
        type: 'number',
        dx: 'number of pics of padding to add to the top'
        },
        {name: 'left',
        min: 1,
        max: 10000,
        value: 1,
        type: 'number',
        dx: 'number of pics of padding to add to the left'
        }
      ],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to add margins to',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'margin');
        const child_input = op_inputs.find(el => el.op_name == 'child');
       
        if(child_input == undefined) return Promise.resolve([]);


        const outputs: Array<Draft> =child_input.drafts.map(input => {
            const new_warps =parent_input.params[1] +parent_input.params[3] + warps(child_input.drafts[0].drawdown);
            const new_wefts =parent_input.params[0] +parent_input.params[2] + wefts(child_input.drafts[0].drawdown);

            const d: Draft =initDraftWithParams({warps: new_warps, wefts: new_wefts});

            //unset all cells to default
            d.drawdown.forEach((row, i) => {
              row.forEach((cell, j) => {
                d.drawdown[i][j].unsetHeddle();
              });
            });
            input.drawdown.forEach((row, i) => {
                d.rowShuttleMapping[i+parent_input.params[0]] = input.rowShuttleMapping[i];
                d.rowSystemMapping[i+parent_input.params[0]] = input.rowSystemMapping[i];
                row.forEach((cell, j) => {
                  d.drawdown[i+parent_input.params[0]][j+parent_input.params[3]].setHeddle(cell.getHeddle());
                  d.colShuttleMapping[j+parent_input.params[3]] = input.colShuttleMapping[j];
                  d.colSystemMapping[j+parent_input.params[3]] = input.colSystemMapping[j];
                });
                
            });
            d.gen_name = this.formatName(child_input.drafts, "margin");
            return d;
        });

        return Promise.resolve(outputs);
      }
          
    }

    const crop: Operation = {
      name: 'crop',
      displayname: 'crop',
      old_names:[],
      dx: 'crops to a region of the input draft. The crop size and placement is given by the parameters',
      params: <Array<NumParam>>[
        {name: 'left',
        type: 'number',
        min: 0,
        max: 10000,
        value: 0,
        dx: 'number of pics from the left to start the cut'
        },
        {name: 'bottom',
        type: 'number',
        min: 0,
        max: 10000,
        value: 0,
        dx: 'number of pics from the bottom to start the cut'
        },
        {name: 'width',
        type: 'number',
        min: 1,
        max: 10000,
        value: 10,
        dx: 'total width of cut'
        },
        {name: 'height',
        type: 'number',
        min: 1,
        max: 10000,
        value: 10,
        dx: 'height of the cutting box'
        }
      ],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to crop',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {

        const parent_input = op_inputs.find(el => el.op_name == 'crop');
        const child_input = op_inputs.find(el => el.op_name == 'child');
       
        if(child_input == undefined) return Promise.resolve([]);


        const outputs: Array<Draft> =child_input.drafts.map(input => {
            const new_warps =parent_input.params[2];
            const new_wefts =parent_input.params[3];

            const d: Draft =initDraftWithParams({warps: new_warps, wefts: new_wefts});

            //unset all cells to default
            d.drawdown.forEach((row, i) => {
              row.forEach((cell, j) => {

                if((i+parent_input.params[1] >= input.drawdown.length) || (j+parent_input.params[0] >= input.drawdown[0].length)) cell.setHeddle(null);
                else cell.setHeddle(input.drawdown[i+parent_input.params[1]][j+parent_input.params[0]].getHeddle());
               
              });
            });
            this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
            d.gen_name = this.formatName(child_input.drafts, "crop");
            return d;
        });

        return Promise.resolve(outputs);
      }
          
    }

    const trim: Operation = {
      name: 'trim',
      displayname: 'trim',
      old_names:[],
      dx: 'trims off the edges of an input draft',
      params: <Array<NumParam>>[
        {name: 'left',
        type: 'number',
        min: 0,
        max: 10000,
        value: 0,
        dx: 'number of warps from the left to start the cut'
        },
        {name: 'top',
        type: 'number',
        min: 0,
        max: 10000,
        value: 0,
        dx: 'number of pics from the top to start the cut'
        },
        {name: 'right',
        type: 'number',
        min: 0,
        max: 10000,
        value: 0,
        dx: 'number of warps from the right to start the cut'
        },
        {name: 'bottom',
        type: 'number',
        min: 0,
        max: 10000,
        value: 0,
        dx: 'number of pics from the bottom to start the cut'
        }
      ],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to trim',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {


        const parent_input = op_inputs.find(el => el.op_name == 'trim');
        const child_input = op_inputs.find(el => el.op_name == 'child');
       
        if(child_input == undefined) return Promise.resolve([]);

        const outputs: Array<Draft> =child_input.drafts.map(input => {


            const left = parent_input.params[0];
            const top = parent_input.params[3];
            const right = parent_input.params[2];
            const bottom = parent_input.params[1];
            
            let new_warps = warps(input.drawdown) - right - left;
            if(new_warps < 0) new_warps = 0;

            let new_wefts = wefts(input.drawdown) - top - bottom;
            if(new_wefts < 0) new_wefts = 0;

            const d: Draft =initDraftWithParams({warps: new_warps, wefts: new_wefts});

            d.drawdown.forEach((row, i) => {
              row.forEach((cell, j) => {
                cell.setHeddle(input.drawdown[i+top][j+left].getHeddle());                             
              });
            });
            this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
            d.gen_name = this.formatName(child_input.drafts, "trim");
            return d;
        });

        return Promise.resolve(outputs);
      }
          
    }

   
    
    const rib: Operation = {
      name: 'rib',
      displayname: 'rib',
      old_names:[],
      dx: 'generates a rib/cord/half-basket structure defined by the parameters',
      params: <Array<NumParam>>[
        {name: 'unders',
        type: 'number',
        min: 1,
        max: 100,
        value: 2,
        dx: 'number of weft unders in a pic'
        },
        {name: 'overs',
        type: 'number',
        min: 1,
        max: 100,
        value: 2,
        dx: 'number of weft overs in a pic'
        },
        {name: 'repeats',
        type: 'number',
        min: 1,
        max: 100,
        value: 1,
        dx: 'number of weft pics to repeat within the structure'
        }
      ],
      inlets: [{
        name: 'shape', 
        type: 'static',
        value: null,
        dx: 'the shape you would like to fill with this rib structure',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {

      
        const parent_input = op_inputs.find(el => el.op_name == 'rib');
        const child_input = op_inputs.find(el => el.op_name == 'child');
       

        const sum: number =parent_input.params[0] +parent_input.params[1];
        const repeats: number =parent_input.params[2];
        const width: number = sum;
        const height: number = repeats * 2;

        let alt_rows, alt_cols, val: boolean = false;
        const pattern:Array<Array<Cell>> = [];
        for(let i = 0; i < height; i++){
          alt_rows = (i < repeats);
          pattern.push([]);
          for(let j = 0; j < width; j++){
            alt_cols = (j % sum <parent_input.params[0]);
            val = (alt_cols && alt_rows) || (!alt_cols && !alt_rows);
            pattern[i][j] =  new Cell(val);
          }
        }

        let outputs: Array<Draft> = [];
        if(child_input === undefined){
          const d: Draft =initDraftWithParams({warps: width, wefts: height, pattern: pattern});
          outputs.push(d);
        }else{
          outputs =child_input.drafts.map(input => {
            const d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
            d.drawdown = applyMask(input.drawdown, pattern);         
            this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'second');
            d.gen_name = this.formatName(child_input.drafts, "rib");
            return d;
          });
        }

        return Promise.resolve(outputs);
      }
          
    }

    const twill: Operation = {
      name: 'twill',
      displayname: 'twill',
      old_names:[],
      dx: 'generates or fills with a twill structure described by the input drafts',
      params: [
        <NumParam> {name: 'unders',
        type: 'number',
        min: 1,
        max: 100,
        value: 1,
        dx: 'number of weft unders'
        
        },
        <NumParam>{name: 'overs',
        type: 'number',
        min: 1,
        max: 100,
        value: 3,
        dx: 'number of weft overs'
        },
        <BoolParam> {name: 'Z/S',
        type: 'boolean',
        falsestate: 'Z',
        truestate: 'S',
        value: 0,
        dx: 'toggle to switch the twist direction'
        }
      ],
      inlets: [{
        name: 'shape', 
        type: 'static',
        value: null,
        dx: 'the shape you would like to fill with twill',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {

        const parent_input = op_inputs.find(el => el.op_name == 'twill');
        const child_input = op_inputs.find(el => el.op_name == 'child');
       
        let sum: number =parent_input.params.reduce( (acc, val) => {
            return val + acc;
        }, 0);

        sum -=parent_input.params[2];

        const pattern:Array<Array<Cell>> = [];
        for(let i = 0; i < sum; i++){
          pattern.push([]);
          for(let j = 0; j < sum; j++){
            pattern[i][(j+i)%sum] = (j <parent_input.params[0]) ? new Cell(true) : new Cell(false);
          }
        }

        let outputs: Array<Draft> = [];
        if(child_input === undefined){
          const d: Draft =initDraftWithParams({warps: sum, wefts: sum, pattern: pattern});
          d.gen_name = this.formatName([], "twill");
          outputs.push(d);

        }else{
           outputs =child_input.drafts.map(input => {
            const d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
            d.drawdown = applyMask(input.drawdown, pattern);         
            this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
            d.gen_name = this.formatName(child_input.drafts, "twill");
            return d;
          });
        }

        if(parent_input.params[2] === 1){
          return (<Operation>this.getOp('flip horiz')).perform([{drafts:[], params:[], inlet: 0, op_name:"flip horiz"}, {drafts:outputs, params:[], inlet: 0, op_name:"child"}]);
        }else{
          return Promise.resolve(outputs);
        }
      }        
    }


    const complextwill: Operation = {
      name: 'complextwill',
      displayname: 'complex twill',
      old_names:[],
      dx: 'generates a specified by the input parameters, alternating warp and weft facing with each input value',
      params: [
        <StringParam>{name: 'pattern',
        type: 'string',
        regex: /(\d+)/,
        value: '2 2 3 3',
        dx: 'the under over pattern of this twill (e.g. 2 2 3 3)'
        },
        <BoolParam>{name: 'Z/S',
        type: 'boolean',
        falsestate: 'Z',
        truestate: 'S',
        value: 0,
        dx: 'toggle to change twill direction'
        }
      ],
      inlets: [{
        name: 'shape', 
        type: 'static',
        value: null,
        dx: 'the shape you would like to fill with this twill',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {


        const parent_input = op_inputs.find(el => el.op_name == 'complextwill');
        const child_input = op_inputs.find(el => el.op_name == 'child');
       

        const twist = parent_input.params[1];
        const pattern_string: String = String(parent_input.params[0]);

       const sequence: Array<number> = pattern_string.split(' ').map(el => parseInt(el));



        let sum: number =sequence.reduce( (acc, val) => {
            return val + acc;
        }, 0);

        const starting_line: Array<boolean>  = [];
        let under = true;
        sequence.forEach(input => {
          for(let j = 0; j < input; j++){
            starting_line.push(under);
          }
          under = !under;
        });


        const pattern:Array<Array<Cell>> = [];
        let twist_val = (twist == 0) ? -1 : 1;
        for(let i = 0; i < sum; i++){
          pattern.push([]);
          for(let j = 0; j < sum; j++){
            let ndx = (j+(twist_val*i)) % sum;
            if(ndx < 0) ndx = sum + ndx;
            pattern[i].push(new Cell(starting_line[ndx]));
          }
        }
        let outputs: Array<Draft> = [];

        if(child_input === undefined){
          const d: Draft =initDraftWithParams({warps: sum, wefts: sum, pattern: pattern});
          d.gen_name = this.formatName([], "complex twill");
          outputs.push(d);
  

        }else{
           outputs =child_input.drafts.map(input => {
            const d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
            d.drawdown = applyMask(input.drawdown, pattern);         
            this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
            d.gen_name = this.formatName(child_input.drafts, "complex twill");
            return d;
          });
        }

  

        return  Promise.resolve(outputs)

       
      }        
    }

    // const layernotation: DynamicOperation = {
    //   name: 'notation',
    //   displayname: 'layer notation',
    //   old_names:[],
    //   dynamic_param_id: 0,
    //   dynamic_param_type: 'notation',
    //   dx: 'uses a notation system to assign drafts to different warp and weft patterns on different layers. Layers are represented by () so (1a)(2b) puts warp1 and weft a on layer 1, warp 2 and weft b on layer 2',
    //   params: <Array<StringParam>>[
    //     {name: 'pattern',
    //     type: 'string',
    //     value: '(a1)(b2)',
    //     regex: /.*?\((.*?[a-xA-Z]+[\d]+.*?)\).*?/i, //NEVER USE THE GLOBAL FLAG - it will throw errors randomly
    //     error: 'invalid entry',
    //     dx: 'all system pairs must be listed as letters followed by numbers, layers are created by enclosing those system lists in pararenthesis. For example, the following are valid: (a1b2)(c3) or (c1)(a2). The following are invalid: (1a)(2b) or (2b'
    //     }
    //   ],
    //   inlets: [{
    //     name: 'systems draft', 
    //     type: 'static',
    //     value: null,
    //     dx: 'the draft that describes the system ordering we will add input structures within',
    //     num_drafts: 1
    //   }],
    //   perform: (op_inputs: Array<OpInput>) => {


    //     // //split the inputs into the input associated with 
    //     const parent_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "layernotation");
    //     const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");

  
    //     if(child_inputs.length == 0) return Promise.resolve([]);

    //     //now just get all the drafts
    //     const all_drafts: Array<Draft> = child_inputs.reduce((acc, el) => {
    //       el.drafts.forEach(draft => {acc.push(draft)});
    //       return acc;
    //     }, []);



    //     const system_map = child_inputs.find(el => el.inlet === 0);

    //     if(system_map === undefined) return Promise.resolve([]); ;
       
        
    //     const draft_inlets = child_inputs.filter(el => el.inlet > 0).map(el => el.drafts[0]);

    //     let total_wefts: number = 0;
    //     const all_wefts = draft_inlets.map(el => wefts(el.drawdown)).filter(el => el > 0);
    //     total_wefts = utilInstance.lcm(all_wefts);

    //     let total_warps: number = 0;
    //     const all_warps = draft_inlets.map(el => warps(el.drawdown)).filter(el => el > 0);
    //     total_warps = utilInstance.lcm(all_warps);



    //     //create a map that associates each warp and weft system with a draft, keeps and index, and stores a layer. 
    //     //get the total number of layers
    //     const system_draft_map = child_inputs
    //     .filter(el => el.inlet > 0)
    //     .map(el => {
    //       return  {
    //         wesy: el.params[0].match(/[a-zA-Z]+/g), //pull all the letters out into weft system ids
    //         wasy: el.params[0].match(/\d/g).map(el => parseInt(el)), //pull out all the nubmers into warp systems
    //         i: 0,
    //         j: 0,
    //         layer: el.inlet-1, //map layer order to the inlet id, all inlets must be ordered the same as the input
    //         draft: el.drafts[0]
    //       }
    //     });
        

    //     const d: Draft = initDraftWithParams({
    //       warps: total_warps*warps(system_map.drafts[0].drawdown), 
    //       wefts: total_wefts* wefts(system_map.drafts[0].drawdown),
    //       rowShuttleMapping: system_map.drafts[0].rowShuttleMapping.slice(),
    //       rowSystemMapping: system_map.drafts[0].rowSystemMapping.slice(),
    //       colShuttleMapping: system_map.drafts[0].colShuttleMapping.slice(),
    //       colSystemMapping: system_map.drafts[0].colSystemMapping.slice(),
    //     });

    //     d.drawdown = [];
    //     for(let i = 0; i < wefts(d.drawdown); i++){
    //       let active_wesy = this.ss.getWeftSystem(d.rowSystemMapping[i]).name;
    //       const active_weft_entry = system_draft_map.find(el => el.wesy.findIndex(wesyel => wesyel === active_wesy) !== -1);
    //       let increment_flag = false;

    //       d.drawdown.push([]);
    //       for(let j = 0; j < warps(d.drawdown); j++){
    //         let active_wasy = parseInt(this.ss.getWarpSystem(d.colSystemMapping[j]).name);
    //         const active_warp_entry = system_draft_map.find(el => el.wasy.findIndex(wasyel => wasyel === active_wasy) !== -1);
    //         const entry = system_draft_map.find(el => (el.wasy.findIndex(wasyel => wasyel === active_wasy) !== -1 && el.wesy.findIndex(wesyel => wesyel === active_wesy)!== -1));

    //         if(active_weft_entry === undefined || active_warp_entry === undefined){
    //           //no input draft is assigned to this system, set all as undefined
    //           d.drawdown[i][j] = new Cell(null);

    //         }else if(entry === undefined){
    //           //this is unassigned or its an an alternating layer. 
    //           //find the term in the list assigned to this. 
    //           //if this weft systems layer is > than the layer associted with this warp system, lower, if it is less, raise. 
    //           const wesy_layer = active_weft_entry.layer;
    //           const wasy_layer = active_warp_entry.layer;
    //           if(wasy_layer < wesy_layer) d.drawdown[i][j] = new Cell(true);
    //           else if(wasy_layer > wesy_layer) d.drawdown[i][j] = new Cell(false);
    //           else d.drawdown[i][j] = new Cell(null);
    //         }  
    //         else{
    //           d.drawdown[i][j] = new Cell(entry.draft.drawdown[entry.i][entry.j].getHeddle());
    //           entry.j = (entry.j+1)%warps(entry.draft.drawdown);
    //           increment_flag = true;
    //         }

    //       }

    //       if(increment_flag){
    //         active_weft_entry.i = (active_weft_entry.i+1) % wefts(active_weft_entry.draft.drawdown);
    //       } 


    //     }
        
    //     d.gen_name = this.formatName([], "notation");
    //     return  Promise.resolve([d]);

       
    //   }        
    // }

    const layernotation: DynamicOperation = {
      name: 'notation',
      displayname: 'layer notation',
      old_names:[],
      dynamic_param_id: 0,
      dynamic_param_type: 'notation',
      dx: 'uses a notation system to assign drafts to different warp and weft patterns on different layers. Layers are represented by () so (1a)(2b) puts warp1 and weft a on layer 1, warp 2 and weft b on layer 2',
      params: <Array<StringParam>>[
        {name: 'pattern',
        type: 'string',
        value: '(a1)(b2)',
        regex: /.*?\((.*?[a-xA-Z]*[\d]*.*?)\).*?/i, //NEVER USE THE GLOBAL FLAG - it will throw errors randomly
        error: 'invalid entry',
        dx: 'all system pairs must be listed as letters followed by numbers, layers are created by enclosing those system lists in pararenthesis. For example, the following are valid: (a1b2)(c3) or (c1)(a2). The following are invalid: (1a)(2b) or (2b'
        }
      ],
      inlets: [{
        name: 'systems draft', 
        type: 'static',
        value: null,
        dx: 'the draft that describes the system ordering we will add input structures within',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {


        // //split the inputs into the input associated with 
        const parent_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "notation");
        const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");

        if(child_inputs.length == 0) return Promise.resolve([]);

        //now just get all the drafts
        const all_drafts: Array<Draft> = child_inputs.reduce((acc, el) => {
          el.drafts.forEach(draft => {acc.push(draft)});
          return acc;
        }, []);



        const system_map = child_inputs.find(el => el.inlet === 0);

        if(system_map === undefined) return Promise.resolve([]); ;
       
        
        const draft_inlets = child_inputs.filter(el => el.inlet > 0).map(el => el.drafts[0]);

        let total_wefts: number = 0;
        const all_wefts = draft_inlets.map(el => wefts(el.drawdown)).filter(el => el > 0);
        total_wefts = utilInstance.lcm(all_wefts);

        let total_warps: number = 0;
        const all_warps = draft_inlets.map(el => warps(el.drawdown)).filter(el => el > 0);
        total_warps = utilInstance.lcm(all_warps);



        //create a map that associates each warp and weft system with a draft, keeps and index, and stores a layer. 
        //get the total number of layers
        const system_draft_map = child_inputs
        .filter(el => el.inlet > 0)
        .map(el => {
          return  {
            wesy: el.params[0].match(/[a-zA-Z]+/g), //pull all the letters out into weft system ids
            wasy: el.params[0].match(/\d+/g), //pull out all the nubmers into warp systems
            i: 0,
            j: 0,
            layer: el.inlet-1, //map layer order to the inlet id, all inlets must be ordered the same as the input
            draft: el.drafts[0]
          }
        });


        
        system_draft_map.forEach(sdm => {
          if(sdm.wasy!== null) sdm.wasy = sdm.wasy.map(el => parseInt(el));
          else sdm.wasy = [-1];
          if(sdm.wesy === null) sdm.wesy = [''];
        })


        const d: Draft =initDraftWithParams({
          warps: total_warps*warps(system_map.drafts[0].drawdown), 
          wefts: total_wefts*wefts(system_map.drafts[0].drawdown),
          rowShuttleMapping: system_map.drafts[0].rowShuttleMapping.slice(),
          rowSystemMapping: system_map.drafts[0].rowSystemMapping.slice(),
          colShuttleMapping: system_map.drafts[0].colShuttleMapping.slice(),
          colSystemMapping: system_map.drafts[0].colSystemMapping.slice(),
        });

        for(let i = 0; i < wefts(d.drawdown); i++){
          let active_wesy = this.ss.getWeftSystem(d.rowSystemMapping[i]).name;
          const active_weft_entry = system_draft_map.find(el => el.wesy.findIndex(wesyel => wesyel === active_wesy) !== -1);
          let increment_flag = false;

          for(let j = 0; j < warps(d.drawdown); j++){
            let active_wasy = parseInt(this.ss.getWarpSystem(d.colSystemMapping[j]).name);

            
            const active_warp_entry = system_draft_map.find(el => el.wasy.findIndex(wasyel => wasyel === active_wasy) !== -1);
            const entry = system_draft_map.find(el => (el.wasy.findIndex(wasyel => wasyel === active_wasy) !== -1 && el.wesy.findIndex(wesyel => wesyel === active_wesy)!== -1));

            if(active_weft_entry === undefined || active_warp_entry === undefined){
              //no input draft is assigned to this system, set all as undefined
              d.drawdown[i][j] = new Cell(null);

            }else if(entry === undefined){
              //this is unassigned or its an an alternating layer. 
              //find the term in the list assigned to this. 
              //if this weft systems layer is > than the layer associted with this warp system, lower, if it is less, raise. 
              const wesy_layer = active_weft_entry.layer;
              const wasy_layer = active_warp_entry.layer;
              if(wasy_layer < wesy_layer) d.drawdown[i][j] = new Cell(true);
              else if(wasy_layer > wesy_layer) d.drawdown[i][j] = new Cell(false);
              else d.drawdown[i][j] = new Cell(null);
            }  
            else{
              d.drawdown[i][j] = new Cell(entry.draft.drawdown[entry.i][entry.j].getHeddle());
              entry.j = (entry.j+1)%warps(entry.draft.drawdown);
              increment_flag = true;
            }

          }

          if(increment_flag){
            active_weft_entry.i = (active_weft_entry.i+1) % wefts(active_weft_entry.draft.drawdown);
          } 


        }
        
        d.gen_name = this.formatName([], "notation");
        return  Promise.resolve([d]);

       
      }        
    }

    

    const warp_profile: DynamicOperation = {
      name: 'warp_profile',
      displayname: 'pattern across width',
      old_names:[],
      dynamic_param_id: 0,
      dynamic_param_type: 'number',
      dx: 'if you describe a numeric pattern, it will repeat the inputs in the same pattern',
      params: <Array<StringParam>>[
        {name: 'pattern',
        type: 'string',
        value: '1 1 2 1 3 1 1',
        regex: /(\d)*\D/i, //NEVER USE THE GLOBAL FLAG - it will throw errors randomly
        error: 'invalid entry',
        dx: 'all entries must be numbers separated by a space'
        }
      ],
      inlets: [{
        name: 'weft pattern', 
        type: 'static',
        value: null,
        dx: 'optional, define a custom weft material or system pattern here',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {

                
        // //split the inputs into the input associated with 
        const parent_input: OpInput = op_inputs.find(el => el.op_name === "warp_profile");
        const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");
        const weft_system: OpInput = op_inputs.find(el => el.inlet == 0);
  

        if(child_inputs.length == 0) return Promise.resolve([]);

        let weft_mapping;
        if(weft_system === undefined) weft_mapping =initDraftWithParams({warps: 1, wefts:1});
        else weft_mapping = weft_system.drafts[0];
    

        //now just get all the drafts
        const all_drafts: Array<Draft> = child_inputs
        .filter(el => el.inlet > 0)
        .reduce((acc, el) => {
          el.drafts.forEach(draft => {acc.push(draft)});
          return acc;
        }, []);
       
      
        let total_wefts: number = 0;
        const all_wefts = all_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
        total_wefts = utilInstance.lcm(all_wefts);


        let pattern = parent_input.params[0].split(' ');

  
        //create a map that associates each warp and weft system with a draft, keeps and index, and stores a layer. 
        //get the total number of layers
        const profile_draft_map = child_inputs
        .map(el => {
          return  {
            id: el.inlet, 
            draft: el.drafts[0]
          }
        });

        let total_warps = 0;
        const warp_map = [];
        pattern.forEach(el => {
          const d = profile_draft_map.find(dm => dm.id === parseInt(el));
          if(d !== undefined){
            warp_map.push({id: parseInt(el), start: total_warps, end: total_warps+warps(d.draft.drawdown)});
            total_warps += warps(d.draft.drawdown);
          } 
        })


        
        const d: Draft =initDraftWithParams({
          warps: total_warps, 
          wefts: total_wefts,
          rowShuttleMapping: weft_mapping.rowShuttleMapping,
          rowSystemMapping: weft_mapping.rowSystemMapping,
        });

        for(let i = 0; i < wefts(d.drawdown); i++){
          for(let j = 0; j < warps(d.drawdown); j++){
            //const pattern_ndx = Math.floor(j / total_warps);

            const pattern_ndx = warp_map.find(el => j >= el.start && j < el.end).id;

            const ndx = pattern[pattern_ndx];
            const select_draft = profile_draft_map.find(el => el.id === parseInt(ndx));
            if(select_draft === undefined){
              d.drawdown[i][j] = new Cell(null);
            }else{
              const sd: Draft = select_draft.draft;
              let val = sd.drawdown[i%wefts(sd.drawdown)][j%warps(sd.drawdown)].getHeddle();
              d.drawdown[i][j] = new Cell(val);
            }
          }
        }

        d.gen_name = this.formatName([], "warp profile");
        return  Promise.resolve([d]);

       
      }        
    }

    const profile: DynamicOperation = {
      name: 'profile',
      displayname: 'profile draft',
      old_names:[],
      dynamic_param_id: 0,
      dynamic_param_type: 'draft',
      dx: 'if you describe a numeric pattern, it will repeat the inputs in the same pattern',
      params: <Array<DraftParam>>[
        {name: 'profile draft',
        type: 'draft',
        value: null,
        dx: '',
        id: -1
        }
      ],
      inlets: [{
        name: 'profile pattern', 
        type: 'static',
        value: null,
        dx: 'uses the threading and treadling on the input to generate inputs for the profile',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {

                
        // // //split the inputs into the input associated with 
        const parent_input: OpInput = op_inputs.find(el => el.op_name === "profile");
        const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");
        const profile_input: OpInput = op_inputs.find(el => el.inlet === 0);


         //now just get all the drafts
         const all_drafts: Array<Draft> = child_inputs
         .filter(el => el.inlet > 0)
         .reduce((acc, el) => {
           el.drafts.forEach(draft => {acc.push(draft)});
           return acc;
         }, []);


        
        if(child_inputs.length == 0) return Promise.resolve([]);
        if(profile_input === undefined || profile_input.drafts.length === 0) return Promise.resolve([]);

        //create an index of each row where there is a "true" for each warp
        const pd: Draft = profile_input.drafts[0];
        const warp_acrx_pattern:Array<number> = [];
        for(let j = 0; j < warps(pd.drawdown); j++){
          const col: Array<Cell> = pd.drawdown.map(el => el[j]);
          const found_ndx = col.findIndex(el => el.getHeddle()===true);
          if(found_ndx != -1) warp_acrx_pattern.push(found_ndx);
          else warp_acrx_pattern.push(0);
        }


        
  
        // //create a map that associates each warp and weft system with a draft, keeps and index, and stores a layer. 
        const profile_draft_map = child_inputs
        .filter(el => el.inlet > 0)
        .map(el => {
          return  {
            id: el.inlet, 
            draft: el.drafts[0]
          }
        });

        let total_warps = 0;
        const warp_map = [];
        warp_acrx_pattern.forEach(el => {
          const d = profile_draft_map.find(dm => (dm.id) === el+1);
          if(d !== undefined){
            warp_map.push({id: el, start: total_warps, end: total_warps+warps(d.draft.drawdown)});
            total_warps += warps(d.draft.drawdown);
          } 
        })

        let total_wefts = utilInstance.getMaxWefts(all_drafts);
        const weft_map = [];
        // weft_acrx_pattern.forEach(el => {
        //   const d = profile_draft_map.find(dm => (dm.id) === el+1);
        //   if(d !== undefined){
        //     weft_map.push({id: el, start: total_wefts, end: total_wefts+wefts(d.drawdown)(draft.drawdown)});
        //     total_wefts += warps(d.drawdown)(draft.drawdown);
        //   } 
        // })

        
        const d: Draft =initDraftWithParams({
          warps: total_warps, 
          wefts: total_wefts,
        });

        for(let i = 0; i < wefts(d.drawdown); i++){
          for(let j = 0; j < warps(d.drawdown); j++){

            const warp_pattern_ndx = warp_map.find(el => j >= el.start && j < el.end).id;
            const select_draft = profile_draft_map.find(el => el.id === warp_pattern_ndx+1);
            if(select_draft === undefined){
              d.drawdown[i][j] = new Cell(null);
            }else{
              const sd: Draft = select_draft.draft;
              let val = sd.drawdown[i%wefts(sd.drawdown)][j%warps(sd.drawdown)].getHeddle();
              d.drawdown[i][j] = new Cell(val);
            }
          }
        }

        d.gen_name = this.formatName([], "profile");
        return  Promise.resolve([d]);

       
      }        
    }




    const waffle: Operation = {
      name: 'waffle',
      displayname: 'waffle',
      old_names:[],
      dx: 'generates or fills with a waffle structure',
      params: <Array<NumParam>>[
        {name: 'width',
        type: 'number',
        min: 1,
        max: 100,
        value: 8,
        dx: 'width'
        
        },
        {name: 'height',
        type: 'number',
        min: 1,
        max: 100,
        value: 8,
        dx: 'height'
        },
        {name: 'tabby variation',
        type: 'number',
        min: 0,
        max: 100,
        value: 1,
        dx: 'builds tabby around the edges of the central diamond, crating some strange patterns'
        }
      ],
      inlets: [{
        name: 'shape', 
        type: 'static',
        value: null,
        dx: 'the shape you would like to fill with waffle',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {

        const parent_input = op_inputs.find(el => el.op_name == 'waffle');
        const child_input = op_inputs.find(el => el.op_name == 'child');
       

        const width = parent_input.params[0];
        const height = parent_input.params[1];
        const bindings = parent_input.params[2];


        let outputs: Array<Draft> = [];

        const pattern: Array<Array<Cell>> = [];
        const mid_warp: number = Math.floor(width / 2);  //for 5 this is 2
        const mid_weft: number = Math.floor(height / 2); //for 5 this is 2
        const warps_to_wefts_ratio = mid_warp/mid_weft;

        //first create the diamond
        for(let i = 0; i < height; i++){
          pattern.push([]);
          const row_offset = (i > mid_weft) ? height - i : i;
          for(let j = 0; j < width; j++){
            if(j >= mid_warp - row_offset*warps_to_wefts_ratio && j <= mid_warp + row_offset*warps_to_wefts_ratio) pattern[i][j] = new Cell(true);
            else pattern[i][j] = new Cell(false);
          }
        }

        //carve out the tabby
        if(bindings > 0){
        const tabby_range_size = bindings * 2 + 1;
        for(let i = 0; i < height; i++){
          const row_offset = (i > mid_weft) ? height - i : i;
          const range_size = Math.floor((mid_warp + row_offset*warps_to_wefts_ratio) - (mid_warp - row_offset*warps_to_wefts_ratio)) + 1;

            //figure out how many bindings we're dealing with here - alterlate to the inside and outside of the diamong
            for(let b = 1; b <= bindings; b++){
              const inside = (b % 2 == 1) ? true : false;
              if(inside){
                const increment = Math.floor(b+1 / 2)
                const diff = Math.ceil((range_size - tabby_range_size) / 2);
                const left_j = mid_warp - (diff * increment);
                const right_j = mid_warp + (diff * increment);
                if(left_j > 0 && left_j < width) pattern[i][left_j].setHeddle(false);
                if(right_j > 0 && right_j < width) pattern[i][right_j].setHeddle(false);
              }else{
                const increment = Math.floor(b / 2);
                const left_j = (mid_warp - Math.floor((range_size-1)/2)) - (increment*2);
                const right_j = (mid_warp + Math.floor((range_size-1)/2)) + (increment*2);
                if(left_j > 0 && left_j < width) pattern[i][left_j].setHeddle(true);
                if(right_j > 0 && right_j < width) pattern[i][right_j].setHeddle(true);
              }

            }
          
        }
      }


        if(child_input == undefined){
        
          const d: Draft =initDraftWithParams({warps: width, wefts: height, pattern: pattern});
          d.gen_name = this.formatName([], "waffle");
          outputs.push(d);

        }else{
           outputs =child_input.drafts.map(input => {
            const d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
            d.drawdown = applyMask(input.drawdown, pattern);         
            this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
            d.gen_name = this.formatName(child_input.drafts, "waffle");
            return d;
          });
        }
        return Promise.resolve(outputs);

      }        


    }

    const makesymmetric: Operation = {
      name: 'makesymmetric',
      old_names:[],
      displayname: 'make symmetric',
      dx: 'rotates the draft around a corner, creating rotational symmetry around the selected point',
      params: [
        <SelectParam>{name: 'corner',
        type: 'select',
        selectlist: [
          {name: 'top left corner', value: 0},
          {name: 'top right corner', value: 1},
          {name: 'bottom right corner', value: 2},
          {name: 'bottom left corner', value: 3}
        ],
        value: 0,
        dx: 'corner to which this draft is rotated around 0 is top left, 1 top right, 2 bottom right, 3 bottom left'
        },
        <BoolParam>{name: 'remove center repeat',
        type: 'boolean',
        falsestate: "center repeat kept",
        truestate: "center repeat removed",
        value: 0,
        dx: 'rotating drafts creates a repeated set of columns or rows extending from the center. Use this toggle to alternative the structure by either keeping or erasing those repeated cells'
        }

      ],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to make symmetric',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {

        const parent_input = op_inputs.find(el => el.op_name === "makesymmetric");
        const child_input = op_inputs.find(el => el.op_name === "child");


        const corner = parent_input.params[0];
        const even = parent_input.params[1] === 0;

        if(child_input == undefined) return Promise.resolve([]);
        const d = child_input.drafts[0];
        
      
        const pattern: Array<Array<Cell>> = [];

        let use_i = 0;
        let use_j = 0;

        let weft_num = wefts(d.drawdown) * 2;
        let warp_num = warps(d.drawdown) * 2;

        for(let i =0; i < weft_num; i++){
          pattern.push([]);
          for(let j = 0; j < warp_num; j++){
            switch(corner){


              case 0:
                use_i = (i >= wefts(d.drawdown)) ? wefts(d.drawdown) - (i - wefts(d.drawdown))-1: i;
                use_j = (j >= warps(d.drawdown)) ? j - warps(d.drawdown) : warps(d.drawdown)-1 - j; 
              break;

              case 1:
                use_i = (i >= wefts(d.drawdown)) ? wefts(d.drawdown) - (i - wefts(d.drawdown))-1: i;
                use_j = (j >= warps(d.drawdown)) ? warps(d.drawdown) - (j - warps(d.drawdown))-1  : j; 
              break;
              

              case 2:
                use_i = (i >= wefts(d.drawdown)) ? i - wefts(d.drawdown) : wefts(d.drawdown)-1 - i;
                use_j = (j >= warps(d.drawdown)) ? warps(d.drawdown) - (j - warps(d.drawdown))-1  : j; 
              break;

              case 3:
                use_i = (i >= wefts(d.drawdown)) ? i - wefts(d.drawdown) : wefts(d.drawdown)-1 - i;
                use_j = (j >= warps(d.drawdown)) ? j - warps(d.drawdown) : warps(d.drawdown)-1 - j; 
              break;              
            }
            
            const value: boolean = d.drawdown[use_i][use_j].getHeddle();
            pattern[i].push(new Cell(value));
          }
        }

        let usepattern; 
        //delete one of the central rows
        if(!even){
          const deletedweft = pattern.filter((el, i) => i !== wefts(d.drawdown));
          usepattern = deletedweft.map(row => row.filter((el, j) => j !== warps(d.drawdown)));
        }else{
          usepattern = pattern;
        }


      
        const draft: Draft =initDraftWithParams({warps: usepattern[0].length, wefts: usepattern.length, pattern: usepattern});
        draft.gen_name = this.formatName(child_input.drafts, "4-way");
    

      

        return Promise.resolve([draft]);

      }        


    }


    

    const satin: Operation = {
      name: 'satin',
      displayname: 'satin',
      old_names:[],
      dx: 'generates or fills with a satin structure described by theop_input.drafts',
      params: <Array<NumParam>>[
        {name: 'repeat',
        type: 'number',
        min: 5,
        max: 100,
        value: 5,
        dx: 'the width and height of the pattern'
        },
        {name: 'move',
        type: 'number',
        min: 1,
        max: 100,
        value: 2,
        dx: 'the move number on each row'
        },
        <BoolParam>{name: 'face',
        type: 'boolean',
        falsestate: "weft facing",
        truestate: "warp facing",
        value: 0,
        dx: 'select to toggle warp and weft facing variations of this satin'
        }
      ],
      inlets: [{
        name: 'shape', 
        type: 'static',
        value: null,
        dx: 'the shape you would like to fill with tabby',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {

        const parent_input = op_inputs.find(el => el.op_name == 'satin');
        const child_input = op_inputs.find(el => el.op_name == 'child');
       

        const pattern:Array<Array<Cell>> = [];
        for(let i = 0; i <parent_input.params[0]; i++){
          pattern.push([]);
          for(let j = 0; j <parent_input.params[0]; j++){
            if(parent_input.params[2]=== 0) pattern[i][j] = (j===(i*parent_input.params[1])%parent_input.params[0]) ? new Cell(true) : new Cell(false);
            else pattern[i][j] = (j===(i*parent_input.params[1])%parent_input.params[0]) ? new Cell(false) : new Cell(true);
          }
        }

        let outputs: Array<Draft> = [];
        if(child_input === undefined){
          const d: Draft =initDraftWithParams({warps:parent_input.params[0], wefts:parent_input.params[0], pattern: pattern});
          d.gen_name = this.formatName([], "satin");
          outputs.push(d);
        }else{
           outputs =child_input.drafts.map(input => {
            const d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
            d.drawdown = applyMask(input.drawdown, pattern);         
            this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
            d.gen_name = this.formatName(child_input.drafts, "satin");
            return d;
          });
        }
              
      
        return Promise.resolve(outputs);

        
      }        
    }

    const random: Operation = {
      name: 'random',
      displayname: 'random',
      old_names:[],
      dx: 'generates a random draft with width, height, and percetage of weft unders defined byop_input.drafts',
      params: <Array<NumParam>>[
        {name: 'width',
        type: 'number',
        min: 1,
        max: 100,
        value: 6,
        dx: 'the width of this structure'
        },
        {name: 'height',
        type: 'number',
        min: 1,
        max: 100,
        value: 6,
        dx: 'the height of this structure'
        },
        {name: 'percent weft unders',
        type: 'number',
        min: 1,
        max: 100,
        value: 50,
        dx: 'percentage of weft unders to be used'
        }
      ],
      inlets: [{
        name: 'shape', 
        type: 'static',
        value: null,
        dx: 'the shape you would like to fill with random',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'random');
        const child_input = op_inputs.find(el => el.op_name == 'child');
       
        const pattern:Array<Array<Cell>> = [];
        for(let i = 0; i <parent_input.params[1]; i++){
          pattern.push([]);
          for(let j = 0; j <parent_input.params[0]; j++){
            const rand: number = Math.random() * 100;
            pattern[i][j] = (rand >parent_input.params[2]) ? new Cell(false) : new Cell(true);
          }
        }

        let outputs: Array<Draft> = [];
        if(child_input === undefined){
          const d: Draft =initDraftWithParams({warps:parent_input.params[0], wefts:parent_input.params[1], pattern: pattern});
          d.gen_name = this.formatName([], "random");
          outputs.push(d);
        }else{
           outputs =child_input.drafts.map(input => {
            const d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
            d.drawdown = applyMask(input.drawdown, pattern);         
            this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
            d.gen_name = this.formatName(child_input.drafts, "random");
            return d;
          });
        }

        return Promise.resolve(outputs);
      }        
    }

    const invert: Operation = {
      name: 'invert',
      displayname: 'invert',
      old_names:[],
      dx: 'generates an output that is the inverse or backside of the input',
      params: [],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to invert',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'invert');
        const child_input = op_inputs.find(el => el.op_name == 'child');
      
        if(child_input === undefined) return Promise.resolve([]);
          const outputs:Array<Draft> =child_input.drafts.map(input => {
          let d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
          d.drawdown = invertDrawdown(d.drawdown);
          this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
          d.gen_name = this.formatName(child_input.drafts, "invert");
          return d;
        });
        return Promise.resolve(outputs);
      }
    }

    const flipx: Operation = {
      name: 'flip horiz',
      displayname: 'flip horiz',
      old_names:[],
      dx: 'generates an output that is the left-right mirror of the input',
      params: [],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to flip horizontally',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'flip horiz');
        const child_input = op_inputs.find(el => el.op_name == 'child');
      
        if(child_input === undefined) return Promise.resolve([]);

          const outputs:Array<Draft> =child_input.drafts.map(input => {
            let d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
            d.drawdown = flipDrawdown(d.drawdown, true);
            this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
            d.gen_name = this.formatName(child_input.drafts, "fhoriz");
            return d;
        
           
           
            
          });
          
          return  Promise.resolve(outputs);
      }
    }

    const flipy: Operation = {
      name: 'flip vert',
      displayname: 'flip vert',
      old_names:[],
      dx: 'generates an output that is the top-bottom mirror of the input',
      params: [],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to flip vertically',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>)=> {
        const parent_input = op_inputs.find(el => el.op_name == 'flip vert');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        if(child_input === undefined) return Promise.resolve([]);


          const outputs:Array<Draft> =child_input.drafts.map(input => {
          const d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
          d.drawdown = flipDrawdown(d.drawdown, false);
          this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
          d.gen_name = this.formatName(child_input.drafts, "fvert");
          return d;
        });
        return  Promise.resolve(outputs);
      }
    }

    const shiftx: Operation = {
      name: 'shift left',
      displayname: 'shift left',
      old_names:[],
      dx: 'generates an output that is shifted left by the number of warps specified in theop_input.drafts',
      params: <Array<NumParam>>[
        {name: 'amount',
        type: 'number',
        min: 1,
        max: 100,
        value: 1,
        dx: 'the amount of warps to shift by'
        }
      ],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to shift',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>)=> {
        const parent_input = op_inputs.find(el => el.op_name == 'shift left');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        if(child_input === undefined) return Promise.resolve([]);


        
          const outputs:Array<Draft> =child_input.drafts.map(input => {
          const d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
          d.drawdown = shiftDrawdown(d.drawdown, false, parent_input.params[0]);
          this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
          d.gen_name = this.formatName(child_input.drafts, "shiftx");
        
          return d;
        });
        return  Promise.resolve(outputs);
      }
    }

    const shifty: Operation = {
      name: 'shift up',
      displayname: 'shift up',
      old_names:[],
      dx: 'generates an output that is shifted up by the number of wefts specified in theop_input.drafts',
      params: <Array<NumParam>>[
        {name: 'amount',
        type: 'number',
        min: 1,
        max: 100,
        value: 1,
        dx: 'the number of wefts to shift by'
        }
      ],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to shift',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'shift up');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        if(child_input === undefined) return Promise.resolve([]);


        
          const outputs:Array<Draft> =child_input.drafts.map(input => {
          const d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
          d.drawdown = shiftDrawdown(d.drawdown, true, parent_input.params[0]);
          this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
          d.gen_name = this.formatName(child_input.drafts, "shifty");
        
          return d;
        });
        return  Promise.resolve(outputs);
      }
    }

    const slope: Operation = {
      name: 'slope',
      displayname: 'slope',
      old_names:[],
      dx: 'offsets every nth row by the vaule given in col',
      params: <Array<NumParam>>[
        {name: 'col shift',
        type: 'number',
        min: -100,
        max: 100,
        value: 1,
        dx: 'the amount to shift rows by'
        },
        {
        name: 'row shift (n)',
        type: 'number',
        min: 0,
        max: 100,
        value: 1,
        dx: 'describes how many rows we should apply the shift to'
        }
      ],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to slope',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'slope');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        if(child_input === undefined) return Promise.resolve([]);

          const outputs:Array<Draft> =child_input.drafts.map(input => {
          const d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown)});
          for(let i = 0; i < wefts(d.drawdown); i++){
            
              let i_shift: number = (parent_input.params[1] === 0) ? 0 : Math.floor(i/parent_input.params[1]);
              for(let j = 0; j <warps(d.drawdown); j++){
                let j_shift: number =parent_input.params[0]*-1;
                let shift_total = (i_shift * j_shift)%warps(d.drawdown);
                if(shift_total < 0) shift_total += warps(d.drawdown);
                
                d.drawdown[i][j].setHeddle(input.drawdown[i][(j+shift_total)%warps(d.drawdown)].getHeddle());
                
              }
            }
            this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
            d.gen_name = this.formatName(child_input.drafts, "slope");
          return d;
        });
        return  Promise.resolve(outputs);
      }
    }


    const replicate: Operation = {
      name: 'mirror',
      displayname: 'mirror',
      old_names:[],
      dx: 'generates an linked copy of the input draft, changes to the input draft will then populate on the replicated draft',
      params: <Array<NumParam>>[ {
        name: 'copies',
        type: 'number',
        min: 1,
        max: 100,
        value: 1,
        dx: 'the number of mirrors to produce'
      }],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to mirror',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        
        const parent_input = op_inputs.find(el => el.op_name == 'mirror');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        if(child_input === undefined) return Promise.resolve([]);


        let outputs:Array<Draft> = [];

        for(let i = 0; i <parent_input.params[0]; i++){
            const ds:Array<Draft> =child_input.drafts.map(input => {
              const d: Draft =initDraftWithParams(
                {warps: warps(input.drawdown), 
                  wefts: wefts(input.drawdown), 
                  pattern: input.drawdown,
                  rowShuttleMapping: input.rowShuttleMapping,
                  rowSystemMapping: input.rowSystemMapping,
                  colShuttleMapping: input.colShuttleMapping,
                  colSystemMapping: input.colSystemMapping
                });
                d.gen_name = this.formatName([input], "mirror");
              return d;
            });
            outputs = outputs.concat(ds);
        }
        return  Promise.resolve(outputs);
      }
    }

    const variants: Operation = {
      name: 'variants',
      displayname: 'variants',
      old_names:[],
      dx: 'for any input draft, create the shifted and flipped values as well',
      params: [],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to create varients of',
        num_drafts: 1
      }], 
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'variants');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        if(child_input === undefined) return Promise.resolve([]);

        const functions: Array<Promise<Array<Draft>>> = [
        (<Operation>this.getOp('flip horiz')).perform([{op_name:"", drafts: child_input.drafts,inlet: 0,params: parent_input.params}]),
        (<Operation>this.getOp('invert')).perform([{op_name:"", drafts: child_input.drafts,inlet: 0,params: parent_input.params}])
      ];

        for(let i = 1; i < warps(child_input.drafts[0].drawdown); i+=2){
          functions.push( (<Operation>this.getOp('shift left')).perform([{op_name:"", drafts: child_input.drafts,inlet: 0, params: parent_input.params[i]}]));
        }

        for(let i = 1; i < wefts(child_input.drafts[0].drawdown); i+=2){
          functions.push( (<Operation>this.getOp('shift up')).perform([{op_name:"", drafts: child_input.drafts,inlet: 0, params: parent_input.params[i]}]))
        }
        return Promise.all(functions)
        .then(allDrafts => allDrafts
          .reduce((acc, drafts) => acc.concat(drafts), [])
         )        
      }


    }

    const bindweftfloats: Operation = {
      name: 'bind weft floats',
      displayname: 'bind weft floats',
      old_names:[],
      dx: 'adds interlacements to weft floats over the user specified length',
      params: <Array<NumParam>>[
        {name: 'length',
        type: 'number',
        min: 1,
        max: 100,
        value: 10,
        dx: 'the maximum length of a weft float'
        }
      ],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to bind',
        num_drafts: 1
      },
      {
        name: 'binding pattern', 
        type: 'static',
        value: null,
        dx: 'the draft to bind',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        const op_input = op_inputs[0];

          const outputs:Array<Draft> =op_input.drafts.map(input => {
          const d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
          let float: number = 0;
          let last:boolean = false;
          d.drawdown.forEach(row => {
            float = 0;
            last = null;
            row.forEach(c => {

              if(c.getHeddle == null) float = 0;
              if(last != null && c.getHeddle() == last) float++;

              if(float >=op_input.params[0]){
                c.toggleHeddle();
                float = 0;
              }
              last = c.getHeddle();
            });
          });
          this.transferSystemsAndShuttles(d,op_input.drafts,op_input.params, 'first');
          d.gen_name = this.formatName(op_input.drafts, "bindweft");
          return d;
        });
        return  Promise.resolve(outputs);
      }
    }

    const bindwarpfloats: Operation = {
      name: 'bind warp floats',
      displayname: 'bind warp floats',
      old_names:[],
      dx: 'adds interlacements to warp floats over the user specified length',
      params: <Array<NumParam>>[
        {name: 'length',
        type: 'number',
        min: 1,
        max: 100,
        value: 10,
        dx: 'the maximum length of a warp float'
        }
      ],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to bind',
        num_drafts: 1
      }], 
      perform: (op_inputs: Array<OpInput>) => {
        const op_input = op_inputs[0];

          const outputs:Array<Draft> =op_input.drafts.map(input => {
          const d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
          let float: number = 0;
          let last:boolean = false;

          for(let j = 0; j < warps(d.drawdown); j++){
            const col: Array<Cell> = d.drawdown.map(row => row[j]);
            float = 0;
            last = null;
            col.forEach(c => {

              if(c.getHeddle == null) float = 0;
              if(last != null && c.getHeddle() == last) float++;

              if(float >=op_input.params[0]){
                c.toggleHeddle();
                float = 0;
              }
              last = c.getHeddle();
            });
          }

          return d;
        });
        return  Promise.resolve(outputs);
      }
    }

    const layer: Operation = {
      name: 'layer',
      displayname: 'layer',
      old_names:[],
      dx: 'creates a draft in which each input is assigned to a layer in a multilayered structure, assigns 1 to top layer and so on',
      params: [],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the drafts to layer (from top to bottom)',
        num_drafts: -1
      }],
      perform: (op_inputs: Array<OpInput>)=> {
        const parent_input = op_inputs.find(el => el.op_name == 'layer');
        const child_inputs = op_inputs.filter(el => el.op_name == 'child');

        if(child_inputs === undefined) return Promise.resolve([]);
        const alldrafts = child_inputs.map(el => el.drafts[0]);

        const layers =alldrafts.length;
        if(layers == 0) return Promise.resolve([]);


        const all_wefts = alldrafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
        const total_wefts = utilInstance.lcm(all_wefts);
      
        const all_warps = alldrafts.map(el => warps(el.drawdown)).filter(el => el > 0);
        const total_warps = utilInstance.lcm(all_warps);
      
        const d: Draft =initDraftWithParams({warps: total_warps*layers, wefts: total_wefts*layers});
        for(let i = 0; i < wefts(d.drawdown); i++){
          const select_array = i%layers;
          const adj_i = (Math.floor(i/layers))%wefts(alldrafts[select_array].drawdown);
          for(let j = 0; j < warps(d.drawdown); j++){
            const adj_j = (Math.floor(j/layers))%warps(alldrafts[select_array].drawdown);
            if(select_array === j%layers){
              d.drawdown[i][j] = new Cell (alldrafts[select_array].drawdown[adj_i][adj_j].getHeddle());
            }else{
              const val = (j%layers < select_array) ? true : false;
              d.drawdown[i][j] = new Cell(val);
            }

          }
        }
      

        this.transferSystemsAndShuttles(d,alldrafts,parent_input.params, 'layer');
        d.gen_name = this.formatName(alldrafts, "layer");
        return Promise.resolve([d]);
      }
          
    }
      
    

    const assignlayers: DynamicOperation = {
      name: 'assignlayers',
      displayname: 'assign drafts to layers',
      old_names:[],
      dx: 'when given a number of layers, it creates inputs to assign one or more drafts to each the specified layer. You are allowed to specify a weft system with the input to each layer, this controls the ordering of the input drafts in the layers. For instance, if you give layer 1 system a, and layer 2 system b, your output draft will order the rows ababab.... If you give two inputs to layer 1 and assign them to system a, then one input layer 2, and give it system b, the output will order the rows aabaab. This essentially allows you to control weft systems at the same time as layers, aligning weft systems across multiple drafts. Systems will always be organized alphbetically, and blank rows will be inserted in place of unused systems. For instance, if you have two layers and you assign them to systems a and c, the code will insert a blank system b for the resulting pattern of abcabcabc....',
      dynamic_param_type: 'system',
      dynamic_param_id: 0,
      inlets: [],
      params: [
        <NumParam>{name: 'layers',
          type: 'number',
          min: 1,
          max: 100,
          value: 2,
          dx: 'the total number of layers in this cloth'
        },
        <BoolParam>{name: 'repeat',
          type: 'boolean',
          value: 1,
          truestate: 'repeat inputs to matching size',
          falsestate: 'do not repeat inputs to matching size',
          dx: 'automatically adjust the width and height of draft to ensure equal repeats (checked) or just assign to layers directly as provided'
        }
      ],
      perform: (op_inputs: Array<OpInput>)=> {
          

        //split the inputs into the input associated with 
        const parent_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "assignlayers");
        const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");
        
        //parent param
        const num_layers = parent_inputs[0].params[0];
        const factor_in_repeats = parent_inputs[0].params[1];


        //now just get all the drafts
        const all_drafts: Array<Draft> = child_inputs.reduce((acc, el) => {
           el.drafts.forEach(draft => {acc.push(draft)});
           return acc;
        }, []);

      
        if(all_drafts.length === 0) return Promise.resolve([]);
        
        let total_wefts: number = 0;
        const all_wefts = all_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
        if(factor_in_repeats === 1)  total_wefts = utilInstance.lcm(all_wefts);
        else  total_wefts = utilInstance.getMaxWefts(all_drafts);

        let total_warps: number = 0;
        const all_warps = all_drafts.map(el => warps(el.drawdown)).filter(el => el > 0);
        if(factor_in_repeats === 1)  total_warps = utilInstance.lcm(all_warps);
        else  total_warps = utilInstance.getMaxWarps(all_drafts);


        const layer_draft_map: Array<any> = child_inputs.map((el, ndx) => { return {layer: el.inlet, system: el.params[0], drafts: el.drafts}}); 

        const max_system = layer_draft_map.reduce((acc, el) => {
          if(el.system > acc) return el.system;
          return acc;
        }, 0);

      


        const outputs = [];
        const warp_systems = [];


        //create a list of systems as large as the total number of layers
        for(let n = 0;  n < num_layers; n++){
          const sys = ss.getWarpSystem(n);
          if(sys === undefined) ss.addWarpSystemFromId(n);
          warp_systems[n] = n;
        }

        const layer_draft_map_sorted = [];
        //sort the layer draft map by system, push empty drafts
        for(let i = 0; i <= max_system; i++){
          const ldms:Array<any> = layer_draft_map.filter(el => el.system == i);
          if(ldms.length == 0){
            layer_draft_map_sorted.push({layer: -1, system: i, drafts:[]})
          }else{
            ldms.forEach(ldm => {layer_draft_map_sorted.push(ldm);})
          }
        }


        layer_draft_map_sorted.forEach(layer_map => {

          const layer_num = layer_map.layer;
          if(layer_num < 0){
            outputs.push(initDraftWithParams(
              {warps: total_warps*warp_systems.length, 
                wefts: total_wefts,
                rowSystemMapping: [layer_map.system]}));
          }else{
            layer_map.drafts.forEach(draft => {
              const d:Draft =initDraftWithParams({
                warps:total_warps*warp_systems.length, 
                wefts:total_wefts, 
                rowShuttleMapping:draft.rowShuttleMapping, 
                rowSystemMapping: [layer_map.system],
                colShuttleMapping: draft.colShuttleMapping,
                colSystemMapping: warp_systems});
          
                d.drawdown.forEach((row, i) => {
                  row.forEach((cell, j)=> {
                    const sys_id = j % num_layers;
                    const use_col = sys_id === layer_num;
                    const use_index = Math.floor(j /num_layers);
                    if(use_col){
                        //handle non-repeating here if we want
                        if(factor_in_repeats == 1){
                          d.colShuttleMapping[j] =draft.colShuttleMapping[use_index%warps(draft.drawdown)];
                          cell.setHeddle(draft.drawdown[i%wefts(draft.drawdown)][use_index%warps(draft.drawdown)].getHeddle());
                        }else{
                          if(i < wefts(draft.drawdown) && use_index < warps(draft.drawdown)) cell.setHeddle(draft.drawdown[i][use_index].getHeddle());
                          else cell.setHeddle(null);
                        }
                      
                    }else{
                      if(sys_id < layer_num){
                        cell.setHeddle(true);
                      }else if(sys_id >=layer_num){
                        cell.setHeddle(false);
                      }
                    }
                  })
                });
                d.gen_name = this.formatName([draft], "");
                outputs.push(d);

            })

          }
      });

      //outputs has all the drafts now we need to interlace them (all layer 1's then all layer 2's)
      const pattern: Array<Array<Cell>> = [];
      const row_sys_mapping: Array<number> = [];
      const row_shut_mapping: Array<number> = [];
      for(let i = 0; i < total_wefts * outputs.length; i++){
        pattern.push([]);
        const use_draft_id = i % outputs.length;
        const use_row = Math.floor(i / outputs.length);
        row_sys_mapping.push(outputs[use_draft_id].rowSystemMapping[use_row])
        row_shut_mapping.push(outputs[use_draft_id].rowShuttleMapping[use_row])
        for(let j = 0; j < total_warps * warp_systems.length; j++){
          const val:boolean = outputs[use_draft_id].drawdown[use_row][j].getHeddle();
          pattern[i].push(new Cell(val));
        }
      }



      const interlaced =initDraftWithParams({
        warps: total_warps * warp_systems.length,
        wefts: total_wefts * outputs.length,
        colShuttleMapping: outputs[0].colShuttleMapping,
        colSystemMapping: warp_systems,
        pattern: pattern,
        rowSystemMapping: row_sys_mapping,
        rowShuttleMapping: row_shut_mapping
      })
     
        
      interlaced.gen_name = this.formatName(outputs, "layer");
      return Promise.resolve([interlaced]);

      }
      
    }


    const imagemap: DynamicOperation = {
      name: 'imagemap',
      displayname: 'image map',
      old_names:[],
      dx: 'uploads an image and creates an input for each color found in the image. Assigning a draft to the color fills the color region with the selected draft',
      dynamic_param_type: 'color',
      dynamic_param_id: 0,
      inlets: [],
      params: <Array<NumParam>>[
          {name: 'image file (.jpg or .png)',
          type: 'file',
          min: 1,
          max: 100,
          value: 'noinput',
          dx: 'the total number of layers in this cloth'
        },
        {name: 'draft width',
        type: 'number',
        min: 1,
        max: 10000,
        value: 300,
        dx: 'resize the input image to the width specified'
      },
        {name: 'draft height',
        type: 'number',
        min: 1,
        max: 10000,
        value: 200,
        dx: 'resize the input image to the height specified'
    }
      ],
      perform: (op_inputs: Array<OpInput>)=> {
          
        //split the inputs into the input associated with 
        const parent_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "imagemap");
        const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");

        const image_data = this.is.getImageData(parent_inputs[0].params[0]);
        const res_w = parent_inputs[0].params[1];
        const res_h = parent_inputs[0].params[2];


        if(image_data === undefined) return Promise.resolve([]);
        const data = image_data.data;

        //we need to flip the image map here because it will be flipped back on return. 

        const fliped_image = [];
        data.image_map.forEach(row => {
          fliped_image.unshift(row);
        })


        const color_to_drafts = data.colors.map((color, ndx) => {
          const child_of_color = child_inputs.find(input => (input.params.findIndex(param => param === color) !== -1));
          if(child_of_color === undefined) return {color: color, draft: null};
          else return {color: color, draft: child_of_color.drafts[0]};
        });


        const pattern: Array<Array<Cell>> = [];
        for(let i = 0; i < res_h; i++){
          pattern.push([]);
          for(let j = 0; j < res_w; j++){

            const i_ratio = data.height / res_h;
            const j_ratio = data.width / res_w;

            const map_i = Math.floor(i * i_ratio);
            const map_j = Math.floor(j * j_ratio);

            const color_ndx = fliped_image[map_i][map_j]; //
            const color_draft = color_to_drafts[color_ndx].draft;

            if(color_draft === null) pattern[i].push(new Cell(false));
            else {
              const draft_i = i % wefts(color_draft.drawdown);
              const draft_j = j % warps(color_draft.drawdown);
              pattern[i].push(new Cell(color_draft.drawdown[draft_i][draft_j].getHeddle()));
            }

          }
        }

        

        let first_draft: Draft = null;
        child_inputs.forEach(el =>{
          if(el.drafts.length > 0 && first_draft == null) first_draft = el.drafts[0];
        });

        if(first_draft == null) first_draft =initDraftWithParams({warps: 1, wefts: 1, pattern: [[new Cell(null)]]})

        

        const draft: Draft =initDraftWithParams({
          wefts: res_h, 
          warps: res_w,
           pattern: pattern,
          rowSystemMapping: first_draft.rowSystemMapping,
          rowShuttleMapping: first_draft.rowShuttleMapping,
          colSystemMapping: first_draft.colSystemMapping,
          colShuttleMapping: first_draft.colShuttleMapping});

      return Promise.resolve([draft]);

      }
      
    }

  
    const tile: Operation = {
      name: 'tile',
      displayname: 'tile',
      dx: 'repeats this block along the warp and weft',
      old_names:[],
      params: <Array<NumParam>>[
        {name: 'warp-repeats',
        type: 'number',
        min: 1,
        max: 100,
        value: 2,
        dx: 'the number of times to repeat this time across the width'
        },
        {name: 'weft-repeats',
        type: 'number',
        min: 1,
        max: 100,
        value: 2,
        dx: 'the number of times to repeat this time across the length'
        }
      ],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to tile',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        //split the inputs into the input associated with 
        const parent_input = op_inputs.find(el => el.op_name === "tile");
        const child_input = op_inputs.find(el => el.op_name === "child");
        
        if(child_input === undefined) return Promise.resolve([]);

        const outputs:Array<Draft> =child_input.drafts.map(input => {
          const width: number =parent_input.params[0]*warps(input.drawdown);
          const height: number =parent_input.params[1]*wefts(input.drawdown);

          const d: Draft =initDraftWithParams({warps: width, wefts: height, pattern: input.drawdown});

          this.transferSystemsAndShuttles(d,child_input.drafts,parent_input.params, 'first');
          d.gen_name = this.formatName(child_input.drafts, "tile");
          return d;
        });

      
        return Promise.resolve(outputs);
      }
          
    }

    const erase_blank: Operation = {
      name: 'erase blank rows',
      displayname: 'erase blank rows',
      old_names:[],
      dx: 'erases any rows that are entirely unset',
      params: [],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to erase blank rows from',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name === "erase blank rows");
        const child_input = op_inputs.find(el => el.op_name === "child");
        
        if(child_input === undefined) return Promise.resolve([]);

        const rows_out =child_input.drafts[0].drawdown.reduce((acc, el, ndx) => {
          if(!utilInstance.hasOnlyUnset(el)) acc++;
          return acc;
        }, 0);

        const out =initDraftWithParams({wefts: rows_out, warps: warps(child_input.drafts[0].drawdown), colShuttleMapping:child_input.drafts[0].colShuttleMapping, colSystemMapping:child_input.drafts[0].colSystemMapping});
        let ndx = 0;
        child_input.drafts[0].drawdown.forEach((row, i) => {
          if(!utilInstance.hasOnlyUnset(row)){
            row.forEach((cell, j) => {
              out.drawdown[ndx][j].setHeddle(cell.getHeddle()); 
            });
            out.rowShuttleMapping[ndx] =child_input.drafts[0].rowShuttleMapping[i];
            out.rowSystemMapping[ndx] =child_input.drafts[0].rowSystemMapping[i];
            ndx++;
          }
        })

        return Promise.resolve([out]);
        
      }
    }


    const jointop: Operation = {
      name: 'join top',
      displayname: 'join top',
      old_names:[],
      dx: 'attachesop_input.drafts toether into one draft in a column orientation',
      params: [ 
        <BoolParam>{name: 'repeat',
        type: 'boolean',
        falsestate: 'do not repeat inputs to match size',
        truestate: 'repeat inputs to match size',
        value: 1,
        dx: "controls if the inputs are repeated along the width so they repeat in even intervals"
    }],
      inlets: [{
        name: 'drafts', 
        type: 'static',
        value: null,
        dx: 'the drafts you would like to join vertically',
        num_drafts: -1
      },
      {
        name: 'warp pattern', 
        type: 'static',
        value: null,
        dx: 'optional, define a custom warp material or system pattern here',
        num_drafts: -1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name === "join top");
        const child_input = op_inputs.find(el => el.op_name === "child");
        const drafts_in = op_inputs.filter(el => el.inlet == 0);
        const warp_system = op_inputs.find(el => el.inlet == 1);
        const factor_in_repeats = parent_input.params[0];

        if(child_input === undefined || drafts_in == undefined) return Promise.resolve([]);
        
        let warp_mapping;
        if(warp_system === undefined) warp_mapping =initDraftWithParams({warps: 1, wefts:1});
        else warp_mapping = warp_system.drafts[0];
    
        const all_drafts = drafts_in.map(el => el.drafts[0])

        const total_wefts:number =all_drafts.reduce((acc, draft)=>{
            return acc + wefts(draft.drawdown);
        }, 0);

        let total_warps: number = 0;
        const all_warps = all_drafts.map(el => warps(el.drawdown)).filter(el => el > 0);
        if(factor_in_repeats === 1) total_warps = utilInstance.lcm(all_warps);
        else  total_warps = utilInstance.getMaxWarps(all_drafts);


        const d: Draft =initDraftWithParams(
          {warps: total_warps, 
          wefts: total_wefts,
          colSystemMapping: warp_mapping.colSystemMapping,
          colShuttleMapping: warp_mapping.colShuttleMapping
          });


          let i = 0;
          all_drafts.forEach((draft) => {

            draft.drawdown.forEach((row, row_ndx) => {
              for(let j = 0; j < total_warps; j++){
                const adj_j = j % warps(draft.drawdown); 
                const repeats = Math.floor(j / warps(draft.drawdown));
                d.rowShuttleMapping[i] = draft.rowShuttleMapping[row_ndx];
                d.rowSystemMapping[i] = draft.rowSystemMapping[row_ndx];
                if(factor_in_repeats){
                  d.drawdown[i][j] = new Cell(draft.drawdown[row_ndx][adj_j].getHeddle());
                }else{
                  if(repeats == 0) d.drawdown[i][j] = new Cell(draft.drawdown[row_ndx][j].getHeddle());
                  else d.drawdown[i][j] = new Cell(null);
                }
              }
              i++;
            });

          })



        d.gen_name = this.formatName(child_input.drafts, "top");
        return Promise.resolve([d]);
        
      }
    }


    const joinleft: Operation = {
      name: 'join left',
      displayname: 'join left',
      old_names:[],
      dx: 'joins drafts together from left to right',
      params: [ 
        <BoolParam>{name: 'repeat',
        type: 'boolean',
        falsestate: 'do not repeat inputs to match size',
        truestate: 'repeat inputs to match size',
        value: 1,
        dx: "controls if the inputs are repeated along the width so they repeat in even intervals"
    }],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to join horizontally',
        num_drafts: -1
      },{

        name: 'weft pattern', 
        type: 'static',
        value: null,
        dx: 'optional, define a custom weft material or system pattern here',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {

        const parent_input = op_inputs.find(el => el.op_name === "join left");
        const child_input = op_inputs.find(el => el.op_name === "child");
        const drafts_in = op_inputs.filter(el => el.inlet == 0);
        const warp_system = op_inputs.find(el => el.inlet == 1);
        const factor_in_repeats = parent_input.params[0];

        if(child_input === undefined || drafts_in == undefined) return Promise.resolve([]);
        
        let weft_mapping;
        if(warp_system === undefined) weft_mapping =initDraftWithParams({warps: 1, wefts:1});
        else weft_mapping = warp_system.drafts[0];
    
        const all_drafts = drafts_in.map(el => el.drafts[0])

        const total_warps:number =all_drafts.reduce((acc, draft)=>{
            return acc + warps(draft.drawdown);
        }, 0);

        let total_wefts: number = 0;
        const all_wefts = all_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
        if(factor_in_repeats === 1) total_wefts = utilInstance.lcm(all_wefts);
        else  total_wefts = utilInstance.getMaxWefts(all_drafts);


        const d: Draft =initDraftWithParams(
          {warps: total_warps, 
          wefts: total_wefts,
          rowSystemMapping: weft_mapping.rowSystemMapping,
          rowShuttleMapping: weft_mapping.rowShuttleMapping
          });


        for(let i = 0; i < total_wefts; i++){
           
          const combined_rows: Array<Cell> =all_drafts.reduce((acc, draft) => {
             
              let  r: Array<Cell> = [];
              //if the draft doesn't have this row, just make a blank one
              if(i >= wefts(draft.drawdown) && factor_in_repeats == 0){
                const nd =initDraftWithParams({warps: warps(draft.drawdown), wefts: 1});
                nd.drawdown[0].forEach(el => el.setHeddle(null));
                r = nd.drawdown[0];
              }
              else {
                r =  draft.drawdown[i%wefts(draft.drawdown)];
              } 
              
              return acc.concat(r);
            }, []);
            
            combined_rows.forEach((cell,j) => {
              d.drawdown[i][j].setHeddle(cell.getHeddle());
            });
        }
      
        d.colSystemMapping =all_drafts.reduce((acc, draft) => {
          return acc.concat(draft.colSystemMapping);
        }, []);

        d.colShuttleMapping =all_drafts.reduce((acc, draft) => {
          return acc.concat(draft.colShuttleMapping);
        }, []);
             

        d.gen_name = this.formatName(all_drafts, "left");

        return Promise.resolve([d]);
        
      }
    }

    const dynamic_join_left: DynamicOperation = {
      name: 'dynamicjoinleft',
      displayname: 'subdivide width',
      old_names:[],
      dynamic_param_id: 0,
      dynamic_param_type: "number",
      dx: 'subdivides the width of the weave into equal sized sections, then, takes each input draft and assign it a division from left to right',
      params: <Array<NumParam>>[   
        {name: 'divisions',
        type: 'number',
        min: 1,
        max: 100,
        value: 3,
        dx: 'the number of equally sized divisions to include in the draft'
    },
    {name: 'width',
      type: 'number',
      min: 1,
      max: 10000,
      value: 100,
      dx: 'the total width of the draft'
    }],
    inlets: [
      {
        name: 'weft pattern', 
        type: 'static',
        value: null,
        dx: 'optional, define a custom weft material or system pattern here',
        num_drafts: 1
      }
    ],
      perform: (op_inputs: Array<OpInput>) => {
      
        //split the inputs into the input associated with 
        const parent_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "dynamicjoinleft");
        const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");
        const warp_system = op_inputs.find(el => el.inlet == 0);

          console.log("child inputs", child_inputs);

        let weft_mapping;
        if(warp_system === undefined) weft_mapping =initDraftWithParams({warps: 1, wefts:1});
        else weft_mapping = warp_system.drafts[0];
       
        //parent param
        const sections = parent_inputs[0].params[0];
        const total_width = parent_inputs[0].params[1];
      
        const warps_in_section = Math.ceil(total_width / sections);
      
        //now just get all the drafts, in the order of their assigned inlet
        const max_inlet = child_inputs.reduce((acc, el) => {
          if(el.inlet > acc){
            acc = el.inlet
          } 
          return acc;
        }, 0);

        const all_drafts: Array<Draft> = [];
        for(let l = 0; l <= max_inlet; l++){
          const inlet_inputs = child_inputs.filter(el => el.inlet == l);
          inlet_inputs.forEach(el => {
            all_drafts.push(el.drafts[0]);
          })
        };


       if(all_drafts.length === 0) return Promise.resolve([]);
       
       let total_warps: number = 0;
       const all_warps = all_drafts.map(el => warps(el.drawdown)).filter(el => el > 0);
        total_warps = utilInstance.lcm(all_warps);


        const section_draft_map: Array<any> = child_inputs.map(el => { return {section: el.params[0]-1, draft: el.drafts.shift()}}); 
        const d:Draft =initDraftWithParams({
          warps:total_width, 
          wefts:total_warps,
          rowShuttleMapping: weft_mapping.rowShuttleMapping,
          rowSystemMapping: weft_mapping.rowSystemMapping
         });

         d.drawdown.forEach((row, i) => {
          row.forEach((cell, j) => {
              const use_section = Math.floor(j / warps_in_section);
              const warp_in_section = j % warps_in_section;
              const use_draft_map = section_draft_map.find(el => el.section === use_section);
              if(use_draft_map !== undefined){
                const use_draft = use_draft_map.draft;
                cell.setHeddle(use_draft.drawdown[i%wefts(use_draft.drawdown)][warp_in_section%warps(use_draft.drawdown)].getHeddle());
              }
          });
         });

         d.colShuttleMapping.forEach((val, j) => {
              const use_section = Math.floor(j / warps_in_section);
              const warp_in_section = j % warps_in_section;
              const use_draft_map = section_draft_map.find(el => el.section === use_section);
              if(use_draft_map !== undefined){
                const use_draft = use_draft_map.draft;
                val = use_draft.colShuttleMapping[warp_in_section%warps(use_draft.drawdown)];
                d.colSystemMapping = use_draft.colSystemMapping[warp_in_section%warps(use_draft.drawdown)];
              }
         });



        return Promise.resolve([d]);
        
      }
    }

    const germanify: Operation = {
      name: 'gemanify',
      displayname: 'germanify',
      old_names:[],
      dx: 'uses ML to edit the input based on patterns in a german drafts weave set',
      params: <Array<NumParam>>[
        {name: 'output selection',
        type: 'number',
        min: 1,
        max: 10,
        value: 1,
        dx: 'which pattern to select from the variations'
        }
      ],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to germanify',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name === "gemanify");
        const child_input= op_inputs.find(el => el.op_name === "child");
        
        if(child_input === undefined) return Promise.resolve([]);
        const inputDraft =child_input.drafts[0]

        const loom_settings:LoomSettings = {
          type: 'frame',
          epi: 10, 
          units: 'in',
          frames: 8,
          treadles: 10
        }
        const utils = getLoomUtilByType('frame');
        return utils.computeLoomFromDrawdown(inputDraft.drawdown, loom_settings, 0).then(loom => {
          let pattern = this.pfs.computePatterns(loom.threading, loom.treadling, inputDraft.drawdown);
          const draft_seed =  utilInstance.patternToSize(pattern, 48, 48);
  
    
          return this.vae.generateFromSeed(draft_seed, 'german')
            .then(suggestions => suggestions.map(suggestion => {
                    const treadlingSuggest = this.pfs.getTreadlingFromArr(suggestion);
                    const threadingSuggest = this.pfs.getThreadingFromArr(suggestion);
                    const pattern = this.pfs.computePatterns(threadingSuggest, treadlingSuggest, suggestion)
                    const draft:Draft =initDraftWithParams({warps: pattern[0].length, wefts: pattern.length});
                      for (var i = 0; i < pattern.length; i++) {
                        for (var j = 0; j < pattern[i].length; j++) {
                            draft.drawdown[i][j].setHeddle((pattern[i][j] == 1 ? true : false));
                        }
                      }
  
                      this.transferSystemsAndShuttles(draft,child_input.drafts,parent_input.params, 'first');
                      draft.gen_name = this.formatName(child_input.drafts, "germanify");
                    return draft
                  
                  })
                )

        });

       
       
        }
      }  
      const crackleify: Operation = {
        name: 'crackle-ify',
        displayname: 'crackle-ify',
        old_names:[],
        dx: 'uses ML to edit the input based on patterns in a german drafts weave set',
        params: <Array<NumParam>>[
          {name: 'output selection',
          type: 'number',
          min: 1,
          max: 10,
          value: 1,
          dx: 'which pattern to select from the variations'
          }
        ],
        inlets: [{
          name: 'draft', 
          type: 'static',
          value: null,
          dx: 'the draft to craclify',
          num_drafts: 1
        }],
        perform: (op_inputs: Array<OpInput>) => {
          const parent_input = op_inputs.find(el => el.op_name === "crackle-ify");
          const child_input= op_inputs.find(el => el.op_name === "child");
          if(child_input === undefined) return Promise.resolve([]);

          if(child_input.drafts.length === 0) return Promise.resolve([]);
          const inputDraft =child_input.drafts[0]

          const loom_settings:LoomSettings = {
            type: 'frame',
            epi: 10, 
            units: 'in',
            frames: 8,
            treadles: 10
          }
          const utils = getLoomUtilByType('frame');
          return utils.computeLoomFromDrawdown(inputDraft.drawdown, loom_settings,  0).then(loom => {
            let pattern = this.pfs.computePatterns(loom.threading, loom.treadling, inputDraft.drawdown);
        
            const draft_seed =  utilInstance.patternToSize(pattern, 52, 52);
      
            return this.vae.generateFromSeed(draft_seed, 'crackle_weave')
              .then(suggestions => suggestions.map(suggestion => {
               
                const treadlingSuggest = this.pfs.getTreadlingFromArr(suggestion);
                const threadingSuggest = this.pfs.getThreadingFromArr(suggestion);
                const pattern = this.pfs.computePatterns(threadingSuggest, treadlingSuggest, suggestion)
                const draft:Draft =initDraftWithParams({warps: pattern[0].length, wefts: pattern.length});
                  for (var i = 0; i < pattern.length; i++) {
                    for (var j = 0; j < pattern[i].length; j++) {
                        draft.drawdown[i][j].setHeddle((pattern[i][j] == 1 ? true : false));
                    }
                  }
                  // this.transferSystemsAndShuttles(draft,child_input.drafts,parent_input.params, 'first');
                  // draft.gen_name = this.formatName(child_input.drafts, "crackleify");
                return draft
              }));
                    
               
            });  
        }
      }  
        
        
    const makeloom: Operation = {
      name: 'floor loom',
      displayname: 'shaft/treadle loom',
      old_names:[],
      dx: 'uses the input draft as drawdown and generates a threading, tieup and treadling pattern',
      params: [],
      inlets: [{
        name: 'drawdown', 
        type: 'static',
        value: null,
        dx: 'the drawdown from which to create threading, tieup and treadling data from',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {

        const parent_input = op_inputs.find(el => el.op_name === "floor loom");
        const child_input= op_inputs.find(el => el.op_name === "child");

        if(child_input === undefined || child_input.drafts === undefined) return Promise.resolve([]);

      
        const loom_settings:LoomSettings = {
          type: 'frame',
          epi: 10, 
          units: 'in',
          frames: 8,
          treadles: 10
        }
        const utils = getLoomUtilByType(loom_settings.type);
        return utils.computeLoomFromDrawdown(child_input.drafts[0].drawdown, loom_settings, this.ws.selected_origin_option)
        .then(l => {

          const frames = Math.max(numFrames(l), loom_settings.frames);
          const treadles = Math.max(numTreadles(l), loom_settings.treadles);
       
          const threading: Draft =initDraftWithParams({warps:warps(child_input.drafts[0].drawdown), wefts: frames});
        l.threading.forEach((frame, j) =>{
          if(frame !== -1) threading.drawdown[frame][j].setHeddle(true);
        });
        threading.gen_name = "threading"+getDraftName(child_input.drafts[0]);

        const treadling: Draft =initDraftWithParams({warps:treadles, wefts:wefts(child_input.drafts[0].drawdown)});   
        l.treadling.forEach((treadle_row, i) =>{
          treadle_row.forEach(treadle_num => {
            treadling.drawdown[i][treadle_num].setHeddle(true);
          })
        });
        treadling.gen_name = "treadling_"+getDraftName(child_input.drafts[0]);


        const tieup: Draft =initDraftWithParams({warps: treadles, wefts: frames});
        l.tieup.forEach((row, i) => {
          row.forEach((val, j) => {
            tieup.drawdown[i][j].setHeddle(val);
          })
        });
        tieup.gen_name = "tieup_"+getDraftName(child_input.drafts[0]);
        return Promise.resolve([threading, tieup, treadling]);



        });

      }


    }

    const drawdown: Operation = {
      name: 'drawdown',
      displayname: 'drawdown',
      old_names:[],
      dx: 'create a drawdown from the input drafts (order 1. threading, 2. tieup, 3.treadling)',
      params: [
  
      ],
      inlets: [{
        name: 'threading', 
        type: 'static',
        value: null,
        dx: 'the draft to use as threading',
        num_drafts: 1
      }, {
        name: 'tieup', 
        type: 'static',
        value: null,
        dx: 'the draft to use as tieup',
        num_drafts: 1
      },
      {
        name: 'treadling', 
        type: 'static',
        value: null,
        dx: 'the draft to use as treadling',
        num_drafts: 1
      }
      ],
      perform: (op_inputs: Array<OpInput>) => {
  
        const parent_input = op_inputs.find(el => el.op_name === "floor loom");
        const child_input= op_inputs.find(el => el.op_name === "child");
        const threading_inlet = op_inputs.find(el => el.inlet === 0);
        const tieup_inlet = op_inputs.find(el => el.inlet === 1);
        const treadling_inlet = op_inputs.find(el => el.inlet === 2);
  
  
  
        if(child_input === undefined 
          || threading_inlet === undefined
          || tieup_inlet === undefined
          || treadling_inlet == undefined) return Promise.resolve([]);
  
        const threading_draft = treadling_inlet.drafts[0];
        const tieup_draft = tieup_inlet.drafts[0];
        const treadling_draft = treadling_inlet.drafts[0];
  
        
        const threading: Array<number> = [];
        for(let j = 0; j < warps(threading_draft.drawdown); j++){
          const col: Array<Cell> = threading_draft.drawdown.reduce((acc, row, ndx) => {
            acc[ndx] = row[j];
            return acc;
          }, []);
  
          threading[j] = col.findIndex(cell => cell.getHeddle());
  
        }
      
        const treadling: Array<Array<number>> =treadling_draft.drawdown
        .map(row => [row.findIndex(cell => cell.getHeddle())]);
  
        const tieup =tieup_draft.drawdown.map(row => {
          return row.map(cell => cell.getHeddle());
        });
  
        const draft: Draft = initDraftWithParams({warps:warps(threading_draft.drawdown), wefts:wefts(treadling_draft.drawdown)});
        const utils = getLoomUtilByType('frame');
        const loom = {
          threading: threading,
          tieup: tieup,
          treadling:treadling
        }
        return utils.computeDrawdownFromLoom(loom, 0).then(drawdown => {
          draft.drawdown = drawdown;
          return Promise.resolve([draft]);

        })
       
  
        }
  
  
  
      }


    const combinatorics: Operation = {
      name: 'combos',
      displayname: 'all possible structures',
      old_names:[],
      dx: 'generates a list of all possible drafts of a given size for the user to explore',
      params: [
        <NumParam>{name: 'size',
        type: 'number',
          min: 2,
          max: 4,
        value: 3,
        dx: 'the size of the structure'
        },
        <NumParam>{name: 'selection',
        type: 'number',
          min: 1,
          max: 22874,
        value: 1,
        dx: 'the id of the generated structure you would like to view'
        },
        <BoolParam>{name: 'download all',
        type: 'boolean',
        falsestate: '',
        truestate: 'downloading',
        value: 0,
        dx: "when this is set to true, it will trigger download of an image of the whole set everytime it recomputes, this may result in multiple downloads"
        }
      ],
      inlets: [],
      perform: (op_inputs: Array<OpInput>) => {
  
        const parent_input = op_inputs.find(el => el.op_name === "combos");
        const child_input= op_inputs.find(el => el.op_name === "child");
        const size = parent_input.params[0];
        const show = parent_input.params[1]-1;
        const download = parent_input.params[2];

        //for larger set sizes, you must split up the download into multiple files
        const divisor = (size - 3 > 0) ? Math.pow(2,(size-3)): 1;

        return this.combos.getSet(size, size)
        .then(alldrafts => { 

          if(download){

            for(let set_id = 0; set_id < divisor; set_id++){
              
              const cc = 10;
              const set_data = this.combos.getDrafts(set_id, divisor);
  
              let b:HTMLCanvasElement = <HTMLCanvasElement>document.createElement('canvas'); 
              let context = b.getContext('2d');
              b.width = (cc*(size+5))*20;
              b.height = Math.ceil(set_data.length  / 20)*((5+size)*cc);
              context.fillStyle = "white";
              context.fillRect(0,0,b.width,b.height);
  
              set_data.forEach((set, ndx) => {
                
                const top = Math.floor(ndx / 20) * (wefts(set.draft.drawdown)+5)*cc + 10;
                const left = ndx % 20 * (warps(set.draft.drawdown)+5)*cc + 10; 
                
                context.font = "8px Arial";
                context.fillStyle = "#000000"
                context.fillText((set.id+1).toString(),left, top-2,size*cc)
                context.strokeRect(left,top,size*cc,size*cc);
  
                for (let i = 0; i < wefts(set.draft.drawdown); i++) {
                  for (let j = 0; j < warps(set.draft.drawdown); j++) {
                    this.drawCell(context, set.draft, cc, i, j, top, left);
                  }
                }            
              })
  
              // console.log("b", b);
              const a = document.createElement('a')
              a.href = b.toDataURL("image/jpg")
              a.download = "allvalid_"+size+"x"+size+"_drafts_"+set_id+".jpg";
              a.click();
            }

          }

          
          return Promise.resolve([this.combos.getDraft(show).draft]);

        })
        

       
      
  
    
      }
  
  
  
    }

    
    


    this.dynamic_ops.push(assignlayers);
    this.dynamic_ops.push(dynamic_join_left);
    this.dynamic_ops.push(imagemap);
    this.dynamic_ops.push(layernotation);
    this.dynamic_ops.push(warp_profile);
    this.dynamic_ops.push(profile);


    //**push operations that you want the UI to show as options here */
    this.ops.push(rect);
    this.ops.push(twill);
    this.ops.push(complextwill);
    this.ops.push(waffle);
    this.ops.push(satin);
    this.ops.push(tabby);
    this.ops.push(basket);
    this.ops.push(rib);
    this.ops.push(random);
    this.ops.push(interlace);
    this.ops.push(splicein);
    this.ops.push(spliceinwarps);
    this.ops.push(assignwefts);
    this.ops.push(assignwarps);
    this.ops.push(invert);
    this.ops.push(vertcut);
   this.ops.push(replicate);
    this.ops.push(flipx);
    this.ops.push(flipy);
    this.ops.push(shiftx);
    this.ops.push(shifty);
    this.ops.push(layer);
    this.ops.push(selvedge);
    // this.ops.push(bindweftfloats);
    // this.ops.push(bindwarpfloats);
    this.ops.push(joinleft);
    this.ops.push(jointop);
    this.ops.push(slope);
    this.ops.push(tile);
    this.ops.push(stretch);
    this.ops.push(resize);
    this.ops.push(margin);
    this.ops.push(clear);
    this.ops.push(set);
    this.ops.push(unset);
    this.ops.push(rotate);
    this.ops.push(makesymmetric);
    this.ops.push(fill);
    this.ops.push(overlay);
    this.ops.push(atop);
    this.ops.push(mask);
    this.ops.push(germanify);
    this.ops.push(crackleify);
    //this.ops.push(variants);
    this.ops.push(knockout);
    this.ops.push(crop);
    this.ops.push(trim);
    this.ops.push(makeloom);
    this.ops.push(drawdown);
    this.ops.push(erase_blank);
    this.ops.push(apply_mats);
    this.ops.push(combinatorics);


    //** Give it a classification here */
    this.classification.push(
      {category: 'structure',
      dx: "0-1 input, 1 output, algorithmically generates weave structures based on parameters",
      ops: [tabby, twill, satin, basket, rib, waffle, complextwill, random, combinatorics]}
    );

    this.classification.push(
      {category: 'block design',
      dx: "1 input, 1 output, describes the arragements of regions in a weave. Fills region with input draft",
      ops: [rect, crop, trim, margin, tile, warp_profile]
    }
    );
    this.classification.push(
      {category: 'transformations',
      dx: "1 input, 1 output, applies an operation to the input that transforms it in some way",
      ops: [invert, flipx, flipy, shiftx, shifty, rotate, makesymmetric, slope, stretch, resize, clear, set, unset]}
      );

    this.classification.push(
        {category: 'combine',
        dx: "2 inputs, 1 output, operations take more than one input and integrate them into a single draft in some way",
        ops: [imagemap, interlace, splicein, spliceinwarps, assignlayers, layer, layernotation,  fill, joinleft, dynamic_join_left, jointop]}
        );
    
     this.classification.push(
          {category: 'binary',
          dx: "2 inputs, 1 output, operations take twoop_input.drafts and perform binary operations on the interlacements",
          ops: [atop, overlay, mask, knockout]}
          );
    
      this.classification.push(
            {category: 'helper',
            dx: "variable inputs, variable outputs, supports common drafting requirements to ensure good woven structure",
            ops: [selvedge]}
            );


      this.classification.push(
        {category: 'machine learning',
        dx: "1 input, 1 output, experimental functions that attempt to apply a style from one genre of weaving to your draft. Currently, we have trained models on German Weave Drafts and Crackle Weave Drafts ",
        ops: [germanify, crackleify]}
      );

      this.classification.push(
        {category: 'jacquard',
        dx: "1 input, 1 output, functions designed specifically for working with jacquard-style drafting",
        ops: [assignwarps, assignwefts, erase_blank]}
      );

    this.classification.push(
      {category: 'frame loom support',
      dx: "variable input drafts, variable outputs, offer specific supports for working with frame looms",
      ops: [makeloom, drawdown]}
    );

    this.classification.push(
      {category: 'aesthetics',
      dx: "2 inputs, 1 output: applys pattern information from second draft onto the first. To be used for specifiying color repeats",
      ops: [apply_mats]}
    );

  }

  /**
   * transfers data about systems and shuttles from input drafts to output drafts. 
   * @param d the output draft
   * @param drafts the input drafts
   * @param type how to handle the transfer (first - use the first input data, interlace, layer)
   * @returns 
   */
  transferSystemsAndShuttles(d: Draft, drafts:Array<Draft>,params: any, type: string){
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
         uniqueSystemRows = this.ss.makeWeftSystemsUnique(rowSystems);
    
         rowShuttles =drafts.map(el => el.rowShuttleMapping);
         standardShuttleRows = this.ms.standardizeLists(rowShuttles);

        d.drawdown.forEach((row, ndx) => {

          const select_array: number = ndx %drafts.length; 
          const select_row: number = Math.floor(ndx /drafts.length)%wefts(drafts[select_array].drawdown);
          d.rowSystemMapping[ndx] = uniqueSystemRows[select_array][select_row];
          d.rowShuttleMapping[ndx] = standardShuttleRows[select_array][select_row];

        });

  
     
      break;


        case 'layer':
           rowSystems=drafts.map(el => el.rowSystemMapping);
           colSystems =drafts.map(el => el.colSystemMapping);
           uniqueSystemRows = this.ss.makeWeftSystemsUnique(rowSystems);
           uniqueSystemCols= this.ss.makeWarpSystemsUnique(colSystems);
      
           rowShuttles =drafts.map(el => el.rowShuttleMapping);
           colShuttles =drafts.map(el => el.colShuttleMapping);
           standardShuttleRows = this.ms.standardizeLists(rowShuttles);
           standardShuttleCols = this.ms.standardizeLists(colShuttles);
  
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

  formatName(drafts: Array<Draft>, op_name: string) : string{

    let combined: string = "";

    if(drafts.length == 0){
      combined = op_name;
    }else{

      combined =drafts.reduce((acc, el) => {
        return acc+"+"+getDraftName(el);
      }, "");
      combined = op_name+"("+combined.substring(1)+")";
    }

    return combined;
  }

  isDynamic(name: string) : boolean{
    const parent_ndx: number = this.dynamic_ops.findIndex(el => el.name === name);
    if(parent_ndx == -1) return false;
    return true;
  }

   drawCell(cx, draft, cell_size, i, j, top,  left){
    let is_up = draft.isUp(i,j);
    let color = "#ffffff"
   
    if(is_up){
      color = '#000000';
    }else{
      color = '#ffffff';
    }
    cx.fillStyle = color;
    cx.strokeStyle = '#000000';

 

    //hack, draw upside down to account for later flip
    i = (draft.wefts-1) - i;

    cx.strokeRect(left+j*cell_size, top+i*cell_size, cell_size, cell_size);
    cx.fillRect(left+j*cell_size, top+i*cell_size, cell_size, cell_size);
  }


  getOp(name: string): Operation | DynamicOperation{
    const op_ndx: number = this.ops.findIndex(el => el.name === name);
    const parent_ndx: number = this.dynamic_ops.findIndex(el => el.name === name);
    if(op_ndx !== -1) return this.ops[op_ndx];
    if(parent_ndx !== -1) return this.dynamic_ops[parent_ndx];
    return null;
  }

  hasOldName(op: Operation | DynamicOperation, name: string) : boolean {
    return (op.old_names.find(el => el === name) !== undefined );
  }

  getOpByOldName(name: string): Operation | DynamicOperation{
    const allops = this.ops.concat(this.dynamic_ops);
    const old_name = allops.filter(el => this.hasOldName(el, name));

    if(old_name.length == 0){
      return this.getOp('rectangle');
    }else{
      return old_name[0]; 
    }

  }
}
