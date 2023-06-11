import { Injectable } from '@angular/core';
// import { VaeService} from "../../core/provider/vae.service"
import { Draft, DynamicOperation, Operation, OperationClassification } from '../../core/model/datatypes';
import { generateMappingFromPattern, warps, wefts } from '../../core/model/drafts';
import { MaterialsService } from '../../core/provider/materials.service';
import { SystemsService } from '../../core/provider/systems.service';
import { standardizeMaterialLists } from '../model/material';
import { makeWarpSystemsUnique, makeWeftSystemsUnique } from '../model/system';
import { combinatorics } from '../operations/combinatorics/combinatorics';
import { complextwill } from '../operations/complex_twill/complex_twill';
import { deinterlace } from '../operations/deinterlace/deinterlace';
import { interlace } from '../operations/interlace/interlace';
import { interlacewarps } from '../operations/interlace_warps/interlace_warps';
import { invert } from '../operations/invert/invert';
import { notation } from '../operations/layer_notation/layer_notation';
import { random } from '../operations/random/random';
import { rect } from '../operations/rect/rect';
import { satin } from '../operations/satin/satin';
import { satinish } from '../operations/satinish/satinish';
import { square_waffle } from '../operations/square_waffle/square_waffle';
import { tabby_der } from '../operations/tabby/tabby';
import { twill } from '../operations/twill/twill';
import { undulatingtwill } from '../operations/undulating_twill/undulating_twill';
import { waffleish } from '../operations/waffleish/waffleish';

import { flipx } from '../operations/flipx/flipx';
import { flipy } from '../operations/flipy/flipy';
import { shaded_satin } from '../operations/shaded_satin/shaded_satin';
import { shiftx } from '../operations/shiftx/shiftx';
import { shifty } from '../operations/shifty/shifty';
import { tile } from '../operations/tile/tile';
import { splicein } from '../operations/spliceinwefts/spliceinwefts'
import { spliceinwarps } from '../operations/spliceinwarps/spliceinwarps'
import {imagemap} from '../operations/imagemap/imagemap'
import {layer} from '../operations/layer/layer'
import {notation_system} from '../operations/system_notation/system_notation'
import {selvedge} from '../operations/selvedge/selvedge'
import {bindweftfloats} from '../operations/bindweftfloats/bindweftfloats'
import {bindwarpfloats} from '../operations/bindwarpfloats/bindwarpfloats'
import {rotate} from '../operations/rotate/rotate'
import {joinleft} from '../operations/joinleft/joinleft'



@Injectable({
  providedIn: 'root'
})
export class OperationService {

  ops: Array<Operation> = [];
  dynamic_ops: Array<DynamicOperation> = [];
  classification: Array<OperationClassification> = [];

  constructor(
    // private vae: VaeService, 
    private ms: MaterialsService,
    private ss: SystemsService) { 
     

  

    
    


    // this.dynamic_ops.push(assignlayers);
    // this.dynamic_ops.push(dynamic_join_left);
    // this.dynamic_ops.push(dynamic_join_top);
    this.dynamic_ops.push(imagemap);
    // this.dynamic_ops.push(bwimagemap);
     this.dynamic_ops.push(notation);
     this.dynamic_ops.push(notation_system);
    // this.dynamic_ops.push(weft_profile);
    // this.dynamic_ops.push(warp_profile);
    // this.dynamic_ops.push(sample_width);
    // this.dynamic_ops.push(sample_length);


    //**push operations that you want the UI to show as options here */
    this.ops.push(rect);
    this.ops.push(twill);
    this.ops.push(complextwill);
    this.ops.push(undulatingtwill);
    this.ops.push(square_waffle);
    this.ops.push(waffleish);
    this.ops.push(satin);
    this.ops.push(satinish);
    this.ops.push(shaded_satin);
    // this.ops.push(tabby);
    this.ops.push(tabby_der);
    // this.ops.push(rib);
    this.ops.push(random);
    this.ops.push(interlace);
    this.ops.push(deinterlace);
    this.ops.push(interlacewarps);
    this.ops.push(splicein);
    this.ops.push(spliceinwarps);
    // this.ops.push(assignwefts);
    // this.ops.push(assignwarps);
   this.ops.push(invert);
  //   this.ops.push(vertcut);
  //  this.ops.push(replicate);
    this.ops.push(flipx);
    this.ops.push(flipy);
    this.ops.push(shiftx);
    this.ops.push(shifty);
    this.ops.push(layer);
    this.ops.push(selvedge);
    this.ops.push(bindweftfloats);
    this.ops.push(bindwarpfloats);
    this.ops.push(joinleft);
  //   this.ops.push(jointop);
  //   this.ops.push(slope);
    this.ops.push(tile);
  //   this.ops.push(chaos);
  //   this.ops.push(stretch);
  //   this.ops.push(resize);
  //   this.ops.push(margin);
  //   this.ops.push(clear);
  //   this.ops.push(set);
  //   this.ops.push(unset);
    this.ops.push(rotate);
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
