import { Injectable } from '@angular/core';
// import { VaeService} from "../../core/provider/vae.service"
import { Draft, DynamicOperation, Operation, OperationClassification } from '../../core/model/datatypes';
import { generateMappingFromPattern, isUp, warps, wefts } from '../../core/model/drafts';
import { ImageService } from '../../core/provider/image.service';
import { MaterialsService } from '../../core/provider/materials.service';
import { PatternfinderService } from "../../core/provider/patternfinder.service";
import { SystemsService } from '../../core/provider/systems.service';
import { WorkspaceService } from '../../core/provider/workspace.service';
import { standardizeMaterialLists } from '../model/material';
import { makeWarpSystemsUnique, makeWeftSystemsUnique } from '../model/system';
import { complextwill } from '../operations/complex_twill/complex_twill';
import { deinterlace } from '../operations/deinterlace/deinterlace';
import { interlace } from '../operations/interlace/interlace';
import { interlacewarps } from '../operations/interlace_warps/interlace_warps';
import { invert } from '../operations/invert/invert';
import { notation } from '../operations/layer_notation/layer_notation';
import {random } from '../operations/random/random'
import { rect } from '../operations/rect/rect';
import { satin } from '../operations/satin/satin';
import { satinish } from '../operations/satinish/satinish';
import { tabby_der } from '../operations/tabby/tabby';
import { twill } from '../operations/twill/twill';
import { undulatingtwill } from '../operations/undulating_twill/undulating_twill';
import { combinatorics } from '../operations/combinatorics/combinatorics';



@Injectable({
  providedIn: 'root'
})
export class OperationService {

  ops: Array<Operation> = [];
  dynamic_ops: Array<DynamicOperation> = [];
  classification: Array<OperationClassification> = [];

  constructor(
    // private vae: VaeService, 
    private pfs: PatternfinderService,
    private ms: MaterialsService,
    private ss: SystemsService,
    private is: ImageService,
    private ws: WorkspaceService) { 
     

  

    
    


    // this.dynamic_ops.push(assignlayers);
    // this.dynamic_ops.push(dynamic_join_left);
    // this.dynamic_ops.push(dynamic_join_top);
    // this.dynamic_ops.push(imagemap);
    // this.dynamic_ops.push(bwimagemap);
     this.dynamic_ops.push(notation);
    // this.dynamic_ops.push(weft_profile);
    // this.dynamic_ops.push(warp_profile);
    // this.dynamic_ops.push(sample_width);
    // this.dynamic_ops.push(sample_length);


    //**push operations that you want the UI to show as options here */
    this.ops.push(rect);
    this.ops.push(twill);
    this.ops.push(complextwill);
    this.ops.push(undulatingtwill);
    // this.ops.push(waffle);
    this.ops.push(satin);
    this.ops.push(satinish);
    // this.ops.push(shaded_satin);
    // this.ops.push(tabby);
    this.ops.push(tabby_der);
    // this.ops.push(rib);
    this.ops.push(random);
    this.ops.push(interlace);
    this.ops.push(deinterlace);
    this.ops.push(interlacewarps);
    // this.ops.push(splicein);
    // this.ops.push(spliceinwarps);
    // this.ops.push(assignwefts);
    // this.ops.push(assignwarps);
   this.ops.push(invert);
  //   this.ops.push(vertcut);
  //  this.ops.push(replicate);
  //   this.ops.push(flipx);
  //   this.ops.push(flipy);
  //   this.ops.push(shiftx);
  //   this.ops.push(shifty);
  //   this.ops.push(layer);
  //   this.ops.push(selvedge);
  //   this.ops.push(bindweftfloats);
  //   this.ops.push(bindwarpfloats);
  //   this.ops.push(joinleft);
  //   this.ops.push(jointop);
  //   this.ops.push(slope);
  //   this.ops.push(tile);
  //   this.ops.push(chaos);
  //   this.ops.push(stretch);
  //   this.ops.push(resize);
  //   this.ops.push(margin);
  //   this.ops.push(clear);
  //   this.ops.push(set);
  //   this.ops.push(unset);
  //   this.ops.push(rotate);
  //   this.ops.push(makesymmetric);
  //   this.ops.push(fill);
  //   this.ops.push(overlay);
  //   this.ops.push(atop);
  //   this.ops.push(mask);
  //   //this.ops.push(germanify);
  //   //this.ops.push(crackleify);
  //   //this.ops.push(variants);
  //   this.ops.push(knockout);
  //   this.ops.push(crop);
  //   this.ops.push(trim);
  //   this.ops.push(makeloom);
  //   this.ops.push(makedirectloom);
  //   this.ops.push(drawdown);
  //   this.ops.push(directdrawdown);
  //   this.ops.push(erase_blank);
  //   this.ops.push(apply_mats);
    this.ops.push(combinatorics);
  //   this.ops.push(sinewave);
  //   this.ops.push(sawtooth);
    }


