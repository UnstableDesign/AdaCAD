import { Component, ElementRef, OnInit, OnDestroy, HostListener, ViewChild, ChangeDetectionStrategy, Input } from '@angular/core';
import {enableProdMode} from '@angular/core';

import { PatternService } from '../core/provider/pattern.service';
import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/overlay';
import { Draft } from '../core/model/draft';
import { Render } from '../core/model/render';
import { Pattern } from '../core/model/pattern';
import { MatDialog } from "@angular/material/dialog";
import {Subject} from 'rxjs';
import { FileService, LoadResponse } from '../core/provider/file.service';
import { Loom } from '../core/model/loom';
import * as _ from 'lodash';
import { DraftviewerComponent } from '../core/draftviewer/draftviewer.component';
import {DesignmodesService} from '../core/provider/designmodes.service'
import { SidebarComponent } from '../core/sidebar/sidebar.component';
import { MaterialsService } from '../core/provider/materials.service';
import { SystemsService } from '../core/provider/systems.service';
import { Cell } from '../core/model/cell';

//disables some angular checking mechanisms
// enableProdMode();



@Component({
  selector: 'app-weaver',
  templateUrl: './weaver.component.html',
  styleUrls: ['./weaver.component.scss']
})
export class WeaverComponent implements OnInit {
 
  /**
   * The reference to the weave directive.
   * @property {WeaveDirective}
   */
  @ViewChild(DraftviewerComponent, {static: true}) weaveRef;
  @ViewChild(SidebarComponent, {static: true}) sidebar;
  
  @Input()  draft: Draft; 
  @Input()  viewonly: boolean; 
  @Input() loom: Loom;


 /**
   * The weave Render object.
   * @property {Render}
   */
  render: Render;

 /**
  //  * The weave Timeline object.
  //  * @property {Timeline}
  //  */
  // timeline: Timeline = new Timeline();

 /**
   * A collection of patterns to use in this space
   * @property {Pattern}
   */
  patterns: Array<Pattern>;


  /**
  The current selection, as a Pattern 
  **/
  copy: Pattern;

  /**
   * a place to store the drafts returned from emma's ml code
   */
  generated_drafts: Array<Draft> = [];


  /**
  * Boolean reepresenting if generative ML mode is on or off
  * @property {boolean}
  * */
  generativeMode = false;
   
  /**
  * String holding collection name for generative ML
  */
  collection: string = "";


  /**
  * Number of warps for drafts of collection selected 
  */
  warpSize: number;

  /**
  * Number of wefts for drafts of collection selected 
  */
  weftSize: number;

  selected;

  collapsed: boolean = false;

  private unsubscribe$ = new Subject();

  dims:any;

  draftelement:any;

  scrollingSubscription: any;

  /// ANGULAR FUNCTIONS
  /**
   * @constructor
   * ps - pattern service (variable name is initials). Subscribes to the patterns and used
   * to get and update stitches.
   * dialog - Anglar Material dialog module. Used to control the popup modals.
   */
  constructor(
    private ps: PatternService, 
    private dialog: MatDialog, 
    private fs: FileService,
    private dm: DesignmodesService,
    public scroll: ScrollDispatcher,
    private ms: MaterialsService,
    private ss: SystemsService) {

    this.scrollingSubscription = this.scroll
          .scrolled()
          .subscribe((data: any) => {
            this.onWindowScroll(data);
    });


    this.copy = new Pattern({pattern: [[false,true],[false,true]]});
    this.dm.selectDesignMode('draw', 'design_modes');
    this.dm.selectDesignMode('toggle', 'draw_modes');

  }

  private onWindowScroll(data: CdkScrollable) {
    const scrollTop:number = data.measureScrollOffset("top");
    const scrollLeft:number = data.measureScrollOffset("left");
    this.weaveRef.reposition(scrollTop, scrollLeft);
  }



  loadNewFile(result: LoadResponse){

    console.log("loading new file", result);
    const data = result.data;
    if(data.drafts.length > 0){
      this.draft.reload(data.drafts[0]);
    }else{
      console.log("ERROR, there were not drafts associated with this file");
    }

    if(data.looms.length > 0){
      this.loom.copy(data.looms[0]);
      const success: boolean = this.loom.overloadDraft(this.draft);
      if(!success) console.log("ERROR, could not attach loom to draft of different size");
    }else{
      console.log("WARNING, there were no looms associated with this file");
      this.loom.clearAllData(this.draft.warps, this.draft.wefts, this.loom.type);
      this.loom.recomputeLoom(this.draft, this.loom.type);

      const success: boolean = this.loom.overloadDraft(this.draft);
      if(!success) console.log("ERROR, could not attach loom to draft of different size");
    }


    this.draft.computeYarnPaths(this.ms.getShuttles());
    //this.ss.addHistoryState(this.draft);
    
    this.render.updateVisible(this.draft);
    

    this.weaveRef.onNewDraftLoaded();


    this.weaveRef.redraw({
      drawdown: true, 
      loom:true, 
      warp_systems: true, 
      weft_systems: true, 
      warp_materials: true,
      weft_materials:true
    });

    this.weaveRef.rescale(this.render.getZoom());

  }
  
