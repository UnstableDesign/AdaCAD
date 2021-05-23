import { Component, ElementRef, OnInit, OnDestroy, HostListener, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { PatternService } from '../core/provider/pattern.service';
import { ScrollDispatcher } from '@angular/cdk/overlay';
import { Timeline } from '../core/model/timeline';
import { Draft } from '../core/model/draft';
import { Render } from '../core/model/render';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { ConnectionModal } from './modal/connection/connection.modal';
import { LabelModal } from './modal/label/label.modal';
import {Subject} from 'rxjs';
import { PaletteComponent } from './palette/palette.component';


//disables some angular checking mechanisms
//enableProdMode();


/**
 * Controller of the Weaver component.
 * @class
 */

 interface LoomTypes {
  value: string;
  viewValue: string;
}

interface MaterialTypes {
  value: number;
  viewValue: string;
}

interface DensityUnits {
  value: string;
  viewValue: string;
}


interface ViewModes {
  value: string;
  viewValue: string;
}

// interface ToolModes{
//   value: string; 
//   viewValue: string;
//   icon: string;
//   menu: string;

// }

interface DesignModes{
  value: string;
  viewValue: string;
  icon: string;
}


@Component({
  selector: 'app-mixer',
  templateUrl: './mixer.component.html',
  styleUrls: ['./mixer.component.scss']
})
export class MixerComponent implements OnInit {


  @ViewChild('bitmapImage', {static: false}) bitmap;
  @ViewChild(PaletteComponent, {static: false}) palette;


  // tool_modes: ToolModes[]=[
  //   {value: 'draw', viewValue: 'Draw', icon: "fas fa-pen", menu: "drawTools"},
  //   {value: 'move', viewValue: 'Move', icon: "fas fa-arrows-alt", menu: "moveTools"},
  //   {value: 'select', viewValue: 'Select', icon: "fas fa-hand-pointer", menu: "selectTools"}
  // ];

  design_modes: DesignModes[]=[
    {value: 'toggle', viewValue: 'Toggle Heddle', icon: "fas fa-adjust"},
    {value: 'up', viewValue: 'Set Heddle Up', icon: "fas fa-square"},
    {value: 'down', viewValue: 'Set Heddle Down', icon: "far fa-square"}
  ];


  /**
   * The name of the current selected brush.
   * @property {string}
   */
  design_mode = {
    name:'toggle',
    id: -1
  }

  /**
   * The weave Draft object.
   * @property {Draft}
   */
  draft: Draft;


  subdrafts: Array<Draft>;

 /**
   * The weave Render object.
   * @property {Render}
   */
  render: Render = new Render(false);

 /**
   * The weave Timeline object.
   * @property {Render}
   */
  timeline: Timeline = new Timeline();


  /**
  The current selection, as boolean array 
  **/
  copy: Array<Array<boolean>>;


 /**
   * The types of looms this version will support.
   * @property {LoomType}
   */
  loomtypes: LoomTypes[] = [
    {value: 'frame', viewValue: 'Shaft'},
    {value: 'jacquard', viewValue: 'Jacquard'}
  ];


  material_types: MaterialTypes[] = [
    {value: 0, viewValue: 'Non-Conductive'},
    {value: 1, viewValue: 'Conductive'},
    {value: 2, viewValue: 'Resistive'}
  ];

  density_units: DensityUnits[] = [
    {value: 'in', viewValue: 'Ends per Inch'},
    {value: 'cm', viewValue: 'Ends per 10cm '}
  ];

  view_modes: ViewModes[] = [
      {value: 'visual', viewValue: 'Visual'},
      {value: 'pattern', viewValue: 'Draft'},
      {value: 'yarn', viewValue: 'Circuit'}
     // {value: 'mask', viewValue: 'Masks'}

    ];




    canvas_name = "hithere";
  /**
   * The list of all patterns saved. Provided by pattern service.
   * @property {Array<Pattern>}
   */
  //patterns;


  selected;

  private unsubscribe$ = new Subject();

  default_patterns:any;
  collapsed:boolean = false;
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
  constructor(private ps: PatternService, private dialog: MatDialog, public scroll: ScrollDispatcher) {


    this.scrollingSubscription = this.scroll
          .scrolled()
          .subscribe((data: any) => {
            this.onWindowScroll(data);
    });


    //initialize with a draft so that we can load some things faster. 
    let d =  this.getDraftFromLocalStore();
    
    this.copy = [[false,true],[false,true]];

    this.subdrafts = [];
    this.subdrafts.push(new Draft({}));
    this.subdrafts.push(new Draft({}));
    this.subdrafts.push(new Draft({}));


    if(d !== undefined)

    this.draft = new Draft(JSON.parse(d));
    this.draft.name = this.draft.name;
    this.timeline.addHistoryState(this.draft);
    
    this.default_patterns = [];


    this.ps.getPatterns().subscribe((res) => {
       for(var i in res.body){
          this.default_patterns.push(res.body[i]);
       }
    }); 

    this.render.view_frames = (this.draft.loom.type === 'frame') ? true : false;     
    if (this.draft.patterns === undefined) this.draft.patterns = this.default_patterns;

  }

  private onWindowScroll(data: any) {
    this.palette.rescale();
  }



  reInit(result){
    console.log("reinit");

    this.draft.reload(result);
    this.timeline.addHistoryState(this.draft);

    this.render.view_frames = (this.draft.loom.type === 'frame') ? true : false;     

    if (this.draft.patterns === undefined) this.draft.patterns = this.default_patterns;
    

    this.palette.onNewDraftLoaded();


    this.palette.redraw({
      drawdown: true, 
      loom:true, 
      warp_systems: true, 
      weft_systems: true, 
      warp_materials: true,
      weft_materials:true
    });

    this.palette.rescale();

  }
  
  ngOnInit(){
    
  }

  ngAfterViewInit() {

  
   //  const dialogRef = this.dialog.open(InitModal, {
   //    data: {loomtypes: this.loomtypes, density_units: this.density_units}
   //  });


   //  dialogRef.afterClosed().subscribe(result => {
   //    if(result !== undefined) this.reInit(result);
   // });


   //  this.palette.onNewDraftLoaded();

   //  this.palette.redraw({
   //    drawdown: true, 
   //    loom:true, 
   //    warp_systems: true, 
   //    weft_systems: true, 
   //    warp_materials: true,
   //    weft_materials:true
   //  });

   //  this.palette.rescale();
  
    
  }


  


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  undo() {
    let d: Draft = this.timeline.restorePreviousHistoryState();
    console.log("Prevous State is ", d);
    if(d === undefined || d === null) return;

    this.draft.reload(d);    
    this.palette.onNewDraftLoaded();
    this.palette.redraw({
      drawdown: true, 
      loom:true, 
      warp_systems: true, 
      weft_systems: true, 
      warp_materials: true,
      weft_materials:true
    });

    this.palette.rescale(); 
  }

  redo() {
    let d: Draft = this.timeline.restoreNextHistoryState();
    console.log("Next State is ", d);

    if(d === undefined || d === null) return;

    console.log(d);

    this.draft.reload(d);    
    this.palette.onNewDraftLoaded();
    this.palette.redraw({
      drawdown: true, 
      loom:true, 
      warp_systems: true, 
      weft_systems: true, 
      warp_materials: true,
      weft_materials:true
    });

    this.palette.rescale(); 
  }

  /// EVENTS




/**
   * Call zoom in on Shift+p.
   * @extends WeaveComponent
   * @param {Event} shift+p
   * @returns {void}
   */
  // @HostListener('window:keydown.Shift.p', ['$event'])
  // private keyEventZoomIn(e) {
  //   console.log("zoom in");
  //   this.render.zoomIn();
  //   this.palette.rescale();


  // }
/**
   * Call zoom out on Shift+o.
   * @extends WeaveComponent
   * @param {Event} shift+o
   * @returns {void}
   */
  // @HostListener('window:keydown.Shift.o', ['$event'])
  // private keyEventZoomOut(e) {
  //   console.log("zoom out");
  //   this.render.zoomOut();
  //   this.palette.rescale();
  // }


  /**
   * Sets selected area to clear
   * @extends WeaveComponent
   * @param {Event} delete key pressed
   * @returns {void}
   */

  // @HostListener('window:keydown.e', ['$event'])
  // private keyEventErase(e) {
  //   this.design_mode = {
  //     name: 'down',
  //     id: -1
  //   };
  //   this.palette.unsetSelection();

  // }

  /**
   * Sets brush to point on key control + d.
   * @extends WeaveComponent
   * @param {Event} e - Press Control + d
   * @returns {void}
   */
  // @HostListener('window:keydown.d', ['$event'])
  // private keyEventPoint(e) {
  //   this.design_mode = {
  //     name: 'up',
  //     id: -1};
  //   this.palette.unsetSelection();

  // }

  /**
   * Sets brush to select on key control + s
   * @extends WeaveComponent
   * @param {Event} e - Press Control + s
   * @returns {void}
   */
  // @HostListener('window:keydown.s', ['$event'])
  // private keyEventSelect(e) {
  //   this.design_mode = {
  //     name: 'select',
  //     id: -1};
  //   this.palette.unsetSelection();

  // }

  /**
   * Sets key control to invert on control + x
   * @extends WeaveComponent
   * @param {Event} e - Press Control + x
   * @returns {void}
   */
  // @HostListener('window:keydown.x', ['$event'])
  // private keyEventInvert(e) {
  //   this.design_mode = {
  //     name: 'toggle',
  //     id: -1
  //   };
  //   this.palette.unsetSelection();

  // }

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
  // @HostListener('window:keydown.p', ['$event'])
  // private keyEventPaste(e) {
  //   this.onPaste({});
  // }

  /**
   * Updates the canvas based on the weave view.
   * @extends WeaveComponent
   * @param {Event} e - view change event from design component.
   * @returns {void}
   */
  public viewChange(value: any) {
    
    this.render.setCurrentView(value);

    if(this.render.isYarnBasedView()) this.draft.computeYarnPaths();

    this.palette.redraw({
      drawdown: true
    });
  }

  /**
   * Change the name of the brush to reflect selected brush.
   * @extends WeaveComponent
   * @param {Event} e - brush change event from design component.
   * @returns {void}
   */
  public onDesignModeChange(e:any) {

    this.design_mode = {
      name: e.name,
      id: e.id
    }

    console.log("design mode", this.design_mode.name, this.design_mode.id);
    //this.palette.unsetSelection();

  }

  
  /**
   * Creates the copied pattern within the weave reference
   * @extends WeaveComponent
   * @param {Event} e - copy event from design component.
   * @returns {void}
   */
  public onCopy() {

    console.log("on copy", this.copy);

    this.design_mode = {
      name: 'copy',
      id: -1
    };
  }

  /**
   *
   *
   */
  public onSave(e: any) {

    e.bitmap = this.bitmap.map(element => (element.isUp() && element.isSet()));
    console.log(e);

    if (e.type === "bmp") this.palette.saveBMP(e.name, e);
    else if (e.type === "ada") this.palette.saveADA(e.name, e);
    else if (e.type === "wif") this.palette.saveWIF(e.name, e);
    else if (e.type === "jpg") this.palette.savePrintableDraft(e.name, e);
    
  }

  /**
   * Open the connection modal.
   * @extends WeaveComponent
   * @returns {void}
   */
  public openConnectionDialog() {

    const dialogRef = this.dialog.open(ConnectionModal, {data: {shuttles: this.draft.shuttles}});

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.draft.connections.push(result);
      }
    });
  }


  /**
   * Open the label modal.
   * @extends WeaveComponent
   * @returns {void}
   */
  public openLabelDialog() {

    const dialogRef = this.dialog.open(LabelModal);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(result);
      }
    });
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
   * Inserts an empty row on system, system
   */
  public shuttleColorChange() {
    this.palette.redraw({drawdown: true, warp_materials:true,  weft_materials:true});
    this.timeline.addHistoryState(this.draft);
  }

  /**
   * Inserts an empty row on system, system
   */
  public insertRow(si) {

    this.draft.insertSingleRow(si);
    //this.draft.updateConnections(i, 1);
    
    this.palette.redraw({drawdown: true, loom:true, weft_systems: true, weft_materials:true});
    this.timeline.addHistoryState(this.draft);

  }

  public cloneRow(si) {
    this.draft.cloneRow(si, null, null, null);
   // this.draft.updateConnections(i, 1);

    this.palette.redraw({drawdown: true, loom:true, weft_systems: true, weft_materials:true});
    this.timeline.addHistoryState(this.draft);

  }

  public deleteRow(si) {
    this.draft.deleteSingleRow(si);
   // this.draft.updateConnections(i, -1);
    this.palette.redraw({drawdown: true, loom:true, weft_systems: true, weft_materials:true});
    this.timeline.addHistoryState(this.draft);
  }

    /**
   * In
   * @extends WeaveComponent
   * @returns {void}
   */
  public insertCol(i, shuttle,system) {
    this.draft.insertCol(i, shuttle,system);
    this.palette.redraw({drawdown: true, loom:true, warp_systems: true, warp_materials:true});
    this.draft.computeYarnPaths();
    this.timeline.addHistoryState(this.draft);

  }

  public cloneCol(i, shuttle,system) {
    this.draft.cloneCol(i, shuttle,system);
    this.palette.redraw({drawdown: true, loom:true, warp_systems: true, warp_materials:true});
    this.draft.computeYarnPaths();
    this.timeline.addHistoryState(this.draft);

  }


  public deleteCol(i) {
    this.draft.deleteCol(i);
    //this.draft.updateConnections(i, -1);
    this.palette.redraw({drawdown: true, loom:true, warp_systems: true, warp_materials:true});
    this.draft.computeYarnPaths();
    this.timeline.addHistoryState(this.draft);


  }

  public updatePatterns(e: any) {
    // this.patterns = e.patterns;
    // this.draft.patterns = this.patterns;
    this.draft.patterns = e.patterns;

  }

  public updateWarpSystems(pattern: Array<number>) {
    this.draft.updateWarpSystemsFromPattern(pattern);
    this.palette.redraw({drawdown: true, warp_systems: true});

  }

  public updateWeftSystems(pattern: Array<number>) {

    this.draft.updateWeftSystemsFromPattern(pattern);
    this.palette.redraw({drawdown: true, weft_systems: true});

  }

  public updateWarpShuttles(pattern: Array<number>) {

    this.draft.updateWarpShuttlesFromPattern(pattern);
    this.palette.redraw({drawdown: true, warp_materials: true});

  }

  public updateWeftShuttles(pattern: Array<number>) {

    this.draft.updateWeftShuttlesFromPattern(pattern);
    this.draft.computeYarnPaths();
    this.palette.redraw({drawdown: true, weft_materials: true});

  }

  // public createMaterial(e: any) {
  //   this.draft.addMaterial(e.material); 
  //   this.palette.redraw();
  // }

  public createShuttle(e: any) {
    this.draft.addShuttle(e.shuttle); 
  }

  public createWarpSystem(e: any) {
    this.draft.addWarpSystem(e.system);
  }

  public createWeftSystem(e: any) {
    this.draft.addWarpSystem(e.system);
  }

  public hideWarpSystem(e:any) {
    
    this.palette.redraw({drawdown: true, loom:true, warp_systems: true, warp_materials:true});
  }

  public showWarpSystem(e:any) {

    this.palette.redraw({drawdown: true, loom:true, warp_systems: true, warp_materials:true});
  }  

  public hideWeftSystem(e:any) {
   
    this.draft.updateVisible();
    this.palette.redraw({drawdown: true, loom:true, weft_systems: true, weft_materials:true});
  }

  public showWeftSystem(e:any) {

    this.draft.updateVisible();
    this.palette.redraw({drawdown: true, loom:true, weft_systems: true, weft_materials:true});
  }


  public notesChanged(e:any) {

    console.log(e);
   this.draft.notes = e;
  }

  // public hideShuttle(e:any) {
  //   this.draft.updateVisible();
  //   this.palette.redraw();
  //   this.palette.redrawLoom();
  // }

  // public showShuttle(e:any) {
  //   this.draft.updateVisible();
  //   this.palette.redraw();
  //   this.palette.redrawLoom();
  // }

  public epiChange(e:any){
    this.draft.epi = e.epi;
    this.draft.recomputeWidth();
  }

  public unitChange(e:any){
    this.draft.units = e.units;
    this.draft.recomputeWidth();    

  }

  public thicknessChange(e:any){

    if(this.render.isYarnBasedView()) this.palette.redraw({drawdown: true});
  }


  public loomChange(e:any){
    
    this.draft.loom.type = e.loomtype;

    if(this.draft.loom.type == 'jacquard'){
      this.render.view_frames = false;
    }else{
      this.render.view_frames = true;
      this.palette.recomputeLoom();
    }
    
    this.palette.redraw({loom: true});

  }

  public frameChange(e:any){
    this.draft.loom.setMinFrames(e.value);
    this.palette.redraw({loom: true});
  }

  public treadleChange(e:any){
    this.draft.loom.setMinTreadles(e.value);
    this.palette.redraw({loom: true});
  }


  public warpNumChange(e:any) {
    if(e.warps == "") return;

    if(e.warps > this.draft.warps){
      var diff = e.warps - this.draft.warps;
      
      for(var i = 0; i < diff; i++){  
         this.draft.insertCol(i, 0,0);
      }
    }else{
      var diff = this.draft.warps - e.warps;
      for(var i = 0; i < diff; i++){  
        this.draft.deleteCol(this.draft.warps-1);
      }

    }

    this.draft.recomputeWidth();

    this.timeline.addHistoryState(this.draft);

    if(this.render.isYarnBasedView()) this.draft.computeYarnPaths();

    this.palette.redraw({drawdown: true, loom: true, warp_systems: true, warp_materials:true});

  }

  public weftNumChange(e:any) {

    if(e.wefts === "" || e.wefts =="null") return;

    if(e.wefts > this.draft.wefts){
      var diff = e.wefts - this.draft.wefts;
      this.draft.insertRows(diff);
     
    }else{
      var diff = this.draft.wefts - e.wefts;
      for(var i = 0; i < diff; i++){  
        this.draft.deleteRows(diff);
      }

    }


    this.timeline.addHistoryState(this.draft);

    if(this.render.isYarnBasedView()) this.draft.computeYarnPaths();

    this.palette.redraw({drawdown: true, loom: true, weft_systems: true, weft_materials:true});


  }

  public createPattern(e: any) {
    // e.pattern.id = this.patterns.length;
    // this.patterns.push(e.pattern);
    // this.draft.patterns = this.patterns;
    e.pattern.id = this.draft.patterns.length;
    this.draft.patterns.push(e.pattern);
  }


//should this just hide the pattern or fully remove it, could create problems with undo/redo
   public removePattern(e: any) {
    this.draft.patterns = this.draft.patterns.filter(pattern => pattern !== e.pattern);
  }


  public updateSelection(e:any){
    this.copy = e;
  }


  public toggleViewFrames(){

    this.render.toggleViewFrames();

    if(this.render.view_frames && this.draft.loom.type == "frame"){
      this.palette.recomputeLoom();
    }

    this.palette.redraw({loom:true});
   
  }

  public renderChange(e: any){
     
     if(e.source === "slider"){
        this.render.setZoom(e.value);
        this.palette.rescale();

     } 

     if(e.source === "in"){
        this.render.zoomIn();
        this.palette.rescale();

     } 

     if(e.source === "out"){
        this.render.zoomOut();
        this.palette.rescale();

     } 
     if(e.source === "front"){
        this.render.setFront(e.checked);
        this.palette.redraw({drawdown:true});
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


}
