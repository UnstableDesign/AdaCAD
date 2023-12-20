import { ScrollDispatcher } from '@angular/cdk/overlay';
import { Component, enableProdMode, EventEmitter, Optional, Output, ViewChild } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { NgForm } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipDefaultOptions, MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip';
import * as htmlToImage from 'html-to-image';
import { Subject } from 'rxjs';
import { BlankdraftModal } from '../core/modal/blankdraft/blankdraft.modal';
import { DesignMode, Loom, LoomSettings } from '../core/model/datatypes';
import { defaults } from '../core/model/defaults';
import { warps, wefts } from '../core/model/drafts';
import { copyLoom } from '../core/model/looms';
import { AuthService } from '../core/provider/auth.service';
import { DesignmodesService } from '../core/provider/designmodes.service';
import { FileService } from '../core/provider/file.service';
import { FilesystemService } from '../core/provider/filesystem.service';
import { ImageService } from '../core/provider/image.service';
import { MaterialsService } from '../core/provider/materials.service';
import { NotesService } from '../core/provider/notes.service';
import { OperationService } from '../core/provider/operation.service';
import { StateService } from '../core/provider/state.service';
import { SystemsService } from '../core/provider/systems.service';
import { TreeService } from '../core/provider/tree.service';
import { WorkspaceService } from '../core/provider/workspace.service';
import { DraftDetailComponent } from '../draftdetail/draftdetail.component';
import { RenderService } from '../draftdetail/provider/render.service';
import { PaletteComponent } from './palette/palette.component';
import { SubdraftComponent } from './palette/subdraft/subdraft.component';
import { MultiselectService } from './provider/multiselect.service';
import { ViewportService } from './provider/viewport.service';
import { ZoomService } from './provider/zoom.service';

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
  @ViewChild(DraftDetailComponent) details;
  @ViewChild('detail_drawer') detail_drawer;

  @Output() onDraftDetailOpen: any = new EventEmitter();


  epi: number = 10;
  units:string = 'cm';
  frames:number =  8;
  treadles:number = 10;
  loomtype:string = "jacquard";
  loomtypes:Array<DesignMode>  = [];
  density_units:Array<DesignMode> = [];
  warp_locked:boolean = false;
  origin_options: any = null;
  selected_origin: number = 0;
  show_viewer: boolean = false;
  show_details: boolean = false;
  loading: boolean = false;







 /**
   * The weave Timeline object.
   * @property {Timeline}
   */

  viewonly: boolean = false;

  manual_scroll: boolean = false;

  private unsubscribe$ = new Subject();

  collapsed:boolean = true;

  scrollingSubscription: any;

  selected_nodes_copy: any = null;



  /// ANGULAR FUNCTIONS
  /**
   * @constructor
   * ps - pattern service (variable name is initials). Subscribes to the patterns and used
   * to get and update stitches.
   * dialog - Anglar Material dialog module. Used to control the popup modals.
   */
  constructor(public dm: DesignmodesService, 
    private auth: AuthService,
    private ms: MaterialsService,
    private sys: SystemsService,
    private tree: TreeService,
    public scroll: ScrollDispatcher,
    private fs: FileService,
    public ws: WorkspaceService,
    public vp: ViewportService,
    private notes: NotesService,
    private ss: StateService,
    private dialog: MatDialog,
    private image: ImageService,
    private ops: OperationService,
    private zs: ZoomService,
    private files: FilesystemService,
    private render: RenderService,
    private multiselect: MultiselectService,
    @Optional() private fbauth: Auth
    ) {


      this.selected_origin = this.ws.selected_origin_option;

      this.origin_options = this.ws.getOriginOptions();
      this.epi = ws.epi;
      this.units = ws.units;
      this.frames = ws.min_frames;
      this.treadles = ws.min_treadles;
      this.loomtype = ws.type;
      this.loomtypes = dm.getOptionSet('loom_types');
     this.density_units = dm.getOptionSet('density_units');
    //this.dialog.open(MixerInitComponent, {width: '600px'});

    this.scrollingSubscription = this.scroll
          .scrolled()
          .subscribe((data: any) => {
            this.onWindowScroll(data);
    });
    
    this.vp.setAbsolute(defaults.mixer_canvas_width, defaults.mixer_canvas_height); //max size of canvas, evenly divisible by default cell size
   







  }


  private onWindowScroll(data: any) {
    if(!this.manual_scroll){
     this.palette.handleWindowScroll(data);
    // this.view_tool.updateViewPort(data);
    }else{
      this.manual_scroll = false;
    }
  }

 setScroll(delta: any) {
    this.palette.handleScroll(delta);
    this.manual_scroll = true;
   //this.view_tool.updateViewPort(data);
  }



  /**
   * this is called when the detail view is closed. It passes an object that has three values: 
   * id: the draft id
   * clone_id: the id for the cloned draft
   * is_dirty: a boolean to note if the draft was changed at all while in detail view. 
   * @param obj 
   */
  updatePaletteFromDetailView(obj: any){


    //the object was never copied
    if(obj.clone_id == -1){
      let comp = <SubdraftComponent>this.tree.getComponent(obj.id);
      comp.redrawExistingDraft();
      this.palette.updateDownstream(obj.id).then(el => {
      this.palette.addTimelineState();
      });
    //reperform all of the ops 
    }else{
      //this object was copied and we need to keep the copy

      if(obj.dirty){
        const parent = this.tree.getComponent(obj.clone_id);
        let el = document.getElementById('scale-'+parent.id);
        let width = 0;
        if(el !== null && el !== undefined) width = el.offsetWidth;
        this.palette.createSubDraftFromEditedDetail(obj.id).then(sd => {
          const new_topleft = {
            x: parent.topleft.x+((width+40)*this.zs.zoom/defaults.mixer_cell_size), 
            y: parent.topleft.y};
    
            sd.setPosition(new_topleft);
        });

       
      }else{
        //copy over any superficial changes 
        this.tree.setLoomSettings(obj.clone_id, this.tree.getLoomSettings(obj.id))
        this.tree.setLoom(obj.clone_id, copyLoom(this.tree.getLoom(obj.id)))
        this.tree.removeSubdraftNode(obj.id);
      }
    }





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
    if(obj !== undefined && obj !== null) this.newDraftCreated(obj);
 });
}
 