  ngOnInit(){

    //if(d !== undefined) this.draft = new Draft(JSON.parse(d));
    this.render = new Render(true, this.draft, this.ss);
    this.draft.computeYarnPaths(this.ms.getShuttles());
    //this.timeline.addHistoryState(this.draft);  
    
  }

  ngAfterViewInit() {


    this.weaveRef.onNewDraftLoaded();

    this.weaveRef.redraw({
      drawdown: true, 
      loom:true, 
      warp_systems: true, 
      weft_systems: true, 
      warp_materials: true,
      weft_materials:true
    });

  
    
  }


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  undo() {
    // let d: Draft = this.timeline.restorePreviousHistoryState();
    // if(d === undefined || d === null) return;

    // this.draft.reload(d);    
    // this.weaveRef.onNewDraftLoaded();
    // this.weaveRef.redraw({
    //   drawdown: true, 
    //   loom:true, 
    //   warp_systems: true, 
    //   weft_systems: true, 
    //   warp_materials: true,
    //   weft_materials:true
    // });

  }

  redo() {
    // let d: Draft = this.timeline.restoreNextHistoryState();

    // if(d === undefined || d === null) return;


    // this.draft.reload(d);    
    // this.weaveRef.onNewDraftLoaded();
    // this.weaveRef.redraw({
    //   drawdown: true, 
    //   loom:true, 
    //   warp_systems: true, 
    //   weft_systems: true, 
    //   warp_materials: true,
    //   weft_materials:true
    // });

  }

  /// EVENTS




/**
   * Call zoom in on Shift+p.
   * @extends WeaveComponent
   * @param {Event} shift+p
   * @returns {void}
   */
  @HostListener('window:keydown.Shift.p', ['$event'])
  private keyEventZoomIn(e) {
    console.log("zoom in");
    this.render.zoomIn();


  }
/**
   * Call zoom out on Shift+o.
   * @extends WeaveComponent
   * @param {Event} shift+o
   * @returns {void}
   */
  @HostListener('window:keydown.Shift.o', ['$event'])
  private keyEventZoomOut(e) {
    console.log("zoom out");
    this.render.zoomOut();
  }


  /**
   * Sets selected area to clear
   * @extends WeaveComponent
   * @param {Event} delete key pressed
   * @returns {void}
   */

  @HostListener('window:keydown.e', ['$event'])
  private keyEventErase(e) {

    this.dm.selectDesignMode('down','draw_modes');
    this.weaveRef.unsetSelection();
  }

  /**
   * Sets brush to point on key control + d.
   * @extends WeaveComponent
   * @param {Event} e - Press Control + d
   * @returns {void}
   */
  @HostListener('window:keydown.d', ['$event'])
  private keyEventPoint(e) {
    this.dm.selectDesignMode('up','draw_modes');
    this.weaveRef.unsetSelection();

  }

  /**
   * Sets brush to select on key control + s
   * @extends WeaveComponent
   * @param {Event} e - Press Control + s
   * @returns {void}
   */
  @HostListener('window:keydown.s', ['$event'])
  private keyEventSelect(e) {
    this.dm.selectDesignMode('select','design_modes');
    this.weaveRef.unsetSelection();

  }

  /**
   * Sets key control to invert on control + x
   * @extends WeaveComponent
   * @param {Event} e - Press Control + x
   * @returns {void}
   */
  @HostListener('window:keydown.x', ['$event'])
  private keyEventInvert(e) {

    this.dm.selectDesignMode('toggle','draw_modes');
    this.weaveRef.unsetSelection();

  }

  /**
   * Sets key to copy 
   * @extends WeaveComponent
   * @param {Event} e - Press Control + x
   * @returns {void}
   */
  // @HostListener('window:keydown.c', ['$event'])
  // private keyEventCopy(e) {
  //   this.onCopy();  
  // }

    /**
   * Sets key to copy 
   * @extends WeaveComponent
   * @param {Event} e - Press Control + x
   * @returns {void}
   */
  @HostListener('window:keydown.p', ['$event'])
  private keyEventPaste(e) {
    this.weaveRef.onPaste({});
  }


