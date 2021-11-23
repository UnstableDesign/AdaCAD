import { Component, OnInit, Inject, Output, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import * as _ from 'lodash';
import { Loom } from '../../model/loom';
import { DesignmodesService } from '../../provider/designmodes.service';
import { DesignMode } from '../../model/datatypes';
import { NgForm } from '@angular/forms';
import { Draft } from '../../model/draft';
import { GloballoomService } from '../../provider/globalloom.service';
import { E } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-loom-modal',
  templateUrl: './loom.modal.html',
  styleUrls: ['./loom.modal.scss']
})
export class LoomModal implements OnInit {

  /**
   * stores a copy of the submitted pattern, so as not to upddate the original
   */
  

  //  @Output() onLoomTypeChange = new EventEmitter();
  //  @Output() onFrameChange = new EventEmitter();
  //  @Output() onTreadleChange = new EventEmitter();
  //  @Output() onWarpNumChange: any = new EventEmitter();
  //  @Output() onWeftNumChange: any = new EventEmitter();
  //  @Output() onEpiNumChange: any = new EventEmitter();
    @Output() onChange: any = new EventEmitter();
  
  //  warp_locked = false;
  //  loom = ""; 

  draft: Draft;
  loom:Loom
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

  constructor(
             private global_loom: GloballoomService,
             private dm: DesignmodesService,
             private dialogRef: MatDialogRef<LoomModal>,
             @Inject(MAT_DIALOG_DATA) public data: any) {


     this.type = data.type;

     if(this.type === 'local'){
      const loom:Loom  =  data.loom;
      this.draft = data.draft;
      this.loom  = loom;
      this.warps = data.draft.warps;
      this.wefts = data.draft.wefts;
     }
    
     this.epi = global_loom.epi;
    
     this.units = global_loom.units;
     this.frames = global_loom.min_frames;
     this.treadles = global_loom.min_treadles;
     this.loomtype = global_loom.type;

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
    this.global_loom.min_treadles= f.value.treadles;

    this.onChange.emit();
  }

  updateMinFrames(f: NgForm){
    
    if(!f.value.frames){
      f.value.frames = 2; 
      this.frames = f.value.frames;

    }
     

    f.value.frames = Math.ceil(f.value.frames);
    console.log("min frames", f.value.frames);   
    this.global_loom.min_frames = f.value.frames;
    
    //this.loom.setMinFrames(f.value.frames);
    
    this.onChange.emit();

  }


  loomChange(e:any){
    this.global_loom.type = e.value.loomtype;
    this.dm.selectDesignMode(e.value.loomtype, 'loom_types');
    this.onChange.emit();


  }

  unitChange(e:any){
    this.global_loom.units = e.value.units;
    //this.loom.overloadUnits(e.value.units);
    this.onChange.emit();

  }


  widthChange(f: NgForm) {

    if(!f.value.width){
      f.value.width = 1;
      this.width = f.value.width;
    } 

    if(this.warp_locked){
      var new_epi = (this.units == "in") ? f.value.warps / f.value.width : (10 * f.value.warps / f.value.width);   
      this.loom.overloadEpi(new_epi);
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

    if(e.warps > this.draft.warps){
      var diff = e.warps -  this.draft.warps;
      
      for(var i = 0; i < diff; i++){  
         this.draft.insertCol(i, 0,0);
         this.loom.insertCol(i);
      }
    }else{
      var diff = this.draft.warps - e.warps;
      for(var i = 0; i < diff; i++){  
        this.draft.deleteCol(this.draft.warps-1);
        this.loom.deleteCol(this.draft.warps-1);

      }

    }


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

    if(e.wefts > this.draft.wefts){
      var diff = e.wefts - this.draft.wefts;
      
      for(var i = 0; i < diff; i++){  
        this.draft.insertRow(e.wefts+i, 0, 0);
        this.loom.insertRow(e.wefts+i);
      }
    }else{
      var diff = this.draft.wefts - e.wefts;
      for(var i = 0; i < diff; i++){  
        this.draft.deleteRow(this.draft.wefts-1);
        this.loom.deleteRow(this.draft.wefts-1);
      }

    }

   
  }


  epiChange(f: NgForm) {
    if(!f.value.epi){
      f.value.epi = 1;
      this.epi = f.value.epi;
    } 
    
    //this.loom.overloadEpi(f.value.epi);
    this.global_loom.epi = f.value.epi;

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
