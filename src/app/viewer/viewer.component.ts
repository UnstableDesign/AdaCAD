import { Component, Input, ViewChild, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CanvasList, Draft, DraftNode, RenderingFlags } from '../core/model/datatypes';
import { createDraft, getDraftAsImage, getDraftName, initDraft, warps, wefts } from '../core/model/drafts';
import { FilesystemService } from '../core/provider/filesystem.service';
import { MaterialsService } from '../core/provider/materials.service';
import { TreeService } from '../core/provider/tree.service';
import { SimulationComponent } from './simulation/simulation.component';
import { AuthService } from '../core/provider/auth.service';
import { ZoomService } from '../core/provider/zoom.service';
import { RenderService } from '../core/provider/render.service';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss']
})
export class ViewerComponent {
  @Output() onLoadBlankFile: any = new EventEmitter();
  @Output() onOpenEditor: any = new EventEmitter();
  @Output() onClearWorkspace: any = new EventEmitter();
  @Output() onOpenExamples: any = new EventEmitter();
  @Output() onOpenMaterials: any = new EventEmitter();
  @Output() onManageFiles: any = new EventEmitter();
  @Output() onViewerExpanded: any = new EventEmitter();
  @Output() onViewerCollapsed: any = new EventEmitter();
  @Output() onSave: any = new EventEmitter();

  @ViewChild(SimulationComponent) sim;

  id: number;
  draft_canvas: HTMLCanvasElement;
  draft_cx: any;
  pixel_ratio: number = 1;
  draft_name: string = '';
  vis_mode: string = 'color'; //sim, draft, structure, color
  view_expanded: boolean = false;

  warps: number = 0;
  wefts: number = 0;


  constructor(
    public auth: AuthService,
    public files: FilesystemService, 
    private ms: MaterialsService,
    private render: RenderService,
    private tree: TreeService,
    public zs: ZoomService){
    
  }




getVisVariables(){
  switch(this.vis_mode){
    case 'sim':
    case 'draft':
      return {use_colors: false, floats: false};
    case 'structure':
      return {use_colors: false, floats: true};
    case 'color':
      return {use_colors: true, floats: true};
  }
}



  loadBlankFile(){
    this.onLoadBlankFile.emit();
  }

  clearWorkspace(){
    this.onClearWorkspace.emit();
  }

  manageFiles(){
    this.onManageFiles.emit();
  }

  openExamples(){
    this.onOpenExamples.emit();

  }

  openMaterials(){
    this.onOpenMaterials.emit();

  }


  /**
   * redraws the current draft, usually following an update from the drawdown
   */
  redraw(id: number){
    this.id = id;
    let vars = this.getVisVariables();
    const draft = this.tree.getDraft(id);
    if(draft !== null){
    this.warps = warps(draft.drawdown);
    this.wefts = wefts(draft.drawdown);
    }else{
      this.warps = 0;
      this.wefts = 0;
    }
    if(this.vis_mode != 'sim') {
      this.drawDraft(id, vars. floats, vars.use_colors);        
      this.centerScrollbars();
  }
    else this.sim.loadNewDraft(this.id);
  }


  centerScrollbars(){
    let div = document.getElementById('static_draft_view');
    let rect = document.getElementById('viewer-scale-container').getBoundingClientRect();
    // div.scrollTop = div.scrollHeight/2;
    // div.scrollLeft = div.scrollWidth/2;
    div.scrollTo({
      top: rect.height/2,
      left: rect.width/2
    })
  }


  viewAsSimulation(){
    this.vis_mode = 'sim';
    this.sim.loadNewDraft(this.id);

  }

  viewAsDraft(){
    this.vis_mode = 'draft';
    let vars = this.getVisVariables();
    this.drawDraft(this.id, vars.floats, vars.use_colors);   
  }

  viewAsStructure(){
    this.vis_mode = 'structure';
    let vars = this.getVisVariables();

    this.drawDraft(this.id, vars.floats, vars.use_colors);   
  }

  viewAsColor(){
    this.vis_mode = 'color';
    let vars = this.getVisVariables();
    this.drawDraft(this.id, vars.floats, vars.use_colors);   
  }

  onExpand(){
    this.view_expanded = true;
    this.onViewerExpanded.emit();
    this.redraw(this.id);


  }

  onCollapse(){
    this.view_expanded = false;
    this.onViewerCollapsed.emit();
    this.redraw(this.id);

  }

  openEditor(){
    this.onOpenEditor.emit(this.id);
  }


  clearView(){
    this.draft_canvas = <HTMLCanvasElement> document.getElementById('viewer_canvas');
    if(this.draft_canvas == null) return;
    this.draft_cx = this.draft_canvas.getContext("2d");

    this.draft_name = 'no draft selected';
    this.draft_canvas.width = 0;
    this.draft_canvas.height = 0;
    this.draft_canvas.style.width = "0px";
    this.draft_canvas.style.height = "0px";
  }

  saveAs(format: string){
    this.onSave.emit(format);
  }

  //when expanded, someone can set the zoom from the main zoom bar
  //this is called, then, to rescale the view
  renderChange(){

    if(this.id == -1) return;
   const container =  document.getElementById('viewer-scale-container');
    container.style.transform = 'scale('+this.zs.getViewerZoom()+')';
   

    //resize the canvas
    this.draft_canvas = <HTMLCanvasElement> document.getElementById('viewer_canvas');
    const pr = this.render.getPixelRatio(this.draft_canvas)


    const draft:Draft = this.tree.getDraft(this.id);

    const base_dims = this.render.getBaseDimensions(draft, this.draft_canvas)
    const scaled_width = this.zs.getViewerZoom() * base_dims.width;
    const scaled_height = this.zs.getViewerZoom() * base_dims.height;

    // this.draft_canvas.width = scaled_width;
    // this.draft_canvas.height = scaled_height;
    // this.draft_canvas.style.width = scaled_width/pr+"px";
    // this.draft_canvas.style.height = scaled_height/pr+"px";

  }

  /**
   * draw whetever is stored in the draft object to the screen
   * @returns 
   */
  async drawDraft(id: number, floats: boolean, use_colors: boolean) : Promise<any> {

    if(id === -1){
      this.clearView();
      return Promise.resolve(false);
    }


    this.id = id;
    const draft:Draft = this.tree.getDraft(id);
    this.draft_name = getDraftName(draft);

    this.draft_canvas = <HTMLCanvasElement> document.getElementById('viewer_canvas');

    if(this.draft_canvas == null || this.draft_canvas == undefined) return Promise.resolve(false);



    let canvases: CanvasList = {
      id: this.id,
      drawdown: this.draft_canvas,
      threading: null,
      tieup: null, 
      treadling: null, 
      warp_systems: null,
      warp_mats: null,
      weft_systems: null,
      weft_mats: null
    };


    let flags: RenderingFlags = {
      u_drawdown: true, 
      u_threading: false,
      u_tieups: false,
      u_treadling: false,
      u_warp_mats: false,
      u_weft_mats: false,
      u_warp_sys: false,
      u_weft_sys: false,
      use_colors: (this.vis_mode == 'color'),
      use_floats: (this.vis_mode != 'draft'), 
      show_loom: false

    }

    return this.render.drawDraft(draft, null, null,  canvases, flags).then(el => {
      this.renderChange();
      return Promise.resolve(true);
    })

   
    
    }

  }




