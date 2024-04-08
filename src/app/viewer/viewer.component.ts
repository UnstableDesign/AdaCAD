import { Component, Input, ViewChild, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Draft, DraftNode } from '../core/model/datatypes';
import { createDraft, getDraftAsImage, initDraft, warps, wefts } from '../core/model/drafts';
import { FilesystemService } from '../core/provider/filesystem.service';
import { MaterialsService } from '../core/provider/materials.service';
import { TreeService } from '../core/provider/tree.service';
import { SimulationComponent } from './simulation/simulation.component';
import { AuthService } from '../core/provider/auth.service';
import { ZoomService } from '../core/provider/zoom.service';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss']
})
export class ViewerComponent {
  @Output() onLoadBlankFile: any = new EventEmitter();
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
  draft_cell_size: number = 40;
  vis_mode: string = 'color'; //sim, draft, structure, color
  view_expanded: boolean = false;

  warps: number = 0;
  wefts: number = 0;


  constructor(
    public auth: AuthService,
    public files: FilesystemService, 
    private ms: MaterialsService,
    private tree: TreeService,
    private zs: ZoomService){
    
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


  /**
   * the canvas object is limited in how many pixels it can render. 
   * Adjust the draft cell size based on the number of cells in the draft
   * @param draft 
   */
  calculateCellSize(draft: Draft): number{

    if(draft == null) return 8;

    let max_bound = Math.max(wefts(draft.drawdown), warps(draft.drawdown));
    if(max_bound*this.draft_cell_size < 4096){
      return Math.floor(this.draft_cell_size);
    }else if(max_bound < 4096){
      return  Math.floor(4096/max_bound);
    }else{
      this.draft_cell_size = 1;
      return 1;
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
    if(this.vis_mode != 'sim') this.drawDraft(id, vars. floats, vars.use_colors);        
    else this.sim.loadNewDraft(this.id);
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


  clearView(){
    this.draft_canvas = <HTMLCanvasElement> document.getElementById('viewer_canvas');
    if(this.draft_canvas == null) return;
    this.draft_cx = this.draft_canvas.getContext("2d");


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
    this.draft_canvas = <HTMLCanvasElement> document.getElementById('viewer_canvas');
    if(this.draft_canvas == null) return;
    this.draft_canvas.style.transform = 'scale('+this.zs.getViewerZoom()+')'

  }

  /**
   * draw whetever is stored in the draft object to the screen
   * @returns 
   */
  async drawDraft(id: number, floats: boolean, use_colors: boolean) : Promise<any> {
    console.log("DRAW DRAFT ", id)

    if(id === -1){
      this.clearView();
      return Promise.resolve();
    }


    this.id = id;
    const draft:Draft = this.tree.getDraft(id);


    this.draft_canvas = <HTMLCanvasElement> document.getElementById('viewer_canvas');
    if(this.draft_canvas == null) return;

    this.draft_cx = this.draft_canvas.getContext("2d");

        // set the width and height
    let dpr = window.devicePixelRatio || 1;
    let bsr =  this.draft_cx.webkitBackingStorePixelRatio ||
    this.draft_cx.mozBackingStorePixelRatio ||
    this.draft_cx.msBackingStorePixelRatio ||
    this.draft_cx.oBackingStorePixelRatio ||
    this.draft_cx.backingStorePixelRatio || 1;
    this.pixel_ratio = dpr/bsr;

    let cell_size = this.calculateCellSize(draft);
    console.log("CELL SIZE ", cell_size)

    if(this.draft_canvas === undefined) return;
    this.draft_cx = this.draft_canvas.getContext("2d");

   
    if(draft === null){
      this.draft_canvas.width = 0;
      this.draft_canvas.height = 0;
    }else{

      this.draft_canvas.width = warps(draft.drawdown)*cell_size;
      this.draft_canvas.height = wefts(draft.drawdown)*cell_size;
      this.draft_canvas.style.width = (warps(draft.drawdown)*cell_size)+"px";
      this.draft_canvas.style.height = (wefts(draft.drawdown)*cell_size)+"px";
 
      let img = getDraftAsImage(draft, cell_size, floats, use_colors, this.ms.getShuttles());
      this.draft_cx.putImageData(img, 0, 0);
    
    }



    /* now recalc the scale based on the draft size: */
    let div_draftviewer = document.getElementById('static_draft_view');
    let rect_viewer = div_draftviewer.getBoundingClientRect();

    if(!this.view_expanded){
      let adj = 1;
      let canvas_width =  this.draft_canvas.width;
      let canvas_height = this.draft_canvas.height;


      //get the ration of the view to the item
      let width_adj = rect_viewer.width / canvas_width;
      let height_adj = rect_viewer.height / canvas_height;

      //make the zoom the smaller of the width or height
      adj = Math.min(width_adj, height_adj);

      if(adj < 1) this.draft_canvas.style.transform = 'scale('+adj+')';
      else  this.draft_canvas.style.transform = 'scale(1)';
    }else{
      this.draft_canvas.style.transform = 'scale(1)'
    }
  }



}
