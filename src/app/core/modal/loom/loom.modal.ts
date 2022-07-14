import { Component, OnInit, Inject, Output, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import * as _ from 'lodash';
import { DesignmodesService } from '../../provider/designmodes.service';
import { DesignMode,Loom, Draft, LoomSettings, DraftNode } from '../../model/datatypes';
import { NgForm } from '@angular/forms';
import { WorkspaceService } from '../../provider/workspace.service';
import { deleteDrawdownCol, deleteDrawdownRow, flipDraft, flipDrawdown, insertDrawdownCol, insertDrawdownRow, warps, wefts } from '../../model/drafts';
import { flipLoom, flipPattern, getLoomUtilByType, isFrame } from '../../model/looms';
import { TreeService } from '../../../mixer/provider/tree.service';
import utilInstance from '../../model/util';
import { C } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-loom-modal',
  templateUrl: './loom.modal.html',
  styleUrls: ['./loom.modal.scss']
})
export class LoomModal implements OnInit {


  @Output() localLoomNeedsRedraw: any = new EventEmitter();
  @Output() onGlobalLoomChange: any = new EventEmitter();
  

  id: number;
  // draft: Draft;
  // loom:Loom;
  // loom_settings:LoomSettings;
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
  selected_origin: number = 0;

  constructor(
             private ws: WorkspaceService,
             private dm: DesignmodesService,
             private tree: TreeService,
             private dialogRef: MatDialogRef<LoomModal>,
             @Inject(MAT_DIALOG_DATA) public data: any) {


     this.type = data.type;
      this.id = data.id;
      this.selected_origin = this.ws.selected_origin_option;

     if(this.type === 'local'){
      const draft = this.tree.getDraft(this.id);
      const loom_settings  = this.tree.getLoomSettings(this.id);
      this.warps = warps(draft.drawdown);
      this.wefts = wefts(draft.drawdown);
      this.epi = loom_settings.epi;
      this.units = loom_settings.units;
      this.frames = loom_settings.frames;
      this.treadles = loom_settings.treadles;
      this.loomtype = loom_settings.type;
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
    const loom_settings = this.tree.getLoomSettings(this.id);

    if(!f.value.treadles){
      f.value.treadles = 2; 
      this.treadles = f.value.treadles;
    } 

    f.value.treadles = Math.ceil(f.value.treadles);
   
    if(this.type == "global"){
      this.ws.min_treadles= f.value.treadles;
    } else{
      loom_settings.treadles = f.value.treadles;
      this.tree.setLoomSettings(this.id, loom_settings);
      this.localLoomNeedsRedraw.emit();
    }

  }

  updateMinFrames(f: NgForm){
    const loom_settings = this.tree.getLoomSettings(this.id);

    if(!f.value.frames){
      f.value.frames = 2; 
      this.frames = f.value.frames;

    }
     

    f.value.frames = Math.ceil(f.value.frames);
    
    if(this.type == "global"){
      this.ws.min_frames = f.value.frames;
    }else{
      loom_settings.frames = f.value.frames;
      this.tree.setLoomSettings(this.id, loom_settings);      
      this.localLoomNeedsRedraw.emit();

    }   
  }


  /**
   * when the origin changes, all drafts on the canavs should be modified to the new position
   * origin changes can ONLY happen on globals
   * @param e 
   */
  originChange(e:any){


    const flips = utilInstance.getFlips(this.ws.selected_origin_option, this.selected_origin);
    this.ws.selected_origin_option = this.selected_origin;
    
    const dn: Array<DraftNode> = this.tree.getDraftNodes();
    const data = dn.map(node => {
      return {
      draft: node.draft, 
      loom: node.loom, 
      horiz: flips.horiz,
      vert: flips.vert}
    });

    const draft_fns = data.map(el => flipDraft(el.draft, el.horiz, el.vert));

    return Promise.all(draft_fns)
    .then(res => {
      for(let i = 0; i < dn.length; i++){
        dn[i].draft = {
          id: res[i].id,
          gen_name: res[i].gen_name,
          ud_name: res[i].ud_name,
          drawdown: res[i].drawdown,
          rowShuttleMapping: res[i].rowShuttleMapping,
          rowSystemMapping: res[i].rowSystemMapping,
          colShuttleMapping: res[i].colShuttleMapping,
          colSystemMapping: res[i].colSystemMapping
        };
      }
      const loom_fns = data.map(el => flipLoom(el.loom, el.horiz, el.vert))
      return Promise.all(loom_fns)
    .then(res => {
      for(let i = 0; i < dn.length; i++){
        if(res[i] !== null){

          dn[i].loom = {
            threading: res[i].threading.slice(),
            tieup: res[i].tieup.slice(),
            treadling: res[i].treadling.slice()
          }
        }
      }
    })
  .then(res => {
    console.log("EMITTING FROM LOOM MODAL")
    this.onGlobalLoomChange.emit();
  })


    })

    


  }


  loomChange(e:any){
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);


    if(this.type == 'global'){
      this.ws.type = e.value.loomtype;
    } 
    else{
      loom_settings.type = e.value.loomtype;
      if(loom_settings.type == 'direct'){
        loom_settings.frames = Math.max(loom_settings.treadles, loom_settings.frames);
        loom_settings.treadles = Math.max(loom_settings.treadles, loom_settings.frames);
        this.tree.setLoomSettings(this.id, loom_settings);
        
      }

      if(loom === null && isFrame(loom_settings)){
        const utils = getLoomUtilByType(loom_settings.type);
        utils.computeLoomFromDrawdown(draft.drawdown, loom_settings, this.ws.selected_origin_option)
        .then(loom => {
          this.tree.setLoom(this.id, loom);
          this.localLoomNeedsRedraw.emit();
        })
      }else{
        this.localLoomNeedsRedraw.emit();
      }



    } 
  }