zoomChange(e:any, source: string){
  
  const old_zoom = this.zs.zoom;
  this.zs.setZoom(e.value)
  this.palette.rescale(old_zoom);

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
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


  onCopySelections(){
    const selections = this.multiselect.copySelections();
    this.selected_nodes_copy = selections;
  }


  togglePanMode(){
    if(this.dm.isSelected('pan', "design_modes")){
      this.dm.selectDesignMode('move', 'design_modes');
    }else{
      this.dm.selectDesignMode('pan', 'design_modes');
    }
    this.palette.designModeChanged();
    //this.show_viewer = true;

  }

  toggleSelectMode(){
    if(this.dm.isSelected('marquee', "design_modes")){
      this.dm.selectDesignMode('move','design_modes');

    }else{
      this.dm.selectDesignMode('marquee','design_modes');

    }

    this.palette.designModeChanged();
  }

  


    operationAdded(name:string){
      this.palette.addOperation(name);
    }


    printMixer(){
      console.log("PRINT MIXER", "get bounding box of the elements and print")
      var node = document.getElementById('scrollable-container');
        htmlToImage.toPng(node, {width: 16380/2, height: 16380/2})
        .then(function (dataUrl) {
  
          // var win = window.open('about:blank', "_new");
          // win.document.open();
          // win.document.write([
          //     '<html>',
          //     '   <head>',
          //     '   </head>',
          //     '   <body onload="window.print()" onafterprint="window.close()">',
          //     '       <img src="' + dataUrl + '"/>',
          //     '   </body>',
          //     '</html>'
          // ].join(''));
          // win.document.close();
  
          const link = document.createElement('a')
          link.href= dataUrl;
          link.download = "mixer.jpg"
          link.click();
  
      
     
  
        })
        .catch(function (error) {
          console.error('oops, something went wrong!', error);
        });
      
    }

  /**
   * this is called when a user pushes save from the topbar
   * @param event 
   */
  public async onSave(e: any) : Promise<any>{

    const link = document.createElement('a')


    switch(e.type){
      case 'jpg': 

      this.printMixer();

      break;

      case 'wif': 
         this.palette.downloadVisibleDraftsAsWif();
         return Promise.resolve(null);
      break;

      case 'ada': 
      this.fs.saver.ada(
        'mixer', 
        false,
        this.zs.zoom).then(out => {
          link.href = "data:application/json;charset=UTF-8," + encodeURIComponent(out.json);
          link.download =  this.files.current_file_name + ".ada";
          link.click();
        })
      break;

      case 'bmp':
        this.palette.downloadVisibleDraftsAsBmp();
        return Promise.resolve(null);
      break;
    }
  }

  /**
   * Updates the canvas based on the weave view.
   */
  public renderChange(old_zoom: number) {
    this.palette.rescale(old_zoom);
  }


  /**
   * Updates the canvas based on the weave view.
   */
   public zoomChangeExternal(event: any) {
    this.palette.rescale(event.old_zoom);
  }




  public notesChanged(e:any) {
    console.log(e);
    //this.draft.notes = e;
  }

 


  public toggleCollapsed(){
    this.collapsed = !this.collapsed;
  }

  public createNote(){
    this.palette.createNote(null);
  }
  /**
   * called when the user adds a new draft from the sidebar
   * @param obj 
   */
  public newDraftCreated(obj: any){
    const id = this.tree.createNode("draft", null, null);
    this.tree.loadDraftData({prev_id: null, cur_id: id,}, obj.draft, obj.loom, obj.loom_settings, true);
    this.palette.loadSubDraft(id, obj.draft, null, null, this.zs.zoom);
    //id: number, d: Draft, nodep: NodeComponentProxy, draftp: DraftNodeProxy,  saved_scale: number
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
originChange(e:any){


  this.selected_origin = e.value;
  this.palette.redrawAllSubdrafts(); //force a redraw so that the weft/warp system info is up to date

}




epiChange(f: NgForm) {


  if(!f.value.epi){
    f.value.epi = 1;
    this.epi = f.value.epi;
  } 
  
  //this.loom.overloadEpi(f.value.epi);
  this.ws.epi = f.value.epi;



}



/**
 * when a user selects a new loom type, the software will pull all subdrafts and update their loom information 
 * @param e 
 * @returns 
 */
loomChange(e:any){

   this.ws.type = e.value.loomtype;
  if(this.ws.type === 'jacquard') this.dm.selectDesignMode('drawdown', 'drawdown_editing_style')
  else this.dm.selectDesignMode('loom', 'drawdown_editing_style') 
  

  // const dn: Array<DraftNode> = this.tree.getDraftNodes();
  // dn.forEach(node => {
  //   node.loom_settings.type = e.value.loomtype; 
  // })


}

  unitChange(e:any){
    
      this.ws.units = e.value.units;


  }

  showDraftDetails(id: number){
    this.dm.selectDesignMode('toggle','draw_modes')
    this.onDraftDetailOpen.emit(id);
  }



}