  public closeAllModals(){
    this.sidebar.closeWeaverModals();
  }

  /**
   * Updates the canvas based on the weave view.
   * @extends WeaveComponent
   * @param {Event} e - view change event from design component.
   * @returns {void}
   */
  public viewChange(value: any) {
    
    this.dm.selectDesignMode(value, 'view_modes');
    this.render.setCurrentView(value);

    if(this.render.isYarnBasedView()) this.draft.computeYarnPaths(this.ms.getShuttles());

    this.weaveRef.redraw({
      drawdown: true
    });
  }

  /**
   * Change the name of the brush to reflect selected brush.
   * @extends WeaveComponent
   * @param {Event} e - brush change event from design component.
   * @returns {void}
   */
  public designModeChange(e:any) {


    this.weaveRef.unsetSelection();

  }

  
//   /**
//    * Flips the current booleean value of generativeMode.
//   * @extends WeeaveComponent
//   * @param {Event} e
//   * @returns {void}
//   */
//  public onGenerativeModeChange(e: any) {
//    console.log('e:', e);
//    this.generativeMode = !this.generativeMode;
//    this.collection = e.collection.toLowerCase().split(' ').join('_');
//    this.warpSize = e.warpSize;
//    this.weftSize = e.weftSize;
//    this.vae.loadModels(this.collection).then(() => {
//     if (this.generativeMode) {
//       this.vae.loadModels(this.collection);
//       let pattern = this.patternFinder.computePatterns(this.loom.threading, this.loom.treadling, this.draft.pattern);
//       var suggestions = [];
//       let draftSeed = this.patternToSize(pattern, this.warpSize, this.weftSize);
//       this.vae.generateFromSeed(draftSeed).then(suggestionsRet => {
//         suggestions = suggestionsRet;
//         console.log('suggestions:', suggestions);
//         for (var i = 0; i < suggestions.length; i++) {
//           let treadlingSuggest = this.patternFinder.getTreadlingFromArr(suggestions[i]);
//           let threadingSuggest = this.patternFinder.getThreadingFromArr(suggestions[i]);
//           let pattern = this.patternFinder.computePatterns(threadingSuggest, treadlingSuggest, suggestions[i])
//           let draft = new Draft({});
//           for (var i = 0; i < pattern.length; i++) {
//             var first = false;
//             if (i != 0) {
//               draft.pattern.push([]);
//             } else {
//               first = true;
//             }
//             for (var j = 0; j < pattern[i].length; j++) {
//               if (first && j == 0) {
//                 draft.pattern[i][j] = new Cell(pattern[i][j] == 1 ? true : false);
//               } else {
//                 draft.pattern[i].push(new Cell(pattern[i][j] == 1 ? true : false));
//               }
//             }
//           }
//           this.generated_drafts.push(draft);    
//         }
//       });
//     }
//    });
//  }

//  public loadGeneratedDraft(e: any){
//   console.log("running load generated draft!");
  
//   //tell the draft viewer to load this business!
// }
  
  /**
   * Tell the weave directive to fill selection with pattern.
   * @extends WeaveComponent
   * @param {Event} e - fill event from design component.
   * @returns {void}
   */
  public onFill(e) {
    
    let p:Pattern = this.patterns[e.id];
    
    this.draft.fillArea(this.weaveRef.selection, p, 'original', this.render.visibleRows, this.loom);

    this.loom.recomputeLoom(this.draft, this.loom.type);

    if(this.render.isYarnBasedView()) this.draft.computeYarnPaths(this.ms.getShuttles());
    
    this.weaveRef.copyArea();

    this.weaveRef.redraw({drawdown:true, loom:true});

    //this.timeline.addHistoryState(this.draft);
    
  }

  /**
   * Tell weave reference to clear selection.
   * @extends WeaveComponent
   * @param {Event} Delete - clear event from design component.
   * @returns {void}
   */
  public onClear(b:boolean) {
    
    const p: Pattern = new Pattern({width: 1, height: 1, pattern: [[b]]});

    this.draft.fillArea(this.weaveRef.selection, p, 'original', this.render.visibleRows, this.loom)

    this.loom.recomputeLoom(this.draft, this.loom.type);

    if(this.render.isYarnBasedView()) this.draft.computeYarnPaths(this.ms.getShuttles());

    this.weaveRef.copyArea();

    this.weaveRef.redraw({drawdown:true, loom:true});

   // this.timeline.addHistoryState(this.draft);

  }

  public onScroll(){
  }