  unitChange(e:any){
    
    if(this.type == 'global'){
      this.ws.units = e.value.units;
    }else{
      const loom_settings = this.tree.getLoomSettings(this.id);
      loom_settings.units = e.value.units;
      this.tree.setLoomSettings(this.id, loom_settings);
      this.localLoomNeedsRedraw.emit();
    } 

  }


  /**
   * recomputes warps and epi if the width of the loom is changed
   * @param f 
   */
  widthChange(f: NgForm) {
    const loom_settings = this.tree.getLoomSettings(this.id);

    if(!f.value.width){
      f.value.width = 1;
      this.width = f.value.width;
    } 

    if(this.warp_locked){
      var new_epi = (this.units == "in") ? f.value.warps / f.value.width : (10 * f.value.warps / f.value.width);   
      loom_settings.epi = new_epi;
      f.value.epi = new_epi;
      this.epi = new_epi;
      this.tree.setLoomSettings(this.id, loom_settings);
      this.localLoomNeedsRedraw.emit();
    }else{
      var new_warps = (this.units === "in") 
      ? Math.ceil(f.value.width * f.value.epi) : 
      Math.ceil((10 * f.value.warps / f.value.width));

      this.warpNumChange({warps: new_warps});
    }
  }

  public warpNumChange(e:any) {

    if(e.warps == "") return;

    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);


    if(e.warps > warps(draft.drawdown)){
      var diff = e.warps -  warps(draft.drawdown);
      
      for(var i = 0; i < diff; i++){  
        draft.drawdown = insertDrawdownCol(draft.drawdown,i, null);
      }
    }else{
      var diff = warps(draft.drawdown) - e.warps;
      for(var i = 0; i < diff; i++){  
        draft.drawdown = deleteDrawdownCol(draft.drawdown, warps(draft.drawdown)-1);
      }

    }

    this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
    .then(loom => {
      this.localLoomNeedsRedraw.emit();
    })

  }

  
  warpChange(f: NgForm) {

    const loom_settings = this.tree.getLoomSettings(this.id);

    if(!f.value.warps){
     f.value.warps = 2;
     this.warps = f.value.warps;
    }
    this.warpNumChange({warps: f.value.warps})
    this.width = (this.units =='cm') ? f.value.warps / loom_settings.epi * 10 : f.value.warps / loom_settings.epi;
    f.value.width = this.width;

  }

  weftChange(f: NgForm) {
    if(!f.value.wefts){
      f.value.wefts = 2;
      this.wefts = 2;
    } 
    this.weftNumChange({wefts: f.value.wefts})

  }

  public weftNumChange(e:any) {
  
    if(e.wefts === "" || e.wefts =="null") return;


    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);


    if(e.wefts > wefts(draft.drawdown)){
      var diff = e.wefts - wefts(draft.drawdown);
      
      for(var i = 0; i < diff; i++){  
        draft.drawdown = insertDrawdownRow(draft.drawdown, e.wefts+i, null);
      }
    }else{
      var diff = wefts(draft.drawdown) - e.wefts;
      for(var i = 0; i < diff; i++){  
        draft.drawdown = deleteDrawdownRow(draft.drawdown, wefts(draft.drawdown)-1);
      }
    }

    this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
    .then(loom => {
      this.localLoomNeedsRedraw.emit();
    })
   
  }


  epiChange(f: NgForm) {

    const loom_settings = this.tree.getLoomSettings(this.id);

    if(!f.value.epi){
      f.value.epi = 1;
      this.epi = f.value.epi;
    } 
    
    //this.loom.overloadEpi(f.value.epi);
    this.ws.epi = f.value.epi;

    if(this.type === "local"){
      if(this.warp_locked){
        //change the width
        this.width = (this.units =='cm') ? f.value.warps / loom_settings.epi * 10 : f.value.warps / loom_settings.epi;
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

  }




}