    //** Give it a classification here */
    // this.classification.push(
    //   {category: 'structure',
    //   dx: "0-1 input, 1 output, algorithmically generates weave structures based on parameters",
    //   ops: [tabby_der, twill, satin, shaded_satin, waffle, complextwill, random, combinatorics]}
    // );

  //   this.classification.push(
  //     {category: 'block design',
  //     dx: "1 input, 1 output, describes the arragements of regions in a weave. Fills region with input draft",
  //     ops: [rect, crop, trim, margin, tile, chaos, warp_profile, sample_width]
  //   }
  //   );
  //   this.classification.push(
  //     {category: 'transformations',
  //     dx: "1 input, 1 output, applies an operation to the input that transforms it in some way",
  //     ops: [invert, flipx, flipy, shiftx, shifty, rotate, makesymmetric, slope, stretch, resize, clear, set, unset]}
  //     );

  //   this.classification.push(
  //       {category: 'combine',
  //       dx: "2 inputs, 1 output, operations take more than one input and integrate them into a single draft in some way",
  //       ops: [imagemap, bwimagemap, interlace, splicein, spliceinwarps, assignlayers, layer, layernotation,  fill, joinleft, dynamic_join_left, jointop]}
  //       );
    
  //    this.classification.push(
  //         {category: 'binary',
  //         dx: "2 inputs, 1 output, operations take two inputs and perform binary operations on the interlacements",
  //         ops: [atop, overlay, mask, knockout]}
  //         );
    
  //     this.classification.push(
  //       {category: 'math',
  //       dx: "0 or more inputs, 1 output, generates drafts from mathmatical functions",
  //       ops: [sinewave, sawtooth]}
  //       );
      

  //     this.classification.push(
  //           {category: 'helper',
  //           dx: "variable inputs, variable outputs, supports common drafting requirements to ensure good woven structure",
  //           ops: [selvedge, bindweftfloats, bindwarpfloats]}
  //           );


  //     // this.classification.push(
  //     //   {category: 'machine learning',
  //     //   dx: "1 input, 1 output, experimental functions that attempt to apply a style from one genre of weaving to your draft. Currently, we have trained models on German Weave Drafts and Crackle Weave Drafts ",
  //     //   ops: [germanify, crackleify]}
  //     // );

  //     this.classification.push(
  //       {category: 'jacquard',
  //       dx: "1 input, 1 output, functions designed specifically for working with jacquard-style drafting",
  //       ops: [erase_blank]}
  //     );

  //   this.classification.push(
  //     {category: 'frame loom support',
  //     dx: "variable input drafts, variable outputs, offer specific supports for working with frame looms",
  //     ops: [makeloom, makedirectloom, drawdown, directdrawdown]}
  //   );

  //   this.classification.push(
  //     {category: 'color effects',
  //     dx: "2 inputs, 1 output: applys pattern information from second draft onto the first. To be used for specifiying color repeats",
  //     ops: [apply_mats]}
  //   );

   

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
         uniqueSystemRows = makeWeftSystemsUnique(rowSystems);
         uniqueSystemRows.forEach(system => {
          system.forEach(el => {
            if(this.ss.getWeftSystem(el) === undefined) this.ss.addWeftSystemFromId(el);
          })
        })


    
         rowShuttles =drafts.map(el => el.rowShuttleMapping);
         standardShuttleRows = this.ms.standardizeLists(rowShuttles);

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

  isDynamic(name: string) : boolean{
    const parent_ndx: number = this.dynamic_ops.findIndex(el => el.name === name);
    if(parent_ndx == -1) return false;
    return true;
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
