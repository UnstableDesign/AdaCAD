import { Component, OnInit, Inject, Output, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import * as _ from 'lodash';
import { DesignmodesService } from '../../provider/designmodes.service';
import { DesignMode,Loom, Draft, LoomSettings } from '../../model/datatypes';
import { NgForm } from '@angular/forms';
import { WorkspaceService } from '../../provider/workspace.service';
import { deleteDrawdownCol, deleteDrawdownRow, insertDrawdownCol, insertDrawdownRow, warps, wefts } from '../../model/drafts';
import { getLoomUtilByType } from '../../model/looms';
import { TreeService } from '../../../mixer/provider/tree.service';

@Component({
  selector: 'app-loom-modal',
  templateUrl: './loom.modal.html',
  styleUrls: ['./loom.modal.scss']
})
export class LoomModal implements OnInit {


  @Output() onChange: any = new EventEmitter();
  

  id: number;
  draft: Draft;
  loom:Loom;
  loom_settings:LoomSettings;
  epi: number = 10;
  warps:number  = 100;
  wefts:number = 100;
  units:string = 'cm';
  frames:number =  8;
  treadles:number = 10;
  loomtype:string = "frame";
  loomtypes:Array<DesignMode>  = [];
  density_units:Array<DesignMode> = [];
  warp_locked:boolean = false;
  width:number = 0; 
  type: string = 'local';
  origin_options: any = null;

  constructor(
             private ws: WorkspaceService,
             private dm: DesignmodesService,
             private tree: TreeService,
             private dialogRef: MatDialogRef<LoomModal>,
             @Inject(MAT_DIALOG_DATA) public data: any) {


     this.type = data.type;
      this.id = data.id;

     if(this.type === 'local'){
      this.draft = this.tree.getDraft(this.id);
      this.loom  = this.tree.getLoom(this.id);;
      this.loom_settings  = this.tree.getLoomSettings(this.id);;
      this.warps = warps(this.draft.drawdown);
      this.wefts = wefts(this.draft.drawdown);
      this.epi = this.loom_settings.epi;
      this.units = this.loom_settings.units;
      this.frames = this.loom_settings.frames;
      this.treadles = this.loom_settings.treadles;
      this.loomtype = this.loom_settings.type;
     }else{
      this.origin_options = this.ws.getOriginOptions();
      this.epi = ws.epi;
      this.units = ws.units;
      this.frames = ws.min_frames;
      this.treadles = ws.min_treadles;
      this.loomtype = ws.type;
     }
    
    

     this.width = (this.units =='cm') ? this.warps / this.epi * 10 : this.warps / this.epi;

     this.loomtypes = dm.getOptionSet('loom_types');
     this.density_units = dm.getOptionSet('density_units');


  }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  close() {
    this.dialogRef.close(null);
  }




  updateMinTreadles(f: NgForm){
    //validate the input
    if(!f.value.treadles){
      f.value.treadles = 2; 
      this.treadles = f.value.treadles;
    } 

    f.value.treadles = Math.ceil(f.value.treadles);
   
    if(this.type == "global") this.ws.min_treadles= f.value.treadles;
    else this.loom_settings.treadles = f.value.treadles;

    this.onChange.emit();
  }

  updateMinFrames(f: NgForm){
    
    if(!f.value.frames){
      f.value.frames = 2; 
      this.frames = f.value.frames;

    }
     

    f.value.frames = Math.ceil(f.value.frames);
    console.log("min frames", f.value.frames);  
    
    if(this.type == "global")   this.ws.min_frames = f.value.frames;
    else  this.loom_settings.frames = f.value.frames;
    
    
    this.onChange.emit();

  }


  loomChange(e:any){
    console.log("Changing loom type to ", e.value.loomtype)
    if(this.type == 'global') this.ws.type = e.value.loomtype;
    else this.loom_settings.type = e.value.loomtype;
    this.onChange.emit();
  }

  unitChange(e:any){
    if(this.type == 'global') this.ws.units = e.value.units;
    else this.loom_settings.units = e.value.units;
    this.onChange.emit();

  }


  widthChange(f: NgForm) {

    if(!f.value.width){
      f.value.width = 1;
      this.width = f.value.width;
    } 

    if(this.warp_locked){
      var new_epi = (this.units == "in") ? f.value.warps / f.value.width : (10 * f.value.warps / f.value.width);   
      this.loom_settings.epi = new_epi;
      f.value.epi = new_epi;
      this.epi = new_epi;
    }else{
      var new_warps = (this.units === "in") 
      ? Math.ceil(f.value.width * f.value.epi) : 
      Math.ceil((10 * f.value.warps / f.value.width));

      this.warpNumChange({warps: new_warps});
    }
    this.onChange.emit();

  }

  public warpNumChange(e:any) {

    if(e.warps == "") return;

    if(e.warps > warps( this.draft.drawdown)){
      var diff = e.warps -  warps(this.draft.drawdown);
      
      for(var i = 0; i < diff; i++){  
        this.draft.drawdown = insertDrawdownCol(this.draft.drawdown,i, null);
      }
    }else{
      var diff = warps(this.draft.drawdown) - e.warps;
      for(var i = 0; i < diff; i++){  
        this.draft.drawdown = deleteDrawdownCol(this.draft.drawdown, warps(this.draft.drawdown)-1);
      }

    }

    const utils = getLoomUtilByType(this.loom_settings.type);
    utils.computeLoomFromDrawdown(this.draft.drawdown, this.ws.selected_origin_option)
    .then(loom => {
      this.loom = loom;
    })


  }

  
  warpChange(f: NgForm) {
    if(!f.value.warps){
     f.value.warps = 2;
     this.warps = f.value.warps;
    }
    this.warpNumChange({warps: f.value.warps})
    this.width = (this.units =='cm') ? f.value.warps / f.value.epi * 10 : f.value.warps / f.value.epi;
    f.value.width = this.width;
    this.onChange.emit();

  }

  weftChange(f: NgForm) {
    if(!f.value.wefts){
      f.value.wefts = 2;
      this.wefts = 2;
    } 
    this.weftNumChange({wefts: f.value.wefts})
    this.onChange.emit();

  }

  public weftNumChange(e:any) {
  
    if(e.wefts === "" || e.wefts =="null") return;

    if(e.wefts > wefts(this.draft.drawdown)){
      var diff = e.wefts - wefts(this.draft.drawdown);
      
      for(var i = 0; i < diff; i++){  
        this.draft.drawdown = insertDrawdownRow(this.draft.drawdown, e.wefts+i, null);
      }
    }else{
      var diff = wefts(this.draft.drawdown) - e.wefts;
      for(var i = 0; i < diff; i++){  
        this.draft.drawdown = deleteDrawdownRow(this.draft.drawdown, wefts(this.draft.drawdown)-1);
      }

    }

    if(this.loom !== null){
    const utils = getLoomUtilByType(this.loom_settings.type);
    utils.computeLoomFromDrawdown(this.draft.drawdown, this.ws.selected_origin_option)
    .then(loom => {
      this.loom = loom;
    })
    }

   
  }


  epiChange(f: NgForm) {
    if(!f.value.epi){
      f.value.epi = 1;
      this.epi = f.value.epi;
    } 
    
    //this.loom.overloadEpi(f.value.epi);
    this.ws.epi = f.value.epi;

    if(this.type === "local"){
      if(this.warp_locked){
        //change the width
        this.width = (this.units =='cm') ? f.value.warps / f.value.epi * 10 : f.value.warps / f.value.epi;
        f.value.width = this.width;
        
      }else{
        var new_warps = (this.units === "in") 
        ? Math.ceil(f.value.width * f.value.epi) : 
        Math.ceil((10 * f.value.warps / f.value.width));
        f.value.warps = new_warps;
        this.warps = new_warps;
        this.warpNumChange({warps: new_warps});
      }
    }


    this.onChange.emit();

  }




}
