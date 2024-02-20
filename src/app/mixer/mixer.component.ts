import { Component, enableProdMode, EventEmitter, HostListener, Input, Optional, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { FormControl, NgForm, UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipDefaultOptions, MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip';
import { BlankdraftModal } from '../core/modal/blankdraft/blankdraft.modal';
import { DesignMode, Draft, DraftNodeProxy, Loom, LoomSettings, NodeComponentProxy, Operation, Point } from '../core/model/datatypes';
import { defaults, loom_types } from '../core/model/defaults';
import { warps, wefts } from '../core/model/drafts';
import { DesignmodesService } from '../core/provider/designmodes.service';
import { FileService } from '../core/provider/file.service';
import { FilesystemService } from '../core/provider/filesystem.service';
import { NotesService } from '../core/provider/notes.service';
import { OperationDescriptionsService } from '../core/provider/operation-descriptions.service';
import { TreeService } from '../core/provider/tree.service';
import { WorkspaceService } from '../core/provider/workspace.service';
import { PaletteComponent } from './palette/palette.component';
import { MultiselectService } from './provider/multiselect.service';
import { ViewportService } from './provider/viewport.service';
import { ZoomService } from '../core/provider/zoom.service';
import { map, startWith } from 'rxjs/operators';
import { OperationService } from '../core/provider/operation.service';

//disables some angular checking mechanisms
enableProdMode();




/** Custom options the configure the tooltip's default show/hide delays. */
export const myCustomTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 1000,
  hideDelay: 1000,
  touchendHideDelay: 1000,
  position: 'right',
  disableTooltipInteractivity: true,

};


@Component({
  selector: 'app-mixer',
  templateUrl: './mixer.component.html',
  styleUrls: ['./mixer.component.scss'],
  providers: [{provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: myCustomTooltipDefaults}]

})
export class MixerComponent  {


  @ViewChild(PaletteComponent) palette;

  @Output() onDraftDetailOpen: any = new EventEmitter();
  @Output() refreshViewer: any = new EventEmitter();
  @Output() onFocusView: any = new EventEmitter();


  origin_options: any = null;
    
  loading: boolean = false;
  
  manual_scroll: boolean = false;
  
  scrollingSubscription: any;

  selected_nodes_copy: any = null;


  /** variables for operation search */

  classifications: any = [];
  
  op_tree: any = [];

  filteredOptions: any = [];
  
  myControl: FormControl;
  
  search_error: any; 



  /// ANGULAR FUNCTIONS
  /**
   * @constructor
   * ps - pattern service (variable name is initials). Subscribes to the patterns and used
   * to get and update stitches.
   * dialog - Anglar Material dialog module. Used to control the popup modals.
   */
  constructor(
    
    public dm: DesignmodesService, 
    private tree: TreeService,
    private fs: FileService,
    public ws: WorkspaceService,
    public vp: ViewportService,
    private notes: NotesService,
    private dialog: MatDialog,
    public ops: OperationService, 
    private op_desc: OperationDescriptionsService,
    public zs: ZoomService,
    private files: FilesystemService,
    private multiselect: MultiselectService,
    @Optional() private fbauth: Auth
    ) {

      this.myControl = new FormControl();

   
    this.classifications = this.op_desc.getOpClassifications();

    this.vp.setAbsolute(defaults.mixer_canvas_width, defaults.mixer_canvas_height); //max size of canvas, evenly divisible by default cell size

    this.op_tree = this.classifications.map(classification => {
      return {
        class_name: classification.category_name, 
        ops: classification.op_names
          .filter(op => this.op_desc.hasDisplayName(op))
          .map(op => {return {name: op, display_name:this.op_desc.getDisplayName(op)}})
      }
    });

    function alphabetical(a, b) {
      if (a.display_name < b.display_name) {
        return -1;
      }
      if (a.display_name > b.display_name) {
        return 1;
      }
      return 0;
    }

    this.op_tree.forEach(el => {
      el.ops.sort(alphabetical);
    })
  }

  ngOnInit(){
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }



  private _filter(value: string): any[] {
    const filterValue = value.toLowerCase();

    let tree =  this.op_tree.map(classification => {
      return {
        class_name: classification.class_name,
        ops: classification.ops
        .filter(option => option.display_name.toLowerCase().includes(filterValue))
      }
    });

    tree = tree.filter(classification => classification.ops.length > 0 );

    if(tree.length == 0){
      this.search_error = "no operations match this search"
    }else{  
      this.search_error = '';
    }

    return tree;



  }

 setScroll(delta: any) {
    this.palette.handleScroll(delta);
    this.manual_scroll = true;
   //this.view_tool.updateViewPort(data);
  }

inCat(op_name: string, cat_name: string) {;
  let parent = this.op_desc.getOpCategory(op_name);
  return parent == cat_name;

}


addOperation(name: string){

  let id = this.palette.addOperation(name);
  this.myControl.setValue('');
  const outputs = this.tree.getNonCxnOutputs(id);
  if(outputs.length > 0) this.onDraftDetailOpen.emit(outputs[0]);
  //focus this is the detail view
}

onRefreshViewer(){
  this.refreshViewer.emit();
}



  performAndUpdateDownstream(obj_id: number){
    this.palette.performAndUpdateDownstream(obj_id);
  }


  addOp(event: any){
    this.palette.addOperation(event)
  }


  zoomIn(){
    const old_zoom = this.zs.zoom;
    this.zs.zoomIn();
    this.renderChange(old_zoom);

  }


  zoomOut(){
    const old_zoom = this.zs.zoom;
    this.zs.zoomOut();
    this.renderChange(old_zoom);
    
}

createNewDraft(){

  const dialogRef = this.dialog.open(BlankdraftModal, {
  });

  dialogRef.afterClosed().subscribe(obj => {
    if(obj !== undefined && obj !== null) this.newDraftCreated(obj.draft, obj.loom, obj.loom_settings);
 });
}

focusUIView(){
  this.onFocusView.emit();
}
 

zoomChange(e:any, source: string){
  
  this.zs.setZoom(e.value)
  this.palette.rescale();

}


  changeDesignMode(mode){
    this.palette.changeDesignMode(mode);
  }


  /**
   * Called from import bitmaps to drafts features. The drafts have already been imported and sent to this function, 
   * which now needs to draw them to the workspace
   * @param drafts 
   */
  loadDrafts(drafts: any){

    const loom:Loom = {
      threading:[],
      tieup:[],
      treadling: []
    };

    const loom_settings:LoomSettings = {
      type:this.ws.type,
      epi: this.ws.epi,
      units: this.ws.units,
      frames: this.ws.min_frames,
      treadles: this.ws.min_treadles
      
    }

    let topleft = this.vp.getTopLeft();

    let max_h = 0;
    let cur_h = topleft.y + 20; //start offset from top
    let cur_w = topleft.x + 50;
    let zoom_factor = defaults.mixer_cell_size / this.zs.zoom;
    let x_margin = 20 / zoom_factor;
    let y_margin = 40 / zoom_factor;

    let view_width = this.vp.getWidth() * zoom_factor;

    drafts.forEach(draft => {
      
      
      const id = this.tree.createNode("draft", null, null);
      this.tree.loadDraftData({prev_id: null, cur_id: id,}, draft, loom, loom_settings, true);
      this.palette.loadSubDraft(id, draft, null, null, this.zs.zoom);

      //position the drafts so that they don't all overlap. 
       max_h = (wefts(draft.drawdown)*defaults.mixer_cell_size > max_h) ? wefts(draft.drawdown)*defaults.mixer_cell_size : max_h;
      
       let approx_w = warps(draft.drawdown);

       //300 because each draft is defined as having min-width of 300pm
       let w = (approx_w*defaults.mixer_cell_size > 300) ? approx_w *defaults.mixer_cell_size : 300 / zoom_factor;

       let dn = this.tree.getNode(id);
       dn.component.topleft = {x: cur_w, y: cur_h};
       
       cur_w += (w + x_margin);
       if(cur_w > view_width){
        cur_w = topleft.x + 50;
        cur_h += (max_h+y_margin);
        max_h = 0;
       }


    });

    this.palette.addTimelineState();

    
  }

  // onLoadExample(name: string){
  //   const analytics = getAnalytics();

  //   logEvent(analytics, 'onloadexample', {
  //     items: [{ uid: this.auth.uid, name: filename }]
  //   });

  //   this.http.get('assets/examples/'+filename+".ada", {observe: 'response'}).subscribe((res) => {

  //   this.fls.loader.ada(filename, -1, '', res.body)
  //       .then(res => {
  //         this.onLoadExample.emit(res);
  //         return;
  //       }
  //       )
  //       .catch(e => {
  //         console.log("CAUGHT ERROR IN FILE LOADER ");
  //       });
  //   }); 
  // }









  clear(){
    this.notes.clear();
  }

  clearView() : void {

    if(this.palette !== undefined) this.palette.clearComponents();
    this.vp.clear();

  }
  



  ngOnDestroy(): void {
    // this.unsubscribe$.next(0);
    // this.unsubscribe$.complete();
  }


  onCopySelections(){
    const selections = this.multiselect.copySelections();
    this.selected_nodes_copy = selections;
  }


  togglePanMode(){
    if(this.dm.isSelectedMixerEditingMode('pan')){
      this.dm.selectMixerEditingMode('move');
    }else{
      this.dm.selectMixerEditingMode('pan');
    }
    this.palette.designModeChanged();
    //this.show_viewer = true;

  }

  toggleSelectMode(){
    if(this.dm.isSelectedMixerEditingMode('marquee')){
      this.dm.selectMixerEditingMode('move');

    }else{
      this.dm.selectMixerEditingMode('marquee');

    }
    this.palette.designModeChanged();
  }

  


    operationAdded(name:string){
      this.palette.addOperation(name);
    }


    // printMixer(){
    //   console.log("PRINT MIXER", "get bounding box of the elements and print")
    //   var node = document.getElementById('scrollable-container');
    //     htmlToImage.toPng(node, {width: 16380/2, height: 16380/2})
    //     .then(function (dataUrl) {
  
    //       // var win = window.open('about:blank', "_new");
    //       // win.document.open();
    //       // win.document.write([
    //       //     '<html>',
    //       //     '   <head>',
    //       //     '   </head>',
    //       //     '   <body onload="window.print()" onafterprint="window.close()">',
    //       //     '       <img src="' + dataUrl + '"/>',
    //       //     '   </body>',
    //       //     '</html>'
    //       // ].join(''));
    //       // win.document.close();
  
    //       const link = document.createElement('a')
    //       link.href= dataUrl;
    //       link.download = "mixer.jpg"
    //       link.click();
  
      
     
  
    //     })
    //     .catch(function (error) {
    //       console.error('oops, something went wrong!', error);
    //     });
      
    // }

  

  /**
   * Updates the canvas based on the weave view.
   */
  public renderChange(old_zoom: number) {
    this.palette.rescale();
  }


  /**
   * Updates the canvas based on the weave view.
   */
   public zoomChangeExternal(event: any) {
    this.palette.rescale();
  }




  public notesChanged(e:any) {
    console.log(e);
  }



  public createNote(note){
    this.palette.createNote(note);
  }

  public createNewNote(){
    this.palette.createNote(null);
  }
  /**
   * called when the user adds a new draft from the sidebar OR when a new draft is created from the editor
   * @param obj 
   */
  public newDraftCreated(draft: Draft, loom: Loom, loom_settings: LoomSettings): number{
    const id = this.tree.createNode("draft", null, null);
    this.tree.loadDraftData({prev_id: null, cur_id: id,}, draft, loom, loom_settings, true);
    this.palette.loadSubDraft(id, draft, null, null, this.zs.zoom);
    return id;
  }

  public loadSubDraft(id: number, d: Draft, nodep: NodeComponentProxy, draftp: DraftNodeProxy,  saved_scale: number){
    this.palette.loadSubDraft(id, d, nodep, draftp, saved_scale);
  }

  loadOperation(id: number, name: string, params: Array<any>, inlets: Array<any>, topleft:Point, saved_scale: number){
    this.palette.loadOperation(id, name, params, inlets, topleft, saved_scale)
  }

  loadConnection(id: number){
    this.palette.loadConnection(id);
  }

  centerView(){
    this.palette.centerView();
  }






  /**
   * something in the materials library changed, check to see if
   * there is a modal showing materials open and update it if there is
   */
  public materialChange() {
    
    this.palette.redrawAllSubdrafts();


 }



/**
 * the drafts stored in adacad are ALWAYs oriented with 0,0 as the top left corner
 * any origin change is merely the rendering flipping the orientation. 
 * when the global settings change, the data itself does NOT need to change, only the rendering
 * @param e 
 */
originChange(value: number){

  this.palette.redrawAllSubdrafts(); //force a redraw so that the weft/warp system info is up to date

}





  showDraftDetails(id: number){

      this.onDraftDetailOpen.emit(id);
  
 
  }



}