  /**
   * Weave reference masks pattern over selected area.
   * @extends WeaveComponent
   * @param {Event} e - mask event from design component.
   * @returns {void}
   */
  public onMask(e) {
    // console.log(e);
    // var p = this.draft.patterns[e.id].pattern;
    // this.weaveRef.maskArea(p);
    // this.redraw();
  }

  





  /// PUBLIC FUNCTIONS
  /**
   * 
   * @extends WeaveComponent
   * @returns {void}
   */
  public print(e) {
    console.log(e);
  }


  /**
   */
   public materialChange() {
    this.weaveRef.redraw({drawdown: true, warp_materials:true,  weft_materials:true});
    //this.timeline.addHistoryState(this.draft);
  }





  /**
   * Inserts an empty row on system, system
   */
  public shuttleColorChange() {
    this.weaveRef.redraw({drawdown: true, warp_materials:true,  weft_materials:true});
   // this.timeline.addHistoryState(this.draft);
  }

  

  public updatePatterns(e: any) {
    this.patterns = e.patterns;

  }

  public updateWarpSystems(pattern: Array<number>) {
    console.log("update warp sys", pattern);
    this.draft.updateWarpSystemsFromPattern(pattern);
    this.weaveRef.redraw({drawdown: true, warp_systems: true});

  }

  public updateWeftSystems(pattern: Array<number>) {
    console.log("update weft sys", pattern);

    this.draft.updateWeftSystemsFromPattern(pattern);
    this.weaveRef.redraw({drawdown: true, weft_systems: true});

  }

  public updateWarpShuttles(pattern: Array<number>) {
    console.log("update warp shut", pattern);

    this.draft.updateWarpShuttlesFromPattern(pattern);
    this.weaveRef.redraw({drawdown: true, warp_materials: true});

  }

  public updateWeftShuttles(pattern: Array<number>) {
    console.log("update weft shutf", pattern);

    this.draft.updateWeftShuttlesFromPattern(pattern);
    this.draft.computeYarnPaths(this.ms.getShuttles());
    this.weaveRef.redraw({drawdown: true, weft_materials: true});

  }

  // public createMaterial(e: any) {
  //   this.draft.addMaterial(e.material); 
  //   this.weaveRef.redraw();
  // }

  public createShuttle(e: any) {
    this.ms.addShuttle(e.shuttle); 
  }

  // public createWarpSystem(e: any) {
  //   this.draft.addWarpSystem(e.system);
  // }

  // public createWeftSystem(e: any) {
  //   this.draft.addWarpSystem(e.system);
  // }

  public hideWarpSystem(e:any) {
    
    this.weaveRef.redraw({drawdown: true, loom:true, warp_systems: true, warp_materials:true});
  }

  public showWarpSystem(e:any) {

    this.weaveRef.redraw({drawdown: true, loom:true, warp_systems: true, warp_materials:true});
  }  

  public hideWeftSystem(e:any) {
   
    this.render.updateVisible(this.draft);
    
    this.weaveRef.redraw({drawdown: true, loom:true, weft_systems: true, weft_materials:true});
  }

  public showWeftSystem(e:any) {

    this.render.updateVisible(this.draft);

    this.weaveRef.redraw({drawdown: true, loom:true, weft_systems: true, weft_materials:true});
  }


  public notesChanged(e:any) {

  //   console.log(e);
  //  this.draft.notes = e;
  }

  // public hideShuttle(e:any) {
  //   this.draft.updateVisible();
  //   this.weaveRef.redraw();
  //   this.weaveRef.redrawLoom();
  // }

  // public showShuttle(e:any) {
  //   this.draft.updateVisible();
  //   this.weaveRef.redraw();
  //   this.weaveRef.redrawLoom();
  // }

  public epiChange(e:any){
    this.loom.overloadEpi(e.epi);
  }

  public unitChange(e:any){
    this.loom.overloadUnits(e.units);
  }


  public loomChange(e:any){
    
    this.loom.overloadType(e.loomtype);

    if(this.loom.type === 'frame'){
      this.weaveRef.recomputeLoom();
    }
    
    this.weaveRef.redraw({loom: true});

  }

  public frameChange(e:any){
    this.loom.setMinFrames(e.value);
    this.weaveRef.redraw({loom: true});
  }

  public treadleChange(e:any){
    this.loom.setMinTreadles(e.value);
    this.weaveRef.redraw({loom: true});
  }


  public warpNumChange(e:any) {
    if(e.warps == "") return;

    if(e.warps > this.draft.warps){
      var diff = e.warps - this.draft.warps;
      
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

   // this.timeline.addHistoryState(this.draft);

    if(this.render.isYarnBasedView()) this.draft.computeYarnPaths(this.ms.getShuttles());

    this.weaveRef.redraw({drawdown: true, loom: true, warp_systems: true, warp_materials:true});

  }

  public weftNumChange(e:any) {
  
    if(e.wefts === "" || e.wefts =="null") return;

    if(e.wefts > this.draft.wefts){
      var diff = e.wefts - this.draft.wefts;
      
      for(var i = 0; i < diff; i++){  
        this.draft.insertRow(e.wefts+i, 0, 0);
        this.loom.insertRow(e.wefts+i);
        console.log("inserting row");
      }
    }else{
      var diff = this.draft.wefts - e.wefts;
      for(var i = 0; i < diff; i++){  
        this.draft.deleteRow(this.draft.wefts-1);
        this.loom.deleteRow(this.draft.wefts-1);
      }

    }

    this.render.updateVisible(this.draft);

    //this.timeline.addHistoryState(this.draft);

    if(this.render.isYarnBasedView()) this.draft.computeYarnPaths(this.ms.getShuttles());

    this.weaveRef.redraw({drawdown: true, loom: true, weft_systems: true, weft_materials:true});


  }

  public createPattern(e: any) {
    e.pattern.id = this.patterns.length;
    this.patterns.push(e.pattern);
  }


//should this just hide the pattern or fully remove it, could create problems with undo/redo
   public removePattern(e: any) {
    this.patterns = this.patterns.filter(pattern => pattern !== e.pattern);
  }


  public updateSelection(e:any){
    this.copy = e;
  }


  /**
   * called when a change that affects the view has taken place in the loom modal
   */
  onLoomChange(){

      this.render.updateVisible(this.draft);

    //  this.timeline.addHistoryState(this.draft);

     if(this.render.isYarnBasedView()) this.draft.computeYarnPaths(this.ms.getShuttles());

      this.loom.recomputeLoom(this.draft, this.loom.type);
    
     this.weaveRef.redraw({drawdown: true, loom: true, weft_systems: true, weft_materials:true,warp_systems: true, warp_materials:true});

  }


  public renderChange(e: any){
     
     if(e.source === "slider"){
        this.render.setZoom(e.value);
        this.weaveRef.rescale(this.render.getZoom());

     } 

     if(e.source === "in"){
        this.render.zoomIn();

     } 

     if(e.source === "out"){
        this.render.zoomOut();

     } 
     if(e.source === "front"){
        this.render.setFront(!e.checked);
        this.weaveRef.flip();
        this.weaveRef.redraw({drawdown:true});
     }      
  }

  public toggleCollapsed(){
    this.collapsed = !this.collapsed;
  }






//careful! calling this from console will clear all data in local storage
public clearLocalStorage(){

  var total = 0;
  for(var x in localStorage) {
    localStorage.removeItem(x);
  }
  console.log( "LOCAL STORAGE CLEARED");
  console.log("local storage size now "+localStorage.length);
}


//call this from console when you want to write a file of the data
public downloadLocalStorage(){
  // let d_log = loadRawLog();

  // let oldest_stamp = d_log[0].timestamp;
  //   let newest_stamp =   d_log[0].timestamp


  // for(var d in d_log){
  //   if(d_log[d].timestamp > newest_stamp) newest_stamp = d_log[d].timestamp;
  //   if(d_log[d].timestamp < oldest_stamp) oldest_stamp = d_log[d].timestamp;
  // }

  //   console.log(oldest_stamp, newest_stamp);
  // let writer = createWriter(oldest_stamp+"_"+newest_stamp+".csv");
  // writer.write(["timestamp", "region", "value"]);
  // writer.write('\n');

  // for(var d in d_log){
  //   writer.write([d_log[d].timestamp, d_log[d].region, d_log[d].value]);
  //   writer.write('\n');
  // }
  // writer.close();


}


public getDraftFromLocalStore() : string{
  var aValue = localStorage.getItem("draft");
  return aValue;
}

//load raw log into memory so we can process it for the visualization
//this will be called once everytime we switch into vis mode, though log entries may be
//accumulated in the backgroudn that won't affect this
public loadRawLog(){
  //clear the log so we can load it fresh
  // console.log(Date.now());

   var d_log = [];
  // //console.log(localStorage.length);

  // for(var x in localStorage) {
  //   if(typeof(localStorage[x]) == "string"){
  //     time_region = split(x, ":")
  //     value = localStorage[x];

  //     d_log.push({
  //     timestamp: time_region[0],
  //     region: time_region[1],
  //     value: value}
  //   );
  //   }
  // }

  return d_log;

}

 /**
   *
   * tranfers on save from header to draft viewer
   */
  public onSave(e: any) {

    this.weaveRef.onSave(e);

  }



}
